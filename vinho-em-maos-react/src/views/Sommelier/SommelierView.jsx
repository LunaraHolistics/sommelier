import React, { useState, useContext, useCallback } from 'react';
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
  const [mode, setMode] = useState('client'); // 'client' ou 'sommelier'

  const handleDishSelect = useCallback(async (dish) => {
    if (!dish || !dish.id) {
      console.error('Prato inválido:', dish);
      return;
    }

    setSelectedDish(dish);
    setView('harmonize');
    
    try {
      const response = await api.harmonize(dish.id);
      setSuggestions(response.suggestions || []);
    } catch (err) {
      console.error('Falha ao buscar harmonizações:', err);
      setSuggestions([]);
    }
  }, []);

  // Mostra todos os vinhos (disponíveis e indisponíveis) na harmonização
  const allWines = catalogo;
  const activeWines = catalogo.filter(w => w.active && w.stock > 0);

  return (
    <div className="sommelier-view">
      <header className="sommelier-header">
        <h1>🍷 Vinho em Mãos</h1>
        <div className="header-actions">
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'client' ? 'active' : ''}`}
              onClick={() => setMode('client')}
            >
              👤 Cliente
            </button>
            <button
              className={`mode-btn ${mode === 'sommelier' ? 'active' : ''}`}
              onClick={() => setMode('sommelier')}
            >
              🎓 Sommelier
            </button>
          </div>
          <button onClick={logout} className="btn-logout">
            Sair
          </button>
        </div>
      </header>

      <div className="view-tabs">
        <button
          className={view === 'drinks' ? 'active' : ''}
          onClick={() => setView('drinks')}
        >
          Bebidas
        </button>
        <button
          className={view === 'dishes' ? 'active' : ''}
          onClick={() => setView('dishes')}
        >
          Pratos
        </button>
        {selectedDish && (
          <button
            className={view === 'harmonize' ? 'active' : ''}
            onClick={() => setView('harmonize')}
          >
            Harmonização
          </button>
        )}
      </div>

      <div className="view-content">
        {view === 'drinks' && (
          <div className="drinks-grid">
            {(mode === 'sommelier' ? allWines : activeWines).map(wine => (
              <WineCard key={wine.id} wine={wine} mode={mode} />
            ))}
          </div>
        )}

        {view === 'dishes' && (
          <div className="dishes-grid">
            {cardapio.map(dish => (
              <DishCard
                key={dish.id}
                dish={dish}
                onSelect={() => handleDishSelect(dish)}
              />
            ))}
          </div>
        )}

        {view === 'harmonize' && selectedDish && (
          <Harmonization
            dish={selectedDish}
            suggestions={suggestions}
            onBack={() => setView('dishes')}
            mode={mode}
          />
        )}
      </div>
    </div>
  );
}

export default SommelierView;