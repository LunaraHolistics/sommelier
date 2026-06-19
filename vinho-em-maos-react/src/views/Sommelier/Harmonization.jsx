import React, { useState } from 'react';
import WineCard from '../../components/WineCard';
import './Harmonization.css';

function Harmonization({ dish, suggestions, onBack, mode }) {
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterDisponivel, setFilterDisponivel] = useState('all');

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

  // Filtrar sugestões
  const filteredSuggestions = suggestions.filter(wine => {
    const matchTipo = filterTipo === 'all' || wine.tipo?.toLowerCase() === filterTipo.toLowerCase();
    const matchDisponivel = filterDisponivel === 'all' || 
      (filterDisponivel === 'disponivel' ? (wine.active && wine.stock > 0) : (!wine.active || wine.stock <= 0));
    return matchTipo && matchDisponivel;
  });

  // Ordenar: disponíveis primeiro, depois por score
  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    const aDisponivel = a.active && a.stock > 0;
    const bDisponivel = b.active && b.stock > 0;
    
    if (aDisponivel && !bDisponivel) return -1;
    if (!aDisponivel && bDisponivel) return 1;
    
    return b.score - a.score;
  });

  const tiposVinho = ['all', 'Tinto', 'Branco', 'Rosé', 'Espumante', 'Destilado'];

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
        <div className="suggestions-header">
          <h3>🍷 Vinhos Recomendados ({filteredSuggestions.length})</h3>
          
          <div className="filters-container">
            <div className="filter-group">
              <label>Tipo:</label>
              <select 
                value={filterTipo} 
                onChange={(e) => setFilterTipo(e.target.value)}
                className="filter-select"
              >
                {tiposVinho.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo === 'all' ? 'Todos' : tipo}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Disponibilidade:</label>
              <select 
                value={filterDisponivel} 
                onChange={(e) => setFilterDisponivel(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todos</option>
                <option value="disponivel">✅ Disponíveis</option>
                <option value="indisponivel">❌ Indisponíveis</option>
              </select>
            </div>
          </div>
        </div>
        
        {sortedSuggestions.length === 0 ? (
          <p className="no-suggestions">
            Nenhum vinho encontrado com estes filtros.
            <br />
            <small>Tente ajustar os filtros ou selecione outro prato.</small>
          </p>
        ) : (
          <div className="suggestions-grid">
            {sortedSuggestions.map((wine, index) => {
              const isAvailable = wine.active && wine.stock > 0;
              
              return (
                <div 
                  key={wine.id} 
                  className={`suggestion-card ${!isAvailable ? 'unavailable' : ''}`}
                >
                  <WineCard wine={wine} mode={mode} />
                  
                  {!isAvailable && (
                    <div className="unavailable-badge">
                      ❌ Indisponível
                    </div>
                  )}
                  
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
              );
            })}
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