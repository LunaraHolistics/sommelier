import React, { useEffect, useState } from 'react';
import './ImageZoomModal.css';

function ImageZoomModal({ imageUrl, alt, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    img.onload = () => setIsLoading(false);
    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
    };
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div className="image-zoom-overlay" onClick={onClose}>
      <div className="image-zoom-container" onClick={(e) => e.stopPropagation()}>
        <button className="image-zoom-close" onClick={onClose}>
          ×
        </button>
        
        {isLoading && (
          <div className="image-zoom-loading">
            <div className="spinner"></div>
            <p>Carregando imagem...</p>
          </div>
        )}

        {hasError && (
          <div className="image-zoom-error">
            <span style={{ fontSize: '4rem' }}>🍷</span>
            <p>Não foi possível carregar a imagem</p>
          </div>
        )}

        {!isLoading && !hasError && (
          <img 
            src={imageUrl} 
            alt={alt} 
            className="image-zoom-img"
          />
        )}

        <div className="image-zoom-hint">
          Clique fora ou pressione ESC para fechar
        </div>
      </div>
    </div>
  );
}

export default ImageZoomModal;