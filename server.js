/**
 * 🍷 Vinho em Mãos - Servidor API
 * Sistema de gerenciamento de bebidas e cardápio para restaurante
 * 
 * @version 2.0.0
 * @environment Node.js + Express + LowDB
 */

const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet'); // Segurança HTTP
const rateLimit = require('express-rate-limit'); // Proteção contra brute-force
const compression = require('compression'); // Gzip compression

// ==========================================
// CONFIGURAÇÃO DO AMBIENTE
// ==========================================
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  pinLength: 4,
  dbPath: path.join(__dirname, 'db.json'),
  logLevel: process.env.LOG_LEVEL || 'info' // 'debug' | 'info' | 'warn' | 'error'
};

// ==========================================
// UTILITÁRIOS
// ==========================================

/**
 * Limpa espaços em branco de chaves e valores de objetos
 * @param {Object|Array} obj - Objeto ou array a ser limpo
 * @returns {Object|Array} Objeto/array limpo
 */
function cleanObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item));
  }
  
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

/**
 * Logger simplificado com níveis
 */
const logger = {
  debug: (msg, data) => config.logLevel === 'debug' && console.log(`[DEBUG] ${msg}`, data || ''),
  info: (msg, data) => ['info', 'debug'].includes(config.logLevel) && console.log(`[INFO] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
  error: (msg, error) => console.error(`[ERROR] ${msg}`, error?.stack || error || '')
};

// ==========================================
// INICIALIZAÇÃO DO EXPRESS
// ==========================================
const app = express();

// Middleware de segurança HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitado para desenvolvimento; configurar em produção
  crossOriginEmbedderPolicy: false
}));

// Compression para reduzir tamanho das respostas
app.use(compression());

// CORS configurável
app.use(cors({
  origin: config.nodeEnv === 'production' 
    ? (req, callback) => {
        const origin = req.headers.origin;
        if (config.allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origem não permitida'));
        }
      }
    : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Parse JSON com limite configurável
app.use(express.json({ 
  limit: '10mb',
  strict: true 
}));

// Parse URL-encoded (para formulários)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// RATE LIMITING - Proteção contra ataques
// ==========================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.nodeEnv === 'production' ? 100 : 1000, // Limite de requisições por IP
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.nodeEnv !== 'production' // Desabilita em desenvolvimento
});

const pinLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // Máximo 5 tentativas de PIN
  message: { error: 'Muitas tentativas de PIN. Aguarde 5 minutos.' },
  keyGenerator: (req) => req.ip // Limita por IP
});

// Aplicar rate limiting nas rotas de API
app.use('/api', apiLimiter);
app.use('/api/pin', pinLimiter);

// ==========================================
// BANCO DE DADOS (LowDB)
// ==========================================
const adapter = new FileSync(config.dbPath);
const db = low(adapter);

// Estrutura padrão do banco
const defaultState = {
  pinDiario: { 
    pin: '0000', 
    validoAte: new Date(Date.now() + 24*60*60*1000).toISOString(),
    geradoEm: new Date().toISOString()
  },
  bebidas: [],
  cardapio: [],
  metadata: {
    ultimaAtualizacao: null,
    versao: '2.0.0'
  }
};

// Inicializa banco se necessário
db.defaults(defaultState).write();

// ==========================================
// MIDDLEWARE DE SEGURANÇA - Rede Privada
// ==========================================
app.use((req, res, next) => {
  // Em produção (Render/Cloud), confiar no proxy/reverse proxy
  if (config.nodeEnv === 'production') {
    return next();
  }
  
  const clientIp = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
  
  const isLocalhost = [
    '::1', '127.0.0.1', '::ffff:127.0.0.1', '::ffff:192.168.1.1'
  ].includes(clientIp);
  
  const privatePrefixes = [
    '192.168.', '10.', '172.16.', '172.17.', '172.18.', '172.19.',
    '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
    '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
    '::ffff:192.168.', '::ffff:10.', '::ffff:172.'
  ];
  
  const isPrivateNetwork = privatePrefixes.some(prefix => clientIp.startsWith(prefix));
  
  if (isLocalhost || isPrivateNetwork) {
    logger.debug(`✅ Acesso permitido`, { ip: clientIp, path: req.path });
    next();
  } else {
    logger.warn(`❌ Acesso bloqueado`, { ip: clientIp, path: req.path });
    res.status(403).json({ 
      error: 'Acesso restrito à rede interna',
      timestamp: new Date().toISOString()
    });
  }
});

// ==========================================
// SERVIDOR DE ARQUIVOS ESTÁTICOS
// ==========================================
const staticOptions = {
  maxAge: config.nodeEnv === 'production' ? '1d' : '0',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
};

app.use(express.static(path.join(__dirname), staticOptions));

// ==========================================
// ROTAS PÚBLICAS
// ==========================================

// Health Check - Para monitoramento
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: '2.0.0'
  });
});

// Root - Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catálogo estático (com cache)
let catalogoCache = null;
let catalogoCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

app.get('/catalogo.json', (req, res) => {
  try {
    const now = Date.now();
    
    // Retorna do cache se válido
    if (catalogoCache && (now - catalogoCacheTime) < CACHE_TTL) {
      res.set('X-Cache', 'HIT');
      return res.json(catalogoCache);
    }
    
    // Carrega e limpa o catálogo
    const catalogo = require('./catalogo.json');
    catalogoCache = cleanArray(catalogo);
    catalogoCacheTime = now;
    
    res.set('X-Cache', 'MISS');
    res.json(catalogoCache);
    
  } catch (error) {
    logger.error('Erro ao carregar catalogo.json', error);
    res.status(500).json({ 
      error: 'Erro ao carregar catálogo',
      timestamp: new Date().toISOString()
    });
  }
});

// ==========================================
// ROTAS DE PIN (Autenticação Admin)
// ==========================================

/**
 * Gera um novo PIN diário aleatório
 */
app.post('/api/pin/gerar', (req, res) => {
  try {
    const novoPin = cryptoRandomString({ length: config.pinLength, type: 'numeric' });
    const agora = new Date();
    const validoAte = new Date(agora);
    validoAte.setHours(23, 59, 59, 999);
    
    const pinData = {
      pin: novoPin,
      validoAte: validoAte.toISOString(),
      geradoEm: agora.toISOString(),
      ipOrigem: req.ip
    };
    
    db.set('pinDiario', pinData).write();
    
    logger.info(`🎲 Novo PIN gerado`, { pin: '***', validoAte: pinData.validoAte });
    
    res.json({
      success: true,
      pin: novoPin,
      validoAte: pinData.validoAte,
      message: 'PIN gerado com sucesso'
    });
    
  } catch (error) {
    logger.error('Erro ao gerar PIN', error);
    res.status(500).json({ 
      error: 'Erro interno ao gerar PIN',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Valida o PIN fornecido pelo usuário
 */
app.post('/api/pin/validar', (req, res) => {
  try {
    const { pin } = req.body;
    
    // Validação básica de entrada
    if (!pin || typeof pin !== 'string' || pin.length !== config.pinLength) {
      return res.status(400).json({ 
        valid: false, 
        message: 'PIN deve conter 4 dígitos numéricos' 
      });
    }
    
    const pinDiario = db.get('pinDiario').value();
    
    if (!pinDiario?.pin || !pinDiario.validoAte) {
      return res.json({ valid: false, message: 'PIN não configurado' });
    }
    
    const agora = new Date();
    const validoAte = new Date(pinDiario.validoAte);
    
    const pinCorreto = pin === pinDiario.pin;
    const dentroValidade = agora <= validoAte;
    
    const resultado = pinCorreto && dentroValidade;
    
    logger.info(`🔐 Validação PIN`, { 
      resultado: resultado ? 'SUCESSO' : 'FALHA',
      ip: req.ip 
    });
    
    res.json({
      valid: resultado,
      message: resultado 
        ? 'Acesso autorizado' 
        : (!pinCorreto ? 'PIN incorreto' : 'PIN expirado'),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Erro ao validar PIN', error);
    res.status(500).json({ 
      error: 'Erro ao validar PIN',
      timestamp: new Date().toISOString()
    });
  }
});

// ==========================================
// ROTAS DE BEBIDAS (CRUD)
// ==========================================

/**
 * Lista todas as bebidas com filtros opcionais
 * Query params: ?tipo=tinto&disponivel=true&search=malbec
 */
app.get('/api/bebidas', (req, res) => {
  try {
    let bebidas = db.get('bebidas').value() || [];
    
    // Filtros opcionais
    const { tipo, disponivel, search, origem } = req.query;
    
    if (tipo) {
      bebidas = bebidas.filter(b => 
        b.tipo?.toLowerCase() === tipo.toLowerCase()
      );
    }
    
    if (disponivel !== undefined) {
      const boolValue = disponivel === 'true';
      bebidas = bebidas.filter(b => b.disponivel === boolValue);
    }
    
    if (origem) {
      bebidas = bebidas.filter(b => 
        b.origem?.toLowerCase() === origem.toLowerCase()
      );
    }
    
    if (search) {
      const term = search.toLowerCase();
      bebidas = bebidas.filter(b => 
        b.nome?.toLowerCase().includes(term) ||
        b.descricaoCurta?.toLowerCase().includes(term)
      );
    }
    
    const cleaned = cleanArray(bebidas);
    
    logger.debug(`📦 Bebidas listadas`, { count: cleaned.length, filters: req.query });
    
    res.json({
      success: true,
      count: cleaned.length,
      data: cleaned,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Erro ao listar bebidas', error);
    res.status(500).json({ 
      error: 'Erro ao listar bebidas',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Obtém uma bebida específica por ID
 */
app.get('/api/bebidas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const bebida = db.get('bebidas').find({ id }).value();
    
    if (!bebida) {
      return res.status(404).json({ error: 'Bebida não encontrada' });
    }
    
    res.json({
      success: true,
      data: cleanObject(bebida)
    });
    
  } catch (error) {
    logger.error('Erro ao buscar bebida', error);
    res.status(500).json({ error: 'Erro ao buscar bebida' });
  }
});

/**
 * Cria ou atualiza uma bebida (UPSERT)
 */
app.put('/api/bebidas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser numérico' });
    }
    
    const updatedData = cleanObject(req.body);
    
    // Validações básicas
    if (!updatedData.nome?.trim()) {
      return res.status(400).json({ error: 'Nome da bebida é obrigatório' });
    }
    
    // Normaliza array de pratos
    if (updatedData.pratosDaCasa) {
      updatedData.pratosDaCasa = Array.isArray(updatedData.pratosDaCasa)
        ? updatedData.pratosDaCasa.map(p => typeof p === 'string' ? p.trim() : p).filter(Boolean)
        : [];
    }
    
    // Verifica duplicidade por nome (case-insensitive)
    const existingByName = db.get('bebidas')
      .find(b => 
        b.id !== id && 
        b.nome?.toLowerCase() === updatedData.nome.toLowerCase()
      )
      .value();
    
    if (existingByName) {
      return res.status(409).json({ 
        error: 'Já existe uma bebida com este nome',
        existingId: existingByName.id
      });
    }
    
    let bebida;
    const bebidas = db.get('bebidas');
    
    if (bebidas.find({ id }).value()) {
      // UPDATE
      bebida = bebidas.find({ id }).assign({
        ...updatedData,
        updatedAt: new Date().toISOString()
      }).write();
      logger.info(`✅ Bebida atualizada`, { id, nome: bebida.nome });
    } else {
      // CREATE
      bebida = {
        id,
        ...updatedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      bebidas.push(bebida).write();
      logger.info(`✅ Bebida criada`, { id, nome: bebida.nome });
    }
    
    // Atualiza metadata
    db.set('metadata.ultimaAtualizacao', new Date().toISOString()).write();
    
    res.json({
      success: true,
      message: 'Bebida salva com sucesso',
      data: cleanObject(bebida)
    });
    
  } catch (error) {
    logger.error('Erro ao salvar bebida', error);
    res.status(500).json({ 
      error: 'Erro ao salvar bebida: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Remove uma bebida por ID
 */
app.delete('/api/bebidas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const bebida = db.get('bebidas').find({ id }).value();
    
    if (!bebida) {
      return res.status(404).json({ error: 'Bebida não encontrada' });
    }
    
    db.get('bebidas').remove({ id }).write();
    
    logger.info(`🗑️ Bebida removida`, { id, nome: bebida.nome });
    
    res.json({
      success: true,
      message: 'Bebida removida com sucesso',
      deleted: { id, nome: bebida.nome }
    });
    
  } catch (error) {
    logger.error('Erro ao remover bebida', error);
    res.status(500).json({ error: 'Erro ao remover bebida' });
  }
});

// ==========================================
// ROTAS DE CARDÁPIO
// ==========================================

/**
 * Lista todos os pratos do cardápio
 */
app.get('/api/cardapio', (req, res) => {
  try {
    let cardapio = db.get('cardapio').value();
    
    // Fallback para cardapio.json se db estiver vazio
    if (!cardapio?.length) {
      try {
        cardapio = require('./cardapio.json');
        db.set('cardapio', cardapio).write();
      } catch {
        cardapio = [];
      }
    }
    
    const cleaned = Array.isArray(cardapio)
      ? cardapio.map(p => typeof p === 'string' ? p.trim() : p).filter(Boolean)
      : [];
    
    logger.debug(`📋 Cardápio listado`, { count: cleaned.length });
    
    res.json({
      success: true,
      count: cleaned.length,
      data: cleaned,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Erro ao listar cardápio', error);
    res.status(500).json({ error: 'Erro ao listar cardápio' });
  }
});

/**
 * Atualiza todo o cardápio (substituição completa)
 */
app.put('/api/cardapio', (req, res) => {
  try {
    const novoCardapio = req.body;
    
    if (!Array.isArray(novoCardapio)) {
      return res.status(400).json({ error: 'Cardápio deve ser um array de strings' });
    }
    
    const cleaned = novoCardapio
      .map(p => typeof p === 'string' ? p.trim() : p)
      .filter(p => p && p.length > 0);
    
    db.set('cardapio', cleaned).write();
    db.set('metadata.ultimaAtualizacao', new Date().toISOString()).write();
    
    logger.info(`✅ Cardápio atualizado`, { count: cleaned.length });
    
    res.json({
      success: true,
      message: 'Cardápio atualizado com sucesso',
      count: cleaned.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Erro ao atualizar cardápio', error);
    res.status(500).json({ error: 'Erro ao atualizar cardápio' });
  }
});

// ==========================================
// TRATAMENTO DE ERROS GLOBAL
// ==========================================

// Erros de validação/sintaxe JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn('JSON malformado na requisição', { path: req.path });
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
  }
  next(err);
});

// Erros não tratados
app.use((err, req, res, next) => {
  logger.error('❌ Erro não tratado', err);
  
  // Não expõe detalhes do erro em produção
  const isDev = config.nodeEnv !== 'production';
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: isDev ? err.message : undefined,
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Rota 404 para APIs
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    path: req.path,
    available: ['GET /api/bebidas', 'PUT /api/bebidas/:id', 'GET /api/cardapio', 'PUT /api/cardapio', 'POST /api/pin/*']
  });
});

// ==========================================
// SHUTDOWN GRACIOSO
// ==========================================
const gracefulShutdown = (signal) => {
  logger.info(`🔄 Recebido sinal ${signal}. Iniciando shutdown...`);
  
  // Aqui poderia fechar conexões de DB, limpar caches, etc.
  
  server.close(() => {
    logger.info('✅ Servidor encerrado');
    process.exit(0);
  });
  
  // Força saída após 10s se não fechar
  setTimeout(() => {
    logger.error('❌ Timeout no shutdown. Forçando saída.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
const server = app.listen(config.port, '0.0.0.0', () => {
  const divider = '='.repeat(60);
  console.log(`\n${divider}`);
  console.log(`🍷  VINHO EM MÃOS - Servidor API v2.0.0`);
  console.log(divider);
  console.log(`📍 Porta: ${config.port}`);
  console.log(`🌐 URL: http://localhost:${config.port}`);
  console.log(`🔒 Ambiente: ${config.nodeEnv}`);
  console.log(`🗄️  Database: ${config.dbPath}`);
  console.log(`📊 Logs: nível "${config.logLevel}"`);
  console.log(divider);
  
  logger.info('🚀 Servidor inicializado com sucesso');
});

// Tratamento de erros no servidor
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`❌ Porta ${config.port} já em uso`);
  } else {
    logger.error('❌ Erro no servidor', error);
  }
  process.exit(1);
});

// Exporta para testes
module.exports = { app, db, cleanObject };