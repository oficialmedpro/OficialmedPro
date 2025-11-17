/**
 * Componente de Lista de Contatos
 * 
 * Exibe uma lista de contatos do CRM com opções de ação
 */

import React from 'react';
import './CrmContactList.css';

const CrmContactList = ({ contacts = [], onEdit, onDelete, loading = false }) => {
  if (loading) {
    return (
      <div className="CrmContactList">
        <p className="CrmContactList-loading">Carregando contatos...</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="CrmContactList">
        <p className="CrmContactList-empty">Nenhum contato encontrado.</p>
      </div>
    );
  }

  return (
    <div className="CrmContactList">
      <div className="CrmContactList-grid">
        {contacts.map(contact => (
          <div key={contact.id} className="CrmContactList-item">
            <div className="CrmContactList-item-header">
              <h3 className="CrmContactList-item-name">{contact.name}</h3>
              <div className="CrmContactList-item-actions">
                {onEdit && (
                  <button
                    className="CrmContactList-action-btn CrmContactList-edit-btn"
                    onClick={() => onEdit(contact)}
                  >
                    ✏️
                  </button>
                )}
                {onDelete && (
                  <button
                    className="CrmContactList-action-btn CrmContactList-delete-btn"
                    onClick={() => onDelete(contact.id)}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
            <div className="CrmContactList-item-body">
              {contact.email && (
                <p className="CrmContactList-item-email">📧 {contact.email}</p>
              )}
              {contact.phone && (
                <p className="CrmContactList-item-phone">📞 {contact.phone}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CrmContactList;


