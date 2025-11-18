/**
 * Hook customizado para gerenciar oportunidades do Flow
 * 
 * Fornece estado e funções para trabalhar com oportunidades nas esteiras
 */

import { useState, useEffect } from 'react';
import flowService from '../services/flowService';

/**
 * Hook para gerenciar oportunidades de uma esteira específica
 * @param {string} esteira - Nome da esteira
 * @param {Object} filters - Filtros iniciais
 * @returns {Object} Estado e funções para gerenciar oportunidades
 */
export const useFlowOpportunities = (esteira, filters = {}) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar oportunidades
  const loadOpportunities = async (newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await flowService.listOpportunitiesByEsteira(esteira, newFilters);
      setOpportunities(data);
    } catch (err) {
      setError(err.message);
      console.error('[useFlowOpportunities] Erro ao carregar oportunidades:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar oportunidades ao montar o componente ou quando esteira mudar
  useEffect(() => {
    if (esteira) {
      loadOpportunities();
    }
  }, [esteira]);

  // Criar nova oportunidade
  const createOpportunity = async (opportunityData) => {
    try {
      const newOpportunity = await flowService.createOpportunity({
        ...opportunityData,
        esteira: esteira
      });
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
      const updated = await flowService.updateOpportunity(id, updates);
      setOpportunities(prev =>
        prev.map(opp => (opp.id === id ? updated : opp))
      );
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Mover oportunidade para outra esteira
  const moveToEsteira = async (id, newEsteira, newEtapa = null) => {
    try {
      const moved = await flowService.moveToEsteira(id, newEsteira, newEtapa);
      // Remover da lista atual (foi movida para outra esteira)
      setOpportunities(prev => prev.filter(opp => opp.id !== id));
      return moved;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Incrementar tentativas
  const incrementTentativas = async (id) => {
    try {
      const updated = await flowService.incrementTentativas(id);
      setOpportunities(prev =>
        prev.map(opp => (opp.id === id ? updated : opp))
      );
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Processar venda (mover para laboratório -> logística -> monitoramento)
  const processVenda = async (id) => {
    try {
      const result = await flowService.processVenda(id);
      // Remover da lista atual
      setOpportunities(prev => prev.filter(opp => opp.id !== id));
      return result;
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
    moveToEsteira,
    incrementTentativas,
    processVenda
  };
};


