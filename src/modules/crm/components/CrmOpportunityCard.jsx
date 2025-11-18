/**
 * Componente de Card de Oportunidade
 * 
 * Exibe informações de uma oportunidade em formato de card
 */

import React from 'react';
import './CrmOpportunityCard.css';
import { formatCurrency, formatDate } from '../utils/crmHelpers';

const CrmOpportunityCard = ({ opportunity, onClick }) => {
  const getStageColor = (stage) => {
    const colors = {
      'prospeccao': '#3498db',
      'qualificacao': '#9b59b6',
      'proposta': '#f39c12',
      'negociacao': '#e67e22',
      'fechado': '#27ae60',
      'perdido': '#e74c3c'
    };
    return colors[stage] || '#95a5a6';
  };

  return (
    <div
      className="CrmOpportunityCard"
      onClick={onClick}
      style={{ borderLeftColor: getStageColor(opportunity.stage) }}
    >
      <div className="CrmOpportunityCard-header">
        <h3 className="CrmOpportunityCard-title">{opportunity.title}</h3>
        <span
          className="CrmOpportunityCard-stage"
          style={{ backgroundColor: getStageColor(opportunity.stage) }}
        >
          {opportunity.stage}
        </span>
      </div>

      <div className="CrmOpportunityCard-body">
        {opportunity.value && (
          <p className="CrmOpportunityCard-value">
            {formatCurrency(opportunity.value)}
          </p>
        )}
        {opportunity.contact_name && (
          <p className="CrmOpportunityCard-contact">
            👤 {opportunity.contact_name}
          </p>
        )}
        {opportunity.created_at && (
          <p className="CrmOpportunityCard-date">
            📅 {formatDate(opportunity.created_at)}
          </p>
        )}
      </div>
    </div>
  );
};

export default CrmOpportunityCard;



