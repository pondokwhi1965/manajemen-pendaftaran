export type Role = 'Superadmin' | 'Admin Putri' | 'Admin Putra' | 'Admin Umum';

export interface User {
  username: string;
  name: string;
  role: Role;
  password?: string;
  isActive?: boolean;
}

export interface LoginSettings {
  loginRequired: boolean;
}

export interface Santri {
  nomorPendaftaran: string; // e.g., REG-2026-001
  nama: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string; // Jalan/Dusun
  desa: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  
  // A. Identitas Santri
  anakKe?: string;
  jumlahSaudara?: string;
  nik?: string;
  noKk?: string;

  // B. Kelembagaan
  asalSekolah: string;
  npsnAsal?: string;
  alamatSekolahAsal?: string;
  nisn?: string;
  mendaftarKelas?: string;

  // C. Alamat
  rt?: string;
  rw?: string;
  kodePos?: string;

  // D. Data Ayah
  namaAyah: string;
  nikAyah?: string;
  statusAyah?: 'Hidup' | 'Wafat';
  tempatLahirAyah?: string;
  tanggalLahirAyah?: string;
  pendidikanAyah?: string;
  pekerjaanAyah?: string;
  penghasilanAyah?: string;
  noHpAyah?: string;

  // Data Ibu
  namaIbu: string;
  nikIbu?: string;
  statusIbu?: 'Hidup' | 'Wafat';
  tempatLahirIbu?: string;
  tanggalLahirIbu?: string;
  pendidikanIbu?: string;
  pekerjaanIbu?: string;
  penghasilanIbu?: string;
  noHpIbu?: string;

  // E. Identitas Wali
  namaWali?: string;
  tempatLahirWali?: string;
  pendidikanWali?: string;
  penghasilanWali?: string;
  nikWali?: string;
  tanggalLahirWali?: string;
  pekerjaanWali?: string;
  noHpWali?: string;

  nomorHpOrangTua: string; // Nomor WhatsApp aktif (untuk konfirmasi pendaftaran)
  jenjang: string;
  gelombangPendaftaran: string;
  status: 'Belum Bayar' | 'Cicilan' | 'Lunas';
  tanggalDaftar: string;
  statusValidasi?: 'Belum Divalidasi' | 'Valid' | 'Tidak Valid';
  userVerificationStatus?: 'Pending' | 'Verified' | 'Correction Requested';
  correctionRequestMessage?: string;
  tanggalVerifikasiUser?: string;
  berkas?: {
    kk: boolean;
    akta: boolean;
    ktpOrtu: boolean;
    sklIjazah: boolean;
  };
  isAccepted?: boolean;
}

export interface Biaya {
  id: string;
  jenisBiaya: string;
  nominal: number;
  kategoriGender?: 'Semua' | 'Laki-laki' | 'Perempuan';
}

export interface TagihanItem {
  id: string;
  jenisBiaya: string;
  nominal: number;
  terbayar: number;
}

// Map Santri ID to their tagihan items
export interface SantriTagihan {
  nomorPendaftaran: string;
  items: TagihanItem[];
}

export interface Pembayaran {
  nomorTransaksi: string; // e.g., KWT-2026-0001
  tanggal: string;
  nomorPendaftaran: string;
  namaSantri: string;
  itemsDetail: { jenisBiaya: string; nominal: number }[]; // list of item payments made in this transaction
  nominal: number; // total in this transaction
  metodePembayaran: 'Tunai' | 'Transfer' | 'QRIS';
  bendahara: string;
  catatan: string;
  status: 'Sukses' | 'Dibatalkan';
  alasanPembatalan?: string;
  dibatalkanOleh?: string;
  tanggalPembatalan?: string;
}

export interface LogAktivitas {
  id: string;
  tanggal: string;
  user: string;
  role: Role;
  aktivitas: string;
  keterangan: string;
}

export interface AppSettings {
  pondokName: string;
  tahunAjaran: string;
  isRegistrationOpen: boolean;
  isGuideActive: boolean;
  guideUrl: string;
  pondokAddress: string;
  waTemplate: string;
  heroImageUrl: string;
  logoUrl?: string;
  formFields: FormFieldConfig[];
  jenjangOptions?: string[];
  gelombangOptions?: string[];
  jenisLembaga?: string;
  sebutanSiswa?: string;
  sebutanSiswaCustom?: string;
  addressLevel?: 'desa' | 'kecamatan' | 'kabupatenKota' | 'provinsi';
}

export interface FormFieldConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface SystemState {
  santriList: Santri[];
  biayaList: Biaya[];
  tagihanMap: Record<string, TagihanItem[]>; // Key: nomorPendaftaran
  pembayaranList: Pembayaran[];
  logs: LogAktivitas[];
  currentUser: User;
  usersList: User[];
  loginSettings: LoginSettings;
  appSettings: AppSettings;
}

export function getTerminology(appSettings?: AppSettings | null, options?: { capitalize?: boolean }) {
  if (!appSettings) return options?.capitalize ? 'Santri' : 'santri';
  let term = appSettings.sebutanSiswa || 'Santri';
  if (term === 'Lainnya') {
    term = appSettings.sebutanSiswaCustom || 'Santri';
  }
  if (options?.capitalize) {
    return term.charAt(0).toUpperCase() + term.slice(1);
  }
  return term.toLowerCase();
}

export function getInstitutionType(appSettings?: AppSettings | null) {
  if (!appSettings) return 'Pondok Pesantren';
  return appSettings.jenisLembaga || 'Pondok Pesantren';
}
