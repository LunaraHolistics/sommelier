import React from 'react';
import WineImage from './WineImage';
import WineDetailModal from './WineDetailModal';
import './WineCard.css';

function WineCard({ wine, mode = 'client', onOpenModal }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price || 0);
  };

  const isAvailable = wine.active && wine.stock > 0;

  const handleClick = () => {
    onOpenModal?.(wine);
  };

  return (
    <>
      <article
        className={`wine-card ${!isAvailable ? 'unavailable' : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { 
          if (e.key === 'Enter' || e.key === ' ') { 
            e.preventDefault(); 
            handleClick(); 
          } 
        }}
        aria-label={`Ver detalhes de ${wine.nome}`}
      >
        <div className="wine-preview">
          <div className="wine-thumb" aria-hidden="true">
            <WineImage wine={wine} />
          </div>
          <div className="wine-preview-info">
            <h3 className="wine-name">{wine.nome}</h3>
            <p className="wine-winery">{wine.vinicola}</p>
            <div className="quick-tags">
              <span className="tag">{wine.tipo}</span>
              <span className="tag">{wine.pais}</span>
              {wine.safra && <span className="tag vintage">{wine.safra}</span>}
            </div>
          </div>
        </div>

        {!isAvailable && (
          <div className="unavailable-overlay" aria-label="Produto indisponível">
            ❌ Indisponível
          </div>
        )}

        {mode === 'sommelier' && wine.price && (
          <div className="wine-price-tag">
            {formatPrice(wine.price)}
          </div>
        )}
      </article>
    </>
  );
}

export default WineCard;