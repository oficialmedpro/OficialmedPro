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

const FlowEsteirasPage = () => {
  const { esteiraId } = useParams();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' ou 'lista'
  const [filters, setFilters] = useState({});
  const [esteiraInfo, setEsteiraInfo] = useState(null);
  
  const funilIdOuNome = esteiraId || 'Compra';
  const { opportunities, loading, error, moveToEsteira, processVenda, incrementTentativas } = useFlowOpportunities(
    funilIdOuNome,
    filters
  );

  useEffect(() => {
    const loadEsteiraInfo = async () => {
      const info = await getEsteiraInfo(funilIdOuNome);
      setEsteiraInfo(info);
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
            {/* Agrupar por etapa se aplicável */}
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

