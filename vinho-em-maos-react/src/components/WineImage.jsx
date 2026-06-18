import React, { useState } from 'react';
import { useImageCache } from '../hooks/useImageCache';
import ImageZoomModal from './ImageZoomModal';
import './WineImage.css';

function WineImage({ wine, className = '' }) {
  const [showZoom, setShowZoom] = useState(false);
  const { cachedUrl, isLoading, hasError } = useImageCache(wine.imagemUrl);

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

  const getInitials = (nome) => {
    if (!nome) return '🍷';
    const words = nome.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0].substring(0, 2).toUpperCase();
  };

  const handleClick = () => {
    if (cachedUrl && !hasError) {
      setShowZoom(true);
    }
  };

  return (
    <>
      <div 
        className={`wine-image-container ${className} ${cachedUrl ? 'clickable' : ''}`}
        onClick={handleClick}
      >
        {isLoading && (
          <div className="wine-image-loading">
            <div className="spinner-small"></div>
          </div>
        )}

        {hasError || !cachedUrl ? (
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
            src={cachedUrl} 
            alt={wine.nome}
            className="wine-image"
            loading="lazy"
          />
        )}

        {cachedUrl && !hasError && (
          <div className="wine-image-zoom-hint">
            🔍
          </div>
        )}
      </div>

      {showZoom && (
        <ImageZoomModal
          imageUrl={cachedUrl}
          alt={wine.nome}
          onClose={() => setShowZoom(false)}
        />
      )}
    </>
  );
}

export default WineImage;