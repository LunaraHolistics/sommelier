import React, { useEffect, useState } from 'react';
import WineImage from './WineImage';
import './WineDetailModal.css';

function WineDetailModal({ wine, onClose, mode = 'client' }) {
  const [showImageZoom, setShowImageZoom] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!wine) return null;

  const isSommelier = mode === 'sommelier';

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          
          <div className="modal-header-full">
            <div className="modal-image-section" onClick={() => setShowImageZoom(true)}>
              <WineImage wine={wine} />
              <div className="image-zoom-indicator">🔍 Clique para ampliar</div>
            </div>
            
            <div className="modal-title-section">
              <div className="wine-badges">
                <span className="badge-type">{wine.tipo}</span>
                <span className="badge-subtype">{wine.subtipo}</span>
                {wine.vinhoPorTaca && <span className="badge-taca">🍷 Por Taça</span>}
              </div>
              
              <h1 className="wine-title">{wine.nome}</h1>
              
              <div className="wine-producer">
                <span className="producer-name">{wine.vinicola}</span>
                <span className="separator">•</span>
                <span className="region">{wine.regiao}, {wine.pais}</span>
              </div>

              {wine.fraseVenda && (
                <div className="wine-phrase">
                  "{wine.fraseVenda}"
                </div>
              )}

              <div className="wine-quick-info">
                <div className="info-item">
                  <span className="info-label">Safra</span>
                  <span className="info-value">{wine.safra}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Teor Alcoólico</span>
                  <span className="info-value">{wine.teorAlcoolico}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Uva</span>
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

          {/* Tabs apenas no modo sommelier */}
          {isSommelier && (
            <div className="modal-tabs">
              <button className="tab-btn active">📋 Visão Geral</button>
              <button className="tab-btn">👃 Prova e Aromas</button>
              <button className="tab-btn">🍽️ Harmonização</button>
              <button className="tab-btn">💡 Dicas de Serviço</button>
            </div>
          )}

          <div className="modal-body-full">
            {/* Informações Técnicas */}
            <div className="modal-section">
              <h3 className="section-title">📋 Informações</h3>
              <div className="info-grid-detailed">
                <div className="info-row">
                  <span className="info-label">Tipo</span>
                  <span className="info-value">{wine.tipo}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Subtipo</span>
                  <span className="info-value">{wine.subtipo}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">País</span>
                  <span className="info-value">{wine.pais}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Região</span>
                  <span className="info-value">{wine.regiao}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Vinícola</span>
                  <span className="info-value">{wine.vinicola}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Uva(s)</span>
                  <span className="info-value">{wine.uva?.join(', ')}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Safra</span>
                  <span className="info-value">{wine.safra}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Teor Alcoólico</span>
                  <span className="info-value">{wine.teorAlcoolico}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Nível de Doçura</span>
                  <span className="info-value">{wine.nivelDoce}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Corpo</span>
                  <span className="info-value">{wine.corpo}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Acidez</span>
                  <span className="info-value">{wine.acidez}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Taninos</span>
                  <span className="info-value">{wine.taninos}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Amadurecimento</span>
                  <span className="info-value">{wine.amadurecimento}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Temperatura de Serviço</span>
                  <span className="info-value">{wine.temperaturaServico}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Temperatura de Armazenamento</span>
                  <span className="info-value">{wine.temperaturaArmazenamento}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Apresentação</span>
                  <span className="info-value">{wine.formaApresentacao}</span>
                </div>
              </div>
            </div>

            {wine.descricaoCurta && (
              <div className="modal-section">
                <h3 className="section-title">📝 Descrição</h3>
                <p className="wine-description-full">{wine.descricaoCurta}</p>
              </div>
            )}

            {/* Notas e Aromas - Apenas no modo sommelier */}
            {isSommelier && wine.notasDominantes && wine.notasDominantes.length > 0 && (
              <div className="modal-section">
                <h3 className="section-title">👃 Notas Dominantes</h3>
                <div className="tags-list-large">
                  {wine.notasDominantes.map((nota, i) => (
                    <span key={i} className="nota-tag-large">{nota}</span>
                  ))}
                </div>
              </div>
            )}

            {isSommelier && wine.aromas && wine.aromas.length > 0 && (
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

            {isSommelier && wine.perfilGustativo && (
              <div className="modal-section">
                <h3 className="section-title">📊 Perfil Gustativo</h3>
                <div className="tasting-profile">
                  <div className="profile-item">
                    <span className="profile-label">Corpo</span>
                    <div className="profile-bar">
                      <div className="profile-fill" style={{ width: '66%' }}></div>
                    </div>
                    <span className="profile-value">{wine.perfilGustativo.corpo}</span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Acidez</span>
                    <div className="profile-bar">
                      <div className="profile-fill" style={{ width: '83%' }}></div>
                    </div>
                    <span className="profile-value">{wine.perfilGustativo.acidez}</span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Taninos</span>
                    <div className="profile-bar">
                      <div className="profile-fill" style={{ width: '50%' }}></div>
                    </div>
                    <span className="profile-value">{wine.perfilGustativo.taninos}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Harmonização */}
            {wine.harmonizacaoPrincipal && wine.harmonizacaoPrincipal.length > 0 && (
              <div className="modal-section">
                <h3 className="section-title">🍽️ Harmonização Principal</h3>
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
                <h3 className="section-title">🍴 Harmonização Secundária</h3>
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

            {/* Harmonização Inteligente - Apenas no modo sommelier */}
            {isSommelier && wine.harmonizacaoInteligente && (
              <div className="modal-section">
                <h3 className="section-title">🎯 Harmonização Inteligente</h3>
                <div className="smart-pairing-grid">
                  {wine.harmonizacaoInteligente.categoriasPrato && (
                    <div className="smart-category">
                      <h4>Categorias de Prato</h4>
                      <div className="smart-tags">
                        {wine.harmonizacaoInteligente.categoriasPrato.map((cat, i) => (
                          <span key={i} className="smart-tag">{cat}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {wine.harmonizacaoInteligente.proteinas && (
                    <div className="smart-category">
                      <h4>Proteínas</h4>
                      <div className="smart-tags">
                        {wine.harmonizacaoInteligente.proteinas.map((prot, i) => (
                          <span key={i} className="smart-tag">{prot}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {wine.harmonizacaoInteligente.molhos && (
                    <div className="smart-category">
                      <h4>Molhos</h4>
                      <div className="smart-tags">
                        {wine.harmonizacaoInteligente.molhos.map((molho, i) => (
                          <span key={i} className="smart-tag">{molho}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {wine.harmonizacaoInteligente.tecnicasPreparo && (
                    <div className="smart-category">
                      <h4>Técnicas de Preparo</h4>
                      <div className="smart-tags">
                        {wine.harmonizacaoInteligente.tecnicasPreparo.map((tec, i) => (
                          <span key={i} className="smart-tag">{tec}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {wine.harmonizacaoInteligente.saboresPrato && (
                    <div className="smart-category">
                      <h4>Sabores do Prato</h4>
                      <div className="smart-tags">
                        {wine.harmonizacaoInteligente.saboresPrato.map((sabor, i) => (
                          <span key={i} className="smart-tag">{sabor}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {wine.harmonizacaoInteligente.intensidadeMatch && (
                    <div className="smart-category">
                      <h4>Intensidade de Match</h4>
                      <span className="match-intensity">{wine.harmonizacaoInteligente.intensidadeMatch}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dicas do Garçom - Apenas no modo sommelier */}
            {isSommelier && wine.dicasGarcom && (
              <>
                <div className="modal-section sommelier-section">
                  <h3 className="section-title">💡 Como Servir</h3>
                  <p className="sommelier-text">{wine.dicasGarcom.comoServir}</p>
                </div>

                <div className="modal-section sommelier-section highlight">
                  <h3 className="section-title">🎤 O Que Dizer ao Cliente</h3>
                  <p className="sommelier-pitch">"{wine.dicasGarcom.oQueDizer}"</p>
                </div>

                {wine.dicasGarcom.perguntasFrequentes && wine.dicasGarcom.perguntasFrequentes.length > 0 && (
                  <div className="modal-section">
                    <h3 className="section-title">❓ Perguntas Frequentes</h3>
                    <div className="faq-list">
                      {wine.dicasGarcom.perguntasFrequentes.map((faq, i) => (
                        <div key={i} className="faq-item">
                          <div className="faq-question">
                            <span className="faq-icon">❓</span>
                            <strong>{faq.pergunta}</strong>
                          </div>
                          <div className="faq-answer">
                            <span className="faq-icon">💬</span>
                            {faq.resposta}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {wine.dicasGarcom.curiosidades && (
                  <div className="modal-section sommelier-section curiosity">
                    <h3 className="section-title">✨ Curiosidades</h3>
                    <p>{wine.dicasGarcom.curiosidades}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showImageZoom && wine.imagemUrl && (
        <div className="image-zoom-overlay" onClick={() => setShowImageZoom(false)}>
          <div className="image-zoom-container" onClick={(e) => e.stopPropagation()}>
            <button className="image-zoom-close" onClick={() => setShowImageZoom(false)}>×</button>
            <img src={wine.imagemUrl} alt={wine.nome} className="image-zoom-img" />
          </div>
        </div>
      )}
    </>
  );
}

export default WineDetailModal;