import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Santri, Biaya, TagihanItem, Pembayaran, LogAktivitas, User, Role, SystemState, AppSettings } from '../types';
import { initialBiayaList, initialSantriList, initialTagihanMap, initialPembayaranList, initialLogs } from '../initialData';

const STORAGE_KEY = 'wahyu_hidayatul_islam_payment_system_v1';
const FIREBASE_DOC_ID = 'main_state';
const FIREBASE_COLLECTION = 'appData';

const defaultUsersList: User[] = [
  { username: 'superadmin', name: 'Super Admin', role: 'Superadmin', password: 'superadmin123', isActive: true },
  { username: 'adminumum', name: 'Admin Umum', role: 'Admin Umum', password: 'adminumum123', isActive: true },
  { username: 'adminputra', name: 'Admin Putra', role: 'Admin Putra', password: 'adminputra123', isActive: true },
  { username: 'adminputri', name: 'Admin Putri', role: 'Admin Putri', password: 'adminputri123', isActive: true },
];

const defaultUsers: Record<Role, User> = {
  'Superadmin': defaultUsersList[0],
  'Admin Umum': defaultUsersList[1],
  'Admin Putra': defaultUsersList[2],
  'Admin Putri': defaultUsersList[3],
};

const ensureDefaultUsers = (fullState: SystemState): { state: SystemState; changed: boolean } => {
  let changed = false;
  const list = fullState.usersList ? [...fullState.usersList] : [];
  
  if (list.length === 0) {
    return {
      state: {
        ...fullState,
        usersList: [...defaultUsersList],
      },
      changed: true
    };
  }
  
  // Ensure that at least one Superadmin user exists to prevent lockouts
  const hasSuperadmin = list.some(u => u.role === 'Superadmin');
  if (!hasSuperadmin) {
    // Check if the default superadmin username is taken, otherwise add it
    const defaultSuper = defaultUsersList[0];
    const usernameTaken = list.some(u => u.username.toLowerCase() === defaultSuper.username.toLowerCase());
    if (!usernameTaken) {
      list.push({ ...defaultSuper, isActive: true });
    } else {
      // Force the existing username matching default super to be Superadmin or append a new one
      const existingIdx = list.findIndex(u => u.username.toLowerCase() === defaultSuper.username.toLowerCase());
      list[existingIdx].role = 'Superadmin';
      list[existingIdx].isActive = true;
    }
    changed = true;
  }
  
  return {
    state: {
      ...fullState,
      usersList: list,
    },
    changed
  };
};

const defaultAppSettings: AppSettings = {
  pondokName: 'Pondok Pesantren Wahyu Hidayatul Islam',
  tahunAjaran: '2026/2027',
  isRegistrationOpen: true,
  isGuideActive: false,
  guideUrl: '',
  pondokAddress: 'Jl. Wahyu Hidayat No. 01, Pasuruan, Jawa Timur',
  waTemplate: `PENDAFTARAN SANTRI BARU 
*PP. {PONDOK_NAME}*
TAHUN AJARAN {TAHUN_AJARAN}

*No Registrasi :* {NO_REG}
*Nama :* {NAMA}

Telah dikonfirmasi dan *DITERIMA*

Selanjutnya akan kami lakukan verifikasi data oleh petugas. Terimakasih.

_________
> Dibuat oleh Sistem Pendaftaran Santri Baru Sekretariat PP. {PONDOK_NAME}`,
  heroImageUrl: 'https://images.unsplash.com/photo-1577891780346-4513b53bbe7b?q=80&w=2069&auto=format&fit=crop',
  logoUrl: '',
  jenjangOptions: ['SDI AL-HIDAYAH', 'SMP AL-HIDAYAH', 'SMK AL-HIDAYAH'],
  gelombangOptions: ['Gelombang 1', 'Gelombang 2', 'Gelombang 3'],
  formFields: [
    { id: 'nomorPendaftaran', label: 'Nomor Pendaftaran', visible: true, order: 0 },
    { id: 'nama', label: 'Nama Lengkap', visible: true, order: 1 },
    { id: 'jenisKelamin', label: 'Jenis Kelamin', visible: true, order: 2 },
    { id: 'jenjang', label: 'Jenjang', visible: true, order: 3 },
    { id: 'tempatLahir', label: 'Tempat Lahir', visible: true, order: 4 },
    { id: 'tanggalLahir', label: 'Tanggal Lahir', visible: true, order: 5 },
    { id: 'anakKe', label: 'Anak Ke', visible: true, order: 6 },
    { id: 'jumlahSaudara', label: 'Jumlah Saudara', visible: true, order: 7 },
    { id: 'nik', label: 'NIK Santri', visible: true, order: 8 },
    { id: 'noKk', label: 'No KK', visible: true, order: 9 },
    { id: 'asalSekolah', label: 'Asal Sekolah', visible: true, order: 10 },
    { id: 'npsnAsal', label: 'NPSN Sekolah Asal', visible: true, order: 11 },
    { id: 'alamatSekolahAsal', label: 'Alamat Sekolah Asal', visible: true, order: 12 },
    { id: 'nisn', label: 'NISN', visible: true, order: 13 },
    { id: 'mendaftarKelas', label: 'Mendaftar Untuk Kelas', visible: true, order: 14 },
    { id: 'gelombangPendaftaran', label: 'Gelombang Pendaftaran', visible: true, order: 14.5 },
    { id: 'alamat', label: 'Jalan/Dusun', visible: true, order: 15 },
    { id: 'rt', label: 'RT', visible: true, order: 16 },
    { id: 'rw', label: 'RW', visible: true, order: 17 },
    { id: 'desa', label: 'Kelurahan/Desa', visible: true, order: 18 },
    { id: 'kecamatan', label: 'Kecamatan', visible: true, order: 19 },
    { id: 'kabupatenKota', label: 'Kabupaten/Kota', visible: true, order: 20 },
    { id: 'provinsi', label: 'Provinsi', visible: true, order: 21 },
    { id: 'kodePos', label: 'Kode Pos', visible: true, order: 22 },
    { id: 'namaAyah', label: 'Nama Lengkap Ayah', visible: true, order: 23 },
    { id: 'nikAyah', label: 'NIK Ayah', visible: true, order: 24 },
    { id: 'statusAyah', label: 'Status Ayah', visible: true, order: 25 },
    { id: 'tempatLahirAyah', label: 'Tempat Lahir Ayah', visible: true, order: 26 },
    { id: 'tanggalLahirAyah', label: 'Tanggal Lahir Ayah', visible: true, order: 27 },
    { id: 'pendidikanAyah', label: 'Pendidikan Terakhir Ayah', visible: true, order: 28 },
    { id: 'pekerjaanAyah', label: 'Pekerjaan Ayah', visible: true, order: 29 },
    { id: 'penghasilanAyah', label: 'Penghasilan Rata-rata Ayah', visible: true, order: 30 },
    { id: 'noHpAyah', label: 'No. HP Ayah', visible: true, order: 31 },
    { id: 'namaIbu', label: 'Nama Lengkap Ibu', visible: true, order: 32 },
    { id: 'nikIbu', label: 'NIK Ibu', visible: true, order: 33 },
    { id: 'statusIbu', label: 'Status Ibu', visible: true, order: 34 },
    { id: 'tempatLahirIbu', label: 'Tempat Lahir Ibu', visible: true, order: 35 },
    { id: 'tanggalLahirIbu', label: 'Tanggal Lahir Ibu', visible: true, order: 36 },
    { id: 'pendidikanIbu', label: 'Pendidikan Terakhir Ibu', visible: true, order: 37 },
    { id: 'pekerjaanIbu', label: 'Pekerjaan Ibu', visible: true, order: 38 },
    { id: 'penghasilanIbu', label: 'Penghasilan Rata-rata Ibu', visible: true, order: 39 },
    { id: 'noHpIbu', label: 'No. HP Ibu', visible: true, order: 40 },
    { id: 'namaWali', label: 'Nama Lengkap Wali', visible: true, order: 41 },
    { id: 'tempatLahirWali', label: 'Tempat Lahir Wali', visible: true, order: 42 },
    { id: 'pendidikanWali', label: 'Pendidikan Terakhir Wali', visible: true, order: 43 },
    { id: 'penghasilanWali', label: 'Penghasilan Rata-rata Wali', visible: true, order: 44 },
    { id: 'nikWali', label: 'NIK Wali', visible: true, order: 45 },
    { id: 'tanggalLahirWali', label: 'Tanggal Lahir Wali', visible: true, order: 46 },
    { id: 'pekerjaanWali', label: 'Pekerjaan Wali', visible: true, order: 47 },
    { id: 'noHpWali', label: 'No. HP Wali', visible: true, order: 48 },
    { id: 'nomorHpOrangTua', label: 'Nomor WhatsApp Aktif', visible: true, order: 49 },
  ],
  jenisLembaga: 'Pondok Pesantren',
  sebutanSiswa: 'Santri',
  sebutanSiswaCustom: '',
  addressLevel: 'desa',
};

export function useAppState() {
  const [state, setState] = useState<SystemState | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Initialize State
  useEffect(() => {
    let unsubscribe = () => {};

    const initializeData = async () => {
      try {
        const docRef = doc(db, FIREBASE_COLLECTION, FIREBASE_DOC_ID);
        const docSnap = await getDoc(docRef);

        let parsed: any = null;
        if (docSnap.exists()) {
          parsed = docSnap.data();
        }

        const isValidState = parsed && 
          parsed.santriList && 
          parsed.biayaList && 
          parsed.tagihanMap && 
          parsed.pembayaranList && 
          parsed.logs && 
          parsed.currentUser;

        if (isValidState) {
          let fullState = parsed as SystemState;
          if (!fullState.usersList) {
            fullState.usersList = defaultUsersList;
          }
          if (!fullState.loginSettings) {
            fullState.loginSettings = { loginRequired: true };
          }
          
          if (!fullState.appSettings) {
            fullState.appSettings = { ...defaultAppSettings };
          } else {
            fullState.appSettings = {
              ...defaultAppSettings,
              ...fullState.appSettings
            };
            
            // Force update label if it's the old one
            const hpField = fullState.appSettings.formFields?.find(f => f.id === 'nomorHpOrangTua');
            if (hpField && (hpField.label === 'Nomor WhatsApp Aktif (untuk konfirmasi pendaftaran)' || hpField.label === 'Nomor WA Orang Tua')) {
              hpField.label = 'Nomor WhatsApp Aktif';
            }
          }
          
          // Verify and ensure default users exist with correct passwords
          const check = ensureDefaultUsers(fullState);
          if (check.changed) {
            fullState = check.state;
            await setDoc(docRef, fullState);
          }
          
          setState(fullState);
          setIsFirebaseConnected(true);
          
          // Listen to remote changes, but preserve local currentUser to avoid cross-tab logout/conflicts
          unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
              const snapData = snapshot.data() as SystemState;
              if (snapData && snapData.santriList && snapData.biayaList) {
                if (!snapData.appSettings) {
                  snapData.appSettings = { ...defaultAppSettings };
                } else {
                  snapData.appSettings = {
                    ...defaultAppSettings,
                    ...snapData.appSettings
                  };
                }
                setState(prev => {
                  if (!prev) return snapData;
                  return {
                    ...snapData,
                    currentUser: prev.currentUser // Preserve local currentUser!
                  };
                });
              }
            }
          });
          return;
        } else {
          // If no valid doc in firebase, fallback to local storage or defaults, then push to firebase
          const saved = localStorage.getItem(STORAGE_KEY);
          let defaultState: SystemState;
          if (saved) {
            try {
              defaultState = JSON.parse(saved);
              if (!defaultState.santriList || !defaultState.biayaList) {
                throw new Error('Incomplete local storage');
              }
              if (!defaultState.appSettings) {
                defaultState.appSettings = defaultAppSettings;
              }
              if (!defaultState.loginSettings) {
                defaultState.loginSettings = { loginRequired: true };
              }
              if (!defaultState.usersList) {
                defaultState.usersList = defaultUsersList;
              }
            } catch (err) {
              defaultState = {
                santriList: initialSantriList,
                biayaList: initialBiayaList,
                tagihanMap: initialTagihanMap,
                pembayaranList: initialPembayaranList,
                logs: initialLogs,
                currentUser: defaultUsers['Superadmin'], // Default starting user
                usersList: defaultUsersList,
                loginSettings: { loginRequired: true },
                appSettings: defaultAppSettings,
              };
            }
          } else {
            defaultState = {
              santriList: initialSantriList,
              biayaList: initialBiayaList,
              tagihanMap: initialTagihanMap,
              pembayaranList: initialPembayaranList,
              logs: initialLogs,
              currentUser: defaultUsers['Superadmin'], // Default starting user
              usersList: defaultUsersList,
              loginSettings: { loginRequired: true },
              appSettings: defaultAppSettings,
            };
          }
          
          const check = ensureDefaultUsers(defaultState);
          defaultState = check.state;
          
          setState(defaultState);
          await setDoc(docRef, defaultState);
          setIsFirebaseConnected(true);
          
          unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
              const snapData = snapshot.data() as SystemState;
              if (snapData && snapData.santriList && snapData.biayaList) {
                if (!snapData.appSettings) {
                  snapData.appSettings = defaultAppSettings;
                }
                setState(prev => {
                  if (!prev) return snapData;
                  return {
                    ...snapData,
                    currentUser: prev.currentUser // Preserve local currentUser!
                  };
                });
              }
            }
          });
          return;
        }
      } catch (e) {
        console.error('Firebase connection error, falling back to local storage:', e);
        setIsFirebaseConnected(false);
        // Fallback to local storage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.santriList && parsed.biayaList && parsed.tagihanMap && parsed.pembayaranList && parsed.logs && parsed.currentUser) {
              let fullState = parsed as SystemState;
              if (!fullState.usersList) {
                fullState.usersList = defaultUsersList;
              }
              if (!fullState.loginSettings) {
                fullState.loginSettings = { loginRequired: true };
              }
              if (!fullState.appSettings) {
                fullState.appSettings = defaultAppSettings;
              } else {
                if (!fullState.appSettings.jenjangOptions) fullState.appSettings.jenjangOptions = defaultAppSettings.jenjangOptions;
                if (!fullState.appSettings.gelombangOptions) fullState.appSettings.gelombangOptions = defaultAppSettings.gelombangOptions;

                // Force update label if it's the old one
                const hpField = fullState.appSettings.formFields?.find(f => f.id === 'nomorHpOrangTua');
                if (hpField && (hpField.label === 'Nomor WhatsApp Aktif (untuk konfirmasi pendaftaran)' || hpField.label === 'Nomor WA Orang Tua')) {
                  hpField.label = 'Nomor WhatsApp Aktif';
                }
              }
              const check = ensureDefaultUsers(fullState);
              fullState = check.state;
              setState(fullState);
              return;
            }
          } catch (err) {
            console.error('Error parsing stored state', err);
          }
        }
        
        // Final fallback to defaults
        let defaultState: SystemState = {
          santriList: initialSantriList,
          biayaList: initialBiayaList,
          tagihanMap: initialTagihanMap,
          pembayaranList: initialPembayaranList,
          logs: initialLogs,
          currentUser: defaultUsers['Superadmin'],
          usersList: defaultUsersList,
          loginSettings: { loginRequired: true },
          appSettings: defaultAppSettings,
        };
        const check = ensureDefaultUsers(defaultState);
        defaultState = check.state;
        setState(defaultState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      }
    };

    initializeData();

    return () => unsubscribe();
  }, []);

  const saveState = async (newState: SystemState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    try {
      if (isFirebaseConnected) {
        // Sanitize tagihanMap to remove invalid empty string keys
        const sanitizedTagihanMap = { ...newState.tagihanMap };
        Object.keys(sanitizedTagihanMap).forEach(key => {
          if (!key || key.trim() === '') {
            delete sanitizedTagihanMap[key];
          }
        });

        const docRef = doc(db, FIREBASE_COLLECTION, FIREBASE_DOC_ID);
        await setDoc(docRef, { ...newState, tagihanMap: sanitizedTagihanMap });
      }
    } catch (e) {
      console.error('Error syncing to Firebase:', e);
    }
  };

  // Helper to append action to system logs
  const logAction = (stateRef: SystemState, action: string, description: string): LogAktivitas[] => {
    const newLog: LogAktivitas = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16),
      user: stateRef.currentUser.name,
      role: stateRef.currentUser.role,
      aktivitas: action,
      keterangan: description,
    };
    return [newLog, ...stateRef.logs];
  };

  // Change simulated role
  const switchRole = (role: Role) => {
    if (!state) return;
    const nextUser = defaultUsers[role];
    const updatedLogs = logAction(
      { ...state, currentUser: nextUser },
      'Ganti Role',
      `Berganti pengguna menjadi ${nextUser.name} (${role})`
    );
    saveState({
      ...state,
      currentUser: nextUser,
      logs: updatedLogs,
    });
  };

  // Register a new Student & generate bill items
  const addSantri = (santriData: Omit<Santri, 'status' | 'tanggalDaftar'> & { nomorPendaftaran?: string; tanggalDaftar?: string }): { success: boolean; error?: string; nomorPendaftaran?: string } => {
    if (!state) return { success: false, error: 'Sistem belum siap.' };

    let nomorPendaftaran = santriData.nomorPendaftaran?.trim();
    if (nomorPendaftaran) {
      // Validate uniqueness
      const exists = state.santriList.some(s => s.nomorPendaftaran.toLowerCase() === nomorPendaftaran.toLowerCase());
      if (exists) {
        return { success: false, error: `Nomor pendaftaran ${nomorPendaftaran} sudah terdaftar di sistem.` };
      }
    } else {
      // Generate Nomor Registrasi: Based on Academic Year
      const yearStr = state.appSettings.tahunAjaran.replace(/[^0-9]/g, ''); // Extract digits: "2026/2027" -> "20262027"
      let prefix = '2026';
      
      if (yearStr.length >= 8) {
        // "20262027" -> "2627"
        prefix = yearStr.substring(2, 4) + yearStr.substring(6, 8);
      } else if (yearStr.length >= 4) {
        // "2026" -> "2026"
        prefix = yearStr;
      }

      const samePrefixSantri = state.santriList.filter(s => s.nomorPendaftaran.startsWith(prefix));
      let nextSeqNum = 1;
      if (samePrefixSantri.length > 0) {
        const numbers = samePrefixSantri.map(s => {
          const seq = s.nomorPendaftaran.slice(prefix.length);
          return parseInt(seq, 10);
        });
        nextSeqNum = Math.max(...numbers.filter(n => !isNaN(n)), 0) + 1;
      }
      nomorPendaftaran = `${prefix}${String(nextSeqNum).padStart(3, '0')}`;
    }

    const newSantri: Santri = {
      ...santriData,
      nomorPendaftaran,
      status: 'Belum Bayar',
      tanggalDaftar: santriData.tanggalDaftar || new Date().toISOString().split('T')[0],
      statusValidasi: santriData.statusValidasi || 'Belum Divalidasi',
      berkas: santriData.berkas || {
        kk: false,
        akta: false,
        ktpOrtu: false,
        sklIjazah: false,
      }
    };

    // Generate tagihan list based on current master biaya and gender filter
    const initialTagihans: TagihanItem[] = state.biayaList
      .filter(b => {
        const cat = b.kategoriGender || 'Semua';
        if (cat === 'Semua') return true;
        if (newSantri.jenisKelamin === 'Laki-laki' && cat === 'Laki-laki') return true;
        if (newSantri.jenisKelamin === 'Perempuan' && cat === 'Perempuan') return true;
        return false;
      })
      .map(b => ({
        id: b.id,
        jenisBiaya: b.jenisBiaya,
        nominal: b.nominal,
        terbayar: 0,
      }));

    const updatedSantriList = [newSantri, ...state.santriList];
    const updatedTagihanMap = {
      ...state.tagihanMap,
      [nomorPendaftaran]: initialTagihans,
    };

    const tempState = {
      ...state,
      santriList: updatedSantriList,
      tagihanMap: updatedTagihanMap,
    };

    const updatedLogs = logAction(
      tempState,
      'Pendaftaran Santri Baru',
      `Mendaftarkan santri ${newSantri.nama} (${nomorPendaftaran}) jenjang ${newSantri.jenjang}`
    );

    saveState({
      ...tempState,
      logs: updatedLogs,
    });

    return { success: true, nomorPendaftaran };
  };

  // Edit existing student details
  
  const addSantriBulk = (santriDataList: Array<Omit<Santri, 'status' | 'tanggalDaftar'> & { nomorPendaftaran?: string; tanggalDaftar?: string }>): { success: boolean; error?: string; count: number } => {
    if (!state) return { success: false, error: 'Sistem belum siap.', count: 0 };
    
    let currentSantriList = [...state.santriList];
    let currentTagihanMap = { ...state.tagihanMap };
    let successCount = 0;
    
    for (const santriData of santriDataList) {
      let nomorPendaftaran = santriData.nomorPendaftaran?.trim();
      if (nomorPendaftaran) {
        const exists = currentSantriList.some(s => s.nomorPendaftaran.toLowerCase() === nomorPendaftaran.toLowerCase());
        if (exists) {
          continue; // skip duplicates
        }
      } else {
        const currentYear = 2026;
        const sameYearSantri = currentSantriList.filter(s => s.nomorPendaftaran.startsWith(String(currentYear)));
        let nextSeqNum = 1;
        if (sameYearSantri.length > 0) {
          const numbers = sameYearSantri.map(s => {
            const seq = s.nomorPendaftaran.slice(4);
            return parseInt(seq, 10);
          });
          nextSeqNum = Math.max(...numbers.filter(n => !isNaN(n))) + 1;
        }
        nomorPendaftaran = `${currentYear}${String(nextSeqNum).padStart(3, '0')}`;
      }
      
      const newSantri: Santri = {
        ...(santriData as any),
        nomorPendaftaran,
        status: 'Belum Bayar',
        tanggalDaftar: santriData.tanggalDaftar || new Date().toISOString().split('T')[0],
        statusValidasi: santriData.statusValidasi || 'Belum Divalidasi',
        berkas: santriData.berkas || { kk: false, akta: false, ktpOrtu: false, sklIjazah: false },
      };
      
      currentSantriList.push(newSantri);
      successCount++;
    }
    
    if (successCount === 0) {
      return { success: false, error: 'Tidak ada data valid yang diimpor.', count: 0 };
    }
    
    // Sync bills
    currentTagihanMap = syncTagihanMapWithBiaya(currentSantriList, currentTagihanMap, state.biayaList);
    
    const tempState = {
      ...state,
      santriList: currentSantriList,
      tagihanMap: currentTagihanMap,
    };
    
    const updatedLogs = logAction(
      tempState,
      'Impor Santri Baru',
      `Mengimpor ${successCount} data santri secara massal (Bulk Import)`
    );
    
    saveState({ ...tempState, logs: updatedLogs });
    return { success: true, count: successCount };
  };

  const editSantri = (nomorPendaftaran: string, updatedData: Partial<Santri>): { success: boolean; error?: string } => {
    if (!state) return { success: false, error: 'Sistem belum siap.' };

    const oldReg = nomorPendaftaran;
    const newReg = updatedData.nomorPendaftaran?.trim();

    // If changing registration number, check if it's already taken
    if (newReg && newReg.toLowerCase() !== oldReg.toLowerCase()) {
      const exists = state.santriList.some(s => s.nomorPendaftaran.toLowerCase() === newReg.toLowerCase());
      if (exists) {
        return { success: false, error: `Nomor pendaftaran ${newReg} sudah digunakan oleh santri lain.` };
      }
    }

    // Update student in santriList
    const isStatusValidasiValidOrInvalid = updatedData.statusValidasi === 'Valid' || updatedData.statusValidasi === 'Tidak Valid';
    const hasDataEdits = Object.keys(updatedData).some(key => key !== 'statusValidasi' && key !== 'berkas' && key !== 'nomorPendaftaran');

    let additionalUpdates: Partial<Santri> = {};
    if (isStatusValidasiValidOrInvalid || hasDataEdits) {
      additionalUpdates = {
        userVerificationStatus: 'Pending',
        correctionRequestMessage: ''
      };
    }

    const updatedSantriList = state.santriList.map(s => {
      if (s.nomorPendaftaran === oldReg) {
        return { ...s, ...updatedData, ...additionalUpdates, nomorPendaftaran: newReg || oldReg };
      }
      return s;
    });

    // Update tagihanMap
    const updatedTagihanMap = { ...state.tagihanMap };
    if (newReg && newReg !== oldReg) {
      if (updatedTagihanMap[oldReg]) {
        updatedTagihanMap[newReg] = updatedTagihanMap[oldReg];
        delete updatedTagihanMap[oldReg];
      }
    }

    // Recalculate bills in case gender changed
    const fullUpdatedTagihanMap = syncTagihanMapWithBiaya(updatedSantriList, updatedTagihanMap, state.biayaList);

    // Update pembayaranList
    const updatedPembayaranList = state.pembayaranList.map(p => {
      if (p.nomorPendaftaran === oldReg) {
        return { ...p, nomorPendaftaran: newReg || oldReg };
      }
      return p;
    });

    const student = state.santriList.find(s => s.nomorPendaftaran === oldReg);
    const tempState = {
      ...state,
      santriList: updatedSantriList,
      tagihanMap: fullUpdatedTagihanMap,
      pembayaranList: updatedPembayaranList,
    };

    const changeMsg = (newReg && newReg !== oldReg)
      ? `Memperbarui profil santri ${student?.nama || oldReg} (Nomor registrasi diubah dari ${oldReg} menjadi ${newReg})`
      : `Memperbarui profil santri ${student?.nama || oldReg} (${oldReg})`;

    const updatedLogs = logAction(
      tempState,
      'Update Data Santri',
      changeMsg
    );

    saveState({
      ...tempState,
      logs: updatedLogs,
    });

    return { success: true };
  };

  // Delete student record
  const deleteSantri = (nomorPendaftaran: string) => {
    if (!state) return;

    const targetSantri = state.santriList.find(s => s.nomorPendaftaran === nomorPendaftaran);
    const updatedSantriList = state.santriList.filter(s => s.nomorPendaftaran !== nomorPendaftaran);
    
    const updatedTagihanMap = { ...state.tagihanMap };
    delete updatedTagihanMap[nomorPendaftaran];

    // Also remove any related payments to keep integrity consistent
    const updatedPembayaranList = state.pembayaranList.filter(p => p.nomorPendaftaran !== nomorPendaftaran);

    const tempState = {
      ...state,
      santriList: updatedSantriList,
      tagihanMap: updatedTagihanMap,
      pembayaranList: updatedPembayaranList,
    };

    const updatedLogs = logAction(
      tempState,
      'Hapus Data Santri',
      `Menghapus data santri ${targetSantri?.nama || nomorPendaftaran} (${nomorPendaftaran})`
    );

    saveState({
      ...tempState,
      logs: updatedLogs,
    });
  };

  const acceptSantri = (nomorPendaftaran: string, isAccepted: boolean) => {
    if (!state) return;
    
    const targetSantri = state.santriList.find(s => s.nomorPendaftaran === nomorPendaftaran);
    if (!targetSantri) return;

    const updatedSantriList = state.santriList.map(s => 
      s.nomorPendaftaran === nomorPendaftaran ? { ...s, isAccepted } : s
    );

    const tempState = {
      ...state,
      santriList: updatedSantriList,
    };

    const updatedLogs = logAction(
      tempState,
      isAccepted ? 'Konfirmasi Santri' : 'Pembatalan Konfirmasi',
      `${isAccepted ? 'Menerima' : 'Membatalkan konfirmasi'} santri ${targetSantri.nama} (${nomorPendaftaran})`
    );

    saveState({
      ...tempState,
      logs: updatedLogs,
    });
  };

  const acceptSantriBulk = (nomorPendaftaranList: string[], isAccepted: boolean) => {
    if (!state) return;
    
    const updatedSantriList = state.santriList.map(s => 
      nomorPendaftaranList.includes(s.nomorPendaftaran) ? { ...s, isAccepted } : s
    );

    const tempState = {
      ...state,
      santriList: updatedSantriList,
    };

    const updatedLogs = logAction(
      tempState,
      'Konfirmasi Santri Massal',
      `${isAccepted ? 'Menerima' : 'Membatalkan Penerimaan'} ${nomorPendaftaranList.length} santri secara massal`
    );

    saveState({
      ...tempState,
      logs: updatedLogs,
    });
  };

  const verifySantriByUser = (nomorPendaftaran: string, status: 'Verified' | 'Correction Requested', message?: string) => {
    if (!state) return;

    const targetSantri = state.santriList.find(s => s.nomorPendaftaran === nomorPendaftaran);
    if (!targetSantri) return;

    const updatedSantriList = state.santriList.map(s => 
      s.nomorPendaftaran === nomorPendaftaran ? { 
        ...s, 
        userVerificationStatus: status,
        correctionRequestMessage: message || '',
        tanggalVerifikasiUser: new Date().toISOString()
      } : s
    );

    const tempState = {
      ...state,
      santriList: updatedSantriList,
    };

    const updatedLogs = logAction(
      tempState,
      'Verifikasi Data oleh User',
      `Santri ${targetSantri.nama} (${nomorPendaftaran}) melakukan ${status === 'Verified' ? 'verifikasi data' : 'pengajuan perbaikan data'}`
    );

    saveState({
      ...tempState,
      logs: updatedLogs,
    });
  };


  // Helper to sync tagihanMap for all santri when biaya changes
  const syncTagihanMapWithBiaya = (currentSantriList: Santri[], currentTagihanMap: Record<string, TagihanItem[]>, currentBiayaList: Biaya[]) => {
    const newTagihanMap: Record<string, TagihanItem[]> = {};
    
    currentSantriList.forEach(santri => {
      const existingTagihan = currentTagihanMap[santri.nomorPendaftaran] || [];
      const updatedTagihan: TagihanItem[] = [];
      
      currentBiayaList.forEach(biaya => {
        const cat = biaya.kategoriGender || 'Semua';
        const isEligible = cat === 'Semua' || cat === santri.jenisKelamin;
        
        if (isEligible) {
          const existingItem = existingTagihan.find(t => t.id === biaya.id);
          updatedTagihan.push({
            id: biaya.id,
            jenisBiaya: biaya.jenisBiaya,
            nominal: biaya.nominal,
            terbayar: existingItem ? existingItem.terbayar : 0,
          });
        }
      });
      
      newTagihanMap[santri.nomorPendaftaran] = updatedTagihan;
    });
    
    return newTagihanMap;
  };

  // Master Biaya: Add Fee
  const addBiaya = (jenisBiaya: string, nominal: number, kategoriGender: 'Semua' | 'Laki-laki' | 'Perempuan' = 'Semua') => {
    if (!state) return;

    const newBiaya: Biaya = {
      id: `fee-${Date.now()}`,
      jenisBiaya,
      nominal,
      kategoriGender,
    };

    const updatedBiayaList = [...state.biayaList, newBiaya];
    const updatedTagihanMap = syncTagihanMapWithBiaya(state.santriList, state.tagihanMap, updatedBiayaList);
    const tempState = {
      ...state,
      biayaList: updatedBiayaList,
      tagihanMap: updatedTagihanMap,
    };

    const updatedLogs = logAction(
      tempState,
      'Tambah Master Biaya',
      `Menambahkan jenis biaya baru: ${jenisBiaya} (${kategoriGender}) senilai Rp ${nominal.toLocaleString('id-ID')}`
    );

    saveState({
      ...tempState,
      logs: updatedLogs,
    });
  };

  // Master Biaya: Edit Fee
  const editBiaya = (id: string, jenisBiaya: string, nominal: number, kategoriGender: 'Semua' | 'Laki-laki' | 'Perempuan' = 'Semua') => {
    if (!state) return;

    const oldBiaya = state.biayaList.find(b => b.id === id);
    const updatedBiayaList = state.biayaList.map(b => {
      if (b.id === id) {
        return { ...b, jenisBiaya, nominal, kategoriGender };
      }
      return b;
    });

    const updatedTagihanMap = syncTagihanMapWithBiaya(state.santriList, state.tagihanMap, updatedBiayaList);
    const tempState = {
      ...state,
      biayaList: updatedBiayaList,
      tagihanMap: updatedTagihanMap,
    };

    const updatedLogs = logAction(
      tempState,
      'Edit Master Biaya',
      `Mengubah biaya ${oldBiaya?.jenisBiaya || id} menjadi ${jenisBiaya} (${kategoriGender}, Rp ${nominal.toLocaleString('id-ID')})`
    );

    saveState({
      ...tempState,
      logs: updatedLogs,
    });
  };

  // Master Biaya: Delete Fee
  const deleteBiaya = (id: string) => {
    if (!state) return;

    const targetBiaya = state.biayaList.find(b => b.id === id);
    const updatedBiayaList = state.biayaList.filter(b => b.id !== id);
    const updatedTagihanMap = syncTagihanMapWithBiaya(state.santriList, state.tagihanMap, updatedBiayaList);

    const tempState = {
      ...state,
      biayaList: updatedBiayaList,
      tagihanMap: updatedTagihanMap,
    };

    const updatedLogs = logAction(
      tempState,
      'Hapus Master Biaya',
      `Menghapus jenis biaya: ${targetBiaya?.jenisBiaya || id}`
    );

    saveState({
      ...tempState,
      logs: updatedLogs,
    });
  };

  // Process a Payment
  const addPembayaran = (
    nomorPendaftaran: string,
    payments: { id: string; nominalPay: number }[], // itemizations
    metodePembayaran: 'Tunai' | 'Transfer' | 'QRIS',
    catatan: string
  ): { success: boolean; error?: string; nomorTransaksi?: string } => {
    if (!state) return { success: false, error: 'Sistem belum siap.' };

    const santri = state.santriList.find(s => s.nomorPendaftaran === nomorPendaftaran);
    if (!santri) return { success: false, error: 'Data santri tidak ditemukan.' };

    const currentTagihans = state.tagihanMap[nomorPendaftaran] || [];
    const updatedTagihans = [...currentTagihans];

    // Total of this single transaction
    let totalPaidInTx = 0;
    const itemsDetail: { jenisBiaya: string; nominal: number }[] = [];

    for (const payment of payments) {
      if (payment.nominalPay <= 0) continue;

      const idx = updatedTagihans.findIndex(t => t.id === payment.id);
      if (idx === -1) {
        return { success: false, error: `Tagihan ID ${payment.id} tidak ditemukan.` };
      }

      const tagihanItem = updatedTagihans[idx];
      const remaining = tagihanItem.nominal - tagihanItem.terbayar;

      // Validation check
      if (payment.nominalPay > remaining) {
        return {
          success: false,
          error: `Jumlah bayar Rp ${payment.nominalPay.toLocaleString('id-ID')} untuk ${tagihanItem.jenisBiaya} melebihi sisa tagihan Rp ${remaining.toLocaleString('id-ID')}.`,
        };
      }

      updatedTagihans[idx] = {
        ...tagihanItem,
        terbayar: tagihanItem.terbayar + payment.nominalPay,
      };

      totalPaidInTx += payment.nominalPay;
      itemsDetail.push({
        jenisBiaya: tagihanItem.jenisBiaya,
        nominal: payment.nominalPay,
      });
    }

    if (totalPaidInTx <= 0) {
      return { success: false, error: 'Jumlah pembayaran total harus lebih besar dari Rp 0.' };
    }

    // Generate Receipt Number: KWT-2026-XXXX
    const currentYear = 2026;
    let nextReceiptNum = 1;
    const sameYearReceipts = state.pembayaranList.filter(p => p.nomorTransaksi.startsWith(`KWT-${currentYear}-`));
    if (sameYearReceipts.length > 0) {
      const numbers = sameYearReceipts.map(p => {
        const parts = p.nomorTransaksi.split('-');
        return parseInt(parts[parts.length - 1], 10);
      });
      nextReceiptNum = Math.max(...numbers) + 1;
    }
    const nomorTransaksi = `KWT-${currentYear}-${String(nextReceiptNum).padStart(4, '0')}`;

    // Recalculate Santri's total billing status
    const totalBilled = updatedTagihans.reduce((acc, t) => acc + t.nominal, 0);
    const totalPaid = updatedTagihans.reduce((acc, t) => acc + t.terbayar, 0);

    let status: 'Belum Bayar' | 'Cicilan' | 'Lunas' = 'Belum Bayar';
    if (totalPaid >= totalBilled) {
      status = 'Lunas';
    } else if (totalPaid > 0) {
      status = 'Cicilan';
    }

    const updatedSantriList = state.santriList.map(s => {
      if (s.nomorPendaftaran === nomorPendaftaran) {
        return { ...s, status };
      }
      return s;
    });

    const newPembayaran: Pembayaran = {
      nomorTransaksi,
      tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16),
      nomorPendaftaran,
      namaSantri: santri.nama,
      itemsDetail,
      nominal: totalPaidInTx,
      metodePembayaran,
      bendahara: state.currentUser.name,
      catatan: catatan || `Pembayaran biaya pendaftaran untuk ${santri.nama}`,
      status: 'Sukses',
    };

    const updatedPembayaranList = [newPembayaran, ...state.pembayaranList];
    const updatedTagihanMap = {
      ...state.tagihanMap,
      [nomorPendaftaran]: updatedTagihans,
    };

    const tempState = {
      ...state,
      santriList: updatedSantriList,
      pembayaranList: updatedPembayaranList,
      tagihanMap: updatedTagihanMap,
    };

    const updatedLogs = logAction(
      tempState,
      'Input Pembayaran',
      `Mencatat pembayaran dari ${santri.nama} (${nomorPendaftaran}) sebesar Rp ${totalPaidInTx.toLocaleString('id-ID')} (${metodePembayaran}) dengan kwitansi ${nomorTransaksi}`
    );

    saveState({
      ...tempState,
      logs: updatedLogs,
    });

    return { success: true, nomorTransaksi };
  };

  // Cancel Payment with mandatory reason log
  const cancelPembayaran = (nomorTransaksi: string, alasan: string): { success: boolean; error?: string } => {
    if (!state) return { success: false, error: 'Sistem belum siap.' };

    const kwitansi = state.pembayaranList.find(p => p.nomorTransaksi === nomorTransaksi);
    if (!kwitansi) return { success: false, error: 'Kwitansi tidak ditemukan.' };
    if (kwitansi.status === 'Dibatalkan') return { success: false, error: 'Kwitansi ini sudah dibatalkan sebelumnya.' };

    const { nomorPendaftaran, itemsDetail } = kwitansi;

    // Subtract paid amounts from the student's bill items
    const studentTagihans = state.tagihanMap[nomorPendaftaran] || [];
    const updatedTagihans = studentTagihans.map(tagihan => {
      const paymentDetail = itemsDetail.find(d => d.jenisBiaya === tagihan.jenisBiaya);
      if (paymentDetail) {
        return {
          ...tagihan,
          terbayar: Math.max(0, tagihan.terbayar - paymentDetail.nominal),
        };
      }
      return tagihan;
    });

    // Recalculate billing status
    const totalBilled = updatedTagihans.reduce((acc, t) => acc + t.nominal, 0);
    const totalPaid = updatedTagihans.reduce((acc, t) => acc + t.terbayar, 0);

    let status: 'Belum Bayar' | 'Cicilan' | 'Lunas' = 'Belum Bayar';
    if (totalPaid >= totalBilled) {
      status = 'Lunas';
    } else if (totalPaid > 0) {
      status = 'Cicilan';
    }

    const updatedSantriList = state.santriList.map(s => {
      if (s.nomorPendaftaran === nomorPendaftaran) {
        return { ...s, status };
      }
      return s;
    });

    // Mark transaction as Cancelled
    const updatedPembayaranList = state.pembayaranList.map(p => {
      if (p.nomorTransaksi === nomorTransaksi) {
        return {
          ...p,
          status: 'Dibatalkan' as const,
          alasanPembatalan: alasan,
          dibatalkanOleh: state.currentUser.name,
          tanggalPembatalan: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return p;
    });

    const updatedTagihanMap = {
      ...state.tagihanMap,
      [nomorPendaftaran]: updatedTagihans,
    };

    const tempState = {
      ...state,
      santriList: updatedSantriList,
      pembayaranList: updatedPembayaranList,
      tagihanMap: updatedTagihanMap,
    };

    const updatedLogs = logAction(
      tempState,
      'Pembatalan Transaksi',
      `Membatalkan kwitansi ${nomorTransaksi} milik ${kwitansi.namaSantri}. Alasan: ${alasan}`
    );

    saveState({
      ...tempState,
      logs: updatedLogs,
    });

    return { success: true };
  };

  // Reset state to initial data
  const resetToDefault = () => {
    const defaultState: SystemState = {
      santriList: initialSantriList,
      biayaList: initialBiayaList,
      tagihanMap: initialTagihanMap,
      pembayaranList: initialPembayaranList,
      logs: [
        {
          id: `log-${Date.now()}`,
          tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16),
          user: 'Sistem',
          role: 'Superadmin',
          aktivitas: 'Reset Sistem',
          keterangan: 'Mengembalikan seluruh data ke pengaturan awal pabrik.',
        },
        ...initialLogs,
      ],
      currentUser: defaultUsers['Superadmin'],
      usersList: defaultUsersList,
      loginSettings: { loginRequired: true },
      appSettings: state?.appSettings || defaultAppSettings,
    };
    saveState(defaultState);
  };

  // Import custom backup JSON
  const restoreBackup = (backupJson: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(backupJson);
      if (
        parsed.santriList &&
        parsed.biayaList &&
        parsed.tagihanMap &&
        parsed.pembayaranList &&
        parsed.logs
      ) {
        const restoredState: SystemState = {
          ...parsed,
          currentUser: state?.currentUser || defaultUsers['Superadmin'], // Preserve current simulated user
          usersList: parsed.usersList || defaultUsersList,
          loginSettings: parsed.loginSettings || { loginRequired: true },
        };
        const updatedLogs = logAction(
          restoredState,
          'Restore Database',
          'Berhasil memulihkan basis data dari file cadangan eksternal.'
        );
        saveState({
          ...restoredState,
          logs: updatedLogs,
        });
        return { success: true };
      }
      return { success: false, error: 'Format berkas tidak valid. Data wajib tidak lengkap.' };
    } catch (e: any) {
      return { success: false, error: `Gagal membaca file: ${e.message}` };
    }
  };

  // Update Login Settings (Enable/Disable login requirement)
  const updateLoginSettings = (loginRequired: boolean) => {
    if (!state) return;
    const nextSettings = { loginRequired };
    const tempState = {
      ...state,
      loginSettings: nextSettings
    };
    const updatedLogs = logAction(
      tempState,
      'Update Pengaturan Keamanan',
      `Mengubah konfigurasi login sistem menjadi: ${loginRequired ? 'AKTIF (Wajib Login)' : 'NONAKTIF (Bebas Masuk)'}`
    );
    saveState({
      ...tempState,
      logs: updatedLogs
    });
  };

  // Add User with Password
  const registerSystemUser = (username: string, name: string, role: Role, password?: string) => {
    if (!state) return;
    const newUser: User = {
      username: username.toLowerCase().trim(),
      name: name.trim(),
      role,
      password: password || 'password123',
      isActive: true
    };
    const updatedUsersList = [...(state.usersList || []), newUser];
    const tempState = {
      ...state,
      usersList: updatedUsersList
    };
    const updatedLogs = logAction(
      tempState,
      'Tambah Kredensial Pengguna',
      `Menambahkan kredensial baru untuk staff ${name} (${username}) sebagai ${role}`
    );
    saveState({
      ...tempState,
      logs: updatedLogs
    });
  };

  // Delete User
  const removeSystemUser = (username: string) => {
    if (!state) return;
    const targetUser = state.usersList?.find(u => u.username === username);
    const updatedUsersList = (state.usersList || []).filter(u => u.username !== username);
    const tempState = {
      ...state,
      usersList: updatedUsersList
    };
    const updatedLogs = logAction(
      tempState,
      'Hapus Kredensial Pengguna',
      `Menghapus kredensial pengguna ${targetUser?.name || username} (${username})`
    );
    saveState({
      ...tempState,
      logs: updatedLogs
    });
  };

  // Edit User
  const editSystemUser = (oldUsername: string, newUsername: string, newName: string, newRole: Role, newPassword?: string) => {
    if (!state) return;
    
    const updatedUsersList = (state.usersList || []).map(u => {
      if (u.username === oldUsername) {
        return {
          ...u,
          username: newUsername,
          name: newName,
          role: newRole,
          password: newPassword || u.password
        };
      }
      return u;
    });

    let updatedCurrentUser = state.currentUser;
    if (state.currentUser.username === oldUsername) {
       updatedCurrentUser = updatedUsersList.find(u => u.username === newUsername) || state.currentUser;
    }

    const tempState = {
      ...state,
      usersList: updatedUsersList,
      currentUser: updatedCurrentUser
    };

    const updatedLogs = logAction(
      tempState,
      'Ubah Kredensial Pengguna',
      `Memperbarui kredensial pengguna ${oldUsername} menjadi ${newName} (${newUsername}) sebagai ${newRole}`
    );
    saveState({
      ...tempState,
      logs: updatedLogs
    });
  };

  const updateUserStatus = (username: string, isActive: boolean) => {
    if (!state) return;
    const updatedUsersList = (state.usersList || []).map(u => {
      if (u.username === username) {
        return { ...u, isActive };
      }
      return u;
    });
    const tempState = { ...state, usersList: updatedUsersList };
    const targetUser = state.usersList?.find(u => u.username === username);
    const updatedLogs = logAction(
      tempState,
      'Update Status Pengguna',
      `Mengubah status akun ${targetUser?.name || username} menjadi ${isActive ? 'AKTIF' : 'NONAKTIF'}`
    );
    saveState({ ...tempState, logs: updatedLogs });
  };

  // Update User Password
  const updateSystemUserPassword = (username: string, newPassword: string) => {
    if (!state) return;
    const updatedUsersList = (state.usersList || []).map(u => {
      if (u.username === username) {
        return { ...u, password: newPassword };
      }
      return u;
    });
    const targetUser = state.usersList?.find(u => u.username === username);
    const tempState = {
      ...state,
      usersList: updatedUsersList
    };
    const updatedLogs = logAction(
      tempState,
      'Ubah Kata Sandi',
      `Memperbarui kata sandi akun pengguna ${targetUser?.name || username} (${username})`
    );
    saveState({
      ...tempState,
      logs: updatedLogs
    });
  };

  // Change Current Logged In User
  const changeCurrentUser = (user: User) => {
    if (!state) return;
    saveState({
      ...state,
      currentUser: user
    });
  };

  const updateAppSettings = (settings: Partial<any>) => {
    if (!state) return;
    const nextSettings = { ...state.appSettings, ...settings };
    const tempState = {
      ...state,
      appSettings: nextSettings as any
    };
    const updatedLogs = logAction(
      tempState,
      'Update Identitas Pesantren',
      `Memperbarui profil pondok pesantren dan tahun ajaran.`
    );
    saveState({
      ...tempState,
      logs: updatedLogs
    });
  };

  return {
    state,
    currentUser: state?.currentUser || defaultUsers['Superadmin'],
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
    updateUserStatus,
    removeSystemUser,
    updateSystemUserPassword,
    changeCurrentUser,
  };
}
