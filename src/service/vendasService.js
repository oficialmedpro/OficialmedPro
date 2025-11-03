/**
 * ­ƒôè SERVI├çO PARA DADOS DO VENDAS PWA
 * 
 * Busca KPIs agregados das views do Postgres
 */

import { supabase, getSupabaseWithSchema } from './supabase.js';
import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js';

/**
 * Busca KPIs de Acolhimento
 * @param {Object} filtros - { unidadeId, funilId, vendedorId }
 * @returns {Promise<Object>} KPIs agregados
 */
export const getKpisAcolhimento = async (filtros = {}) => {
  try {
    console.log('­ƒöì [vendasService] Buscando KPIs de Acolhimento:', filtros);
    
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
    let query = supabaseWithSchema.from('view_acolhimento_kpis').select('*');
    
    if (filtros.unidadeId) query = query.eq('unidade_id', filtros.unidadeId);
    if (filtros.funilId) query = query.eq('funil_id', filtros.funilId);
    if (filtros.vendedorId) query = query.eq('user_id', filtros.vendedorId);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    console.log(`Ô£à [vendasService] KPIs Acolhimento encontrados:`, data?.length || 0);
    
    // Agregar todos os vendedores se n├úo filtrar por vendedor espec├¡fico
    if (!filtros.vendedorId && Array.isArray(data) && data.length > 0) {
      return {
        entrou: data.reduce((sum, row) => sum + (row.entrou || 0), 0),
        em_acolhimento: data.reduce((sum, row) => sum + (row.em_acolhimento || 0), 0),
        qualificados: data.reduce((sum, row) => sum + (row.qualificados || 0), 0),
        nao_lidas: data.reduce((sum, row) => sum + (row.nao_lidas || 0), 0),
        msgs: data.reduce((sum, row) => sum + (row.msgs || 0), 0),
        qualidade: data.reduce((sum, row) => sum + (row.qualidade || 0), 0),
        telef_pct: data[0]?.telef_pct || 0,
        email_pct: data[0]?.email_pct || 0,
        cidade_pct: data[0]?.cidade_pct || 0,
        intencao_pct: data[0]?.intencao_pct || 0,
        taxaEA: data[0]?.taxa_ea || 0,
        taxaAQ: data[0]?.taxa_aq || 0,
        tEntrada: data[0]?.t_entrada_horas || 0,
        tAcolh: data[0]?.t_acolh_horas || 0,
        atrasados: data.reduce((sum, row) => sum + (row.atrasados || 0), 0),
        emFila: data.reduce((sum, row) => sum + (row.em_fila || 0), 0)
      };
    }
    
    // Retornar dados do primeiro vendedor se n├úo houver agrega├º├úo
    return data?.[0] || {};
  } catch (error) {
    console.error('ÔØî [vendasService] Erro ao buscar KPIs Acolhimento:', error);
    throw error;
  }
};

/**
 * Busca KPIs de Or├ºamentista
 * @param {Object} filtros - { unidadeId, funilId, vendedorId }
 * @returns {Promise<Object>} KPIs agregados
 */
export const getKpisOrcamento = async (filtros = {}) => {
  try {
    console.log('­ƒöì [vendasService] Buscando KPIs de Or├ºamento:', filtros);
    
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
    let query = supabaseWithSchema.from('view_orcamento_kpis').select('*');
    
    if (filtros.unidadeId) query = query.eq('unidade_id', filtros.unidadeId);
    if (filtros.funilId) query = query.eq('funil_id', filtros.funilId);
    if (filtros.vendedorId) query = query.eq('user_id', filtros.vendedorId);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    console.log(`Ô£à [vendasService] KPIs Or├ºamento encontrados:`, data?.length || 0);
    
    // Agregar todos os vendedores
    if (Array.isArray(data) && data.length > 0) {
      return {
        valDia: data.reduce((sum, row) => sum + parseFloat(row.val_dia || 0), 0),
        valSemana: data.reduce((sum, row) => sum + parseFloat(row.val_semana || 0), 0),
        valMes: data.reduce((sum, row) => sum + parseFloat(row.val_mes || 0), 0),
        qtdDia: data.reduce((sum, row) => sum + (row.qtd_dia || 0), 0),
        qtdSemana: data.reduce((sum, row) => sum + (row.qtd_semana || 0), 0),
        qtdMes: data.reduce((sum, row) => sum + (row.qtd_mes || 0), 0),
        ticketDia: data[0]?.ticket_dia ? parseFloat(data[0].ticket_dia) : 0,
        ticketSemana: data[0]?.ticket_semana ? parseFloat(data[0].ticket_semana) : 0,
        ticketMes: data[0]?.ticket_mes ? parseFloat(data[0].ticket_mes) : 0,
        taxaQO: data[0]?.taxa_qo || 0,
        taxaON: data[0]?.taxa_on || 0
      };
    }
    
    return {};
  } catch (error) {
    console.error('ÔØî [vendasService] Erro ao buscar KPIs Or├ºamento:', error);
    throw error;
  }
};

/**
 * Busca KPIs de Vendas
 * @param {Object} filtros - { unidadeId, funilId, vendedorId }
 * @returns {Promise<Object>} KPIs agregados
 */
export const getKpisVendas = async (filtros = {}) => {
  try {
    console.log('­ƒöì [vendasService] Buscando KPIs de Vendas:', filtros);
    
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
    let query = supabaseWithSchema.from('view_vendas_kpis').select('*');
    
    if (filtros.unidadeId) query = query.eq('unidade_id', filtros.unidadeId);
    if (filtros.funilId) query = query.eq('funil_id', filtros.funilId);
    if (filtros.vendedorId) query = query.eq('user_id', filtros.vendedorId);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    console.log(`Ô£à [vendasService] KPIs Vendas encontrados:`, data?.length || 0);
    
    // Agregar todos os vendedores
    if (Array.isArray(data) && data.length > 0) {
      return {
        valDia: data.reduce((sum, row) => sum + parseFloat(row.val_dia || 0), 0),
        valSemana: data.reduce((sum, row) => sum + parseFloat(row.val_semana || 0), 0),
        valQuinzena: data.reduce((sum, row) => sum + parseFloat(row.val_quinzena || 0), 0),
        ticketDia: data[0]?.ticket_dia ? parseFloat(data[0].ticket_dia) : 0,
        ticketSemana: data[0]?.ticket_semana ? parseFloat(data[0].ticket_semana) : 0,
        ticketQuinzena: data[0]?.ticket_quinzena ? parseFloat(data[0].ticket_quinzena) : 0,
        taxaNF: data[0]?.taxa_nf || 0,
        taxaFC: data[0]?.taxa_fc || 0,
        followupsAtivos: data.reduce((sum, row) => sum + (row.followups_ativos || 0), 0)
      };
    }
    
    return {};
  } catch (error) {
    console.error('ÔØî [vendasService] Erro ao buscar KPIs Vendas:', error);
    throw error;
  }
};

/**
 * Busca Top motivos de perda
 * @param {String} aba - 'acolhimento', 'or├ºamento', 'vendas'
 * @returns {Promise<Array>} Lista de motivos
 */
export const getMotivosPerda = async (aba) => {
  try {
    console.log('­ƒöì [vendasService] Buscando motivos de perda para aba:', aba);
    
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
    const { data, error } = await supabaseWithSchema
      .from('view_perdas_top_motivos')
      .select('*')
      .eq('aba', aba)
      .order('qtd', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    console.log(`Ô£à [vendasService] Motivos de perda encontrados:`, data?.length || 0);
    
    return data || [];
  } catch (error) {
    console.error('ÔØî [vendasService] Erro ao buscar motivos de perda:', error);
    throw error;
  }
};

/**
 * Busca metas para contexto
 * @param {Object} filtros - { unidadeId, funilId, vendedorId, tipoMeta }
 * @returns {Promise<Object>} Metas
 */
export const getMetas = async (filtros = {}) => {
  try {
    console.log('­ƒöì [vendasService] Buscando metas:', filtros);
    
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
    let query = supabaseWithSchema.from('metas').select('*').eq('ativo', true);
    
    if (filtros.unidadeId) query = query.eq('unidade_franquia', filtros.unidadeId);
    if (filtros.funilId) query = query.eq('funil', filtros.funilId);
    if (filtros.vendedorId) query = query.eq('vendedor_id', filtros.vendedorId);
    if (filtros.tipoMeta) query = query.eq('tipo_meta', filtros.tipoMeta);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    console.log(`Ô£à [vendasService] Metas encontradas:`, data?.length || 0);
    
    return data || [];
  } catch (error) {
    console.error('ÔØî [vendasService] Erro ao buscar metas:', error);
    throw error;
  }
};

// Exportar funções individuais (para uso direto)
export {
  getKpisAcolhimento,
  getKpisOrcamento,
  getKpisVendas,
  getMotivosPerda,
  getMetas
};

// Exportar objeto padrão (para uso como objeto)
export default {
  getKpisAcolhimento,
  getKpisOrcamento,
  getKpisVendas,
  getMotivosPerda,
  getMetas
};

