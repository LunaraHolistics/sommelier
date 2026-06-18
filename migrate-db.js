// migrate-db.js - Converte db.json antigo para nova estrutura híbrida
const fs = require('fs');
const path = require('path');

const oldDbPath = path.join(__dirname, 'db.json');
const newDbPath = path.join(__dirname, 'data', 'db.json');

// Cria pasta data se não existir
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Lê db antigo
const oldDb = JSON.parse(fs.readFileSync(oldDbPath, 'utf-8'));

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

// Salva novo db
fs.writeFileSync(newDbPath, JSON.stringify(newDb, null, 2));

console.log('✅ Migração concluída!');
console.log(`📦 Itens migrados: ${Object.keys(inventory).length}`);
console.log(`📍 Novo db.json em: ${newDbPath}`);
console.log('\n⚠️  Próximos passos:');
console.log('1. Mova catalogo.json, cardapio.json e tags.json para /data/');
console.log('2. Delete o db.json antigo da raiz');
console.log('3. Execute: npm start');