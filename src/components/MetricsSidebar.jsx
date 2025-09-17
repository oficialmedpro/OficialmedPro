import React from 'react';
import './MetricsSidebar.css';
import GoogleInvestimentoCard from './GoogleInvestimentoCard';
import MetaInvestimentoCard from './MetaInvestimentoCard';

const MetricsSidebar = ({ formatCurrency, t, selectedPeriod, startDate, endDate, selectedUnit, selectedFunnel, selectedSeller }) => {
  return (
    <div className="ms-users-sidebar">
      <div className="ms-users-header">
        <h3>{t.financialMetrics}</h3>
      </div>
      
      <div className="ms-financial-metrics-new">
        {/* Google Metrics Card (dados reais Supabase) */}
        <GoogleInvestimentoCard 
          t={t}
          formatCurrency={formatCurrency}
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={selectedSeller}
        />
        
        {/* Meta Metrics Card - DADOS REAIS DA UNIDADE SELECIONADA */}
        <MetaInvestimentoCard 
          t={t}
          formatCurrency={formatCurrency}
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={selectedSeller}
        />
      </div>
    </div>
  );
};

export default MetricsSidebar;