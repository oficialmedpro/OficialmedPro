/**
 * Serviço principal de gerenciamento de Flow (Esteiras)
 * 
 * Responsável por todas as operações relacionadas às esteiras:
 * - Listar oportunidades por esteira
 * - Mover cliente entre esteiras
 * - Obter estatísticas das esteiras
 * - Gerenciar etapas dentro das esteiras
 */

import { getSupabaseWithSchema } from '../../../service/supabase';

const TABLE_NAME = 'flow_opportunities';
const FUNIL_TABLE = 'funis';
const SCHEMA = 'api';

// Obter cliente Supabase configurado para o schema api (cacheado)
let supabaseClient = null;
const getSupabase = () => {
  if (!supabaseClient) {
    supabaseClient = getSupabaseWithSchema(SCHEMA);
  }
  return supabaseClient;
};

/**
 * Lista todos os funis disponíveis
 * @returns {Promise<Array>} Lista de funis
 */
export const listFunils = async () => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(FUNIL_TABLE)
      .select('*')
      .eq('status', 'ativo')
      .order('nome_funil', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[flowService] Erro ao listar funis:', error);
    throw error;
  }
};

/**
 * Busca um funil por ID
 * @param {number} funilId - ID do funil
 * @returns {Promise<Object>} Dados do funil
 */
export const getFunilById = async (funilId) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(FUNIL_TABLE)
      .select('*')
      .eq('id', funilId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[flowService] Erro ao buscar funil:', error);
    throw error;
  }
};

/**
 * Busca um funil por nome
 * @param {string} nome - Nome do funil
 * @returns {Promise<Object|null>} Dados do funil ou null
 */
export const getFunilByNome = async (nome) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(FUNIL_TABLE)
      .select('*')
      .ilike('nome_funil', `%${nome}%`)
      .eq('status', 'ativo')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
  } catch (error) {
    console.error('[flowService] Erro ao buscar funil por nome:', error);
    throw error;
  }
};

/**
 * Lista todas as oportunidades de uma esteira específica
 * @param {number|string} funilIdOuNome - ID do funil ou nome da esteira
 * @param {Object} filters - Filtros opcionais
 * @returns {Promise<Array>} Lista de oportunidades
 */
export const listOpportunitiesByEsteira = async (funilIdOuNome, filters = {}) => {
  try {
    // Se for número, é ID; se for string, buscar por nome
    let funilId = funilIdOuNome;
    if (typeof funilIdOuNome === 'string') {
      const funil = await getFunilByNome(funilIdOuNome);
      if (!funil) {
        throw new Error(`Funil "${funilIdOuNome}" não encontrado`);
      }
      funilId = funil.id;
    }

    const supabase = getSupabase();
    let query = supabase
      .from(TABLE_NAME)
      .select('*, funil:funis(*), lead:leads(id, firstname, lastname, email, phone, whatsapp)')
      .eq('funil_id', funilId)
      .eq('status', 'ativa');

    // Aplicar filtros
    if (filters.etapa) {
      query = query.eq('etapa', filters.etapa);
    }

    if (filters.search) {
      query = query.or(`lead.firstname.ilike.%${filters.search}%,lead.lastname.ilike.%${filters.search}%,lead.email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[flowService] Erro ao listar oportunidades:', error);
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
      .schema(SCHEMA)
      .select('*, funil:funis(*), lead:leads(id, firstname, lastname, email, phone, whatsapp)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[flowService] Erro ao buscar oportunidade:', error);
    throw error;
  }
};

/**
 * Busca a oportunidade ativa de um lead
 * @param {string} leadId - ID do lead
 * @returns {Promise<Object|null>} Oportunidade ativa ou null
 */
export const getActiveOpportunityByLead = async (leadId) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*, funil:funis(*), lead:leads(id, firstname, lastname, email, phone, whatsapp)')
      .eq('lead_id', leadId)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
  } catch (error) {
    console.error('[flowService] Erro ao buscar oportunidade ativa:', error);
    throw error;
  }
};

/**
 * Cria uma nova oportunidade de flow
 * @param {Object} opportunityData - Dados da oportunidade
 * @returns {Promise<Object>} Oportunidade criada
 */
export const createOpportunity = async (opportunityData) => {
  try {
    // Se funil_id não foi fornecido mas funil_nome foi, buscar o ID
    if (!opportunityData.funil_id && opportunityData.funil_nome) {
      const funil = await getFunilByNome(opportunityData.funil_nome);
      if (!funil) {
        throw new Error(`Funil "${opportunityData.funil_nome}" não encontrado`);
      }
      opportunityData.funil_id = funil.id;
      delete opportunityData.funil_nome;
    }

    // Fechar oportunidade anterior do lead se existir
    if (opportunityData.lead_id) {
      await closePreviousOpportunities(opportunityData.lead_id);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{
        lead_id: opportunityData.lead_id,
        funil_id: opportunityData.funil_id,
        etapa: opportunityData.etapa,
        tentativas: opportunityData.tentativas || 0,
        origem_funil_id: opportunityData.origem_funil_id,
        origem_etapa: opportunityData.origem_etapa,
        status: 'ativa',
        created_at: new Date().toISOString()
      }])
      .select('*, funil:funis(*), lead:leads(id, firstname, lastname, email, phone, whatsapp)')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[flowService] Erro ao criar oportunidade:', error);
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
    // Se funil_nome foi fornecido, buscar o ID
    if (updates.funil_nome && !updates.funil_id) {
      const funil = await getFunilByNome(updates.funil_nome);
      if (!funil) {
        throw new Error(`Funil "${updates.funil_nome}" não encontrado`);
      }
      updates.funil_id = funil.id;
      delete updates.funil_nome;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, funil:funis(*), lead:leads(id, firstname, lastname, email, phone, whatsapp)')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[flowService] Erro ao atualizar oportunidade:', error);
    throw error;
  }
};

/**
 * Move um cliente para uma nova esteira
 * @param {string} opportunityId - ID da oportunidade atual
 * @param {number|string} newFunilIdOuNome - ID do funil ou nome da nova esteira
 * @param {string} newEtapa - Nova etapa (opcional)
 * @returns {Promise<Object>} Nova oportunidade criada
 */
export const moveToEsteira = async (opportunityId, newFunilIdOuNome, newEtapa = null) => {
  try {
    // Buscar oportunidade atual
    const currentOpp = await getOpportunityById(opportunityId);
    
    // Resolver ID do novo funil
    let newFunilId = newFunilIdOuNome;
    if (typeof newFunilIdOuNome === 'string') {
      const funil = await getFunilByNome(newFunilIdOuNome);
      if (!funil) {
        throw new Error(`Funil "${newFunilIdOuNome}" não encontrado`);
      }
      newFunilId = funil.id;
    }
    
    // Fechar oportunidade atual
    await updateOpportunity(opportunityId, {
      status: 'fechada',
      closed_at: new Date().toISOString()
    });

    // Criar nova oportunidade na nova esteira
    const newOpportunity = await createOpportunity({
      lead_id: currentOpp.lead_id,
      funil_id: newFunilId,
      etapa: newEtapa,
      tentativas: 0,
      origem_funil_id: currentOpp.funil_id,
      origem_etapa: currentOpp.etapa
    });

    return newOpportunity;
  } catch (error) {
    console.error('[flowService] Erro ao mover para esteira:', error);
    throw error;
  }
};

/**
 * Incrementa tentativas de uma oportunidade
 * @param {string} id - ID da oportunidade
 * @returns {Promise<Object>} Oportunidade atualizada
 */
export const incrementTentativas = async (id) => {
  try {
    const current = await getOpportunityById(id);
    const newTentativas = (current.tentativas || 0) + 1;

    return await updateOpportunity(id, {
      tentativas: newTentativas,
      ultima_tentativa: new Date().toISOString()
    });
  } catch (error) {
    console.error('[flowService] Erro ao incrementar tentativas:', error);
    throw error;
  }
};

/**
 * Fecha oportunidades anteriores de um lead
 * @param {string} leadId - ID do lead
 * @returns {Promise<void>}
 */
export const closePreviousOpportunities = async (leadId) => {
  try {
    const supabase = getSupabase();
    await supabase
      .from(TABLE_NAME)
      .update({
        status: 'fechada',
        closed_at: new Date().toISOString()
      })
      .eq('lead_id', leadId)
      .eq('status', 'ativa');
  } catch (error) {
    console.error('[flowService] Erro ao fechar oportunidades anteriores:', error);
    throw error;
  }
};

/**
 * Obtém estatísticas de uma esteira usando oportunidade_sprint
 * @param {number|string} funilIdOuNome - ID do funil ou nome da esteira
 * @returns {Promise<Object>} Estatísticas
 */
export const getEsteiraStats = async (funilIdOuNome) => {
  try {
    // Resolver ID do funil e obter id_funil_sprint
    let funil = null;
    if (typeof funilIdOuNome === 'string') {
      funil = await getFunilByNome(funilIdOuNome);
      if (!funil) {
        console.warn(`[flowService] Funil não encontrado: ${funilIdOuNome}`);
        return { total: 0, byEtapa: {}, funil_id: null, funil_nome: funilIdOuNome };
      }
    } else {
      funil = await getFunilById(funilIdOuNome);
      if (!funil) {
        console.warn(`[flowService] Funil não encontrado com ID: ${funilIdOuNome}`);
        return { total: 0, byEtapa: {}, funil_id: funilIdOuNome, funil_nome: 'Não encontrado' };
      }
    }

    // Usar id_funil_sprint para buscar na oportunidade_sprint
    const idFunilSprint = funil.id_funil_sprint;
    if (!idFunilSprint) {
      console.warn(`[flowService] Funil ${funil.id} não tem id_funil_sprint configurado`);
      return { total: 0, byEtapa: {}, funil_id: funil.id, funil_nome: funil.nome_funil };
    }

    console.log(`[flowService] Buscando estatísticas para funil_id: ${funil.id}, id_funil_sprint: ${idFunilSprint}`);

    // Buscar na tabela oportunidade_sprint com status='open' usando id_funil_sprint
    // Usar count: 'exact' para obter o total real sem limite de 1000 do Supabase
    const supabase = getSupabase();
    
    // Primeiro, obter o total usando count
    const { count: total, error: countError } = await supabase
      .from('oportunidade_sprint')
      .select('*', { count: 'exact', head: true })
      .eq('funil_id', idFunilSprint)
      .eq('status', 'open');

    if (countError) {
      console.error('[flowService] Erro ao contar oportunidades:', countError);
      throw countError;
    }

    // Para obter a distribuição por etapa, buscar com limite alto
    // Mas usar uma abordagem mais eficiente: buscar em lotes se necessário
    let byEtapa = {};
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore && offset < total) {
      const { data, error } = await supabase
        .from('oportunidade_sprint')
        .select('etapa')
        .eq('funil_id', idFunilSprint)
        .eq('status', 'open')
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error('[flowService] Erro ao buscar etapas:', error);
        // Continuar mesmo com erro, usando apenas o total
        break;
      }

      if (data && data.length > 0) {
        data.forEach(opp => {
          const etapa = opp.etapa || 'sem_etapa';
          byEtapa[etapa] = (byEtapa[etapa] || 0) + 1;
        });
        offset += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    console.log(`[flowService] Resultado para funil_id ${funil.id} (sprint: ${idFunilSprint}):`, { 
      total: total || 0, 
      etapas: Object.keys(byEtapa).length
    });

    return {
      total: total || 0,
      byEtapa,
      funil_id: funil.id,
      funil_nome: funil.nome_funil
    };
  } catch (error) {
    console.error('[flowService] Erro ao obter estatísticas:', error);
    // Retornar objeto vazio em caso de erro para não quebrar a UI
    return { 
      total: 0, 
      byEtapa: {}, 
      funil_id: typeof funilIdOuNome === 'number' ? funilIdOuNome : null, 
      funil_nome: typeof funilIdOuNome === 'string' ? funilIdOuNome : 'Erro' 
    };
  }
};

/**
 * Processa venda - move cliente para laboratório e depois logística
 * @param {string} opportunityId - ID da oportunidade atual
 * @returns {Promise<Object>} Oportunidade na esteira de monitoramento
 */
export const processVenda = async (opportunityId) => {
  try {
    // Buscar funis necessários (ajustar nomes conforme cadastrados no banco)
    const labFunil = await getFunilByNome('Laboratório');
    const logFunil = await getFunilByNome('Logística');
    const monitorFunil = await getFunilByNome('Monitoramento');
    
    if (!labFunil || !logFunil || !monitorFunil) {
      throw new Error('Funis necessários não encontrados. Verifique se estão cadastrados no banco: Laboratório, Logística, Monitoramento');
    }

    // Mover para laboratório
    const labOpp = await moveToEsteira(opportunityId, labFunil.id);
    
    // Mover para logística
    const logOpp = await moveToEsteira(labOpp.id, logFunil.id);
    
    // Após logística, voltar para monitoramento
    const monitorOpp = await moveToEsteira(logOpp.id, monitorFunil.id, 'd30');
    
    return monitorOpp;
  } catch (error) {
    console.error('[flowService] Erro ao processar venda:', error);
    throw error;
  }
};

// Exportação padrão
const flowService = {
  listFunils,
  getFunilById,
  getFunilByNome,
  listOpportunitiesByEsteira,
  getOpportunityById,
  getActiveOpportunityByLead,
  createOpportunity,
  updateOpportunity,
  moveToEsteira,
  incrementTentativas,
  closePreviousOpportunities,
  getEsteiraStats,
  processVenda
};

export default flowService;

