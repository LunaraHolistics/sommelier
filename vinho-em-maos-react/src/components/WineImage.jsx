import React, { useState } from 'react';

function WineImage({ wine, className = '' }) {
  const [imgError, setImgError] = useState(false);

  // Cores baseadas no tipo de vinho
  const getGradient = (tipo) => {
    const gradients = {
      'Tinto': 'linear-gradient(135deg, #722f37 0%, #5a252c 100%)',
      'Branco': 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
      'Rosé': 'linear-gradient(135deg, #f4a4b8 0%, #d4849a 100%)',
      'Espumante': 'linear-gradient(135deg, #f5f5dc 0%, #e8e8c8 100%)',
      'Destilado': 'linear-gradient(135deg, #8b4513 0%, #654321 100%)',
    };
    return gradients[tipo] || gradients['Tinto'];
  };

  // Gerar iniciais do vinho
  const getInitials = (nome) => {
    if (!nome) return '🍷';
    const words = nome.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0].substring(0, 2).toUpperCase();
  };

  // Se não há imagem ou deu erro, mostra placeholder
  if (!wine.imagemUrl || imgError) {
    return (
      <div 
        className={`wine-image-placeholder ${className}`}
        style={{ 
          background: getGradient(wine.tipo),
          width: '100%',
          height: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          color: 'white',
          fontSize: '2rem',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        <span style={{ fontSize: '3rem', marginBottom: '10px' }}>
          {wine.tipo === 'Espumante' ? '🍾' : 
           wine.tipo === 'Branco' ? '🥂' : 
           wine.tipo === 'Rosé' ? '' : '🍷'}
        </span>
        <span style={{ fontSize: '1.5rem' }}>
          {getInitials(wine.nome)}
        </span>
        <span style={{ fontSize: '0.9rem', marginTop: '5px', opacity: 0.9 }}>
          {wine.vinicola || wine.nome}
        </span>
      </div>
    );
  }

  // Tenta carregar imagem externa
  return (
    <div className={`wine-image-container ${className}`}>
      <img
        src={wine.imagemUrl}
        alt={wine.nome}
        onError={() => setImgError(true)}
        style={{
          width: '100%',
          height: '200px',
          objectFit: 'contain',
          borderRadius: '8px',
          background: '#f5f5f5'
        }}
      />
    </div>
  );
}

export default WineImage;