import React from 'react';
import './MetaAdsMetricsCards.css';

const MetaAdsMetricsCards = ({ 
  isDarkMode = true, 
  formatCurrency,
  metaData = {
    balance: 0,
    balanceChange: '+0.0%',
    campaigns: 0,
    activeCampaigns: 0,
    adSets: 0,
    activeAdSets: 0,
    ads: 0,
    activeAds: 0
  }
}) => {
  return (
    <div className="meta-ads-metrics-cards">
      <div className="meta-ads-metrics-cards-content">
        <div className="meta-metric-card">
          <div className="meta-metric-label">💰 Saldo Atual</div>
          <div className="meta-metric-value">
            {formatCurrency ? formatCurrency(metaData.balance) : `R$ ${metaData.balance.toLocaleString('pt-BR')}`}
          </div>
          <div className={`meta-metric-change ${metaData.balanceChange.startsWith('+') ? 'positive' : 'negative'}`}>
            {metaData.balanceChange}
          </div>
        </div>
        
        <div className="meta-metric-card">
          <div className="meta-metric-label">📊 Campanhas</div>
          <div className="meta-metric-value">{metaData.campaigns}</div>
          <div className="meta-metric-status active">{metaData.activeCampaigns} Ativas</div>
        </div>
        
        <div className="meta-metric-card">
          <div className="meta-metric-label">🎯 Conjuntos</div>
          <div className="meta-metric-value">{metaData.adSets}</div>
          <div className="meta-metric-status active">{metaData.activeAdSets} Ativos</div>
        </div>
        
        <div className="meta-metric-card">
          <div className="meta-metric-label">🖼️ Anúncios</div>
          <div className="meta-metric-value">{metaData.ads}</div>
          <div className="meta-metric-status active">{metaData.activeAds} Ativos</div>
        </div>
      </div>
    </div>
  );
};

export default MetaAdsMetricsCards;
