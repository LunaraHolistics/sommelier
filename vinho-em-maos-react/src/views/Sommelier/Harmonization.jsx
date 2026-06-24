import React, { useState, useMemo } from 'react';
import WineCard from '../../components/WineCard';
import WineDetailModal from '../../components/WineDetailModal';
import SearchBar from '../../components/SearchBar';
import './Harmonization.css';

/**
 * Calcula score de match (0-15) entre prato e vinho
 * usando harmonizacaoInteligente do vinho + metadados do prato
 */
const calculateMatch = (wine, dish) => {
  let score = 0;
  const reasons = [];
  const hi = wine.harmonizacaoInteligente || {};

  // Match por proteína
  if (hi.proteinas && dish.proteinas) {
    const match = hi.proteinas.some(p => dish.proteinas.includes(p));
    if (match) {
      score += 4;
      reasons.push(`Proteína: ${hi.proteinas.find(p => dish.proteinas.includes(p))}`);
    }
  }

  // Match por técnica de preparo
  if (hi.tecnicasPreparo && dish.tecnicasPreparo) {
    const match = hi.tecnicasPreparo.some(t => dish.tecnicasPreparo.includes(t));
    if (match) {
      score += 3;
      reasons.push(`Técnica: ${hi.tecnicasPreparo.find(t => dish.tecnicasPreparo.includes(t))}`);
    }
  }

  // Match por sabor dominante
  if (hi.saboresPrato && dish.saboresDominantes) {
    const match = hi.saboresPrato.some(s => dish.saboresDominantes.includes(s));
    if (match) {
      score += 3;
      reasons.push(`Sabor: ${hi.saboresPrato.find(s => dish.saboresDominantes.includes(s))}`);
    }
  }

  // Match por categoria
  if (hi.categoriasPrato && dish.categoria) {
    const match = hi.categoriasPrato.some(c =>
      dish.categoria.toLowerCase().includes(c.toLowerCase()) ||
      c.toLowerCase().includes(dish.categoria.toLowerCase())
    );
    if (match) {
      score += 2;
      reasons.push('Categoria compatível');
    }
  }

  // Bônus se o prato está nas harmonizações principais
  if (wine.harmonizacaoPrincipal?.some(h =>
    h.toLowerCase().includes(dish.nome.toLowerCase().split(' ')[0]) ||
    dish.nome.toLowerCase().includes(h.toLowerCase().split(' ')[0])
  )) {
    score += 3;
    reasons.push('Recomendação do sommelier');
  }

  // Bônus por intensidade match
  if (hi.intensidadeMatch === 'Alta') score += 1;

  return { score, reasons };
};

const getScoreLevel = (score) => {
  if (score >= 10) return 'Excelente';
  if (score >= 7) return 'Muito Bom';
  if (score >= 4) return 'Bom';
  if (score >= 1) return 'Sugerido';
  return 'Alternativa';
};

const getScoreColor = (score) => {
  if (score >= 10) return '#4caf50';
  if (score >= 7) return '#8bc34a';
  if (score >= 4) return '#ffc107';
  if (score >= 1) return '#ff9800';
  return '#9e9e9e';
};

function Harmonization({ dish, suggestions, onBack, mode }) {
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterDisponivel, setFilterDisponivel] = useState('all');
  const [filterCategoria, setFilterCategoria] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // ← NOVO: Estado para busca
  const [selectedWine, setSelectedWine] = useState(null);

  // Enriquece sugestões com score calculado
  const enrichedSuggestions = useMemo(() => {
    return suggestions.map(wine => {
      const match = calculateMatch(wine, dish);
      return {
        ...wine,
        score: match.score || wine.score || 0,
        reasons: match.reasons.length > 0 ? match.reasons : (wine.reasons || []),
      };
    });
  }, [suggestions, dish]);

  // Filtra por categoria ideal (se selecionada)
  const filteredByCategory = useMemo(() => {
    if (!filterCategoria) return enrichedSuggestions;
    
    return enrichedSuggestions.filter(wine => {
      const tipoWine = wine.tipo?.toLowerCase() || '';
      const subtipoWine = wine.subtipo?.toLowerCase() || '';
      const categoria = filterCategoria.toLowerCase();
      
      return tipoWine.includes(categoria) || 
             subtipoWine.includes(categoria) ||
             (categoria.includes('brut') && subtipoWine.includes('brut')) ||
             (categoria.includes('espumante') && tipoWine.includes('espumante')) ||
             (categoria.includes('torrontés') && wine.uva?.some(u => u.toLowerCase().includes('torrontes'))) ||
             (categoria.includes('sauvignon') && wine.uva?.some(u => u.toLowerCase().includes('sauvignon')));
    });
  }, [enrichedSuggestions, filterCategoria]);

  // NOVO: Aplica filtro de busca por nome, vinícola, uva ou país
  const filteredBySearch = useMemo(() => {
    if (!searchTerm.trim()) return filteredByCategory;
    
    const term = searchTerm.toLowerCase().trim();
    return filteredByCategory.filter(wine =>
      wine.nome?.toLowerCase().includes(term) ||
      wine.vinicola?.toLowerCase().includes(term) ||
      wine.tipo?.toLowerCase().includes(term) ||
      wine.pais?.toLowerCase().includes(term) ||
      wine.uva?.some(u => u.toLowerCase().includes(term))
    );
  }, [filteredByCategory, searchTerm]);

  const filteredSuggestions = filteredBySearch.filter(wine => {
    const matchTipo = filterTipo === 'all' || wine.tipo?.toLowerCase() === filterTipo.toLowerCase();
    const isAvailable = wine.active && wine.stock > 0;
    const matchDisponivel =
      filterDisponivel === 'all' ||
      (filterDisponivel === 'disponivel' && isAvailable) ||
      (filterDisponivel === 'indisponivel' && !isAvailable);
    return matchTipo && matchDisponivel;
  });

  // MELHORADO: Ordena por disponibilidade, depois score, depois alfabeticamente
  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    const aDisp = a.active && a.stock > 0;
    const bDisp = b.active && b.stock > 0;
    
    // 1º: Disponíveis primeiro
    if (aDisp && !bDisp) return -1;
    if (!aDisp && bDisp) return 1;
    
    // 2º: Maior score primeiro
    if (b.score !== a.score) return b.score - a.score;
    
    // 3º: Ordem alfabética por nome
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });

  const tiposVinho = ['all', 'Tinto', 'Branco', 'Rosé', 'Espumante', 'Prosecco', 'Cidra'];

  return (
    <div className="harmonization-view">
      <div className="harmonization-header">
        <button onClick={onBack} className="btn-back">← Voltar</button>
        <div className="dish-info">
          <h2>{dish.nome}</h2>
          <p>{dish.descricao}</p>
          <div className="dish-meta">
            {dish.nivelHarmonizacao && (
              <span className="dish-level">
                Nível: <strong>{dish.nivelHarmonizacao.toUpperCase()}</strong>
              </span>
            )}
            {dish.proteinas && dish.proteinas.length > 0 && (
              <span className="dish-level">
                🥩 {dish.proteinas.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Categorias de Vinho Ideais - FILTRÁVEIS */}
      {dish.melhoresCategorias && dish.melhoresCategorias.length > 0 && (
        <div className="sommelier-tip">
          <h4>💡 Categorias de Vinho Ideais <span className="filter-hint">(clique para filtrar)</span></h4>
          <div className="tip-tags">
            {dish.melhoresCategorias.map((cat, i) => {
              const isActive = filterCategoria === cat;
              return (
                <button
                  key={i}
                  className={`tip-tag ${isActive ? 'active' : ''}`}
                  onClick={() => setFilterCategoria(isActive ? null : cat)}
                  title={isActive ? 'Limpar filtro' : `Filtrar por ${cat}`}
                >
                  {isActive ? '✕ ' : ''}{cat}
                </button>
              );
            })}
          </div>
          {filterCategoria && (
            <button 
              className="clear-filter-btn"
              onClick={() => setFilterCategoria(null)}
            >
              Limpar filtro
            </button>
          )}
        </div>
      )}

      <div className="suggestions-section">
        <div className="suggestions-header">
          <h3>🍷 Vinhos Recomendados ({filteredSuggestions.length}){filterCategoria && ` - ${filterCategoria}`}</h3>

          {/* NOVO: Barra de busca */}
          <div className="search-section">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nome, vinícola, uva, país..."
            />
            {searchTerm && (
              <div className="results-summary">
                <span className="results-count">
                  🔎 <strong>{filteredSuggestions.length}</strong> resultado(s) encontrado(s)
                </span>
              </div>
            )}
          </div>

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
          <div className="no-suggestions">
            <p>
              {searchTerm 
                ? `😕 Nenhum vinho encontrado para "${searchTerm}"`
                : 'Nenhum vinho encontrado com estes filtros.'
              }
            </p>
            {searchTerm && (
              <button 
                className="btn-clear-search"
                onClick={() => setSearchTerm('')}
              >
                Limpar busca
              </button>
            )}
            {!searchTerm && (
              <small>Tente ajustar os filtros ou selecione outro prato.</small>
            )}
          </div>
        ) : (
          <div className="suggestions-grid">
            {sortedSuggestions.map((wine) => {
              const isAvailable = wine.active && wine.stock > 0;

              return (
                <div
                  key={wine.id}
                  className={`suggestion-card ${!isAvailable ? 'unavailable' : ''}`}
                >
                  {/* Card simples - clique abre modal direto */}
                  <WineCard 
                    wine={wine} 
                    mode={mode}
                    onClick={() => setSelectedWine(wine)}
                  />

                  {!isAvailable && (
                    <div className="unavailable-badge">❌ Indisponível</div>
                  )}

                  {/* Score sempre visível */}
                  {wine.score > 0 && (
                    <div className="match-score">
                      <span
                        className="score-label"
                        style={{ color: getScoreColor(wine.score) }}
                      >
                        {getScoreLevel(wine.score)} ({wine.score} pts)
                      </span>
                      <div className="score-bar">
                        <div
                          className="score-fill"
                          style={{
                            width: `${Math.min((wine.score / 15) * 100, 100)}%`,
                            background: `linear-gradient(90deg, ${getScoreColor(wine.score)} 0%, #722f37 100%)`,
                          }}
                        />
                      </div>
                      {wine.reasons && wine.reasons.length > 0 && (
                        <div className="match-reasons">
                          {wine.reasons.slice(0, 3).map((reason, i) => (
                            <span key={i} className="reason-tag">{reason}</span>
                          ))}
                          {wine.reasons.length > 3 && (
                            <span className="reason-tag more">+{wine.reasons.length - 3} mais</span>
                          )}
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

      {/* Melhores Rótulos */}
      {dish.melhoresRotulos && dish.melhoresRotulos.length > 0 && (
        <div className="sommelier-tip">
          <h4>🏆 Rótulos Ideais para este Prato</h4>
          <div className="tip-tags">
            {dish.melhoresRotulos.map((rotulo, i) => (
              <span key={i} className="tip-tag gold">{rotulo}</span>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Detalhes - ABRE DIRETO AO CLICAR NO CARD */}
      {selectedWine && (
        <WineDetailModal 
          wine={selectedWine} 
          onClose={() => setSelectedWine(null)} 
          mode={mode} 
        />
      )}
    </div>
  );
}

export default Harmonization;