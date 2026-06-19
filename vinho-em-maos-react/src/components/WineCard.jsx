import React, { useState } from 'react';
import WineImage from './WineImage';
import WineDetailModal from './WineDetailModal';
import './WineCard.css';

function WineCard({ wine, mode = 'client' }) {
  const [showModal, setShowModal] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price || 0);
  };

  const isAvailable = wine.active && wine.stock > 0;

  return (
    <>
      <div className={`wine-card ${!isAvailable ? 'unavailable' : ''}`} onClick={() => setShowModal(true)}>
        <WineImage wine={wine} />
        
        {!isAvailable && (
          <div className="unavailable-overlay">
            <span className="unavailable-text">❌ Indisponível</span>
          </div>
        )}
        
        <div className="wine-info">
          <h3 className="wine-name">{wine.nome}</h3>
          <p className="wine-winery">{wine.vinicola}</p>
          
          <div className="wine-details">
            <span className="wine-type">{wine.tipo}</span>
            <span className="wine-country">{wine.pais}</span>
            {wine.safra && <span className="wine-vintage">{wine.safra}</span>}
          </div>

          {wine.descricaoCurta && (
            <p className="wine-description">{wine.descricaoCurta}</p>
          )}

          <div className="wine-footer">
            <span className="wine-price">{formatPrice(wine.price)}</span>
            {wine.uva && wine.uva.length > 0 && (
              <span className="wine-grape">{wine.uva[0]}</span>
            )}
          </div>

          {/* Badges de estoque apenas no modo sommelier */}
          {mode === 'sommelier' && (
            <div className="stock-badge-container">
              <span className={`stock-badge ${wine.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {wine.stock > 0 ? `Estoque: ${wine.stock}` : 'Sem estoque'}
              </span>
              <span className={`active-badge ${wine.active ? 'active' : 'inactive'}`}>
                {wine.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <WineDetailModal wine={wine} onClose={() => setShowModal(false)} mode={mode} />
      )}
    </>
  );
}

export default WineCard;