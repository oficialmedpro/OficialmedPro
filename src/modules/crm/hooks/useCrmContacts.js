/**
 * Hook customizado para gerenciar contatos do CRM
 * 
 * Fornece estado e funções para trabalhar com contatos
 */

import { useState, useEffect } from 'react';
import crmContactService from '../services/crmContactService';

/**
 * Hook para gerenciar contatos
 * @param {Object} filters - Filtros iniciais
 * @returns {Object} Estado e funções para gerenciar contatos
 */
export const useCrmContacts = (filters = {}) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar contatos
  const loadContacts = async (newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await crmContactService.listContacts(newFilters);
      setContacts(data);
    } catch (err) {
      setError(err.message);
      console.error('[useCrmContacts] Erro ao carregar contatos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar contatos ao montar o componente
  useEffect(() => {
    loadContacts();
  }, []);

  // Criar novo contato
  const createContact = async (contactData) => {
    try {
      const newContact = await crmContactService.createContact(contactData);
      setContacts(prev => [newContact, ...prev]);
      return newContact;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Atualizar contato
  const updateContact = async (id, updates) => {
    try {
      const updated = await crmContactService.updateContact(id, updates);
      setContacts(prev =>
        prev.map(contact => (contact.id === id ? updated : contact))
      );
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Deletar contato
  const deleteContact = async (id) => {
    try {
      await crmContactService.deleteContact(id);
      setContacts(prev => prev.filter(contact => contact.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    contacts,
    loading,
    error,
    loadContacts,
    createContact,
    updateContact,
    deleteContact
  };
};




