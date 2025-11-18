/**
 * Serviço para buscar dados de Leads
 */

import { supabaseUrl, supabaseAnonKey, supabaseSchema } from '../../../config/supabase.js';

/**
 * Busca detalhes completos de um lead
 * @param {number} leadId - ID do lead
 * @returns {Promise<Object>} Dados completos do lead
 */
export const fetchLeadDetalhes = async (leadId) => {
  try {
    const url = `${supabaseUrl}/rest/v1/leads?id=eq.${leadId}&select=*`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('[crmLeadService] Erro ao buscar detalhes do lead:', error);
    throw error;
  }
};

/**
 * Busca oportunidades de um lead
 * @param {number} leadId - ID do lead
 * @returns {Promise<Array>} Lista de oportunidades do lead
 */
export const fetchOportunidadesPorLead = async (leadId) => {
  try {
    const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=*&lead_id=eq.${leadId}&order=create_date.desc`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('[crmLeadService] Erro ao buscar oportunidades do lead:', error);
    return [];
  }
};

const crmLeadService = {
  fetchLeadDetalhes,
  fetchOportunidadesPorLead
};

export default crmLeadService;


