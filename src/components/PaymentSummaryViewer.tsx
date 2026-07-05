import React, { useEffect } from 'react';
import { Printer, X, BadgeCent, Clock } from 'lucide-react';
import { Santri, AppSettings, getTerminology, Pembayaran } from '../types';
import { calculateBillingSummary, printElementInNewTab } from '../utils';

interface PaymentSummaryViewerProps {
  santri: Santri;
  tagihanMap: Record<string, { id: string; jenisBiaya: string; nominal: number; terbayar: number }[]>;
  pembayaranList: Pembayaran[];
  appSettings: AppSettings;
  onClose: () => void;
  autoPrint?: boolean;
}

export function PaymentSummaryViewer({ 
  santri, 
  tagihanMap, 
  pembayaranList, 
  appSettings, 
  onClose,
  autoPrint = true
}: PaymentSummaryViewerProps) {
  
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const summary = calculateBillingSummary(santri.nomorPendaftaran, tagihanMap);

  const handlePrint = () => {
    const el = document.getElementById('payment-summary-print-area');
    if (el) {
      printElementInNewTab(el.innerHTML, `Rincian_Pembayaran_${santri.nomorPendaftaran}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto flex flex-col">
      {/* Top Bar - Hidden on print */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 no-print">
        <div className="flex items-center gap-2">
          <Printer size={18} className="text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-widest">Rincian Pembayaran</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <Printer size={14} />
            Cetak Rincian
          </button>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Printable Content */}
      <div id="payment-summary-print-area" className="flex-1 p-8 md:p-12 printable">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-6 border-b-2 border-slate-900 pb-8">
            <div className="w-20 h-20 bg-emerald-950 text-white rounded-2xl flex items-center justify-center font-black text-3xl shrink-0">
              {appSettings.logoUrl ? (
                <img src={appSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
              ) : (
                'WH'
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950 uppercase tracking-tight leading-tight">{appSettings.pondokName}</h1>
              <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest mt-1">Laporan Rincian Tagihan & Pembayaran Santri</p>
              <p className="text-[10px] text-slate-500 mt-1">{appSettings.pondokAddress}</p>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 block font-bold uppercase tracking-widest text-[9px] mb-1">Nama Lengkap</span>
                <span className="text-lg font-black text-slate-900">{santri.nama}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase tracking-widest text-[9px] mb-1">Nomor Registrasi</span>
                <span className="text-sm font-mono font-bold text-emerald-700">{santri.nomorPendaftaran}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 block font-bold uppercase tracking-widest text-[9px] mb-1">Jenjang / Gelombang</span>
                <span className="text-sm font-bold text-slate-800">{santri.jenjang} / {santri.gelombangPendaftaran}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase tracking-widest text-[9px] mb-1">Tanggal Cetak</span>
                <span className="text-sm font-bold text-slate-800">{new Date().toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Billing Table */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <BadgeCent size={16} className="text-emerald-600" />
              Status Tagihan Biaya Pendaftaran
            </h4>
            <div className="border-2 border-slate-900 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6 text-left">Deskripsi Biaya</th>
                    <th className="py-4 px-6 text-right">Nominal Tagihan</th>
                    <th className="py-4 px-6 text-right">Terbayar</th>
                    <th className="py-4 px-6 text-right">Sisa Piutang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summary.items.map((item) => {
                    const sisa = item.nominal - item.terbayar;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-800">{item.jenisBiaya}</td>
                        <td className="py-4 px-6 text-right font-mono">Rp {item.nominal.toLocaleString('id-ID')}</td>
                        <td className="py-4 px-6 text-right font-mono text-emerald-600 font-bold">Rp {item.terbayar.toLocaleString('id-ID')}</td>
                        <td className="py-4 px-6 text-right font-mono text-rose-600 font-black">Rp {sisa.toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-900">
                    <td className="py-4 px-6 uppercase tracking-widest">Total Akumulasi</td>
                    <td className="py-4 px-6 text-right font-mono">Rp {summary.total.toLocaleString('id-ID')}</td>
                    <td className="py-4 px-6 text-right font-mono text-emerald-700">Rp {summary.paid.toLocaleString('id-ID')}</td>
                    <td className="py-4 px-6 text-right font-mono text-rose-700 text-lg">Rp {summary.sisa.toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              Riwayat Transaksi Pembayaran
            </h4>
            <div className="space-y-3">
              {pembayaranList
                .filter(p => p.nomorPendaftaran === santri.nomorPendaftaran && p.status !== 'Dibatalkan')
                .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                .map((p) => (
                  <div key={p.nomorTransaksi} className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-black text-slate-400">{p.nomorTransaksi}</span>
                        <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">{p.metodePembayaran}</span>
                      </div>
                      <div className="text-xs font-black text-slate-800 uppercase tracking-tight">Pembayaran Tahap {p.nomorTransaksi.split('-').pop()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-700 font-mono">Rp {p.nominal.toLocaleString('id-ID')}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">{p.tanggal}</div>
                    </div>
                  </div>
                ))}
              {pembayaranList.filter(p => p.nomorPendaftaran === santri.nomorPendaftaran && p.status !== 'Dibatalkan').length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">Belum ada riwayat pembayaran</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="pt-12 grid grid-cols-2 gap-20">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-20">Mengetahui, Wali Santri</p>
              <div className="border-t border-slate-900 w-48 mx-auto" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-20">Sekretariat PSB, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <div className="border-t border-slate-900 w-48 mx-auto" />
              <p className="text-[9px] font-black text-slate-950 uppercase mt-2">{appSettings.pondokName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
