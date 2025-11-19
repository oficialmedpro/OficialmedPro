/**
 * Página de Relatórios do CRM
 * 
 * Exibe relatórios e análises do CRM
 */

import React from 'react';
import './CrmReportsPage.css';

const CrmReportsPage = () => {
  return (
    <div className="CrmReportsPage">
      <div className="CrmReportsPage-header">
        <h1 className="CrmReportsPage-title">Relatórios CRM</h1>
      </div>

      <div className="CrmReportsPage-content">
        <div className="CrmReportsPage-reports">
          <p className="CrmReportsPage-empty">
            Relatórios e análises serão exibidos aqui.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CrmReportsPage;




