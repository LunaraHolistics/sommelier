
const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const app = express();
const PORT = 3000;

// Configurar lowdb
const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Middleware de segurança para bloquear acessos externos
// Deve vir ANTES dos arquivos estáticos e rotas para proteger tudo
app.use((req, res, next) => {
  const clientIp = req.ip;
  // Verifica se o IP é local ou da rede interna 192.168.
  if (clientIp.startsWith('192.168.') || clientIp === '::1' || clientIp === '127.0.0.1' || clientIp === '::ffff:127.0.0.1') {
    next();
  } else {
    res.status(403).send('<html><body><h1>Acesso restrito à rede interna do restaurante (Rede ADM)</h1></body></html>');
  }
});

// Servir arquivos estáticos (index.html)
app.use(express.static(path.join(__dirname)));

// Rotas da API

// POST /api/pin/validar - Valida o PIN diário
app.post('/api/pin/validar', (req, res) => {
  const { pin } = req.body;
  const pinDiario = db.get('pinDiario').value();
  const hoje = new Date().toISOString().slice(0, 10);

  if (pinDiario.pin === pin && pinDiario.validoAte >= hoje) {
    res.status(200).json({ valid: true, message: 'PIN válido.' });
  } else {
    res.status(401).json({ valid: false, message: 'PIN inválido ou expirado.' });
  }
});

// POST /api/pin/gerar - Gera um novo PIN diário
app.post('/api/pin/gerar', (req, res) => {
  const novoPin = Math.floor(1000 + Math.random() * 9000).toString(); // PIN de 4 dígitos
  const hoje = new Date().toISOString().slice(0, 10);

  db.set('pinDiario', { pin: novoPin, validoAte: hoje }).write();
  res.status(200).json({ pin: novoPin, validoAte: hoje, message: 'Novo PIN gerado com sucesso.' });
});

// GET /api/cardapio - Lista todos os pratos do cardápio
app.get("/api/cardapio", (req, res) => {
  res.sendFile(path.join(__dirname, "cardapio.json"));
});

// GET /api/bebidas - Lista todas as bebidas
app.get('/api/bebidas', (req, res) => {
  const bebidas = db.get('bebidas').value();
  res.status(200).json(bebidas);
});

// PUT /api/bebidas/:id - Atualiza uma bebida existente
app.put('/api/bebidas/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  // Ensure pratosDaCasa is handled correctly
  if (updatedData.pratosDaCasa && !Array.isArray(updatedData.pratosDaCasa)) {
    updatedData.pratosDaCasa = [updatedData.pratosDaCasa]; // Convert to array if not already
  }

  const bebida = db.get("bebidas").find({ id: parseInt(id) }).assign(updatedData).write();

  if (bebida) {
    res.status(200).json({ message: 'Bebida atualizada com sucesso.', bebida });
  } else {
    res.status(404).json({ message: 'Bebida não encontrada.' });
  }
});

// Iniciar o servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
