/**
 * 🎯 HOURLY PERFORMANCE SERVICE
 * 
 * Serviço para buscar dados de performance por hora
 * Baseado no dailyPerformanceService.js para manter consistência
 */

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * 🎯 BUSCAR RONDAS DO BANCO DE DADOS
 * 
 * @returns {Array} Array com as rondas cadastradas
 */
const fetchRondasFromDatabase = async () => {
  try {
    console.log('📊 HourlyPerformanceService: Buscando rondas do banco...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rondas?select=*&order=hora_inicio`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
      }
    });

    if (response.ok) {
      const rondas = await response.json();
      console.log('✅ HourlyPerformanceService: Rondas encontradas:', rondas.length);
      console.log('📋 HourlyPerformanceService: Dados das rondas:', rondas);
      return rondas;
    } else {
      console.log('⚠️ HourlyPerformanceService: Erro ao buscar rondas:', response.status, response.statusText);
      console.log('⚠️ HourlyPerformanceService: URL usada:', `${supabaseUrl}/rest/v1/rondas?select=*&order=hora_inicio`);
      return [];
    }
  } catch (error) {
    console.error('❌ HourlyPerformanceService: Erro ao buscar rondas:', error);
    return [];
  }
};

/**
 * 🎯 BUSCAR META DE RONDA ESPECÍFICA
 * 
 * @param {string} rondaId - ID da ronda
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} metricType - Tipo da métrica (leads, vendas, faturamento, conversao, ticket_medio)
 * @returns {number} Meta da ronda para a métrica específica
 */
const fetchRondaMeta = async (rondaId, selectedUnit, selectedFunnel, selectedSeller, metricType) => {
  try {
    console.log(`📊 HourlyPerformanceService: Buscando meta de ${metricType} para ronda ${rondaId}...`);
    
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : null;
    
    // Montar filtros
    const unidadeFilter = unidadeParaMeta ? `&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}` : '';
    const funilFilter = (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined')
      ? `&funil=eq.${selectedFunnel}`
      : `&funil=in.(6,14)`;
    const vendedorFilter = (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined')
      ? `&vendedor_id=eq.${selectedSeller}`
      : '';
    
    // Mapear tipos de métrica para os nomes corretos dos dashboards
    const dashboardMap = {
      'leads': 'oportunidades_ronda',
      'vendas': 'ganhas_ronda',
      'faturamento': 'faturamento_ronda',
      'conversao': 'conversao_ronda',
      'ticket_medio': 'ticketmedio_ronda'
    };
    
    const dashboardName = dashboardMap[metricType] || `${metricType}_ronda`;
    
    // Usar dashboard para buscar metas de ronda
    const metaUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&dashboard=eq.${dashboardName}${funilFilter}${vendedorFilter}${unidadeFilter}`;
    
    const response = await fetch(metaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
      }
    });

    if (response.ok) {
      const metaData = await response.json();
      if (metaData && metaData.length > 0) {
        const totalMeta = metaData.reduce((total, meta) => total + (parseFloat(meta.valor_da_meta) || 0), 0);
        console.log(`✅ HourlyPerformanceService: Meta de ${metricType} para ronda ${rondaId}: ${totalMeta}`);
        return Math.round(totalMeta);
      }
    }

    // Se não encontrou meta, usar valores padrão temporários
    console.log(`⚠️ HourlyPerformanceService: Nenhuma meta encontrada para ${metricType} na ronda ${rondaId}, usando padrão`);
    
    // Valores padrão temporários por tipo de métrica
    const defaultMetas = {
      'leads': 20,
      'vendas': 5,
      'faturamento': 10000,
      'conversao': 25,
      'ticket_medio': 2000
    };
    
    return defaultMetas[metricType] || 0;
    
  } catch (error) {
    console.error(`❌ HourlyPerformanceService: Erro ao buscar meta de ${metricType}:`, error);
    return 0;
  }
};

/**
 * 🎯 CONSTRUIR FILTROS BASEADOS NOS PARÂMETROS
 * 
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @returns {Object} Objeto com os filtros construídos
 */
const buildFilters = async (selectedFunnel, selectedUnit, selectedSeller, selectedOrigin) => {
  let funilFilter = '';
  if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
    funilFilter = `&funil_id=eq.${selectedFunnel}`;
    console.log('🔍 HourlyPerformanceService: Filtro de funil específico aplicado:', funilFilter);
  } else {
    funilFilter = `&funil_id=in.(6,14)`;
    console.log('🔍 HourlyPerformanceService: Filtro de funil padrão aplicado (6,14):', funilFilter);
  }
  
  let unidadeFilter = '';
  if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
    const unidadeValue = selectedUnit.toString();
    const unidadeEncoded = encodeURIComponent(unidadeValue);
    unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
    console.log('🔍 HourlyPerformanceService: Filtro unidade:', unidadeFilter);
  }
  
  let sellerFilter = '';
  if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
    sellerFilter = `&user_id=eq.${selectedSeller}`;
  }

  let originFilter = '';
  if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== '' && selectedOrigin !== 'undefined') {
    try {
      const originResponse = await fetch(`${supabaseUrl}/rest/v1/origem_oportunidade?select=nome&id=eq.${selectedOrigin}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      });

      if (originResponse.ok) {
        const originData = await originResponse.json();
        if (originData && originData.length > 0) {
          const originName = originData[0].nome;
          
          const lower = originName.toLowerCase();
          if (lower === 'orgânico' || lower === 'organico') {
            originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent(originName)},origem_oportunidade.is.null)`;
          } else if (lower === 'google ads' || lower === 'googleads') {
            originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent(originName)},utm_source.eq.google,utm_source.eq.GoogleAds)`;
          } else {
            originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
          }
        }
      }
    } catch (error) {
      console.log('⚠️ HourlyPerformanceService: Erro ao buscar origem:', error);
    }
  }

  return {
    funilFilter,
    unidadeFilter,
    sellerFilter,
    originFilter,
    combined: funilFilter + unidadeFilter + sellerFilter + originFilter
  };
};

/**
 * 🎯 BUSCAR DADOS DE OPORTUNIDADES
 * 
 * @param {string} startDate - Data inicial
 * @param {string} endDate - Data final
 * @param {Object} filters - Filtros construídos
 * @returns {Array} Array com oportunidades
 */
const fetchOpportunities = async (startDate, endDate, filters) => {
  try {
    console.log('📊 HourlyPerformanceService: Buscando oportunidades...');
    
    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    const opportunitiesUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,create_date,status,gain_date&archived=eq.0&create_date=gte.${startDate}&create_date=lte.${endDate}T23:59:59${filters.combined}`;
    
    console.log('🔍 HourlyPerformanceService: URL oportunidades:', opportunitiesUrl);
    
    const response = await fetch(opportunitiesUrl, {
      method: 'GET',
      headers: baseHeaders
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }

    const opportunities = await response.json();
    console.log('📊 HourlyPerformanceService: Oportunidades encontradas:', opportunities.length);
    
    return opportunities;
    
  } catch (error) {
    console.error('❌ HourlyPerformanceService: Erro ao buscar oportunidades:', error);
    return [];
  }
};

/**
 * 🎯 AGRUPAR OPORTUNIDADES POR RONDA
 * 
 * @param {Array} opportunities - Array de oportunidades
 * @param {Array} rondas - Array de rondas do banco
 * @returns {Object} Dados agrupados por ronda
 */
const groupOpportunitiesByRonda = (opportunities, rondas) => {
  const rondaData = {};

  // Inicializar estrutura de dados para todas as rondas
  rondas.forEach(ronda => {
    rondaData[ronda.hora_inicio] = {
      ronda_id: ronda.id,
      ronda_nome: ronda.nome,
      hora_inicio: ronda.hora_inicio,
      hora_fim: ronda.hora_fim,
      leads: { realizado: 0, meta: 0, gap: 0 },
      vendas: { realizado: 0, meta: 0, gap: 0 },
      faturamento: { realizado: 0, meta: 0, gap: 0 },
      conversao: { realizado: 0, meta: 0, gap: 0 },
      ticketMedio: { realizado: 0, meta: 0, gap: 0 }
    };
  });

  // Adicionar fechamento (soma de todas as rondas)
  rondaData['fechamento'] = {
    ronda_id: 'fechamento',
    ronda_nome: 'Fechamento',
    hora_inicio: '20:00',
    hora_fim: '22:00',
    leads: { realizado: 0, meta: 0, gap: 0 },
    vendas: { realizado: 0, meta: 0, gap: 0 },
    faturamento: { realizado: 0, meta: 0, gap: 0 },
    conversao: { realizado: 0, meta: 0, gap: 0 },
    ticketMedio: { realizado: 0, meta: 0, gap: 0 }
  };

  // Processar cada oportunidade
  opportunities.forEach(opp => {
    const createdDate = new Date(opp.create_date);
    const hour = createdDate.getHours();
    const minute = createdDate.getMinutes();
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    let targetRonda = null;

    // Encontrar a ronda correspondente
    for (const ronda of rondas) {
      const rondaInicio = ronda.hora_inicio;
      const rondaFim = ronda.hora_fim;
      
      if (timeString >= rondaInicio && timeString <= rondaFim) {
        targetRonda = ronda.hora_inicio;
        break;
      }
    }

    // Se não encontrou ronda específica, verificar se é fechamento (20h-22h)
    if (!targetRonda && hour >= 20 && hour < 22) {
      targetRonda = 'fechamento';
    }

    if (targetRonda && rondaData[targetRonda]) {
      // Incrementar leads (todas as oportunidades)
      rondaData[targetRonda].leads.realizado++;

      // Incrementar vendas e faturamento (apenas oportunidades ganhas)
      if (opp.status === 'gain') {
        rondaData[targetRonda].vendas.realizado++;
        rondaData[targetRonda].faturamento.realizado += parseFloat(opp.value || 0);
      }

      // Calcular ticket médio
      if (rondaData[targetRonda].vendas.realizado > 0) {
        rondaData[targetRonda].ticketMedio.realizado = 
          rondaData[targetRonda].faturamento.realizado / rondaData[targetRonda].vendas.realizado;
      }

      // Calcular taxa de conversão
      if (rondaData[targetRonda].leads.realizado > 0) {
        rondaData[targetRonda].conversao.realizado = 
          (rondaData[targetRonda].vendas.realizado / rondaData[targetRonda].leads.realizado) * 100;
      }
    }
  });

  return rondaData;
};

/**
 * 🎯 CALCULAR METAS E GAPS PARA CADA RONDA
 * 
 * @param {Object} rondaData - Dados agrupados por ronda
 * @param {Array} rondas - Array de rondas do banco
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedSeller - ID do vendedor selecionado
 */
const calculateMetasAndGaps = async (rondaData, rondas, selectedUnit, selectedFunnel, selectedSeller) => {
  // Calcular metas para cada ronda
  for (const ronda of rondas) {
    const rondaKey = ronda.hora_inicio;
    const data = rondaData[rondaKey];
    
    if (data) {
      // Buscar metas do banco para esta ronda
      data.leads.meta = await fetchRondaMeta(ronda.id, selectedUnit, selectedFunnel, selectedSeller, 'leads');
      data.vendas.meta = await fetchRondaMeta(ronda.id, selectedUnit, selectedFunnel, selectedSeller, 'vendas');
      data.faturamento.meta = await fetchRondaMeta(ronda.id, selectedUnit, selectedFunnel, selectedSeller, 'faturamento');
      data.conversao.meta = await fetchRondaMeta(ronda.id, selectedUnit, selectedFunnel, selectedSeller, 'conversao');
      data.ticketMedio.meta = await fetchRondaMeta(ronda.id, selectedUnit, selectedFunnel, selectedSeller, 'ticket_medio');

      // Calcular gaps
      data.leads.gap = data.leads.realizado - data.leads.meta;
      data.vendas.gap = data.vendas.realizado - data.vendas.meta;
      data.faturamento.gap = data.faturamento.realizado - data.faturamento.meta;
      data.conversao.gap = data.conversao.realizado - data.conversao.meta;
      data.ticketMedio.gap = data.ticketMedio.realizado - data.ticketMedio.meta;
    }
  }

  // Calcular fechamento (soma de todas as rondas)
  const fechamentoData = rondaData['fechamento'];
  if (fechamentoData) {
    // Somar realizados de todas as rondas
    rondas.forEach(ronda => {
      const rondaKey = ronda.hora_inicio;
      const data = rondaData[rondaKey];
      if (data) {
        fechamentoData.leads.realizado += data.leads.realizado;
        fechamentoData.vendas.realizado += data.vendas.realizado;
        fechamentoData.faturamento.realizado += data.faturamento.realizado;
        fechamentoData.leads.meta += data.leads.meta;
        fechamentoData.vendas.meta += data.vendas.meta;
        fechamentoData.faturamento.meta += data.faturamento.meta;
      }
    });

    // Calcular conversão e ticket médio do fechamento
    if (fechamentoData.leads.realizado > 0) {
      fechamentoData.conversao.realizado = (fechamentoData.vendas.realizado / fechamentoData.leads.realizado) * 100;
    }
    if (fechamentoData.leads.meta > 0) {
      fechamentoData.conversao.meta = (fechamentoData.vendas.meta / fechamentoData.leads.meta) * 100;
    }
    if (fechamentoData.vendas.realizado > 0) {
      fechamentoData.ticketMedio.realizado = fechamentoData.faturamento.realizado / fechamentoData.vendas.realizado;
    }
    if (fechamentoData.vendas.meta > 0) {
      fechamentoData.ticketMedio.meta = fechamentoData.faturamento.meta / fechamentoData.vendas.meta;
    }

    // Calcular gaps do fechamento
    fechamentoData.leads.gap = fechamentoData.leads.realizado - fechamentoData.leads.meta;
    fechamentoData.vendas.gap = fechamentoData.vendas.realizado - fechamentoData.vendas.meta;
    fechamentoData.faturamento.gap = fechamentoData.faturamento.realizado - fechamentoData.faturamento.meta;
    fechamentoData.conversao.gap = fechamentoData.conversao.realizado - fechamentoData.conversao.meta;
    fechamentoData.ticketMedio.gap = fechamentoData.ticketMedio.realizado - fechamentoData.ticketMedio.meta;
  }
};

/**
 * 🎯 CALCULAR DADOS DE RESUMO
 * 
 * @param {Object} rondaData - Dados agrupados por ronda
 * @returns {Object} Dados de resumo
 */
const calculateSummaryData = (rondaData) => {
  const summary = {
    leads: { realizado: 0, meta: 0, gap: 0 },
    vendas: { realizado: 0, meta: 0, gap: 0 },
    faturamento: { realizado: 0, meta: 0, gap: 0 },
    conversao: { realizado: 0, meta: 0, gap: 0 },
    ticketMedio: { realizado: 0, meta: 0, gap: 0 }
  };

  // Somar todos os dados (incluindo fechamento)
  Object.values(rondaData).forEach(data => {
    summary.leads.realizado += data.leads.realizado;
    summary.leads.meta += data.leads.meta;
    summary.vendas.realizado += data.vendas.realizado;
    summary.vendas.meta += data.vendas.meta;
    summary.faturamento.realizado += data.faturamento.realizado;
    summary.faturamento.meta += data.faturamento.meta;
  });

  // Calcular totais
  summary.leads.gap = summary.leads.realizado - summary.leads.meta;
  summary.vendas.gap = summary.vendas.realizado - summary.vendas.meta;
  summary.faturamento.gap = summary.faturamento.realizado - summary.faturamento.meta;

  // Calcular conversão geral
  if (summary.leads.realizado > 0) {
    summary.conversao.realizado = (summary.vendas.realizado / summary.leads.realizado) * 100;
  }
  if (summary.leads.meta > 0) {
    summary.conversao.meta = (summary.vendas.meta / summary.leads.meta) * 100;
  }
  summary.conversao.gap = summary.conversao.realizado - summary.conversao.meta;

  // Calcular ticket médio geral
  if (summary.vendas.realizado > 0) {
    summary.ticketMedio.realizado = summary.faturamento.realizado / summary.vendas.realizado;
  }
  if (summary.vendas.meta > 0) {
    summary.ticketMedio.meta = summary.faturamento.meta / summary.vendas.meta;
  }
  summary.ticketMedio.gap = summary.ticketMedio.realizado - summary.ticketMedio.meta;

  return summary;
};

/**
 * 🎯 FUNÇÃO PRINCIPAL PARA BUSCAR DADOS DE PERFORMANCE POR HORA
 * 
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @returns {Object} Objeto com dados por hora e resumo
 */
export const getHourlyPerformanceData = async (
  startDate = null, 
  endDate = null, 
  selectedFunnel = null, 
  selectedUnit = null, 
  selectedSeller = null, 
  selectedOrigin = null
) => {
  try {
    console.log('='.repeat(80));
    console.log('🎯 HourlyPerformanceService: INICIANDO BUSCA DE DADOS POR HORA');
    console.log('📅 Parâmetros recebidos:');
    console.log('  - startDate:', startDate);
    console.log('  - endDate:', endDate);
    console.log('  - selectedFunnel:', selectedFunnel);
    console.log('  - selectedUnit:', selectedUnit);
    console.log('  - selectedSeller:', selectedSeller);
    console.log('  - selectedOrigin:', selectedOrigin);
    console.log('='.repeat(80));

    // Usar datas fornecidas ou defaultar para hoje
    let dataInicio, dataFim;

    if (startDate && endDate) {
      dataInicio = startDate;
      dataFim = endDate;
    } else {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      dataInicio = todayString;
      dataFim = todayString;
    }

    // Buscar rondas do banco de dados
    const rondas = await fetchRondasFromDatabase();
    
    if (rondas.length === 0) {
      console.log('⚠️ HourlyPerformanceService: Nenhuma ronda encontrada no banco');
      return {
        hourlyData: {},
        summaryData: {
          leads: { realizado: 0, meta: 0, gap: 0 },
          vendas: { realizado: 0, meta: 0, gap: 0 },
          faturamento: { realizado: 0, meta: 0, gap: 0 },
          conversao: { realizado: 0, meta: 0, gap: 0 },
          ticketMedio: { realizado: 0, meta: 0, gap: 0 }
        }
      };
    }

    // Construir filtros
    const filters = await buildFilters(selectedFunnel, selectedUnit, selectedSeller, selectedOrigin);
    
    // Buscar oportunidades
    const opportunities = await fetchOpportunities(dataInicio, dataFim, filters);

    // Agrupar dados por ronda
    console.log('🔍 HourlyPerformanceService: Agrupando oportunidades por ronda...');
    console.log('📊 Oportunidades para agrupar:', opportunities.length);
    console.log('📊 Rondas disponíveis:', rondas.length);
    
    const rondaData = groupOpportunitiesByRonda(opportunities, rondas);
    console.log('📊 Dados agrupados por ronda:', rondaData);
    
    // Calcular metas e gaps
    console.log('🔍 HourlyPerformanceService: Calculando metas e gaps...');
    await calculateMetasAndGaps(rondaData, rondas, selectedUnit, selectedFunnel, selectedSeller);
    console.log('📊 Dados após cálculo de metas:', rondaData);
    
    // Calcular dados de resumo
    const summaryData = calculateSummaryData(rondaData);

    console.log('✅ HourlyPerformanceService: Dados processados com sucesso');
    console.log('Dados por ronda:', rondaData);
    console.log('Dados de resumo:', summaryData);

    return {
      hourlyData: rondaData,
      summaryData
    };

  } catch (error) {
    console.error('❌ HourlyPerformanceService: Erro ao buscar dados por hora:', error);
    throw error;
  }
};