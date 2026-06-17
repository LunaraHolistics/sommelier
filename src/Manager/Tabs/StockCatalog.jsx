import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { beveragesAPI } from '../../services/api';
import BeverageCard from '../../Shared/BeverageCard';

export default function StockCatalog() {
  const { bebidas, refreshData } = useApp();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);

  const filtered = bebidas.filter(b => 
    b.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await beveragesAPI.update(data.id, data);
      } else {
        await beveragesAPI.create(data);
      }
      setEditing(null);
      refreshData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar bebida');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover esta bebida?')) return;
    try {
      await beveragesAPI.delete(id);
      refreshData();
    } catch (error) {
      alert('Erro ao remover');
    }
  };

  return (
    <div className="stock-catalog">
      <div className="toolbar">
        <input
          type="text"
          placeholder="Buscar bebida..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => setEditing({})}>
          + Adicionar Bebida
        </button>
      </div>

      <div className="grid">
        {filtered.map(beverage => (
          <BeverageCard
            key={beverage.id}
            beverage={beverage}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {editing && (
        <BeverageModal
          beverage={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}