import React from 'react';
import WineCard from '../../components/WineCard';
import './Harmonization.css';

function Harmonization({ dish, suggestions, onBack }) {
  // Validação de segurança
  if (!dish) {
    return (
      <div className="harmonization-view">
        <div className="error-message">
          <p>Erro: Prato não selecionado</p>
          <button onClick={onBack} className="btn-back">Voltar</button>
        </div>
      </div>
    );
  }

  const getScoreLevel = (score) => {
    if (score >= 10) return 'Excelente';
    if (score >= 7) return 'Muito Bom';
    if (score >= 4) return 'Bom';
    return 'Sugerido';
  };

  const getScoreColor = (score) => {
    if (score >= 10) return '#4caf50';
    if (score >= 7) return '#8bc34a';
    if (score >= 4) return '#ffc107';
    return '#ff9800';
  };

  return (
    <div className="harmonization-view">
      <div className="harmonization-header">
        <button onClick={onBack} className="btn-back">
          ← Voltar
        </button>
        <div className="dish-info">
          <h2>{dish.nome}</h2>
          <p>{dish.descricao}</p>
          {dish.nivelHarmonizacao && (
            <span className="dish-level">
              Nível de Harmonização: <strong>{dish.nivelHarmonizacao.toUpperCase()}</strong>
            </span>
          )}
        </div>
      </div>

      {dish.dicaSommelier && (
        <div className="sommelier-tip">
          <h4>💡 Dica do Sommelier</h4>
          <p>{dish.dicaSommelier}</p>
        </div>
      )}

      <div className="suggestions-section">
        <h3>🍷 Vinhos Recomendados ({suggestions?.length || 0})</h3>
        
        {!suggestions || suggestions.length === 0 ? (
          <p className="no-suggestions">
            Nenhuma sugestão de harmonização encontrada para este prato.
            <br />
            <small>Tente outro prato ou ajuste os filtros.</small>
          </p>
        ) : (
          <div className="suggestions-grid">
            {suggestions.map((wine, index) => (
              <div key={wine.id || index} className="suggestion-card">
                <WineCard wine={wine} />
                {wine.score > 0 && (
                  <div className="match-score">
                    <span className="score-label" style={{ color: getScoreColor(wine.score) }}>
                      {getScoreLevel(wine.score)} ({wine.score} pts)
                    </span>
                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{ 
                          width: `${Math.min(wine.score * 8, 100)}%`,
                          background: `linear-gradient(90deg, ${getScoreColor(wine.score)} 0%, #722f37 100%)`
                        }}
                      />
                    </div>
                    {wine.reasons && wine.reasons.length > 0 && (
                      <div className="match-reasons">
                        {wine.reasons.slice(0, 3).map((reason, i) => (
                          <span key={i} className="reason-tag">{reason}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {dish.melhoresRotulos && dish.melhoresRotulos.length > 0 && (
        <div className="sommelier-tip">
          <h4>🏆 Rótulos Ideais para este Prato</h4>
          <div className="tags-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
            {dish.melhoresRotulos.map((rotulo, i) => (
              <span key={i} style={{
                background: '#d4af37',
                color: '#333',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {rotulo}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Harmonization;