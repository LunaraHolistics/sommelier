import React, { useState } from 'react';
import './WineImage.css';

function WineImage({ wine, className = '', onClick }) {
  const [imgError, setImgError] = useState(false);
  const [showZoom, setShowZoom] = useState(false);

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

  const handleClick = () => {
    if (wine.imagemUrl && !imgError) {
      setShowZoom(true);
    }
    if (onClick) onClick(wine);
  };

  return (
    <>
      <div 
        className={`wine-image-container ${className} ${wine.imagemUrl && !imgError ? 'clickable' : ''}`}
        onClick={handleClick}
      >
        {!wine.imagemUrl || imgError ? (
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

        {wine.imagemUrl && !imgError && (
          <div className="wine-image-zoom-hint">
            🔍
          </div>
        )}
      </div>

      {showZoom && (
        <div className="image-zoom-overlay" onClick={() => setShowZoom(false)}>
          <div className="image-zoom-container" onClick={(e) => e.stopPropagation()}>
            <button className="image-zoom-close" onClick={() => setShowZoom(false)}>
              ×
            </button>
            <img 
              src={wine.imagemUrl}
              alt={wine.nome}
              className="image-zoom-img"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default WineImage;