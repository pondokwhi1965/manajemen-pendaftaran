const fs = require('fs');
let code = fs.readFileSync('./src/App.tsx', 'utf-8');
code = code.replace(
  "onResetToDefault={resetToDefault}",
  "onResetToDefault={resetToDefault}\n                onAddSantri={addSantri}"
);
fs.writeFileSync('./src/App.tsx', code);
