import React from 'react';
import './GoogleAdsMetricsCards.css';

const GoogleAdsMetricsCards = ({ 
  isDarkMode, 
  formatCurrency, 
  googleAdsData 
}) => {
  return (
    <div className="google-ads-metrics-cards">
      {/* Card 1: Saldo da Conta */}
      <div className="google-ads-metric-card">
        <div className="google-ads-metric-header">
          <div className="google-ads-metric-icon">💰</div>
          <div className="google-ads-metric-title">Saldo da Conta</div>
        </div>
        <div className="google-ads-metric-value">
          {formatCurrency ? formatCurrency(googleAdsData.balance) : `R$ ${googleAdsData.balance.toLocaleString('pt-BR')}`}
        </div>
        <div className="google-ads-metric-change positive">
          {googleAdsData.balanceChange}
        </div>
      </div>

      {/* Card 2: Campanhas */}
      <div className="google-ads-metric-card">
        <div className="google-ads-metric-header">
          <div className="google-ads-metric-icon">📊</div>
          <div className="google-ads-metric-title">Campanhas</div>
        </div>
        <div className="google-ads-metric-value">
          {googleAdsData.activeCampaigns}/{googleAdsData.campaigns}
        </div>
        <div className="google-ads-metric-subtitle">
          {googleAdsData.activeCampaigns} ativas
        </div>
      </div>

      {/* Card 3: Grupos de Anúncios */}
      <div className="google-ads-metric-card">
        <div className="google-ads-metric-header">
          <div className="google-ads-metric-icon">🎯</div>
          <div className="google-ads-metric-title">Grupos de Anúncios</div>
        </div>
        <div className="google-ads-metric-value">
          {googleAdsData.activeAdGroups}/{googleAdsData.adGroups}
        </div>
        <div className="google-ads-metric-subtitle">
          {googleAdsData.activeAdGroups} ativos
        </div>
      </div>

      {/* Card 4: Anúncios */}
      <div className="google-ads-metric-card">
        <div className="google-ads-metric-header">
          <div className="google-ads-metric-icon">📢</div>
          <div className="google-ads-metric-title">Anúncios</div>
        </div>
        <div className="google-ads-metric-value">
          {googleAdsData.activeAds}/{googleAdsData.ads}
        </div>
        <div className="google-ads-metric-subtitle">
          {googleAdsData.activeAds} ativos
        </div>
      </div>
    </div>
  );
};

export default GoogleAdsMetricsCards;
