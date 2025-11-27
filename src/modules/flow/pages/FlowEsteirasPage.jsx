/**
 * Página de Visualização das Esteiras
 * 
 * Exibe todas as esteiras em formato Kanban ou lista
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './FlowEsteirasPage.css';
import { useFlowOpportunities } from '../hooks/useFlowOpportunities';
import FlowEsteiraCard from '../components/FlowEsteiraCard';
import FlowHeader from '../components/FlowHeader';
import { getEsteiraInfo } from '../utils/flowHelpers';
import flowService from '../services/flowService';
import { getFunilEtapas } from '../../../service/supabase';

const FlowEsteirasPage = () => {
  const { esteiraId } = useParams();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' ou 'lista'
  const [filters, setFilters] = useState({});
  const [esteiraInfo, setEsteiraInfo] = useState(null);
  const [etapas, setEtapas] = useState([]);
  
  const funilIdOuNome = esteiraId || 'Compra';
  const { opportunities, loading, error, moveToEsteira, processVenda, incrementTentativas } = useFlowOpportunities(
    funilIdOuNome,
    filters
  );

  useEffect(() => {
    const loadEsteiraInfo = async () => {
      try {
        const info = await getEsteiraInfo(funilIdOuNome);
        setEsteiraInfo(info);
        console.log('[FlowEsteirasPage] Esteira info carregada:', info);
        
        // Carregar etapas do funil usando a mesma lógica do FunnelChart
        if (info && info.id) {
          try {
            // Primeiro buscar o funil para obter o id_funil_sprint
            const { getSupabaseWithSchema } = await import('../../../service/supabase');
            const supabase = getSupabaseWithSchema('api');
            const { data: funilData, error: funilError } = await supabase
              .from('funis')
              .select('id_funil_sprint')
              .eq('id', info.id)
              .single();
            
            if (!funilError && funilData && funilData.id_funil_sprint) {
              // Usar a mesma função do FunnelChart que recebe id_funil_sprint diretamente
              const etapasData = await getFunilEtapas(funilData.id_funil_sprint);
              console.log('[FlowEsteirasPage] Etapas carregadas:', etapasData);
              setEtapas(etapasData || []);
            } else {
              console.warn('[FlowEsteirasPage] Funil sem id_funil_sprint:', funilData);
              setEtapas([]);
            }
          } catch (err) {
            console.error('[FlowEsteirasPage] Erro ao carregar etapas:', err);
            // Fallback para etapas padrão se houver erro
            setEtapas([]);
          }
        } else {
          console.warn('[FlowEsteirasPage] Esteira info sem ID:', info);
          setEtapas([]);
        }
      } catch (err) {
        console.error('[FlowEsteirasPage] Erro ao carregar info da esteira:', err);
        setEtapas([]);
      }
    };
    loadEsteiraInfo();
  }, [funilIdOuNome]);

  const handleMoveToEsteira = async (opportunityId, newEsteira, newEtapa) => {
    try {
      await moveToEsteira(opportunityId, newEsteira, newEtapa);
    } catch (error) {
      console.error('Erro ao mover para esteira:', error);
      alert('Erro ao mover cliente para nova esteira');
    }
  };

  const handleProcessVenda = async (opportunityId) => {
    try {
      await processVenda(opportunityId);
      alert('Venda processada! Cliente movido para Laboratório → Logística → Monitoramento');
    } catch (error) {
      console.error('Erro ao processar venda:', error);
      alert('Erro ao processar venda');
    }
  };

  if (loading) {
    return (
      <div className="FlowEsteirasPage">
        <FlowHeader />
        <div className="FlowEsteirasPage-loading">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="FlowEsteirasPage">
        <FlowHeader />
        <div className="FlowEsteirasPage-error">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div className="FlowEsteirasPage">
      <FlowHeader />
      
      <div className="FlowEsteirasPage-content">
        <div className="FlowEsteirasPage-header">
          <div>
            <h1 className="FlowEsteirasPage-title">
              {esteiraInfo?.name || 'Esteira'}
            </h1>
            <p className="FlowEsteirasPage-subtitle">
              {opportunities.length} cliente(s) nesta esteira
            </p>
          </div>
          
          <div className="FlowEsteirasPage-actions">
            <button
              className={`FlowEsteirasPage-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              📋 Kanban
            </button>
            <button
              className={`FlowEsteirasPage-view-btn ${viewMode === 'lista' ? 'active' : ''}`}
              onClick={() => setViewMode('lista')}
            >
              📄 Lista
            </button>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <div className="FlowEsteirasPage-kanban">
            {/* Usar etapas dinâmicas do funil */}
            {etapas.length > 0 ? (
              etapas.map(etapa => {
                const etapaNome = etapa.nome_etapa || etapa.id_etapa_sprint || 'Sem nome';
                const etapaOpps = opportunities.filter(opp => {
                  // Comparar crm_column (id_etapa_sprint) da oportunidade com id_etapa_sprint da etapa
                  // crm_column é integer, id_etapa_sprint é varchar - converter ambos para string
                  const oppCrmColumn = opp.crm_column ? opp.crm_column.toString() : (opp.etapa || '');
                  const etapaIdSprint = etapa.id_etapa_sprint ? etapa.id_etapa_sprint.toString() : null;
                  
                  // Comparar como string para garantir match
                  return etapaIdSprint && oppCrmColumn === etapaIdSprint;
                });
                
                // Sempre mostrar a coluna, mesmo se vazia
                return (
                  <div key={etapa.id || etapaNome} className="FlowEsteirasPage-kanban-column">
                    <h3 className="FlowEsteirasPage-kanban-column-title">
                      {etapaNome} ({etapaOpps.length})
                    </h3>
                    {etapaOpps.map(opp => (
                      <FlowEsteiraCard
                        key={opp.id}
                        opportunity={opp}
                        onMove={handleMoveToEsteira}
                        onVenda={handleProcessVenda}
                        onIncrementTentativas={incrementTentativas}
                      />
                    ))}
                  </div>
                );
              })
            ) : (
              /* Se não houver etapas configuradas, usar fallback padrão */
              <>
                {['d30', 'd60', 'd90', 'primeira', 'r30', 'r60', 'r90', 'infinita'].map(etapa => {
                  const etapaOpps = opportunities.filter(opp => opp.etapa === etapa);
                  if (etapaOpps.length === 0 && opportunities.length > 0) return null;
                  
                  return (
                    <div key={etapa} className="FlowEsteirasPage-kanban-column">
                      <h3 className="FlowEsteirasPage-kanban-column-title">
                        {etapa.toUpperCase()} ({etapaOpps.length})
                      </h3>
                      {etapaOpps.map(opp => (
                        <FlowEsteiraCard
                          key={opp.id}
                          opportunity={opp}
                          onMove={handleMoveToEsteira}
                          onVenda={handleProcessVenda}
                          onIncrementTentativas={incrementTentativas}
                        />
                      ))}
                    </div>
                  );
                })}
                
                {/* Coluna para oportunidades sem etapa específica */}
                {opportunities.filter(opp => !opp.etapa || !['d30', 'd60', 'd90', 'primeira', 'r30', 'r60', 'r90', 'infinita'].includes(opp.etapa)).length > 0 && (
                  <div className="FlowEsteirasPage-kanban-column">
                    <h3 className="FlowEsteirasPage-kanban-column-title">
                      Geral ({opportunities.filter(opp => !opp.etapa || !['d30', 'd60', 'd90', 'primeira', 'r30', 'r60', 'r90', 'infinita'].includes(opp.etapa)).length})
                    </h3>
                    {opportunities
                      .filter(opp => !opp.etapa || !['d30', 'd60', 'd90', 'primeira', 'r30', 'r60', 'r90', 'infinita'].includes(opp.etapa))
                      .map(opp => (
                        <FlowEsteiraCard
                          key={opp.id}
                          opportunity={opp}
                          onMove={handleMoveToEsteira}
                          onVenda={handleProcessVenda}
                          onIncrementTentativas={incrementTentativas}
                        />
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="FlowEsteirasPage-list">
            {opportunities.map(opp => (
              <FlowEsteiraCard
                key={opp.id}
                opportunity={opp}
                onMove={handleMoveToEsteira}
                onVenda={handleProcessVenda}
                onIncrementTentativas={incrementTentativas}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowEsteirasPage;

