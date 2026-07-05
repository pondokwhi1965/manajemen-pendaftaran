const fs = require('fs');
let code = fs.readFileSync('./src/hooks/useAppState.ts', 'utf-8');

const syncTagihanStr = `
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
`;

code = code.replace("  // Master Biaya: Add Fee", syncTagihanStr + "\n  // Master Biaya: Add Fee");

code = code.replace(
  "const updatedBiayaList = [...state.biayaList, newBiaya];",
  "const updatedBiayaList = [...state.biayaList, newBiaya];\n    const updatedTagihanMap = syncTagihanMapWithBiaya(state.santriList, state.tagihanMap, updatedBiayaList);"
);
code = code.replace(
  "biayaList: updatedBiayaList,\n    };",
  "biayaList: updatedBiayaList,\n      tagihanMap: updatedTagihanMap,\n    };"
);

code = code.replace(
  "const updatedBiayaList = state.biayaList.map(b => {",
  "const updatedBiayaList = state.biayaList.map(b => {"
);
code = code.replace(
  "const tempState = {\n      ...state,\n      biayaList: updatedBiayaList,\n    };",
  "const updatedTagihanMap = syncTagihanMapWithBiaya(state.santriList, state.tagihanMap, updatedBiayaList);\n    const tempState = {\n      ...state,\n      biayaList: updatedBiayaList,\n      tagihanMap: updatedTagihanMap,\n    };"
);

code = code.replace(
  "const updatedBiayaList = state.biayaList.filter(b => b.id !== id);",
  "const updatedBiayaList = state.biayaList.filter(b => b.id !== id);\n    const updatedTagihanMap = syncTagihanMapWithBiaya(state.santriList, state.tagihanMap, updatedBiayaList);"
);
// Careful with replace for deleteBiaya tempState
let deleteTempStateIndex = code.indexOf("const tempState = {", code.indexOf("deleteBiaya"));
let deleteBiayaListIndex = code.indexOf("biayaList: updatedBiayaList,", deleteTempStateIndex);
code = code.slice(0, deleteBiayaListIndex + "biayaList: updatedBiayaList,".length) + "\n      tagihanMap: updatedTagihanMap," + code.slice(deleteBiayaListIndex + "biayaList: updatedBiayaList,".length);

fs.writeFileSync('./src/hooks/useAppState.ts', code);
