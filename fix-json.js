/**
 * Script de Limpeza de Arquivos JSON
 * Remove espaços extras das chaves e valores string
 * 
 * Uso: node fix-json.js
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURAÇÃO
// ==========================================
const ARQUIVOS_PARA_LIMPAR = [
    'db.json',
    'catalogo.json',
    'cardapio.json',
    'package.json'
];

const DIRETORIO_BASE = __dirname;
const CRIAR_BACKUP = true; // Define como false se não quiser backup

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Remove espaços de chaves e valores string recursivamente
 */
function limparJson(obj) {
    if (typeof obj === 'string') {
        return obj.trim();
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => limparJson(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
        const limpo = {};
        for (const [chave, valor] of Object.entries(obj)) {
            const chaveLimpa = chave.trim();
            limpo[chaveLimpa] = limparJson(valor);
        }
        return limpo;
    }
    
    return obj;
}

/**
 * Conta quantos espaços foram removidos (para estatísticas)
 */
function contarEspacos(texto) {
    const matches = texto.match(/"\s+":\s*"|"\s+":\s*\[|"\s+":\s*\d|"\s+":\s*true|"\s+":\s*false|"\s+":\s*null/g);
    return matches ? matches.length : 0;
}

/**
 * Cria backup do arquivo original
 */
function criarBackup(caminhoArquivo) {
    const backupPath = caminhoArquivo + '.backup';
    fs.copyFileSync(caminhoArquivo, backupPath);
    return backupPath;
}

/**
 * Processa um arquivo JSON
 */
function processarArquivo(nomeArquivo) {
    const caminhoCompleto = path.join(DIRETORIO_BASE, nomeArquivo);
    
    console.log(`\n📄 Processando: ${nomeArquivo}`);
    console.log('─'.repeat(50));
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(caminhoCompleto)) {
        console.log(`⚠️  Arquivo não encontrado. Pulando.`);
        return { sucesso: false, motivo: 'não encontrado' };
    }
    
    try {
        // Ler conteúdo original
        const conteudoOriginal = fs.readFileSync(caminhoCompleto, 'utf-8');
        
        // Criar backup se configurado
        if (CRIAR_BACKUP) {
            const backupPath = criarBackup(caminhoCompleto);
            console.log(`💾 Backup criado: ${path.basename(backupPath)}`);
        }
        
        // Parsear JSON
        let dados;
        try {
            dados = JSON.parse(conteudoOriginal);
        } catch (parseError) {
            console.log(`❌ Erro ao parsear JSON: ${parseError.message}`);
            return { sucesso: false, motivo: 'JSON inválido' };
        }
        
        // Limpar dados
        const dadosLimpos = limparJson(dados);
        
        // Contar espaços removidos
        const espacosRemovidos = contarEspacos(conteudoOriginal);
        
        // Salvar arquivo limpo
        const conteudoFormatado = JSON.stringify(dadosLimpos, null, 2);
        fs.writeFileSync(caminhoCompleto, conteudoFormatado, 'utf-8');
        
        // Estatísticas
        const tamanhoOriginal = conteudoOriginal.length;
        const tamanhoLimpo = conteudoFormatado.length;
        const reducao = tamanhoOriginal - tamanhoLimpo;
        
        console.log(`✅ Arquivo limpo com sucesso!`);
        console.log(`📊 Estatísticas:`);
        console.log(`   • Espaços removidos: ${espacosRemovidos}`);
        console.log(`   • Tamanho original: ${tamanhoOriginal} bytes`);
        console.log(`   • Tamanho final: ${tamanhoLimpo} bytes`);
        console.log(`   • Redução: ${reducao} bytes (${((reducao/tamanhoOriginal)*100).toFixed(1)}%)`);
        
        return { sucesso: true, espacosRemovidos, reducao };
        
    } catch (error) {
        console.log(`❌ Erro ao processar: ${error.message}`);
        return { sucesso: false, motivo: error.message };
    }
}

// ==========================================
// EXECUÇÃO PRINCIPAL
// ==========================================

console.log('🔧 SCRIPT DE LIMPEZA DE JSON');
console.log('═'.repeat(50));
console.log(`📁 Diretório: ${DIRETORIO_BASE}`);
console.log(`📋 Arquivos: ${ARQUIVOS_PARA_LIMPAR.join(', ')}`);
console.log(`💾 Backup: ${CRIAR_BACKUP ? 'SIM' : 'NÃO'}`);

let totalSucessos = 0;
let totalFalhas = 0;
let totalEspacos = 0;
let totalReducao = 0;

// Processar cada arquivo
for (const arquivo of ARQUIVOS_PARA_LIMPAR) {
    const resultado = processarArquivo(arquivo);
    
    if (resultado.sucesso) {
        totalSucessos++;
        totalEspacos += resultado.espacosRemovidos || 0;
        totalReducao += resultado.reducao || 0;
    } else {
        totalFalhas++;
    }
}

// Resumo final
console.log('\n' + '═'.repeat(50));
console.log('📊 RESUMO FINAL');
console.log('═'.repeat(50));
console.log(`✅ Sucessos: ${totalSucessos}`);
console.log(`❌ Falhas: ${totalFalhas}`);
console.log(`🔢 Total de espaços removidos: ${totalEspacos}`);
console.log(`📉 Redução total: ${totalReducao} bytes`);
console.log('═'.repeat(50));

if (totalSucessos > 0) {
    console.log('\n✨ LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Reinicie o servidor: node server.js');
    console.log('   2. Teste o sistema no navegador');
    console.log('   3. Se tudo estiver OK, pode apagar os arquivos .backup');
} else {
    console.log('\n⚠️  NENHUM ARQUIVO FOI PROCESSADO COM SUCESSO');
    console.log('   Verifique os erros acima e tente novamente.');
}

console.log('\n');