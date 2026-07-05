import { useState } from 'react';
import { Calendar, FileDown, Search, ArrowRight, Printer, CheckCircle, Ban, TrendingUp, Filter, BarChart3 } from 'lucide-react';
import { Santri, TagihanItem, Pembayaran, Biaya, AppSettings, getTerminology, User } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LaporanManagerProps {
  santriList: Santri[];
  pembayaranList: Pembayaran[];
  tagihanMap: Record<string, TagihanItem[]>;
  biayaList: Biaya[];
  appSettings?: AppSettings;
  currentUser?: User;
}

export function LaporanManager({ santriList, pembayaranList, tagihanMap, biayaList, appSettings, currentUser }: LaporanManagerProps) {
  // Report types
  const [reportType, setReportType] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'santri' | 'biaya'>('bulanan');
  
  // Custom filter values
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [selectedBiayaName, setSelectedBiayaName] = useState('');

  // Toast / Export simulation
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. FILTERING TRANSACTIONS BASED ON SELECTED REPORT TYPE
  const getFilteredPayments = (): Pembayaran[] => {
    const successPayments = pembayaranList.filter(p => p.status === 'Sukses');

    if (reportType === 'harian') {
      return successPayments.filter(p => p.tanggal.startsWith(selectedDate));
    }
    
    if (reportType === 'bulanan') {
      // YYYY-MM
      return successPayments.filter(p => p.tanggal.startsWith(selectedMonth));
    }

    if (reportType === 'tahunan') {
      return successPayments.filter(p => p.tanggal.startsWith(selectedYear));
    }

    if (reportType === 'mingguan') {
      // Filter for last 7 days from selected date
      const selectedTime = new Date(selectedDate).getTime();
      const sevenDaysAgo = selectedTime - 7 * 24 * 60 * 60 * 1000;
      return successPayments.filter(p => {
        const txTime = new Date(p.tanggal.split(' ')[0]).getTime();
        return txTime >= sevenDaysAgo && txTime <= selectedTime;
      });
    }

    if (reportType === 'santri') {
      if (!selectedSantriId) return [];
      return successPayments.filter(p => p.nomorPendaftaran === selectedSantriId);
    }

    if (reportType === 'biaya') {
      if (!selectedBiayaName) return [];
      // Filter payments that paid for this specific fee component
      return successPayments.filter(p => p.itemsDetail.some(it => it.jenisBiaya === selectedBiayaName));
    }

    return successPayments;
  };

  const activePayments = getFilteredPayments();

  // 2. FINANCIAL COMPUTATIONS FOR CURRENT FILTER
  const totalCollections = activePayments.reduce((acc, p) => acc + p.nominal, 0);

  // Group by payment methods
  const methodTotals = activePayments.reduce((acc, p) => {
    acc[p.metodePembayaran] = (acc[p.metodePembayaran] || 0) + p.nominal;
    return acc;
  }, {} as Record<string, number>);

  // Component allocation totals for the active list
  const activeAllocations = activePayments.reduce((acc, p) => {
    p.itemsDetail.forEach(item => {
      // If reportType is 'biaya', only focus on selected fee if specified
      if (reportType === 'biaya' && selectedBiayaName && item.jenisBiaya !== selectedBiayaName) {
        return;
      }
      acc[item.jenisBiaya] = (acc[item.jenisBiaya] || 0) + item.nominal;
    });
    return acc;
  }, {} as Record<string, number>);

  // 3. EXPORT REAL CSV FILE UTILITY
  const handleExportCSV = () => {
    if (activePayments.length === 0) {
      showToast('⚠️ Gagal Ekspor: Tidak ada baris data transaksi untuk diekspor.');
      return;
    }

    // Build header columns
    let csvContent = 'No Kwitansi,Tanggal,Nomor Reg,Nama Santri,Metode,Penerima,Alokasi Rincian,Total Nominal\r\n';
    
    activePayments.forEach(p => {
      const itemsStr = p.itemsDetail.map(it => `${it.jenisBiaya}:${it.nominal}`).join(' | ');
      csvContent += `"${p.nomorTransaksi}","${p.tanggal}","${p.nomorPendaftaran}","${p.namaSantri}","${p.metodePembayaran}","${p.bendahara}","${itemsStr}",${p.nominal}\r\n`;
    });

    // Create download trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Keuangan_PSB_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`🟢 Berhasil mengekspor ${activePayments.length} baris data ke Excel (CSV)!`);
  };

  const handlePrintPDF = () => {
    if (activePayments.length === 0) {
      showToast('⚠️ Gagal Cetak: Tidak ada baris data transaksi untuk dicetak.');
      return;
    }

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const termUpper = getTerminology(appSettings, { capitalize: true }).toUpperCase();
      const pondokName = appSettings?.pondokName || 'PONDOK PESANTREN WAHYU HIDAYATUL ISLAM';
      const pondokAddress = appSettings?.pondokAddress || 'Jl. Wahyu Hidayat No. 01, Pasuruan, Jawa Timur';

      // --- KOP SURAT (HERITAGE LETTERHEAD) ---
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // dark slate
      doc.text(pondokName.toUpperCase(), 14, 15);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(pondokAddress, 14, 20);

      // Horizontal separator line
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.5);
      doc.line(14, 23, 283, 23);

      // --- JUDUL LAPORAN ---
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`LAPORAN KEUANGAN PENERIMAAN ${termUpper} BARU`, 14, 31);

      let subTitleText = '';
      if (reportType === 'harian') {
        subTitleText = `Periode Harian: ${selectedDate}`;
      } else if (reportType === 'mingguan') {
        subTitleText = `Periode Mingguan: s/d ${selectedDate} (7 Hari Terakhir)`;
      } else if (reportType === 'bulanan') {
        subTitleText = `Periode Bulanan: ${selectedMonth}`;
      } else if (reportType === 'tahunan') {
        subTitleText = `Periode Tahunan: Tahun Ajaran ${selectedYear}`;
      } else if (reportType === 'santri') {
        const selectedSantri = santriList.find(s => s.nomorPendaftaran === selectedSantriId);
        subTitleText = `Personal ${getTerminology(appSettings, { capitalize: true })}: ${selectedSantriId} - ${selectedSantri?.nama || ''}`;
      } else if (reportType === 'biaya') {
        subTitleText = `Komponen Biaya: ${selectedBiayaName}`;
      }

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(subTitleText, 14, 36);

      // Timestamp of report generation
      const formattedPrintDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Dicetak pada: ${formattedPrintDate}`, 283, 36, { align: 'right' });

      // --- FINANCIAL SUMMARY BOX (BENTO STYLE) ---
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, 40, 269, 14, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text('RINGKASAN TOTAL PENERIMAAN:', 18, 49);

      doc.setFontSize(11);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text(`Rp ${totalCollections.toLocaleString('id-ID')}`, 78, 49);

      // Method break-down
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      const tunaiTotal = methodTotals['Tunai'] || 0;
      const tfTotal = methodTotals['Transfer'] || 0;
      const qrisTotal = methodTotals['QRIS'] || 0;
      const breakdownText = `Metode Rincian:  Tunai (Rp ${tunaiTotal.toLocaleString('id-ID')})  |  Transfer (Rp ${tfTotal.toLocaleString('id-ID')})  |  QRIS (Rp ${qrisTotal.toLocaleString('id-ID')})`;
      doc.text(breakdownText, 130, 49);

      // --- MAIN TRANSACTION TABLE ---
      const tableBody = activePayments.map((p, index) => {
        const itemsStr = p.itemsDetail.map(it => `${it.jenisBiaya}: Rp ${it.nominal.toLocaleString('id-ID')}`).join(', ');
        return [
          p.nomorTransaksi,
          p.tanggal,
          p.nomorPendaftaran,
          p.namaSantri,
          itemsStr,
          p.metodePembayaran,
          `Rp ${p.nominal.toLocaleString('id-ID')}`,
          p.bendahara
        ];
      });

      autoTable(doc, {
        startY: 58,
        head: [['No. Transaksi', 'Tanggal', 'No. Registrasi', `Nama ${getTerminology(appSettings, { capitalize: true })}`, 'Alokasi Rincian Komponen', 'Metode', 'Total Nominal', 'Penerima']],
        body: tableBody,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42], // Slate-900 header
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [51, 65, 85]
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 80 },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
          7: { cellWidth: 25 }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Footer Page numbering
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`Halaman ${doc.getNumberOfPages()}`, 283, 203, { align: 'right' });
        }
      });

      // --- SIGNATURE SECTION ---
      let finalY = (doc as any).lastAutoTable.finalY + 12;
      
      // If signature fits on the same page, keep it, otherwise add new page
      if (finalY > 175) {
        doc.addPage();
        finalY = 25;
      }

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      // Left sign
      doc.text('Mengetahui,', 30, finalY);
      doc.text('Kepala Lembaga', 30, finalY + 4);
      doc.text('( ___________________________ )', 30, finalY + 22);

      // Right sign
      const localDayStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Pasuruan, ${localDayStr}`, 215, finalY);
      doc.text('Bendahara Penerima', 215, finalY + 4);
      doc.text(`( ${currentUser?.name || '___________________________'} )`, 215, finalY + 22);

      // Save PDF trigger
      doc.save(`LAPORAN_KEUANGAN_${reportType.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast(`🟢 Berhasil mencetak Laporan ${reportType} ke PDF!`);
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Gagal mencetak PDF: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert popup */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white border border-slate-800 p-4 rounded-xl shadow-xl z-50 animate-bounce text-xs flex items-center gap-2 font-semibold">
          <CheckCircle size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Laporan & Analisis Keuangan</h1>
          <p className="text-xs text-slate-500">Menganalisis pendapatan, mencetak laporan pertanggungjawaban, dan export pembukuan loket</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileDown size={14} />
            Ekspor Excel (CSV)
          </button>
          <button
            onClick={handlePrintPDF}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer size={14} />
            Cetak Laporan (PDF)
          </button>
        </div>
      </div>

      {/* Navigation tabs for Laporan types */}
      <div className="bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs flex flex-wrap gap-1">
        {(['harian', 'mingguan', 'bulanan', 'tahunan', 'santri', 'biaya'] as const).map((type) => (
          <button
            key={type}
            id={`btn-report-type-${type}`}
            onClick={() => setReportType(type)}
            className={`px-4 py-2 rounded-lg text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
              reportType === type
                ? 'bg-slate-900 text-white shadow-md font-black ring-1 ring-slate-950'
                : 'text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {type === 'harian' && 'Harian'}
            {type === 'mingguan' && 'Mingguan'}
            {type === 'bulanan' && 'Bulanan'}
            {type === 'tahunan' && 'Tahunan'}
            {type === 'santri' && `Per ${getTerminology(appSettings, { capitalize: true })}`}
            {type === 'biaya' && 'Per Biaya'}
          </button>
        ))}
      </div>

      {/* Contextual Filters drawer based on Selected Tab */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          <Filter size={14} className="text-slate-400" />
          <span>Atur Parameter Laporan</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Harian / Mingguan Date */}
          {(reportType === 'harian' || reportType === 'mingguan') && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Tanggal Acuan *</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden bg-white w-full font-mono font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {reportType === 'mingguan' ? 'Sistem akan menghitung mundur 7 hari dari tanggal terpilih.' : 'Sistem menyaring transaksi tanggal ini.'}
              </p>
            </div>
          )}

          {/* Bulanan Select */}
          {reportType === 'bulanan' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Periode Bulan *</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden bg-white w-full font-mono font-semibold text-slate-700"
              />
            </div>
          )}

          {/* Tahunan Select */}
          {reportType === 'tahunan' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Tahun Ajaran *</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden bg-white w-full font-semibold text-slate-700"
              >
                <option value="2026">Tahun Buku 2026</option>
                <option value="2027">Tahun Buku 2027</option>
              </select>
            </div>
          )}

          {/* Per Santri Select */}
          {reportType === 'santri' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Nama {getTerminology(appSettings, { capitalize: true })} *</label>
              <select
                value={selectedSantriId}
                onChange={(e) => setSelectedSantriId(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden bg-white w-full font-medium"
              >
                <option value="">-- Pilih {getTerminology(appSettings, { capitalize: true })} --</option>
                {santriList.map(s => (
                  <option key={s.nomorPendaftaran} value={s.nomorPendaftaran}>
                    {s.nomorPendaftaran} - {s.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Per Jenis Biaya Select */}
          {reportType === 'biaya' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Komponen Biaya *</label>
              <select
                value={selectedBiayaName}
                onChange={(e) => setSelectedBiayaName(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden bg-white w-full font-medium"
              >
                <option value="">-- Pilih Jenis Biaya --</option>
                {biayaList.map(b => (
                  <option key={b.id} value={b.jenisBiaya}>
                    {b.jenisBiaya} (Rp {b.nominal.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Aggregate Report Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Collections Box */}
        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dana Diterima</p>
          <p className="text-2xl font-bold text-emerald-600 font-mono">
            Rp {totalCollections.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400">
            Terakumulasi dari <strong className="text-slate-700">{activePayments.length}</strong> transaksi sukses dalam periode saringan
          </p>
        </div>

        {/* Payment Methods breakdown */}
        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rincian Per Metode Loket</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Tunai:</span>
              <span className="font-mono font-bold text-slate-800">Rp {(methodTotals['Tunai'] || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Transfer Bank:</span>
              <span className="font-mono font-bold text-slate-800">Rp {(methodTotals['Transfer'] || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">QRIS Digital:</span>
              <span className="font-mono font-bold text-slate-800">Rp {(methodTotals['QRIS'] || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Period Details text */}
        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metrik Cakupan Laporan</span>
            <p className="text-xs text-slate-700 font-semibold mt-1">
              {reportType === 'harian' && `Satu Hari Penuh: Tanggal ${selectedDate}`}
              {reportType === 'mingguan' && `Rentang Satu Minggu s/d ${selectedDate}`}
              {reportType === 'bulanan' && `Bulan Buku: Periode ${selectedMonth}`}
              {reportType === 'tahunan' && `Tahun Ajaran Aktif: ${selectedYear}`}
              {reportType === 'santri' && `Laporan Keuangan Personal ${getTerminology(appSettings, { capitalize: true })}`}
              {reportType === 'biaya' && `Rincian Pencapaian Komponen Pos`}
            </p>
          </div>

          <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
            Dibuat secara otomatis oleh sistem pembukuan digital Pondok Pesantren Wahyu Hidayatul Islam.
          </div>
        </div>
      </div>

      {/* Breakdown Allocations list - Visual Progress bar style */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <BarChart3 size={16} className="text-slate-400" />
            Alokasi Penyerapan Dana Masuk PSB
          </h3>
          <p className="text-xs text-slate-500">Penyaluran nominal pendaftaran berdasarkan pos biaya</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(activeAllocations).length > 0 ? (
            Object.entries(activeAllocations).map(([name, sum]) => {
              // Calculate percent of total
              const percent = totalCollections > 0 ? (sum / totalCollections) * 100 : 0;
              return (
                <div key={name} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700">{name}</span>
                    <span className="font-mono text-slate-900 font-bold">
                      Rp {sum.toLocaleString('id-ID')} ({percent.toFixed(1)}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 py-4 col-span-2 text-center">Belum ada alokasi penyerapan dana pada filter ini.</p>
          )}
        </div>
      </div>

      {/* Filtered Payments list table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rincian Baris Transaksi Terkait</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                <th className="py-2.5 px-4">No. Transaksi</th>
                <th className="py-2.5 px-4">Tanggal & Waktu</th>
                <th className="py-2.5 px-4">{getTerminology(appSettings, { capitalize: true })}</th>
                <th className="py-2.5 px-4">Alokasi Rincian</th>
                <th className="py-2.5 px-4 text-right">Nominal</th>
                <th className="py-2.5 px-4 text-center">Metode</th>
                <th className="py-2.5 px-4">Penerima Bendahara</th>
              </tr>
            </thead>
            <tbody>
              {activePayments.length > 0 ? (
                activePayments.map((p) => (
                  <tr key={p.nomorTransaksi} className="border-b border-slate-100 text-xs hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.nomorTransaksi}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{p.tanggal}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{p.namaSantri}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.nomorPendaftaran}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {p.itemsDetail.map((it, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[9px] font-medium leading-none">
                            {it.jenisBiaya} (Rp{it.nominal / 1000}k)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">Rp {p.nominal.toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">{p.metodePembayaran}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{p.bendahara}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada transaksi dalam filter laporan keuangan saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
