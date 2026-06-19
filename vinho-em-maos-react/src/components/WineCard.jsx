import React, { useState } from 'react';
import WineImage from './WineImage';
import WineDetailModal from './WineDetailModal';
import './WineCard.css';

function WineCard({ 
  wine, 
  mode = 'client',
  isExpanded = false,
  onToggle,
  onZoomToggle 
}) {
  const [showModal, setShowModal] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price || 0);
  };

  const isAvailable = wine.active && wine.stock > 0;

  // Prevenir propagação do evento de clique
  const handleClick = (e) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle(wine.id);
    }
  };

  return (
    <article 
      className={`wine-card ${isExpanded ? 'expanded' : ''} ${!isAvailable ? 'unavailable' : ''}`}
      onClick={handleClick}
      aria-expanded={isExpanded}
    >
      {/* Preview do Card */}
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

        <span 
          className={`toggle-indicator ${isExpanded ? 'rotated' : ''}`} 
          aria-hidden="true"
        >
          ▼
        </span>
      </div>

      {/* Indicação de Indisponível */}
      {!isAvailable && !isExpanded && (
        <div className="unavailable-overlay" aria-label="Produto indisponível">
          ❌ Indisponível
        </div>
      )}

      {/* Painel de Detalhes Expandidos */}
      {isExpanded && (
        <aside className="wine-details-panel">
          <button 
            className="close-details-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onToggle(wine.id);
            }}
            aria-label="Fechar detalhes"
          >
            ×
          </button>
          
          <div className="details-layout">
            {/* Imagem Grande com Zoom */}
            <figure className="details-figure" onClick={(e) => {
              e.stopPropagation();
              onZoomToggle && onZoomToggle(wine);
            }}>
              <img 
                src={wine.imagemUrl || '/placeholder-wine.png'} 
                alt={`${wine.nome} - Garrafa completa`}
                className="detail-large-img"
              />
              <span className="zoom-hint">🔍 Clique para ampliar</span>
            </figure>

            {/* Informações Detalhadas */}
            <div className="details-content">
              <header className="detail-header">
                <h2 className="detail-title">{wine.nome}</h2>
                <p className="detail-subtitle">
                  {wine.vinicola} • {wine.regiao}, {wine.pais}
                </p>
              </header>

              <div className="info-grid">
                <div><strong>Tipo:</strong> {wine.tipo}</div>
                <div><strong>Uva(s):</strong> {wine.uva?.join(', ')}</div>
                <div><strong>Safra:</strong> {wine.safra}</div>
                <div><strong>Teor:</strong> {wine.teorAlcoolico}</div>
                <div><strong>Corpo:</strong> {wine.corpo}</div>
                <div><strong>Acidez:</strong> {wine.acidez}</div>
                <div><strong>Taninos:</strong> {wine.taninos}</div>
                <div><strong>Serviço:</strong> {wine.temperaturaServico}</div>
              </div>

              {wine.descricaoCurta && (
                <p className="description-text">{wine.descricaoCurta}</p>
              )}

              {wine.fraseVenda && (
                <blockquote className="frase-venda">
                  "{wine.fraseVenda}"
                </blockquote>
              )}

              {/* Badges de Estoque (modo Sommelier) */}
              {mode === 'sommelier' && (
                <footer className="stock-badges">
                  <span className={`badge stock-badge ${wine.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    Estoque: {wine.stock}
                  </span>
                  <span className={`badge active-badge ${wine.active ? 'active' : 'inactive'}`}>
                    {wine.active ? 'Ativo' : 'Inativo'}
                  </span>
                </footer>
              )}

              {/* Preço e Uva */}
              <div className="wine-footer">
                <span className="wine-price">{formatPrice(wine.price)}</span>
                {wine.uva?.[0] && (
                  <span className="wine-grape">{wine.uva[0]}</span>
                )}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Modal de Detalhes Completo (quando clica no preview) */}
      {showModal && (
        <WineDetailModal 
          wine={wine} 
          onClose={() => setShowModal(false)} 
          mode={mode} 
        />
      )}
    </article>
  );
}

export default WineCard;