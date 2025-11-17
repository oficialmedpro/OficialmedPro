/**
 * Serviço de Gerenciamento de Oportunidades do CRM
 * 
 * Responsável por todas as operações relacionadas a oportunidades:
 * - Listar oportunidades
 * - Criar nova oportunidade
 * - Atualizar oportunidade
 * - Deletar oportunidade
 * - Mover oportunidade entre estágios do pipeline
 */

import { supabase } from '../../../service/supabase';

const TABLE_NAME = 'crm_opportunities';

/**
 * Lista todas as oportunidades
 * @param {Object} filters - Filtros opcionais
 * @returns {Promise<Array>} Lista de oportunidades
 */
export const listOpportunities = async (filters = {}) => {
  try {
    let query = supabase.from(TABLE_NAME).select('*');

    if (filters.stage) {
      query = query.eq('stage', filters.stage);
    }

    if (filters.contactId) {
      query = query.eq('contact_id', filters.contactId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[crmOpportunityService] Erro ao listar oportunidades:', error);
    throw error;
  }
};

/**
 * Busca uma oportunidade por ID
 * @param {string} id - ID da oportunidade
 * @returns {Promise<Object>} Dados da oportunidade
 */
export const getOpportunityById = async (id) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[crmOpportunityService] Erro ao buscar oportunidade:', error);
    throw error;
  }
};

/**
 * Cria uma nova oportunidade
 * @param {Object} opportunityData - Dados da oportunidade
 * @returns {Promise<Object>} Oportunidade criada
 */
export const createOpportunity = async (opportunityData) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([opportunityData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[crmOpportunityService] Erro ao criar oportunidade:', error);
    throw error;
  }
};

/**
 * Atualiza uma oportunidade existente
 * @param {string} id - ID da oportunidade
 * @param {Object} updates - Dados para atualizar
 * @returns {Promise<Object>} Oportunidade atualizada
 */
export const updateOpportunity = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[crmOpportunityService] Erro ao atualizar oportunidade:', error);
    throw error;
  }
};

/**
 * Move uma oportunidade para um novo estágio
 * @param {string} id - ID da oportunidade
 * @param {string} newStage - Novo estágio
 * @returns {Promise<Object>} Oportunidade atualizada
 */
export const moveOpportunityStage = async (id, newStage) => {
  return updateOpportunity(id, { stage: newStage });
};

/**
 * Deleta uma oportunidade
 * @param {string} id - ID da oportunidade
 * @returns {Promise<void>}
 */
export const deleteOpportunity = async (id) => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('[crmOpportunityService] Erro ao deletar oportunidade:', error);
    throw error;
  }
};

// Exportação padrão com todas as funções
const crmOpportunityService = {
  listOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  moveOpportunityStage,
  deleteOpportunity
};

export default crmOpportunityService;

