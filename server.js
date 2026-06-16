const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const cors = require('cors');

const app = express();
// CORREÇÃO: Porta dinâmica para Render
const PORT = process.env.PORT || 3000;

// ==========================================
// FUNÇÃO DE LIMPEZA - Remove espaços das chaves/valores
// ==========================================
function cleanObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleanKey = key.trim();
    
    if (typeof value === 'string') {
      cleaned[cleanKey] = value.trim();
    } else if (Array.isArray(value)) {
      cleaned[cleanKey] = value.map(v => typeof v === 'string' ? v.trim() : v);
    } else if (typeof value === 'object' && value !== null) {
      cleaned[cleanKey] = cleanObject(value);
    } else {
      cleaned[cleanKey] = value;
    }
  }
  return cleaned;
}

function cleanArray(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map(item => cleanObject(item));
}
// ==========================================

// Configurar lowdb
const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// Inicializar estrutura padrão se não existir
db.defaults({ 
  pinDiario: { pin: '0000', validoAte: '2026-01-01' },
  bebidas: [],
  cardapio: []
}).write();

// ==========================================
// MIDDLEWARES
// ==========================================

// CORS - Permite requisições cross-origin
app.use(cors());

// Parse JSON no corpo das requisições
app.use(express.json({ limit: '10mb' }));

// ==========================================
// MIDDLEWARE DE SEGURANÇA - Redes Privadas
// ==========================================
app.use((req, res, next) => {
  // Em produção (Render), pular verificação de IP
  if (process.env.NODE_ENV === 'production') {
    return next();
  }
  
  const clientIp = req.ip || req.connection.remoteAddress || '';
  
  // Lista de IPs permitidos (redes privadas + localhost)
  const isLocalhost = clientIp === '::1' || 
                      clientIp === '127.0.0.1' || 
                      clientIp === '::ffff:127.0.0.1' ||
                      clientIp === '::ffff:192.168.1.1';
  
  const isPrivateNetwork = clientIp.startsWith('192.168.') ||
                           clientIp.startsWith('10.') ||
                           clientIp.startsWith('172.16.') ||
                           clientIp.startsWith('172.17.') ||
                           clientIp.startsWith('172.18.') ||
                           clientIp.startsWith('172.19.') ||
                           clientIp.startsWith('172.20.') ||
                           clientIp.startsWith('172.21.') ||
                           clientIp.startsWith('172.22.') ||
                           clientIp.startsWith('172.23.') ||
                           clientIp.startsWith('172.24.') ||
                           clientIp.startsWith('172.25.') ||
                           clientIp.startsWith('172.26.') ||
                           clientIp.startsWith('172.27.') ||
                           clientIp.startsWith('172.28.') ||
                           clientIp.startsWith('172.29.') ||
                           clientIp.startsWith('172.30.') ||
                           clientIp.startsWith('172.31.') ||
                           clientIp.startsWith('::ffff:192.168.') ||
                           clientIp.startsWith('::ffff:10.') ||
                           clientIp.startsWith('::ffff:172.');
  
  if (isLocalhost || isPrivateNetwork) {
    console.log(`✅ Acesso permitido: ${clientIp} - ${req.method} ${req.path}`);
    next();
  } else {
    console.log(`❌ Acesso bloqueado: ${clientIp} - ${req.method} ${req.path}`);
    res.status(403).json({ 
      error: 'Acesso restrito à rede interna do restaurante (Rede ADM)',
      ip: clientIp 
    });
  }
});

// Servir arquivos estáticos (index.html, catalogo.json, etc)
app.use(express.static(path.join(__dirname)));

// ==========================================
// ROTAS DA API
// ==========================================

// GET / - Serve o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// GET /catalogo.json - Serve o catálogo estático (LIMPO)
app.get('/catalogo.json', (req, res) => {
  try {
    const catalogo = require('./catalogo.json');
    const cleaned = cleanArray(catalogo);
    res.json(cleaned);
  } catch (error) {
    console.error('Erro ao carregar catalogo.json:', error);
    res.status(500).json({ error: 'Erro ao carregar catálogo' });
  }
});

// ==========================================
// ROTAS DE PIN
// ==========================================

// POST /api/pin/gerar - Gera um novo PIN diário
app.post('/api/pin/gerar', (req, res) => {
  try {
    const novoPin = Math.floor(1000 + Math.random() * 9000).toString();
    const agora = new Date();
    const validoAte = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59);
    
    db.set('pinDiario', { 
      pin: novoPin, 
      validoAte: validoAte.toISOString() 
    }).write();
    
    console.log(`🎲 Novo PIN gerado: ${novoPin} (válido até ${validoAte.toISOString()})`);
    
    res.json({ 
      pin: novoPin, 
      validoAte: validoAte.toISOString(),
      message: 'Novo PIN gerado com sucesso.' 
    });
  } catch (error) {
    console.error('Erro ao gerar PIN:', error);
    res.status(500).json({ error: 'Erro ao gerar PIN' });
  }
});

// POST /api/pin/validar - Valida o PIN diário
app.post('/api/pin/validar', (req, res) => {
  try {
    const { pin } = req.body;
    const pinDiario = db.get('pinDiario').value();
    
    if (!pinDiario || !pinDiario.pin || !pinDiario.validoAte) {
      return res.json({ valid: false, message: 'Nenhum PIN configurado.' });
    }
    
    const agora = new Date();
    const validoAte = new Date(pinDiario.validoAte);
    
    // Comparar PIN e verificar se não expirou
    const pinValido = pinDiario.pin === pin;
    const naoExpirou = agora <= validoAte;
    
    console.log(`🔐 Validação PIN: ${pin} (esperado: ${pinDiario.pin}) - ${pinValido && naoExpirou ? 'VÁLIDO' : 'INVÁLIDO'}`);
    
    if (pinValido && naoExpirou) {
      res.json({ valid: true, message: 'PIN válido.' });
    } else {
      res.json({ 
        valid: false, 
        message: !pinValido ? 'PIN inválido.' : 'PIN expirado.' 
      });
    }
  } catch (error) {
    console.error('Erro ao validar PIN:', error);
    res.status(500).json({ error: 'Erro ao validar PIN' });
  }
});

// ==========================================
// ROTAS DE BEBIDAS
// ==========================================

// GET /api/bebidas - Lista todas as bebidas (LIMPAS)
app.get('/api/bebidas', (req, res) => {
  try {
    const bebidas = db.get('bebidas').value() || [];
    const cleaned = cleanArray(bebidas);
    console.log(`📦 Bebidas retornadas: ${cleaned.length}`);
    res.json(cleaned);
  } catch (error) {
    console.error('Erro ao listar bebidas:', error);
    res.status(500).json({ error: 'Erro ao listar bebidas' });
  }
});

// PUT /api/bebidas/:id - UPSERT (cria ou atualiza)
app.put('/api/bebidas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedData = cleanObject(req.body);
    
    // Garantir que pratosDaCasa é array
    if (updatedData.pratosDaCasa && !Array.isArray(updatedData.pratosDaCasa)) {
      updatedData.pratosDaCasa = [updatedData.pratosDaCasa];
    }
    
    // Limpar pratosDaCasa
    if (updatedData.pratosDaCasa) {
      updatedData.pratosDaCasa = updatedData.pratosDaCasa.map(p => 
        typeof p === 'string' ? p.trim() : p
      );
    }
    
    // Verificar se já existe pelo ID
    const existingById = db.get('bebidas').find({ id: id }).value();
    
    // Verificar se já existe pelo NOME (evitar duplicatas)
    const existingByName = db.get('bebidas')
      .find(b => b.nome && b.nome.toLowerCase() === (updatedData.nome || '').toLowerCase())
      .value();
    
    let bebida;
    
    if (existingById) {
      // UPDATE - Atualizar existente pelo ID
      bebida = db.get('bebidas')
        .find({ id: id })
        .assign(updatedData)
        .write();
      console.log(`✅ Bebida ATUALIZADA: ${bebida.nome} (ID: ${id})`);
    } else if (existingByName) {
      // UPDATE - Atualizar existente pelo NOME (evitar duplicata)
      bebida = db.get('bebidas')
        .find(b => b.nome && b.nome.toLowerCase() === updatedData.nome.toLowerCase())
        .assign({ ...updatedData, id: existingByName.id })
        .write();
      console.log(`✅ Bebida ATUALIZADA (por nome): ${bebida.nome} (ID: ${bebida.id})`);
    } else {
      // CREATE - Criar nova bebida
      const novaBebida = { id: id, ...updatedData };
      db.get('bebidas').push(novaBebida).write();
      bebida = novaBebida;
      console.log(`✅ Bebida CRIADA: ${bebida.nome} (ID: ${id})`);
    }
    
    res.json({ 
      message: 'Bebida salva com sucesso.', 
      bebida: cleanObject(bebida) 
    });
  } catch (error) {
    console.error('Erro ao salvar bebida:', error);
    res.status(500).json({ error: 'Erro ao salvar bebida: ' + error.message });
  }
});

// DELETE /api/bebidas/:id - Remove uma bebida
app.delete('/api/bebidas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    db.get('bebidas').remove({ id: id }).write();
    console.log(`🗑️ Bebida removida: ID ${id}`);
    res.json({ message: 'Bebida removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover bebida:', error);
    res.status(500).json({ error: 'Erro ao remover bebida' });
  }
});

// ==========================================
// ROTAS DE CARDÁPIO
// ==========================================

// GET /api/cardapio - Lista todos os pratos
app.get('/api/cardapio', (req, res) => {
  try {
    // Tenta ler do db.json primeiro
    let cardapio = db.get('cardapio').value();
    
    // Se não tiver no db.json, lê do cardapio.json
    if (!cardapio || cardapio.length === 0) {
      try {
        cardapio = require('./cardapio.json');
        // Salva no db.json para futuras requisições
        db.set('cardapio', cardapio).write();
      } catch (e) {
        cardapio = [];
      }
    }
    
    const cleaned = Array.isArray(cardapio) 
      ? cardapio.map(p => typeof p === 'string' ? p.trim() : p)
      : [];
    
    console.log(`📋 Cardápio retornado: ${cleaned.length} pratos`);
    res.json(cleaned);
  } catch (error) {
    console.error('Erro ao listar cardápio:', error);
    res.status(500).json({ error: 'Erro ao listar cardápio' });
  }
});

// PUT /api/cardapio - Atualiza todo o cardápio
app.put('/api/cardapio', (req, res) => {
  try {
    const novoCardapio = req.body;
    
    if (!Array.isArray(novoCardapio)) {
      return res.status(400).json({ error: 'Cardápio deve ser um array' });
    }
    
    // Limpar cada prato
    const cleaned = novoCardapio.map(p => typeof p === 'string' ? p.trim() : p);
    
    db.set('cardapio', cleaned).write();
    console.log(`✅ Cardápio atualizado: ${cleaned.length} pratos`);
    
    res.json({ 
      message: 'Cardápio atualizado com sucesso.', 
      cardapio: cleaned 
    });
  } catch (error) {
    console.error('Erro ao atualizar cardápio:', error);
    res.status(500).json({ error: 'Erro ao atualizar cardápio' });
  }
});

// ==========================================
// TRATAMENTO DE ERROS GLOBAL
// ==========================================
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`🍷 Servidor Vinho em Mãos rodando!`);
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`🔒 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
});