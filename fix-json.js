const fs = require('fs');
const path = require('path');

// Função recursiva que remove espaços de chaves e valores string
function cleanJson(obj) {
    if (typeof obj === 'string') {
        return obj.trim();
    }
    if (Array.isArray(obj)) {
        return obj.map(item => cleanJson(item));
    }
    if (obj !== null && typeof obj === 'object') {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            cleaned[key.trim()] = cleanJson(value);
        }
        return cleaned;
    }
    return obj;
}

// Lista de arquivos para corrigir
const files = ['db.json', 'catalogo.json', 'cardapio.json', 'package.json'];

console.log('🔧 Iniciando correção dos arquivos JSON...\n');

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Arquivo ${file} não encontrado. Pulando.`);
        return;
    }
    
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        const cleaned = cleanJson(data);
        
        // Salva com formatação bonita (2 espaços)
        fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf-8');
        console.log(`✅ ${file} corrigido com sucesso!`);
    } catch (error) {
        console.error(`❌ Erro ao processar ${file}:`, error.message);
    }
});

console.log('\n🎉 Todos os arquivos foram processados!');
console.log('👉 Agora reinicie o servidor: node server.js');