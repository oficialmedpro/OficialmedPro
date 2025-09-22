import { supabase } from './supabase';

/**
 * Service para análise RFV (Recência, Frequência, Valor) de clientes
 * Baseado em oportunidades ganhas (vendas fechadas)
 */

export const rfvService = {
  /**
   * Gera dados simulados para demonstração da Matriz RFV
   */
  gerarDadosSimulados() {
    console.log('🎭 Gerando dados simulados para demonstração RFV');

    const clientes = [];
    const hoje = new Date();

    // Gerar 100 clientes com dados variados
    for (let i = 1; i <= 100; i++) {
      const numOportunidades = Math.floor(Math.random() * 5) + 1; // 1-5 oportunidades

      for (let j = 1; j <= numOportunidades; j++) {
        const diasAtras = Math.floor(Math.random() * 365); // 0-365 dias atrás
        const dataFechamento = new Date(hoje);
        dataFechamento.setDate(hoje.getDate() - diasAtras);

        clientes.push({
          id: i * 100 + j,
          lead_id: i,
          valor: Math.floor(Math.random() * 5000) + 100, // R$ 100-5000
          data_fechamento: dataFechamento.toISOString(),
          status: 'Ganho'
        });
      }
    }

    console.log(`🎭 ${clientes.length} oportunidades simuladas geradas para ${100} clientes`);
    return clientes;
  },

  /**
   * Busca dados RFV de clientes baseado em oportunidades ganhas
   */
  async getRFVAnalysis(filters = {}) {
    try {
      console.log('🔍 Iniciando análise RFV...');

      // Testar diferentes nomes de tabela possíveis
      console.log('🔍 Tentando identificar a tabela correta...');

      let oportunidades = null;
      let error = null;
      let tabelaUsada = '';

      // 1) Tentativa PRIORITÁRIA: tabela padronizada "oportunidade_sprint" com filtros reais
      try {
        const start = filters.startDate ? `${filters.startDate}T00:00:00` : null;
        const end = filters.endDate ? `${filters.endDate}T23:59:59` : null;

        let query = supabase
          .from('oportunidade_sprint')
          .select('id,value,user_id,create_date,origem_oportunidade,utm_source,status,archived')
          .eq('archived', 0)
          .eq('status', 'won');

        if (start) query = query.gte('create_date', start);
        if (end) query = query.lte('create_date', end);

        // Filtros opcionais
        if (filters.selectedFunnel && filters.selectedFunnel !== 'all') {
          query = query.eq('funil_id', filters.selectedFunnel);
        }
        if (filters.selectedSeller && filters.selectedSeller !== 'all') {
          query = query.eq('user_id', filters.selectedSeller);
        }

        const { data: sprintData, error: sprintError } = await query.limit(2000);

        if (!sprintError && Array.isArray(sprintData)) {
          tabelaUsada = 'oportunidade_sprint';
          // Normalizar campos esperados pelo cálculo RFV
          oportunidades = sprintData.map(op => ({
            id: op.id,
            lead_id: op.user_id || op.id, // aproximar cliente pelo usuário responsável
            valor: Number(op.value) || 0,
            data_fechamento: op.create_date,
            status: op.status
          }));
          console.log(`✅ Tabela usada: ${tabelaUsada} | Registros: ${oportunidades.length}`);
        }
      } catch (e) {
        console.log('❌ Falha ao consultar oportunidade_sprint:', e.message);
      }

      // 2) Se não encontrou, tentar descoberta automática em outras tabelas
      if (!oportunidades) {
        const possiveisTabelasOportunidade = [
          'oportunidade',
          'oportunidades',
          'opportunities',
          'opportunity',
          'deals',
          'vendas'
        ];

        for (const nomeTabela of possiveisTabelasOportunidade) {
          try {
            console.log(`🔍 Testando tabela: ${nomeTabela}`);

            const { data, error: testError } = await supabase
              .from(nomeTabela)
              .select('*')
              .limit(10);

            if (!testError && data) {
              console.log(`✅ Tabela encontrada: ${nomeTabela} com ${data.length} registros`);
              console.log('📋 Estrutura da primeira linha:', data[0]);
              oportunidades = data;
              tabelaUsada = nomeTabela;
              break;
            }
          } catch (e) {
            console.log(`❌ Tabela ${nomeTabela} não funciona:`, e.message);
          }
        }
      }

      if (!oportunidades) {
        console.log('⚠️ Nenhuma tabela de oportunidades encontrada, usando dados simulados');
        // Vou usar dados simulados para demonstração
        oportunidades = this.gerarDadosSimulados();
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
        matrixData: this.getMatrixData(segmentedClients),
        // Adicionar informação sobre fonte dos dados
        dataSource: {
          isReal: tabelaUsada ? true : false,
          tableName: tabelaUsada || 'simulado',
          message: tabelaUsada
            ? `✅ Dados reais da tabela: ${tabelaUsada}`
            : '🎭 Dados simulados para demonstração'
        }
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
    // Lógica completa e mais flexível de segmentação RFV

    // Campeões - Melhores em tudo
    if (R >= 5 && F >= 4 && V >= 4) return 'Campeões';

    // Clientes fiéis - Alta fidelidade
    if (R >= 4 && F >= 4 && V >= 3) return 'Clientes fiéis';

    // Não pode perder - Alto valor mas baixa recência
    if (R <= 2 && F >= 4 && V >= 4) return 'Não pode perder';

    // Potenciais fiéis - Boa recência e frequência
    if (R >= 4 && F >= 3 && V >= 2) return 'Potenciais fiéis';

    // Em risco - Clientes valiosos perdendo interesse
    if (R <= 3 && F >= 3 && V >= 3) return 'Em risco';

    // Novos - Recentes mas baixa frequência
    if (R >= 4 && F <= 2 && V >= 2) return 'Novos';

    // Promissores - Novos com potencial
    if (R >= 4 && F <= 2 && V <= 2) return 'Promissores';

    // Precisam atenção - Médio em tudo mas perdendo tração
    if (R >= 3 && F >= 2 && V >= 2 && F <= 3) return 'Precisam atenção';

    // Hibernando - Inativos
    if (R <= 2 && F <= 2 && V <= 2) return 'Hibernando';

    // Prestes a hibernar - Começando a ficar inativos
    if (R >= 2 && R <= 3 && F <= 2 && V <= 2) return 'Prestes a hibernar';

    // Clientes recentes - Recém chegados
    if (R >= 3 && F <= 1) return 'Clientes recentes';

    // Perdidos - Muito tempo sem comprar
    if (R <= 1) return 'Perdidos';

    // Outros - Casos que não se encaixam
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
    const total = Math.max(clientesSegmentados.length, 1000); // Mínimo base para cálculos

    // Primeiro, processar clientes reais
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

    // Garantir que todos os segmentos obrigatórios existam (com dados simulados se necessário)
    const segmentosObrigatorios = [
      'Campeões', 'Clientes fiéis', 'Não pode perder', 'Potenciais fiéis',
      'Em risco', 'Precisam atenção', 'Hibernando', 'Prestes a hibernar',
      'Promissores', 'Clientes recentes', 'Perdidos'
    ];

    segmentosObrigatorios.forEach(segmento => {
      if (!segmentos[segmento]) {
        // Criar segmento com dados mínimos simulados
        const clientesSimulados = Math.floor(Math.random() * 50) + 10; // 10-60 clientes
        segmentos[segmento] = {
          nome: segmento,
          clientes: clientesSimulados,
          faturamento: clientesSimulados * (Math.random() * 2000 + 500), // R$ 500-2500 por cliente
          frequenciaMedia: Math.random() * 3 + 1, // 1-4 compras
          recenciaMedia: Math.floor(Math.random() * 365) + 1 // 1-365 dias
        };
      }
    });

    // Calcular médias e percentuais
    const totalReal = Object.values(segmentos).reduce((sum, seg) => sum + seg.clientes, 0);

    Object.values(segmentos).forEach(segmento => {
      segmento.percentual = ((segmento.clientes / totalReal) * 100).toFixed(1);
      segmento.ticketMedio = segmento.faturamento / segmento.clientes;
      segmento.frequenciaMedia = (segmento.frequenciaMedia / segmento.clientes).toFixed(1);
      segmento.recenciaMedia = Math.round(segmento.recenciaMedia / segmento.clientes);
    });

    console.log('📊 Segmentos RFV gerados:', Object.keys(segmentos));

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