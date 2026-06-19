import React, { useState, useEffect, useRef } from 'react';
import WineImage from './WineImage';
import WineDetailModal from './WineDetailModal';
import './WineCard.css';

function WineCard({ wine, mode = 'client', isExpanded = false, onToggle, onZoomToggle }) {
  const [showModal, setShowModal] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const cardRef = useRef(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price || 0);
  };

  const isAvailable = wine.active && wine.stock > 0;

  // Fechar com ESC
  useEffect(() => {
    if (!isExpanded) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowExpanded(false);
        onToggle?.(wine.id);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isExpanded, onToggle, wine.id]);

  // Bloquear scroll quando expandido
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isExpanded]);

  // Sincronizar estado local com prop
  useEffect(() => {
    if (isExpanded) {
      // Pequeno delay para permitir que o modal apareça suavemente
      const timer = setTimeout(() => setShowExpanded(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowExpanded(false);
    }
  }, [isExpanded]);

  const handleClick = (e) => {
    e.stopPropagation();
    onToggle?.(wine.id);
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    onZoomToggle?.(wine);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setShowExpanded(false);
    setTimeout(() => onToggle?.(wine.id), 300); // Aguarda animação
  };

  const handleModalOpen = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      {/* Card no Grid (sempre visível) */}
      <article
        ref={cardRef}
        className={`wine-card ${isExpanded ? 'expanded-trigger' : ''} ${!isAvailable ? 'unavailable' : ''}`}
        onClick={handleClick}
        aria-expanded={isExpanded}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e); } }}
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
          <span className="toggle-indicator" aria-hidden="true">
            {isExpanded ? '✕' : '▼'}
          </span>
        </div>

        {/* Badge de Indisponível */}
        {!isAvailable && !isExpanded && (
          <div className="unavailable-overlay" aria-label="Produto indisponível">
             Indisponível
          </div>
        )}
      </article>

      {/* Modal de Detalhes Expandidos (separado do card) */}
      {showExpanded && (
        <>
          {/* Overlay escuro */}
          <div className="expanded-overlay" onClick={handleClose} aria-hidden="true" />
          
          {/* Modal de detalhes */}
          <aside className="expanded-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-details-btn"
              onClick={handleClose}
              aria-label="Fechar detalhes"
            >
              ✕
            </button>

            <div className="details-layout">
              {/* Imagem Grande com Zoom */}
              <figure className="details-figure" onClick={handleImageClick}>
                <img
                  src={wine.imagemUrl || '/placeholder-wine.png'}
                  alt={`${wine.nome} - Garrafa completa`}
                  className="detail-large-img"
                  onError={(e) => { e.target.src = '/placeholder-wine.png'; }}
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
                    {wine.price && (
                      <span className="badge price-badge">
                        {formatPrice(wine.price)}
                      </span>
                    )}
                  </footer>
                )}

                {/* Botão para abrir modal completo */}
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

      {/* Modal de Detalhes Completo (WineDetailModal) */}
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