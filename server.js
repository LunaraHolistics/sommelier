// server.js - Vinho em Mãos v1.5 (Arquitetura Híbrida)
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ───────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// ─── LowDB (dados dinâmicos) ──────────────────────────────────
const dbFile = path.join(__dirname, 'data', 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, {
  inventory: {},
  pin: null,
  adminPassword: process.env.ADMIN_PASSWORD || 'sommelier2026'
});

// ─── Catálogos estáticos (read-only) ──────────────────────────
const catalogoPath = path.join(__dirname, 'data', 'catalogo.json');
const cardapioPath = path.join(__dirname, 'data', 'cardapio.json');
const tagsPath = path.join(__dirname, 'data', 'tags.json');

let catalogoRaw = [];
let cardapioRaw = [];
let tagsRaw = {};

try {
  catalogoRaw = JSON.parse(fs.readFileSync(catalogoPath, 'utf-8'));
  cardapioRaw = JSON.parse(fs.readFileSync(cardapioPath, 'utf-8'));
  tagsRaw = JSON.parse(fs.readFileSync(tagsPath, 'utf-8'));
  console.log(`✅ Catálogo: ${catalogoRaw.length} itens`);
  console.log(`✅ Cardápio: ${cardapioRaw.length} pratos`);
  console.log(`✅ Tags: ${Object.keys(tagsRaw.tags || {}).length} categorias`);
} catch (err) {
  console.error('❌ Erro ao carregar JSONs:', err.message);
  process.exit(1);
}

// ─── Cache em Memória (Merge precomputado) ────────────────────
let mergedCatalog = [];
let catalogById = new Map();

function rebuildCache() {
  mergedCatalog = catalogoRaw.map(item => {
    const inv = db.data.inventory[item.id] || {};
    return {
      ...item,
      price: inv.price ?? parseFloat(item.faixaPreco?.match(/\d+/)?.[0] || 0),
      stock: inv.stock ?? 0,
      active: inv.active ?? true
    };
  });
  catalogById = new Map(mergedCatalog.map(i => [i.id, i]));
  console.log(`🔄 Cache reconstruído: ${mergedCatalog.length} itens`);
}

// ─── Bootstrap ─────────────────────────────────────────────────
(async () => {
  await db.read();
  db.data ||= {};
  db.data.inventory ||= {};
  await db.write();
  rebuildCache();
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
})();

// ─── Helpers ───────────────────────────────────────────────────
async function persistInventoryChange(itemId, patch) {
  db.data.inventory[itemId] = {
    ...(db.data.inventory[itemId] || {}),
    ...patch
  };
  await db.write();
  rebuildCache();
}

function authManager(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== db.data.adminPassword) {
    return res.status(401).json({ error: 'Senha de gerente inválida' });
  }
  next();
}

// ==================== API: CATÁLOGO (MERGED) ===================
app.get('/api/catalogo', (req, res) => {
  const { tipo, pais, uva, min, max, q, activeOnly, nivelDoce, corpo } = req.query;
  let result = [...mergedCatalog];

  if (activeOnly === 'true') result = result.filter(i => i.active);
  if (tipo) result = result.filter(i => i.tipo?.toLowerCase() === tipo.toLowerCase());
  if (pais) result = result.filter(i => i.pais?.toLowerCase() === pais.toLowerCase());
  if (uva) result = result.filter(i => i.uva?.some(u => u.toLowerCase().includes(uva.toLowerCase())));
  if (nivelDoce) result = result.filter(i => i.nivelDoce?.toLowerCase() === nivelDoce.toLowerCase());
  if (corpo) result = result.filter(i => i.corpo?.toLowerCase().includes(corpo.toLowerCase()));
  if (min) result = result.filter(i => i.price >= parseFloat(min));
  if (max) result = result.filter(i => i.price <= parseFloat(max));
  if (q) {
    const term = q.toLowerCase();
    result = result.filter(i =>
      i.nome?.toLowerCase().includes(term) ||
      i.vinicola?.toLowerCase().includes(term) ||
      i.descricaoCurta?.toLowerCase().includes(term) ||
      i.uva?.some(u => u.toLowerCase().includes(term))
    );
  }

  res.json({ total: result.length, items: result });
});

app.get('/api/catalogo/:id', (req, res) => {
  const item = catalogById.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });
  res.json(item);
});

// ==================== API: GERENTE (protegido) =================
app.patch('/api/catalogo/:id', authManager, async (req, res) => {
  const { price, stock, active } = req.body;
  const item = catalogById.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });

  const patch = {};
  if (price !== undefined) patch.price = Number(price);
  if (stock !== undefined) patch.stock = Number(stock);
  if (active !== undefined) patch.active = Boolean(active);

  await persistInventoryChange(req.params.id, patch);
  res.json({ ok: true, id: req.params.id, ...patch });
});

// ==================== API: PIN =================================
app.post('/api/pin', authManager, async (req, res) => {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = new Date();
  expiresAt.setHours(23, 59, 59, 999);
  
  db.data.pin = { code, expiresAt: expiresAt.toISOString() };
  await db.write();
  
  res.json({ code, expiresAt: expiresAt.toISOString() });
});

app.get('/api/pin', (req, res) => {
  const current = db.data.pin;
  if (!current || new Date(current.expiresAt) < new Date()) {
    return res.json({ valid: false });
  }
  res.json({ valid: true, ...current });
});

app.post('/api/pin/validate', (req, res) => {
  const { code } = req.body;
  const current = db.data.pin;
  if (!current || new Date(current.expiresAt) < new Date()) {
    return res.json({ valid: false, reason: 'PIN expirado' });
  }
  res.json({ valid: current.code === String(code) });
});

// ==================== API: AUTENTICAÇÃO ========================
app.post('/api/auth/manager', (req, res) => {
  const { password } = req.body;
  res.json({ ok: password === db.data.adminPassword });
});

// ==================== API: CARDÁPIO ============================
app.get('/api/cardapio', (req, res) => {
  const { categoria, search, tags } = req.query;
  let result = [...cardapioRaw];

  if (categoria) {
    result = result.filter(i => i.categoria?.toLowerCase() === categoria.toLowerCase());
  }
  if (search) {
    const term = search.toLowerCase();
    result = result.filter(i =>
      i.nome?.toLowerCase().includes(term) ||
      i.descricao?.toLowerCase().includes(term)
    );
  }
  if (tags) {
    const tagList = tags.split(',').map(t => t.toLowerCase().trim());
    result = result.filter(i =>
      tagList.some(tag => i.tags?.some(t => t.toLowerCase().includes(tag)))
    );
  }

  res.json(result);
});

// ==================== API: TAGS ================================
app.get('/api/tags', (req, res) => {
  res.json(tagsRaw);
});

// ==================== API: HARMONIZAÇÃO ========================
app.post('/api/harmonize', (req, res) => {
  const { pratoId, tags } = req.body;
  
  // Se veio pratoId, usa dados diretos do cardápio
  if (pratoId) {
    const prato = cardapioRaw.find(p => p.id === pratoId);
    if (!prato) return res.status(404).json({ error: 'Prato não encontrado' });
    
    const activeItems = mergedCatalog.filter(i => i.active && i.stock > 0);
    
    // Score baseado em melhoresCategorias e harmonizacaoInteligente
    const scored = activeItems.map(item => {
      let score = 0;
      const reasons = [];
      
      // Match direto com melhoresCategorias do prato
      if (prato.melhoresCategorias) {
        for (const cat of prato.melhoresCategorias) {
          if (item.nome?.toLowerCase().includes(cat.toLowerCase()) ||
              item.tipo?.toLowerCase() === cat.toLowerCase()) {
            score += 5;
            reasons.push(`Categoria recomendada: ${cat}`);
          }
        }
      }
      
      // Match com harmonizacaoInteligente do vinho
      if (item.harmonizacaoInteligente) {
        const hi = item.harmonizacaoInteligente;
        
        // Match por proteína
        if (prato.proteinas && hi.proteinas) {
          for (const prot of prato.proteinas) {
            if (hi.proteinas.some(hp => hp.toLowerCase().includes(prot.toLowerCase()))) {
              score += 3;
              reasons.push(`Proteína: ${prot}`);
            }
          }
        }
        
        // Match por técnica de preparo
        if (prato.tecnicasPreparo && hi.tecnicasPreparo) {
          for (const tec of prato.tecnicasPreparo) {
            if (hi.tecnicasPreparo.some(ht => ht.toLowerCase().includes(tec.toLowerCase()))) {
              score += 2;
              reasons.push(`Técnica: ${tec}`);
            }
          }
        }
        
        // Match por sabores dominantes
        if (prato.saboresDominantes && hi.saboresPrato) {
          for (const sabor of prato.saboresDominantes) {
            if (hi.saboresPrato.some(hs => hs.toLowerCase().includes(sabor.toLowerCase()))) {
              score += 2;
              reasons.push(`Sabor: ${sabor}`);
            }
          }
        }
      }
      
      // Bônus se o prato está na harmonizacaoPrincipal do vinho
      if (item.harmonizacaoPrincipal?.some(h => h.toLowerCase().includes(prato.nome.toLowerCase()))) {
        score += 4;
        reasons.push('Harmonização principal declarada');
      }
      
      return { ...item, score, reasons: [...new Set(reasons)] };
    })
    .filter(i => i.score > 0)
    .sort((a, b) => b.score - a.score);
    
    return res.json({ prato, suggestions: scored.slice(0, 12) });
  }
  
  // Se veio tags, usa algoritmo genérico
  if (tags && Array.isArray(tags)) {
    const activeItems = mergedCatalog.filter(i => i.active && i.stock > 0);
    
    const scored = activeItems.map(item => {
      let score = 0;
      const reasons = [];
      const itemTags = (item.tags || []).map(t => t.toLowerCase());
      const notas = (item.notasDominantes || []).map(n => n.toLowerCase());
      
      for (const tag of tags.map(t => t.toLowerCase())) {
        if (itemTags.includes(tag)) {
          score += 2;
          reasons.push(`Tag: ${tag}`);
        }
        if (notas.some(n => n.includes(tag))) {
          score += 1;
          reasons.push(`Nota: ${tag}`);
        }
      }
      
      return { ...item, score, reasons: [...new Set(reasons)] };
    })
    .filter(i => i.score > 0)
    .sort((a, b) => b.score - a.score);
    
    return res.json({ suggestions: scored.slice(0, 12) });
  }
  
  res.status(400).json({ error: 'Forneça pratoId ou tags[]' });
});

// ==================== API: ESTATÍSTICAS ========================
app.get('/api/stats', authManager, (req, res) => {
  res.json({
    total: mergedCatalog.length,
    ativos: mergedCatalog.filter(i => i.active).length,
    semEstoque: mergedCatalog.filter(i => i.stock <= 0).length,
    totalPratos: cardapioRaw.length
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      catalogItems: catalogoRaw.length,
      dishes: cardapioRaw.length,
      dynamicRecords: Object.keys(db.data.inventory).length
    }
  });
});

// ─── Error Handlers ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ 
    error: 'Erro interno',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ─── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍷 Vinho em Mãos v1.5 rodando em http://localhost:${PORT}`);
});

module.exports = app;