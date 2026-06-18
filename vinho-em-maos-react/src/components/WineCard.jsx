import React, { useState } from 'react';
import WineDetailModal from './WineDetailModal';
import './WineCard.css';

function WineCard({ wine, onClick }) {
  const [showModal, setShowModal] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price || 0);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(wine);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="wine-card" onClick={handleClick}>
        {wine.imagemUrl ? (
          <div className="wine-image">
            <img src={wine.imagemUrl} alt={wine.nome} />
          </div>
        ) : (
          <div className="wine-image">
            <span style={{ fontSize: '3rem' }}>🍷</span>
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
        </div>
      </div>

      {showModal && (
        <WineDetailModal wine={wine} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

export default WineCard;