import React, { useState, useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import WineCard from '../../components/WineCard';
import FilterBar from '../../components/FilterBar';
import './StockCatalog.css';

function StockCatalog() {
  const { catalogo, updateCatalogoItem } = useContext(AppContext);
  const [filters, setFilters] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const filteredCatalogo = catalogo.filter(item => {
    if (filters.tipo && item.tipo?.toLowerCase() !== filters.tipo.toLowerCase()) return false;
    if (filters.pais && item.pais?.toLowerCase() !== filters.pais.toLowerCase()) return false;
    if (filters.q) {
      const term = filters.q.toLowerCase();
      if (!item.nome?.toLowerCase().includes(term) &&
          !item.vinicola?.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      price: item.price || 0,
      stock: item.stock || 0,
      active: item.active !== false
    });
  };

  const handleSave = async () => {
    const success = await updateCatalogoItem(editingId, editData);
    if (success) {
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  return (
    <div className="stock-catalog">
      <FilterBar filters={filters} onFilterChange={setFilters} />

      <div className="catalog-grid">
        {filteredCatalogo.map(item => (
          <div key={item.id} className="catalog-item">
            <WineCard wine={item} />
            
            <div className="item-actions">
              {editingId === item.id ? (
                <div className="edit-form">
                  <div className="form-row">
                    <label>Preço (R$)</label>
                    <input
                      type="number"
                      value={editData.price}
                      onChange={(e) => setEditData({...editData, price: parseFloat(e.target.value)})}
                      step="0.01"
                    />
                  </div>
                  <div className="form-row">
                    <label>Estoque</label>
                    <input
                      type="number"
                      value={editData.stock}
                      onChange={(e) => setEditData({...editData, stock: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={editData.active}
                        onChange={(e) => setEditData({...editData, active: e.target.checked})}
                      />
                      Ativo no Cardápio
                    </label>
                  </div>
                  <div className="form-actions">
                    <button onClick={handleSave} className="btn-save">Salvar</button>
                    <button onClick={handleCancel} className="btn-cancel">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => handleEdit(item)} className="btn-edit">
                  Editar
                </button>
              )}
            </div>

            <div className="item-status">
              <span className={`status-badge ${item.active ? 'active' : 'inactive'}`}>
                {item.active ? 'Ativo' : 'Inativo'}
              </span>
              <span className={`stock-badge ${item.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                Estoque: {item.stock}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StockCatalog;