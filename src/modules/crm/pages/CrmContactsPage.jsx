/**
 * Página de Gerenciamento de Contatos
 * 
 * Lista, busca e gerencia todos os contatos do CRM
 */

import React from 'react';
import './CrmContactsPage.css';

const CrmContactsPage = () => {
  return (
    <div className="CrmContactsPage">
      <div className="CrmContactsPage-header">
        <h1 className="CrmContactsPage-title">Contatos</h1>
        <button className="CrmContactsPage-add-btn">
          ➕ Novo Contato
        </button>
      </div>

      <div className="CrmContactsPage-content">
        <div className="CrmContactsPage-filters">
          <input
            type="text"
            placeholder="Buscar contatos..."
            className="CrmContactsPage-search"
          />
        </div>

        <div className="CrmContactsPage-list">
          <p className="CrmContactsPage-empty">
            Nenhum contato encontrado. Comece adicionando seu primeiro contato!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CrmContactsPage;




