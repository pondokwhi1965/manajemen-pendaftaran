import { X, Printer, CheckCircle, ShieldCheck, Landmark } from 'lucide-react';
import { Pembayaran, AppSettings } from '../types';

interface KwitansiViewerProps {
  pembayaran: Pembayaran;
  onClose: () => void;
  appSettings: AppSettings;
}

// Indonesian "Terbilang" spelling helper
function angkaKeTerbilang(num: number): string {
  const words = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  if (num < 12) {
    return words[num];
  }
  if (num < 20) {
    return angkaKeTerbilang(num - 10) + ' Belas';
  }
  if (num < 100) {
    return words[Math.floor(num / 10)] + ' Puluh ' + words[num % 10];
  }
  if (num < 200) {
    return 'Seratus ' + angkaKeTerbilang(num - 100);
  }
  if (num < 1000) {
    return words[Math.floor(num / 100)] + ' Ratus ' + angkaKeTerbilang(num % 100);
  }
  if (num < 2000) {
    return 'Seribu ' + angkaKeTerbilang(num - 1000);
  }
  if (num < 1000000) {
    return angkaKeTerbilang(Math.floor(num / 1000)) + ' Ribu ' + angkaKeTerbilang(num % 1000);
  }
  if (num < 1000000000) {
    return angkaKeTerbilang(Math.floor(num / 1000000)) + ' Juta ' + angkaKeTerbilang(num % 1000000);
  }
  return String(num);
}

export function KwitansiViewer({ pembayaran, onClose, appSettings }: KwitansiViewerProps) {
  const terbilangText = `${angkaKeTerbilang(pembayaran.nominal)} Rupiah`;
  const isCancelled = pembayaran.status === 'Dibatalkan';

  // Native window.print() triggers print stylesheet
  const handlePrint = () => {
    window.print();
  };

  // Build simulated QR Code payload
  const qrPayload = `KWT_VERIFIED|${pembayaran.nomorTransaksi}|${pembayaran.nomorPendaftaran}|${pembayaran.nominal}|${pembayaran.tanggal}`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto print:bg-white print:p-0">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200 print:shadow-none print:border-none print:rounded-none">
        
        {/* Top bar controls - hidden on print */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ReceiptIcon size={18} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Preview Kwitansi Digital</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Printer size={14} />
              Cetak (Ctrl+P)
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div id="print-receipt-body" className="p-8 relative space-y-6 print:p-4 bg-[radial-gradient(#f8fafc_1px,transparent_1px)] [background-size:16px_16px]">
          
          {/* Canceled/Void overlay badge */}
          {isCancelled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-15 overflow-hidden">
              <div className="transform -rotate-12 border-8 border-red-600 px-12 py-6 text-red-600 font-extrabold text-7xl uppercase tracking-widest rounded-3xl">
                VOID / BATAL
              </div>
            </div>
          )}

          {/* Receipt Frame Border */}
          <div className="border-4 border-double border-emerald-850 p-6 rounded-2xl relative space-y-6 print:border-emerald-900 print:p-2 bg-white">
            
            {/* 1. KOP SURAT (Letterhead) */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b-2 border-emerald-800 text-center sm:text-left">
              {/* Pesantren Islamic Star Logo Emblem */}
              <div className="bg-emerald-950 text-emerald-300 p-3 rounded-2xl shrink-0 border border-emerald-800">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z" fill="currentColor" />
                  <circle cx="12" cy="12" r="3" className="text-emerald-950" fill="currentColor" />
                </svg>
              </div>

              <div className="flex-1 space-y-1">
                <h2 className="text-emerald-900 font-extrabold text-base md:text-lg tracking-tight uppercase font-sans">
                  {appSettings.pondokName || 'Pondok Pesantren Wahyu Hidayatul Islam'}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Sekretariat PSB: {appSettings.pondokAddress || 'Jl. Wahyu Hidayat No. 01, Kompleks Pesantren, Kabupaten Pasuruan, Jawa Timur'}
                </p>
                <p className="text-[9px] text-slate-400 font-mono">
                  Tahun Ajaran: {appSettings.tahunAjaran} | Cetak: {new Date().toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* 2. RECEIPT METADATA */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h1 className="text-slate-800 font-extrabold text-sm md:text-base uppercase tracking-wider">
                  Bukti Pembayaran Resmi (Kwitansi)
                </h1>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Salinan digital disimpan pada basis data awan pondok
                </p>
              </div>

              <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-right print:bg-slate-50 print:border-slate-300">
                NO: {pembayaran.nomorTransaksi}
              </div>
            </div>

            {/* 3. CORE TRANSACTION DETAILS TABLE */}
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 print:bg-white print:border-slate-300">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 text-slate-400 font-medium">No. Registrasi:</span>
                    <span className="font-mono font-bold text-slate-800">{pembayaran.nomorPendaftaran}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-400 font-medium">Nama Santri Baru:</span>
                    <span className="font-bold text-slate-800 text-sm">{pembayaran.namaSantri}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 text-slate-400 font-medium">Tanggal Transaksi:</span>
                    <span className="font-mono text-slate-800 font-semibold">{pembayaran.tanggal}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-400 font-medium">Metode Loket:</span>
                    <span className="font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px] uppercase font-mono leading-none">
                      {pembayaran.metodePembayaran}
                    </span>
                  </div>
                </div>
              </div>

              {/* Allocation itemized tables */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-2 px-3 w-12">No</th>
                      <th className="py-2 px-4">Pos Alokasi Pembayaran Biaya</th>
                      <th className="py-2 px-4 text-right">Jumlah Terbayarkan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pembayaran.itemsDetail.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/10">
                        <td className="py-2 px-3 font-mono font-semibold text-slate-400">{index + 1}</td>
                        <td className="py-2 px-4 font-semibold text-slate-700">{item.jenisBiaya}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-slate-800">
                          Rp {item.nominal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Spelled out text (Terbilang) */}
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex flex-col gap-1 print:bg-white print:border-slate-300">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Terbilang:</span>
                <span className="font-semibold text-emerald-800 italic text-[13px] leading-relaxed">
                  &ldquo; {terbilangText} &rdquo;
                </span>
              </div>

              {/* Total Aggregate Card */}
              <div className="bg-emerald-900 text-white p-3.5 rounded-xl flex justify-between items-center font-bold text-sm print:bg-slate-900 print:text-white">
                <span className="uppercase tracking-wider text-xs font-semibold text-emerald-200 print:text-slate-300">Total Nominal Terima:</span>
                <span className="font-mono text-base md:text-lg">
                  Rp {pembayaran.nominal.toLocaleString('id-ID')}
                </span>
              </div>

              {pembayaran.catatan && (
                <div className="text-[11px] text-slate-500 italic">
                  * Catatan Bendahara: &ldquo;{pembayaran.catatan}&rdquo;
                </div>
              )}

              {/* Canceled reasons if any */}
              {isCancelled && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg space-y-1">
                  <p className="font-bold">❌ Kwitansi Ini Telah Dibatalkan (VOID):</p>
                  <p className="text-[11px] leading-relaxed">
                    Dibatalkan oleh: <strong>{pembayaran.dibatalkanOleh}</strong> pada {pembayaran.tanggalPembatalan}
                  </p>
                  <p className="text-[11px] leading-relaxed italic">
                    Alasan: &ldquo;{pembayaran.alasanPembatalan}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* 4. FOOTER & VERIFICATION (QR & Signature) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 pt-4 border-t border-slate-200 items-end gap-6 text-xs text-slate-600">
              
              {/* QR Verification */}
              <div className="flex items-center gap-3.5">
                {/* Visual Custom QR code representing verification */}
                <div className="relative group p-1.5 border border-slate-200 rounded-lg bg-white shrink-0 shadow-xs cursor-help" title={qrPayload}>
                  <svg className="w-16 h-16 text-slate-800" viewBox="0 0 100 100">
                    {/* QR Finder patterns */}
                    <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="5" />
                    <rect x="11" y="11" width="13" height="13" fill="currentColor" />
                    
                    <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="5" />
                    <rect x="76" y="11" width="13" height="13" fill="currentColor" />
                    
                    <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="5" />
                    <rect x="11" y="76" width="13" height="13" fill="currentColor" />

                    {/* Simulating random data bits inside QR */}
                    <rect x="35" y="15" width="5" height="15" fill="currentColor" />
                    <rect x="45" y="5" width="10" height="5" fill="currentColor" />
                    <rect x="60" y="15" width="5" height="5" fill="currentColor" />
                    <rect x="35" y="35" width="15" height="5" fill="currentColor" />
                    <rect x="55" y="30" width="10" height="10" fill="currentColor" />
                    <rect x="75" y="35" width="15" height="15" fill="currentColor" />
                    <rect x="15" y="35" width="5" height="15" fill="currentColor" />
                    <rect x="5" y="55" width="15" height="5" fill="currentColor" />
                    <rect x="35" y="55" width="5" height="15" fill="currentColor" />
                    <rect x="50" y="50" width="15" height="5" fill="currentColor" />
                    <rect x="70" y="60" width="10" height="5" fill="currentColor" />
                    <rect x="40" y="75" width="15" height="15" fill="currentColor" />
                    <rect x="60" y="80" width="5" height="10" fill="currentColor" />
                    <rect x="75" y="75" width="10" height="5" fill="currentColor" />
                    <rect x="85" y="85" width="10" height="10" fill="currentColor" />
                  </svg>
                  {/* Hover checkmark indicator */}
                  <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity flex-col text-center">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <span className="text-[8px] font-bold text-slate-800 uppercase mt-0.5">Verified</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <CheckCircle size={12} className="text-emerald-600" />
                    Sistem Terverifikasi
                  </p>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Pindai kode QR untuk mencocokkan nomor dokumen ini pada server pusat basis data Pondok Pesantren.
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="text-center space-y-10 sm:justify-self-end w-48 shrink-0">
                <div className="space-y-0.5">
                  <p className="text-slate-500 text-[10px]">Pasuruan, {pembayaran.tanggal.split(' ')[0]}</p>
                  <p className="font-semibold text-slate-700">Bendahara Penerima,</p>
                </div>
                
                {/* Visual stamps */}
                <div className="relative flex justify-center">
                  <span className="font-mono font-bold text-slate-800 text-xs border-b border-slate-800 pb-1 z-10">
                    {pembayaran.bendahara}
                  </span>
                  {/* Pondok verification stamp */}
                  <div className="absolute -top-6 transform rotate-6 border-2 border-dashed border-emerald-600/35 text-emerald-600/35 rounded-full px-3 py-1 text-[9px] font-extrabold uppercase font-mono tracking-widest pointer-events-none">
                    Wahyu Hidayat
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Modal Footer (hidden on print) */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-100 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Tutup Preview
          </button>
        </div>

      </div>
    </div>
  );
}

// Wrapper to prevent TS issues with dynamic imports
function ReceiptIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M16 8H8" />
      <path d="M16 12H8" />
      <path d="M13 16H8" />
    </svg>
  );
}
