import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './DishManager.css';

function DishManager() {
  const [pratos, setPratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    subcategoria: '',
    descricao: '',
    serve: 'Compartilhável',
    ingredientesPrincipais: '',
    tags: '',
    nivelHarmonizacao: 'medio',
    melhoresCategorias: '',
    melhoresRotulos: '',
    acompanha: '',
    proteinas: '',
    tecnicasPreparo: '',
    saboresDominantes: ''
  });

  useEffect(() => {
    loadPratos();
  }, []);

  const loadPratos = async () => {
    try {
      const data = await api.getCardapio();
      setPratos(data);
    } catch (err) {
      console.error('Falha ao carregar pratos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dishData = {
      ...formData,
      ingredientesPrincipais: formData.ingredientesPrincipais.split(',').map(i => i.trim()).filter(i => i),
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      melhoresCategorias: formData.melhoresCategorias.split(',').map(c => c.trim()).filter(c => c),
      melhoresRotulos: formData.melhoresRotulos.split(',').map(r => r.trim()).filter(r => r),
      acompanha: formData.acompanha.split(',').map(a => a.trim()).filter(a => a),
      proteinas: formData.proteinas.split(',').map(p => p.trim()).filter(p => p),
      tecnicasPreparo: formData.tecnicasPreparo.split(',').map(t => t.trim()).filter(t => t),
      saboresDominantes: formData.saboresDominantes.split(',').map(s => s.trim()).filter(s => s)
    };

    try {
      if (editingDish) {
        await api.updateDish(editingDish.id, dishData);
        alert('Prato atualizado com sucesso!');
      } else {
        await api.createDish(dishData);
        alert('Prato criado com sucesso!');
      }
      
      setShowForm(false);
      setEditingDish(null);
      resetForm();
      loadPratos();
    } catch (err) {
      alert('Erro ao salvar prato: ' + err.message);
    }
  };

  const handleEdit = (dish) => {
    setEditingDish(dish);
    setFormData({
      nome: dish.nome || '',
      categoria: dish.categoria || '',
      subcategoria: dish.subcategoria || '',
      descricao: dish.descricao || '',
      serve: dish.serve || 'Compartilhável',
      ingredientesPrincipais: (dish.ingredientesPrincipais || []).join(', '),
      tags: (dish.tags || []).join(', '),
      nivelHarmonizacao: dish.nivelHarmonizacao || 'medio',
      melhoresCategorias: (dish.melhoresCategorias || []).join(', '),
      melhoresRotulos: (dish.melhoresRotulos || []).join(', '),
      acompanha: (dish.acompanha || []).join(', '),
      proteinas: (dish.proteinas || []).join(', '),
      tecnicasPreparo: (dish.tecnicasPreparo || []).join(', '),
      saboresDominantes: (dish.saboresDominantes || []).join(', ')
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este prato?')) return;
    
    try {
      await api.deleteDish(id);
      alert('Prato excluído com sucesso!');
      loadPratos();
    } catch (err) {
      alert('Erro ao excluir prato: ' + err.message);
    }
  };

  const handleToggleStatus = async (dish) => {
    try {
      const newStatus = dish.status === 'ativo' ? 'inativo' : 'ativo';
      await api.updateDishStatus(dish.id, newStatus);
      alert(`Prato ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
      loadPratos();
    } catch (err) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: '',
      subcategoria: '',
      descricao: '',
      serve: 'Compartilhável',
      ingredientesPrincipais: '',
      tags: '',
      nivelHarmonizacao: 'medio',
      melhoresCategorias: '',
      melhoresRotulos: '',
      acompanha: '',
      proteinas: '',
      tecnicasPreparo: '',
      saboresDominantes: ''
    });
  };

  if (loading) {
    return <div className="loading">Carregando pratos...</div>;
  }

  return (
    <div className="dish-manager">
      <div className="dish-header">
        <h2>Gestão de Pratos</h2>
        <button className="btn-add-dish" onClick={() => { setShowForm(true); resetForm(); }}>
          + Novo Prato
        </button>
      </div>

      {showForm && (
        <div className="dish-form-overlay" onClick={() => setShowForm(false)}>
          <div className="dish-form" onClick={(e) => e.stopPropagation()}>
            <h3>{editingDish ? 'Editar Prato' : 'Novo Prato'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Categoria *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Entradas">Entradas</option>
                    <option value="Prato Principal">Prato Principal</option>
                    <option value="Especialidade da Casa">Especialidade da Casa</option>
                    <option value="Massas">Massas</option>
                    <option value="Vegetariano">Vegetariano</option>
                    <option value="Sobremesas">Sobremesas</option>
                    <option value="Acompanhamentos">Acompanhamentos</option>
                    <option value="Molhos">Molhos</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Subcategoria</label>
                  <input
                    type="text"
                    value={formData.subcategoria}
                    onChange={(e) => setFormData({...formData, subcategoria: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Serve</label>
                  <select
                    value={formData.serve}
                    onChange={(e) => setFormData({...formData, serve: e.target.value})}
                  >
                    <option value="Compartilhável">Compartilhável</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label>Descrição *</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Ingredientes Principais (separados por vírgula)</label>
                <input
                  type="text"
                  value={formData.ingredientesPrincipais}
                  onChange={(e) => setFormData({...formData, ingredientesPrincipais: e.target.value})}
                  placeholder="Ex: carne bovina, temperos da casa, azeite"
                />
              </div>

              <div className="form-group full-width">
                <label>Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="Ex: grelhado, crocante, especialidade"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nível de Harmonização</label>
                  <select
                    value={formData.nivelHarmonizacao}
                    onChange={(e) => setFormData({...formData, nivelHarmonizacao: e.target.value})}
                  >
                    <option value="baixo">Baixo</option>
                    <option value="medio">Médio</option>
                    <option value="alto">Alto</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Proteínas (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={formData.proteinas}
                    onChange={(e) => setFormData({...formData, proteinas: e.target.value})}
                    placeholder="Ex: Carne Bovina, Suína"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Melhores Categorias de Bebida (separadas por vírgula)</label>
                <input
                  type="text"
                  value={formData.melhoresCategorias}
                  onChange={(e) => setFormData({...formData, melhoresCategorias: e.target.value})}
                  placeholder="Ex: Malbec Argentino, Cabernet Sauvignon Chileno"
                />
              </div>

              <div className="form-group full-width">
                <label>Melhores Rótulos (separados por vírgula)</label>
                <input
                  type="text"
                  value={formData.melhoresRotulos}
                  onChange={(e) => setFormData({...formData, melhoresRotulos: e.target.value})}
                  placeholder="Ex: Catena Zapata Malbec, Montes Alpha Cabernet"
                />
              </div>

              <div className="form-group full-width">
                <label>Técnicas de Preparo (separadas por vírgula)</label>
                <input
                  type="text"
                  value={formData.tecnicasPreparo}
                  onChange={(e) => setFormData({...formData, tecnicasPreparo: e.target.value})}
                  placeholder="Ex: Grelhado, Assado, Frito"
                />
              </div>

              <div className="form-group full-width">
                <label>Sabores Dominantes (separados por vírgula)</label>
                <input
                  type="text"
                  value={formData.saboresDominantes}
                  onChange={(e) => setFormData({...formData, saboresDominantes: e.target.value})}
                  placeholder="Ex: Umami, Especiarias, Defumado"
                />
              </div>

              <div className="form-group full-width">
                <label>Acompanha (separados por vírgula)</label>
                <input
                  type="text"
                  value={formData.acompanha}
                  onChange={(e) => setFormData({...formData, acompanha: e.target.value})}
                  placeholder="Ex: Molho Chimichurri, Farofa de Banana"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingDish ? 'Atualizar' : 'Criar'} Prato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dishes-list">
        {pratos.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum prato cadastrado.</p>
            <p>Clique em "+ Novo Prato" para começar.</p>
          </div>
        ) : (
          pratos.map(dish => (
            <div key={dish.id} className={`dish-item ${dish.status === 'inativo' ? 'inactive' : ''}`}>
              <div className="dish-info">
                <h4>{dish.nome}</h4>
                <p className="dish-category">{dish.categoria} {dish.subcategoria && `• ${dish.subcategoria}`}</p>
                <p className="dish-description">{dish.descricao}</p>
                <div className="dish-tags">
                  {dish.tags?.slice(0, 5).map((tag, i) => (
                    <span key={i} className="tag">{tag}</span>
                  ))}
                </div>
                <div className="dish-meta">
                  <span className={`status-badge ${dish.status}`}>
                    {dish.status === 'ativo' ? '✅ Ativo' : '⏸️ Inativo'}
                  </span>
                  <span className="harmonization-level">
                    Harmonização: {dish.nivelHarmonizacao}
                  </span>
                </div>
              </div>
              <div className="dish-actions">
                <button className="btn-edit" onClick={() => handleEdit(dish)}>
                  Editar
                </button>
                <button 
                  className={`btn-toggle ${dish.status === 'ativo' ? 'deactivate' : 'activate'}`}
                  onClick={() => handleToggleStatus(dish)}
                >
                  {dish.status === 'ativo' ? 'Desativar' : 'Ativar'}
                </button>
                <button className="btn-delete" onClick={() => handleDelete(dish.id)}>
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DishManager;