/**
 * Serviço de gerenciamento de Leads/Clientes no Flow
 * 
 * Responsável por operações específicas de leads relacionadas ao Flow:
 * - Buscar lead e sua oportunidade ativa
 * - Localizar lead em qual esteira está
 * - Obter histórico de movimentações
 * - Enriquecer dados com clientes_mestre e prime_clientes
 */

import { getSupabaseWithSchema } from '../../../service/supabase';
import flowService from './flowService';

const LEADS_TABLE = 'leads';
const CLIENTES_MAESTRE_TABLE = 'clientes_mestre';
const PRIME_CLIENTES_TABLE = 'prime_clientes';
const FLOW_OPPORTUNITIES_TABLE = 'flow_opportunities';
const SCHEMA = 'api';

// Cache do cliente Supabase
let supabaseClient = null;
const getSupabase = () => {
  if (!supabaseClient) {
    supabaseClient = getSupabaseWithSchema(SCHEMA);
  }
  return supabaseClient;
};

/**
 * Busca um lead e sua oportunidade ativa no Flow, com dados enriquecidos
 * @param {string} leadId - ID do lead
 * @returns {Promise<Object>} Lead com sua oportunidade ativa e dados enriquecidos
 */
export const getLeadWithFlow = async (leadId) => {
  try {
    // Buscar lead
    const supabase = getSupabase();
    const { data: lead, error: leadError } = await supabase
      .from(LEADS_TABLE)
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError) throw leadError;

    // Buscar oportunidade ativa
    const oportunidade = await flowService.getActiveOpportunityByLead(leadId);

    // Buscar dados enriquecidos do clientes_mestre
    let clienteMestre = null;
    if (lead.email || lead.phone || lead.whatsapp) {
      const conditions = [];
      if (lead.email) conditions.push(`email.eq.${lead.email}`);
      if (lead.whatsapp) conditions.push(`whatsapp.eq.${lead.whatsapp}`);
      if (lead.phone) conditions.push(`telefone.eq.${lead.phone}`);
      
      if (conditions.length > 0) {
        const { data: cmData, error: cmError } = await supabase
          .from(CLIENTES_MAESTRE_TABLE)
          .select('*')
          .or(conditions.join(','))
          .limit(1)
          .maybeSingle();
        
        if (!cmError) {
          clienteMestre = cmData || null;
        }
      }
    }

    // Verificar se está no Prime
    let primeCliente = null;
    if (clienteMestre?.id_prime) {
      const { data: pcData, error: pcError } = await supabase
        .from(PRIME_CLIENTES_TABLE)
        .select('*')
        .eq('codigo_cliente_original', clienteMestre.id_prime)
        .limit(1)
        .maybeSingle();
      
      if (!pcError) {
        primeCliente = pcData || null;
      }
    }

    return {
      lead,
      oportunidade,
      clienteMestre,
      primeCliente
    };
  } catch (error) {
    console.error('[flowClienteService] Erro ao buscar lead com flow:', error);
    throw error;
  }
};

/**
 * Busca lead por email, telefone, whatsapp ou CPF e retorna sua esteira atual
 * @param {string} searchTerm - Termo de busca
 * @returns {Promise<Object|null>} Lead com oportunidade ativa ou null
 */
export const findLeadInFlow = async (searchTerm) => {
  try {
    // Buscar lead
    const supabase = getSupabase();
    const { data: leads, error } = await supabase
      .from(LEADS_TABLE)
      .select('*')
      .or(`email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,whatsapp.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
      .limit(1);

    if (error) throw error;
    if (!leads || leads.length === 0) return null;

    const lead = leads[0];
    const oportunidade = await flowService.getActiveOpportunityByLead(lead.id);

    // Buscar dados enriquecidos
    let clienteMestre = null;
    const { data: cmData, error: cmError } = await supabase
      .from(CLIENTES_MAESTRE_TABLE)
      .select('*')
      .or(`email.ilike.%${searchTerm}%,whatsapp.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
      .limit(1)
      .maybeSingle();
    
    if (!cmError) {
      clienteMestre = cmData || null;
    }

    // Verificar Prime se tiver id_prime
    let primeCliente = null;
    if (clienteMestre?.id_prime) {
      const { data: pcData } = await supabase
        .schema(SCHEMA)
        .from(PRIME_CLIENTES_TABLE)
        .select('*')
        .eq('codigo_cliente_original', clienteMestre.id_prime)
        .limit(1)
        .single();
      primeCliente = pcData || null;
    }

    return {
      lead,
      oportunidade,
      clienteMestre,
      primeCliente
    };
  } catch (error) {
    console.error('[flowClienteService] Erro ao buscar lead no flow:', error);
    throw error;
  }
};

/**
 * Obtém histórico de movimentações de um lead entre esteiras
 * @param {string} leadId - ID do lead
 * @returns {Promise<Array>} Histórico de oportunidades
 */
export const getLeadHistory = async (leadId) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(FLOW_OPPORTUNITIES_TABLE)
      .select('*, funil:funis(*)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[flowClienteService] Erro ao obter histórico:', error);
    throw error;
  }
};

/**
 * Lista todos os leads em uma esteira específica
 * @param {string} esteira - Nome da esteira
 * @param {Object} filters - Filtros opcionais
 * @returns {Promise<Array>} Lista de leads com suas oportunidades
 */
export const listLeadsByEsteira = async (esteira, filters = {}) => {
  try {
    const oportunidades = await flowService.listOpportunitiesByEsteira(esteira, filters);
    
    // Os leads já vêm no select com join
    return oportunidades.map(opp => ({
      lead: opp.lead,
      oportunidade: {
        id: opp.id,
        funil_id: opp.funil_id,
        etapa: opp.etapa,
        tentativas: opp.tentativas,
        created_at: opp.created_at,
        updated_at: opp.updated_at
      }
    }));
  } catch (error) {
    console.error('[flowClienteService] Erro ao listar leads por esteira:', error);
    throw error;
  }
};

// Exportação padrão
const flowClienteService = {
  getLeadWithFlow,
  findLeadInFlow,
  getLeadHistory,
  listLeadsByEsteira
};

export default flowClienteService;

