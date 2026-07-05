import React, { useEffect } from 'react';
import { Santri, AppSettings } from '../types';
import { CheckCircle2, User, Calendar, MapPin, School, Phone, X, Printer as PrinterIcon } from 'lucide-react';
import { getPondokInitials, printElementInNewTab } from '../utils';

interface RegistrationCardViewerProps {
  santri: Santri;
  appSettings: AppSettings;
  onClose: () => void;
  autoPrint?: boolean;
}

export function RegistrationCardViewer({ santri, appSettings, onClose, autoPrint = true }: RegistrationCardViewerProps) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handlePrint = () => {
    const el = document.getElementById('registration-card');
    if (el) {
      printElementInNewTab(el.innerHTML, `Kartu_Registrasi_${santri.nomorPendaftaran}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 print:bg-white print:p-0">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 print:shadow-none print:max-h-none print:rounded-none">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 no-print">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Kartu Registrasi</h2>
            <p className="text-xs text-slate-500">Bukti pendaftaran santri baru</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Tutup"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 md:p-8 overflow-y-auto print:overflow-visible flex-1">
          {/* Card to be printed */}
          <div id="registration-card" className="border-4 border-emerald-950 p-6 md:p-8 rounded-xl bg-white relative overflow-hidden print:border-2 print:m-0">
            {/* Watermark/Background decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-emerald-50 rounded-full opacity-50 pointer-events-none" />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-4 border-b-2 border-emerald-950 pb-6 mb-6">
                <div className={`w-16 h-16 rounded-xl shrink-0 flex items-center justify-center font-bold text-2xl overflow-hidden ${appSettings.logoUrl ? 'bg-white' : 'bg-emerald-950 text-white'}`}>
                  {appSettings.logoUrl ? (
                    <img src={appSettings.logoUrl || null} alt="Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                  ) : (
                    getPondokInitials(appSettings.pondokName)
                  )}
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-emerald-950 uppercase tracking-tight leading-tight">{appSettings?.pondokName || 'Pondok Pesantren Wahyu Hidayatul Islam'}</h1>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mt-1">Panitia PSB {appSettings?.tahunAjaran || '2026/2027'}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center mb-8">
                <div className="bg-emerald-100 text-emerald-800 px-6 py-2 rounded-full border-2 border-emerald-200 flex items-center gap-2 shadow-sm">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="font-black text-lg uppercase tracking-widest">DITERIMA</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nomor Registrasi</span>
                    <div className="text-2xl font-black text-emerald-950 font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      {santri.nomorPendaftaran}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nama Lengkap</span>
                    <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <User size={16} className="text-emerald-600" />
                      {santri.nama}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tempat, Tanggal Lahir</span>
                    <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-600" />
                      {santri.tempatLahir}, {new Date(santri.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pilihan Jenjang</span>
                    <div className="text-sm font-bold text-emerald-700 flex items-center gap-2 bg-emerald-50 px-2 py-1 rounded w-fit">
                      <School size={14} />
                      {santri.jenjang}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer / QR Area */}
              <div className="mt-12 pt-6 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 mb-4 italic">Simpan kartu ini sebagai bukti pendaftaran yang sah.</p>
                  <div className="text-[10px] font-bold text-slate-800">
                    Cetak: {new Date().toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-[8px] text-slate-300 font-mono mb-2">
                    QR CODE
                  </div>
                  <div className="text-[9px] font-bold text-slate-900 uppercase">Sekretariat PSB</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0 no-print">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-sm transition-all cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <PrinterIcon size={14} />
            Cetak Kartu
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #registration-card, #registration-card * {
            visibility: visible;
          }
          #registration-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 40px;
            border-width: 2px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />
    </div>
  );
}
