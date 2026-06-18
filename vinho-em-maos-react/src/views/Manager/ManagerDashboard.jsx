import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext';
import StockCatalog from './StockCatalog';
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
          <h1>🍷 Vinho em Mãos - Gerente</h1>
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
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total de Itens</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.ativos}</div>
            <div className="stat-label">Ativos no Cardápio</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{stats.semEstoque}</div>
            <div className="stat-label">Sem Estoque</div>
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
      </div>

      <div className="dashboard-content">
        {activeTab === 'catalog' && <StockCatalog />}
      </div>
    </div>
  );
}

export default ManagerDashboard;