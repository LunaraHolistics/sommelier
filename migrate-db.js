// migrate-db.js - Converte db.json antigo para nova estrutura
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');
const newDbPath = path.join(__dirname, 'data', 'db.json');

if (!fs.existsSync(dbPath)) {
  console.log('⚠️  db.json não encontrado. Criando novo...');
  const newDb = {
    inventory: {},
    pin: null,
    adminPassword: 'sommelier2026'
  };
  fs.writeFileSync(newDbPath, JSON.stringify(newDb, null, 2));
  console.log('✅ Novo db.json criado em data/db.json');
  process.exit(0);
}

const oldDb = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// Converte array "bebidas" para mapa "inventory"
const inventory = {};
if (oldDb.bebidas && Array.isArray(oldDb.bebidas)) {
  oldDb.bebidas.forEach(bebida => {
    inventory[bebida.id] = {
      price: bebida.preco || 0,
      stock: bebida.estoque || 0,
      active: bebida.disponivel !== false
    };
  });
}

// Nova estrutura
const newDb = {
  inventory,
  pin: oldDb.pinDiario ? {
    code: oldDb.pinDiario.pin,
    expiresAt: oldDb.pinDiario.validoAte,
    generatedAt: oldDb.pinDiario.geradoEm || new Date().toISOString()
  } : null,
  adminPassword: process.env.ADMIN_PASSWORD || 'sommelier2026'
};

fs.writeFileSync(newDbPath, JSON.stringify(newDb, null, 2));
console.log('✅ Migração concluída!');
console.log(`📦 Itens migrados: ${Object.keys(inventory).length}`);
console.log(` Novo db.json em: ${newDbPath}`);