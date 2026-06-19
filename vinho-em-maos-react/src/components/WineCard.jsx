import React, { useState, useEffect } from 'react';
import WineImage from './WineImage';
import WineDetailModal from './WineDetailModal';
import './WineCard.css';

function WineCard({ 
  wine, 
  mode = 'client', 
  isExpanded = false, 
  onToggle, 
  onZoomToggle,
  onClick // ← NOVA PROP OPCIONAL
}) {
  const [showModal, setShowModal] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price || 0);
  };

  const isAvailable = wine.active && wine.stock > 0;

  // Bloquear scroll quando expandido
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isExpanded]);

  // Fechar com ESC
  useEffect(() => {
    if (!isExpanded) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onToggle?.(wine.id);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isExpanded, onToggle, wine.id]);

  const handleCardClick = (e) => {
    e.stopPropagation();
    
    // Se onClick foi passado, usar ele (Harmonization)
    // Senão, usar onToggle (SommelierView - página de bebidas)
    if (onClick) {
      onClick(wine);
    } else {
      onToggle?.(wine.id);
    }
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    onZoomToggle?.(wine);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    onToggle?.(wine.id);
  };

  const handleModalOpen = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const handleOverlayClick = (e) => {
    e.stopPropagation();
    onToggle?.(wine.id);
  };

  return (
    <>
      {/* Card no Grid (sempre visível) */}
      <article
        className={`wine-card ${!isAvailable ? 'unavailable' : ''}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(e); } }}
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
          <span className="toggle-indicator" aria-hidden="true">
            ▼
          </span>
        </div>

        {!isAvailable && (
          <div className="unavailable-overlay" aria-label="Produto indisponível">
            ❌ Indisponível
          </div>
        )}
      </article>

      {/* Overlay + Painel Expandido (MODAL FIXO) */}
      {isExpanded && (
        <>
          <div className="expanded-overlay" onClick={handleOverlayClick} />
          <aside className="expanded-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-details-btn"
              onClick={handleClose}
              aria-label="Fechar detalhes"
            >
              ✕
            </button>

            <div className="details-layout">
              <figure className="details-figure" onClick={handleImageClick}>
                <img
                  src={wine.imagemUrl || '/placeholder-wine.png'}
                  alt={`${wine.nome} - Garrafa completa`}
                  className="detail-large-img"
                  onError={(e) => { e.target.src = '/placeholder-wine.png'; }}
                />
                <span className="zoom-hint">🔍 Clique para ampliar</span>
              </figure>

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

                {mode === 'sommelier' && (
                  <footer className="stock-badges">
                    <span className={`badge stock-badge ${wine.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                      Estoque: {wine.stock}
                    </span>
                    <span className={`badge active-badge ${wine.active ? 'active' : 'inactive'}`}>
                      {wine.active ? 'Ativo' : 'Inativo'}
                    </span>
                    {wine.price && (
                      <span className="badge price-badge">
                        {formatPrice(wine.price)}
                      </span>
                    )}
                  </footer>
                )}

                <button
                  className="open-modal-btn"
                  onClick={handleModalOpen}
                >
                  📋 Ver detalhes completos
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Modal de Detalhes Completo */}
      {showModal && (
        <WineDetailModal
          wine={wine}
          onClose={() => setShowModal(false)}
          mode={mode}
        />
      )}
    </>
  );
}

export default WineCard;