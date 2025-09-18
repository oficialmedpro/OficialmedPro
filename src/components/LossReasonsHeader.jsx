import React, { useState, useEffect } from 'react';
import './LossReasonsHeader.css';
import { lossReasonsService } from '../service/lossReasonsService';

const LossReasonsHeader = ({ 
  formatCurrency, 
  t, 
  startDate, 
  endDate, 
  selectedFunnel, 
  selectedUnit, 
  selectedSeller, 
  selectedOrigin 
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    general: [],
    byFunnel: [],
    byStage: []
  });
  const [currentStagePage, setCurrentStagePage] = useState(0);
  const stagesPerPage = 1;

  // Carregar dados quando os parâmetros mudarem
  useEffect(() => {
    loadData();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 LossReasonsHeader: Carregando dados...', {
        startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin
      });

      // Carregar todos os rankings em paralelo
      console.log('🚀 LossReasonsHeader: Chamando services...');
      
      const [generalResult, funnelResult, stageResult] = await Promise.all([
        lossReasonsService.getLossReasonsGeneral(startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin),
        lossReasonsService.getLossReasonsByFunnel(startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin),
        lossReasonsService.getLossReasonsByStage(startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin)
      ]);
      
      console.log('📊 LossReasonsHeader: Resultados dos services:', {
        general: generalResult,
        funnel: funnelResult,
        stage: stageResult
      });

      setData({
        general: generalResult.success ? generalResult.data : [],
        byFunnel: funnelResult.success ? funnelResult.data : [],
        byStage: stageResult.success ? stageResult.data : []
      });

      console.log('✅ LossReasonsHeader: Dados carregados', {
        general: generalResult.data?.length || 0,
        byFunnel: funnelResult.data?.length || 0,
        byStage: stageResult.data?.length || 0
      });

    } catch (err) {
      console.error('❌ Erro ao carregar dados do LossReasonsHeader:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const renderGeneralRanking = () => {
    if (loading) return <div className="loss-reasons-loading">Carregando...</div>;
    if (error) return <div className="loss-reasons-error">Erro: {error}</div>;
    if (!data.general || data.general.length === 0) return <div className="loss-reasons-empty">Nenhum motivo de perda encontrado</div>;

    return (
      <div className="loss-reasons-list">
        {data.general.slice(0, 10).map((item, index) => (
          <div key={item.reason} className="loss-reason-item">
            <div className="loss-reason-rank">#{index + 1}</div>
            <div className="loss-reason-content">
              <div className="loss-reason-name">{item.reason}</div>
              <div className="loss-reason-stats">
                <span className="loss-reason-count">{item.count} perdas</span>
                <span className="loss-reason-value">
                  {formatCurrency ? formatCurrency(item.totalValue, 'BRL') : `R$ ${item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="loss-reason-bar">
                <div 
                  className="loss-reason-fill" 
                  style={{ 
                    width: `${Math.min((item.count / data.general[0].count) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFunnelRanking = () => {
    if (loading) return <div className="loss-reasons-loading">Carregando...</div>;
    if (error) return <div className="loss-reasons-error">Erro: {error}</div>;
    if (!data.byFunnel || data.byFunnel.length === 0) return <div className="loss-reasons-empty">Nenhum funil encontrado</div>;

    return (
      <div className="loss-reasons-funnel-list">
        {data.byFunnel.slice(0, 5).map((funnel, funnelIndex) => (
          <div key={funnel.funilId} className="loss-funnel-group">
            <div className="loss-funnel-header">
              <h4>Funil {funnel.funilId}</h4>
              <span className="loss-funnel-total">{funnel.totalLost} perdas</span>
            </div>
            <div className="loss-funnel-reasons">
              {funnel.reasons.slice(0, 3).map((reason, reasonIndex) => (
                <div key={reason.reason} className="loss-funnel-reason-item">
                  <span className="loss-funnel-reason-name">{reason.reason}</span>
                  <span className="loss-funnel-reason-count">{reason.count}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStageRanking = () => {
    if (loading) return <div className="loss-reasons-loading">Carregando...</div>;
    if (error) return <div className="loss-reasons-error">Erro: {error}</div>;
    if (!data.byStage || data.byStage.length === 0) return <div className="loss-reasons-empty">Nenhuma etapa encontrada</div>;

    const totalPages = Math.ceil(data.byStage.length / stagesPerPage);
    const startIndex = currentStagePage * stagesPerPage;
    const endIndex = startIndex + stagesPerPage;
    const currentStages = data.byStage.slice(startIndex, endIndex);

    const handlePrevPage = () => {
      setCurrentStagePage(prev => Math.max(0, prev - 1));
    };

    const handleNextPage = () => {
      setCurrentStagePage(prev => Math.min(totalPages - 1, prev + 1));
    };

    return (
      <div className="loss-reasons-stage-container">
        <div className="loss-reasons-stage-list">
          {currentStages.map((stage, stageIndex) => (
            <div key={stage.stageId} className="loss-stage-group">
              <div className="loss-stage-header">
                <h4>{stage.stageName}</h4>
                <span className="loss-stage-total">{stage.totalLost} perdas</span>
              </div>
              <div className="loss-reasons-list">
                {stage.reasons.slice(0, 5).map((reason, reasonIndex) => (
                  <div key={reason.reason} className="loss-reason-item">
                    <div className="loss-reason-rank">#{reasonIndex + 1}</div>
                    <div className="loss-reason-content">
                      <div className="loss-reason-name">{reason.reason}</div>
                      <div className="loss-reason-stats">
                        <span className="loss-reason-count">{reason.count} perdas</span>
                        <span className="loss-reason-value">
                          {formatCurrency ? formatCurrency(reason.totalValue, 'BRL') : `R$ ${reason.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                      <div className="loss-reason-bar">
                        <div 
                          className="loss-reason-fill" 
                          style={{ 
                            width: `${Math.min((reason.count / stage.reasons[0].count) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {totalPages > 1 && (
          <div className="loss-reasons-pagination">
            <button 
              className="loss-pagination-btn" 
              onClick={handlePrevPage}
              disabled={currentStagePage === 0}
            >
              ← Anterior
            </button>
            <span className="loss-pagination-info">
              Página {currentStagePage + 1} de {totalPages}
            </span>
            <button 
              className="loss-pagination-btn" 
              onClick={handleNextPage}
              disabled={currentStagePage === totalPages - 1}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="loss-reasons-header">
      <div className="loss-reasons-header-content">
        <div className="loss-reasons-title">
          <h3>
            <span className="loss-reasons-icon">P</span>
            Principais Motivos de Perda
          </h3>
          <div className="loss-reasons-subtitle">
            Análise detalhada dos motivos de perda de oportunidades
          </div>
        </div>

        <div className="loss-reasons-tabs">
          <button 
            className={`loss-reasons-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            Geral
          </button>
          <button 
            className={`loss-reasons-tab ${activeTab === 'stage' ? 'active' : ''}`}
            onClick={() => setActiveTab('stage')}
          >
            Por Etapa
          </button>
        </div>
      </div>

      <div className="loss-reasons-content">
        {activeTab === 'general' && renderGeneralRanking()}
        {activeTab === 'stage' && renderStageRanking()}
      </div>
    </div>
  );
};

export default LossReasonsHeader;
