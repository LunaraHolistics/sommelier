// server.js - Sommelier v1.6 (CRUD Completo + Harmonização Avançada)
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ───────────────────────────────────────────────
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

// ─── LowDB (dados dinâmicos) ──────────────────────────────────
const dbFile = path.join(__dirname, "data", "db.json");
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, {
  inventory: {},
  pin: null,
  customDishes: [],
  dishModifications: {},
  adminPassword: process.env.ADMIN_PASSWORD || "sommelier2026",
});

// ─── Catálogos estáticos (read-only base) ─────────────────────
const catalogoPath = path.join(__dirname, "data", "catalogo.json");
const cardapioPath = path.join(__dirname, "data", "cardapio.json");
const tagsPath = path.join(__dirname, "data", "tags.json");
const harmonizacaoPath = path.join(__dirname, "data", "harmonizacao.json");

let catalogoRaw = [];
let cardapioBase = [];
let tagsRaw = {};
let harmonizacaoRaw = { harmonizacoes: [] };

try {
  catalogoRaw = JSON.parse(fs.readFileSync(catalogoPath, "utf-8"));
  console.log(`✅ Catálogo: ${catalogoRaw.length} itens`);
} catch (err) {
  console.error("❌ Erro ao carregar catalogo.json:", err.message);
}

try {
  cardapioBase = JSON.parse(fs.readFileSync(cardapioPath, "utf-8"));
  console.log(`✅ Cardápio Base: ${cardapioBase.length} pratos`);
} catch (err) {
  console.error("❌ Erro ao carregar cardapio.json:", err.message);
}

try {
  tagsRaw = JSON.parse(fs.readFileSync(tagsPath, "utf-8"));
  console.log(`✅ Tags: ${Object.keys(tagsRaw.tags || {}).length} categorias`);
} catch (err) {
  console.error("❌ Erro ao carregar tags.json:", err.message);
}

try {
  harmonizacaoRaw = JSON.parse(fs.readFileSync(harmonizacaoPath, "utf-8"));
  console.log(
    `✅ Harmonizações: ${harmonizacaoRaw.harmonizacoes?.length || 0} mapeamentos`,
  );
} catch (err) {
  console.log("⚠️ harmonizacao.json não encontrado, usando algoritmo padrão");
}

// ─── Cache em Memória (Merge precomputado) ───────────────────
let mergedCatalog = [];
let catalogById = new Map();
let mergedCardapio = [];
let cardapioById = new Map();

function rebuildCache() {
  // Rebuild catálogo
  mergedCatalog = catalogoRaw.map((item) => {
    const inv = db.data.inventory[item.id] || {};
    return {
      ...item,
      price: inv.price ?? parseFloat(item.faixaPreco?.match(/\d+/)?.[0] || 0),
      stock: inv.stock ?? 0,
      active: inv.active ?? true,
    };
  });
  catalogById = new Map(mergedCatalog.map((i) => [i.id, i]));

  // Rebuild cardápio (base + custom + modificações)
  const customDishes = db.data.customDishes || [];
  const modifications = db.data.dishModifications || {};

  // Aplica modificações aos pratos base
  const modifiedBase = cardapioBase.map((dish) => {
    const mod = modifications[dish.id];
    if (mod) {
      return { ...dish, ...mod };
    }
    return dish;
  });

  // Filtra pratos base que foram marcados como deletados
  const activeBase = modifiedBase.filter((dish) => {
    const mod = modifications[dish.id];
    return !mod?.deleted;
  });

  // Combina base + custom
  mergedCardapio = [...activeBase, ...customDishes];
  cardapioById = new Map(mergedCardapio.map((d) => [d.id, d]));

  console.log(
    `🔄 Cache reconstruído: ${mergedCatalog.length} bebidas, ${mergedCardapio.length} pratos`,
  );
}

// ─── Bootstrap ─────────────────────────────────────────────────
(async () => {
  await db.read();
  db.data ||= {};
  db.data.inventory ||= {};
  db.data.customDishes ||= [];
  db.data.dishModifications ||= {};
  await db.write();
  rebuildCache();
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
})();

// ─── Helpers ──────────────────────────────────────────────────
async function persistInventoryChange(itemId, patch) {
  db.data.inventory[itemId] = {
    ...(db.data.inventory[itemId] || {}),
    ...patch,
  };
  await db.write();
  rebuildCache();
}

async function persistCardapioChange() {
  await db.write();
  rebuildCache();
}

function authManager(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (token !== db.data.adminPassword) {
    return res.status(401).json({ error: "Senha de gerente inválida" });
  }
  next();
}

function generateId(prefix = "PRATO") {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${timestamp}${random}`;
}

// ==================== API: CATÁLOGO (MERGED) ===================
app.get("/api/catalogo", (req, res) => {
  const {
    tipo,
    pais,
    uva,
    min,
    max,
    q,
    activeOnly,
    nivelDoce,
    corpo,
    includeAll,
  } = req.query;
  let result = [...mergedCatalog];

  // Se includeAll=true, não filtra por active (para harmonização)
  if (activeOnly === "true" && includeAll !== "true") {
    result = result.filter((i) => i.active);
  }
  if (tipo)
    result = result.filter((i) => i.tipo?.toLowerCase() === tipo.toLowerCase());
  if (pais)
    result = result.filter((i) => i.pais?.toLowerCase() === pais.toLowerCase());
  if (uva)
    result = result.filter((i) =>
      i.uva?.some((u) => u.toLowerCase().includes(uva.toLowerCase())),
    );
  if (nivelDoce)
    result = result.filter(
      (i) => i.nivelDoce?.toLowerCase() === nivelDoce.toLowerCase(),
    );
  if (corpo)
    result = result.filter((i) =>
      i.corpo?.toLowerCase().includes(corpo.toLowerCase()),
    );
  if (min) result = result.filter((i) => i.price >= parseFloat(min));
  if (max) result = result.filter((i) => i.price <= parseFloat(max));
  if (q) {
    const term = q.toLowerCase();
    result = result.filter(
      (i) =>
        i.nome?.toLowerCase().includes(term) ||
        i.vinicola?.toLowerCase().includes(term) ||
        i.descricaoCurta?.toLowerCase().includes(term) ||
        i.uva?.some((u) => u.toLowerCase().includes(term)),
    );
  }

  res.json({ total: result.length, items: result });
});

app.get("/api/catalogo/:id", (req, res) => {
  const item = catalogById.get(req.params.id);
  if (!item) return res.status(404).json({ error: "Item não encontrado" });
  res.json(item);
});

// ==================== API: GERENTE - CATÁLOGO ==================
app.patch("/api/catalogo/:id", authManager, async (req, res) => {
  const { price, stock, active } = req.body;
  const item = catalogById.get(req.params.id);
  if (!item) return res.status(404).json({ error: "Item não encontrado" });

  const patch = {};
  if (price !== undefined) patch.price = Number(price);
  if (stock !== undefined) patch.stock = Number(stock);
  if (active !== undefined) patch.active = Boolean(active);

  await persistInventoryChange(req.params.id, patch);
  res.json({ ok: true, id: req.params.id, ...patch });
});

// ==================== API: PIN =================================
app.post("/api/pin", authManager, async (req, res) => {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = new Date();
  expiresAt.setHours(23, 59, 59, 999);

  db.data.pin = { code, expiresAt: expiresAt.toISOString() };
  await db.write();

  res.json({ code, expiresAt: expiresAt.toISOString() });
});

app.get("/api/pin", (req, res) => {
  const current = db.data.pin;
  if (!current || new Date(current.expiresAt) < new Date()) {
    return res.json({ valid: false });
  }
  res.json({ valid: true, ...current });
});

app.post("/api/pin/validate", (req, res) => {
  const { code } = req.body;
  const current = db.data.pin;
  if (!current || new Date(current.expiresAt) < new Date()) {
    return res.json({ valid: false, reason: "PIN expirado" });
  }
  res.json({ valid: current.code === String(code) });
});

// ==================== API: AUTENTICAÇÃO ========================
app.post("/api/auth/manager", (req, res) => {
  const { password } = req.body;
  res.json({ ok: password === db.data.adminPassword });
});

// ==================== API: CARDÁPIO (CRUD COMPLETO) ============
// USANDO SISTEMA DE CACHE MERGED (LowDB + JSON estático)

// Listar cardápio com filtros
app.get("/api/cardapio", (req, res) => {
  const { categoria, search, tags, status } = req.query;
  let result = [...mergedCardapio];

  if (categoria) {
    result = result.filter(
      (i) => i.categoria?.toLowerCase() === categoria.toLowerCase(),
    );
  }
  if (status) {
    result = result.filter((i) => i.status === status);
  }
  if (search) {
    const term = search.toLowerCase();
    result = result.filter(
      (i) =>
        i.nome?.toLowerCase().includes(term) ||
        i.descricao?.toLowerCase().includes(term),
    );
  }
  if (tags) {
    const tagList = tags.split(",").map((t) => t.toLowerCase().trim());
    result = result.filter((i) =>
      tagList.some((tag) => i.tags?.some((t) => t.toLowerCase().includes(tag))),
    );
  }

  res.json(result);
});

// Buscar prato por ID
app.get("/api/cardapio/:id", (req, res) => {
  const dish = cardapioById.get(req.params.id);
  if (!dish) return res.status(404).json({ error: "Prato não encontrado" });
  res.json(dish);
});

// Criar novo prato
app.post("/api/cardapio", authManager, async (req, res) => {
  try {
    const {
      nome,
      categoria,
      subcategoria,
      serve,
      descricao,
      ingredientesPrincipais,
      tags,
      nivelHarmonizacao,
      melhoresCategorias,
      melhoresRotulos,
      acompanha,
      proteinas,
      tecnicasPreparo,
      saboresDominantes,
    } = req.body;

    if (!nome || !categoria) {
      return res
        .status(400)
        .json({ error: "Nome e categoria são obrigatórios" });
    }

    const newDish = {
      id: generateId("CUSTOM"),
      nome: nome.trim(),
      categoria: categoria.trim(),
      subcategoria: subcategoria?.trim() || "",
      serve: serve || "Compartilhável",
      descricao: descricao?.trim() || "",
      ingredientesPrincipais: ingredientesPrincipais || [],
      tags: tags || [],
      nivelHarmonizacao: nivelHarmonizacao || "medio",
      melhoresCategorias: melhoresCategorias || [],
      melhoresRotulos: melhoresRotulos || [],
      acompanha: acompanha || [],
      proteinas: proteinas || [],
      tecnicasPreparo: tecnicasPreparo || [],
      saboresDominantes: saboresDominantes || [],
      status: "ativo",
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.data.customDishes.push(newDish);
    await persistCardapioChange();

    res.status(201).json({
      success: true,
      message: "Prato criado com sucesso",
      dish: newDish,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar prato: " + error.message });
  }
});

// Atualizar prato existente
app.put("/api/cardapio/:id", authManager, async (req, res) => {
  try {
    const dishId = req.params.id;
    const updates = req.body;

    // Verifica se é prato customizado
    const customIndex = db.data.customDishes.findIndex((d) => d.id === dishId);

    if (customIndex !== -1) {
      // Atualiza prato customizado
      db.data.customDishes[customIndex] = {
        ...db.data.customDishes[customIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await persistCardapioChange();

      res.json({
        success: true,
        message: "Prato atualizado com sucesso",
        dish: db.data.customDishes[customIndex],
      });
    } else {
      // Verifica se é prato base
      const baseDish = cardapioBase.find((d) => d.id === dishId);
      if (!baseDish) {
        return res.status(404).json({ error: "Prato não encontrado" });
      }

      // Salva modificação
      db.data.dishModifications[dishId] = {
        ...(db.data.dishModifications[dishId] || {}),
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await persistCardapioChange();

      res.json({
        success: true,
        message: "Prato atualizado com sucesso",
        dish: { ...baseDish, ...updates },
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao atualizar prato: " + error.message });
  }
});

// Ativar/Desativar prato (PATCH rápido)
app.patch("/api/cardapio/:id/status", authManager, async (req, res) => {
  try {
    const { status } = req.body;
    const dishId = req.params.id;

    if (!["ativo", "inativo"].includes(status)) {
      return res
        .status(400)
        .json({ error: 'Status deve ser "ativo" ou "inativo"' });
    }

    const customIndex = db.data.customDishes.findIndex((d) => d.id === dishId);

    if (customIndex !== -1) {
      db.data.customDishes[customIndex].status = status;
      db.data.customDishes[customIndex].updatedAt = new Date().toISOString();
    } else {
      const baseDish = cardapioBase.find((d) => d.id === dishId);
      if (!baseDish) {
        return res.status(404).json({ error: "Prato não encontrado" });
      }
      db.data.dishModifications[dishId] = {
        ...(db.data.dishModifications[dishId] || {}),
        status,
        updatedAt: new Date().toISOString(),
      };
    }

    await persistCardapioChange();
    res.json({
      success: true,
      message: `Prato ${status === "ativo" ? "ativado" : "desativado"} com sucesso`,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao alterar status: " + error.message });
  }
});

// Excluir prato
app.delete("/api/cardapio/:id", authManager, async (req, res) => {
  try {
    const dishId = req.params.id;

    // Verifica se é prato customizado
    const customIndex = db.data.customDishes.findIndex((d) => d.id === dishId);

    if (customIndex !== -1) {
      db.data.customDishes.splice(customIndex, 1);
      await persistCardapioChange();

      res.json({ success: true, message: "Prato excluído com sucesso" });
    } else {
      // Marca prato base como deletado
      const baseDish = cardapioBase.find((d) => d.id === dishId);
      if (!baseDish) {
        return res.status(404).json({ error: "Prato não encontrado" });
      }

      db.data.dishModifications[dishId] = {
        ...(db.data.dishModifications[dishId] || {}),
        deleted: true,
        deletedAt: new Date().toISOString(),
      };
      await persistCardapioChange();

      res.json({
        success: true,
        message: "Prato removido do cardápio com sucesso",
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir prato: " + error.message });
  }
});

// ==================== API: TAGS ================================
app.get("/api/tags", (req, res) => {
  res.json(tagsRaw);
});

// ==================== API: HARMONIZAÇÃO AVANÇADA ===============
app.post("/api/harmonize", (req, res) => {
  const { pratoId, tags, includeUnavailable } = req.body;

  if (pratoId) {
    const prato = cardapioById.get(pratoId);
    if (!prato) return res.status(404).json({ error: "Prato não encontrado" });

    // Busca harmonização pré-definida no harmonizacao.json
    const harmonizacaoPredefinida = harmonizacaoRaw.harmonizacoes?.find(
      (h) => h.pratoId === pratoId,
    );

    // Pega TODOS os vinhos (incluindo indisponíveis se solicitado)
    let allItems = includeUnavailable
      ? [...mergedCatalog]
      : mergedCatalog.filter((i) => i.active);

    const scored = allItems
      .map((item) => {
        let score = 0;
        const reasons = [];
        const isAvailable = item.active && item.stock > 0;

        // 1. Match com harmonização pré-definida (maior peso)
        if (harmonizacaoPredefinida) {
          // Match por categoria de bebida
          if (harmonizacaoPredefinida.categoriasBebida) {
            for (const cat of harmonizacaoPredefinida.categoriasBebida) {
              const catLower = cat.toLowerCase();
              if (
                item.tipo?.toLowerCase().includes(catLower.split(" ")[0]) ||
                item.uva?.some((u) => catLower.includes(u.toLowerCase())) ||
                (item.pais && catLower.includes(item.pais.toLowerCase()))
              ) {
                score += 8;
                reasons.push(`Categoria recomendada: ${cat}`);
              }
            }
          }

          // Match por rótulo específico
          if (harmonizacaoPredefinida.rotulosSugeridos) {
            for (const rotulo of harmonizacaoPredefinida.rotulosSugeridos) {
              const rotuloLower = rotulo.toLowerCase();
              if (
                item.nome?.toLowerCase().includes(rotuloLower) ||
                item.vinicola?.toLowerCase().includes(rotuloLower.split(" ")[0])
              ) {
                score += 10;
                reasons.push(`Rótulo ideal: ${rotulo}`);
              }
            }
          }
        }

        // 2. Match com melhoresCategorias do prato
        if (prato.melhoresCategorias) {
          for (const cat of prato.melhoresCategorias) {
            const catLower = cat.toLowerCase();
            if (
              item.nome?.toLowerCase().includes(catLower.split(" ")[0]) ||
              item.uva?.some((u) => catLower.includes(u.toLowerCase())) ||
              (item.pais && catLower.includes(item.pais.toLowerCase()))
            ) {
              score += 5;
              reasons.push(`Categoria do prato: ${cat}`);
            }
          }
        }

        // 3. Match com melhoresRotulos do prato
        if (prato.melhoresRotulos) {
          for (const rotulo of prato.melhoresRotulos) {
            const rotuloLower = rotulo.toLowerCase();
            if (
              item.nome?.toLowerCase().includes(rotuloLower) ||
              item.vinicola?.toLowerCase().includes(rotuloLower.split(" ")[0])
            ) {
              score += 7;
              reasons.push(`Rótulo do prato: ${rotulo}`);
            }
          }
        }

        // 4. Match com harmonizacaoInteligente do vinho
        if (item.harmonizacaoInteligente) {
          const hi = item.harmonizacaoInteligente;

          if (prato.proteinas && hi.proteinas) {
            for (const prot of prato.proteinas) {
              if (
                hi.proteinas.some((hp) =>
                  hp.toLowerCase().includes(prot.toLowerCase()),
                )
              ) {
                score += 3;
                reasons.push(`Proteína: ${prot}`);
              }
            }
          }

          if (prato.tecnicasPreparo && hi.tecnicasPreparo) {
            for (const tec of prato.tecnicasPreparo) {
              if (
                hi.tecnicasPreparo.some((ht) =>
                  ht.toLowerCase().includes(tec.toLowerCase()),
                )
              ) {
                score += 2;
                reasons.push(`Técnica: ${tec}`);
              }
            }
          }

          if (prato.saboresDominantes && hi.saboresPrato) {
            for (const sabor of prato.saboresDominantes) {
              if (
                hi.saboresPrato.some((hs) =>
                  hs.toLowerCase().includes(sabor.toLowerCase()),
                )
              ) {
                score += 2;
                reasons.push(`Sabor: ${sabor}`);
              }
            }
          }
        }

        // 5. Match com harmonizacaoPrincipal do vinho
        if (
          item.harmonizacaoPrincipal?.some((h) =>
            h.toLowerCase().includes(prato.nome.toLowerCase()),
          )
        ) {
          score += 4;
          reasons.push("Harmonização principal declarada");
        }

        // 6. Match por tags do prato com notas do vinho
        if (prato.tags && item.notasDominantes) {
          for (const tag of prato.tags) {
            const tagLower = tag.toLowerCase();
            if (
              item.notasDominantes.some((n) =>
                n.toLowerCase().includes(tagLower),
              )
            ) {
              score += 1;
              reasons.push(`Tag: ${tag}`);
            }
          }
        }

        return {
          ...item,
          score,
          reasons: [...new Set(reasons)],
          isAvailable,
          matchLevel:
            score >= 15
              ? "excelente"
              : score >= 8
                ? "muito_bom"
                : score >= 4
                  ? "bom"
                  : "sugerido",
        };
      })
      .filter((i) => i.score > 0)
      .sort((a, b) => {
        // Primeiro ordena por disponibilidade, depois por score
        if (a.isAvailable !== b.isAvailable) {
          return b.isAvailable - a.isAvailable;
        }
        return b.score - a.score;
      });

    return res.json({
      prato,
      harmonizacaoPredefinida,
      suggestions: scored,
      stats: {
        total: scored.length,
        available: scored.filter((s) => s.isAvailable).length,
        unavailable: scored.filter((s) => !s.isAvailable).length,
      },
    });
  }

  // Harmonização por tags (modo alternativo)
  if (tags && Array.isArray(tags)) {
    let allItems = includeUnavailable
      ? [...mergedCatalog]
      : mergedCatalog.filter((i) => i.active);

    const scored = allItems
      .map((item) => {
        let score = 0;
        const reasons = [];
        const isAvailable = item.active && item.stock > 0;
        const itemTags = (item.tags || []).map((t) => t.toLowerCase());
        const notas = (item.notasDominantes || []).map((n) => n.toLowerCase());

        for (const tag of tags.map((t) => t.toLowerCase())) {
          if (itemTags.includes(tag)) {
            score += 2;
            reasons.push(`Tag: ${tag}`);
          }
          if (notas.some((n) => n.includes(tag))) {
            score += 1;
            reasons.push(`Nota: ${tag}`);
          }
        }

        return {
          ...item,
          score,
          reasons: [...new Set(reasons)],
          isAvailable,
        };
      })
      .filter((i) => i.score > 0)
      .sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) {
          return b.isAvailable - a.isAvailable;
        }
        return b.score - a.score;
      });

    return res.json({ suggestions: scored });
  }

  res.status(400).json({ error: "Forneça pratoId ou tags[]" });
});

// ==================== API: ESTATÍSTICAS ========================
app.get("/api/stats", authManager, (req, res) => {
  const activeDishes = mergedCardapio.filter((d) => d.status === "ativo");

  res.json({
    totalBebidas: mergedCatalog.length,
    bebidasAtivas: mergedCatalog.filter((i) => i.active).length,
    bebidasSemEstoque: mergedCatalog.filter((i) => i.stock <= 0).length,
    totalPratos: mergedCardapio.length,
    pratosAtivos: activeDishes.length,
    pratosInativos: mergedCardapio.filter((d) => d.status === "inativo").length,
    pratosCustom: (db.data.customDishes || []).length,
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    database: {
      catalogItems: catalogoRaw.length,
      dishes: mergedCardapio.length,
      customDishes: (db.data.customDishes || []).length,
      dynamicRecords: Object.keys(db.data.inventory).length,
    },
  });
});

// ─── Error Handlers ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

app.use((err, req, res, next) => {
  console.error("Erro:", err);
  res.status(500).json({
    error: "Erro interno",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ─── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍷 Sommelier v1.6 rodando em http://localhost:${PORT}`);
});

module.exports = app;