import React, { useState, useEffect } from 'react';
import './MetaAdsTrafficFunnel.css';

const MetaAdsTrafficFunnel = ({ isDarkMode = true }) => {
  const [funnelData, setFunnelData] = useState({
    impressions: { value: 286418, formatted: '286 mil', change: '+53.2%' },
    reach: { value: 218707, formatted: '219 mil', change: '+47.3%' },
    clicks: { value: 1941, formatted: '1.941', change: '+32.0%' },
    leads: { value: 397, formatted: '397', change: '+62.7%' },
    conversions: { value: 198, formatted: '198', change: '+49.9%' },
    sales: { value: 9, formatted: '9', change: '+44.9%' }
  });

  const [metrics, setMetrics] = useState({
    ctr: '0.94%',
    frequency: '1.31',
    cpm: 'R$ 12,43'
  });

  const [campaigns, setCampaigns] = useState([
    {
      campaign: '[ENET] [FORM] [PME] - V3',
      adSet: 'PUB 1',
      ad: 'AD 5',
      leads: 122,
      lost: 45,
      open: 67,
      won: 10,
      roas: '3.2x'
    },
    {
      campaign: '[ENET] [FORM] [PME] - V3',
      adSet: 'PUB 2',
      ad: 'AD 3',
      leads: 156,
      lost: 78,
      open: 45,
      won: 33,
      roas: '4.1x'
    }
  ]);

  // Calcular taxas de conversão
  const conversionRates = {
    reachToClicks: ((funnelData.clicks.value / funnelData.reach.value) * 100).toFixed(1),
    clicksToLeads: ((funnelData.leads.value / funnelData.clicks.value) * 100).toFixed(1),
    leadsToConversions: ((funnelData.conversions.value / funnelData.leads.value) * 100).toFixed(1),
    conversionsToSales: ((funnelData.sales.value / funnelData.conversions.value) * 100).toFixed(1)
  };

  return (
    <div className="meta-ads-traffic-funnel">
      {/* Header */}
      <div className="funnel-header">
        <div className="funnel-title-section">
          <div className="funnel-icon">📊</div>
          <div className="funnel-title-content">
            <h2 className="funnel-title">Funil de Tráfego & Performance</h2>
            <p className="funnel-subtitle">Análise completa de conversão e custos</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="funnel-main-grid">
        {/* Left: Traffic Funnel */}
        <div className="traffic-funnel-container">
          <div className="funnel-section-header">
            <h3 className="funnel-section-title">🔄 Funil de Tráfego</h3>
            <button className="refresh-btn">🔄</button>
          </div>
          
          <div className="funnel-stages">
            {/* Impressões */}
            <div className="funnel-stage">
              <div className="funnel-bar">
                <div className="funnel-content">
                  <span className="funnel-label">Impressões</span>
                  <div className="funnel-values">
                    <span className="funnel-value">{funnelData.impressions.formatted}</span>
                    <span className="funnel-change positive">{funnelData.impressions.change}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alcance */}
            <div className="funnel-stage">
              <div className="funnel-bar">
                <div className="funnel-content">
                  <span className="funnel-label">Alcance</span>
                  <div className="funnel-values">
                    <span className="funnel-value">{funnelData.reach.formatted}</span>
                    <span className="funnel-change positive">{funnelData.reach.change}</span>
                  </div>
                </div>
              </div>
              <div className="conversion-rate">
                <span className="conversion-text">{conversionRates.reachToClicks}%</span>
              </div>
            </div>

            {/* Cliques */}
            <div className="funnel-stage">
              <div className="funnel-bar">
                <div className="funnel-content">
                  <span className="funnel-label">Cliques</span>
                  <div className="funnel-values">
                    <span className="funnel-value">{funnelData.clicks.formatted}</span>
                    <span className="funnel-change positive">{funnelData.clicks.change}</span>
                  </div>
                </div>
              </div>
              <div className="conversion-rate">
                <span className="conversion-text">{conversionRates.clicksToLeads}%</span>
              </div>
            </div>

            {/* Leads */}
            <div className="funnel-stage">
              <div className="funnel-bar">
                <div className="funnel-content">
                  <span className="funnel-label">Lead</span>
                  <div className="funnel-values">
                    <span className="funnel-value">{funnelData.leads.formatted}</span>
                    <span className="funnel-change positive">{funnelData.leads.change}</span>
                  </div>
                </div>
              </div>
              <div className="conversion-rate">
                <span className="conversion-text">{conversionRates.leadsToConversions}%</span>
              </div>
            </div>

            {/* Conversões */}
            <div className="funnel-stage">
              <div className="funnel-bar">
                <div className="funnel-content">
                  <span className="funnel-label">Conversões</span>
                  <div className="funnel-values">
                    <span className="funnel-value">{funnelData.conversions.formatted}</span>
                    <span className="funnel-change positive">{funnelData.conversions.change}</span>
                  </div>
                </div>
              </div>
              <div className="conversion-rate">
                <span className="conversion-text">{conversionRates.conversionsToSales}%</span>
              </div>
            </div>

            {/* Vendas */}
            <div className="funnel-stage">
              <div className="funnel-bar">
                <div className="funnel-content">
                  <span className="funnel-label">Vendas</span>
                  <div className="funnel-values">
                    <span className="funnel-value">{funnelData.sales.formatted}</span>
                    <span className="funnel-change positive">{funnelData.sales.change}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas Adicionais */}
          <div className="funnel-metrics">
            <div className="metric-item">
              <span className="metric-label">CTR</span>
              <span className="metric-value">{metrics.ctr}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Frequência</span>
              <span className="metric-value">{metrics.frequency}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">CPM</span>
              <span className="metric-value">{metrics.cpm}</span>
            </div>
          </div>
        </div>

        {/* Right: Performance Cards */}
        <div className="performance-cards-container">
          <div className="performance-cards-grid">
            {/* Performance Card 1 */}
            <div className="performance-card">
              <div className="card-header">
                <h4 className="card-title">📊 Performance</h4>
                <div className="card-icon">📈</div>
              </div>
              <div className="card-content">
                <div className="performance-metric">
                  <span className="metric-label">ROAS</span>
                  <span className="metric-value">3.2x</span>
                </div>
                <div className="performance-metric">
                  <span className="metric-label">ROI</span>
                  <span className="metric-value">+220%</span>
                </div>
              </div>
            </div>

            {/* Performance Card 2 */}
            <div className="performance-card">
              <div className="card-header">
                <h4 className="card-title">💰 Custos</h4>
                <div className="card-icon">💸</div>
              </div>
              <div className="card-content">
                <div className="performance-metric">
                  <span className="metric-label">CPL</span>
                  <span className="metric-value">R$ 8,97</span>
                </div>
                <div className="performance-metric">
                  <span className="metric-label">CPA</span>
                  <span className="metric-value">R$ 395,68</span>
                </div>
              </div>
            </div>

            {/* Performance Card 3 */}
            <div className="performance-card">
              <div className="card-header">
                <h4 className="card-title">🎯 Conversão</h4>
                <div className="card-icon">✅</div>
              </div>
              <div className="card-content">
                <div className="performance-metric">
                  <span className="metric-label">Taxa Conv.</span>
                  <span className="metric-value">20.5%</span>
                </div>
                <div className="performance-metric">
                  <span className="metric-label">Taxa Venda</span>
                  <span className="metric-value">4.5%</span>
                </div>
              </div>
            </div>

            {/* Performance Card 4 */}
            <div className="performance-card">
              <div className="card-header">
                <h4 className="card-title">📈 Crescimento</h4>
                <div className="card-icon">📊</div>
              </div>
              <div className="card-content">
                <div className="performance-metric">
                  <span className="metric-label">vs. Mês Anterior</span>
                  <span className="metric-value positive">+47.3%</span>
                </div>
                <div className="performance-metric">
                  <span className="metric-label">vs. Semana Anterior</span>
                  <span className="metric-value positive">+12.8%</span>
                </div>
              </div>
            </div>

            {/* Performance Card 5 */}
            <div className="performance-card">
              <div className="card-header">
                <h4 className="card-title">⏱️ Tempo</h4>
                <div className="card-icon">🕐</div>
              </div>
              <div className="card-content">
                <div className="performance-metric">
                  <span className="metric-label">Tempo Médio</span>
                  <span className="metric-value">2.3 dias</span>
                </div>
                <div className="performance-metric">
                  <span className="metric-label">Velocidade</span>
                  <span className="metric-value">Rápida</span>
                </div>
              </div>
            </div>

            {/* Performance Card 6 */}
            <div className="performance-card">
              <div className="card-header">
                <h4 className="card-title">🎨 Qualidade</h4>
                <div className="card-icon">⭐</div>
              </div>
              <div className="card-content">
                <div className="performance-metric">
                  <span className="metric-label">Score</span>
                  <span className="metric-value">8.7/10</span>
                </div>
                <div className="performance-metric">
                  <span className="metric-label">Status</span>
                  <span className="metric-value positive">Excelente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="campaigns-section">
        <h3 className="campaigns-title">📋 Campanhas e Performance</h3>
        <div className="campaigns-table">
          <div className="table-header">
            <div className="header-cell">Campanhas</div>
            <div className="header-cell">Conjuntos</div>
            <div className="header-cell">Anúncios</div>
            <div className="header-cell">Leads</div>
            <div className="header-cell">Perdas</div>
            <div className="header-cell">Aberto</div>
            <div className="header-cell">Ganho</div>
            <div className="header-cell">ROAS</div>
          </div>
          {campaigns.map((campaign, index) => (
            <div key={index} className="table-row">
              <div className="table-cell">{campaign.campaign}</div>
              <div className="table-cell">{campaign.adSet}</div>
              <div className="table-cell">{campaign.ad}</div>
              <div className="table-cell">{campaign.leads}</div>
              <div className="table-cell">{campaign.lost}</div>
              <div className="table-cell">{campaign.open}</div>
              <div className="table-cell">{campaign.won}</div>
              <div className="table-cell">{campaign.roas}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetaAdsTrafficFunnel;
