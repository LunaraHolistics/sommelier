import React from 'react';
import './FilterBar.css';

function FilterBar({ filters, onFilterChange }) {
  const tipos = ['Tinto', 'Branco', 'Rosé', 'Espumante', 'Destilado', 'Fortificado'];
  const paises = ['Argentina', 'Brasil', 'Chile', 'França', 'Itália', 'Portugal', 'Espanha'];

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <input
          type="text"
          placeholder="Buscar por nome ou vinícola..."
          value={filters.q || ''}
          onChange={(e) => onFilterChange({ ...filters, q: e.target.value })}
          className="filter-search"
        />
      </div>

      <div className="filter-group">
        <select
          value={filters.tipo || ''}
          onChange={(e) => onFilterChange({ ...filters, tipo: e.target.value })}
        >
          <option value="">Todos os Tipos</option>
          {tipos.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <select
          value={filters.pais || ''}
          onChange={(e) => onFilterChange({ ...filters, pais: e.target.value })}
        >
          <option value="">Todos os Países</option>
          {paises.map(pais => (
            <option key={pais} value={pais}>{pais}</option>
          ))}
        </select>
      </div>

      {(filters.q || filters.tipo || filters.pais) && (
        <button
          onClick={() => onFilterChange({})}
          className="btn-clear-filters"
        >
          Limpar Filtros
        </button>
      )}
    </div>
  );
}

export default FilterBar;