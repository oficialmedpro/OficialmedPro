import React, { useState, useEffect } from 'react';
import './CrmIntegrationMetrics.css';
import { getAllMetaAdsOpportunitiesMetrics } from '../service/metaAdsOpportunitiesService';

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
      convertidas: { count: 0, value: 0, percentage: 0 },
      perdidas: { count: 0, value: 0, percentage: 0 },
      emAberto: { count: 0, value: 0, percentage: 0 },
      total: { count: 0, value: 0 }
    },
    financial: {
      roas: 0,
      roi: 0,
      conversionRate: 0,
      valorGanho: 0,
      valorPerda: 0
    },
    time: {
      closingTime: 0,
      lossRate: 0
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

      // Calcular datas baseado no período selecionado
      const today = new Date();
      let startDate, endDate;

      const period = filters?.period || 'today';
      switch (period) {
        case 'today':
          startDate = endDate = today.toISOString().split('T')[0];
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          startDate = endDate = yesterday.toISOString().split('T')[0];
          break;
        case 'last7Days':
          const last7Days = new Date(today);
          last7Days.setDate(today.getDate() - 7);
          startDate = last7Days.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'thisMonth':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'thisQuarter':
          const quarter = Math.floor(today.getMonth() / 3);
          startDate = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'thisYear':
          startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        default:
          startDate = endDate = today.toISOString().split('T')[0];
      }

      // Usar filtros do props
      const unitCode = filters?.unit || 'all';
      const funnelCode = filters?.funnel || 'all';
      const sellerCode = filters?.seller || 'all';

      console.log('📅 Datas calculadas:', { startDate, endDate });
      console.log('🔍 Filtros aplicados:', { unitCode, funnelCode, sellerCode });
      
      const crmMetrics = await getAllMetaAdsOpportunitiesMetrics(
        startDate, 
        endDate, 
        unitCode, 
        funnelCode, 
        sellerCode
      );
      
      setMetrics(crmMetrics);
      
      // Notificar componente pai sobre atualização
      onMetricsUpdate(crmMetrics);
      
      console.log('✅ CrmIntegrationMetrics: Métricas carregadas com sucesso:', crmMetrics);
      
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
          <h4 className="crm-group-title">📊 Status das Oportunidades</h4>
          <div className="crm-metrics-row">
            <div className="crm-metric-item converted">
              <div className="crm-metric-label">✅ Convertidos</div>
              <div className="crm-metric-value">{formatLargeNumber(metrics.leads?.convertidas?.count || 0)}</div>
              <div className="crm-metric-percentage">{(metrics.leads?.convertidas?.percentage || 0).toFixed(1)}%</div>
            </div>
            <div className="crm-metric-item lost">
              <div className="crm-metric-label">❌ Perdidos</div>
              <div className="crm-metric-value">{formatLargeNumber(metrics.leads?.perdidas?.count || 0)}</div>
              <div className="crm-metric-percentage">{(metrics.leads?.perdidas?.percentage || 0).toFixed(1)}%</div>
            </div>
            <div className="crm-metric-item open">
              <div className="crm-metric-label">🔄 Em Aberto</div>
              <div className="crm-metric-value">{formatLargeNumber(metrics.leads?.emAberto?.count || 0)}</div>
              <div className="crm-metric-percentage">{(metrics.leads?.emAberto?.percentage || 0).toFixed(1)}%</div>
            </div>
          </div>
        </div>
        
        {/* Performance Financeira */}
        <div className="crm-metric-group">
          <h4 className="crm-group-title">💰 Performance Financeira</h4>
          <div className="crm-metrics-row">
            <div className="crm-metric-item roas">
              <div className="crm-metric-label">ROAS</div>
              <div className="crm-metric-value">{(metrics.financial?.roas || 0).toFixed(1)}x</div>
              <div className="crm-metric-percentage">{((metrics.financial?.roas || 0) * 100).toFixed(0)}%</div>
            </div>
            <div className="crm-metric-item roi">
              <div className="crm-metric-label">ROI</div>
              <div className="crm-metric-value">{(metrics.financial?.roi || 0).toFixed(0)}%</div>
              <div className="crm-metric-percentage">{(metrics.financial?.roi || 0).toFixed(0)}%</div>
            </div>
            <div className="crm-metric-item conversion">
              <div className="crm-metric-label">Taxa Conversão</div>
              <div className="crm-metric-value">{(metrics.financial?.conversionRate || 0).toFixed(1)}%</div>
              <div className="crm-metric-percentage">{(metrics.financial?.conversionRate || 0).toFixed(1)}%</div>
            </div>
          </div>
        </div>
        
        {/* Tempo Médio */}
        <div className="crm-metric-group">
          <h4 className="crm-group-title">⏱️ Tempo Médio</h4>
          <div className="crm-metrics-row">
            <div className="crm-metric-item time">
              <div className="crm-metric-label">Fechamento</div>
              <div className="crm-metric-value">{(metrics.time?.closingTime || 0).toFixed(0)} dias</div>
              <div className="crm-metric-percentage">{(metrics.time?.closingTime || 0).toFixed(0)} dias</div>
            </div>
            <div className="crm-metric-item loss-rate">
              <div className="crm-metric-label">Taxa de Perda</div>
              <div className="crm-metric-value">{(metrics.time?.lossRate || 0).toFixed(1)}%</div>
              <div className="crm-metric-percentage">{(metrics.time?.lossRate || 0).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CrmIntegrationMetrics;

