/**
 * Componente Kanban Board - Padrão SprintHub
 * 
 * Exibe oportunidades organizadas por etapa em formato Kanban
 * com scroll horizontal e vertical independente por coluna
 */

import React, { useState, useEffect, useRef } from 'react';
import './CrmKanbanBoard.css';
import crmKanbanService from '../services/crmKanbanService';
import CrmKanbanCard from './CrmKanbanCard';
import CrmOpportunityModal from './CrmOpportunityModal';
import CrmLeadModal from './CrmLeadModal';
import { formatCurrency } from '../utils/crmHelpers';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CrmKanbanBoard = ({ funilId, searchTerm = '', selectedStatus = 'Aberta' }) => {
  const [etapas, setEtapas] = useState([]);
  const [oportunidades, setOportunidades] = useState({});
  const [vendedores, setVendedores] = useState({}); // Mapa de userId -> info do vendedor
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOportunidade, setSelectedOportunidade] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const boardRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    if (funilId) {
      loadKanbanData();
    }
  }, [funilId]);

  useEffect(() => {
    checkScrollButtons();
    const handleScroll = () => {
      if (boardRef.current) {
        setScrollLeft(boardRef.current.scrollLeft);
        checkScrollButtons();
      }
    };
    if (boardRef.current) {
      boardRef.current.addEventListener('scroll', handleScroll);
      return () => {
        if (boardRef.current) {
          boardRef.current.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [etapas, oportunidades]);

  const checkScrollButtons = () => {
    if (boardRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = boardRef.current;
      const canScroll = scrollWidth > clientWidth;
      setCanScrollLeft(canScroll && scrollLeft > 0);
      setCanScrollRight(canScroll && scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollHorizontal = (direction) => {
    if (boardRef.current) {
      const scrollAmount = 400;
      const currentScroll = boardRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : currentScroll + scrollAmount;
      
      boardRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
      
      // Atualizar botões após scroll
      setTimeout(() => checkScrollButtons(), 100);
    }
  };

  const startContinuousScroll = (direction) => {
    // Limpar qualquer animação existente
    if (scrollIntervalRef.current) {
      cancelAnimationFrame(scrollIntervalRef.current);
    }

    // Usar requestAnimationFrame para scroll super fluido
    let lastTime = performance.now();
    const scrollSpeed = 300; // Pixels por segundo
    
    const animate = (currentTime) => {
      if (!boardRef.current) {
        cancelAnimationFrame(scrollIntervalRef.current);
        return;
      }
      
      const deltaTime = currentTime - lastTime;
      const scrollAmount = (scrollSpeed * deltaTime) / 1000; // Converter para pixels por frame
      
      const currentScroll = boardRef.current.scrollLeft;
      const maxScroll = boardRef.current.scrollWidth - boardRef.current.clientWidth;
      
      if (direction === 'left') {
        boardRef.current.scrollLeft = Math.max(0, currentScroll - scrollAmount);
      } else {
        boardRef.current.scrollLeft = Math.min(maxScroll, currentScroll + scrollAmount);
      }
      
      checkScrollButtons();
      
      // Continuar animação se ainda houver espaço para scroll
      if (direction === 'left' && boardRef.current.scrollLeft > 0) {
        lastTime = currentTime;
        scrollIntervalRef.current = requestAnimationFrame(animate);
      } else if (direction === 'right' && boardRef.current.scrollLeft < maxScroll) {
        lastTime = currentTime;
        scrollIntervalRef.current = requestAnimationFrame(animate);
      } else {
        scrollIntervalRef.current = null;
      }
    };
    
    lastTime = performance.now();
    scrollIntervalRef.current = requestAnimationFrame(animate);
  };

  const stopContinuousScroll = () => {
    if (scrollIntervalRef.current) {
      cancelAnimationFrame(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  // Limpar animação ao desmontar
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        cancelAnimationFrame(scrollIntervalRef.current);
      }
    };
  }, []);

  const loadKanbanData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar etapas do funil
      const etapasData = await crmKanbanService.fetchEtapasFunil(funilId);
      // Ordenar por ordem_etapa
      const etapasOrdenadas = [...etapasData].sort((a, b) => 
        (a.ordem_etapa || 0) - (b.ordem_etapa || 0)
      );
      setEtapas(etapasOrdenadas);

      // Buscar oportunidades por etapa
      const etapaIds = etapasOrdenadas.map(e => e.id_etapa_sprint);
      if (etapaIds.length > 0) {
        const oppsData = await crmKanbanService.fetchOportunidadesPorFunil(funilId, etapaIds);
        setOportunidades(oppsData);
        
        // Buscar informações dos vendedores de todas as oportunidades
        const userIds = [];
        Object.values(oppsData).forEach(opps => {
          opps.forEach(opp => {
            if (opp.user_id && !userIds.includes(opp.user_id)) {
              userIds.push(opp.user_id);
            }
          });
        });
        
        if (userIds.length > 0) {
          const vendedoresData = await crmKanbanService.fetchVendedoresInfo(userIds);
          setVendedores(vendedoresData);
        }
      }
    } catch (err) {
      setError('Erro ao carregar dados do Kanban');
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(checkScrollButtons, 100);
    }
  };

  const handleMoveCard = async (oportunidadeId, fromEtapaId, toEtapaId) => {
    try {
      const oppsCopy = { ...oportunidades };
      const opp = oppsCopy[fromEtapaId]?.find(o => o.id === oportunidadeId);
      
      if (opp) {
        oppsCopy[fromEtapaId] = oppsCopy[fromEtapaId].filter(o => o.id !== oportunidadeId);
        if (!oppsCopy[toEtapaId]) {
          oppsCopy[toEtapaId] = [];
        }
        // Adicionar no início da etapa (unshift ao invés de push)
        oppsCopy[toEtapaId].unshift(opp);
        setOportunidades(oppsCopy);

        await crmKanbanService.moverOportunidade(oportunidadeId, toEtapaId);
      }
    } catch (err) {
      loadKanbanData();
      alert('Erro ao mover oportunidade. Tente novamente.');
      console.error(err);
    }
  };

  const getEtapaColor = (ordem) => {
    const colors = {
      0: '#ef4444', // Vermelho - ENTRADA
      1: '#8b5cf6', // Roxo - ACOLHIMENTO
      2: '#f59e0b', // Laranja - QUALIFICADO
      3: '#8b5cf6', // Roxo - ORÇAMENTO
      4: '#fbbf24', // Amarelo - NEGOCIAÇÃO
      5: '#10b981', // Verde - FOLLOW UP
      6: '#10b981'  // Verde - CADASTRO
    };
    return colors[ordem] || '#64748b';
  };

  const calcularValorTotal = (opps) => {
    return opps.reduce((total, opp) => {
      return total + (parseFloat(opp.value) || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="CrmKanbanBoard">
        <div className="CrmKanbanBoard-loading">Carregando Kanban...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="CrmKanbanBoard">
        <div className="CrmKanbanBoard-error">{error}</div>
      </div>
    );
  }

  if (etapas.length === 0) {
    return (
      <div className="CrmKanbanBoard">
        <div className="CrmKanbanBoard-empty">Nenhuma etapa encontrada para este funil</div>
      </div>
    );
  }

  return (
    <div className="CrmKanbanBoard">
      {/* Seta esquerda para scroll horizontal */}
      {canScrollLeft && (
        <button 
          className="CrmKanbanBoard-scroll-btn CrmKanbanBoard-scroll-left"
          onMouseEnter={() => startContinuousScroll('left')}
          onMouseLeave={stopContinuousScroll}
          onClick={() => scrollHorizontal('left')}
          title="Rolar para esquerda"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Container do board com scroll horizontal */}
      <div 
        className="CrmKanbanBoard-container" 
        ref={boardRef}
        onScroll={checkScrollButtons}
      >
        {etapas.map(etapa => {
          const etapaOpps = oportunidades[etapa.id_etapa_sprint] || [];
          const valorTotal = calcularValorTotal(etapaOpps);
          const etapaColor = getEtapaColor(etapa.ordem_etapa || 0);
          const oppCount = etapaOpps.length;
          const oppText = oppCount === 1 ? 'Oportunidade' : 'Oportunidades';

          return (
            <div key={etapa.id_etapa_sprint} className="CrmKanbanBoard-column">
              <div 
                className="CrmKanbanBoard-column-header"
                style={{ borderTopColor: etapaColor }}
              >
                <div className="CrmKanbanBoard-column-title-wrapper">
                  <h3 
                    className="CrmKanbanBoard-column-title"
                    style={{ color: etapaColor }}
                  >
                    {etapa.nome_etapa}
                  </h3>
                  <div className="CrmKanbanBoard-column-info">
                    <span className="CrmKanbanBoard-column-value">
                      {formatCurrency(valorTotal)}
                    </span>
                    <span className="CrmKanbanBoard-column-count">
                      {oppCount} {oppText}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="CrmKanbanBoard-column-body"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('CrmKanbanBoard-drag-over');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('CrmKanbanBoard-drag-over');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('CrmKanbanBoard-drag-over');
                  const oportunidadeId = parseInt(e.dataTransfer.getData('oportunidadeId'));
                  const fromEtapaId = parseInt(e.dataTransfer.getData('fromEtapaId'));
                  if (oportunidadeId && fromEtapaId !== etapa.id_etapa_sprint) {
                    handleMoveCard(oportunidadeId, fromEtapaId, etapa.id_etapa_sprint);
                  }
                }}
              >
                {etapaOpps.length === 0 ? (
                  <div className="CrmKanbanBoard-empty-column">
                    Não há oportunidades nessa etapa.
                  </div>
                ) : (
                  <>
                    {etapaOpps.map((opp, index) => (
                      <CrmKanbanCard
                        key={`${etapa.id_etapa_sprint}-${opp.id}-${index}`}
                        oportunidade={opp}
                        etapaId={etapa.id_etapa_sprint}
                        vendedorInfo={vendedores[opp.user_id] || null}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('oportunidadeId', opp.id);
                          e.dataTransfer.setData('fromEtapaId', etapa.id_etapa_sprint);
                        }}
                        onClick={(opp) => setSelectedOportunidade(opp)}
                        onLeadClick={(leadId) => setSelectedLeadId(leadId)}
                      />
                    ))}
                    <div className="CrmKanbanBoard-end-marker">Fim da etapa</div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Seta direita para scroll horizontal */}
      {canScrollRight && (
        <button 
          className="CrmKanbanBoard-scroll-btn CrmKanbanBoard-scroll-right"
          onMouseEnter={() => startContinuousScroll('right')}
          onMouseLeave={stopContinuousScroll}
          onClick={() => scrollHorizontal('right')}
          title="Rolar para direita"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Modal de Detalhes da Oportunidade */}
      {selectedOportunidade && (
        <CrmOpportunityModal
          oportunidade={selectedOportunidade}
          etapas={etapas}
          etapaAtualId={selectedOportunidade.crm_column ? Number(selectedOportunidade.crm_column) : null}
          vendedorInfo={vendedores[selectedOportunidade.user_id] || null}
          onClose={() => setSelectedOportunidade(null)}
          onUpdate={() => {
            loadKanbanData();
            setSelectedOportunidade(null);
          }}
        />
      )}

      {/* Modal de Detalhes do Lead */}
      {selectedLeadId && (
        <CrmLeadModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  );
};

export default CrmKanbanBoard;
