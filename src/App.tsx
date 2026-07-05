import { useState, useEffect, useRef } from 'react';
import { useAppState, defaultUsersList } from './hooks/useAppState';
import { Dashboard } from './components/Dashboard';
import { SantriManager } from './components/SantriManager';
import { BiayaManager } from './components/BiayaManager';
import { PembayaranManager } from './components/PembayaranManager';
import { DataPembayaranManager } from './components/DataPembayaranManager';
import { KwitansiViewer } from './components/KwitansiViewer';
import { RegistrationCardViewer } from './components/RegistrationCardViewer';
import { PaymentSummaryViewer } from './components/PaymentSummaryViewer';
import { LaporanManager } from './components/LaporanManager';
import { PenggunaManager } from './components/PenggunaManager';
import { BackupManager } from './components/BackupManager';
import { LoginScreen } from './components/LoginScreen';
import { VerifikasiManager } from './components/VerifikasiManager';
import { BerkasManager } from './components/BerkasManager';
import { SettingsManager } from './components/SettingsManager';
import { LandingPage } from './components/LandingPage';
import { KonfirmasiManager } from './components/KonfirmasiManager';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BadgeCent,
  FileText,
  ShieldAlert,
  Database,
  Lock,
  Menu,
  X,
  MapPin,
  Calendar,
  ShieldCheck,
  FileCheck,
  Cloud,
  CloudOff,
  Settings,
  UserCheck,
  Bell,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { Pembayaran, getTerminology, getInstitutionType } from './types';

import { getPondokInitials } from './utils';

export default function App() {
  const {
    state,
    currentUser,
    isFirebaseConnected,
    switchRole,
    addSantri,
    addSantriBulk,
    editSantri,
    deleteSantri,
    acceptSantri,
    acceptSantriBulk,
    verifySantriByUser,
    addBiaya,
    editBiaya,
    deleteBiaya,
    addPembayaran,
    cancelPembayaran,
    resetToDefault,
    restoreBackup,
    updateLoginSettings,
    updateAppSettings,
    registerSystemUser,
    editSystemUser,
    removeSystemUser,
    updateSystemUserPassword,
    updateUserStatus,
    changeCurrentUser
  } = useAppState();

  // Active Menu Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'santri' | 'konfirmasi' | 'biaya' | 'pembayaran' | 'data_pembayaran' | 'laporan' | 'pengguna' | 'backup' | 'verifikasi' | 'berkas' | 'settings'>('dashboard');

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissed_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissedNotifs));
  }, [dismissedNotifs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismissNotif = (id: string, e: any) => {
    e.stopPropagation();
    setDismissedNotifs(prev => [...prev, id]);
  };

  // Pre-selected student ID for quick-payment workflows
  const [preSelectedSantriId, setPreSelectedSantriId] = useState<string | undefined>(undefined);

  // Pre-selected student ID for editing in master data Santri
  const [preSelectedMasterSantriId, setPreSelectedMasterSantriId] = useState<string | undefined>(undefined);

  const handleMasterSantriNavigation = (nomorPendaftaran: string) => {
    setPreSelectedMasterSantriId(nomorPendaftaran);
    setActiveTab('santri');
  };

  const handleClearPreSelectedMaster = () => {
    setPreSelectedMasterSantriId(undefined);
  };

  // Active printing states
  const [activeKwitansi, setActiveKwitansi] = useState<Pembayaran | null>(null);
  const [activeRegistrationCard, setActiveRegistrationCard] = useState<any | null>(null);
  const [activeSummarySantri, setActiveSummarySantri] = useState<any | null>(null);

  // Handle Print via URL Parameters (for "Open in New Tab" feature)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const printType = params.get('print');
    const id = params.get('id');

    if (printType && id && state?.santriList) {
      if (printType === 'kwitansi') {
        const p = state.pembayaranList.find(item => item.nomorTransaksi === id);
        if (p) setActiveKwitansi(p);
      } else if (printType === 'card') {
        const s = state.santriList.find(item => item.nomorPendaftaran === id);
        if (s) setActiveRegistrationCard(s);
      } else if (printType === 'summary') {
        const s = state.santriList.find(item => item.nomorPendaftaran === id);
        if (s) setActiveSummarySantri(s);
      }
    }
  }, [state?.santriList?.length, state?.pembayaranList?.length]);

  // Mobile sidebar drawer toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Session-based authentication status for real logins
  const [sessionLoggedIn, setSessionLoggedIn] = useState(() => {
    return sessionStorage.getItem('wahyu_hidayat_is_logged_in') === 'true';
  });

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-700"></div>
          <span className="text-xs font-semibold text-slate-500">Memuat Basis Data Aplikasi...</span>
        </div>
      </div>
    );
  }

  // Compute notifications
  const allNotifications = state.santriList.flatMap(s => {
    const notifs = [];
    if (!s.isAccepted) {
      notifs.push({
        id: `${s.nomorPendaftaran}_new`,
        title: `${getTerminology(state?.appSettings, { capitalize: true })} Baru`,
        message: `${s.nama} telah mendaftar.`,
        type: 'new' as const,
        santriId: s.nomorPendaftaran
      });
    }
    if (s.userVerificationStatus === 'Correction Requested') {
      notifs.push({
        id: `${s.nomorPendaftaran}_correction`,
        title: 'Perbaikan Data',
        message: `${s.nama} mengajukan perbaikan data.`,
        type: 'correction' as const,
        santriId: s.nomorPendaftaran
      });
    }
    return notifs;
  });

  const activeNotifications = allNotifications.filter(n => !dismissedNotifs.includes(n.id));

  const loginRequired = state.loginSettings?.loginRequired || false;

  const getFilteredState = () => {
    // Filter santriList based on gender-specific roles
    const filteredSantriList = state.santriList.filter(s => {
      if (currentUser.role === 'Admin Putri' || currentUser.role === 'Bendahara Putri') {
        return s.jenisKelamin === 'Perempuan';
      }
      if (currentUser.role === 'Admin Putra' || currentUser.role === 'Bendahara Putra') {
        return s.jenisKelamin === 'Laki-laki';
      }
      // Master, Admin Umum, and Bendahara Umum see all
      return true;
    });

    const allowedNoRegs = new Set(filteredSantriList.map(s => s.nomorPendaftaran));

    // Filter pembayaranList
    const filteredPembayaranList = state.pembayaranList.filter(p => {
      return allowedNoRegs.has(p.nomorPendaftaran);
    });

    // Filter tagihanMap
    const filteredTagihanMap: Record<string, any> = {};
    Object.entries(state.tagihanMap).forEach(([noReg, tagihans]) => {
      if (allowedNoRegs.has(noReg)) {
        filteredTagihanMap[noReg] = tagihans;
      }
    });

    return {
      ...state,
      santriList: filteredSantriList,
      pembayaranList: filteredPembayaranList,
      tagihanMap: filteredTagihanMap,
    };
  };

  const filteredState = getFilteredState();

  const handleLoginSuccess = (user: any) => {
    changeCurrentUser(user);
    sessionStorage.setItem('wahyu_hidayat_is_logged_in', 'true');
    setSessionLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('wahyu_hidayat_is_logged_in');
    setSessionLoggedIn(false);
    // Switch back to master or default
    const masterUser = state?.usersList?.find(u => u.role === 'Master') || defaultUsersList[0];
    changeCurrentUser(masterUser);
    setActiveTab('dashboard');
  };

  if (loginRequired && !sessionLoggedIn && !showAdminPanel) {
    return (
      <LandingPage 
        appSettings={state.appSettings} 
        onAdminLogin={() => setShowAdminPanel(true)}
        onSubmitRegistration={addSantri}
        onVerifyData={verifySantriByUser}
        santriList={state.santriList}
      />
    );
  }

  if (loginRequired && !sessionLoggedIn && showAdminPanel) {
    return (
      <LoginScreen
        usersList={state.usersList || []}
        onLoginSuccess={handleLoginSuccess}
        onBackToHome={() => setShowAdminPanel(false)}
        appSettings={state.appSettings}
      />
    );
  }

  // Handle Quick-Payment Navigation
  const handleQuickPayNavigation = (nomorPendaftaran: string) => {
    setPreSelectedSantriId(nomorPendaftaran);
    setActiveTab('pembayaran');
  };

  const handleClearPreSelected = () => {
    setPreSelectedSantriId(undefined);
  };

  const navGroups = [
    {
      label: 'Dashboard',
      items: [
        { 
          id: 'dashboard' as const, 
          label: 'Dashboard Utama', 
          icon: LayoutDashboard, 
          allowed: ['Master', 'Admin Umum', 'Admin Putra', 'Admin Putri', 'Bendahara Umum', 'Bendahara Putra', 'Bendahara Putri'] 
        }
      ]
    },
    {
      label: 'ADMIN',
      items: [
        { 
          id: 'santri' as const, 
          label: 'Data Santri Baru', 
          icon: Users, 
          allowed: ['Master', 'Admin Umum', 'Admin Putra', 'Admin Putri'] 
        },
        { 
          id: 'konfirmasi' as const, 
          label: 'Konfirmasi Diterima', 
          icon: UserCheck, 
          allowed: ['Master', 'Admin Umum', 'Admin Putra', 'Admin Putri'] 
        },
        { 
          id: 'verifikasi' as const, 
          label: 'Verifikasi Data', 
          icon: ShieldCheck, 
          allowed: ['Master', 'Admin Umum', 'Admin Putra', 'Admin Putri'] 
        },
        { 
          id: 'berkas' as const, 
          label: 'Kelengkapan Berkas', 
          icon: FileCheck, 
          allowed: ['Master', 'Admin Umum', 'Admin Putra', 'Admin Putri'] 
        },
      ]
    },
    {
      label: 'PEMBAYARAN',
      items: [
        { 
          id: 'pembayaran' as const, 
          label: 'Loket Bayar', 
          icon: CreditCard, 
          allowed: ['Master', 'Bendahara Umum', 'Bendahara Putra', 'Bendahara Putri'] 
        },
        { 
          id: 'data_pembayaran' as const, 
          label: 'Data Pembayaran', 
          icon: Receipt, 
          allowed: ['Master', 'Bendahara Umum', 'Bendahara Putra', 'Bendahara Putri'] 
        },
        { 
          id: 'laporan' as const, 
          label: 'Laporan Keuangan', 
          icon: FileText, 
          allowed: ['Master', 'Bendahara Umum', 'Bendahara Putra', 'Bendahara Putri'] 
        },
      ]
    },
    {
      label: 'MASTER',
      items: [
        { id: 'biaya' as const, label: 'Biaya Tanggungan', icon: BadgeCent, allowed: ['Master'] },
        { id: 'pengguna' as const, label: 'Manajemen Staff', icon: ShieldAlert, allowed: ['Master'] },
        { id: 'backup' as const, label: 'Backup & Database', icon: Database, allowed: ['Master'] },
        { id: 'settings' as const, label: 'Pengaturan Aplikasi', icon: Settings, allowed: ['Master'] },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased text-slate-800">
      
      {/* 1. TOP HEADER NAVIGATION - Hidden on Print */}
      <header id="main-header" className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mx-4 mt-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg lg:hidden cursor-pointer"
          >
            {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

            <div className="flex items-center gap-2 sm:gap-4">
            {/* Logo / Initials */}
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-xl shrink-0 overflow-hidden ${state.appSettings?.logoUrl ? 'bg-white' : 'bg-emerald-600 text-white'}`}>
              {state.appSettings?.logoUrl ? (
                <img src={state.appSettings.logoUrl || null} alt="Logo" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
              ) : (
                <span className="font-black text-xs sm:text-lg tracking-tighter">
                  {getPondokInitials(state.appSettings?.pondokName || 'PP Wahyu Hidayatul Islam')}
                </span>
              )}
            </div>
            <div className="max-w-[120px] sm:max-w-none">
              <h1 className="text-xs sm:text-base md:text-lg font-bold tracking-tight text-slate-900 leading-tight truncate">{state.appSettings?.pondokName || `Manajemen Pendaftaran ${getTerminology(state?.appSettings, { capitalize: true })} Baru`}</h1>
              <p className="text-[8px] md:text-xs font-medium text-slate-500 uppercase tracking-widest leading-none mt-0.5 truncate">{state.appSettings?.pondokAddress || 'Pondok Pesantren Wahyu Hidayatul Islam'}</p>
            </div>
          </div>
        </div>

        {/* User profile info & Calendar Timestamp indicators */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center justify-center p-2 rounded-lg" title={isFirebaseConnected ? "Terhubung ke Firebase" : "Tidak terhubung ke Firebase (Mode Lokal)"}>
            {isFirebaseConnected ? (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <Cloud size={16} />
                <span className="text-xs font-bold">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                <CloudOff size={16} />
                <span className="text-xs font-bold">Lokal</span>
              </div>
            )}
          </div>
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all"
            >
              <Bell size={20} />
              {activeNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-800">Notifikasi Tugas</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {activeNotifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      Tidak ada tugas baru.
                    </div>
                  ) : (
                    activeNotifications.map(notif => (
                      <div 
                        key={notif.id}
                        className="p-3 border-b border-slate-100 hover:bg-slate-50 flex items-start gap-3 transition-colors cursor-pointer"
                        onClick={() => {
                          if (notif.type === 'new') setActiveTab('konfirmasi');
                          if (notif.type === 'correction') setActiveTab('verifikasi');
                          setShowNotifications(false);
                        }}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'new' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {notif.type === 'new' ? <UserCheck size={14} /> : <FileText size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">{notif.message}</p>
                        </div>
                        <button
                          onClick={(e) => handleDismissNotif(notif.id, e)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
                          title="Tandai Selesai"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="hidden md:flex flex-col text-right border-l border-slate-200 pl-4">
            <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
            <p className="text-xs text-emerald-600 font-medium">{currentUser.role}</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold shrink-0">
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          {loginRequired && (
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Keluar
            </button>
          )}
        </div>
      </header>

      {/* 2. BODY LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* SIDEBAR NAVIGATION - Hidden on Print */}
        <aside
          id="main-sidebar"
          className={`bg-white border-r border-slate-200 lg:border lg:border-slate-200 w-72 lg:w-64 shrink-0 flex flex-col justify-between fixed lg:sticky lg:top-[92px] inset-y-0 left-0 transform ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } lg:transform-none transition-transform duration-300 ease-in-out z-40 lg:z-10 lg:rounded-2xl lg:m-4 lg:mr-0 lg:h-[calc(100vh-100px)] print:hidden shadow-2xl lg:shadow-sm`}
        >
          <div>
            {/* Mobile Sidebar Brand Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden bg-emerald-950 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">🕌</span>
                <span className="font-bold text-xs tracking-tight">PONPES WAHYU HIDAYATUL ISLAM</span>
              </div>
              <button 
                onClick={() => setMobileSidebarOpen(false)} 
                className="p-1.5 hover:bg-emerald-900 rounded-lg text-emerald-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-80px)] lg:max-h-none">
              {/* Nav list */}
              <nav className="space-y-4">
                {navGroups.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{group.label}</p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isAllowed = item.allowed.includes(currentUser.role);
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          id={`sidebar-tab-${item.id}`}
                          disabled={!isAllowed}
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-md font-bold'
                              : isAllowed
                              ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              : 'text-slate-300 cursor-not-allowed opacity-55'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon size={16} />
                            <span>{item.label}</span>
                          </div>

                          {!isAllowed && (
                            <Lock size={12} className="text-slate-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Sidebar Footer branding */}
          <div className="pt-4 px-4 pb-6 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium leading-relaxed">
            <p>Developed by AVHIEV PRODUCTION</p>
            <p className="text-[9px] opacity-75">All Rights Reserved</p>
          </div>
        </aside>

        {/* Sidebar backdrop overlay for mobile view */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden print:hidden transition-opacity"
          ></div>
        )}

        {/* 3. MAIN CONTENT CONTAINER */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto overflow-x-hidden">
          {/* RENDER CURRENT TAB VIEW */}
          <div className="animate-in fade-in duration-300 w-full">
            {activeTab === 'dashboard' && (
              <Dashboard
                state={filteredState}
                onNavigateToSantri={() => setActiveTab('santri')}
                onNavigateToPembayaran={handleQuickPayNavigation}
              />
            )}

            {activeTab === 'santri' && (
              <SantriManager
                santriList={filteredState.santriList}
                tagihanMap={filteredState.tagihanMap}
                activeRole={currentUser.role}
                appSettings={state.appSettings}
                onAddSantri={addSantri}
                onEditSantri={editSantri}
                onDeleteSantri={deleteSantri}
                onNavigateToPembayaran={handleQuickPayNavigation}
                preSelectedSantriId={preSelectedMasterSantriId}
                onClearPreSelected={handleClearPreSelectedMaster}
              />
            )}

            {activeTab === 'konfirmasi' && (
              <KonfirmasiManager
                santriList={filteredState.santriList}
                appSettings={state.appSettings}
                onAccept={acceptSantri}
                onAcceptBulk={acceptSantriBulk}
                onUpdateSantri={editSantri}
              />
            )}

            {activeTab === 'verifikasi' && (
              <VerifikasiManager
                santriList={filteredState.santriList}
                activeRole={currentUser.role}
                onEditSantri={editSantri}
                onDeleteSantri={deleteSantri}
                onNavigateToMaster={handleMasterSantriNavigation}
                appSettings={state.appSettings}
              />
            )}

            {activeTab === 'berkas' && (
              <BerkasManager
                santriList={filteredState.santriList}
                activeRole={currentUser.role}
                onEditSantri={editSantri}
                onDeleteSantri={deleteSantri}
                appSettings={state.appSettings}
              />
            )}

            {activeTab === 'biaya' && (
              <BiayaManager
                biayaList={filteredState.biayaList}
                activeRole={currentUser.role}
                onAddBiaya={addBiaya}
                onEditBiaya={editBiaya}
                onDeleteBiaya={deleteBiaya}
                appSettings={state.appSettings}
              />
            )}

            {activeTab === 'pembayaran' && (
              <PembayaranManager
                santriList={filteredState.santriList}
                pembayaranList={filteredState.pembayaranList}
                tagihanMap={filteredState.tagihanMap}
                activeRole={currentUser.role}
                onAddPembayaran={addPembayaran}
                onCancelPembayaran={cancelPembayaran}
                onPrintKwitansi={setActiveKwitansi}
                preSelectedSantriId={preSelectedSantriId}
                onClearPreSelected={handleClearPreSelected}
                appSettings={state.appSettings}
              />
            )}

            {activeTab === 'data_pembayaran' && (
              <DataPembayaranManager
                santriList={filteredState.santriList}
                tagihanMap={filteredState.tagihanMap}
                pembayaranList={filteredState.pembayaranList}
                activeRole={currentUser.role}
                onNavigateToPembayaran={handleQuickPayNavigation}
                onPrintKwitansi={setActiveKwitansi}
                appSettings={state.appSettings}
              />
            )}

            {activeTab === 'laporan' && (
              <LaporanManager
                santriList={filteredState.santriList}
                pembayaranList={filteredState.pembayaranList}
                tagihanMap={filteredState.tagihanMap}
                biayaList={filteredState.biayaList}
                appSettings={state.appSettings}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'pengguna' && (
              <PenggunaManager
                activeRole={currentUser.role}
                currentUser={currentUser}
                usersList={filteredState.usersList || []}
                onRegisterUser={registerSystemUser}
                onEditUser={editSystemUser}
                onRemoveUser={removeSystemUser}
                onUpdateUserPassword={updateSystemUserPassword}
                onUpdateUserStatus={updateUserStatus}
                appSettings={state.appSettings}
              />
            )}

            {activeTab === 'backup' && (
              <BackupManager
                activeRole={currentUser.role}
                currentUser={currentUser}
                state={filteredState}
                onRestoreBackup={restoreBackup}
                onResetToDefault={resetToDefault}
                onAddSantri={addSantri}
                onAddSantriBulk={addSantriBulk}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsManager
                activeRole={currentUser.role}
                settings={state.appSettings || { pondokName: '', tahunAjaran: '', pondokAddress: '' }}
                onUpdateSettings={updateAppSettings}
              />
            )}
          </div>
        </main>
      </div>

      {/* 4. KWITANSI PRINT OVERLAY PORTAL */}
      {activeKwitansi && (
        <KwitansiViewer
          pembayaran={activeKwitansi}
          onClose={() => setActiveKwitansi(null)}
          appSettings={state.appSettings}
          autoPrint={true}
        />
      )}

      {/* 5. REGISTRATION CARD PRINT OVERLAY */}
      {activeRegistrationCard && (
        <RegistrationCardViewer
          santri={activeRegistrationCard}
          onClose={() => setActiveRegistrationCard(null)}
          appSettings={state.appSettings}
          autoPrint={true}
        />
      )}

      {/* 6. PAYMENT SUMMARY PRINT OVERLAY */}
      {activeSummarySantri && (
        <PaymentSummaryViewer
          santri={activeSummarySantri}
          tagihanMap={state.tagihanMap}
          pembayaranList={state.pembayaranList}
          appSettings={state.appSettings}
          onClose={() => setActiveSummarySantri(null)}
          autoPrint={true}
        />
      )}
    </div>
  );
}
