import React from 'react';
import './SearchBar.css';

function SearchBar({ value, onChange, placeholder = 'Buscar...', onClear }) {
  return (
    <div className="search-bar">
      <span className="search-icon" aria-hidden="true">🔍</span>
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Campo de busca"
      />
      {value && (
        <button
          className="search-clear"
          onClick={onClear || (() => onChange(''))}
          aria-label="Limpar busca"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default SearchBar;