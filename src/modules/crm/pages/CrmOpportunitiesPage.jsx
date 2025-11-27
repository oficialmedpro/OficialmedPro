/**
 * Página de Gerenciamento de Oportunidades
 * 
 * Visualiza e gerencia o pipeline de vendas e oportunidades
 */

import React from 'react';
import './CrmOpportunitiesPage.css';

const CrmOpportunitiesPage = () => {
  return (
    <div className="CrmOpportunitiesPage">
      <div className="CrmOpportunitiesPage-header">
        <h1 className="CrmOpportunitiesPage-title">Oportunidades</h1>
        <button className="CrmOpportunitiesPage-add-btn">
          💼 Nova Oportunidade
        </button>
      </div>

      <div className="CrmOpportunitiesPage-content">
        <div className="CrmOpportunitiesPage-pipeline">
          <p className="CrmOpportunitiesPage-empty">
            Pipeline de oportunidades será exibido aqui.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CrmOpportunitiesPage;





