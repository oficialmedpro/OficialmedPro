/**
 * 🏥 SERVIÇO PARA CLIENTES PRIME
 * 
 * Gerencia busca e filtros de clientes do sistema Prime
 */

import { supabase, getSupabaseWithSchema } from './supabase.js';
import { supabaseUrl, supabaseAnonKey, supabaseSchema } from '../config/supabase.js';

export const primeClientesService = {
  /**
   * Busca todos os clientes com paginação
   */
  async getClientes(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        searchType = 'nome', // 'nome', 'telefone', 'req'
        orderBy = 'nome',
        orderDirection = 'asc'
      } = options;

      console.log('🔍 PrimeClientesService: Buscando clientes...', options);

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      let query = supabaseWithSchema
        .from('prime_clientes')
        .select('*', { count: 'exact' })
        .eq('ativo', true); // Apenas clientes ativos

      // Filtro de busca baseado no tipo
      if (search) {
        if (searchType === 'nome') {
          query = query.ilike('nome', `%${search}%`);
        } else if (searchType === 'telefone') {
          query = query.ilike('telefone', `%${search}%`);
        } else if (searchType === 'req') {
          // Buscar por REQ nos pedidos associados
          const { data: pedidosComReq, error: pedidosError } = await supabaseWithSchema
            .from('prime_pedidos')
            .select('cliente_id')
            .ilike('requisicao1', `%${search}%`);
          
          if (pedidosError) {
            console.error('❌ Erro ao buscar pedidos por REQ:', pedidosError);
            throw pedidosError;
          }
          
          const clientesIds = pedidosComReq.map(p => p.cliente_id);
          if (clientesIds.length > 0) {
            query = query.in('id', clientesIds);
          } else {
            // Se não há pedidos com essa REQ, retornar vazio
            return {
              success: true,
              data: [],
              pagination: { page, pageSize, total: 0, totalPages: 0 }
            };
          }
        } else if (searchType === 'todos') {
          // Busca em nome, telefone e REQ
          const { data: pedidosComReq, error: pedidosError } = await supabaseWithSchema
            .from('prime_pedidos')
            .select('cliente_id')
            .ilike('requisicao1', `%${search}%`);
          
          if (pedidosError) {
            console.error('❌ Erro ao buscar pedidos por REQ:', pedidosError);
            throw pedidosError;
          }
          
          const clientesIds = pedidosComReq.map(p => p.cliente_id);
          
          query = query.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%${clientesIds.length > 0 ? `,id.in.(${clientesIds.join(',')})` : ''}`);
        }
      }

      // Ordenação com tratamento de erro
      try {
        query = query.order(orderBy, { ascending: orderDirection === 'asc' });
      } catch (orderError) {
        console.warn(`⚠️ Campo de ordenação '${orderBy}' não encontrado, usando 'nome' como fallback`);
        query = query.order('nome', { ascending: orderDirection === 'asc' });
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao buscar clientes:', error);
        console.error('❌ Detalhes do erro:', error.message);
        throw error;
      }

      console.log(`✅ Clientes encontrados: ${data?.length || 0} de ${count || 0}`);

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
      console.error('❌ Erro no PrimeClientesService:', error);
      throw error;
    }
  },

  /**
   * Busca cliente por ID
   */
  async getClienteById(id) {
    try {
      console.log('🔍 PrimeClientesService: Buscando cliente por ID:', id);

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      const { data, error } = await supabaseWithSchema
        .from('prime_clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar cliente:', error);
        throw error;
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Erro ao buscar cliente por ID:', error);
      throw error;
    }
  },

  /**
   * Busca cliente por código original
   */
  async getClienteByCodigo(codigo) {
    try {
      console.log('🔍 PrimeClientesService: Buscando cliente por código:', codigo);

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      const { data, error } = await supabaseWithSchema
        .from('prime_clientes')
        .select('*')
        .eq('codigo_cliente_original', codigo)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar cliente por código:', error);
        throw error;
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Erro ao buscar cliente por código:', error);
      throw error;
    }
  },

  /**
   * Busca estatísticas detalhadas dos clientes
   */
  async getEstatisticasClientes() {
    try {
      console.log('📊 PrimeClientesService: Buscando estatísticas detalhadas...');

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      // Buscar TODOS os clientes ativos usando paginação
      const clientesData = await this.buscarTodosClientes(supabaseWithSchema);
      
      // Buscar TODOS os pedidos aprovados usando paginação
      const pedidosAprovados = await this.buscarTodosPedidosAprovados(supabaseWithSchema);
      
      // Buscar TODOS os pedidos (independente do status) para estatísticas gerais
      const todosPedidos = await this.buscarTodosPedidos(supabaseWithSchema);

      console.log(`📊 Clientes encontrados: ${clientesData.length}`);
      console.log(`📊 Pedidos aprovados encontrados: ${pedidosAprovados.length}`);
      console.log(`📊 Total de pedidos encontrados: ${todosPedidos.length}`);

      // Agrupar pedidos por cliente
      const pedidosPorCliente = {};
      pedidosAprovados.forEach(pedido => {
        if (!pedidosPorCliente[pedido.cliente_id]) {
          pedidosPorCliente[pedido.cliente_id] = [];
        }
        pedidosPorCliente[pedido.cliente_id].push(pedido);
      });

      // Calcular estatísticas de comportamento de compra
      let clientesNuncaCompraram = 0;
      let clientesCompraUnica = 0;
      let clientesRecompra = 0;
      let totalValorCompras = 0;

      clientesData.forEach(cliente => {
        const pedidosCliente = pedidosPorCliente[cliente.id] || [];
        
        if (pedidosCliente.length === 0) {
          clientesNuncaCompraram++;
        } else if (pedidosCliente.length === 1) {
          clientesCompraUnica++;
        } else {
          clientesRecompra++;
        }

        // Somar valor total das compras
        pedidosCliente.forEach(pedido => {
          totalValorCompras += parseFloat(pedido.valor_total || 0);
        });
      });

      console.log(`📊 Estatísticas de comportamento:`);
      console.log(`- Nunca compraram: ${clientesNuncaCompraram}`);
      console.log(`- Compra única: ${clientesCompraUnica}`);
      console.log(`- Recompra: ${clientesRecompra}`);
      console.log(`- Total pedidos aprovados: ${pedidosAprovados.length}`);

      // Calcular estatísticas de dados cadastrais
      const clientesComEmail = clientesData.filter(c => c.email && c.email.trim() !== '').length;
      const clientesComDataNascimento = clientesData.filter(c => c.data_nascimento).length;
      const clientesComEndereco = clientesData.filter(c => c.endereco_logradouro && c.endereco_logradouro.trim() !== '').length;
      
      // Buscar dados de CPF e telefone para estatísticas completas
      const clientesCompleto = await this.buscarTodosClientesCompletos(supabaseWithSchema);
      const clientesComCpf = clientesCompleto.filter(c => c.cpf_cnpj && c.cpf_cnpj.trim() !== '').length;
      const clientesComTelefone = clientesCompleto.filter(c => c.telefone && c.telefone.trim() !== '').length;
      
      // Clientes com dados completos (CPF, email, data nascimento, endereço, telefone)
      const clientesComDadosCompletos = clientesCompleto.filter(c => 
        c.cpf_cnpj && c.cpf_cnpj.trim() !== '' &&
        c.email && c.email.trim() !== '' &&
        c.data_nascimento &&
        c.endereco_logradouro && c.endereco_logradouro.trim() !== '' &&
        c.telefone && c.telefone.trim() !== ''
      ).length;

      // Calcular estatísticas gerais de pedidos
      const valorTotalTodosPedidos = todosPedidos.reduce((acc, pedido) => {
        return acc + parseFloat(pedido.valor_total || 0);
      }, 0);

      const ticketMedioTodosPedidos = todosPedidos.length > 0 ? valorTotalTodosPedidos / todosPedidos.length : 0;

      const estatisticas = {
        // Estatísticas básicas
        totalClientes: clientesData.length,
        totalPedidos: todosPedidos.length, // TODOS os pedidos
        totalOrcamentos: todosPedidos.length, // Orçamentos = Pedidos
        totalPedidosAprovados: pedidosAprovados.length,
        valorTotalCompras: totalValorCompras,
        valorTotalTodosPedidos: valorTotalTodosPedidos,
        ticketMedio: pedidosAprovados.length > 0 ? totalValorCompras / pedidosAprovados.length : 0,
        ticketMedioTodosPedidos: ticketMedioTodosPedidos,

        // Comportamento de compra
        comportamentoCompra: {
          nuncaCompraram: clientesNuncaCompraram,
          compraUnica: clientesCompraUnica,
          recompra: clientesRecompra
        },

        // Dados cadastrais
        dadosCadastrais: {
          comEmail: clientesComEmail,
          comDataNascimento: clientesComDataNascimento,
          comEndereco: clientesComEndereco,
          comCpf: clientesComCpf,
          comTelefone: clientesComTelefone,
          comDadosCompletos: clientesComDadosCompletos,
          semEmail: clientesData.length - clientesComEmail,
          semDataNascimento: clientesData.length - clientesComDataNascimento,
          semEndereco: clientesData.length - clientesComEndereco
        }
      };

      console.log('📊 Estatísticas detalhadas calculadas:', estatisticas);

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
   * Busca TODOS os clientes usando paginação
   */
  async buscarTodosClientes(supabaseWithSchema) {
    const pageSize = 1000;
    let allData = [];
    let offset = 0;
    let hasMore = true;

    console.log('📄 Buscando TODOS os clientes com paginação...');

    while (hasMore) {
      const { data, error } = await supabaseWithSchema
        .from('prime_clientes')
        .select('id, nome, email, data_nascimento, endereco_logradouro, total_orcamentos_aprovados, valor_total_aprovados')
        .eq('ativo', true)
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('❌ Erro ao buscar clientes:', error);
        throw error;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        offset += pageSize;
        hasMore = data.length === pageSize;
        console.log(`📄 Clientes carregados: ${allData.length}`);
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Total de clientes carregados: ${allData.length}`);
    return allData;
  },

  /**
   * Busca TODOS os pedidos aprovados usando paginação
   */
  async buscarTodosPedidosAprovados(supabaseWithSchema) {
    const pageSize = 1000;
    let allData = [];
    let offset = 0;
    let hasMore = true;

    console.log('📄 Buscando TODOS os pedidos aprovados com paginação...');

    while (hasMore) {
      const { data, error } = await supabaseWithSchema
        .from('prime_pedidos')
        .select('cliente_id, valor_total, data_aprovacao')
        .eq('status_aprovacao', 'APROVADO')
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('❌ Erro ao buscar pedidos aprovados:', error);
        throw error;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        offset += pageSize;
        hasMore = data.length === pageSize;
        console.log(`📄 Pedidos aprovados carregados: ${allData.length}`);
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Total de pedidos aprovados carregados: ${allData.length}`);
    return allData;
  },

  /**
   * Busca TODOS os pedidos (independente do status) usando paginação
   */
  async buscarTodosPedidos(supabaseWithSchema) {
    const pageSize = 1000;
    let allData = [];
    let offset = 0;
    let hasMore = true;

    console.log('📄 Buscando TODOS os pedidos com paginação...');

    while (hasMore) {
      const { data, error } = await supabaseWithSchema
        .from('prime_pedidos')
        .select('id, cliente_id, valor_total, status_aprovacao, status_entrega, data_criacao')
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('❌ Erro ao buscar todos os pedidos:', error);
        throw error;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        offset += pageSize;
        hasMore = data.length === pageSize;
        console.log(`📄 Pedidos carregados: ${allData.length}`);
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Total de pedidos carregados: ${allData.length}`);
    return allData;
  },

  /**
   * Busca TODOS os clientes com dados completos usando paginação
   */
  async buscarTodosClientesCompletos(supabaseWithSchema) {
    const pageSize = 1000;
    let allData = [];
    let offset = 0;
    let hasMore = true;

    console.log('📄 Buscando TODOS os clientes com dados completos...');

    while (hasMore) {
      const { data, error } = await supabaseWithSchema
        .from('prime_clientes')
        .select('id, nome, cpf_cnpj, email, data_nascimento, endereco_logradouro, telefone')
        .eq('ativo', true)
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('❌ Erro ao buscar clientes completos:', error);
        throw error;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        offset += pageSize;
        hasMore = data.length === pageSize;
        console.log(`📄 Clientes completos carregados: ${allData.length}`);
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Total de clientes completos carregados: ${allData.length}`);
    return allData;
  },

  /**
   * Busca clientes por comportamento de compra
   */
  async getClientesPorComportamento(tipoComportamento, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        orderBy = 'nome',
        orderDirection = 'asc'
      } = options;

      console.log(`🔍 PrimeClientesService: Buscando clientes por comportamento: ${tipoComportamento}`);

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      // Buscar pedidos aprovados para análise
      const { data: pedidosAprovados, error: pedidosError } = await supabaseWithSchema
        .from('prime_pedidos')
        .select('cliente_id')
        .eq('status_aprovacao', 'APROVADO');

      if (pedidosError) {
        console.error('❌ Erro ao buscar pedidos:', pedidosError);
        throw pedidosError;
      }

      // Agrupar pedidos por cliente
      const pedidosPorCliente = {};
      pedidosAprovados.forEach(pedido => {
        if (!pedidosPorCliente[pedido.cliente_id]) {
          pedidosPorCliente[pedido.cliente_id] = 0;
        }
        pedidosPorCliente[pedido.cliente_id]++;
      });

      console.log(`🔍 Debug - Total de pedidos aprovados: ${pedidosAprovados.length}`);
      console.log(`🔍 Debug - Clientes únicos com pedidos: ${Object.keys(pedidosPorCliente).length}`);
      
      // Contar quantos clientes têm exatamente 1 pedido
      const clientesComUmPedido = Object.values(pedidosPorCliente).filter(count => count === 1).length;
      console.log(`🔍 Debug - Clientes com exatamente 1 pedido: ${clientesComUmPedido}`);

      // Buscar clientes baseado no comportamento
      let query = supabaseWithSchema
        .from('prime_clientes')
        .select(`
          id,
          nome,
          cpf_cnpj,
          email,
          telefone,
          data_nascimento,
          endereco_logradouro,
          endereco_cidade,
          endereco_estado,
          endereco_uf,
          ativo,
          data_criacao
        `, { count: 'exact' })
        .eq('ativo', true);

      // Filtro de busca por nome
      if (search) {
        query = query.ilike('nome', `%${search}%`);
      }

      // Aplicar filtro de comportamento
      if (tipoComportamento === 'nunca_compraram') {
        // Clientes que não têm pedidos aprovados
        const clientesComPedidos = Object.keys(pedidosPorCliente).map(Number);
        if (clientesComPedidos.length > 0) {
          query = query.not('id', 'in', `(${clientesComPedidos.join(',')})`);
        }
      } else if (tipoComportamento === 'compra_unica') {
        // Clientes com exatamente 1 pedido aprovado
        const clientesComUmPedido = Object.keys(pedidosPorCliente)
          .filter(clienteId => pedidosPorCliente[clienteId] === 1)
          .map(Number);
        
        console.log(`🔍 Clientes com 1 pedido encontrados: ${clientesComUmPedido.length}`);
        
        if (clientesComUmPedido.length > 0) {
          query = query.in('id', clientesComUmPedido);
        } else {
          // Se não há clientes com 1 pedido, retornar vazio
          console.log('⚠️ Nenhum cliente com compra única encontrado');
          return {
            success: true,
            data: [],
            pagination: { page, pageSize, total: 0, totalPages: 0 }
          };
        }
      } else if (tipoComportamento === 'recompra') {
        // Clientes com mais de 1 pedido aprovado
        const clientesComMultiplosPedidos = Object.keys(pedidosPorCliente)
          .filter(clienteId => pedidosPorCliente[clienteId] > 1)
          .map(Number);
        
        console.log(`🔍 Clientes com múltiplos pedidos encontrados: ${clientesComMultiplosPedidos.length}`);
        
        if (clientesComMultiplosPedidos.length > 0) {
          query = query.in('id', clientesComMultiplosPedidos);
        } else {
          // Se não há clientes com múltiplos pedidos, retornar vazio
          console.log('⚠️ Nenhum cliente com recompra encontrado');
          return {
            success: true,
            data: [],
            pagination: { page, pageSize, total: 0, totalPages: 0 }
          };
        }
      }

      // Ordenação
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao buscar clientes por comportamento:', error);
        throw error;
      }

      console.log(`✅ Clientes ${tipoComportamento} encontrados: ${data?.length || 0} de ${count || 0}`);

      // Enriquecer dados com informações dos pedidos aprovados
      const clientesEnriquecidos = await Promise.all(
        (data || []).map(async (cliente) => {
          // Buscar pedidos aprovados deste cliente
          const { data: pedidosCliente } = await supabaseWithSchema
            .from('prime_pedidos')
            .select('valor_total, data_aprovacao')
            .eq('cliente_id', cliente.id)
            .eq('status_aprovacao', 'APROVADO')
            .order('data_aprovacao', { ascending: false });

          const totalPedidos = pedidosCliente?.length || 0;
          const valorTotal = pedidosCliente?.reduce((acc, pedido) => acc + parseFloat(pedido.valor_total || 0), 0) || 0;
          const ultimaCompra = pedidosCliente?.[0]?.data_aprovacao || null;

          return {
            ...cliente,
            total_orcamentos: totalPedidos,
            valor_total_orcamentos: valorTotal,
            ultima_compra: ultimaCompra
          };
        })
      );

      return {
        success: true,
        data: clientesEnriquecidos,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      };

    } catch (error) {
      console.error('❌ Erro ao buscar clientes por comportamento:', error);
      throw error;
    }
  },

  /**
   * Busca clientes por dados cadastrais
   */
  async getClientesPorDadosCadastrais(tipoDado, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        orderBy = 'nome',
        orderDirection = 'asc'
      } = options;

      console.log(`🔍 PrimeClientesService: Buscando clientes por dados cadastrais: ${tipoDado}`);

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      let query = supabaseWithSchema
        .from('prime_clientes')
        .select('*', { count: 'exact' })
        .eq('ativo', true);

      // Filtro de busca por nome
      if (search) {
        query = query.ilike('nome', `%${search}%`);
      }

      // Aplicar filtro de dados cadastrais
      if (tipoDado === 'com_email') {
        query = query.not('email', 'is', null).neq('email', '');
      } else if (tipoDado === 'sem_email') {
        query = query.or('email.is.null,email.eq.');
      } else if (tipoDado === 'com_data_nascimento') {
        query = query.not('data_nascimento', 'is', null);
      } else if (tipoDado === 'sem_data_nascimento') {
        query = query.is('data_nascimento', null);
      } else if (tipoDado === 'com_endereco') {
        query = query.not('endereco_logradouro', 'is', null).neq('endereco_logradouro', '');
      } else if (tipoDado === 'sem_endereco') {
        query = query.or('endereco_logradouro.is.null,endereco_logradouro.eq.');
      } else if (tipoDado === 'com_cpf') {
        query = query.not('cpf_cnpj', 'is', null).neq('cpf_cnpj', '');
      } else if (tipoDado === 'sem_cpf') {
        query = query.or('cpf_cnpj.is.null,cpf_cnpj.eq.');
      } else if (tipoDado === 'com_telefone') {
        query = query.not('telefone', 'is', null).neq('telefone', '');
      } else if (tipoDado === 'sem_telefone') {
        query = query.or('telefone.is.null,telefone.eq.');
      } else if (tipoDado === 'com_dados_completos') {
        query = query
          .not('cpf_cnpj', 'is', null).neq('cpf_cnpj', '')
          .not('email', 'is', null).neq('email', '')
          .not('data_nascimento', 'is', null)
          .not('endereco_logradouro', 'is', null).neq('endereco_logradouro', '')
          .not('telefone', 'is', null).neq('telefone', '');
      }

      // Ordenação
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao buscar clientes por dados cadastrais:', error);
        throw error;
      }

      console.log(`✅ Clientes ${tipoDado} encontrados: ${data?.length || 0} de ${count || 0}`);

      // Enriquecer dados com informações dos pedidos aprovados
      const clientesEnriquecidos = await Promise.all(
        (data || []).map(async (cliente) => {
          // Buscar pedidos aprovados deste cliente
          const { data: pedidosCliente } = await supabaseWithSchema
            .from('prime_pedidos')
            .select('valor_total, data_aprovacao')
            .eq('cliente_id', cliente.id)
            .eq('status_aprovacao', 'APROVADO')
            .order('data_aprovacao', { ascending: false });

          const totalPedidos = pedidosCliente?.length || 0;
          const valorTotal = pedidosCliente?.reduce((acc, pedido) => acc + parseFloat(pedido.valor_total || 0), 0) || 0;
          const ultimaCompra = pedidosCliente?.[0]?.data_aprovacao || null;

          return {
            ...cliente,
            total_orcamentos: totalPedidos,
            valor_total_orcamentos: valorTotal,
            ultima_compra: ultimaCompra
          };
        })
      );

      return {
        success: true,
        data: clientesEnriquecidos,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      };

    } catch (error) {
      console.error('❌ Erro ao buscar clientes por dados cadastrais:', error);
      throw error;
    }
  },

  /**
   * Busca estatísticas da matriz RFV
   */
  async getEstatisticasRFV() {
    try {
      console.log('📊 PrimeClientesService: Buscando estatísticas da matriz RFV...');

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      // Buscar todos os clientes ativos
      const clientesData = await this.buscarTodosClientes(supabaseWithSchema);
      
      // Buscar todos os pedidos aprovados
      const pedidosAprovados = await this.buscarTodosPedidosAprovados(supabaseWithSchema);

      // Agrupar pedidos por cliente
      const pedidosPorCliente = {};
      pedidosAprovados.forEach(pedido => {
        if (!pedidosPorCliente[pedido.cliente_id]) {
          pedidosPorCliente[pedido.cliente_id] = [];
        }
        pedidosPorCliente[pedido.cliente_id].push(pedido);
      });

      const hoje = new Date();
      const noventaDiasAtras = new Date(hoje.getTime() - (90 * 24 * 60 * 60 * 1000));
      const sessentaDiasAtras = new Date(hoje.getTime() - (60 * 24 * 60 * 60 * 1000));
      const trintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
      const quinzeDiasAtras = new Date(hoje.getTime() - (15 * 24 * 60 * 60 * 1000));

      // Calcular segmentos RFV
      let ativacao = 0;
      let reativacao = 0;
      let monitoramento15_30 = 0;
      let monitoramento30_60 = 0;
      let monitoramento60_90 = 0;

      clientesData.forEach(cliente => {
        const pedidosCliente = pedidosPorCliente[cliente.id] || [];
        
        if (pedidosCliente.length === 0) {
          // Nunca comprou - ATIVAÇÃO
          ativacao++;
        } else {
          // Encontrar último pedido
          const ultimoPedido = pedidosCliente.reduce((maisRecente, pedido) => {
            const dataPedido = new Date(pedido.data_aprovacao);
            const dataMaisRecente = new Date(maisRecente.data_aprovacao);
            return dataPedido > dataMaisRecente ? pedido : maisRecente;
          });

          const dataUltimaCompra = new Date(ultimoPedido.data_aprovacao);
          const diasSemComprar = Math.floor((hoje - dataUltimaCompra) / (1000 * 60 * 60 * 24));

          if (diasSemComprar > 90) {
            // Mais de 90 dias - REATIVAÇÃO
            reativacao++;
          } else if (diasSemComprar >= 60 && diasSemComprar <= 90) {
            // 60-90 dias - MONITORAMENTO
            monitoramento60_90++;
          } else if (diasSemComprar >= 30 && diasSemComprar < 60) {
            // 30-60 dias - MONITORAMENTO
            monitoramento30_60++;
          } else if (diasSemComprar >= 15 && diasSemComprar < 30) {
            // 15-30 dias - MONITORAMENTO
            monitoramento15_30++;
          }
        }
      });

      const estatisticas = {
        ativacao: {
          total: ativacao,
          potencial: ativacao // Mesmo valor para potencial
        },
        reativacao: {
          total: reativacao,
          perdidos: reativacao // Mesmo valor para perdidos
        },
        monitoramento: {
          periodo15_30: monitoramento15_30,
          periodo30_60: monitoramento30_60,
          periodo60_90: monitoramento60_90,
          total: monitoramento15_30 + monitoramento30_60 + monitoramento60_90
        }
      };

      console.log('📊 Estatísticas RFV calculadas:', estatisticas);

      return {
        success: true,
        data: estatisticas
      };

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas RFV:', error);
      throw error;
    }
  },

  /**
   * Busca clientes por segmento RFV
   */
  async getClientesPorSegmentoRFV(segmento, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = ''
      } = options;

      console.log(`🔍 PrimeClientesService: Buscando clientes por segmento RFV: ${segmento}`);

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      // Buscar todos os clientes ativos
      const clientesData = await this.buscarTodosClientes(supabaseWithSchema);
      
      // Buscar todos os pedidos aprovados
      const pedidosAprovados = await this.buscarTodosPedidosAprovados(supabaseWithSchema);

      // Agrupar pedidos por cliente
      const pedidosPorCliente = {};
      pedidosAprovados.forEach(pedido => {
        if (!pedidosPorCliente[pedido.cliente_id]) {
          pedidosPorCliente[pedido.cliente_id] = [];
        }
        pedidosPorCliente[pedido.cliente_id].push(pedido);
      });

      const hoje = new Date();
      const noventaDiasAtras = new Date(hoje.getTime() - (90 * 24 * 60 * 60 * 1000));
      const sessentaDiasAtras = new Date(hoje.getTime() - (60 * 24 * 60 * 60 * 1000));
      const trintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
      const quinzeDiasAtras = new Date(hoje.getTime() - (15 * 24 * 60 * 60 * 1000));

      // Filtrar clientes por segmento
      let clientesFiltrados = [];

      clientesData.forEach(cliente => {
        const pedidosCliente = pedidosPorCliente[cliente.id] || [];
        
        if (segmento === 'ativacao' && pedidosCliente.length === 0) {
          // Nunca comprou - ATIVAÇÃO
          clientesFiltrados.push({
            ...cliente,
            ultima_compra: null,
            dias_sem_comprar: null
          });
        } else if (pedidosCliente.length > 0) {
          // Encontrar último pedido
          const ultimoPedido = pedidosCliente.reduce((maisRecente, pedido) => {
            const dataPedido = new Date(pedido.data_aprovacao);
            const dataMaisRecente = new Date(maisRecente.data_aprovacao);
            return dataPedido > dataMaisRecente ? pedido : maisRecente;
          });

          const dataUltimaCompra = new Date(ultimoPedido.data_aprovacao);
          const diasSemComprar = Math.floor((hoje - dataUltimaCompra) / (1000 * 60 * 60 * 24));

          if (segmento === 'reativacao' && diasSemComprar > 90) {
            // Mais de 90 dias - REATIVAÇÃO
            clientesFiltrados.push({
              ...cliente,
              ultima_compra: ultimoPedido.data_aprovacao,
              dias_sem_comprar: diasSemComprar
            });
          } else if (segmento === 'monitoramento' && diasSemComprar >= 15 && diasSemComprar <= 90) {
            // 15-90 dias - MONITORAMENTO
            clientesFiltrados.push({
              ...cliente,
              ultima_compra: ultimoPedido.data_aprovacao,
              dias_sem_comprar: diasSemComprar
            });
          }
        }
      });

      // Aplicar filtro de busca
      if (search) {
        clientesFiltrados = clientesFiltrados.filter(cliente => 
          cliente.nome.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Paginação
      const total = clientesFiltrados.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = clientesFiltrados.slice(startIndex, endIndex);

      console.log(`✅ Clientes ${segmento} encontrados: ${paginatedData.length} de ${total}`);

      return {
        success: true,
        data: paginatedData,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };

    } catch (error) {
      console.error('❌ Erro ao buscar clientes por segmento RFV:', error);
      throw error;
    }
  },

  /**
   * Busca dados geográficos dos clientes
   */
  async getDadosGeograficos() {
    try {
      console.log('🌍 PrimeClientesService: Buscando dados geográficos...');

      const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema);
      
      // Buscar clientes com endereço
      const { data: clientesComEndereco, error: clientesError } = await supabaseWithSchema
        .from('prime_clientes')
        .select('id, nome, endereco_cidade, endereco_estado, endereco_uf, valor_total_aprovados')
        .eq('ativo', true)
        .not('endereco_cidade', 'is', null)
        .neq('endereco_cidade', '');

      if (clientesError) {
        console.error('❌ Erro ao buscar clientes com endereço:', clientesError);
        throw clientesError;
      }

      // Agrupar por cidade
      const cidadesMap = {};
      const estadosMap = {};

      clientesComEndereco.forEach(cliente => {
        const cidade = cliente.endereco_cidade;
        const estado = cliente.endereco_estado;
        const uf = cliente.endereco_uf;

        if (!cidadesMap[cidade]) {
          cidadesMap[cidade] = {
            nome: cidade,
            estado: estado,
            uf: uf,
            totalClientes: 0,
            valorTotal: 0
          };
        }

        cidadesMap[cidade].totalClientes++;
        cidadesMap[cidade].valorTotal += parseFloat(cliente.valor_total_aprovados || 0);

        if (!estadosMap[uf]) {
          estadosMap[uf] = {
            nome: estado,
            uf: uf,
            totalClientes: 0,
            valorTotal: 0
          };
        }

        estadosMap[uf].totalClientes++;
        estadosMap[uf].valorTotal += parseFloat(cliente.valor_total_aprovados || 0);
      });

      // Converter para arrays e calcular estatísticas
      const cidades = Object.values(cidadesMap).map(cidade => ({
        ...cidade,
        ticketMedio: cidade.totalClientes > 0 ? cidade.valorTotal / cidade.totalClientes : 0,
        percentual: 0 // Será calculado depois
      }));

      const estados = Object.values(estadosMap);

      // Calcular percentuais
      const totalClientesComEndereco = clientesComEndereco.length;
      cidades.forEach(cidade => {
        cidade.percentual = (cidade.totalClientes / totalClientesComEndereco) * 100;
      });

      // Ordenar cidades por número de clientes
      cidades.sort((a, b) => b.totalClientes - a.totalClientes);

      const dados = {
        cidades: cidades,
        estados: estados,
        estatisticas: {
          totalCidades: cidades.length,
          totalEstados: estados.length,
          clientesComEndereco: totalClientesComEndereco,
          coberturaNacional: (estados.length / 27) * 100 // 27 estados + DF
        }
      };

      console.log('🌍 Dados geográficos calculados:', dados.estatisticas);

      return {
        success: true,
        data: dados
      };

    } catch (error) {
      console.error('❌ Erro ao buscar dados geográficos:', error);
      throw error;
    }
  }
};

export default primeClientesService;
