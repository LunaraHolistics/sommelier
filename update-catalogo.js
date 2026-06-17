const fs = require('fs');

// Regras para gerar dados automaticamente baseados no tipo
const regrasPorTipo = {
  'tinto': {
    corpo: ['Médio', 'Médio-Encorpado', 'Encorpado'],
    acidez: ['Média', 'Média-Alta', 'Alta'],
    taninos: ['Macios', 'Médios', 'Firmes'],
    aromas: ['Frutas vermelhas', 'Frutas negras', 'Especiarias', 'Baunilha', 'Carvalho'],
    tempServico: '16-18°C',
    tempArmazenamento: '12-14°C'
  },
  'branco': {
    corpo: ['Leve', 'Médio', 'Médio-Encorpado'],
    acidez: ['Média', 'Alta', 'Muito Alta'],
    taninos: ['N/A'],
    aromas: ['Cítricos', 'Frutas tropicais', 'Frutas brancas', 'Flores brancas', 'Minerais'],
    tempServico: '8-10°C',
    tempArmazenamento: '8-10°C'
  },
  'espumante': {
    corpo: ['Leve', 'Médio'],
    acidez: ['Alta', 'Muito Alta'],
    taninos: ['N/A'],
    aromas: ['Maçã verde', 'Cítricos', 'Brioche', 'Flores brancas', 'Minerais'],
    tempServico: '6-8°C',
    tempArmazenamento: '5-8°C'
  },
  'prosecco': {
    corpo: ['Leve', 'Médio'],
    acidez: ['Média-Alta', 'Alta'],
    taninos: ['N/A'],
    aromas: ['Maçã verde', 'Pera', 'Cítricos', 'Flores brancas'],
    tempServico: '6-8°C',
    tempArmazenamento: '5-8°C'
  },
  'champanhe': {
    corpo: ['Médio', 'Médio-Encorpado', 'Encorpado'],
    acidez: ['Alta', 'Muito Alta'],
    taninos: ['N/A'],
    aromas: ['Brioche', 'Cítricos', 'Maçã', 'Flores brancas', 'Minerais'],
    tempServico: '8-10°C',
    tempArmazenamento: '8-10°C'
  },
  'cidra': {
    corpo: ['Leve', 'Médio'],
    acidez: ['Média', 'Alta'],
    taninos: ['N/A'],
    aromas: ['Maçã verde', 'Maçã', 'Pera', 'Cítricos', 'Floral'],
    tempServico: '4-6°C',
    tempArmazenamento: '4-6°C'
  },
  'cachaça': {
    corpo: ['Leve', 'Médio', 'Médio-Encorpado'],
    acidez: ['Média', 'Média-Alta'],
    taninos: ['N/A'],
    aromas: ['Cana-de-açúcar', 'Cítricos', 'Ervas frescas', 'Baunilha', 'Frutas tropicais'],
    tempServico: '15-18°C',
    tempArmazenamento: '15-20°C'
  }
};

// Função para selecionar item aleatório de array
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Função para selecionar N itens aleatórios
function randomItems(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// Função para gerar perfilGustativo baseado no tipo
function gerarPerfilGustativo(tipo) {
  const regras = regrasPorTipo[tipo] || regrasPorTipo['tinto'];
  return {
    corpo: randomItem(regras.corpo),
    acidez: randomItem(regras.acidez),
    taninos: randomItem(regras.taninos)
  };
}

// Função para gerar notasDominantes
function gerarNotasDominantes(tipo) {
  const regras = regrasPorTipo[tipo] || regrasPorTipo['tinto'];
  return randomItems(regras.aromas, 3 + Math.floor(Math.random() * 3));
}

// Função para gerar harmonizacaoInteligente
function gerarHarmonizacaoInteligente(tipo, pratosDaCasa) {
  const categoriasPorTipo = {
    'tinto': ['Carnes', 'Massas', 'Queijos'],
    'branco': ['Peixes', 'Frutos do Mar', 'Saladas'],
    'espumante': ['Aperitivos', 'Frutos do Mar', 'Sobremesas'],
    'prosecco': ['Aperitivos', 'Peixes', 'Saladas'],
    'champanhe': ['Aperitivos', 'Frutos do Mar', 'Sobremesas'],
    'cidra': ['Aperitivos', 'Saladas', 'Sobremesas'],
    'cachaça': ['Aperitivos', 'Carnes', 'Sobremesas']
  };

  const categorias = categoriasPorTipo[tipo] || ['Carnes', 'Massas'];
  
  // Filtrar pratos do cardápio que fazem sentido
  const pratosPrincipais = pratosDaCasa.slice(0, 3);
  const pratosSecundarios = pratosDaCasa.slice(3, 6);

  return {
    categoriasPrato: categorias,
    proteinas: categorias.includes('Carnes') ? ['Carne Bovina', 'Suína'] : 
               categorias.includes('Peixes') ? ['Peixe', 'Frutos do Mar'] : ['Variados'],
    molhos: ['Molho da Casa', 'Molho de Tomate'],
    tecnicasPreparo: ['Grelhado', 'Assado'],
    saboresPrato: ['Umami', 'Especiarias'],
    intensidadeMatch: randomItem(['Alta', 'Média'])
  };
}

// Função para gerar dicasGarcom
function gerarDicasGarcom(nome, tipo, perfilSabor) {
  return {
    comoServir: `Servir ${tipo === 'tinto' ? 'em taça Bordeaux' : 'em taça adequada'} a ${tipo === 'tinto' ? '16-18°C' : '8-10°C'}`,
    oQueDizer: `${nome}: ${perfilSabor || 'Perfil elegante e equilibrado'}. Excelente escolha para harmonizar com nossos pratos da casa.`,
    perguntasFrequentes: [
      {
        pergunta: 'É um vinho seco?',
        resposta: `Sim, é um ${tipo} com perfil ${Math.random() > 0.5 ? 'seco' : 'equilibrado'}.`
      },
      {
        pergunta: 'Combina com qual prato?',
        resposta: 'Excelente com nossos pratos da casa, especialmente carnes e massas.'
      }
    ],
    curiosidades: `Vinho ${tipo} de excelente qualidade, perfeito para momentos especiais.`
  };
}

// Função para gerar filtrosAvancados
function gerarFiltrosAvancados(tipo, preco) {
  return {
    faixaPrecoNumeric: {
      min: preco - 20,
      max: preco + 20
    },
    rating: (3.5 + Math.random() * 1.5).toFixed(1),
    popularidade: randomItem(['Alta', 'Média', 'Alta']),
    safra: '2022',
    anoEngarrafamento: '2023',
    potencialGuarda: randomItem(['3 anos', '5 anos', '10 anos']),
    vegano: Math.random() > 0.5,
    organico: Math.random() > 0.7,
    semGluten: true
  };
}

// Função principal para atualizar o catálogo
function atualizarCatalogo() {
  try {
    // Ler catálogo atual
    const catalogoAtual = JSON.parse(fs.readFileSync('catalogo.json', 'utf-8'));
    
    // Ler cardápio para harmonização
    const cardapio = JSON.parse(fs.readFileSync('cardapio.json', 'utf-8'));
    const pratosDaCasa = Array.isArray(cardapio) ? cardapio : [];

    // Atualizar cada item
    const catalogoAtualizado = catalogoAtual.map(item => {
      const tipo = item.tipo || 'tinto';
      const preco = parseFloat((item.faixaPreco || 'R$ 100').replace(/[^0-9.]/g, '')) || 100;
      
      return {
        ...item,
        perfilGustativo: gerarPerfilGustativo(tipo),
        notasDominantes: gerarNotasDominantes(tipo),
        harmonizacaoInteligente: gerarHarmonizacaoInteligente(tipo, pratosDaCasa),
        dicasGarcom: gerarDicasGarcom(item.nome, tipo, item.perfilSabor),
        filtrosAvancados: gerarFiltrosAvancados(tipo, preco),
        temperaturaServico: (regrasPorTipo[tipo] || regrasPorTipo['tinto']).tempServico,
        temperaturaArmazenamento: (regrasPorTipo[tipo] || regrasPorTipo['tinto']).tempArmazenamento
      };
    });

    // Salvar catálogo atualizado
    fs.writeFileSync('catalogo.json', JSON.stringify(catalogoAtualizado, null, 2), 'utf-8');
    
    console.log(`✅ Catálogo atualizado com sucesso! ${catalogoAtualizado.length} itens processados.`);
    console.log('✅ Novos campos adicionados: perfilGustativo, notasDominantes, harmonizacaoInteligente, dicasGarcom, filtrosAvancados');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar catálogo:', error.message);
  }
}

// Executar
atualizarCatalogo();