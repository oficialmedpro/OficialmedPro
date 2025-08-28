import React from 'react';
import './MetaAdsStats.css';

const MetaAdsStats = ({ stats, isLoading, formatCurrency }) => {
  if (isLoading || !stats) {
    return (
      <div className="meta-ads-stats">
        <div className="stats-loading">
          <div className="stats-loading-spinner"></div>
          <p>Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  const {
    totalLeads,
    totalLeadsAjustado,
    gastoTotal,
    custoMedioPorLead,
    custoMedioPorLeadAjustado,
    dadosAnuncios
  } = stats;

  return (
    <div className="meta-ads-stats">
      <div className="stats-header">
        <h2>📊 Estatísticas do Período</h2>
        <div className="stats-info">
          <small>{dadosAnuncios.filtrados} de {dadosAnuncios.total} campanhas analisadas</small>
        </div>
      </div>

      <div className="stats-grid">
        {/* Gasto Total */}
        <div className="stat-card primary">
          <div className="stat-header">
            <div className="stat-icon">💰</div>
            <div className="stat-title">Gasto Total</div>
          </div>
          <div className="stat-value">{formatCurrency(gastoTotal)}</div>
          <div className="stat-description">Investimento total em anúncios</div>
        </div>

        {/* Total de Leads */}
        <div className="stat-card success">
          <div className="stat-header">
            <div className="stat-icon">🎯</div>
            <div className="stat-title">Leads Gerados</div>
          </div>
          <div className="stat-value">{totalLeads.toLocaleString()}</div>
          <div className="stat-description">Conversações iniciadas</div>
        </div>

        {/* Leads Ajustados */}
        <div className="stat-card warning">
          <div className="stat-header">
            <div className="stat-icon">📊</div>
            <div className="stat-title">Leads Qualificados</div>
          </div>
          <div className="stat-value">{totalLeadsAjustado.toLocaleString()}</div>
          <div className="stat-description">Leads ajustados (-30%)</div>
        </div>

        {/* Custo por Lead */}
        <div className="stat-card info">
          <div className="stat-header">
            <div className="stat-icon">💵</div>
            <div className="stat-title">Custo por Lead</div>
          </div>
          <div className="stat-value">{formatCurrency(custoMedioPorLead)}</div>
          <div className="stat-description">Custo médio bruto</div>
        </div>

        {/* Custo por Lead Ajustado */}
        <div className="stat-card secondary">
          <div className="stat-header">
            <div className="stat-icon">🎯</div>
            <div className="stat-title">CPL Qualificado</div>
          </div>
          <div className="stat-value">{formatCurrency(custoMedioPorLeadAjustado)}</div>
          <div className="stat-description">Custo por lead ajustado</div>
        </div>

        {/* Performance Summary */}
        <div className="stat-card summary">
          <div className="stat-header">
            <div className="stat-icon">📈</div>
            <div className="stat-title">Performance</div>
          </div>
          <div className="performance-metrics">
            <div className="perf-metric">
              <span className="perf-label">Taxa de Qualificação:</span>
              <span className="perf-value">70%</span>
            </div>
            <div className="perf-metric">
              <span className="perf-label">Campanhas Ativas:</span>
              <span className="perf-value">{dadosAnuncios.filtrados}</span>
            </div>
            <div className="perf-metric">
              <span className="perf-label">Eficiência:</span>
              <span className="perf-value">
                {totalLeads > 0 ? 'Boa' : 'Sem dados'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-summary">
        <div className="summary-card">
          <h3>💡 Insights</h3>
          <ul>
            {gastoTotal > 0 && totalLeads > 0 && (
              <li>Cada R$ 1.000 investidos geraram {Math.round((totalLeads / gastoTotal) * 1000)} leads</li>
            )}
            {totalLeads > totalLeadsAjustado && (
              <li>Aplicamos desconto de 30% para leads mais qualificados</li>
            )}
            {dadosAnuncios.filtrados < dadosAnuncios.total && (
              <li>{dadosAnuncios.total - dadosAnuncios.filtrados} campanhas não tiveram dados no período</li>
            )}
            {custoMedioPorLead > 0 && custoMedioPorLeadAjustado > 0 && (
              <li>O ajuste aumentou o CPL em {formatCurrency(custoMedioPorLeadAjustado - custoMedioPorLead)}</li>
            )}
          </ul>
        </div>

        <div className="summary-card">
          <h3>🎯 Recomendações</h3>
          <ul>
            {custoMedioPorLead > 50 && <li>CPL alto - considere otimizar segmentação</li>}
            {totalLeads === 0 && <li>Sem leads no período - revisar campanhas</li>}
            {dadosAnuncios.filtrados === 0 && <li>Nenhuma campanha ativa encontrada</li>}
            {gastoTotal > 10000 && totalLeads < 100 && <li>Alto investimento com poucos leads - revisar estratégia</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MetaAdsStats;