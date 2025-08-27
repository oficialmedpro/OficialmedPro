import React from 'react';
import PerformanceThermometer from './PerformanceThermometer';
import { useCountUp } from '../hooks/useCountUp';

const StatsSection = ({ statsCards }) => {
  return (
    <section className="stats-section">
      <div className="stats-grid">
        {statsCards.map((card, index) => (
          <div key={index} className={`stat-card ${card.color}`}>
            {/* Header com título e métricas */}
            <div className="stat-header-new">
              <div className="header-content">
                <span className="stat-title">{card.title}</span>
                <div className="header-metrics">
                  <div className="stat-value">
                    {(() => {
                      const count = useCountUp(parseInt(card.value.replace(/,/g, '')), 1500);
                      if (card.isCurrency) {
                        return `R$ ${count.toLocaleString()}`;
                      } else {
                        return count.toLocaleString();
                      }
                    })()}
                  </div>
                  {(card.isOpportunity || card.isCurrency) && (
                    <div className="opportunity-value">
                      {card.opportunityValue}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Termômetro grande no centro */}
            <div className="stat-thermometer-center">
              <PerformanceThermometer 
                currentValue={card.value}
                previousValue={card.previousValue}
                change={card.change}
                isPositive={card.isPositive}
                color={card.color}
              />
            </div>
            
            {/* Meta na parte inferior */}
            <div className="stat-meta">
              <div className="meta-info">
                <span className="meta-label">META</span>
                <span className="meta-value">
                  {card.isCurrency ? `R$ ${parseInt(card.meta).toLocaleString()}` : card.meta}
                </span>
              </div>
              <div className="meta-percentage">
                {card.metaPercentage}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
