/**
 * 📦 SERVIÇO PARA PEDIDOS PRIME
 * 
 * Gerencia busca e filtros de pedidos do sistema Prime
 */

import { supabase, getSupabaseWithSchema } from './supabase.js';
import { supabaseUrl, supabaseAnonKey, supabaseSchema } from '../config/supabase.js';

export const primePedidosService = {
  /**
   * Busca todos os pedidos com filtros e paginação
   */
  async getPedidos(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        statusGeral = '',
        statusAprovacao = '',
        statusEntrega = '',
        clienteId = null,
        dataInicio = null,
        dataFim = null,
        orderBy = 'data_criacao',
        orderDirection = 'desc'
      } = options;

      console.log('🔍 PrimePedidosService: Buscando pedidos...', options);

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      let query = supabaseWithSchema
        .from('prime_pedidos')
        .select(`
          *,
          prime_clientes!inner(
            id,
            nome,
            codigo_cliente_original,
            email,
            telefone
          )
        `, { count: 'exact' });

      // Filtro por cliente específico
      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }

      // Filtro por status geral
      if (statusGeral) {
        query = query.eq('status_geral', statusGeral);
      }

      // Filtro por status de aprovação
      if (statusAprovacao) {
        query = query.eq('status_aprovacao', statusAprovacao);
      }

      // Filtro por status de entrega
      if (statusEntrega) {
        query = query.eq('status_entrega', statusEntrega);
      }

      // Filtro por data de criação
      if (dataInicio) {
        query = query.gte('data_criacao', dataInicio);
      }
      if (dataFim) {
        query = query.lte('data_criacao', dataFim);
      }

      // Filtro de busca por número do orçamento ou nome do cliente
      if (search) {
        query = query.or(`codigo_orcamento_original.ilike.%${search}%,prime_clientes.nome.ilike.%${search}%`);
      }

      // Ordenação
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao buscar pedidos:', error);
        throw error;
      }

      console.log(`✅ Pedidos encontrados: ${data?.length || 0} de ${count || 0}`);

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      };

    } catch (error) {
      console.error('❌ Erro no PrimePedidosService:', error);
      throw error;
    }
  },

  /**
   * Busca pedido por ID
   */
  async getPedidoById(id) {
    try {
      console.log('🔍 PrimePedidosService: Buscando pedido por ID:', id);

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      const { data, error } = await supabaseWithSchema
        .from('prime_pedidos')
        .select(`
          *,
          prime_clientes!inner(
            id,
            nome,
            codigo_cliente_original,
            email,
            telefone,
            endereco_logradouro,
            endereco_numero,
            endereco_cidade,
            endereco_estado,
            endereco_cep
          ),
          prime_formulas(
            id,
            numero_formula,
            descricao,
            posologia,
            valor_formula
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar pedido:', error);
        throw error;
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Erro ao buscar pedido por ID:', error);
      throw error;
    }
  },

  /**
   * Busca pedidos de um cliente específico
   */
  async getPedidosByCliente(clienteId, options = {}) {
    try {
      console.log('🔍 PrimePedidosService: Buscando pedidos do cliente:', clienteId);

      const {
        page = 1,
        pageSize = 20,
        statusGeral = '',
        orderBy = 'data_criacao',
        orderDirection = 'desc'
      } = options;

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      let query = supabaseWithSchema
        .from('prime_pedidos')
        .select(`
          *,
          prime_clientes!inner(
            id,
            nome,
            codigo_cliente_original
          )
        `, { count: 'exact' })
        .eq('cliente_id', clienteId);

      // Filtro por status geral
      if (statusGeral) {
        query = query.eq('status_geral', statusGeral);
      }

      // Ordenação
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao buscar pedidos do cliente:', error);
        throw error;
      }

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      };

    } catch (error) {
      console.error('❌ Erro ao buscar pedidos do cliente:', error);
      throw error;
    }
  },

  /**
   * Busca estatísticas de pedidos
   */
  async getEstatisticasPedidos(filters = {}) {
    try {
      console.log('📊 PrimePedidosService: Buscando estatísticas...', filters);

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      // Buscar TODOS os pedidos (sem limite)
      let query = supabaseWithSchema
        .from('prime_pedidos')
        .select('status_geral, status_aprovacao, status_entrega, valor_total, data_criacao');

      // Aplicar filtros de data se fornecidos
      if (filters.dataInicio) {
        query = query.gte('data_criacao', filters.dataInicio);
      }
      if (filters.dataFim) {
        query = query.lte('data_criacao', filters.dataFim);
      }

      // Usar paginação para buscar TODOS os registros
      const { data, error } = await this.buscarTodosRegistros(query);

      if (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        throw error;
      }

      console.log(`📊 Total de pedidos encontrados: ${data.length}`);

      // Calcular estatísticas
      const estatisticas = {
        totalPedidos: data.length,
        porStatusGeral: {},
        porStatusAprovacao: {},
        porStatusEntrega: {},
        valorTotal: 0,
        valorMedio: 0
      };

      data.forEach(pedido => {
        // Contar por status geral
        const statusGeral = pedido.status_geral || 'N/A';
        estatisticas.porStatusGeral[statusGeral] = (estatisticas.porStatusGeral[statusGeral] || 0) + 1;

        // Contar por status de aprovação
        const statusAprovacao = pedido.status_aprovacao || 'N/A';
        estatisticas.porStatusAprovacao[statusAprovacao] = (estatisticas.porStatusAprovacao[statusAprovacao] || 0) + 1;

        // Contar por status de entrega
        const statusEntrega = pedido.status_entrega || 'N/A';
        estatisticas.porStatusEntrega[statusEntrega] = (estatisticas.porStatusEntrega[statusEntrega] || 0) + 1;

        // Somar valores
        estatisticas.valorTotal += parseFloat(pedido.valor_total || 0);
      });

      estatisticas.valorMedio = estatisticas.totalPedidos > 0 
        ? estatisticas.valorTotal / estatisticas.totalPedidos 
        : 0;

      console.log('📊 Estatísticas calculadas:', estatisticas);

      return {
        success: true,
        data: estatisticas
      };

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  },

  /**
   * Busca todos os registros usando paginação
   */
  async buscarTodosRegistros(query) {
    const pageSize = 1000;
    let allData = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await query.range(offset, offset + pageSize - 1);
      
      if (error) {
        return { data: null, error };
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        offset += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return { data: allData, error: null };
  },

  /**
   * Busca opções de filtros disponíveis
   */
  async getFiltrosDisponiveis() {
    try {
      console.log('🔍 PrimePedidosService: Buscando filtros disponíveis...');

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      // Buscar status únicos
      const { data: statusGeral, error: errorStatusGeral } = await supabaseWithSchema
        .from('prime_pedidos')
        .select('status_geral')
        .not('status_geral', 'is', null);

      const { data: statusAprovacao, error: errorStatusAprovacao } = await supabaseWithSchema
        .from('prime_pedidos')
        .select('status_aprovacao')
        .not('status_aprovacao', 'is', null);

      const { data: statusEntrega, error: errorStatusEntrega } = await supabaseWithSchema
        .from('prime_pedidos')
        .select('status_entrega')
        .not('status_entrega', 'is', null);

      if (errorStatusGeral || errorStatusAprovacao || errorStatusEntrega) {
        throw new Error('Erro ao buscar filtros disponíveis');
      }

      // Extrair valores únicos
      const statusGeralUnicos = [...new Set(statusGeral.map(s => s.status_geral))];
      const statusAprovacaoUnicos = [...new Set(statusAprovacao.map(s => s.status_aprovacao))];
      const statusEntregaUnicos = [...new Set(statusEntrega.map(s => s.status_entrega))];

      return {
        success: true,
        data: {
          statusGeral: statusGeralUnicos,
          statusAprovacao: statusAprovacaoUnicos,
          statusEntrega: statusEntregaUnicos
        }
      };

    } catch (error) {
      console.error('❌ Erro ao buscar filtros disponíveis:', error);
      throw error;
    }
  }
};

export default primePedidosService;
