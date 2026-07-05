const fs = require('fs');
let code = fs.readFileSync('./src/App.tsx', 'utf-8');

// First, fix destructuring
code = code.replace(
  "const { state, filteredState, saveState, searchTerm, setSearchTerm, activeTab, setActiveTab",
  "const { state, filteredState, saveState, searchTerm, setSearchTerm, activeTab, setActiveTab, addSantriBulk"
);

// We need to only pass it to BackupManager, not SantriManager
code = code.replace(
  "              <SantriManager\n                santriList={filteredState.santriList}\n                tagihanMap={filteredState.tagihanMap}\n                activeRole={currentUser.role}\n                onAddSantri={addSantri}\n                onAddSantriBulk={addSantriBulk}",
  "              <SantriManager\n                santriList={filteredState.santriList}\n                tagihanMap={filteredState.tagihanMap}\n                activeRole={currentUser.role}\n                onAddSantri={addSantri}"
);

fs.writeFileSync('./src/App.tsx', code);
