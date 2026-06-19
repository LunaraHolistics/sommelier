import React, { useState, useContext } from 'react';
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
  const [loadingHarmonization, setLoadingHarmonization] = useState(false);
  const [harmonizationError, setHarmonizationError] = useState(null);

  const handleDishSelect = async (dish) => {
    if (!dish || !dish.id) return;
    
    setSelectedDish(dish);
    setView('harmonize');
    setLoadingHarmonization(true);
    setHarmonizationError(null);
    setSuggestions([]);

    try {
      const response = await api.harmonize(dish.id);
      setSuggestions(response.suggestions || []);
      
      if (!response.suggestions || response.suggestions.length === 0) {
        setHarmonizationError('Nenhuma harmonização encontrada para este prato.');
      }
    } catch (err) {
      console.error('Falha ao buscar harmonizações:', err);
      setHarmonizationError('Erro ao carregar harmonizações. Tente novamente.');
      setSuggestions([]);
    } finally {
      setLoadingHarmonization(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
    setZoomedBebida(null);
  };

  const toggleZoom = (bebida) => {
    setZoomedBebida((prev) => (prev?.id === bebida.id ? null : bebida));
  };

  const handleBackToDishes = () => {
    setView('dishes');
    setSelectedDish(null);
    setSuggestions([]);
    setHarmonizationError(null);
  };

  const allWines = catalogo;
  const activeWines = catalogo.filter(w => w.active && w.stock > 0);

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
              aria-selected={mode === 'client'}
            >
              👤 Cliente
            </button>
            <button
              className={`mode-btn ${mode === 'sommelier' ? 'active' : ''}`}
              onClick={() => setMode('sommelier')}
              aria-label="Modo Sommelier"
              aria-selected={mode === 'sommelier'}
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
          onClick={() => setView('drinks')}
          role="tab"
          aria-selected={view === 'drinks'}
        >
          🍷 Bebidas
        </button>
        <button
          className={`tab-btn ${view === 'dishes' ? 'active' : ''}`}
          onClick={() => setView('dishes')}
          role="tab"
          aria-selected={view === 'dishes'}
        >
          ️ Pratos
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
          <section className="drinks-grid" aria-label="Lista de bebidas">
            {(mode === 'sommelier' ? allWines : activeWines).map(wine => (
              <WineCard
                key={wine.id}
                wine={wine}
                mode={mode}
                isExpanded={expandedCardId === wine.id}
                onToggle={toggleExpand}
                onZoomToggle={toggleZoom}
              />
            ))}
            {(mode === 'sommelier' ? allWines : activeWines).length === 0 && (
              <div className="empty-state">
                <p>Nenhuma bebida disponível no momento.</p>
              </div>
            )}
          </section>
        )}

        {view === 'dishes' && (
          <section className="dishes-grid" aria-label="Lista de pratos">
            {cardapio.map(dish => (
              <DishCard
                key={dish.id}
                dish={dish}
                onSelect={() => handleDishSelect(dish)}
              />
            ))}
            {cardapio.length === 0 && (
              <div className="empty-state">
                <p>Nenhum prato disponível no momento.</p>
              </div>
            )}
          </section>
        )}

        {view === 'harmonize' && selectedDish && (
          <section className="harmonization-section">
            <button
              className="back-button"
              onClick={handleBackToDishes}
              aria-label="Voltar para Pratos"
            >
              ← Voltar para Pratos
            </button>

            {loadingHarmonization && (
              <div className="loading-state" role="status" aria-live="polite">
                <div className="spinner"></div>
                <p>Buscando harmonizações perfeitas para {selectedDish.nome}...</p>
              </div>
            )}

            {harmonizationError && !loadingHarmonization && (
              <div className="error-state" role="alert">
                <p>⚠️ {harmonizationError}</p>
                <button onClick={() => handleDishSelect(selectedDish)} className="retry-btn">
                  Tentar novamente
                </button>
              </div>
            )}

            {!loadingHarmonization && !harmonizationError && (
              <Harmonization
                dish={selectedDish}
                suggestions={suggestions}
                mode={mode}
              />
            )}
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