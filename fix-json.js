const fs = require('fs');
const path = require('path');

// Função para limpar espaços de chaves e valores
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

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
        try {
            // Lê o arquivo
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // Faz o parse (se tiver espaços nas chaves, JSON.parse pode falhar em alguns casos)
            // Por isso usamos uma abordagem mais segura:
            let data;
            try {
                data = JSON.parse(content);
            } catch (e) {
                console.error(`❌ Erro ao parsear ${file}:`, e.message);
                return;
            }
            
            // Limpa os espaços
            const cleaned = cleanJson(data);
            
            // Salva com formatação bonita (2 espaços de indentação)
            fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf-8');
            
            console.log(`✅ ${file} corrigido com sucesso!`);
        } catch (error) {
            console.error(`❌ Erro ao processar ${file}:`, error.message);
        }
    } else {
        console.warn(`⚠️  Arquivo ${file} não encontrado.`);
    }
});

console.log('\n🎉 Todos os arquivos foram processados!');