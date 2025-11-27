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
      .maybeSingle(); // Usar maybeSingle ao invés de single para evitar erro quando não encontrar

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('[flowService] Erro ao buscar funil por nome:', error);
    throw error;
  }
};

/**
 * Busca as etapas de um funil
 * @param {number} funilId - ID do funil (da tabela funis) ou id_funil_sprint diretamente
 * @returns {Promise<Array>} Lista de etapas ordenadas
 */
export const getFunilEtapas = async (funilId) => {
  try {
    const supabase = getSupabase();
    let idFunilSprint = null;
    
    // Primeiro buscar o funil para obter o id_funil_sprint
    const { data: funil, error: funilError } = await supabase
      .from(FUNIL_TABLE)
      .select('id_funil_sprint')
      .eq('id', funilId)
      .single();
    
    if (funilError || !funil || !funil.id_funil_sprint) {
      console.error('[flowService] Funil não encontrado ou sem id_funil_sprint:', { funilId, funilError, funil });
      throw new Error(`Funil com ID ${funilId} não encontrado ou sem id_funil_sprint`);
    }
    
    idFunilSprint = funil.id_funil_sprint;
    
    // Usar a mesma lógica do FunnelChart: buscar diretamente usando id_funil_sprint como string
    // id_funil_sprint em funis é integer, mas em funil_etapas é varchar
    const idFunilSprintStr = idFunilSprint.toString();
    
    // Buscar etapas do funil usando a mesma query do FunnelChart
    const { data, error } = await supabase
      .from('funil_etapas')
      .select('*')
      .eq('id_funil_sprint', idFunilSprintStr)
      .eq('ativo', true)
      .order('ordem_etapa', { ascending: true });
    
    if (error) {
      console.error('[flowService] Erro ao buscar etapas:', error);
      throw error;
    }
    
    console.log(`[flowService] Etapas encontradas para funil ${funilId} (sprint: ${idFunilSprintStr}):`, data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('[flowService] Erro ao buscar etapas do funil:', error);
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
    // Verificar se é um número (ID) ou string (nome)
    let funilId = funilIdOuNome;
    let funil = null;
    
    // Se for string, verificar se pode ser convertido para número (ID)
    const isNumericId = typeof funilIdOuNome === 'string' 
      ? !isNaN(funilIdOuNome) && !isNaN(parseFloat(funilIdOuNome))
      : typeof funilIdOuNome === 'number';
    
    if (isNumericId) {
      // É um ID numérico
      funilId = typeof funilIdOuNome === 'string' ? parseInt(funilIdOuNome, 10) : funilIdOuNome;
      // Buscar dados do funil
      const { data: funilData, error: funilError } = await getSupabase()
        .from(FUNIL_TABLE)
        .select('*')
        .eq('id', funilId)
        .single();
      if (!funilError && funilData) {
        funil = funilData;
      } else if (funilError && funilError.code !== 'PGRST116') {
        throw new Error(`Funil com ID "${funilId}" não encontrado`);
      }
    } else {
      // É um nome, buscar por nome
      funil = await getFunilByNome(funilIdOuNome);
      if (!funil) {
        throw new Error(`Funil "${funilIdOuNome}" não encontrado`);
      }
      funilId = funil.id;
    }

    // Buscar oportunidades da tabela oportunidade_sprint (não flow_opportunities)
    // usando id_funil_sprint ao invés de funil_id
    const supabase = getSupabase();
    const idFunilSprint = funil.id_funil_sprint;
    
    let query = supabase
      .from('oportunidade_sprint')
      .select('*')
      .eq('funil_id', idFunilSprint)
      .eq('status', 'open')
      .eq('archived', 0);

    // Aplicar filtros
    if (filters.etapa) {
      // Se a etapa for um id_etapa_sprint, usar crm_column
      query = query.eq('crm_column', filters.etapa);
    }

    // Buscar dados
    const { data, error } = await query.order('create_date', { ascending: false });

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }

    // Buscar dados dos leads separadamente
    const leadIds = [...new Set(data.map(opp => opp.lead_id).filter(Boolean))];
    let leadsMap = {};
    
    if (leadIds.length > 0) {
      // Buscar leads em lotes se necessário
      const batchSize = 1000;
      for (let i = 0; i < leadIds.length; i += batchSize) {
        const batch = leadIds.slice(i, i + batchSize);
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('id, firstname, lastname, email, phone, whatsapp')
          .in('id', batch);
        
        if (!leadsError && leadsData) {
          leadsData.forEach(lead => {
            leadsMap[lead.id] = lead;
          });
        }
      }
    }

    // Aplicar filtro de busca se houver
    let filteredData = data;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = data.filter(opp => {
        const lead = leadsMap[opp.lead_id];
        if (!lead) return false;
        return (
          (lead.firstname && lead.firstname.toLowerCase().includes(searchLower)) ||
          (lead.lastname && lead.lastname.toLowerCase().includes(searchLower)) ||
          (lead.email && lead.email.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Transformar dados de oportunidade_sprint para o formato esperado
    // e adicionar dados do funil a cada oportunidade
    if (filteredData && funil) {
      return filteredData.map(opp => ({
        id: opp.id,
        lead_id: opp.lead_id,
        funil_id: funil.id, // ID da tabela funis
        etapa: opp.crm_column ? opp.crm_column.toString() : null, // crm_column é o id_etapa_sprint (integer)
        tentativas: 0, // Não existe na oportunidade_sprint
        status: 'ativa',
        created_at: opp.create_date,
        updated_at: opp.update_date,
        lead: leadsMap[opp.lead_id] || {},
        funil: funil,
        // Campos adicionais da oportunidade_sprint
        title: opp.title,
        value: opp.value,
        user_id: opp.user_id,
        crm_column: opp.crm_column // Manter original para comparação
      }));
    }
    
    return [];
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
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*, lead:leads(id, firstname, lastname, email, phone, whatsapp)')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Buscar dados do funil separadamente
    if (data && data.funil_id) {
      const { data: funilData, error: funilError } = await supabase
        .from(FUNIL_TABLE)
        .select('*')
        .eq('id', data.funil_id)
        .single();
      if (!funilError && funilData) {
        data.funil = funilData;
      }
    }
    
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
      .select('*, lead:leads(id, firstname, lastname, email, phone, whatsapp)')
      .eq('lead_id', leadId)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    
    // Buscar dados do funil separadamente
    if (data && data.funil_id) {
      const { data: funilData, error: funilError } = await supabase
        .from(FUNIL_TABLE)
        .select('*')
        .eq('id', data.funil_id)
        .single();
      if (!funilError && funilData) {
        data.funil = funilData;
      }
    }
    
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
      .select('*, lead:leads(id, firstname, lastname, email, phone, whatsapp)')
      .single();

    if (error) throw error;
    
    // Buscar dados do funil separadamente
    if (data && data.funil_id) {
      const { data: funilData, error: funilError } = await supabase
        .from(FUNIL_TABLE)
        .select('*')
        .eq('id', data.funil_id)
        .single();
      if (!funilError && funilData) {
        data.funil = funilData;
      }
    }
    
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
      .select('*, lead:leads(id, firstname, lastname, email, phone, whatsapp)')
      .single();

    if (error) throw error;
    
    // Buscar dados do funil separadamente
    if (data && data.funil_id) {
      const { data: funilData, error: funilError } = await supabase
        .from(FUNIL_TABLE)
        .select('*')
        .eq('id', data.funil_id)
        .single();
      if (!funilError && funilData) {
        data.funil = funilData;
      }
    }
    
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

/**
 * Obtém estatísticas de gestão de leads
 * @returns {Promise<Object>} Estatísticas de leads
 */
export const getGestaoLeadsStats = async () => {
  try {
    const supabase = getSupabase();
    
    // 1. Total de leads na tabela api.leads
    const { count: totalLeads, error: totalLeadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    if (totalLeadsError) throw totalLeadsError;
    
    // 2. Obter IDs únicos de leads que têm oportunidades (qualquer status)
    // Usar paginação para evitar limite de 1000 registros
    let leadIdsComOportunidades = new Set();
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: batch, error: batchError } = await supabase
        .from('oportunidade_sprint')
        .select('lead_id')
        .range(offset, offset + batchSize - 1);
      
      if (batchError) throw batchError;
      
      if (batch && batch.length > 0) {
        batch.forEach(op => leadIdsComOportunidades.add(op.lead_id));
        offset += batchSize;
        hasMore = batch.length === batchSize;
      } else {
        hasMore = false;
      }
    }
    
    // 3. Leads sem nenhuma oportunidade
    const leadsSemOportunidade = totalLeads - leadIdsComOportunidades.size;
    
    // 4. Leads com oportunidades abertas (status='open')
    let leadIdsComAbertas = new Set();
    offset = 0;
    hasMore = true;
    
    while (hasMore) {
      const { data: batch, error: batchError } = await supabase
        .from('oportunidade_sprint')
        .select('lead_id')
        .eq('status', 'open')
        .range(offset, offset + batchSize - 1);
      
      if (batchError) throw batchError;
      
      if (batch && batch.length > 0) {
        batch.forEach(op => leadIdsComAbertas.add(op.lead_id));
        offset += batchSize;
        hasMore = batch.length === batchSize;
      } else {
        hasMore = false;
      }
    }
    
    // 5. Leads sem oportunidade aberta (não têm nenhuma com status='open')
    const leadsSemAberta = totalLeads - leadIdsComAbertas.size;
    
    // 6. Leads com oportunidades ganhas (status='gain')
    let leadIdsComGanhas = new Set();
    offset = 0;
    hasMore = true;
    
    while (hasMore) {
      const { data: batch, error: batchError } = await supabase
        .from('oportunidade_sprint')
        .select('lead_id')
        .eq('status', 'gain')
        .range(offset, offset + batchSize - 1);
      
      if (batchError) throw batchError;
      
      if (batch && batch.length > 0) {
        batch.forEach(op => leadIdsComGanhas.add(op.lead_id));
        offset += batchSize;
        hasMore = batch.length === batchSize;
      } else {
        hasMore = false;
      }
    }
    
    // 7. Leads com oportunidades perdidas (status='lost')
    let leadIdsComPerdidas = new Set();
    offset = 0;
    hasMore = true;
    
    while (hasMore) {
      const { data: batch, error: batchError } = await supabase
        .from('oportunidade_sprint')
        .select('lead_id')
        .eq('status', 'lost')
        .range(offset, offset + batchSize - 1);
      
      if (batchError) throw batchError;
      
      if (batch && batch.length > 0) {
        batch.forEach(op => leadIdsComPerdidas.add(op.lead_id));
        offset += batchSize;
        hasMore = batch.length === batchSize;
      } else {
        hasMore = false;
      }
    }
    
    return {
      totalLeads: totalLeads || 0,
      leadsSemOportunidade: leadsSemOportunidade || 0,
      leadsSemAberta: leadsSemAberta || 0,
      leadsComGanhas: leadIdsComGanhas.size || 0,
      leadsComPerdidas: leadIdsComPerdidas.size || 0
    };
  } catch (error) {
    console.error('[flowService] Erro ao obter estatísticas de gestão de leads:', error);
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
  processVenda,
  getGestaoLeadsStats
};

export default flowService;

