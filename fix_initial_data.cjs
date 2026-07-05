const fs = require('fs');
let fileContent = fs.readFileSync('src/initialData.ts', 'utf8');

const emptySantriStr = `export const initialSantriList: Santri[] = [
  {
    nomorPendaftaran: '',
    nik: '',
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
    jenjang: 'SMP Al-Hidayah',
    gelombangPendaftaran: 'Gelombang 1',
    status: 'Belum Bayar',
    tanggalDaftar: '',
  }
];`;

const initialTagihanMapStr = `export const initialTagihanMap: Record<string, TagihanItem[]> = {};`;
const initialPembayaranListStr = `export const initialPembayaranList: Pembayaran[] = [];`;
const initialLogsStr = `export const initialLogs: LogAktivitas[] = [];`;

fileContent = fileContent.replace(/export const initialSantriList: Santri\[\] = \[[\s\S]*?\];/m, emptySantriStr);
fileContent = fileContent.replace(/export const initialTagihanMap: Record<string, TagihanItem\[\]> = \{[\s\S]*?\};/m, initialTagihanMapStr);
fileContent = fileContent.replace(/export const initialPembayaranList: Pembayaran\[\] = \[[\s\S]*?\];/m, initialPembayaranListStr);
fileContent = fileContent.replace(/export const initialLogs: LogAktivitas\[\] = \[[\s\S]*?\];/m, initialLogsStr);

fs.writeFileSync('src/initialData.ts', fileContent);
