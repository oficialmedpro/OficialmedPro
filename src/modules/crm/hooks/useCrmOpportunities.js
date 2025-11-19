/**
 * Hook customizado para gerenciar oportunidades do CRM
 * 
 * Fornece estado e funções para trabalhar com oportunidades
 */

import { useState, useEffect } from 'react';
import crmOpportunityService from '../services/crmOpportunityService';

/**
 * Hook para gerenciar oportunidades
 * @param {Object} filters - Filtros iniciais
 * @returns {Object} Estado e funções para gerenciar oportunidades
 */
export const useCrmOpportunities = (filters = {}) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar oportunidades
  const loadOpportunities = async (newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await crmOpportunityService.listOpportunities(newFilters);
      setOpportunities(data);
    } catch (err) {
      setError(err.message);
      console.error('[useCrmOpportunities] Erro ao carregar oportunidades:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar oportunidades ao montar o componente
  useEffect(() => {
    loadOpportunities();
  }, []);

  // Criar nova oportunidade
  const createOpportunity = async (opportunityData) => {
    try {
      const newOpportunity = await crmOpportunityService.createOpportunity(opportunityData);
      setOpportunities(prev => [newOpportunity, ...prev]);
      return newOpportunity;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Atualizar oportunidade
  const updateOpportunity = async (id, updates) => {
    try {
      const updated = await crmOpportunityService.updateOpportunity(id, updates);
      setOpportunities(prev =>
        prev.map(opp => (opp.id === id ? updated : opp))
      );
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Mover oportunidade para novo estágio
  const moveOpportunityStage = async (id, newStage) => {
    try {
      const updated = await crmOpportunityService.moveOpportunityStage(id, newStage);
      setOpportunities(prev =>
        prev.map(opp => (opp.id === id ? updated : opp))
      );
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Deletar oportunidade
  const deleteOpportunity = async (id) => {
    try {
      await crmOpportunityService.deleteOpportunity(id);
      setOpportunities(prev => prev.filter(opp => opp.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    opportunities,
    loading,
    error,
    loadOpportunities,
    createOpportunity,
    updateOpportunity,
    moveOpportunityStage,
    deleteOpportunity
  };
};




