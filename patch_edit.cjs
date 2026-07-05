const fs = require('fs');
let code = fs.readFileSync('./src/hooks/useAppState.ts', 'utf-8');

code = code.replace(
  "delete updatedTagihanMap[oldReg];\n      }\n    }",
  "delete updatedTagihanMap[oldReg];\n      }\n    }\n\n    // Recalculate bills in case gender changed\n    const fullUpdatedTagihanMap = syncTagihanMapWithBiaya(updatedSantriList, updatedTagihanMap, state.biayaList);"
);

code = code.replace(
  "tagihanMap: updatedTagihanMap,\n      pembayaranList: updatedPembayaranList,",
  "tagihanMap: fullUpdatedTagihanMap,\n      pembayaranList: updatedPembayaranList,"
);

fs.writeFileSync('./src/hooks/useAppState.ts', code);
