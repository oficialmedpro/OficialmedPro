/**
 * 🎯 DAILY PERFORMANCE SERVICE
 * 
 * Serviço para buscar dados de performance diária
 * Baseado no totalOportunidadesService.js para manter consistência
 */

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * 🎯 FUNÇÃO PARA BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO RECURSIVA
 * 
 * @param {string} url - URL base da query
 * @param {Object} headers - Headers da requisição
 * @returns {Array} Todos os registros encontrados
 */
const fetchAllRecords = async (url, headers) => {
  const pageSize = 1000;
  let allRecords = [];
  let offset = 0;
  let hasMore = true;

  console.log('📄 DailyPerformanceService: Iniciando paginação para URL:', url);

  while (hasMore) {
    const paginatedUrl = `${url}`;
    const paginationHeaders = {
      ...headers,
      'Range': `${offset}-${offset + pageSize - 1}`
    };

    try {
      const response = await fetch(paginatedUrl, {
        method: 'GET',
        headers: paginationHeaders
      });

      if (!response.ok) {
        console.error(`❌ Erro na página ${Math.floor(offset / pageSize) + 1}:`, response.status);
        break;
      }

      const pageData = await response.json();
      allRecords = allRecords.concat(pageData);

      console.log(`📄 Página ${Math.floor(offset / pageSize) + 1}: ${pageData.length} registros | Total: ${allRecords.length}`);

      if (pageData.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
      }

      const contentRange = response.headers.get('Content-Range');
      if (contentRange) {
        const match = contentRange.match(/(\d+)-(\d+)\/(\d+|\*)/);
        if (match) {
          const [, , end, total] = match;
          if (total !== '*' && parseInt(end) >= parseInt(total) - 1) {
            hasMore = false;
          }
        }
      }

    } catch (error) {
      console.error(`❌ Erro ao buscar página ${Math.floor(offset / pageSize) + 1}:`, error);
      break;
    }
  }

  console.log(`✅ DailyPerformanceService: Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
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
    console.log('🔍 DailyPerformanceService: Filtro de funil específico aplicado:', funilFilter);
  } else {
    funilFilter = `&funil_id=in.(6,14)`;
    console.log('🔍 DailyPerformanceService: Filtro de funil padrão aplicado (6,14):', funilFilter);
  }
  
  let unidadeFilter = '';
  if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
    const unidadeValue = selectedUnit.toString();
    const unidadeEncoded = encodeURIComponent(unidadeValue);
    unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
    console.log('🔍 DailyPerformanceService: Filtro unidade:', unidadeFilter);
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
      console.log('⚠️ DailyPerformanceService: Erro ao buscar origem:', error);
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
 * 🎯 BUSCAR DADOS DE LEADS/OPORTUNIDADES POR DIA
 * 
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {Object} filters - Filtros construídos
 * @returns {Array} Array com dados por dia
 */
const fetchLeadsDataByDay = async (startDate, endDate, filters) => {
  try {
    console.log('📊 DailyPerformanceService: Buscando dados de leads por dia...');
    
    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // EXATAMENTE igual ao TotalOportunidadesService
    const leadsUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,create_date&archived=eq.0&create_date=gte.${startDate}&create_date=lte.${endDate}T23:59:59${filters.combined}`;
    
    console.log('🔍 DailyPerformanceService: URL leads (IGUAL ao TotalOportunidadesService):', leadsUrl);
    console.log('🔍 DailyPerformanceService: Parâmetros:', { startDate, endDate, filtersCombined: filters.combined });
    
    const leadsData = await fetchAllRecords(leadsUrl, baseHeaders);
    
    console.log('📊 DailyPerformanceService: Total de registros retornados:', leadsData?.length || 0);
    if (leadsData && leadsData.length > 0) {
      console.log('📊 DailyPerformanceService: Primeiros 3 registros:', leadsData.slice(0, 3));
      console.log('📊 DailyPerformanceService: Últimos 3 registros:', leadsData.slice(-3));
    }
    
    // Agrupar por dia
    const dailyLeads = {};
    
    if (leadsData && Array.isArray(leadsData)) {
      leadsData.forEach(lead => {
        const createDate = new Date(lead.create_date);
        // Usar data LOCAL para evitar deslocamento por UTC
        const dateKey = createDate.toLocaleDateString('sv-SE'); // YYYY-MM-DD
        
        if (!dailyLeads[dateKey]) {
          dailyLeads[dateKey] = {
            count: 0,
            totalValue: 0
          };
        }
        
        dailyLeads[dateKey].count++;
        dailyLeads[dateKey].totalValue += parseFloat(lead.value) || 0;
      });
    }
    
    console.log('✅ DailyPerformanceService: Dados de leads agrupados por dia:', dailyLeads);
    
    // Debug específico para HOJE
    const todayKey = new Date().toLocaleDateString('sv-SE');
    console.log('🔎 DailyPerformanceService: todayKey:', todayKey);
    console.log('🔎 DailyPerformanceService: exists?', !!dailyLeads[todayKey]);
    console.log('🔎 DailyPerformanceService: value:', dailyLeads[todayKey] || null);
    
    // Debug: mostrar todas as chaves de data encontradas
    const allDateKeys = Object.keys(dailyLeads).sort();
    console.log('🔎 DailyPerformanceService: Todas as datas encontradas:', allDateKeys);
    
    return dailyLeads;
    
  } catch (error) {
    console.error('❌ DailyPerformanceService: Erro ao buscar dados de leads:', error);
    return {};
  }
};

/**
 * 🎯 BUSCAR META DE LEADS POR DIA
 * 
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {number} totalDays - Total de dias no período
 * @returns {number} Meta diária de leads
 */
const fetchLeadsMeta = async (selectedUnit, selectedFunnel, selectedSeller, totalDays) => {
  try {
    console.log('📊 DailyPerformanceService: Buscando meta de leads...');
    
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : null;
    
    // Dashboard específico para metas diárias de oportunidades
    const dashboard = 'oportunidades_diaria';
    
    // Montar filtros
    const unidadeFilter = unidadeParaMeta ? `&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}` : '';
    const funilFilter = (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined')
      ? `&funil=eq.${selectedFunnel}`
      : `&funil=in.(6,14)`;
    const vendedorFilter = (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined')
      ? `&vendedor_id=eq.${selectedSeller}`
      : '';
    
    const metaUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&dashboard=eq.${dashboard}${funilFilter}${vendedorFilter}${unidadeFilter}`;
    
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
        // Como a dashboard é de metas diárias, somamos os registros (se houver múltiplos vendedores)
        const totalMeta = metaData.reduce((total, meta) => total + (parseFloat(meta.valor_da_meta) || 0), 0);
        console.log(`✅ DailyPerformanceService: Meta diária (somada): ${totalMeta}`);
        return Math.round(totalMeta);
      }
    }
    
    // Fallback: meta padrão de 80 leads por dia
    const metaPadrao = 80;
    console.log(`⚠️ DailyPerformanceService: Usando meta padrão: ${metaPadrao} leads/dia`);
    return metaPadrao;
    
  } catch (error) {
    console.error('❌ DailyPerformanceService: Erro ao buscar meta de leads:', error);
    return 80; // Meta padrão
  }
};

/**
 * 🎯 BUSCAR DADOS DE VENDAS/OPORTUNIDADES GANHAS POR DIA
 * 
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {Object} filters - Filtros construídos
 * @returns {Array} Array com dados por dia
 */
const fetchVendasDataByDay = async (startDate, endDate, filters) => {
  try {
    console.log('📊 DailyPerformanceService: Buscando dados de vendas por dia...');
    
    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // EXATAMENTE igual ao fetchLeadsDataByDay, mas com status=eq.gain e gain_date
    const vendasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,gain_date&archived=eq.0&status=eq.gain&gain_date=gte.${startDate}&gain_date=lte.${endDate}T23:59:59${filters.combined}`;
    
    console.log('🔍 DailyPerformanceService: URL vendas (IGUAL ao fetchLeadsDataByDay mas com status=gain e gain_date):', vendasUrl);
    console.log('🔍 DailyPerformanceService: Parâmetros:', { startDate, endDate, filtersCombined: filters.combined });
    
    const vendasData = await fetchAllRecords(vendasUrl, baseHeaders);
    
    console.log('📊 DailyPerformanceService: Total de vendas retornadas:', vendasData?.length || 0);
    if (vendasData && vendasData.length > 0) {
      console.log('📊 DailyPerformanceService: Primeiras 3 vendas:', vendasData.slice(0, 3));
      console.log('📊 DailyPerformanceService: Últimas 3 vendas:', vendasData.slice(-3));
    }
    
    // Agrupar por dia
    const dailyVendas = {};
    
    if (vendasData && Array.isArray(vendasData)) {
      vendasData.forEach(venda => {
        const gainDate = new Date(venda.gain_date);
        // Usar data LOCAL para evitar deslocamento por UTC
        const dateKey = gainDate.toLocaleDateString('sv-SE'); // YYYY-MM-DD
        
        if (!dailyVendas[dateKey]) {
          dailyVendas[dateKey] = {
            count: 0,
            totalValue: 0
          };
        }
        
        dailyVendas[dateKey].count++;
        dailyVendas[dateKey].totalValue += parseFloat(venda.value) || 0;
      });
    }
    
    console.log('✅ DailyPerformanceService: Dados de vendas agrupados por dia:', dailyVendas);
    
    // Debug específico para HOJE
    const todayKey = new Date().toLocaleDateString('sv-SE');
    console.log('🔎 DailyPerformanceService: todayKey vendas:', todayKey);
    console.log('🔎 DailyPerformanceService: exists?', !!dailyVendas[todayKey]);
    console.log('🔎 DailyPerformanceService: value:', dailyVendas[todayKey] || null);
    
    // Debug: mostrar todas as chaves de data encontradas
    const allDateKeys = Object.keys(dailyVendas).sort();
    console.log('🔎 DailyPerformanceService: Todas as datas de vendas encontradas:', allDateKeys);
    
    return dailyVendas;
    
  } catch (error) {
    console.error('❌ DailyPerformanceService: Erro ao buscar dados de vendas:', error);
    return {};
  }
};

/**
 * 🎯 BUSCAR META DE VENDAS POR DIA
 * 
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {number} totalDays - Total de dias no período
 * @returns {number} Meta diária de vendas
 */
const fetchVendasMeta = async (selectedUnit, selectedFunnel, selectedSeller, totalDays) => {
  try {
    console.log('📊 DailyPerformanceService: Buscando meta de vendas...');
    
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : null;
    
    // Dashboard específico para metas diárias de vendas/ganhas
    const dashboard = 'oportunidades_diaria_ganhas';
    
    // Montar filtros
    const unidadeFilter = unidadeParaMeta ? `&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}` : '';
    const funilFilter = (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined')
      ? `&funil=eq.${selectedFunnel}`
      : `&funil=in.(6,14)`;
    const vendedorFilter = (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined')
      ? `&vendedor_id=eq.${selectedSeller}`
      : '';
    
    const metaUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&dashboard=eq.${dashboard}${funilFilter}${vendedorFilter}${unidadeFilter}`;
    
    console.log('🔍 DailyPerformanceService: URL meta vendas:', metaUrl);
    
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
        // Como a dashboard é de metas diárias, somamos os registros (se houver múltiplos vendedores)
        const totalMeta = metaData.reduce((total, meta) => total + (parseFloat(meta.valor_da_meta) || 0), 0);
        console.log(`✅ DailyPerformanceService: Meta diária de vendas (somada): ${totalMeta}`);
        return Math.round(totalMeta);
      }
    }
    
    // Fallback: meta padrão de 20 vendas por dia
    const metaPadrao = 20;
    console.log(`⚠️ DailyPerformanceService: Usando meta padrão de vendas: ${metaPadrao} vendas/dia`);
    return metaPadrao;
    
  } catch (error) {
    console.error('❌ DailyPerformanceService: Erro ao buscar meta de vendas:', error);
    return 20; // Meta padrão
  }
};

/**
 * 🎯 GERAR DADOS DIÁRIOS COM ESTRUTURA PADRONIZADA
 * 
 * @param {string} startDate - Data inicial
 * @param {string} endDate - Data final
 * @param {Object} dailyLeads - Dados de leads por dia
 * @param {Object} dailyVendas - Dados de vendas por dia
 * @param {number} metaDiariaLeads - Meta diária de leads
 * @param {number} metaDiariaVendas - Meta diária de vendas
 * @returns {Array} Array com dados estruturados por dia
 */
const generateDailyData = (startDate, endDate, dailyLeads, dailyVendas, metaDiariaLeads, metaDiariaVendas) => {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');
  // Tratar "hoje" usando timezone local e incluindo todo o dia atual
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  console.log('🔍 DEBUG generateDailyData:', {
    startDate,
    endDate,
    start: start.toISOString(),
    end: end.toISOString(),
    today: today.toISOString(),
    totalKeysInDailyLeads: Object.keys(dailyLeads).length,
    dailyLeadsKeys: Object.keys(dailyLeads).sort()
  });
  
  const dailyData = [];
  const current = new Date(start);
  
  while (current <= end && current <= today) {
    // Data LOCAL para alinhar com os outros componentes
    const dateKey = current.toLocaleDateString('sv-SE');
    const leadsData = dailyLeads[dateKey] || { count: 0, totalValue: 0 };
    const vendasData = dailyVendas[dateKey] || { count: 0, totalValue: 0 };
    
    console.log(`🔍 Processando dia ${dateKey}:`, {
      hasLeadsData: !!dailyLeads[dateKey],
      leadsCount: leadsData.count,
      hasVendasData: !!dailyVendas[dateKey],
      vendasCount: vendasData.count,
      currentDate: current.toISOString()
    });
    
    // Cálculos de leads
    const leadsGap = leadsData.count - metaDiariaLeads;
    const faturamentoMeta = metaDiariaLeads * 250;
    const faturamentoGap = leadsData.totalValue - faturamentoMeta;
    const ticketMedioRealizado = leadsData.count > 0 ? leadsData.totalValue / leadsData.count : 0;
    const ticketMedioGap = ticketMedioRealizado - 250;
    
    // Cálculos de vendas
    const vendasGap = vendasData.count - metaDiariaVendas;
    
    // Cálculo de conversão (vendas / leads * 100)
    const conversaoRealizada = leadsData.count > 0 ? (vendasData.count / leadsData.count) * 100 : 0;
    const conversaoMeta = 30; // 30% de conversão padrão
    const conversaoGap = conversaoRealizada - conversaoMeta;
    
    dailyData.push({
      date: dateKey,
      leads: {
        realizado: leadsData.count,
        meta: metaDiariaLeads,
        gap: leadsGap
      },
      vendas: {
        realizado: vendasData.count,
        meta: metaDiariaVendas,
        gap: vendasGap
      },
      faturamento: {
        realizado: leadsData.totalValue,
        meta: faturamentoMeta,
        gap: faturamentoGap
      },
      conversao: {
        realizado: conversaoRealizada,
        meta: conversaoMeta,
        gap: conversaoGap
      },
      ticketMedio: {
        realizado: ticketMedioRealizado,
        meta: 250, // R$ 250 ticket médio padrão
        gap: ticketMedioGap
      }
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  console.log(`🔍 generateDailyData resultado: ${dailyData.length} dias gerados`);
  console.log('🔍 Datas geradas:', dailyData.map(d => d.date));
  
  return dailyData;
};

/**
 * 🎯 CALCULAR DADOS DE RESUMO DO PERÍODO
 * 
 * @param {Array} dailyData - Dados diários
 * @returns {Object} Dados de resumo
 */
const calculateSummaryData = (dailyData) => {
  const summary = {
    leads: { realizado: 0, meta: 0, gap: 0 },
    vendas: { realizado: 0, meta: 0, gap: 0 },
    faturamento: { realizado: 0, meta: 0, gap: 0 },
    conversao: { realizado: 0, meta: 0, gap: 0 },
    ticketMedio: { realizado: 0, meta: 0, gap: 0 }
  };
  
  dailyData.forEach(day => {
    summary.leads.realizado += day.leads.realizado;
    summary.leads.meta += day.leads.meta;
    summary.vendas.realizado += day.vendas.realizado;
    summary.vendas.meta += day.vendas.meta;
    summary.faturamento.realizado += day.faturamento.realizado;
    summary.faturamento.meta += day.faturamento.meta;
    summary.conversao.realizado += day.conversao.realizado;
    summary.conversao.meta += day.conversao.meta;
    summary.ticketMedio.realizado += day.ticketMedio.realizado;
    summary.ticketMedio.meta += day.ticketMedio.meta;
  });
  
  // Calcular gaps
  summary.leads.gap = summary.leads.realizado - summary.leads.meta;
  summary.vendas.gap = summary.vendas.realizado - summary.vendas.meta;
  summary.faturamento.gap = summary.faturamento.realizado - summary.faturamento.meta;
  summary.conversao.gap = summary.conversao.realizado - summary.conversao.meta;
  summary.ticketMedio.gap = summary.ticketMedio.realizado - summary.ticketMedio.meta;
  
  // Calcular médias para conversão e ticket médio
  if (dailyData.length > 0) {
    summary.conversao.realizado = summary.conversao.realizado / dailyData.length;
    summary.conversao.meta = summary.conversao.meta / dailyData.length;
    summary.ticketMedio.realizado = summary.ticketMedio.realizado / dailyData.length;
    summary.ticketMedio.meta = summary.ticketMedio.meta / dailyData.length;
  }
  
  return summary;
};

/**
 * 🎯 FUNÇÃO PRINCIPAL PARA BUSCAR DADOS DE PERFORMANCE DIÁRIA
 * 
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @returns {Object} Objeto com dados diários e resumo
 */
export const getDailyPerformanceData = async (
  startDate = null, 
  endDate = null, 
  selectedFunnel = null, 
  selectedUnit = null, 
  selectedSeller = null, 
  selectedOrigin = null
) => {
  try {
    console.log('='.repeat(80));
    console.log('🎯 DailyPerformanceService: INICIANDO BUSCA DE DADOS DIÁRIOS');
    console.log('📅 Parâmetros recebidos:');
    console.log('  - startDate:', startDate);
    console.log('  - endDate:', endDate);
    console.log('  - selectedFunnel:', selectedFunnel);
    console.log('  - selectedUnit:', selectedUnit);
    console.log('  - selectedSeller:', selectedSeller);
    console.log('  - selectedOrigin:', selectedOrigin);
    console.log('='.repeat(80));

    // Sempre considerar o mês corrente (01 até HOJE) para a tabela diária
    const now = new Date();
    const hojeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inicioMesDate = new Date(hojeDate.getFullYear(), hojeDate.getMonth(), 1);
    const dataInicioMes = inicioMesDate.toISOString().split('T')[0];
    const dataFimMes = hojeDate.toISOString().split('T')[0];
    console.log('📅 Intervalo mensal usado para a tabela diária:', { dataInicioMes, dataFimMes });

    // Construir filtros
    const filters = await buildFilters(selectedFunnel, selectedUnit, selectedSeller, selectedOrigin);
    
    // Calcular total de dias
    const start = new Date(inicioMesDate);
    const end = new Date(hojeDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Buscar dados de leads por dia (mês corrente)
    const dailyLeads = await fetchLeadsDataByDay(dataInicioMes, dataFimMes, filters);
    
    // Buscar dados de vendas por dia (mês corrente)
    const dailyVendas = await fetchVendasDataByDay(dataInicioMes, dataFimMes, filters);
    
    // Buscar meta de leads
    const metaDiariaLeads = await fetchLeadsMeta(selectedUnit, selectedFunnel, selectedSeller, totalDays);
    
    // Buscar meta de vendas
    const metaDiariaVendas = await fetchVendasMeta(selectedUnit, selectedFunnel, selectedSeller, totalDays);
    
    // Gerar dados diários estruturados
    const dailyData = generateDailyData(dataInicioMes, dataFimMes, dailyLeads, dailyVendas, metaDiariaLeads, metaDiariaVendas);
    
    // Calcular dados de resumo
    const summaryData = calculateSummaryData(dailyData);
    
    console.log('✅ DailyPerformanceService: Dados processados:');
    console.log('  - Total de dias:', dailyData.length);
    console.log('  - Meta diária de leads:', metaDiariaLeads);
    console.log('  - Meta diária de vendas:', metaDiariaVendas);
    console.log('  - Dados de resumo:', summaryData);
    console.log('🔍 DEBUG: Estrutura dos dados diários:');
    console.log('  - Primeiros 3 dias:', dailyData.slice(0, 3));
    console.log('  - Últimos 3 dias:', dailyData.slice(-3));
    console.log('  - Todas as datas:', dailyData.map(d => d.date));
    
    return {
      dailyData,
      summaryData
    };

  } catch (error) {
    console.error('❌ DailyPerformanceService: Erro ao buscar dados diários:', error);
    throw error;
  }
};

/**
 * 🎯 FUNÇÃO PARA TESTAR CONEXÃO DO DAILY PERFORMANCE SERVICE
 */
export const testDailyPerformanceConnection = async () => {
  try {
    console.log('🔌 DailyPerformanceService: Testando conexão...');
    
    const data = await getDailyPerformanceData();
    console.log('✅ DailyPerformanceService: Conexão bem-sucedida!', data);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ DailyPerformanceService: Erro na conexão:', error);
    return { success: false, error: error.message };
  }
};
