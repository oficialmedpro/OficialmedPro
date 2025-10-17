/**
 * 📊 SERVIÇO PARA TABELA DE LEADS
 * Gerencia busca e exibição de leads por segmento
 */

import { getSupabaseWithSchema } from './supabase.js';

const SPRINT_HUB_PROFILE_BASE_URL = 'https://oficialmed.sprinthub.app/sh/leads/profile/';

// ==================== FUNÇÕES PRINCIPAIS ====================

export async function getLeadsBySegment(segmentoId, options = {}) {
  try {
    console.log(`🔍 Buscando leads do segmento ${segmentoId}...`);
    
    const {
      page = 1,
      limit = 10,
      statusFilter = 'all',
      orderBy = 'nome_completo',
      orderDirection = 'asc'
    } = options;

    const supabaseClient = getSupabaseWithSchema('api');
    
    // Construir query base - buscar diretamente da tabela leads
    let query = supabaseClient
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('segmento', segmentoId);

    // Aplicar filtro de status se não for 'all'
    if (statusFilter !== 'all') {
      query = query.eq('status_callix', statusFilter);
    }

    // Aplicar ordenação - usar firstname em vez de nome_completo
    if (orderBy === 'nome_completo') {
      query = query.order('firstname', { ascending: orderDirection === 'asc' });
    } else if (orderBy === 'data_envio_callix') {
      query = query.order('data_envio_callix', { ascending: orderDirection === 'asc' });
    } else {
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });
    }

    // Aplicar paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Erro ao buscar leads:', error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0} leads encontrados (total: ${count})`);
    
    // Processar dados para criar nome completo e link do perfil
    const leadsProcessed = (data || []).map(lead => ({
      ...lead,
      nome_completo: `${lead.firstname || ''} ${lead.lastname || ''}`.trim() || 'Sem nome',
      profileLink: `${SPRINT_HUB_PROFILE_BASE_URL}${lead.id}`
    }));
    
    return {
      leads: leadsProcessed,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };

  } catch (error) {
    console.error('❌ Erro ao buscar leads por segmento:', error);
    throw error;
  }
}

export async function getLeadsStatsBySegment(segmentoId) {
  try {
    console.log(`📊 Buscando estatísticas do segmento ${segmentoId}...`);
    
    const supabaseClient = getSupabaseWithSchema('api');
    
    // Buscar estatísticas gerais
    const { data: stats, error: statsError } = await supabaseClient
      .from('view_leads_callix')
      .select('status_callix')
      .eq('segmento_id', segmentoId);

    if (statsError) {
      console.error('❌ Erro ao buscar estatísticas:', statsError);
      throw statsError;
    }

    // Calcular estatísticas
    const totalLeads = stats.length;
    const statsByStatus = stats.reduce((acc, lead) => {
      const status = lead.status_callix || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const result = {
      total: totalLeads,
      byStatus: statsByStatus,
      pending: statsByStatus.pending || 0,
      sent: statsByStatus.sent || 0,
      contacted: statsByStatus.contacted || 0,
      not_contacted: statsByStatus.not_contacted || 0,
      converted: statsByStatus.converted || 0,
      failed: statsByStatus.failed || 0
    };

    console.log('✅ Estatísticas calculadas:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas do segmento:', error);
    throw error;
  }
}

export async function getSegmentoInfo(segmentoId) {
  try {
    console.log(`🔍 Buscando informações do segmento ${segmentoId}...`);
    
    const supabaseClient = getSupabaseWithSchema('api');
    
    const { data, error } = await supabaseClient
      .from('segmento')
      .select('id, name, alias, total_leads, category_title')
      .eq('id', segmentoId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar segmento:', error);
      throw error;
    }

    console.log('✅ Informações do segmento:', data);
    return data;

  } catch (error) {
    console.error('❌ Erro ao buscar informações do segmento:', error);
    throw error;
  }
}

// ==================== FUNÇÕES AUXILIARES ====================

export function formatLeadData(lead) {
  return {
    id: lead.id,
    lead_id: lead.lead_id,
    segmento_id: lead.segmento_id,
    nome_completo: lead.nome_completo || 'Sem nome',
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    email: lead.email,
    status_callix: lead.status_callix || 'unknown',
    data_envio_callix: lead.data_envio_callix,
    callix_id: lead.callix_id,
    nome_segmento: lead.nome_segmento,
    alias_segmento: lead.alias_segmento
  };
}

export function getStatusConfig(status) {
  const configs = {
    'pending': { 
      text: 'Pendente', 
      class: 'status-pending',
      color: '#ffaa00',
      description: 'Aguardando processamento no Callix'
    },
    'sent': { 
      text: 'Enviado', 
      class: 'status-sent',
      color: '#00aaff',
      description: 'Enviado para o Callix com sucesso'
    },
    'contacted': { 
      text: 'Contatado', 
      class: 'status-contacted',
      color: '#00ff88',
      description: 'Contato realizado com sucesso'
    },
    'not_contacted': { 
      text: 'Não Contatado', 
      class: 'status-not-contacted',
      color: '#ff6666',
      description: 'Não foi possível contatar'
    },
    'converted': { 
      text: 'Convertido', 
      class: 'status-converted',
      color: '#8800ff',
      description: 'Lead convertido em cliente'
    },
    'failed': { 
      text: 'Falha', 
      class: 'status-failed',
      color: '#ff4444',
      description: 'Falha no processamento'
    }
  };

  return configs[status] || { 
    text: 'Desconhecido', 
    class: 'status-unknown',
    color: '#666',
    description: 'Status não identificado'
  };
}

export function generateSprintHubUrl(leadId) {
  return `https://oficialmed.sprinthub.app/sh/leads/profile/${leadId}`;
}

export function formatWhatsAppNumber(whatsapp) {
  if (!whatsapp) return null;
  
  // Remover caracteres não numéricos
  const cleanNumber = whatsapp.replace(/\D/g, '');
  
  // Formatar para exibição
  if (cleanNumber.length === 11) {
    return cleanNumber.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanNumber.length === 10) {
    return cleanNumber.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return cleanNumber;
}

export function formatEmail(email) {
  if (!email) return null;
  
  // Truncar email muito longo
  if (email.length > 30) {
    return email.substring(0, 30) + '...';
  }
  
  return email;
}

// ==================== VALIDAÇÕES ====================

export function validateSegmentId(segmentoId) {
  if (!segmentoId) {
    throw new Error('ID do segmento é obrigatório');
  }
  
  if (typeof segmentoId !== 'number' && typeof segmentoId !== 'string') {
    throw new Error('ID do segmento deve ser um número');
  }
  
  return true;
}

export function validatePageOptions(options) {
  const { page, limit } = options;
  
  if (page && (page < 1 || !Number.isInteger(page))) {
    throw new Error('Página deve ser um número inteiro maior que 0');
  }
  
  if (limit && (limit < 1 || limit > 100 || !Number.isInteger(limit))) {
    throw new Error('Limite deve ser um número inteiro entre 1 e 100');
  }
  
  return true;
}
