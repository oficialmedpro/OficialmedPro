import React from 'react';
import './GoogleAdsFunnelCards.css';

const GoogleAdsFunnelCards = ({ children, isDarkMode }) => {
  return (
    <div className={`google-ads-funnel-cards ${isDarkMode ? 'dark-mode' : ''}`}>
      {children}
    </div>
  );
};

export default GoogleAdsFunnelCards;
