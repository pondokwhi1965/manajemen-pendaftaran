import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  LogIn, 
  CheckCircle2, 
  ArrowRight,
  User,
  Save,
  X,
  AlertCircle,
  FileText,
  MessageSquare,
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { Santri, AppSettings, getTerminology, getInstitutionType } from '../types';
import { SantriFormFields } from './SantriFormFields';
import { motion, AnimatePresence } from 'motion/react';
import { getPondokInitials } from '../utils';

interface LandingPageProps {
  appSettings: AppSettings;
  onAdminLogin: () => void;
  onSubmitRegistration: (data: any) => { success: boolean; nomorPendaftaran?: string; error?: string };
  onVerifyData?: (nomorPendaftaran: string, status: 'Verified' | 'Correction Requested', message?: string) => void;
  santriList: Santri[];
}

export function LandingPage({ appSettings, onAdminLogin, onSubmitRegistration, onVerifyData, santriList }: LandingPageProps) {
  const [view, setView] = useState<'home' | 'register' | 'check'>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<Santri | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReg, setSuccessReg] = useState<{ nomor: string; nama: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionMessage, setCorrectionMessage] = useState('');
  const [showClosedModal, setShowClosedModal] = useState(false);

  // Initial empty santri for registration form
  const [newSantri, setNewSantri] = useState<Partial<Santri>>({
    nama: '',
    jenisKelamin: 'Laki-laki',
    tempatLahir: '',
    tanggalLahir: '',
    alamat: '',
    desa: '',
    kecamatan: '',
    kabupatenKota: '',
    provinsi: '',
    namaAyah: '',
    namaIbu: '',
    nomorHpOrangTua: '',
    asalSekolah: '',
    jenjang: appSettings?.jenjangOptions?.[0] || 'SMP AL-HIDAYAH',
    gelombangPendaftaran: appSettings?.gelombangOptions?.[0] || 'Gelombang 1',
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = onSubmitRegistration(newSantri);
    
    if (result.success && result.nomorPendaftaran) {
      setSuccessReg({ nomor: result.nomorPendaftaran, nama: newSantri.nama || '' });
      setView('home');
      // Reset form
      setNewSantri({
        nama: '',
        jenisKelamin: 'Laki-laki',
        tempatLahir: '',
        tanggalLahir: '',
        alamat: '',
        desa: '',
        kecamatan: '',
        kabupatenKota: '',
        provinsi: '',
        namaAyah: '',
        namaIbu: '',
        nomorHpOrangTua: '',
        asalSekolah: '',
        jenjang: appSettings?.jenjangOptions?.[0] || 'SMP AL-HIDAYAH',
        gelombangPendaftaran: appSettings?.gelombangOptions?.[0] || 'Gelombang 1',
      });
    }
    
    setIsSubmitting(false);
  };

  const handleCheckStatus = () => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setSearchResult(null);
      return;
    }

    const found = santriList.find(s => {
      const matchNoReg = s.nomorPendaftaran.toLowerCase() === term;
      const matchNik = s.nik?.toLowerCase() === term;
      const matchNama = s.nama.toLowerCase() === term || (term.length > 3 && s.nama.toLowerCase().includes(term));
      const matchTgl = s.tanggalLahir === term; // YYYY-MM-DD
      
      return matchNoReg || matchNik || matchNama || matchTgl;
    });
    setSearchResult(found || null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3.5 cursor-pointer group" 
              onClick={() => setView('home')}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl transition-transform group-hover:rotate-6 overflow-hidden ${appSettings.logoUrl ? 'bg-white' : 'bg-emerald-600 text-white'}`}>
                {appSettings.logoUrl ? (
                  <img src={appSettings.logoUrl || null} alt="Logo" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-black text-sm">
                    {getPondokInitials(appSettings.pondokName)}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 leading-none uppercase tracking-tight">Sistem Manajemen Pendaftaran</h1>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1.5">Pendaftaran {getTerminology(appSettings, { capitalize: true })} Baru {appSettings?.tahunAjaran || '2026/2027'}</p>
              </div>
            </motion.div>

            <div className="flex items-center gap-3 sm:gap-6">
              <button 
                onClick={() => setView('check')}
                className="text-xs font-bold text-slate-600 hover:text-emerald-700 transition-all flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-emerald-50/80 cursor-pointer"
              >
                <Search size={14} className="stroke-[2.5]" />
                <span className="hidden sm:inline">Cek Pendaftaran</span>
              </button>
              <button 
                onClick={onAdminLogin}
                className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg shadow-slate-200 cursor-pointer active:scale-95"
              >
                <LogIn size={14} className="stroke-[2.5]" />
                <span>Login Admin</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {/* Hero Section */}
        {view === 'home' && (
          <motion.main 
            key="home"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
            variants={containerVariants}
            className="overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-28">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-10">
                  <motion.div variants={itemVariants} className="space-y-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${appSettings.isRegistrationOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${appSettings.isRegistrationOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      {appSettings.isRegistrationOpen ? `Penerimaan ${getTerminology(appSettings, { capitalize: true })} Baru Telah Dibuka` : `Penerimaan ${getTerminology(appSettings, { capitalize: true })} Baru Telah Ditutup`}
                    </span>
                    <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-950 leading-[1.05] tracking-tight">
                      Halo Calon <span className="text-emerald-600 italic">{getTerminology(appSettings, { capitalize: true })} Baru</span>
                      <div className="text-2xl sm:text-3xl md:text-4xl mt-4 text-slate-700">{appSettings.pondokName}</div>
                    </h2>
                    <p className="text-lg sm:text-xl text-slate-500 font-medium max-w-xl leading-relaxed">
                      Wujudkan masa depan gemilang dengan pendidikan karakter terbaik. Kurikulum terintegrasi, fasilitas lengkap, dan lingkungan asri.
                    </p>
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 max-w-xl">
                    <button 
                      onClick={() => {
                        if (appSettings.isRegistrationOpen) {
                          setView('register');
                        } else {
                          setShowClosedModal(true);
                        }
                      }}
                      className={`flex-1 group relative flex items-center justify-center gap-3 px-6 py-4.5 rounded-3xl font-black text-lg shadow-xl transition-all cursor-pointer overflow-hidden active:scale-[0.98] ${appSettings.isRegistrationOpen ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100' : 'bg-slate-400 text-white shadow-slate-100'}`}
                    >
                      <UserPlus size={20} className="stroke-[2.5]" />
                      Daftar Sekarang
                      <ArrowRight size={18} className="stroke-[2.5] transition-transform group-hover:translate-x-1" />
                    </button>
                    <button 
                      onClick={() => setView('check')}
                      className="flex-1 flex items-center justify-center gap-3 px-6 py-4.5 bg-white border-2 border-slate-200 hover:border-emerald-600 hover:text-emerald-700 text-slate-700 rounded-3xl font-black text-lg transition-all cursor-pointer hover:bg-emerald-50/30 active:scale-[0.98]"
                    >
                      <Search size={20} className="stroke-[2.5]" />
                      Cek Pendaftaran
                    </button>
                  </motion.div>

                  <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 pt-10 border-t border-slate-200/60">
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-950">500+</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{getTerminology(appSettings, { capitalize: true })} Aktif</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-950">3</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Jenjang Pendidikan</div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 pt-4 sm:pt-0">
                      <div className="text-2xl sm:text-3xl font-black text-slate-950">1965</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tahun Berdiri</div>
                    </div>
                  </motion.div>
                </div>

                <motion.div 
                  variants={itemVariants}
                  className="relative lg:ml-auto"
                >
                  <div className="absolute -inset-4 bg-emerald-600 rounded-[3rem] rotate-3 opacity-[0.03] blur-2xl"></div>
                  <div className="relative bg-white p-3 sm:p-4 rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-200 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="relative h-[350px] sm:h-[400px] md:h-[500px] rounded-[1.8rem] sm:rounded-[2.5rem] overflow-hidden group">
                      <img 
                        src={appSettings.heroImageUrl || 'https://images.unsplash.com/photo-1577891780346-4513b53bbe7b?q=80&w=2069&auto=format&fit=crop'} 
                        alt="Pondok Pesantren" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent"></div>
                    </div>
                  </div>

                  {/* Guide Button below image */}
                  {appSettings.isGuideActive && appSettings.guideUrl && (
                    <motion.div 
                      variants={itemVariants}
                      className="mt-6 flex justify-center relative z-50"
                    >
                      <a 
                        href={appSettings.guideUrl.startsWith('http') ? appSettings.guideUrl : `https://${appSettings.guideUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-white border-2 border-blue-100 text-blue-600 rounded-2xl font-bold text-sm shadow-xl shadow-blue-50 hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95 group cursor-pointer relative z-50"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          <BookOpen size={18} className="stroke-[2.5]" />
                        </div>
                        Lihat Panduan Pendaftaran
                      </a>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.main>
        )}

        {/* Registration View */}
        {view === 'register' && (
          <motion.div 
            key="register"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="max-w-4xl mx-auto px-4 py-16"
          >
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
              <div className="bg-slate-950 p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 blur-[100px] -mr-32 -mt-32"></div>
                <button 
                  onClick={() => setView('home')}
                  className="absolute left-4 sm:left-6 top-6 sm:top-8 flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl transition-all border border-white/10 cursor-pointer active:scale-95 group z-50"
                >
                  <ArrowLeft size={16} sm:size={18} />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Kembali</span>
                </button>
                <div className="text-center space-y-3 mt-8 sm:mt-0 relative z-10">
                  <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] block">Formulir Digital</span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">Pendaftaran {getTerminology(appSettings, { capitalize: true })}</h2>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed px-4">Silakan lengkapi informasi di bawah ini dengan data yang valid sesuai dokumen resmi.</p>
                </div>
              </div>

              <form onSubmit={handleRegisterSubmit} className="p-8 md:p-12">
                <div className="space-y-16">
                  <SantriFormFields 
                    formData={newSantri}
                    onChange={(e) => {
                      const { name, value } = e.target;
                      setNewSantri(prev => ({ ...prev, [name]: value }));
                    }}
                    setFormData={setNewSantri as any}
                    activeRole="Superadmin"
                    config={appSettings?.formFields}
                    jenjangOptions={appSettings?.jenjangOptions}
                    gelombangOptions={appSettings?.gelombangOptions}
                    appSettings={appSettings}
                  />
                  
                  <div className="pt-12 border-t border-slate-100">
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-3 py-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-200 transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save size={24} className="stroke-[2.5]" />
                          Kirim Pendaftaran
                        </>
                      )}
                    </motion.button>
                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-6">
                      Data Anda aman & terenkripsi oleh sistem kami.
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Check Status View */}
        {view === 'check' && (
          <motion.div 
            key="check"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto px-4 py-16"
          >
            <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden p-10 md:p-16">
              <div className="text-center mb-12">
                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 mx-auto mb-6">
                  <Search size={40} className="stroke-[2.5]" />
                </div>
                <h2 className="text-3xl font-black text-slate-950 tracking-tight">Status Pendaftaran</h2>
                <p className="text-slate-500 mt-2">Cari berdasarkan No. Registrasi, NIK, Nama Lengkap, atau Tanggal Lahir (TTTT-BB-HH).</p>
              </div>

              <div className="space-y-4 mb-10">
                <input
                  type="text"
                  placeholder="Nama / NIK / No. Registrasi / Tgl Lahir"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xl font-bold placeholder:text-slate-300 transition-all"
                />
                <button 
                  onClick={handleCheckStatus}
                  className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-3xl font-black text-lg transition-all shadow-xl shadow-slate-200 cursor-pointer active:scale-[0.98]"
                >
                  Lihat Hasil
                </button>
              </div>

              <AnimatePresence>
                {searchResult && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 space-y-8 overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 border border-slate-200 shadow-sm">
                          <User size={36} />
                        </div>
                        <div>
                          <h4 className="font-black text-2xl text-slate-950 leading-tight">{searchResult.nama}</h4>
                          <div className="font-mono text-xs font-bold text-emerald-600 mt-1">{searchResult.nomorPendaftaran}</div>
                        </div>
                      </div>
                      <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        searchResult.isAccepted ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {searchResult.isAccepted ? 'Diterima' : 'Diproses'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-3xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Jenjang</span>
                        <div className="text-base font-black text-slate-900">{searchResult.jenjang}</div>
                      </div>
                      <div className="bg-white p-5 rounded-3xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Validasi</span>
                        <div className={`text-base font-black ${
                          searchResult.statusValidasi === 'Valid' ? 'text-emerald-600' : 'text-amber-500'
                        }`}>
                          {searchResult.statusValidasi || 'Pending'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                        <FileText size={20} className="text-emerald-600" />
                        <h5 className="font-black text-slate-900">Verifikasi Data</h5>
                      </div>
                      
                      {searchResult.userVerificationStatus === 'Verified' ? (
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-center gap-3">
                          <CheckCircle2 size={24} className="shrink-0" />
                          <p className="text-sm font-bold">Data Anda telah diverifikasi dan disetujui.</p>
                        </div>
                      ) : searchResult.userVerificationStatus === 'Correction Requested' ? (
                        <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl flex items-start gap-3">
                          <AlertCircle size={24} className="shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold mb-1">Pengajuan perbaikan data sedang diproses admin.</p>
                            <p className="text-xs opacity-80">"{searchResult.correctionRequestMessage}"</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-slate-600">Pastikan data yang Anda input sudah benar. Jika ada kesalahan, Anda dapat mengajukan perbaikan data.</p>
                          
                          {showCorrectionForm ? (
                            <div className="space-y-3">
                              <textarea
                                value={correctionMessage}
                                onChange={(e) => setCorrectionMessage(e.target.value)}
                                placeholder="Jelaskan data apa yang salah dan perbaikannya..."
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-medium h-24 resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (onVerifyData && correctionMessage.trim()) {
                                      setIsVerifying(true);
                                      onVerifyData(searchResult.nomorPendaftaran, 'Correction Requested', correctionMessage);
                                      setTimeout(() => {
                                        setIsVerifying(false);
                                        setShowCorrectionForm(false);
                                        // Refresh search result locally for immediate feedback
                                        setSearchResult({
                                          ...searchResult,
                                          userVerificationStatus: 'Correction Requested',
                                          correctionRequestMessage: correctionMessage
                                        });
                                      }, 500);
                                    }
                                  }}
                                  disabled={!correctionMessage.trim() || isVerifying}
                                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                                >
                                  Kirim Pengajuan
                                </button>
                                <button
                                  onClick={() => setShowCorrectionForm(false)}
                                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={() => {
                                  if (onVerifyData) {
                                    setIsVerifying(true);
                                    onVerifyData(searchResult.nomorPendaftaran, 'Verified');
                                    setTimeout(() => {
                                      setIsVerifying(false);
                                      setSearchResult({
                                        ...searchResult,
                                        userVerificationStatus: 'Verified'
                                      });
                                    }, 500);
                                  }
                                }}
                                disabled={isVerifying}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 size={18} />
                                Data Sudah Benar
                              </button>
                              <button
                                onClick={() => setShowCorrectionForm(true)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                              >
                                <MessageSquare size={18} />
                                Ajukan Perbaikan
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {searchTerm && !searchResult && (
                <div className="text-center py-10">
                  <p className="text-slate-400 font-bold text-sm">Data tidak ditemukan. Pastikan data yang Anda masukkan benar.</p>
                </div>
              )}
              
              <button 
                onClick={() => setView('home')}
                className="w-full mt-10 py-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-emerald-600 transition-colors cursor-pointer"
              >
                ← Kembali ke Beranda
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {successReg && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full text-center shadow-[0_48px_96px_-12px_rgba(0,0,0,0.2)] relative"
            >
              <button 
                onClick={() => setSuccessReg(null)}
                className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full cursor-pointer"
              >
                <X size={24} />
              </button>
              <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-600 mx-auto mb-8">
                <CheckCircle2 size={56} className="stroke-[2.5]" />
              </div>
              <h3 className="text-3xl font-black text-slate-950 mb-3 tracking-tight">Selamat!</h3>
              <p className="text-slate-500 font-medium mb-8">
                Pendaftaran atas nama <span className="text-emerald-600 font-bold">{successReg.nama}</span> telah berhasil dikirim.
              </p>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 font-mono font-black text-4xl text-emerald-700 mb-10 tracking-[0.1em]">
                {successReg.nomor}
              </div>
              <button 
                onClick={() => setSuccessReg(null)}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-lg transition-all shadow-xl shadow-emerald-100 cursor-pointer"
              >
                Tutup & Selesai
              </button>
            </motion.div>
          </div>
        )}

        {/* Registration Closed Modal */}
        {showClosedModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[3.5rem] p-10 max-w-md w-full text-center relative shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)]"
            >
              <button 
                onClick={() => setShowClosedModal(false)}
                className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full cursor-pointer"
              >
                <X size={24} />
              </button>
              <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-600 mx-auto mb-8">
                <AlertCircle size={56} className="stroke-[2.5]" />
              </div>
              <h3 className="text-3xl font-black text-slate-950 mb-3 tracking-tight">Pendaftaran Ditutup</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                Mohon maaf, saat ini pendaftaran {getTerminology(appSettings)} baru periode <strong>{appSettings.tahunAjaran}</strong> telah resmi ditutup.
              </p>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 mb-8">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Info Lebih Lanjut</p>
                <p className="text-sm font-bold text-slate-700">Silakan hubungi sekretariat pondok untuk informasi gelombang pendaftaran berikutnya.</p>
              </div>
              <button 
                onClick={() => setShowClosedModal(false)}
                className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-3xl font-black text-lg transition-all shadow-xl cursor-pointer"
              >
                Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/60 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">WH</div>
            <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">{appSettings.pondokName}</h1>
          </div>
          <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto mb-10 leading-relaxed">
            {appSettings?.pondokAddress || 'Jl. Wahyu Hidayat No. 01, Pasuruan, Jawa Timur'}
          </p>
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
            © 2026 - {appSettings?.pondokName || 'PP. Wahyu Hidayatul Islam'}
          </div>
        </div>
      </footer>
    </div>
  );
}
