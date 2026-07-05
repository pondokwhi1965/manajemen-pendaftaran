const fs = require('fs');
let code = fs.readFileSync('./src/components/BackupManager.tsx', 'utf-8');

// Add papaparse import
code = code.replace(
  "import { Role, SystemState, Santri } from '../types';",
  "import { Role, SystemState, Santri } from '../types';\nimport Papa from 'papaparse';"
);

// Add state for Spreadsheet Link
code = code.replace(
  "const [showResetConfirm, setShowResetConfirm] = useState(false);",
  "const [showResetConfirm, setShowResetConfirm] = useState(false);\n  const [spreadsheetLink, setSpreadsheetLink] = useState('');\n  const [importingSheet, setImportingSheet] = useState(false);"
);

// Add Spreadsheet Logic
const spreadSheetLogic = `
  const handleImportSpreadsheet = async () => {
    if (!spreadsheetLink) {
      setErrorMsg('Tautan spreadsheet tidak boleh kosong.');
      return;
    }

    // Extract ID
    const match = spreadsheetLink.match(/\\/d\\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      setErrorMsg('Tautan tidak valid. Pastikan format Google Sheets benar.');
      return;
    }
    const sheetId = match[1];
    const exportUrl = \`https://docs.google.com/spreadsheets/d/\${sheetId}/export?format=csv\`;

    setImportingSheet(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error('Gagal mengakses spreadsheet. Pastikan link dapat diakses publik (Anyone with the link can view).');
      }
      
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          let count = 0;
          results.data.forEach((row: any) => {
            // Try to auto-map based on common keywords
            const getVal = (keywords: string[]) => {
              const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
              return key ? row[key] : '';
            };

            const nama = getVal(['nama', 'name']);
            if (!nama) return; // Skip if no name

            const jkRaw = getVal(['jenis kelamin', 'kelamin', 'gender', 'jk']).toLowerCase();
            const jenisKelamin = (jkRaw.includes('perempuan') || jkRaw === 'p' || jkRaw === 'pr') ? 'Perempuan' : 'Laki-laki';
            
            let jenjangRaw = getVal(['jenjang', 'tingkat', 'kelas']);
            let jenjang = 'SMP AL-HIDAYAH'; // Default
            if (jenjangRaw.toUpperCase().includes('SD')) jenjang = 'SDI AL-HIDAYAH';
            if (jenjangRaw.toUpperCase().includes('SMK')) jenjang = 'SMK AL-HIDAYAH';
            
            const nomorReg = getVal(['nomor', 'registrasi', 'pendaftaran', 'no reg', 'noreg']) || \`REG-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`;
            
            if (onAddSantri) {
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
            }
          });
          
          if (count > 0) {
            setSuccessMsg(\`🟢 Berhasil mengimpor \${count} data santri dari spreadsheet!\`);
          } else {
            setErrorMsg('Tidak ditemukan data santri yang valid dalam spreadsheet.');
          }
          setImportingSheet(false);
          setSpreadsheetLink('');
        },
        error: (error: any) => {
          setErrorMsg(\`Gagal parsing CSV: \${error.message}\`);
          setImportingSheet(false);
        }
      });
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal mengimpor dari spreadsheet.');
      setImportingSheet(false);
    }
  };
`;

code = code.replace(
  "// 3. FILE UPLOAD PARSERS",
  spreadSheetLogic + "\n  // 3. FILE UPLOAD PARSERS"
);

// Add the UI Card for Spreadsheet Import
const spreadsheetCardUI = `
        {/* Card 3: Google Sheets Import */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-4 md:col-span-2">
          <div className="space-y-2">
            <div className="bg-emerald-50 text-emerald-700 w-10 h-10 rounded-lg flex items-center justify-center border border-emerald-100">
              <Database size={20} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Impor Data Santri (Google Form / Spreadsheet)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Impor otomatis data responden formulir eksternal. Pastikan akses tautan diatur ke <strong className="text-slate-700">"Siapa saja yang memiliki tautan dapat melihat" (Anyone with the link can view)</strong>. Sistem akan otomatis mendeteksi kolom seperti Nama, Jenis Kelamin, dsb.
            </p>
          </div>

          {canModify ? (
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <input
                type="text"
                placeholder="Tempel tautan Google Sheets di sini..."
                value={spreadsheetLink}
                onChange={(e) => setSpreadsheetLink(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
              <button
                onClick={handleImportSpreadsheet}
                disabled={importingSheet}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap"
              >
                {importingSheet ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {importingSheet ? 'Memproses...' : 'Impor Data'}
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-xl font-semibold border border-amber-200 inline-block mt-2">
              Hanya bisa diakses oleh role super admin
            </div>
          )}
        </div>
`;

code = code.replace(
  "{/* Safety Factory Reset */}",
  spreadsheetCardUI + "\n      {/* Safety Factory Reset */}"
);

fs.writeFileSync('./src/components/BackupManager.tsx', code);
