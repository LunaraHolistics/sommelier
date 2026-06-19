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
  
  // Estados para expansão e zoom
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [zoomedBebida, setZoomedBebida] = useState(null);

  const handleDishSelect = async (dish) => {
    if (!dish || !dish.id) return;
    
    setSelectedDish(dish);
    setView('harmonize');
    
    try {
      const response = await api.harmonize(dish.id);
      setSuggestions(response.suggestions || []);
    } catch (err) {
      console.error('Falha ao buscar harmonizações:', err);
      setSuggestions([]);
    }
  };

  // Expande ou fecha o card - mantém apenas um expandido por vez
  const toggleExpand = (id) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
    setZoomedBebida(null); // Fecha zoom ao trocar de card
  };

  // Abre ou fecha o zoom de imagem
  const toggleZoom = (bebida) => {
    setZoomedBebida((prev) => (prev?.id === bebida.id ? null : bebida));
  };

  const allWines = catalogo;
  const activeWines = catalogo.filter(w => w.active && w.stock > 0);

  return (
    <div className="sommelier-view">
      {/* Header */}
      <header className="sommelier-header">
        <h1>🍷 Vinho em Mãos</h1>
        <div className="header-actions">
          <div className="mode-toggle">
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

      {/* Tabs de Navegação */}
      <nav className="view-tabs" role="tablist">
        <button
          className={`tab-btn ${view === 'drinks' ? 'active' : ''}`}
          onClick={() => setView('drinks')}
          role="tab"
          aria-selected={view === 'drinks'}
        >
          Bebidas
        </button>
        <button
          className={`tab-btn ${view === 'dishes' ? 'active' : ''}`}
          onClick={() => setView('dishes')}
          role="tab"
          aria-selected={view === 'dishes'}
        >
          Pratos
        </button>
        {selectedDish && (
          <button
            className={`tab-btn ${view === 'harmonize' ? 'active' : ''}`}
            onClick={() => setView('harmonize')}
            role="tab"
            aria-selected={view === 'harmonize'}
          >
            Harmonização
          </button>
        )}
      </nav>

      {/* Conteúdo Principal */}
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
          </section>
        )}

        {view === 'harmonize' && selectedDish && (
          <section className="harmonization-section">
            <button 
              className="back-button" 
              onClick={() => setView('dishes')}
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

      {/* Overlay de Zoom */}
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
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SommelierView;