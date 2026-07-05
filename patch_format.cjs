const fs = require('fs');

// Patch PembayaranManager.tsx
let codeP = fs.readFileSync('./src/components/PembayaranManager.tsx', 'utf-8');
codeP = codeP.replace(
  "{s.nama} ({s.nomorPendaftaran}) - {s.jenjang}",
  "{s.nomorPendaftaran} - {s.nama}"
);
fs.writeFileSync('./src/components/PembayaranManager.tsx', codeP);

// Patch LaporanManager.tsx
let codeL = fs.readFileSync('./src/components/LaporanManager.tsx', 'utf-8');
codeL = codeL.replace(
  "{s.nama} ({s.nomorPendaftaran}) - {s.jenjang}",
  "{s.nomorPendaftaran} - {s.nama}"
);
fs.writeFileSync('./src/components/LaporanManager.tsx', codeL);

