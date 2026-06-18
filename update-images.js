// update-images.js - Atualiza URLs das imagens no catalogo.json
const fs = require('fs');
const path = require('path');

const catalogoPath = path.join(__dirname, 'data', 'catalogo.json');

// Mapeamento de vinhos para URLs do 64wine.ie (exemplos)
const imageMap = {
  'Trapiche Vineyards Malbec': 'https://64wine.ie/cdn/shop/products/trapiche-malbec_1200x.jpg',
  'Catena Zapata Malbec Argentino': 'https://64wine.ie/cdn/shop/products/catena-zapata-malbec-argentino_1200x.jpg',
  'Alamos Malbec': 'https://64wine.ie/cdn/shop/products/alamos-malbec_1200x.jpg',
  'Norton Reserva Malbec': 'https://64wine.ie/cdn/shop/products/norton-reserva-malbec_1200x.jpg',
  'Montes Alpha Cabernet Sauvignon': 'https://64wine.ie/cdn/shop/products/montes-alpha-cabernet-sauvignon_1200x.jpg',
  'Chandon Brut': 'https://64wine.ie/cdn/shop/products/chandon-brut_1200x.jpg',
  'Casa Valduga Arte Brut': 'https://64wine.ie/cdn/shop/products/casa-valduga-arte-brut_1200x.jpg',
  'Miolo Terroir Chardonnay': 'https://64wine.ie/cdn/shop/products/miolo-terroir-chardonnay_1200x.jpg',
  'Cloudy Bay Sauvignon Blanc': 'https://64wine.ie/cdn/shop/products/cloudy-bay-sauvignon-blanc_1200x.jpg',
  'Moët & Chandon Impérial Brut': 'https://64wine.ie/cdn/shop/products/moet-chandon-imperial-brut_1200x.jpg'
};

try {
  const catalogo = JSON.parse(fs.readFileSync(catalogoPath, 'utf-8'));
  
  let updated = 0;
  catalogo.forEach(item => {
    // Tenta encontrar no mapeamento
    if (imageMap[item.nome]) {
      item.imagemUrl = imageMap[item.nome];
      updated++;
    } else {
      // Se não encontrar, deixa vazio (será tratado pelo placeholder)
      item.imagemUrl = '';
    }
  });
  
  fs.writeFileSync(catalogoPath, JSON.stringify(catalogo, null, 2));
  console.log(`✅ ${updated} imagens atualizadas com sucesso!`);
  console.log(`📍 Arquivo salvo em: ${catalogoPath}`);
} catch (error) {
  console.error('❌ Erro ao atualizar imagens:', error.message);
}