import { useState } from 'react';

export default function BeverageCard({ beverage, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const disponibilidade = !beverage.disponivel 
    ? 'unavailable' 
    : beverage.estoque === 0 
      ? 'low-stock' 
      : 'available';

  return (
    <div className={`beverage-card ${disponibilidade}`}>
      <div className="card-header">
        <img 
          src={beverage.imagemUrl || '/placeholder-wine.png'} 
          alt={beverage.nome}
          onError={(e) => e.target.src = '/placeholder-wine.png'}
        />
        <div className="card-info">
          <h3>{beverage.nome}</h3>
          <span className={`tag ${disponibilidade}`}>
            {!beverage.disponivel ? 'Indisponível' : 
             beverage.estoque === 0 ? 'Estoque Baixo' : 'Disponível'}
          </span>
        </div>
      </div>

      <div className="card-details">
        <p><strong>Tipo:</strong> {beverage.tipo}</p>
        <p><strong>Teor:</strong> {beverage.teorAlcoolico}</p>
        <p><strong>Estoque:</strong> {beverage.estoque} unid.</p>
        <p><strong>Preço:</strong> R$ {beverage.preco?.toFixed(2)}</p>
        
        {expanded && (
          <div className="expanded-info">
            <p><strong>Harmonização:</strong> {beverage.harmonizacaoPrincipal}</p>
            <p><strong>Temperatura:</strong> {beverage.tempConsumo}</p>
            <p><strong>Resumo:</strong> {beverage.resumoGarcom}</p>
          </div>
        )}
      </div>

      <div className="card-actions">
        <button onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Ver Menos' : 'Ver Mais'}
        </button>
        <button onClick={() => onEdit(beverage)}>Editar</button>
        <button onClick={() => onDelete(beverage.id)} className="btn-delete">
          Remover
        </button>
      </div>
    </div>
  );
}