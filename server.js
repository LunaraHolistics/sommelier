const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do LowDB (versão 1.x compatível)
const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// Inicialização do banco de dados com estrutura padrão
db.defaults({
  pinDiario: {
    pin: '',
    validoAte: ''
  },
  bebidas: []
}).write();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// Verificar PIN diário
app.get('/api/pin/verificar', (req, res) => {
  const { pin } = req.query;
  const pinAtual = db.get('pinDiario').value();
  
  if (!pinAtual.pin || !pinAtual.validoAte) {
    return res.status(401).json({ error: 'PIN não configurado' });
  }
  
  const hoje = new Date().toISOString().split('T')[0];
  const valido = new Date(pinAtual.validoAte) >= new Date(hoje);
  
  if (pin === pinAtual.pin && valido) {
    res.json({ success: true, message: 'Acesso autorizado' });
  } else {
    res.status(401).json({ error: 'PIN inválido ou expirado' });
  }
});

// Gerar novo PIN (apenas para demonstração - em produção, usar autenticação adequada)
app.post('/api/pin/gerar', (req, res) => {
  const { novoPin, diasValidade } = req.body;
  
  if (!novoPin || novoPin.length < 4) {
    return res.status(400).json({ error: 'PIN deve ter pelo menos 4 dígitos' });
  }
  
  const validoAte = new Date();
  validoAte.setDate(validoAte.getDate() + (diasValidade || 1));
  
  db.set('pinDiario', {
    pin: novoPin,
    validoAte: validoAte.toISOString().split('T')[0]
  }).write();
  
  res.json({ 
    success: true, 
    message: 'PIN gerado com sucesso',
    pin: novoPin,
    validoAte: validoAte.toISOString().split('T')[0]
  });
});

// ==================== ROTAS DE BEBIDAS ====================

// Listar todas as bebidas
app.get('/api/bebidas', (req, res) => {
  const bebidas = db.get('bebidas').value();
  const { tipo, disponivel, search } = req.query;
  
  let resultado = bebidas;
  
  // Filtro por tipo
  if (tipo) {
    resultado = resultado.filter(b => b.tipo.toLowerCase() === tipo.toLowerCase());
  }
  
  // Filtro por disponibilidade
  if (disponivel !== undefined) {
    const boolDisponivel = disponivel === 'true';
    resultado = resultado.filter(b => b.disponivel === boolDisponivel);
  }
  
  // Busca por nome
  if (search) {
    resultado = resultado.filter(b => 
      b.nome.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json(resultado);
});

// Buscar bebida por ID
app.get('/api/bebidas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const bebida = db.get('bebidas').find({ id }).value();
  
  if (!bebida) {
    return res.status(404).json({ error: 'Bebida não encontrada' });
  }
  
  res.json(bebida);
});

// Adicionar nova bebida
app.post('/api/bebidas', (req, res) => {
  const novaBebida = req.body;
  
  // Validação básica
  if (!novaBebida.nome || !novaBebida.tipo) {
    return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
  }
  
  // Gerar ID automático
  const ultimoId = db.get('bebidas').maxBy('id').value()?.id || 0;
  novaBebida.id = ultimoId + 1;
  
  // Valores padrão para campos opcionais
  novaBebida.disponivel = novaBebida.disponivel ?? true;
  novaBebida.estoque = novaBebida.estoque ?? 0;
  novaBebida.preco = novaBebida.preco ?? 0;
  novaBebida.imagemUrl = novaBebida.imagemUrl ?? '';
  novaBebida.pratosDaCasa = novaBebida.pratosDaCasa ?? [];
  
  db.get('bebidas').push(novaBebida).write();
  
  res.status(201).json({ 
    success: true, 
    message: 'Bebida adicionada com sucesso',
    bebida: novaBebida 
  });
});

// Atualizar bebida existente
app.put('/api/bebidas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const atualizacoes = req.body;
  
  const bebidaExistente = db.get('bebidas').find({ id }).value();
  
  if (!bebidaExistente) {
    return res.status(404).json({ error: 'Bebida não encontrada' });
  }
  
  // Atualizar apenas campos permitidos
  const camposPermitidos = [
    'nome', 'tipo', 'origem', 'imagemUrl', 'teorAlcoolico',
    'perfilSabor', 'nivelDoce', 'publicoAlvo', 'resumoGarcom',
    'tacaIdeal', 'formaApresentacao', 'tempConsumo', 'tempConservacao',
    'disponivel', 'estoque', 'preco', 'pratosDaCasa'
  ];
  
  const bebidaAtualizada = { ...bebidaExistente };
  
  for (const campo of camposPermitidos) {
    if (atualizacoes[campo] !== undefined) {
      bebidaAtualizada[campo] = atualizacoes[campo];
    }
  }
  
  db.get('bebidas').find({ id }).assign(bebidaAtualizada).write();
  
  res.json({ 
    success: true, 
    message: 'Bebida atualizada com sucesso',
    bebida: bebidaAtualizada 
  });
});

// Remover bebida
app.delete('/api/bebidas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  const bebida = db.get('bebidas').find({ id }).value();
  
  if (!bebida) {
    return res.status(404).json({ error: 'Bebida não encontrada' });
  }
  
  db.get('bebidas').remove({ id }).write();
  
  res.json({ 
    success: true, 
    message: 'Bebida removida com sucesso' 
  });
});

// Atualizar estoque
app.patch('/api/bebidas/:id/estoque', (req, res) => {
  const id = parseInt(req.params.id);
  const { quantidade, operacao } = req.body; // operacao: 'add', 'remove', 'set'
  
  const bebida = db.get('bebidas').find({ id }).value();
  
  if (!bebida) {
    return res.status(404).json({ error: 'Bebida não encontrada' });
  }
  
  let novoEstoque = bebida.estoque;
  
  if (operacao === 'set') {
    novoEstoque = quantidade;
  } else if (operacao === 'add') {
    novoEstoque += quantidade;
  } else if (operacao === 'remove') {
    novoEstoque = Math.max(0, novoEstoque - quantidade);
  }
  
  db.get('bebidas').find({ id }).assign({ estoque: novoEstoque }).write();
  
  res.json({ 
    success: true, 
    message: 'Estoque atualizado',
    estoque: novoEstoque 
  });
});

// ==================== ROTAS DE CARDÁPIO ====================

// Listar cardápio
app.get('/api/cardapio', (req, res) => {
  try {
    const cardapio = require('./cardapio.json');
    const { categoria, search } = req.query;
    
    let resultado = Array.isArray(cardapio) ? cardapio : [];
    
    if (categoria) {
      resultado = resultado.filter(item => 
        item.categoria?.toLowerCase() === categoria.toLowerCase()
      );
    }
    
    if (search) {
      resultado = resultado.filter(item => 
        item.nome?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar cardápio' });
  }
});

// ==================== ROTAS DE CATÁLOGO ====================

// Listar catálogo de vinhos
app.get('/api/catalogo', (req, res) => {
  try {
    const catalogo = require('./catalogo.json');
    const { tipo, pais, uva, search, harmonizacao } = req.query;
    
    let resultado = Array.isArray(catalogo) ? catalogo : [];
    
    if (tipo) {
      resultado = resultado.filter(item => 
        item.tipo?.toLowerCase() === tipo.toLowerCase()
      );
    }
    
    if (pais) {
      resultado = resultado.filter(item => 
        item.pais?.toLowerCase().includes(pais.toLowerCase())
      );
    }
    
    if (uva) {
      resultado = resultado.filter(item => 
        item.uva?.some(u => u.toLowerCase().includes(uva.toLowerCase()))
      );
    }
    
    if (harmonizacao) {
      resultado = resultado.filter(item => 
        item.harmonizacaoPrincipal?.some(h => 
          h.toLowerCase().includes(harmonizacao.toLowerCase())
        )
      );
    }
    
    if (search) {
      resultado = resultado.filter(item => 
        item.nome?.toLowerCase().includes(search.toLowerCase()) ||
        item.descricaoCurta?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar catálogo' });
  }
});

// Buscar item do catálogo por ID
app.get('/api/catalogo/:id', (req, res) => {
  try {
    const catalogo = require('./catalogo.json');
    const item = catalogo.find(b => b.id === req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado no catálogo' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar item' });
  }
});

// ==================== ROTAS UTILITÁRIAS ====================

// Status da API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      pinConfigurado: !!db.get('pinDiario.pin').value(),
      totalBebidas: db.get('bebidas').size().value()
    }
  });
});

// Limpar banco de dados (apenas para desenvolvimento)
app.delete('/api/db/reset', (req, res) => {
  // Em produção, adicionar autenticação aqui
  db.setState({
    pinDiario: db.get('pinDiario').value(),
    bebidas: []
  }).write();
  
  res.json({ 
    success: true, 
    message: 'Banco de dados de bebidas resetado' 
  });
});

// ==================== TRATAMENTO DE ERROS ====================

// 404 - Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== INICIALIZAÇÃO ====================

app.listen(PORT, () => {
  console.log(`🍷 Servidor Vinho em Mãos rodando em http://localhost:${PORT}`);
  console.log(`📦 Banco de dados: ${path.join(__dirname, 'db.json')}`);
});

module.exports = app;