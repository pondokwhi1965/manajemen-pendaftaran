import { Santri, Biaya, TagihanItem, Pembayaran, LogAktivitas } from './types';

export const initialBiayaList: Biaya[] = [
  { id: 'fee-001', jenisBiaya: 'Formulir', nominal: 100000 },
  { id: 'fee-002', jenisBiaya: 'Uang Pangkal', nominal: 2000000 },
  { id: 'fee-003', jenisBiaya: 'Seragam', nominal: 500000 },
  { id: 'fee-004', jenisBiaya: 'Kitab', nominal: 300000 },
  { id: 'fee-005', jenisBiaya: 'SPP Bulan Pertama', nominal: 250000 },
];

export const initialSantriList: Santri[] = [
  {
    nomorPendaftaran: '',
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
    jenjang: 'SMP AL-HIDAYAH',
    gelombangPendaftaran: 'Gelombang 1',
    status: 'Belum Bayar',
    tanggalDaftar: '',
  }
];

export const initialTagihanMap: Record<string, TagihanItem[]> = {};

export const initialPembayaranList: Pembayaran[] = [];

export const initialLogs: LogAktivitas[] = [];
