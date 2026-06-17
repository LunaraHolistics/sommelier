const fs = require('fs');

// Categorias baseadas no nome do prato
function detectarCategoria(nome) {
  const nomeLower = nome.toLowerCase();
  
  if (nomeLower.includes('kids') || nomeLower.includes('infantil')) return 'Kids';
  if (nomeLower.includes('molho') || nomeLower.includes('chimichurri') || nomeLower.includes('vinagrete')) return 'Molhos';
  if (nomeLower.includes('farofa') || nomeLower.includes('vinagrete')) return 'Acompanhamentos';
  if (nomeLower.includes('sobremesa') || nomeLower.includes('sorvete') || nomeLower.includes('gelato') || nomeLower.includes('doce')) return 'Sobremesas';
  if (nomeLower.includes('entrada') || nomeLower.includes('aperitivo')) return 'Entradas';
  if (nomeLower.includes('sopa') || nomeLower.includes('caldo')) return 'Sopas';
  if (nomeLower.includes('salada')) return 'Saladas';
  if (nomeLower.includes('massa') || nomeLower.includes('macarrão') || nomeLower.includes('espaguete') || nomeLower.includes('penne') || nomeLower.includes('ravioli')) return 'Massas';
  if (nomeLower.includes('peixe') || nomeLower.includes('tilápia') || nomeLower.includes('salmão') || nomeLower.includes('bacalhau') || nomeLower.includes('camarão')) return 'Peixes e Frutos do Mar';
  if (nomeLower.includes('frango') || nomeLower.includes('aves')) return 'Aves';
  if (nomeLower.includes('carne') || nomeLower.includes('costela') || nomeLower.includes('filé') || nomeLower.includes('picanha')) return 'Carnes';
  
  return 'Pratos Principais';
}

// Detectar subcategoria mais específica
function detectarSubcategoria(nome, categoria) {
  const nomeLower = nome.toLowerCase();
  
  if (categoria === 'Carnes') {
    if (nomeLower.includes('costela')) return 'Costela';
    if (nomeLower.includes('filé')) return 'Filé Mignon';
    if (nomeLower.includes('picanha')) return 'Picanha';
    return 'Carnes Diversas';
  }
  
  if (categoria === 'Peixes e Frutos do Mar') {
    if (nomeLower.includes('camarão')) return 'Camarão';
    if (nomeLower.includes('tilápia')) return 'Tilápia';
    if (nomeLower.includes('peixe')) return 'Peixe';
    return 'Frutos do Mar';
  }
  
  if (categoria === 'Aves') {
    if (nomeLower.includes('frango')) return 'Frango';
    return 'Aves Diversas';
  }
  
  return categoria;
}

// Detectar proteínas principais
function detectarProteinas(nome) {
  const nomeLower = nome.toLowerCase();
  const proteinas = [];
  
  if (nomeLower.includes('carne') || nomeLower.includes('costela') || nomeLower.includes('filé') || nomeLower.includes('picanha') || nomeLower.includes('cupim')) {
    proteinas.push('Carne Bovina');
  }
  if (nomeLower.includes('frango') || nomeLower.includes('aves')) {
    proteinas.push('Frango');
  }
  if (nomeLower.includes('peixe') || nomeLower.includes('tilápia') || nomeLower.includes('salmão')) {
    proteinas.push('Peixe');
  }
  if (nomeLower.includes('camarão')) {
    proteinas.push('Frutos do Mar');
  }
  if (nomeLower.includes('porco') || nomeLower.includes('linguiça') || nomeLower.includes('bacon')) {
    proteinas.push('Suína');
  }
  if (nomeLower.includes('queijo')) {
    proteinas.push('Laticínio');
  }
  
  return proteinas.length > 0 ? proteinas : ['Vegetal'];
}

// Detectar técnicas de preparo
function detectarTecnicas(nome) {
  const nomeLower = nome.toLowerCase();
  const tecnicas = [];
  
  if (nomeLower.includes('frito') || nomeLower.includes('frita')) tecnicas.push('Frito');
  if (nomeLower.includes('grelhado') || nomeLower.includes('grelhada')) tecnicas.push('Grelhado');
  if (nomeLower.includes('assado') || nomeLower.includes('assada')) tecnicas.push('Assado');
  if (nomeLower.includes('cozido') || nomeLower.includes('cozida')) tecnicas.push('Cozido');
  if (nomeLower.includes('empanado') || nomeLower.includes('empanada')) tecnicas.push('Empanado');
  if (nomeLower.includes('defumado') || nomeLower.includes('defumada')) tecnicas.push('Defumado');
  
  return tecnicas.length > 0 ? tecnicas : ['Preparo da Casa'];
}

// Detectar sabores dominantes
function detectarSabores(nome) {
  const nomeLower = nome.toLowerCase();
  const sabores = [];
  
  if (nomeLower.includes('defumado') || nomeLower.includes('fumaça')) sabores.push('Defumado');
  if (nomeLower.includes('picante') || nomeLower.includes('pimenta')) sabores.push('Picante');
  if (nomeLower.includes('doce') || nomeLower.includes('caramelo')) sabores.push('Doce');
  if (nomeLower.includes('azedo') || nomeLower.includes('ácido')) sabores.push('Ácido');
  if (nomeLower.includes('salgado')) sabores.push('Salgado');
  if (nomeLower.includes('amargo')) sabores.push('Amargo');
  
  // Sabores padrão baseados na categoria
  if (sabores.length === 0) {
    sabores.push('Umami', 'Especiarias');
  }
  
  return sabores;
}

// Função principal para atualizar o cardápio
function atualizarCardapio() {
  try {
    // Ler cardápio atual
    const cardapioAtual = JSON.parse(fs.readFileSync('cardapio.json', 'utf-8'));
    
    // Se já for array de objetos, apenas atualizar
    if (cardapioAtual.length > 0 && typeof cardapioAtual[0] === 'object') {
      console.log('✅ Cardápio já está no formato de objetos. Atualizando campos...');
      
      const cardapioAtualizado = cardapioAtual.map(item => {
        const nome = item.nome || item;
        const categoria = item.categoria || detectarCategoria(nome);
        
        return {
          ...item,
          nome: nome,
          categoria: categoria,
          subcategoria: item.subcategoria || detectarSubcategoria(nome, categoria),
          proteinas: item.proteinas || detectarProteinas(nome),
          tecnicasPreparo: item.tecnicasPreparo || detectarTecnicas(nome),
          saboresDominantes: item.saboresDominantes || detectarSabores(nome),
          serve: item.serve || 'Individual'
        };
      });
      
      fs.writeFileSync('cardapio.json', JSON.stringify(cardapioAtualizado, null, 2), 'utf-8');
      console.log(`✅ Cardápio atualizado! ${cardapioAtualizado.length} pratos processados.`);
      
    } else {
      // Se for array de strings, converter para objetos
      console.log('✅ Convertendo cardápio de strings para objetos...');
      
      const cardapioAtualizado = cardapioAtual.map(nome => {
        const categoria = detectarCategoria(nome);
        
        return {
          nome: nome,
          categoria: categoria,
          subcategoria: detectarSubcategoria(nome, categoria),
          proteinas: detectarProteinas(nome),
          tecnicasPreparo: detectarTecnicas(nome),
          saboresDominantes: detectarSabores(nome),
          serve: 'Individual'
        };
      });
      
      fs.writeFileSync('cardapio.json', JSON.stringify(cardapioAtualizado, null, 2), 'utf-8');
      console.log(`✅ Cardápio convertido! ${cardapioAtualizado.length} pratos processados.`);
    }
    
    console.log('✅ Novos campos adicionados: categoria, subcategoria, proteinas, tecnicasPreparo, saboresDominantes');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar cardápio:', error.message);
  }
}

// Executar
atualizarCardapio();