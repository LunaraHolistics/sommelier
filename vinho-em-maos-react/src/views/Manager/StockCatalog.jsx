import React, { useState, useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import WineDetailModal from '../../components/WineDetailModal';
import api from '../../services/api';
import './StockCatalog.css';

function StockCatalog() {
  const { catalogo, updateCatalogoItem } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [editingWine, setEditingWine] = useState(null);
  const [formData, setFormData] = useState({});
  const [viewingWine, setViewingWine] = useState(null); // Novo estado para visualizar detalhes

  const tiposVinho = ['all', 'Tinto', 'Branco', 'Rosé', 'Espumante', 'Prosecco', 'Destilado'];

  const filteredWines = catalogo.filter(wine => {
    const matchSearch = wine.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       wine.vinicola?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === 'all' || wine.tipo?.toLowerCase() === filterTipo.toLowerCase();
    return matchSearch && matchTipo;
  });

  const handleEdit = (wine) => {
    setEditingWine(wine);
    setFormData({
      price: wine.price || '',
      stock: wine.stock || 0,
      active: wine.active !== false
    });
  };

  const handleSave = async () => {
    try {
      await updateCatalogoItem(editingWine.id, formData);
      setEditingWine(null);
      setFormData({});
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar alterações');
    }
  };

  const handleCancel = () => {
    setEditingWine(null);
    setFormData({});
  };

  const handleViewDetails = (wine) => {
    setViewingWine(wine);
  };

  const handleCloseModal = () => {
    setViewingWine(null);
  };

  return (
    <div className="stock-catalog">
      <div className="catalog-header">
        <h2>🍷 Catálogo & Estoque</h2>
        <div className="catalog-filters">
          <input
            type="text"
            placeholder="Buscar por nome ou vinícola..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos os Tipos</option>
            {tiposVinho.filter(t => t !== 'all').map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="wines-grid">
        {filteredWines.map(wine => (
          <div key={wine.id} className={`wine-card-manager ${!wine.active ? 'inactive' : ''}`}>
            <div className="wine-card-header">
              <div className="wine-image-small">
                {wine.imagemUrl ? (
                  <img src={wine.imagemUrl} alt={wine.nome} onError={(e) => e.target.src = '/placeholder-wine.png'} />
                ) : (
                  <div className="wine-placeholder">🍷</div>
                )}
              </div>
              <div className="wine-info-brief">
                <h3 className="wine-name-manager">{wine.nome}</h3>
                <p className="wine-winery-manager">{wine.vinicola}</p>
                <div className="wine-tags-brief">
                  <span className="tag-brief">{wine.tipo}</span>
                  <span className="tag-brief">{wine.pais}</span>
                  {wine.safra && <span className="tag-brief vintage">{wine.safra}</span>}
                </div>
              </div>
            </div>

            {editingWine?.id === wine.id ? (
              <div className="wine-edit-form">
                <div className="form-group">
                  <label>Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Estoque</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id={`active-${wine.id}`}
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  />
                  <label htmlFor={`active-${wine.id}`}>Ativo no Cardápio</label>
                </div>
                <div className="form-actions">
                  <button className="btn-save" onClick={handleSave}>Salvar</button>
                  <button className="btn-cancel" onClick={handleCancel}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="wine-actions-manager">
                <div className="wine-status">
                  <span className={`status-badge ${wine.active ? 'active' : 'inactive'}`}>
                    {wine.active ? 'ATIVO' : 'INATIVO'}
                  </span>
                  <span className="stock-badge">ESTOQUE: {wine.stock || 0}</span>
                </div>
                <div className="action-buttons">
                  <button 
                    className="btn-view-details"
                    onClick={() => handleViewDetails(wine)}
                    title="Ver informações completas"
                  >
                    📋 Ver Detalhes
                  </button>
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(wine)}
                  >
                    Editar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Visualização Completa (Sommelier) */}
      {viewingWine && (
        <WineDetailModal
          wine={viewingWine}
          onClose={handleCloseModal}
          mode="sommelier"
        />
      )}
    </div>
  );
}

export default StockCatalog;