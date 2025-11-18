/**
 * Página Principal do CRM Dashboard
 * 
 * Exibe visão geral do CRM com métricas principais,
 * gráficos e acesso rápido às funcionalidades.
 */

import React from 'react';
import './CrmDashboardPage.css';

const CrmDashboardPage = () => {
  return (
    <div className="CrmDashboardPage">
      <div className="CrmDashboardPage-header">
        <h1 className="CrmDashboardPage-title">CRM Dashboard</h1>
        <p className="CrmDashboardPage-subtitle">
          Visão geral do seu relacionamento com clientes
        </p>
      </div>

      <div className="CrmDashboardPage-content">
        <div className="CrmDashboardPage-grid">
          {/* Cards de métricas principais */}
          <div className="CrmDashboardPage-card">
            <h3 className="CrmDashboardPage-card-title">Total de Contatos</h3>
            <p className="CrmDashboardPage-card-value">0</p>
          </div>

          <div className="CrmDashboardPage-card">
            <h3 className="CrmDashboardPage-card-title">Oportunidades Ativas</h3>
            <p className="CrmDashboardPage-card-value">0</p>
          </div>

          <div className="CrmDashboardPage-card">
            <h3 className="CrmDashboardPage-card-title">Taxa de Conversão</h3>
            <p className="CrmDashboardPage-card-value">0%</p>
          </div>

          <div className="CrmDashboardPage-card">
            <h3 className="CrmDashboardPage-card-title">Receita do Mês</h3>
            <p className="CrmDashboardPage-card-value">R$ 0,00</p>
          </div>
        </div>

        {/* Área de conteúdo adicional */}
        <div className="CrmDashboardPage-sections">
          <section className="CrmDashboardPage-section">
            <h2 className="CrmDashboardPage-section-title">Ações Rápidas</h2>
            <div className="CrmDashboardPage-actions">
              <button className="CrmDashboardPage-action-btn">
                ➕ Novo Contato
              </button>
              <button className="CrmDashboardPage-action-btn">
                💼 Nova Oportunidade
              </button>
              <button className="CrmDashboardPage-action-btn">
                📊 Ver Relatórios
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CrmDashboardPage;



