const fs = require('fs');
let code = fs.readFileSync('./src/hooks/useAppState.ts', 'utf-8');

const bulkLogic = `
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
        nomorPendaftaran = \`\${currentYear}\${String(nextSeqNum).padStart(3, '0')}\`;
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
      \`Mengimpor \${successCount} data santri secara massal (Bulk Import)\`
    );
    
    saveState({ ...tempState, logs: updatedLogs });
    return { success: true, count: successCount };
  };
`;

code = code.replace(
  "const editSantri = (nomorPendaftaran: string,",
  bulkLogic + "\n  const editSantri = (nomorPendaftaran: string,"
);

code = code.replace(
  "addSantri,",
  "addSantri,\n    addSantriBulk,"
);

fs.writeFileSync('./src/hooks/useAppState.ts', code);
