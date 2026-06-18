import React, { useEffect, useState } from 'react';
import WineImage from './WineImage';
import './WineDetailModal.css';

function WineDetailModal({ wine, onClose }) {
  const [showImageZoom, setShowImageZoom] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!wine) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          
          <div className="modal-header">
            <div className="modal-image" onClick={() => setShowImageZoom(true)}>
              <WineImage wine={wine} />
            </div>
            <div className="modal-title">
              <h2>{wine.nome}</h2>
              <p className="modal-winery">{wine.vinicola} • {wine.pais}</p>
              {wine.fraseVenda && (
                <p className="modal-phrase">"{wine.fraseVenda}"</p>
              )}
            </div>
          </div>

          <div className="modal-body">
            <div className="modal-section">
              <h3>📋 Informações</h3>
              <div className="info-grid">
                <div><strong>Tipo:</strong> {wine.tipo}</div>
                <div><strong>Uva:</strong> {wine.uva?.join(', ')}</div>
                <div><strong>Safra:</strong> {wine.safra}</div>
                <div><strong>Teor:</strong> {wine.teorAlcoolico}</div>
                <div><strong>Corpo:</strong> {wine.corpo}</div>
                <div><strong>Acidez:</strong> {wine.acidez}</div>
                <div><strong>Taninos:</strong> {wine.taninos}</div>
                <div><strong>Serviço:</strong> {wine.temperaturaServico}</div>
              </div>
            </div>

            {wine.notasDominantes && wine.notasDominantes.length > 0 && (
              <div className="modal-section">
                <h3>👃 Notas Dominantes</h3>
                <div className="tags-list">
                  {wine.notasDominantes.map((nota, i) => (
                    <span key={i} className="nota-tag">{nota}</span>
                  ))}
                </div>
              </div>
            )}

            {wine.descricaoCurta && (
              <div className="modal-section">
                <h3>📝 Descrição</h3>
                <p>{wine.descricaoCurta}</p>
              </div>
            )}

            {wine.harmonizacaoPrincipal && wine.harmonizacaoPrincipal.length > 0 && (
              <div className="modal-section">
                <h3>🍽️ Harmonizações Recomendadas</h3>
                <div className="tags-list">
                  {wine.harmonizacaoPrincipal.map((h, i) => (
                    <span key={i} className="harmonia-tag">{h}</span>
                  ))}
                </div>
              </div>
            )}

            {wine.dicasGarcom && (
              <div className="modal-section sommelier-tips">
                <h3>💡 Dicas para o Garçom</h3>
                <p><strong>Como servir:</strong> {wine.dicasGarcom.comoServir}</p>
                <p><strong>O que dizer:</strong> {wine.dicasGarcom.oQueDizer}</p>
                {wine.dicasGarcom.curiosidades && (
                  <p><strong>Curiosidade:</strong> {wine.dicasGarcom.curiosidades}</p>
                )}
              </div>
            )}

            {wine.premiacoes && wine.premiacoes.length > 0 && (
              <div className="modal-section">
                <h3>🏆 Premiações</h3>
                <ul>
                  {wine.premiacoes.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {showImageZoom && wine.imagemUrl && (
        <ImageZoomModal
          imageUrl={wine.imagemUrl}
          alt={wine.nome}
          onClose={() => setShowImageZoom(false)}
        />
      )}
    </>
  );
}

export default WineDetailModal;