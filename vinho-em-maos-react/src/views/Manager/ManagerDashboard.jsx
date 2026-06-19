import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext';
import StockCatalog from './StockCatalog';
import DishManager from './DishManager';
import api from '../../services/api';
import './ManagerDashboard.css';

function ManagerDashboard() {
  const { catalogo, logout } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('catalog');
  const [stats, setStats] = useState(null);
  const [pin, setPin] = useState(null);

  useEffect(() => {
    loadStats();
    loadPin();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Falha ao carregar stats:', err);
    }
  };

  const loadPin = async () => {
    try {
      const data = await api.getPin();
      if (data.valid) {
        setPin(data);
      }
    } catch (err) {
      console.error('Falha ao carregar PIN:', err);
    }
  };

  const generateNewPin = async () => {
    try {
      const data = await api.generatePin();
      setPin(data);
      alert(`Novo PIN gerado: ${data.code}`);
    } catch (err) {
      alert('Falha ao gerar PIN');
    }
  };

  return (
    <div className="manager-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🍷 Sommelier - Gerente</h1>
        </div>
        <div className="header-right">
          <div className="pin-display">
            {pin ? (
              <>
                <span className="pin-label">PIN do Dia:</span>
                <span className="pin-code">{pin.code}</span>
              </>
            ) : (
              <span className="no-pin">PIN não gerado</span>
            )}
            <button onClick={generateNewPin} className="btn-generate-pin">
              Gerar Novo PIN
            </button>
          </div>
          <button onClick={logout} className="btn-logout">
            Sair
          </button>
        </div>
      </header>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalBebidas}</div>
            <div className="stat-label">Total de Bebidas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.bebidasAtivas}</div>
            <div className="stat-label">Bebidas Ativas</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{stats.bebidasSemEstoque}</div>
            <div className="stat-label">Sem Estoque</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalPratos}</div>
            <div className="stat-label">Pratos no Cardápio</div>
          </div>
        </div>
      )}

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'catalog' ? 'active' : ''}
          onClick={() => setActiveTab('catalog')}
        >
          Catálogo & Estoque
        </button>
        <button
          className={activeTab === 'dishes' ? 'active' : ''}
          onClick={() => setActiveTab('dishes')}
        >
          Gestão de Pratos
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'catalog' && <StockCatalog />}
        {activeTab === 'dishes' && <DishManager />}
      </div>
    </div>
  );
}

export default ManagerDashboard;