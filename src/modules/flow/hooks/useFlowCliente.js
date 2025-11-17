/**
 * Hook customizado para gerenciar lead no Flow
 * 
 * Fornece estado e funções para trabalhar com um lead específico e sua posição no Flow
 */

import { useState, useEffect } from 'react';
import flowClienteService from '../services/flowClienteService';

/**
 * Hook para gerenciar um lead no Flow
 * @param {string} leadId - ID do lead
 * @returns {Object} Estado e funções para gerenciar o lead
 */
export const useFlowCliente = (leadId) => {
  const [lead, setLead] = useState(null);
  const [clienteMestre, setClienteMestre] = useState(null);
  const [primeCliente, setPrimeCliente] = useState(null);
  const [oportunidade, setOportunidade] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar dados do lead
  const loadLead = async () => {
    if (!leadId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await flowClienteService.getLeadWithFlow(leadId);
      setLead(data.lead);
      setClienteMestre(data.clienteMestre);
      setPrimeCliente(data.primeCliente);
      setOportunidade(data.oportunidade);
      
      // Carregar histórico
      const historico = await flowClienteService.getLeadHistory(leadId);
      setHistory(historico);
    } catch (err) {
      setError(err.message);
      console.error('[useFlowCliente] Erro ao carregar lead:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar ao montar ou quando leadId mudar
  useEffect(() => {
    loadLead();
  }, [leadId]);

  // Buscar lead por termo
  const findLead = async (searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      const data = await flowClienteService.findLeadInFlow(searchTerm);
      
      if (data) {
        setLead(data.lead);
        setClienteMestre(data.clienteMestre);
        setPrimeCliente(data.primeCliente);
        setOportunidade(data.oportunidade);
        
        // Carregar histórico
        const historico = await flowClienteService.getLeadHistory(data.lead.id);
        setHistory(historico);
      } else {
        setLead(null);
        setClienteMestre(null);
        setPrimeCliente(null);
        setOportunidade(null);
        setHistory([]);
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    lead,
    clienteMestre,
    primeCliente,
    oportunidade,
    history,
    loading,
    error,
    loadLead,
    findLead
  };
};

