const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');
const dbContent = {
  inventory: {},
  pin: null,
  adminPassword: "sommelier2026"
};

fs.writeFileSync(dbPath, JSON.stringify(dbContent, null, 2), 'utf8');
console.log('✅ db.json criado com sucesso!');