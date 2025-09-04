import React, { useState, useEffect } from 'react';
import './CrmIntegrationMetrics.css';
import { crmService } from '../service/crmService';

/**
 * CrmIntegrationMetrics.jsx
 * 
 * Componente exclusivo para métricas de integração com CRM
 * Exibe status dos leads, performance financeira e tempo médio
 */
const CrmIntegrationMetrics = ({ 
  isDarkMode = true, 
  formatCurrency = (value) => value,
  filters = {},
  onMetricsUpdate = () => {}
}) => {
  const [metrics, setMetrics] = useState({
    leads: {
      converted: { value: 0, percentage: '0.0' },
      lost: { value: 0, percentage: '0.0' },
      open: { value: 0, percentage: '0.0' },
      total: 0
    },
    financial: {
      roas: { value: '0.0x', percentage: '0%' },
      roi: { value: '0%', percentage: '0%' },
      conversionRate: { value: '0.0%', percentage: '0.0%' }
    },
    time: {
      avgClosingTime: { value: '0 dias', percentage: '0 dias' },
      lossRate: { value: '0%', percentage: '0%' }
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar métricas do CRM
  const loadCrmMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 CrmIntegrationMetrics: Carregando métricas...', filters);
      
      const crmMetrics = await crmService.getAllCrmMetrics(filters);
      setMetrics(crmMetrics);
      
      // Notificar componente pai sobre atualização
      onMetricsUpdate(crmMetrics);
      
      console.log('✅ CrmIntegrationMetrics: Métricas carregadas com sucesso');
      
    } catch (err) {
      console.error('❌ CrmIntegrationMetrics: Erro ao carregar métricas:', err);
      setError(err.message || 'Erro ao carregar métricas do CRM');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar métricas quando o componente monta ou filtros mudam
  useEffect(() => {
    loadCrmMetrics();
  }, [filters]);

  // Função para formatar valores grandes
  const formatLargeNumber = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  // Renderizar loading
  if (isLoading) {
    return (
      <section className="crm-integration-metrics">
        <div className="crm-section-header">
          <div className="crm-platform-icon crm-sources-icon">I</div>
          <span className="crm-platform-name">Integração com CRM</span>
        </div>
        
        <div className="crm-metrics-loading">
          <div className="loading-spinner"></div>
          <span>Carregando métricas do CRM...</span>
        </div>
      </section>
    );
  }

  // Renderizar erro
  if (error) {
    return (
      <section className="crm-integration-metrics">
        <div className="crm-section-header">
          <div className="crm-platform-icon crm-sources-icon">I</div>
          <span className="crm-platform-name">Integração com CRM</span>
        </div>
        
        <div className="crm-metrics-error">
          <div className="error-icon">⚠️</div>
          <span>{error}</span>
          <button onClick={loadCrmMetrics} className="retry-button">
            Tentar Novamente
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="crm-integration-metrics">
      <div className="crm-section-header">
        <div className="crm-platform-icon crm-sources-icon">I</div>
        <span className="crm-platform-name">Integração com CRM</span>
      </div>
      
      <div className="crm-metrics-grid">
        {/* Status dos Leads */}
        <div className="crm-metric-group">
          <h4 className="crm-group-title">📊 Status dos Leads</h4>
          <div className="crm-metrics-row">
            <div className="crm-metric-item converted">
              <div className="crm-metric-label">✅ Convertidos</div>
              <div className="crm-metric-value">{formatLargeNumber(metrics.leads.converted.value)}</div>
              <div className="crm-metric-percentage">{metrics.leads.converted.percentage}%</div>
            </div>
            <div className="crm-metric-item lost">
              <div className="crm-metric-label">❌ Perdidos</div>
              <div className="crm-metric-value">{formatLargeNumber(metrics.leads.lost.value)}</div>
              <div className="crm-metric-percentage">{metrics.leads.lost.percentage}%</div>
            </div>
            <div className="crm-metric-item open">
              <div className="crm-metric-label">🔄 Em Aberto</div>
              <div className="crm-metric-value">{formatLargeNumber(metrics.leads.open.value)}</div>
              <div className="crm-metric-percentage">{metrics.leads.open.percentage}%</div>
            </div>
          </div>
        </div>
        
        {/* Performance Financeira */}
        <div className="crm-metric-group">
          <h4 className="crm-group-title">💰 Performance Financeira</h4>
          <div className="crm-metrics-row">
            <div className="crm-metric-item roas">
              <div className="crm-metric-label">ROAS</div>
              <div className="crm-metric-value">{metrics.financial.roas.value}</div>
              <div className="crm-metric-percentage">{metrics.financial.roas.percentage}</div>
            </div>
            <div className="crm-metric-item roi">
              <div className="crm-metric-label">ROI</div>
              <div className="crm-metric-value">{metrics.financial.roi.value}</div>
              <div className="crm-metric-percentage">{metrics.financial.roi.percentage}</div>
            </div>
            <div className="crm-metric-item conversion">
              <div className="crm-metric-label">Taxa Conversão</div>
              <div className="crm-metric-value">{metrics.financial.conversionRate.value}</div>
              <div className="crm-metric-percentage">{metrics.financial.conversionRate.percentage}</div>
            </div>
          </div>
        </div>
        
        {/* Tempo Médio */}
        <div className="crm-metric-group">
          <h4 className="crm-group-title">⏱️ Tempo Médio</h4>
          <div className="crm-metrics-row">
            <div className="crm-metric-item time">
              <div className="crm-metric-label">Fechamento</div>
              <div className="crm-metric-value">{metrics.time.avgClosingTime.value}</div>
              <div className="crm-metric-percentage">{metrics.time.avgClosingTime.percentage}</div>
            </div>
            <div className="crm-metric-item loss-rate">
              <div className="crm-metric-label">Taxa de Perda</div>
              <div className="crm-metric-value">{metrics.time.lossRate.value}</div>
              <div className="crm-metric-percentage">{metrics.time.lossRate.percentage}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CrmIntegrationMetrics;

