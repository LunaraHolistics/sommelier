import React from 'react';
import './DishCard.css';

function DishCard({ dish, onSelect }) {
  return (
    <div className="dish-card" onClick={onSelect}>
      <h3 className="dish-name">{dish.nome}</h3>
      <p className="dish-description">{dish.descricao}</p>
      
      <div className="dish-tags">
        {dish.tags?.slice(0, 3).map((tag, i) => (
          <span key={i} className="dish-tag">{tag}</span>
        ))}
      </div>

      <div className="dish-footer">
        <span className="dish-category">{dish.categoria}</span>
        <span className="dish-serve">{dish.serve}</span>
      </div>

      <button className="btn-harmonize">
        Ver Harmonizações
      </button>
    </div>
  );
}

export default DishCard;