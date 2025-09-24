import React, { useState, useEffect, useMemo } from 'react';
// Usando ícones Unicode/emoji seguindo o padrão do projeto
import { googlePatrocinadoService } from '../../service/googlePatrocinadoService';
import './GooglePatrocinadoDashboard.css';

// Componente para cards de métricas pequenas
const MetricCard = ({ title, value, subtitle, icon, color, sparkline }) => {
  return (
    <div className="google-patrocinado-metric-card">
      <div className="google-patrocinado-metric-card-header">
        <div className="google-patrocinado-metric-icon" style={{ color }}>
          {icon}
        </div>
        <div className="google-patrocinado-metric-trend">
          {sparkline && sparkline.length > 0 && (
            <div className="google-patrocinado-sparkline">
              {/* Sparkline simples com CSS */}
              <div className="google-patrocinado-sparkline-bar" style={{ height: '8px', backgroundColor: color }}></div>
            </div>
          )}
        </div>
      </div>
      <div className="google-patrocinado-metric-content">
        <h3 className="google-patrocinado-metric-value">{value}</h3>
        <p className="google-patrocinado-metric-title">{title}</p>
        {subtitle && <p className="google-patrocinado-metric-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

// Componente principal do dashboard
const GooglePatrocinadoDashboard = ({ 
  dateRange, 
  filteredCampaigns = [],
  onRefresh,
  isLoading = false,
  error = null
}) => {
  const [statistics, setStatistics] = useState({
    totalSpent: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    averageCTR: 0,
    averageCPC: 0,
    averageConversionRate: 0,
    totalCampaigns: 0
  });

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('all');

  // Calcular estatísticas baseadas nas campanhas filtradas
  const calculatedStats = useMemo(() => {
    if (!filteredCampaigns || filteredCampaigns.length === 0) {
      return {
        totalSpent: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        averageCTR: 0,
        averageCPC: 0,
        averageConversionRate: 0,
        totalCampaigns: 0
      };
    }

    const stats = filteredCampaigns.reduce((acc, campaign) => {
      const metrics = campaign.metrics || {};
      
      const costMicros = metrics.cost_micros || 0;
      const costReal = googlePatrocinadoService.convertMicrosToReal(costMicros);
      
      console.log(`💰 DASHBOARD - ${campaign.name}:`, {
        cost_micros: costMicros,
        cost_real: costReal,
        metrics: metrics
      });
      
      acc.totalSpent += costReal;
      acc.totalImpressions += metrics.impressions || 0;
      acc.totalClicks += metrics.clicks || 0;
      acc.totalConversions += metrics.conversions || 0;
      
      return acc;
    }, {
      totalSpent: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0
    });

    console.log('💰 DASHBOARD - Total calculado:', {
      totalSpent: stats.totalSpent,
      totalImpressions: stats.totalImpressions,
      totalClicks: stats.totalClicks,
      totalConversions: stats.totalConversions,
      campanhasCount: filteredCampaigns.length
    });

    // Calcular médias
    const averageCTR = stats.totalImpressions > 0 ? 
      (stats.totalClicks / stats.totalImpressions) * 100 : 0;
    
    const averageCPC = stats.totalClicks > 0 ? 
      stats.totalSpent / stats.totalClicks : 0;
    
    const averageConversionRate = stats.totalClicks > 0 ? 
      (stats.totalConversions / stats.totalClicks) * 100 : 0;

    return {
      ...stats,
      averageCTR,
      averageCPC,
      averageConversionRate,
      totalCampaigns: filteredCampaigns.length
    };
  }, [filteredCampaigns]);

  // Atualizar estatísticas quando as campanhas mudarem
  useEffect(() => {
    setStatistics(calculatedStats);
  }, [calculatedStats]);

  // Buscar contas disponíveis
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        // Simular contas disponíveis baseadas no serviço
        const accountsData = [
          { key: 'ACCOUNT_1', name: 'Conta Principal', active: true },
          { key: 'ACCOUNT_2', name: 'Conta Secundária', active: true }
        ];
        setAccounts(accountsData);
      } catch (error) {
        console.error('Erro ao carregar contas:', error);
      }
    };

    loadAccounts();
  }, []);

  // Handler para mudança de conta
  const handleAccountChange = (accountKey) => {
    setSelectedAccount(accountKey);
    if (onRefresh) {
      onRefresh(accountKey);
    }
  };

  // Cards de métricas principais
  const metricCards = [
    {
      title: 'Gasto Total',
      value: googlePatrocinadoService.formatCurrency(statistics.totalSpent, 'BRL', 'pt-BR'),
      subtitle: `${statistics.totalCampaigns} campanhas`,
      icon: '💰',
      color: '#10b981',
      sparkline: [1, 2, 3, 2, 4, 3, 5]
    },
    {
      title: 'Impressões',
      value: googlePatrocinadoService.formatNumber(statistics.totalImpressions),
      subtitle: 'Total de visualizações',
      icon: '👁️',
      color: '#3b82f6',
      sparkline: [2, 1, 4, 3, 2, 5, 4]
    },
    {
      title: 'Cliques',
      value: googlePatrocinadoService.formatNumber(statistics.totalClicks),
      subtitle: `CTR: ${statistics.averageCTR.toFixed(2)}%`,
      icon: '👆',
      color: '#f59e0b',
      sparkline: [1, 3, 2, 4, 2, 3, 5]
    },
    {
      title: 'Conversões',
      value: googlePatrocinadoService.formatNumber(statistics.totalConversions),
      subtitle: `Taxa: ${statistics.averageConversionRate.toFixed(2)}%`,
      icon: '✅',
      color: '#8b5cf6',
      sparkline: [3, 2, 4, 1, 5, 3, 4]
    }
  ];

  // Métricas secundárias
  const secondaryMetrics = [
    {
      title: 'CPC Médio',
      value: googlePatrocinadoService.formatCurrency(statistics.averageCPC, 'BRL', 'pt-BR'),
      icon: '🎯',
      color: '#06b6d4'
    },
    {
      title: 'Taxa de Conversão',
      value: `${statistics.averageConversionRate.toFixed(2)}%`,
      icon: '📈',
      color: '#10b981'
    },
    {
      title: 'CTR Médio',
      value: `${statistics.averageCTR.toFixed(2)}%`,
      icon: '📊',
      color: '#f59e0b'
    }
  ];

  if (error) {
    return (
      <div className="google-patrocinado-dashboard-error">
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <h3>Erro ao carregar dados</h3>
        <p>{error}</p>
        {onRefresh && (
          <button onClick={() => onRefresh()} className="google-patrocinado-retry-button">
            Tentar Novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="google-patrocinado-dashboard">
      {/* Header do Dashboard */}
      <div className="google-patrocinado-dashboard-header">
        <div className="google-patrocinado-dashboard-title">
          <h2>Google Patrocinado</h2>
          <p>Dashboard de campanhas e métricas</p>
        </div>
        
        {/* Seletor de Conta */}
        <div className="google-patrocinado-account-selector">
          <select 
            value={selectedAccount} 
            onChange={(e) => handleAccountChange(e.target.value)}
            className="google-patrocinado-account-select"
          >
            <option value="all">Todas as Contas</option>
            {accounts.map(account => (
              <option key={account.key} value={account.key}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="google-patrocinado-metrics-grid">
        {metricCards.map((card, index) => (
          <MetricCard
            key={index}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
            sparkline={card.sparkline}
          />
        ))}
      </div>

      {/* Métricas Secundárias */}
      <div className="google-patrocinado-secondary-metrics">
        <h3>Métricas Detalhadas</h3>
        <div className="google-patrocinado-secondary-grid">
          {secondaryMetrics.map((metric, index) => (
            <div key={index} className="google-patrocinado-secondary-card">
              <div className="google-patrocinado-secondary-icon" style={{ color: metric.color }}>
                {metric.icon}
              </div>
              <div className="google-patrocinado-secondary-content">
                <span className="google-patrocinado-secondary-value">{metric.value}</span>
                <span className="google-patrocinado-secondary-title">{metric.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status das Campanhas */}
      <div className="google-patrocinado-campaign-status">
        <h3>Status das Campanhas</h3>
        <div className="google-patrocinado-status-grid">
          <div className="google-patrocinado-status-card">
            <div className="google-patrocinado-status-icon">
              <span style={{ fontSize: '24px', color: '#10b981' }}>✅</span>
            </div>
            <div className="google-patrocinado-status-content">
              <span className="google-patrocinado-status-count">
                {filteredCampaigns.filter(c => c.status === 'ENABLED').length}
              </span>
              <span className="google-patrocinado-status-label">Ativas</span>
            </div>
          </div>
          
          <div className="google-patrocinado-status-card">
            <div className="google-patrocinado-status-icon">
              <span style={{ fontSize: '24px', color: '#f59e0b' }}>⏸️</span>
            </div>
            <div className="google-patrocinado-status-content">
              <span className="google-patrocinado-status-count">
                {filteredCampaigns.filter(c => c.status === 'PAUSED').length}
              </span>
              <span className="google-patrocinado-status-label">Pausadas</span>
            </div>
          </div>
          
          <div className="google-patrocinado-status-card">
            <div className="google-patrocinado-status-icon">
              <span style={{ fontSize: '24px', color: '#3b82f6' }}>📊</span>
            </div>
            <div className="google-patrocinado-status-content">
              <span className="google-patrocinado-status-count">{statistics.totalCampaigns}</span>
              <span className="google-patrocinado-status-label">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="google-patrocinado-loading-overlay">
          <div className="google-patrocinado-loading-spinner"></div>
          <p>Carregando dados...</p>
        </div>
      )}
    </div>
  );
};

export default GooglePatrocinadoDashboard;
