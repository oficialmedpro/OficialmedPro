import React from 'react';
import './MetricsCards.css';
import OpportunitySources from './OpportunitySources';
import LossReasons from './LossReasons';
import TicketRanking from './TicketRanking';
import SellerRanking from './SellerRanking';

const MetricsCards = ({ formatCurrency, t }) => {
  return (
    <div className="metrics-cards-container">
      <div className="metrics-cards-grid">
        {/* Card 1: Origens das Oportunidades */}
        <OpportunitySources formatCurrency={formatCurrency} t={t} />

        {/* Card 2: Principais motivos de loss */}
        <LossReasons formatCurrency={formatCurrency} t={t} />

        {/* Card 3: Ranking por ticket maior */}
        <TicketRanking formatCurrency={formatCurrency} t={t} />

        {/* Card 4: Ranking de vendedores (componente separado com paginação) */}
        <SellerRanking formatCurrency={formatCurrency} t={t} />
      </div>
    </div>
  );
};

export default MetricsCards;
