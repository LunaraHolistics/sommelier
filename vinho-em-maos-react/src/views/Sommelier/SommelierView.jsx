import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import WineCard from '../../components/WineCard';
import DishCard from '../../components/DishCard';
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
  const [searchTerm, setSearchTerm] = useState(''); // ← NOVO: Estado para busca

  const handleDishSelect = async (dish) => {
    if (!dish || !dish.id) return;
    setSelectedDish(dish);
    setView('harmonize');
    setSearchTerm(''); // Limpa busca ao entrar em harmonização
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

  // NOVO: Filtrar bebidas por busca
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

  // NOVO: Filtrar pratos por busca
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
              👤 Garçom
            </button>
            <button
              className={`mode-btn ${mode === 'sommelier' ? 'active' : ''}`}
              onClick={() => setMode('sommelier')}
              aria-label="Modo Sommelier"
            >
               Sommelier
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
            {/* NOVO: Barra de pesquisa */}
            <div className="search-section">
              <div className="search-bar">
                <span className="search-icon" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, vinícola, uva, país..."
                  aria-label="Buscar bebidas"
                />
                {searchTerm && (
                  <button
                    className="search-clear"
                    onClick={() => setSearchTerm('')}
                    aria-label="Limpar busca"
                    type="button"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="results-summary">
                <span className="results-count">
                  {searchTerm ? (
                    <>🔎 <strong>{filteredWines.length}</strong> resultado(s) encontrado(s)</>
                  ) : (
                    <> <strong>{filteredWines.length}</strong> bebidas disponíveis</>
                  )}
                </span>
              </div>
            </div>

            {filteredWines.length === 0 ? (
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
                {filteredWines.map(wine => (
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
            {/* NOVO: Barra de pesquisa */}
            <div className="search-section">
              <div className="search-bar">
                <span className="search-icon" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, categoria, ingrediente..."
                  aria-label="Buscar pratos"
                />
                {searchTerm && (
                  <button
                    className="search-clear"
                    onClick={() => setSearchTerm('')}
                    aria-label="Limpar busca"
                    type="button"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="results-summary">
                <span className="results-count">
                  {searchTerm ? (
                    <>🔎 <strong>{filteredDishes.length}</strong> resultado(s) encontrado(s)</>
                  ) : (
                    <>🍽️ <strong>{filteredDishes.length}</strong> pratos no cardápio</>
                  )}
                </span>
              </div>
            </div>

            {filteredDishes.length === 0 ? (
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
                {filteredDishes.map(dish => (
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