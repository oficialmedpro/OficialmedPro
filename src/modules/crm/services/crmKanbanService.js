/**
 * Serviço para Kanban de Oportunidades
 * 
 * Busca oportunidades organizadas por funil e etapa
 */

import { supabase } from '../../../service/supabase';
import { getUnidades, getFunisPorUnidade } from '../../../service/FilterBarService';
import { getFunilEtapas } from '../../../service/supabase';
import { supabaseUrl, supabaseAnonKey, supabaseSchema } from '../../../config/supabase.js';

/**
 * Busca todas as unidades
 */
export const fetchUnidades = async () => {
  return await getUnidades();
};

/**
 * Busca funis por unidade
 */
export const fetchFunisPorUnidade = async (unidadeId) => {
  return await getFunisPorUnidade(unidadeId);
};

/**
 * Busca etapas de um funil
 */
export const fetchEtapasFunil = async (funilId) => {
  try {
    const etapas = await getFunilEtapas(funilId);
    return etapas || [];
  } catch (error) {
    console.error('[crmKanbanService] Erro ao buscar etapas do funil:', error);
    return [];
  }
};

/**
 * Busca oportunidades por funil e etapa
 * @param {number} funilId - ID do funil
 * @param {Array} etapaIds - IDs das etapas (crm_column)
 * @returns {Promise<Array>} Oportunidades agrupadas por etapa
 */
export const fetchOportunidadesPorFunil = async (funilId, etapaIds = []) => {
  try {
    if (!etapaIds || etapaIds.length === 0) {
      return {};
    }

    // Construir filtro para múltiplas etapas usando or=() (padrão do projeto)
    const etapaFilter = etapaIds.map(id => `crm_column.eq.${id}`).join(',');
    
    // Usar fetch direto com REST API (padrão do projeto)
    const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=*&archived=eq.0&status=eq.open&funil_id=eq.${funilId}&or=(${etapaFilter})&order=create_date.desc`;
    
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

    // Agrupar oportunidades por etapa (crm_column)
    const agrupadas = {};
    etapaIds.forEach(etapaId => {
      agrupadas[etapaId] = [];
    });

    (data || []).forEach(opp => {
      const etapaId = opp.crm_column;
      if (agrupadas[etapaId]) {
        agrupadas[etapaId].push(opp);
      }
    });

    return agrupadas;
  } catch (error) {
    console.error('[crmKanbanService] Erro ao buscar oportunidades:', error);
    throw error;
  }
};

/**
 * Atualiza a etapa de uma oportunidade (move no Kanban)
 * @param {number} oportunidadeId - ID da oportunidade
 * @param {number} novaEtapaId - Novo ID da etapa (crm_column)
 */
export const moverOportunidade = async (oportunidadeId, novaEtapaId) => {
  try {
    // Usar fetch direto com REST API (padrão do projeto)
    const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?id=eq.${oportunidadeId}`;
    
    const updateData = {
      crm_column: novaEtapaId,
      last_column_change: new Date().toISOString(),
      update_date: new Date().toISOString()
    };
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    // Retornar o primeiro item se for array, ou o objeto direto
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('[crmKanbanService] Erro ao mover oportunidade:', error);
    throw error;
  }
};

/**
 * Busca informações do vendedor por user_id
 * @param {number} userId - ID do usuário/vendedor
 * @returns {Promise<Object>} Informações do vendedor (avatar_url, first_name, etc)
 */
export const fetchVendedorInfo = async (userId) => {
  try {
    if (!userId) return null;
    
    const url = `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=id,first_name,last_name,avatar_url`;
    
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
      return null;
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('[crmKanbanService] Erro ao buscar vendedor:', error);
    return null;
  }
};

/**
 * Busca múltiplos vendedores de uma vez (otimização)
 * @param {Array<number>} userIds - Array de IDs de usuários
 * @returns {Promise<Object>} Mapa de userId -> informações do vendedor
 */
export const fetchVendedoresInfo = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) return {};
    
    // Remover duplicatas e nulls
    const uniqueIds = [...new Set(userIds.filter(id => id != null))];
    if (uniqueIds.length === 0) return {};
    
    // Construir filtro para múltiplos IDs
    const idFilter = uniqueIds.map(id => `id.eq.${id}`).join(',');
    const url = `${supabaseUrl}/rest/v1/users?select=id,first_name,last_name,avatar_url&or=(${idFilter})`;
    
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
      return {};
    }

    const data = await response.json();
    // Criar mapa userId -> info
    const vendedoresMap = {};
    (data || []).forEach(vendedor => {
      vendedoresMap[vendedor.id] = vendedor;
    });
    
    return vendedoresMap;
  } catch (error) {
    console.error('[crmKanbanService] Erro ao buscar vendedores:', error);
    return {};
  }
};

/**
 * Busca detalhes completos de uma oportunidade
 */
export const fetchOportunidadeDetalhes = async (oportunidadeId) => {
  try {
    const { data, error } = await supabase
      .from('oportunidade_sprint')
      .select('*')
      .eq('id', oportunidadeId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[crmKanbanService] Erro ao buscar detalhes:', error);
    throw error;
  }
};

const crmKanbanService = {
  fetchUnidades,
  fetchFunisPorUnidade,
  fetchEtapasFunil,
  fetchOportunidadesPorFunil,
  moverOportunidade,
  fetchOportunidadeDetalhes,
  fetchVendedorInfo,
  fetchVendedoresInfo
};

export default crmKanbanService;

