const fs = require('fs');
let code = fs.readFileSync('./src/App.tsx', 'utf-8');

code = code.replace(
  "              <SantriManager\n                santriList={filteredState.santriList}\n                tagihanMap={filteredState.tagihanMap}\n                activeRole={currentUser.role}\n                onAddSantri={addSantri}\n                onAddSantriBulk={addSantriBulk}",
  "              <SantriManager\n                santriList={filteredState.santriList}\n                tagihanMap={filteredState.tagihanMap}\n                activeRole={currentUser.role}\n                onAddSantri={addSantri}"
);

fs.writeFileSync('./src/App.tsx', code);
