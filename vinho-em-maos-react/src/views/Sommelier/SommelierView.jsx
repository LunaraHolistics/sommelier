import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import WineCard from '../../components/WineCard';
import DishCard from '../../components/DishCard';
import SearchBar from '../../components/SearchBar';
import Harmonization from './Harmonization';
import api from '../../services/api';
import './SommelierView.css';

function SommelierView() {
  const { catalogo, cardapio, logout } = useContext(AppContext);
  const [view, setView] = useState('drinks');
  const [selectedDish, setSelectedDish] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [mode, setMode] = useState('client');
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [zoomedBebida, setZoomedBebida] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDishSelect = async (dish) => {
    if (!dish || !dish.id) return;
    setSelectedDish(dish);
    setView('harmonize');
    setSearchTerm('');
    try {
      const response = await api.harmonize(dish.id);
      setSuggestions(response.suggestions || []);
    } catch (err) {
      console.error('Falha ao buscar harmonizações:', err);
      setSuggestions([]);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
    setZoomedBebida(null);
  };

  const toggleZoom = (bebida) => {
    setZoomedBebida((prev) => (prev?.id === bebida.id ? null : bebida));
  };

  const allWines = catalogo;
  const activeWines = catalogo.filter(w => w.active && w.stock > 0);

  // Filtra bebidas por busca
  const filteredWines = useMemo(() => {
    const baseList = mode === 'sommelier' ? allWines : activeWines;
    
    if (!searchTerm.trim()) return baseList;
    
    const term = searchTerm.toLowerCase().trim();
    return baseList.filter(wine =>
      wine.nome?.toLowerCase().includes(term) ||
      wine.vinicola?.toLowerCase().includes(term) ||
      wine.tipo?.toLowerCase().includes(term) ||
      wine.pais?.toLowerCase().includes(term) ||
      wine.uva?.some(u => u.toLowerCase().includes(term))
    );
  }, [searchTerm, allWines, activeWines, mode]);

  // Ordena: disponíveis primeiro (alfabética), depois indisponíveis (alfabética)
  const sortedWines = useMemo(() => {
    const available = filteredWines
      .filter(w => w.active && w.stock > 0)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    
    const unavailable = filteredWines
      .filter(w => !w.active || w.stock <= 0)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    
    return [...available, ...unavailable];
  }, [filteredWines]);

  // Filtra pratos por busca
  const filteredDishes = useMemo(() => {
    if (!searchTerm.trim()) return cardapio;
    
    const term = searchTerm.toLowerCase().trim();
    return cardapio.filter(dish =>
      dish.nome?.toLowerCase().includes(term) ||
      dish.categoria?.toLowerCase().includes(term) ||
      dish.descricao?.toLowerCase().includes(term) ||
      dish.tags?.some(t => t.toLowerCase().includes(term))
    );
  }, [searchTerm, cardapio]);

  // Ordena pratos: ativos primeiro (alfabética)
  const sortedDishes = useMemo(() => {
    return [...filteredDishes].sort((a, b) => {
      const aActive = a.status === 'ativo';
      const bActive = b.status === 'ativo';
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }, [filteredDishes]);

  const displayList = mode === 'sommelier' ? allWines : activeWines;
  const availableCount = displayList.filter(w => w.active && w.stock > 0).length;

  return (
    <div className="sommelier-view">
      {/* Header */}
      <header className="sommelier-header">
        <h1>🍷 Vinho em Mãos</h1>
        <div className="header-actions">
          <div className="mode-toggle" role="tablist" aria-label="Modo de visualização">
            <button
              className={`mode-btn ${mode === 'client' ? 'active' : ''}`}
              onClick={() => setMode('client')}
              aria-label="Modo Cliente"
            >
              👤 Cliente
            </button>
            <button
              className={`mode-btn ${mode === 'sommelier' ? 'active' : ''}`}
              onClick={() => setMode('sommelier')}
              aria-label="Modo Sommelier"
            >
              🎓 Sommelier
            </button>
          </div>
          <button onClick={logout} className="btn-logout" aria-label="Sair">
            Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="view-tabs" role="tablist">
        <button
          className={`tab-btn ${view === 'drinks' ? 'active' : ''}`}
          onClick={() => { setView('drinks'); setSearchTerm(''); }}
          role="tab"
          aria-selected={view === 'drinks'}
        >
          🍷 Bebidas
        </button>
        <button
          className={`tab-btn ${view === 'dishes' ? 'active' : ''}`}
          onClick={() => { setView('dishes'); setSearchTerm(''); }}
          role="tab"
          aria-selected={view === 'dishes'}
        >
          🍽️ Pratos
        </button>
        {selectedDish && (
          <button
            className={`tab-btn ${view === 'harmonize' ? 'active' : ''}`}
            onClick={() => setView('harmonize')}
            role="tab"
            aria-selected={view === 'harmonize'}
          >
            🎯 Harmonização
          </button>
        )}
      </nav>

      {/* Conteúdo */}
      <main className="view-content">
        {view === 'drinks' && (
          <section aria-label="Lista de bebidas">
            {/* Barra de busca */}
            <div className="search-section">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nome, vinícola, uva, país..."
              />
              {!searchTerm && (
                <div className="results-summary">
                  <span className="available-count">
                    ✅ <strong>{availableCount}</strong> disponíveis
                  </span>
                  {mode === 'sommelier' && (
                    <span className="total-count">
                      📦 Total: <strong>{allWines.length}</strong>
                    </span>
                  )}
                </div>
              )}
              {searchTerm && (
                <div className="results-summary">
                  <span className="results-count">
                    🔎 <strong>{sortedWines.length}</strong> resultado(s) encontrado(s)
                  </span>
                </div>
              )}
            </div>

            {sortedWines.length === 0 ? (
              <div className="empty-state">
                <p>😕 Nenhum vinho encontrado para "{searchTerm}"</p>
                <button 
                  className="btn-clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  Limpar busca
                </button>
              </div>
            ) : (
              <div className="drinks-grid">
                {sortedWines.map(wine => (
                  <WineCard
                    key={wine.id}
                    wine={wine}
                    mode={mode}
                    isExpanded={expandedCardId === wine.id}
                    onToggle={toggleExpand}
                    onZoomToggle={toggleZoom}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {view === 'dishes' && (
          <section aria-label="Lista de pratos">
            {/* Barra de busca */}
            <div className="search-section">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nome, categoria, ingrediente..."
              />
              {!searchTerm && (
                <div className="results-summary">
                  <span className="total-count">
                    🍽️ <strong>{cardapio.length}</strong> pratos no cardápio
                  </span>
                </div>
              )}
              {searchTerm && (
                <div className="results-summary">
                  <span className="results-count">
                    🔎 <strong>{sortedDishes.length}</strong> resultado(s) encontrado(s)
                  </span>
                </div>
              )}
            </div>

            {sortedDishes.length === 0 ? (
              <div className="empty-state">
                <p>😕 Nenhum prato encontrado para "{searchTerm}"</p>
                <button 
                  className="btn-clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  Limpar busca
                </button>
              </div>
            ) : (
              <div className="dishes-grid">
                {sortedDishes.map(dish => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    onSelect={() => handleDishSelect(dish)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {view === 'harmonize' && selectedDish && (
          <section className="harmonization-section">
            <button
              className="back-button"
              onClick={() => { setView('dishes'); setSearchTerm(''); }}
              aria-label="Voltar para Pratos"
            >
              ← Voltar
            </button>
            <Harmonization
              dish={selectedDish}
              suggestions={suggestions}
              mode={mode}
            />
          </section>
        )}
      </main>

      {/* Zoom */}
      {zoomedBebida && (
        <div
          className="zoom-overlay"
          onClick={() => setZoomedBebida(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Ampliação da imagem"
        >
          <div className="zoom-container" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-zoom-btn"
              onClick={() => setZoomedBebida(null)}
              aria-label="Fechar zoom"
            >
              ×
            </button>
            <img
              src={zoomedBebida.imagemUrl || '/placeholder-wine.png'}
              alt={zoomedBebida.nome}
              className="zoomed-image"
              onError={(e) => { e.target.src = '/placeholder-wine.png'; }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SommelierView;