import { supabase } from './supabase';

/**
 * Service para análise RFV (Recência, Frequência, Valor) de clientes
 * Baseado em oportunidades ganhas (vendas fechadas)
 */

export const rfvService = {
  /**
   * Busca dados RFV de clientes baseado em oportunidades ganhas
   */
  async getRFVAnalysis(filters = {}) {
    try {
      console.log('🔍 Iniciando análise RFV...');

      // Buscar dados simples primeiro
      console.log('🔍 Buscando oportunidades da tabela...');

      let query = supabase
        .from('oportunidade')
        .select('*')
        .limit(100); // Limitar para teste inicial

      const { data: oportunidades, error } = await query;

      if (error) {
        console.error('Erro ao buscar oportunidades:', error);
        throw error;
      }

      console.log(`📊 ${oportunidades?.length || 0} oportunidades encontradas`);

      if (oportunidades && oportunidades.length > 0) {
        console.log('📋 Estrutura da primeira oportunidade:', oportunidades[0]);
        console.log('🔑 Campos disponíveis:', Object.keys(oportunidades[0]));
      } else {
        console.log('⚠️ Nenhuma oportunidade encontrada na tabela');
      }

      // Agrupar por cliente e calcular métricas RFV
      const clientesRFV = this.calculateRFVMetrics(oportunidades);

      // Classificar clientes em segmentos RFV
      const segmentedClients = this.classifyRFVSegments(clientesRFV);

      // Calcular faturamento total usando os nomes corretos dos campos
      const totalFaturamento = oportunidades.reduce((sum, op) => {
        const valor = op.valor || op.price || op.amount || 0;
        return sum + (Number(valor) || 0);
      }, 0);

      console.log(`💰 Faturamento total calculado: R$ ${totalFaturamento.toLocaleString('pt-BR')}`);

      return {
        totalClientes: clientesRFV.length,
        totalOportunidades: oportunidades.length,
        totalFaturamento,
        clientes: clientesRFV,
        segmentos: segmentedClients,
        distributionData: this.getDistributionData(segmentedClients),
        matrixData: this.getMatrixData(segmentedClients)
      };

    } catch (error) {
      console.error('Erro no serviço RFV:', error);
      throw error;
    }
  },

  /**
   * Calcula métricas RFV para cada cliente (usando lead_id como identificador)
   */
  calculateRFVMetrics(oportunidades) {
    console.log('🔄 Iniciando cálculo de métricas RFV...');

    if (!oportunidades || oportunidades.length === 0) {
      console.log('⚠️ Nenhuma oportunidade recebida para calcular RFV');
      return [];
    }

    const clientesMap = new Map();
    const hoje = new Date();

    console.log('📊 Analisando estrutura dos dados...');
    if (oportunidades.length > 0) {
      console.log('🔍 Exemplo de oportunidade:', oportunidades[0]);
    }

    // Para cada oportunidade, vamos tentar extrair o que conseguirmos
    oportunidades.forEach((op, index) => {
      if (index === 0) {
        console.log('🔍 Processando primeira oportunidade:', op);
      }

      // Tentar diferentes campos para identificar o cliente
      const leadId = op.lead_id || op.cliente_id || op.leadId || op.clienteId || op.id || `cliente_${index}`;

      if (!clientesMap.has(leadId)) {
        clientesMap.set(leadId, {
          lead_id: leadId,
          oportunidades: [],
          totalValor: 0,
          frequencia: 0,
          ultimaCompra: null,
          primeiraCompra: null,
          recencia: 0
        });
      }

      const cliente = clientesMap.get(leadId);
      cliente.oportunidades.push(op);

      // Tentar extrair valor de diferentes campos
      const valor = Number(op.valor) || Number(op.price) || Number(op.amount) || Number(op.total) || 0;
      cliente.totalValor += valor;
      cliente.frequencia++;

      // Tentar extrair data de diferentes campos
      const dataStr = op.data_fechamento || op.created_at || op.updated_at || op.date;
      if (dataStr) {
        const dataFechamento = new Date(dataStr);

        if (!isNaN(dataFechamento.getTime())) {
          if (!cliente.ultimaCompra || dataFechamento > cliente.ultimaCompra) {
            cliente.ultimaCompra = dataFechamento;
          }
          if (!cliente.primeiraCompra || dataFechamento < cliente.primeiraCompra) {
            cliente.primeiraCompra = dataFechamento;
          }
        }
      }
    });

    // Calcular recência em dias
    clientesMap.forEach(cliente => {
      if (cliente.ultimaCompra && !isNaN(cliente.ultimaCompra.getTime())) {
        const diffTime = hoje - cliente.ultimaCompra;
        cliente.recencia = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // dias
      } else {
        cliente.recencia = 999; // Valor alto para clientes sem data válida
      }
    });

    const clientes = Array.from(clientesMap.values());
    console.log(`📊 ${clientes.length} clientes únicos processados`);

    // Log resumo dos dados processados
    const totalValor = clientes.reduce((sum, c) => sum + c.totalValor, 0);
    const totalOportunidades = clientes.reduce((sum, c) => sum + c.frequencia, 0);
    console.log(`💰 Total valor: R$ ${totalValor.toLocaleString('pt-BR')}`);
    console.log(`🎯 Total oportunidades: ${totalOportunidades}`);

    return clientes;
  },

  /**
   * Classifica clientes em quintis RFV e segmentos
   */
  classifyRFVSegments(clientes) {
    if (!clientes || clientes.length === 0) {
      console.log('⚠️ Nenhum cliente para classificar');
      return [];
    }

    console.log(`📊 Classificando ${clientes.length} clientes em segmentos RFV`);

    // Calcular quintis para cada métrica
    const recencias = clientes.map(c => c.recencia).sort((a, b) => a - b);
    const frequencias = clientes.map(c => c.frequencia).sort((a, b) => b - a); // Desc: maior é melhor
    const valores = clientes.map(c => c.totalValor).sort((a, b) => b - a); // Desc: maior é melhor

    const getQuintil = (array, value, reverse = false) => {
      if (!array || array.length === 0) return 1;

      const len = array.length;
      let index = array.indexOf(value);

      // Se não encontrar o valor exato, encontrar a posição aproximada
      if (index === -1) {
        index = array.findIndex(v => reverse ? v >= value : v <= value);
        if (index === -1) index = len - 1;
      }

      const percentile = index / Math.max(len - 1, 1);

      if (reverse) {
        // Para recência: menor valor = melhor score
        return percentile <= 0.2 ? 5 :
               percentile <= 0.4 ? 4 :
               percentile <= 0.6 ? 3 :
               percentile <= 0.8 ? 2 : 1;
      } else {
        // Para frequência e valor: maior valor = melhor score
        return percentile >= 0.8 ? 5 :
               percentile >= 0.6 ? 4 :
               percentile >= 0.4 ? 3 :
               percentile >= 0.2 ? 2 : 1;
      }
    };

    // Classificar cada cliente
    const clientesSegmentados = clientes.map(cliente => {
      const R = getQuintil(recencias, cliente.recencia, true);
      const F = getQuintil(frequencias, cliente.frequencia);
      const V = getQuintil(valores, cliente.totalValor);

      // Determinar segmento baseado em RFV
      const segmento = this.determineSegment(R, F, V);

      return {
        ...cliente,
        R, F, V,
        segmento,
        ticketMedio: cliente.totalValor / cliente.frequencia
      };
    });

    return clientesSegmentados;
  },

  /**
   * Determina o segmento do cliente baseado nos scores RFV
   */
  determineSegment(R, F, V) {
    // Lógica completa de segmentação RFV baseada na matriz

    // Campeões - R5, F5, V5
    if (R >= 5 && F >= 5 && V >= 5) return 'Campeões';

    // Clientes fiéis - R4/R5, F4/F5, V4/V5
    if (R >= 4 && F >= 4 && V >= 4) return 'Clientes fiéis';

    // Potenciais fiéis - R4/R5, F3/F4, V3/V4
    if (R >= 4 && F >= 3 && V >= 3) return 'Potenciais fiéis';

    // Novos - R5, F1, V1
    if (R >= 5 && F <= 1 && V <= 2) return 'Novos';

    // Promissores - R4, F1, V1
    if (R >= 4 && F <= 1 && V <= 2) return 'Promissores';

    // Potenciais leais - R3, F3, V3
    if (R >= 3 && F >= 3 && V >= 3) return 'Potenciais leais';

    // Precisam atenção - R4, F2, V2
    if (R >= 4 && F <= 2 && V <= 2) return 'Precisam atenção';

    // Não pode perder - R1/R2, F5, V5
    if (R <= 2 && F >= 5 && V >= 5) return 'Não pode perder';

    // Em risco - R2/R3, F3/F4, V3/V4
    if (R <= 3 && F >= 3 && V >= 3) return 'Em risco';

    // Hibernando - R1/R2, F1/F2, V1/V2
    if (R <= 2 && F <= 2 && V <= 2) return 'Hibernando';

    // Prestes a hibernar - R3, F1/F2, V1/V2
    if (R >= 3 && F <= 2 && V <= 2) return 'Prestes a hibernar';

    // Clientes recentes - R3, F1, V1
    if (R >= 3 && F <= 1 && V <= 1) return 'Clientes recentes';

    // Perdidos - R1, qualquer F, qualquer V
    if (R <= 1) return 'Perdidos';

    return 'Outros';
  },

  /**
   * Gera dados de distribuição para gráficos
   */
  getDistributionData(clientesSegmentados) {
    if (!clientesSegmentados || clientesSegmentados.length === 0) {
      console.log('⚠️ Nenhum cliente segmentado para gerar distribuição');
      return {
        recencia: [1, 2, 3, 4, 5].map(score => ({ score, count: 0, label: `R${score}` })),
        frequencia: [1, 2, 3, 4, 5].map(score => ({ score, count: 0, label: `F${score}` })),
        valor: [1, 2, 3, 4, 5].map(score => ({ score, count: 0, label: `V${score}` }))
      };
    }

    const recenciaData = [1, 2, 3, 4, 5].map(score => ({
      score,
      count: clientesSegmentados.filter(c => c.R === score).length,
      label: `R${score}`
    }));

    const frequenciaData = [1, 2, 3, 4, 5].map(score => ({
      score,
      count: clientesSegmentados.filter(c => c.F === score).length,
      label: `F${score}`
    }));

    const valorData = [1, 2, 3, 4, 5].map(score => ({
      score,
      count: clientesSegmentados.filter(c => c.V === score).length,
      label: `V${score}`
    }));

    console.log('📊 Distribuição RFV gerada:', { recenciaData, frequenciaData, valorData });

    return {
      recencia: recenciaData,
      frequencia: frequenciaData,
      valor: valorData
    };
  },

  /**
   * Gera dados da matriz RFV para visualização
   */
  getMatrixData(clientesSegmentados) {
    const segmentos = {};
    const total = clientesSegmentados.length;

    clientesSegmentados.forEach(cliente => {
      const seg = cliente.segmento;
      if (!segmentos[seg]) {
        segmentos[seg] = {
          nome: seg,
          clientes: 0,
          faturamento: 0,
          ticketMedio: 0,
          frequenciaMedia: 0,
          recenciaMedia: 0
        };
      }

      segmentos[seg].clientes++;
      segmentos[seg].faturamento += cliente.totalValor;
      segmentos[seg].frequenciaMedia += cliente.frequencia;
      segmentos[seg].recenciaMedia += cliente.recencia;
    });

    // Calcular médias e percentuais
    Object.values(segmentos).forEach(segmento => {
      segmento.percentual = ((segmento.clientes / total) * 100).toFixed(1);
      segmento.ticketMedio = segmento.faturamento / segmento.clientes;
      segmento.frequenciaMedia = (segmento.frequenciaMedia / segmento.clientes).toFixed(1);
      segmento.recenciaMedia = Math.round(segmento.recenciaMedia / segmento.clientes);
    });

    return segmentos;
  },

  /**
   * Busca métricas resumidas para cards
   */
  async getRFVMetrics(filters = {}) {
    try {
      const analysis = await this.getRFVAnalysis(filters);

      return {
        totalClientes: analysis.totalClientes,
        faturamento: analysis.totalFaturamento,
        ticketMedio: analysis.totalFaturamento / analysis.totalOportunidades,
        clientesAtivos: analysis.clientes.filter(c => c.recencia <= 30).length,
        clientesNovos: analysis.clientes.filter(c => c.frequencia === 1).length,
        clientesEmRisco: analysis.clientes.filter(c => c.segmento.includes('risco') || c.segmento.includes('hibernar')).length
      };
    } catch (error) {
      console.error('Erro ao buscar métricas RFV:', error);
      throw error;
    }
  }
};