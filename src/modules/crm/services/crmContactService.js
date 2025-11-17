/**
 * Serviço de Gerenciamento de Contatos do CRM
 * 
 * Responsável por todas as operações relacionadas a contatos:
 * - Listar contatos
 * - Criar novo contato
 * - Atualizar contato
 * - Deletar contato
 * - Buscar contatos
 */

import { supabase } from '../../../service/supabase';

const TABLE_NAME = 'crm_contacts';

/**
 * Lista todos os contatos
 * @param {Object} filters - Filtros opcionais
 * @returns {Promise<Array>} Lista de contatos
 */
export const listContacts = async (filters = {}) => {
  try {
    let query = supabase.from(TABLE_NAME).select('*');

    // Aplicar filtros se fornecidos
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[crmContactService] Erro ao listar contatos:', error);
    throw error;
  }
};

/**
 * Busca um contato por ID
 * @param {string} id - ID do contato
 * @returns {Promise<Object>} Dados do contato
 */
export const getContactById = async (id) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[crmContactService] Erro ao buscar contato:', error);
    throw error;
  }
};

/**
 * Cria um novo contato
 * @param {Object} contactData - Dados do contato
 * @returns {Promise<Object>} Contato criado
 */
export const createContact = async (contactData) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([contactData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[crmContactService] Erro ao criar contato:', error);
    throw error;
  }
};

/**
 * Atualiza um contato existente
 * @param {string} id - ID do contato
 * @param {Object} updates - Dados para atualizar
 * @returns {Promise<Object>} Contato atualizado
 */
export const updateContact = async (id, updates) => {
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
    console.error('[crmContactService] Erro ao atualizar contato:', error);
    throw error;
  }
};

/**
 * Deleta um contato
 * @param {string} id - ID do contato
 * @returns {Promise<void>}
 */
export const deleteContact = async (id) => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('[crmContactService] Erro ao deletar contato:', error);
    throw error;
  }
};

// Exportação padrão com todas as funções
const crmContactService = {
  listContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact
};

export default crmContactService;

