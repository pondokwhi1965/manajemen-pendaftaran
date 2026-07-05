const fs = require('fs');
let code = fs.readFileSync('./src/components/BackupManager.tsx', 'utf-8');

code = code.replace(
  "onAddSantri?: (data: any) => void;",
  "onAddSantri?: (data: any) => void;\n  onAddSantriBulk?: (data: any[]) => { success: boolean; error?: string; count: number };"
);

code = code.replace(
  "export function BackupManager({ activeRole, state, onRestoreBackup, onResetToDefault, onAddSantri }: BackupManagerProps) {",
  "export function BackupManager({ activeRole, state, onRestoreBackup, onResetToDefault, onAddSantri, onAddSantriBulk }: BackupManagerProps) {"
);

// We need to rewrite the Papa.parse complete method
code = code.replace(
  "results.data.forEach((row: any) => {",
  "const newSantris: any[] = [];\n          results.data.forEach((row: any) => {"
);

const onAddSantriCode = `if (onAddSantri) {
              onAddSantri({
                nomorPendaftaran: String(nomorReg),
                nama: String(nama),
                jenisKelamin: jenisKelamin,
                tempatLahir: String(getVal(['tempat lahir', 'tempat'])),
                tanggalLahir: String(getVal(['tanggal lahir', 'tgl lahir'])),
                alamat: String(getVal(['alamat', 'jalan', 'dusun'])),
                desa: String(getVal(['desa', 'kelurahan'])),
                kecamatan: String(getVal(['kecamatan'])),
                kabupatenKota: String(getVal(['kabupaten', 'kota'])),
                provinsi: String(getVal(['provinsi'])),
                namaAyah: String(getVal(['nama ayah', 'ayah'])),
                namaIbu: String(getVal(['nama ibu', 'ibu'])),
                nomorHpOrangTua: String(getVal(['no hp', 'telepon', 'whatsapp', 'wa'])),
                asalSekolah: String(getVal(['asal sekolah', 'sekolah'])),
                jenjang: jenjang,
                gelombangPendaftaran: 'Gelombang 1',
                statusValidasi: 'Belum Divalidasi',
                berkas: { kk: false, akta: false, ktpOrtu: false, sklIjazah: false },
                tanggalDaftar: new Date().toISOString().split('T')[0]
              });
              count++;
            }`;

const replacementCode = `newSantris.push({
              nomorPendaftaran: String(nomorReg),
              nama: String(nama),
              jenisKelamin: jenisKelamin,
              tempatLahir: String(getVal(['tempat lahir', 'tempat'])),
              tanggalLahir: String(getVal(['tanggal lahir', 'tgl lahir'])),
              alamat: String(getVal(['alamat', 'jalan', 'dusun'])),
              desa: String(getVal(['desa', 'kelurahan'])),
              kecamatan: String(getVal(['kecamatan'])),
              kabupatenKota: String(getVal(['kabupaten', 'kota'])),
              provinsi: String(getVal(['provinsi'])),
              namaAyah: String(getVal(['nama ayah', 'ayah'])),
              namaIbu: String(getVal(['nama ibu', 'ibu'])),
              nomorHpOrangTua: String(getVal(['no hp', 'telepon', 'whatsapp', 'wa'])),
              asalSekolah: String(getVal(['asal sekolah', 'sekolah'])),
              jenjang: jenjang,
              gelombangPendaftaran: 'Gelombang 1',
              statusValidasi: 'Belum Divalidasi',
              berkas: { kk: false, akta: false, ktpOrtu: false, sklIjazah: false },
              tanggalDaftar: new Date().toISOString().split('T')[0]
            });`;

code = code.replace(onAddSantriCode, replacementCode);

const countCheckCode = `if (count > 0) {
            setSuccessMsg(\`🟢 Berhasil mengimpor \${count} data santri dari spreadsheet!\`);
          } else {
            setErrorMsg('Tidak ditemukan data santri yang valid dalam spreadsheet.');
          }`;

const replacementCountCheckCode = `if (newSantris.length > 0 && onAddSantriBulk) {
            const result = onAddSantriBulk(newSantris);
            if (result && result.success) {
              setSuccessMsg(\`🟢 Berhasil mengimpor \${result.count} data santri dari spreadsheet!\`);
            } else {
              setErrorMsg(result?.error || 'Gagal mengimpor data santri.');
            }
          } else {
            setErrorMsg('Tidak ditemukan data santri yang valid dalam spreadsheet.');
          }`;

code = code.replace(countCheckCode, replacementCountCheckCode);

fs.writeFileSync('./src/components/BackupManager.tsx', code);
