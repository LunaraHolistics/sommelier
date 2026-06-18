import React, { useState } from 'react';
import './WineImage.css';

function WineImage({ wine, className = '', onImageClick }) {
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
  const showPlaceholder = !wine.imagemUrl || imgError;

  return (
    <div 
      className={`wine-image-container ${className} ${!showPlaceholder ? 'clickable' : ''}`}
      onClick={() => !showPlaceholder && onImageClick && onImageClick()}
    >
      {showPlaceholder ? (
        <div 
          className="wine-image-placeholder"
          style={{ background: getGradient(wine.tipo) }}
        >
          <span className="placeholder-icon">
            {wine.tipo === 'Espumante' ? '🍾' : 
             wine.tipo === 'Branco' ? '🥂' : 
             wine.tipo === 'Rosé' ? '🌸' : '🍷'}
          </span>
          <span className="placeholder-initials">{getInitials(wine.nome)}</span>
          <span className="placeholder-name">{wine.vinicola || wine.nome}</span>
        </div>
      ) : (
        <img 
          src={wine.imagemUrl}
          alt={wine.nome}
          className="wine-image"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}

export default WineImage;