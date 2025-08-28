import React, { useState } from 'react';
import './CampaignCard.css';

const CampaignCard = ({ campaign, formatCurrency, isDarkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Função para obter a cor do status
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return { bg: '#10b981', text: 'white' };
      case 'PAUSED':
        return { bg: '#f59e0b', text: 'white' };
      case 'ARCHIVED':
        return { bg: '#6b7280', text: 'white' };
      default:
        return { bg: '#374151', text: 'white' };
    }
  };

  // Função para obter o emoji do objetivo
  const getObjectiveEmoji = (objective) => {
    const objectives = {
      'OUTCOME_LEADS': '🎯',
      'OUTCOME_TRAFFIC': '🚦',
      'OUTCOME_ENGAGEMENT': '👥',
      'OUTCOME_AWARENESS': '📢',
      'OUTCOME_SALES': '💰',
      'CONVERSIONS': '🎯',
      'TRAFFIC': '🚦',
      'ENGAGEMENT': '👥',
      'BRAND_AWARENESS': '📢',
      'REACH': '📡',
      'MESSAGES': '💬',
      'VIDEO_VIEWS': '📹'
    };
    return objectives[objective?.toUpperCase()] || '📊';
  };

  // Função para formatar números grandes
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Função para formatar datas
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const statusColor = getStatusColor(campaign.status);
  const objectiveEmoji = getObjectiveEmoji(campaign.objective);
  const insights = campaign.insights;

  return (
    <div className="campaign-card">
      {/* Header do Card */}
      <div className="campaign-card-header">
        <div className="campaign-basic-info">
          <h3 className="campaign-name" title={campaign.name}>
            {objectiveEmoji} {campaign.name}
          </h3>
          <div className="campaign-meta">
            <span 
              className="campaign-status"
              style={{ 
                backgroundColor: statusColor.bg, 
                color: statusColor.text 
              }}
            >
              {campaign.status?.toLowerCase() === 'active' ? 'Ativa' : 
               campaign.status?.toLowerCase() === 'paused' ? 'Pausada' : 
               campaign.status?.toLowerCase() === 'archived' ? 'Arquivada' : campaign.status}
            </span>
            <span className="campaign-id">ID: {campaign.id}</span>
          </div>
        </div>
        
        <button 
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Recolher' : 'Expandir'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Métricas Principais */}
      {insights && (
        <div className="campaign-metrics">
          <div className="metrics-row">
            <div className="metric">
              <span className="metric-label">💰 Gasto</span>
              <span className="metric-value">{formatCurrency(insights.spend || 0)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">👁 Impressões</span>
              <span className="metric-value">{formatNumber(insights.impressions || 0)}</span>
            </div>
          </div>
          
          <div className="metrics-row">
            <div className="metric">
              <span className="metric-label">🖱 Cliques</span>
              <span className="metric-value">{formatNumber(insights.clicks || 0)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">🎯 CPM</span>
              <span className="metric-value">{formatCurrency(insights.cpm || 0)}</span>
            </div>
          </div>

          {insights.ctr > 0 && (
            <div className="metrics-row">
              <div className="metric">
                <span className="metric-label">📊 CTR</span>
                <span className="metric-value">{(insights.ctr || 0).toFixed(2)}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">💵 CPC</span>
                <span className="metric-value">{formatCurrency(insights.cpc || 0)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Informações Básicas quando não há insights */}
      {!insights && (
        <div className="campaign-no-insights">
          <p>📊 Sem dados de performance para o período selecionado</p>
          <div className="campaign-objective">
            <strong>Objetivo:</strong> {campaign.objective || 'N/A'}
          </div>
        </div>
      )}

      {/* Seção Expandida */}
      {isExpanded && (
        <div className="campaign-expanded">
          <div className="expanded-section">
            <h4>📋 Informações Gerais</h4>
            <div className="info-grid">
              <div className="info-item">
                <strong>Objetivo:</strong>
                <span>{campaign.objective || 'N/A'}</span>
              </div>
              <div className="info-item">
                <strong>Criada em:</strong>
                <span>{formatDate(campaign.created_time)}</span>
              </div>
              <div className="info-item">
                <strong>Atualizada em:</strong>
                <span>{formatDate(campaign.updated_time)}</span>
              </div>
              <div className="info-item">
                <strong>Data de Início:</strong>
                <span>{formatDate(campaign.start_time)}</span>
              </div>
            </div>
          </div>

          {/* Orçamentos */}
          <div className="expanded-section">
            <h4>💰 Orçamentos</h4>
            <div className="budget-grid">
              {campaign.daily_budget && (
                <div className="budget-item">
                  <strong>Orçamento Diário:</strong>
                  <span>{formatCurrency(campaign.daily_budget / 100)} {campaign.daily_budget_currency}</span>
                </div>
              )}
              {campaign.lifetime_budget && (
                <div className="budget-item">
                  <strong>Orçamento Total:</strong>
                  <span>{formatCurrency(campaign.lifetime_budget / 100)} {campaign.lifetime_budget_currency}</span>
                </div>
              )}
              {campaign.budget_remaining && (
                <div className="budget-item">
                  <strong>Orçamento Restante:</strong>
                  <span>{formatCurrency(campaign.budget_remaining / 100)} {campaign.budget_remaining_currency}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ações da Campanha */}
          {insights && insights.actions && insights.actions.length > 0 && (
            <div className="expanded-section">
              <h4>🎯 Ações/Conversões</h4>
              <div className="actions-list">
                {insights.actions.slice(0, 5).map((action, index) => (
                  <div key={index} className="action-item">
                    <span className="action-type">{action.action_type}:</span>
                    <span className="action-value">{action.value}</span>
                  </div>
                ))}
                {insights.actions.length > 5 && (
                  <div className="actions-more">
                    +{insights.actions.length - 5} mais ações...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Detalhada */}
          {insights && (
            <div className="expanded-section">
              <h4>📊 Performance Detalhada</h4>
              <div className="performance-grid">
                <div className="perf-item">
                  <strong>Alcance:</strong>
                  <span>{formatNumber(insights.reach || 0)}</span>
                </div>
                <div className="perf-item">
                  <strong>Frequência:</strong>
                  <span>{(insights.frequency || 0).toFixed(2)}</span>
                </div>
                <div className="perf-item">
                  <strong>Impressões:</strong>
                  <span>{formatNumber(insights.impressions || 0)}</span>
                </div>
                <div className="perf-item">
                  <strong>Cliques:</strong>
                  <span>{formatNumber(insights.clicks || 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="campaign-card-footer">
        <small className="campaign-timestamp">
          Atualizado em: {formatDate(campaign.updated_time)}
        </small>
        {campaign.stop_time && (
          <small className="campaign-end-date">
            Finaliza em: {formatDate(campaign.stop_time)}
          </small>
        )}
      </div>
    </div>
  );
};

export default CampaignCard;