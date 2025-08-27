import React from 'react';

const HeaderComponents = ({ marketData }) => {
  return (
    <div className="header-left-inline">
      <div className="indicator">
        <span className="indicator-label">USD:</span>
        <span className="indicator-value">R$ {marketData.usd}</span>
        <span className={`indicator-change ${marketData.usd > 5.20 ? 'positive' : 'negative'}`}>
          {marketData.usd > 5.20 ? '↗' : '↘'}
        </span>
      </div>
      
      <div className="indicator">
        <span className="indicator-label">EUR:</span>
        <span className="indicator-value">R$ {marketData.eur}</span>
        <span className={`indicator-change ${marketData.eur > 5.50 ? 'positive' : 'negative'}`}>
          {marketData.eur > 5.50 ? '↗' : '↘'}
        </span>
      </div>
      
      <div className="indicator">
        <span className="indicator-label">IBOV:</span>
        <span className="indicator-value">{marketData.ibov.toLocaleString()}</span>
        <span className={`indicator-change ${marketData.ibov > 125000 ? 'positive' : 'negative'}`}>
          {marketData.ibov > 125000 ? '↗' : '↘'}
        </span>
      </div>

      <div className="datetime-box">
        <div className="date-box">
          <span className="datetime-label">📅</span>
          <span className="datetime-value">
            {new Date().toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit'
            })}
          </span>
        </div>
        
        <div className="time-box">
          <span className="datetime-label">🕐</span>
          <span className="datetime-value" id="current-time">
            {new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeaderComponents;
