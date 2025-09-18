import React from 'react';
import './MetricsCards.css';
import OpportunitySources from './OpportunitySources';
import LossReasonsHeader from './LossReasonsHeader';
import TicketRankingCard from './TicketRankingCard';
import SellerRanking from './SellerRanking';
import SellerRankingReal from './SellerRankingReal';

const MetricsCards = ({ 
  formatCurrency, 
  t, 
  startDate, 
  endDate, 
  selectedFunnel, 
  selectedUnit, 
  selectedSeller, 
  selectedOrigin 
}) => {
  return (
    <div className="metrics-cards-container">
      <div className="metrics-cards-grid">
        {/* Card 1: Principais motivos de perda */}
        <LossReasonsHeader 
          formatCurrency={formatCurrency} 
          t={t}
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={selectedSeller}
          selectedOrigin={selectedOrigin}
        />

        {/* Card 2: Origens das Oportunidades */}
        <OpportunitySources formatCurrency={formatCurrency} t={t} />

        {/* Card 3: Ranking por ticket maior */}
        <TicketRankingCard
          formatCurrency={formatCurrency}
          t={t}
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={selectedSeller}
          selectedOrigin={selectedOrigin}
        />

        {/* Card 4: Ranking de vendedores (componente separado com paginação) */}
        <SellerRankingReal 
          formatCurrency={formatCurrency} 
          t={t}
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={selectedSeller}
          selectedOrigin={selectedOrigin}
        />
      </div>
    </div>
  );
};

export default MetricsCards;
