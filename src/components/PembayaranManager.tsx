import React, { useState, useEffect } from 'react';
import { Search, CreditCard, Receipt, FileCheck2, CalendarCheck, Ban, ArrowRight, Eye, RefreshCw, AlertTriangle, BookOpen, X, Printer } from 'lucide-react';
import { Santri, TagihanItem, Pembayaran, Role, AppSettings, getTerminology } from '../types';

interface PembayaranManagerProps {
  santriList: Santri[];
  pembayaranList: Pembayaran[];
  tagihanMap: Record<string, TagihanItem[]>;
  activeRole: Role;
  onAddPembayaran: (
    nomorPendaftaran: string,
    payments: { id: string; nominalPay: number }[],
    metodePembayaran: 'Tunai' | 'Transfer' | 'QRIS',
    catatan: string
  ) => { success: boolean; error?: string; nomorTransaksi?: string };
  onCancelPembayaran: (nomorTransaksi: string, alasan: string) => { success: boolean; error?: string };
  onPrintKwitansi: (pembayaran: Pembayaran) => void;
  preSelectedSantriId?: string;
  onClearPreSelected?: () => void;
  appSettings?: AppSettings;
}

export function PembayaranManager({
  santriList,
  pembayaranList,
  tagihanMap,
  activeRole,
  onAddPembayaran,
  onCancelPembayaran,
  onPrintKwitansi,
  preSelectedSantriId,
  onClearPreSelected,
  appSettings
}: PembayaranManagerProps) {
  const canModify = activeRole === 'Master' || activeRole === 'Admin Putri' || activeRole === 'Admin Putra';
  const santriTerm = getTerminology(appSettings, { capitalize: true });
  const santriTermLower = getTerminology(appSettings, { capitalize: false });
  const canCancel = activeRole === 'Master' || activeRole === 'Admin Putri' || activeRole === 'Admin Putra'; // All staff can cancel payments

  // States
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [santriSearchTerm, setSantriSearchTerm] = useState('');
  const [isSantriDropdownOpen, setIsSantriDropdownOpen] = useState(false);
  const [activeSantri, setActiveSantri] = useState<Santri | null>(null);
  const [outstandingFees, setOutstandingFees] = useState<{ id: string; jenisBiaya: string; nominal: number; terbayar: number; payAmount: number; isSelected: boolean }[]>([]);

  const [metodePembayaran, setMetodePembayaran] = useState<'Tunai' | 'Transfer' | 'QRIS'>('Tunai');
  const [catatan, setCatatan] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [successTxId, setSuccessTxId] = useState<string | null>(null);

  // Cancellation States
  const [cancellingTxId, setCancellingTxId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  // History Search
  const [historySearch, setHistorySearch] = useState('');
  const [historyMethod, setHistoryMethod] = useState<string>('All');
  const [historyStatus, setHistoryStatus] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Pembayaran; direction: 'asc' | 'desc' }>({
    key: 'tanggal',
    direction: 'desc'
  });

  // Triggered when preSelectedSantriId changes (e.g. from Dashboard quick-pay click)
  useEffect(() => {
    if (preSelectedSantriId) {
      setSelectedSantriId(preSelectedSantriId);
    }
  }, [preSelectedSantriId]);

  // Handle active student changes
  useEffect(() => {
    if (!selectedSantriId) {
      setActiveSantri(null);
      setOutstandingFees([]);
      return;
    }

    const santri = santriList.find(s => s.nomorPendaftaran === selectedSantriId);
    if (santri) {
      setActiveSantri(santri);
      // Fetch their unpaid bill items
      const bills = tagihanMap[selectedSantriId] || [];
      const formatted = bills.map(b => ({
        id: b.id,
        jenisBiaya: b.jenisBiaya,
        nominal: b.nominal,
        terbayar: b.terbayar,
        payAmount: 0,
        isSelected: false,
      }));
      setOutstandingFees(formatted);
      setTransactionError('');
      setSuccessTxId(null);
    }
  }, [selectedSantriId, santriList, tagihanMap]);

  // Handle allocation checks
  const handleToggleFeeSelection = (idx: number) => {
    setOutstandingFees(prev => {
      const copy = [...prev];
      const item = copy[idx];
      const remaining = item.nominal - item.terbayar;
      copy[idx] = {
        ...item,
        isSelected: !item.isSelected,
        payAmount: !item.isSelected ? remaining : 0, // auto-fill remaining if checked
      };
      return copy;
    });
  };

  const handlePayAmountChange = (idx: number, amount: number) => {
    setOutstandingFees(prev => {
      const copy = [...prev];
      const item = copy[idx];
      copy[idx] = {
        ...item,
        payAmount: amount,
        isSelected: amount > 0,
      };
      return copy;
    });
  };

  // Submit payment form
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriId) {
      setTransactionError('Silakan pilih santri.');
      return;
    }

    const paymentsToProcess = outstandingFees
      .filter(f => f.isSelected && f.payAmount > 0)
      .map(f => ({ id: f.id, nominalPay: f.payAmount }));

    if (paymentsToProcess.length === 0) {
      setTransactionError('Pilih setidaknya satu jenis biaya dan masukkan jumlah bayar.');
      return;
    }

    // Call state controller
    const result = onAddPembayaran(selectedSantriId, paymentsToProcess, metodePembayaran, catatan);

    if (result.success && result.nomorTransaksi) {
      setSuccessTxId(result.nomorTransaksi);
      setCatatan('');
      // Refresh outstanding items
      setSelectedSantriId('');
      if (onClearPreSelected) onClearPreSelected();
    } else {
      setTransactionError(result.error || 'Terjadi kesalahan sistem.');
    }
  };

  // Submit cancel transaction form
  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingTxId) return;
    if (!cancelReason.trim()) {
      setCancelError('Alasan pembatalan wajib diisi.');
      return;
    }

    const result = onCancelPembayaran(cancellingTxId, cancelReason);
    if (result.success) {
      setCancellingTxId(null);
      setCancelReason('');
      setCancelError('');
    } else {
      setCancelError(result.error || 'Terjadi kesalahan sistem.');
    }
  };

  // Aggregate totals of active payment form
  const totalPaymentFormValue = outstandingFees
    .filter(f => f.isSelected)
    .reduce((acc, f) => acc + f.payAmount, 0);

  // Filter history
  const filteredHistory = pembayaranList.filter((p) => {
    const matchesSearch =
      p.namaSantri.toLowerCase().includes(historySearch.toLowerCase()) ||
      p.nomorPendaftaran.toLowerCase().includes(historySearch.toLowerCase()) ||
      p.nomorTransaksi.toLowerCase().includes(historySearch.toLowerCase()) ||
      p.bendahara.toLowerCase().includes(historySearch.toLowerCase());

    const matchesMethod = historyMethod === 'All' || p.metodePembayaran === historyMethod;
    const matchesStatus = historyStatus === 'All' || p.status === historyStatus;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const requestSort = (key: keyof Pembayaran) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const aVal = a[sortConfig.key] ?? '';
    const bVal = b[sortConfig.key] ?? '';
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Step 1: Select Student
  const filteredSantris = santriList
    .filter(s => s.status !== 'Lunas')
    .filter(s => 
      s.nama.toLowerCase().includes(santriSearchTerm.toLowerCase()) || 
      s.nomorPendaftaran.toLowerCase().includes(santriSearchTerm.toLowerCase())
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Penerimaan & Riwayat Pembayaran</h1>
        <p className="text-xs text-slate-500">Mencatat loket penerimaan cicilan, mengelola pembatalan kwitansi, dan cetak bukti fisik</p>
      </div>

      {/* Grid Layout: Left is Pay Form, Right is quick metrics or hints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Input Payment */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <CreditCard size={16} className="text-emerald-600" />
              Formulir Pembayaran Loket Admin
            </h3>
            {!canModify && (
              <span className="text-[10px] bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                <Ban size={10} /> Mode Baca Saja (Kepala)
              </span>
            )}
          </div>

          {successTxId && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3 text-xs">
                <div className="bg-emerald-500 text-white p-2 rounded-full">
                  <FileCheck2 size={18} />
                </div>
                <div>
                  <p className="font-bold">Transaksi Berhasil Dicatat!</p>
                  <p className="text-[11px] text-emerald-700">Nomor Kwitansi: <strong>{successTxId}</strong></p>
                </div>
              </div>

              <button
                id="btn-print-success-kwitansi"
                onClick={() => {
                  const tx = pembayaranList.find(p => p.nomorTransaksi === successTxId);
                  if (tx) onPrintKwitansi(tx);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all shrink-0"
              >
                <Receipt size={14} />
                Cetak Bukti Kwitansi (PDF)
              </button>
            </div>
          )}

          {canModify ? (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {transactionError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-1">
                  <AlertTriangle size={14} />
                  Error: {transactionError}
                </p>
              )}

              {/* Step 1: Select Student */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{`Cari ${santriTerm} *`}</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Ketik nama atau No. Reg ${santriTermLower}...`}
                      value={santriSearchTerm}
                      onChange={(e) => {
                        setSantriSearchTerm(e.target.value);
                        setIsSantriDropdownOpen(true);
                      }}
                      onFocus={() => setIsSantriDropdownOpen(true)}
                      className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-slate-50 font-medium"
                    />
                    {selectedSantriId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSantriId('');
                          setSantriSearchTerm('');
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Results */}
                  {isSantriDropdownOpen && (santriSearchTerm || filteredSantris.length > 0) && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {filteredSantris.length > 0 ? (
                        filteredSantris.map((s) => (
                          <button
                            key={s.nomorPendaftaran}
                            type="button"
                            onClick={() => {
                              setSelectedSantriId(s.nomorPendaftaran);
                              setSantriSearchTerm(s.nama);
                              setIsSantriDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex flex-col cursor-pointer"
                          >
                            <span className="text-xs font-bold text-slate-800">{s.nama}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{s.nomorPendaftaran} - {s.jenjang}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-center text-xs text-slate-400 italic">
                          Tidak ditemukan {santriTermLower} yang sesuai.
                        </div>
                      )}
                    </div>
                  )}
                  {/* Backdrop to close dropdown */}
                  {isSantriDropdownOpen && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSantriDropdownOpen(false)}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Metode Pembayaran *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Tunai', 'Transfer', 'QRIS'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setMetodePembayaran(method)}
                        className={`py-2 text-xs font-semibold border rounded-lg transition-all cursor-pointer ${
                          metodePembayaran === method
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2: Live Outstanding allocations */}
              {activeSantri && outstandingFees.length > 0 && (
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between font-bold text-slate-500">
                    <span>Komponen Biaya & Tunggakan</span>
                    <span className="font-mono">Sisa Tagihan</span>
                  </div>

                  <div className="divide-y divide-slate-100 bg-white">
                    {outstandingFees.map((fee, idx) => {
                      const remaining = fee.nominal - fee.terbayar;
                      const isLunas = remaining <= 0;

                      return (
                        <div key={fee.id} className={`p-3 flex items-center justify-between transition-colors ${
                          isLunas ? 'bg-slate-50/55 opacity-70' : 'hover:bg-slate-50/30'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={fee.isSelected}
                              disabled={isLunas}
                              onChange={() => handleToggleFeeSelection(idx)}
                              className="accent-emerald-700 w-4 h-4 rounded-sm border-slate-300 disabled:opacity-50"
                            />
                            <div>
                              <span className="font-semibold text-slate-700 block">{fee.jenisBiaya}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Total: Rp {fee.nominal.toLocaleString('id-ID')} | Terbayar: Rp {fee.terbayar.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span className="font-mono font-semibold text-slate-500">
                              Rp {remaining.toLocaleString('id-ID')}
                            </span>

                            {!isLunas && (
                              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden w-28 text-right">
                                <span className="text-[10px] text-slate-400 px-1.5 select-none font-semibold">Rp</span>
                                <input
                                  type="number"
                                  value={fee.payAmount || ''}
                                  max={remaining}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                                    handlePayAmountChange(idx, Math.min(val, remaining));
                                  }}
                                  className="w-full px-2 py-1 text-right text-xs bg-white font-mono font-bold focus:outline-hidden"
                                  placeholder="0"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Aggregate Forms total */}
                  <div className="bg-slate-100 p-3 flex justify-between items-center font-bold text-slate-700 border-t border-slate-200">
                    <span>Total Pembayaran Loket:</span>
                    <span className="font-mono text-emerald-700 text-sm">
                      Rp {totalPaymentFormValue.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {/* Step 3: Memo/Notes & Submit */}
              {activeSantri && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Catatan Tambahan (Opsional)</label>
                    <input
                      type="text"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder={`Contoh: Pembayaran pendaftaran cicilan ke-2 oleh ibu ${santriTermLower}`}
                      className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      Proses & Cetak Bukti Pembayaran
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-2">
              <Receipt size={36} className="mx-auto text-slate-400" />
              <p className="text-xs font-semibold text-slate-700">Akses Terbatas Form Penerimaan</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Hanya akun dengan peran <strong>Admin</strong> dan <strong>Super Admin</strong> yang diizinkan untuk mencatatkan pembayaran loket baru. Silakan beralih role untuk mencoba.
              </p>
            </div>
          )}
        </div>

        {/* Right Info: General instructions & validation details */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <BookOpen size={14} />
              Aturan & Validasi Sistem
            </h4>

            <div className="space-y-2.5 text-[11px] text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded text-[9px]">1</span>
                <span><strong>Anti-Overpayment:</strong> Sistem melarang keras input pembayaran yang melebihi sisa tagihan per pos biaya.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded text-[9px]">2</span>
                <span><strong>Kwitansi Otomatis:</strong> Nomor kwitansi di-generate berurutan (KWT-YYYY-XXXX) untuk menjamin akuntabilitas.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded text-[9px]">3</span>
                <span><strong>Log Jejak Audit:</strong> Setiap aktivitas penambahan/pembatalan pembayaran terekam detail beserta nama bendahara aktif.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded text-[9px]">4</span>
                <span><strong>Tidak Dapat Dihapus:</strong> Sesuai standar keuangan, transaksi dilarang dihapus, hanya dapat dibatalkan dengan mencantumkan alasan.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER PANEL: Riwayat Pembayaran (All users can see, but cancellation is gated to Admin) */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Riwayat Transaksi Kwitansi</h3>
              <p className="text-xs text-slate-500">Mencatat seluruh rekam jejak keuangan pembayaran {getTerminology(appSettings)} baru</p>
            </div>
          </div>

          {/* Search filters inside History */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Cari kwitansi, ${getTerminology(appSettings)}, bendahara...`}
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-slate-50"
              />
            </div>

            <div>
              <select
                value={historyMethod}
                onChange={(e) => setHistoryMethod(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-slate-50 font-semibold"
              >
                <option value="All">Semua Metode</option>
                <option value="Tunai">Tunai</option>
                <option value="Transfer">Transfer</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>

            <div>
              <select
                value={historyStatus}
                onChange={(e) => setHistoryStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full bg-slate-50 font-semibold"
              >
                <option value="All">Semua Status</option>
                <option value="Sukses">Sukses</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th 
                  className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => requestSort('nomorTransaksi')}
                >
                  <div className="flex items-center gap-1">
                    No. Transaksi
                    {sortConfig.key === 'nomorTransaksi' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => requestSort('tanggal')}
                >
                  <div className="flex items-center gap-1">
                    Tanggal & Waktu
                    {sortConfig.key === 'tanggal' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => requestSort('namaSantri')}
                >
                  <div className="flex items-center gap-1">
                    {santriTerm}
                    {sortConfig.key === 'namaSantri' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-4">Alokasi Biaya</th>
                <th 
                  className="py-2.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => requestSort('nominal')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Nominal
                    {sortConfig.key === 'nominal' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-4 text-center">Metode</th>
                <th className="py-2.5 px-4">Penerima</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.length > 0 ? (
                sortedHistory.map((p) => {
                  const isVoid = p.status === 'Dibatalkan';
                  return (
                    <tr
                      key={p.nomorTransaksi}
                      className={`border-b border-slate-100 text-xs transition-colors ${
                        isVoid ? 'bg-red-50/20 text-slate-400 line-through decoration-slate-300' : 'hover:bg-slate-50/25'
                      }`}
                    >
                      {/* Tx Code */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {p.nomorTransaksi}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                        {p.tanggal}
                      </td>

                      {/* Student */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{p.namaSantri}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.nomorPendaftaran}</div>
                      </td>

                      {/* Breakdown Allocations */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {p.itemsDetail.map((it, idx) => (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.2 rounded text-[9px] font-medium leading-none ${
                                isVoid
                                  ? 'bg-slate-100 text-slate-400'
                                  : 'bg-indigo-50 text-indigo-800'
                              }`}
                            >
                              {it.jenisBiaya} (Rp{it.nominal / 1000}k)
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Total Nominal */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        Rp {p.nominal.toLocaleString('id-ID')}
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.metodePembayaran === 'Tunai' ? 'bg-blue-50 text-blue-800' :
                          p.metodePembayaran === 'Transfer' ? 'bg-amber-50 text-amber-800' :
                          'bg-pink-50 text-pink-800'
                        }`}>
                          {p.metodePembayaran}
                        </span>
                      </td>

                      {/* Officer */}
                      <td className="py-3 px-4 font-medium text-slate-600 truncate max-w-36" title={p.bendahara}>
                        {p.bendahara}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isVoid ? (
                          <span
                            className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[9px] font-bold inline-block leading-none cursor-help"
                            title={`Dibatalkan oleh: ${p.dibatalkanOleh}\nTgl Batal: ${p.tanggalPembatalan}\nAlasan: ${p.alasanPembatalan}`}
                          >
                            BATAL
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[9px] font-bold inline-block leading-none">
                            SUKSES
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print Receipt Action */}
                          <button
                            id={`btn-view-${p.nomorTransaksi.toLowerCase()}`}
                            onClick={() => onPrintKwitansi(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                            title="Lihat Kwitansi"
                          >
                            <Eye size={14} />
                          </button>
                          
                          <button
                            id={`btn-print-${p.nomorTransaksi.toLowerCase()}`}
                            onClick={() => {
                              const url = `${window.location.origin}${window.location.pathname}?print=kwitansi&id=${p.nomorTransaksi}`;
                              window.open(url, '_blank');
                            }}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-all cursor-pointer"
                            title="Cetak Kwitansi Langsung"
                          >
                            <Printer size={14} />
                          </button>

                          {/* Cancel Payment Action (Only Admin, only if currently sukses) */}
                          {!isVoid && (
                            <button
                              id={`btn-cancel-${p.nomorTransaksi.toLowerCase()}`}
                              disabled={!canCancel}
                              onClick={() => {
                                setCancellingTxId(p.nomorTransaksi);
                                setCancelError('');
                                setCancelReason('');
                              }}
                              className={`p-1.5 rounded-md transition-all ${
                                canCancel
                                  ? 'text-slate-600 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                                  : 'text-slate-200 cursor-not-allowed'
                              }`}
                              title={canCancel ? 'Batalkan Transaksi (Void)' : 'Hanya Admin yang dapat membatalkan transaksi'}
                            >
                              <Ban size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Tidak ditemukan data riwayat kwitansi pembayaran.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL VOID TRANSACTION: REASON POPUP */}
      {cancellingTxId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="bg-red-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-400" />
                <h3 className="font-bold text-sm">Otorisasi Pembatalan Transaksi</h3>
              </div>
              <button onClick={() => setCancellingTxId(null)} className="text-slate-300 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-4 space-y-4">
              <div className="bg-red-50 p-3 rounded-lg text-xs text-red-800 space-y-1">
                <p className="font-bold">⚠️ Perhatian Konsekuensi Keuangan:</p>
                <p className="leading-relaxed">
                  Membatalkan kwitansi <strong>{cancellingTxId}</strong> akan otomatis **mengurangi nominal terbayar** pada tagihan santri bersangkutan. Log audit permanen akan mencatat pembatalan ini.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Alasan Pembatalan Transaksi *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: Terjadi duplikasi input loket / Salah input jenis alokasi seragam"
                  rows={3}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-500 w-full resize-none"
                  required
                />
              </div>

              {cancelError && <p className="text-[10px] text-red-600 font-semibold">{cancelError}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancellingTxId(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Ya, Batalkan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
