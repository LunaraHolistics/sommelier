import React, { useEffect, useState } from 'react';
import WineImage from './WineImage';
import './WineDetailModal.css';

/**
 * Converte descrições textuais de intensidade em porcentagem (0-100)
 * Usado para as barras visuais do perfil gustativo
 */
const getProfilePercentage = (value) => {
  if (!value || value === 'N/A') return 0;
  const v = String(value).toLowerCase().trim();
  if (v.includes('muito')) return 100;
  if (v.includes('full') || v.includes('poderos')) return 95;
  if (v.includes('encorpado') || v.includes('alta') || v.includes('firme')) return 85;
  if (v.includes('média-alta') || v.includes('médios-firmes')) return 70;
  if (v.includes('médio') || v.includes('maci')) return 50;
  if (v.includes('leve') || v.includes('baix')) return 25;
  return 50;
};

/** Renderiza estrelas (★ ⯨ ☆) a partir de um rating numérico */
const renderStars = (rating) => {
  const num = parseFloat(rating);
  if (isNaN(num)) return null;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (num >= i) stars.push('★');
    else if (num >= i - 0.5) stars.push('⯨');
    else stars.push('☆');
  }
  return stars.join('');
};

function WineDetailModal({ wine, onClose, mode = 'client' }) {
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showImageZoom) setShowImageZoom(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose, showImageZoom]);

  if (!wine) return null;

  const isSommelier = mode === 'sommelier';
  const filtros = wine.filtrosAvancados || {};
  const perfil = wine.perfilGustativo || {};
  const hi = wine.harmonizacaoInteligente || {};
  const dicas = wine.dicasGarcom || {};

  const tabs = isSommelier
    ? [
        { id: 'overview', label: '📋 Visão Geral' },
        { id: 'tasting', label: '👃 Prova & Aromas' },
        { id: 'pairing', label: '🍽️ Harmonização' },
        { id: 'service', label: '💡 Serviço & Dicas' },
      ]
    : [
        { id: 'overview', label: '📋 Detalhes' },
        { id: 'pairing', label: '🍽️ Harmonização' },
      ];

  const toggleFaq = (i) => setOpenFaqIndex(openFaqIndex === i ? null : i);

  return (
    <>
      <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>

          {/* HEADER */}
          <div className="modal-header-full">
            <div className="modal-image-section" onClick={() => setShowImageZoom(true)}>
              <WineImage wine={wine} />
              <div className="image-zoom-indicator">🔍 Clique para ampliar</div>
            </div>

            <div className="modal-title-section">
              <div className="wine-badges">
                <span className="badge-type">{wine.tipo}</span>
                {wine.subtipo && <span className="badge-subtype">{wine.subtipo}</span>}
                {wine.vinhoPorTaca && <span className="badge-taca">🍷 Por Taça</span>}
                {filtros.vegano && <span className="badge-vegan">🌱 Vegano</span>}
                {filtros.organico && <span className="badge-organic">🌿 Orgânico</span>}
                {filtros.semGluten && <span className="badge-gluten">🚫 Sem Glúten</span>}
              </div>

              <h1 className="wine-title">{wine.nome}</h1>

              <div className="wine-producer">
                <span className="producer-name">{wine.vinicola}</span>
                <span className="separator">•</span>
                <span className="region">{wine.regiao}, {wine.pais}</span>
              </div>

              {wine.fraseVenda && (
                <div className="wine-phrase">"{wine.fraseVenda}"</div>
              )}

              {/* Rating + Preço */}
              <div className="wine-rating-price">
                {filtros.rating && (
                  <div className="rating-block">
                    <span className="rating-stars">{renderStars(filtros.rating)}</span>
                    <span className="rating-number">{filtros.rating}</span>
                  </div>
                )}
                {wine.faixaPreco && (
                  <div className="price-block">
                    <span className="price-label">Faixa de Preço</span>
                    <span className="price-value">{wine.faixaPreco}</span>
                  </div>
                )}
              </div>

              <div className="wine-quick-info">
                <div className="info-item">
                  <span className="info-label">Safra</span>
                  <span className="info-value">{wine.safra || 'N/V'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Teor Alcoólico</span>
                  <span className="info-value">{wine.teorAlcoolico}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Uva(s)</span>
                  <span className="info-value">{wine.uva?.join(', ')}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Corpo</span>
                  <span className="info-value">{wine.corpo}</span>
                </div>
              </div>

              {wine.premiacoes && wine.premiacoes.length > 0 && (
                <div className="wine-awards">
                  <h3>🏆 Premiações</h3>
                  <div className="awards-list">
                    {wine.premiacoes.map((premio, i) => (
                      <span key={i} className="award-badge">{premio}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TABS */}
          <div className="modal-tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* BODY */}
          <div className="modal-body-full">

            {/* ============ VISÃO GERAL ============ */}
            {activeTab === 'overview' && (
              <>
                <div className="modal-section">
                  <h3 className="section-title">📋 Informações Técnicas</h3>
                  <div className="info-grid-detailed">
                    {[
                      ['Tipo', wine.tipo],
                      ['Subtipo', wine.subtipo],
                      ['País', wine.pais],
                      ['Região', wine.regiao],
                      ['Vinícola', wine.vinicola],
                      ['Uva(s)', wine.uva?.join(', ')],
                      ['Safra', wine.safra],
                      ['Teor Alcoólico', wine.teorAlcoolico],
                      ['Doçura', wine.nivelDoce],
                      ['Corpo', wine.corpo],
                      ['Acidez', wine.acidez],
                      ['Taninos', wine.taninos],
                      ['Amadurecimento', wine.amadurecimento],
                      ['Temp. Serviço', wine.temperaturaServico],
                      ['Temp. Armazenamento', wine.temperaturaArmazenamento],
                      ['Apresentação', wine.formaApresentacao],
                    ].map(([label, value]) => value && (
                      <div className="info-row" key={label}>
                        <span className="info-label">{label}</span>
                        <span className="info-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {wine.descricaoCurta && (
                  <div className="modal-section">
                    <h3 className="section-title">📝 Descrição</h3>
                    <p className="wine-description-full">{wine.descricaoCurta}</p>
                  </div>
                )}

                {/* Filtros avançados — informações extras */}
                {(filtros.potencialGuarda || filtros.popularidade || filtros.anoEngarrafamento) && (
                  <div className="modal-section">
                    <h3 className="section-title">🏷️ Informações Adicionais</h3>
                    <div className="info-grid-detailed">
                      {filtros.potencialGuarda && (
                        <div className="info-row">
                          <span className="info-label">Potencial de Guarda</span>
                          <span className="info-value">{filtros.potencialGuarda}</span>
                        </div>
                      )}
                      {filtros.anoEngarrafamento && (
                        <div className="info-row">
                          <span className="info-label">Ano de Engarrafamento</span>
                          <span className="info-value">{filtros.anoEngarrafamento}</span>
                        </div>
                      )}
                      {filtros.popularidade && (
                        <div className="info-row">
                          <span className="info-label">Popularidade</span>
                          <span className="info-value">{filtros.popularidade}</span>
                        </div>
                      )}
                      {wine.publicoAlvo && (
                        <div className="info-row">
                          <span className="info-label">Público-Alvo</span>
                          <span className="info-value">{wine.publicoAlvo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {wine.tags && wine.tags.length > 0 && (
                  <div className="modal-section">
                    <h3 className="section-title">🏷️ Tags</h3>
                    <div className="tags-list-large">
                      {wine.tags.map((tag, i) => (
                        <span key={i} className="nota-tag-large">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============ PROVA & AROMAS (somente sommelier) ============ */}
            {activeTab === 'tasting' && isSommelier && (
              <>
                {wine.notasDominantes && wine.notasDominantes.length > 0 && (
                  <div className="modal-section">
                    <h3 className="section-title">👃 Notas Dominantes</h3>
                    <div className="tags-list-large">
                      {wine.notasDominantes.map((nota, i) => (
                        <span key={i} className="nota-tag-large">{nota}</span>
                      ))}
                    </div>
                  </div>
                )}

                {wine.aromas && wine.aromas.length > 0 && (
                  <div className="modal-section">
                    <h3 className="section-title">🌸 Aromas</h3>
                    <div className="aromas-grid">
                      {wine.aromas.map((aroma, i) => (
                        <div key={i} className="aroma-item">
                          <span className="aroma-icon">🌺</span>
                          <span>{aroma}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {wine.perfilGustativo && (
                  <div className="modal-section">
                    <h3 className="section-title">📊 Perfil Gustativo</h3>
                    <div className="tasting-profile">
                      {[
                        { key: 'corpo', label: 'Corpo' },
                        { key: 'acidez', label: 'Acidez' },
                        { key: 'taninos', label: 'Taninos' },
                      ].map(({ key, label }) => perfil[key] && perfil[key] !== 'N/A' && (
                        <div className="profile-item" key={key}>
                          <span className="profile-label">{label}</span>
                          <div className="profile-bar">
                            <div
                              className="profile-fill"
                              style={{ width: `${getProfilePercentage(perfil[key])}%` }}
                            />
                          </div>
                          <span className="profile-value">{perfil[key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============ HARMONIZAÇÃO ============ */}
            {activeTab === 'pairing' && (
              <>
                {wine.harmonizacaoPrincipal && wine.harmonizacaoPrincipal.length > 0 && (
                  <div className="modal-section">
                    <h3 className="section-title">⭐ Harmonização Principal</h3>
                    <div className="pairing-list">
                      {wine.harmonizacaoPrincipal.map((h, i) => (
                        <div key={i} className="pairing-item primary">
                          <span className="pairing-icon">⭐</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {wine.harmonizacaoSecundaria && wine.harmonizacaoSecundaria.length > 0 && (
                  <div className="modal-section">
                    <h3 className="section-title">🔸 Harmonização Secundária</h3>
                    <div className="pairing-list">
                      {wine.harmonizacaoSecundaria.map((h, i) => (
                        <div key={i} className="pairing-item secondary">
                          <span className="pairing-icon">🔸</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Harmonização Inteligente — somente sommelier */}
                {isSommelier && wine.harmonizacaoInteligente && (
                  <div className="modal-section">
                    <h3 className="section-title">🎯 Harmonização Inteligente</h3>
                    {hi.intensidadeMatch && (
                      <div className="intensity-banner">
                        Intensidade do Match:
                        <span className="match-intensity">{hi.intensidadeMatch}</span>
                      </div>
                    )}
                    <div className="smart-pairing-grid">
                      {[
                        { key: 'categoriasPrato', title: 'Categorias de Prato', icon: '🍽️' },
                        { key: 'proteinas', title: 'Proteínas', icon: '🥩' },
                        { key: 'molhos', title: 'Molhos', icon: '🥫' },
                        { key: 'tecnicasPreparo', title: 'Técnicas de Preparo', icon: '🔥' },
                        { key: 'saboresPrato', title: 'Sabores do Prato', icon: '🌶️' },
                      ].map(({ key, title, icon }) =>
                        hi[key] && hi[key].length > 0 && (
                          <div className="smart-category" key={key}>
                            <h4>{icon} {title}</h4>
                            <div className="smart-tags">
                              {hi[key].map((item, i) => (
                                <span key={i} className="smart-tag">{item}</span>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============ SERVIÇO & DICAS (somente sommelier) ============ */}
            {activeTab === 'service' && isSommelier && wine.dicasGarcom && (
              <>
                {dicas.comoServir && (
                  <div className="modal-section sommelier-section">
                    <h3 className="section-title">🍷 Como Servir</h3>
                    <p className="sommelier-text">{dicas.comoServir}</p>
                  </div>
                )}

                {dicas.oQueDizer && (
                  <div className="modal-section sommelier-section highlight">
                    <h3 className="section-title">🎤 O Que Dizer ao Cliente</h3>
                    <p className="sommelier-pitch">"{dicas.oQueDizer}"</p>
                  </div>
                )}

                {wine.nivelConhecimentoGarcom && (
                  <div className="modal-section sommelier-section">
                    <h3 className="section-title">🎓 Nível de Conhecimento Necessário</h3>
                    <span className="knowledge-badge">{wine.nivelConhecimentoGarcom}</span>
                  </div>
                )}

                {dicas.perguntasFrequentes && dicas.perguntasFrequentes.length > 0 && (
                  <div className="modal-section">
                    <h3 className="section-title">❓ Perguntas Frequentes</h3>
                    <div className="faq-list">
                      {dicas.perguntasFrequentes.map((faq, i) => (
                        <div
                          key={i}
                          className={`faq-item ${openFaqIndex === i ? 'open' : ''}`}
                          onClick={() => toggleFaq(i)}
                        >
                          <div className="faq-question">
                            <span className="faq-icon">❓</span>
                            <strong>{faq.pergunta}</strong>
                            <span className="faq-toggle">{openFaqIndex === i ? '−' : '+'}</span>
                          </div>
                          {openFaqIndex === i && (
                            <div className="faq-answer">
                              <span className="faq-icon">💬</span>
                              <span>{faq.resposta}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dicas.curiosidades && (
                  <div className="modal-section sommelier-section curiosity">
                    <h3 className="section-title">✨ Curiosidades</h3>
                    <p className="sommelier-text">{dicas.curiosidades}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Zoom de Imagem */}
      {showImageZoom && wine.imagemUrl && (
        <div className="image-zoom-overlay" onClick={() => setShowImageZoom(false)}>
          <div className="image-zoom-container" onClick={(e) => e.stopPropagation()}>
            <button className="image-zoom-close" onClick={() => setShowImageZoom(false)} aria-label="Fechar zoom">×</button>
            <img
              src={wine.imagemUrl}
              alt={wine.nome}
              className="image-zoom-img"
              onError={(e) => { e.target.src = '/placeholder-wine.png'; }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default WineDetailModal;