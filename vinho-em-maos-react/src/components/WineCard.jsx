import React from 'react';
import WineImage from './WineImage';
import './WineCard.css';

function WineCard({ wine, onClick, userRole }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price || 0);
  };

  return (
    <div className="wine-card" onClick={() => onClick && onClick(wine)}>
      <WineImage wine={wine} />
      
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

        {userRole === 'manager' && (
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
  );
}

export default WineCard;