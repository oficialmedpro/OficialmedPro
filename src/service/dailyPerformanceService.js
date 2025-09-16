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

    // URL para buscar oportunidades criadas no período (leads)
    const leadsUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,create_date&archived=eq.0&status=in.(open,gain,lost)&create_date=gte.${startDate}&create_date=lte.${endDate}T23:59:59${filters.combined}`;
    
    console.log('🔍 DailyPerformanceService: URL leads:', leadsUrl);
    
    const leadsData = await fetchAllRecords(leadsUrl, baseHeaders);
    
    // Agrupar por dia
    const dailyLeads = {};
    
    if (leadsData && Array.isArray(leadsData)) {
      leadsData.forEach(lead => {
        const createDate = new Date(lead.create_date);
        const dateKey = createDate.toISOString().split('T')[0];
        
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
const fetchLeadsMeta = async (selectedUnit, selectedFunnel, totalDays) => {
  try {
    console.log('📊 DailyPerformanceService: Buscando meta de leads...');
    
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : '[1]';
    
    let metaUrl;
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      metaUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}&dashboard=eq.novas_oportunidades&funil=eq.${selectedFunnel}`;
    } else {
      metaUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}&dashboard=eq.novas_oportunidades&funil=in.(6,14)`;
    }
    
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
        let totalMeta = 0;
        if (selectedFunnel && selectedFunnel !== 'all') {
          totalMeta = parseFloat(metaData[0].valor_da_meta) || 0;
        } else {
          totalMeta = metaData.reduce((total, meta) => {
            return total + (parseFloat(meta.valor_da_meta) || 0);
          }, 0);
        }
        
        const metaDiaria = totalDays > 0 ? Math.round(totalMeta / totalDays) : 0;
        console.log(`✅ DailyPerformanceService: Meta total: ${totalMeta}, Meta diária: ${metaDiaria}`);
        return metaDiaria;
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
 * 🎯 GERAR DADOS DIÁRIOS COM ESTRUTURA PADRONIZADA
 * 
 * @param {string} startDate - Data inicial
 * @param {string} endDate - Data final
 * @param {Object} dailyLeads - Dados de leads por dia
 * @param {number} metaDiariaLeads - Meta diária de leads
 * @returns {Array} Array com dados estruturados por dia
 */
const generateDailyData = (startDate, endDate, dailyLeads, metaDiariaLeads) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  const dailyData = [];
  const current = new Date(start);
  
  while (current <= end && current <= today) {
    const dateKey = current.toISOString().split('T')[0];
    const leadsData = dailyLeads[dateKey] || { count: 0, totalValue: 0 };
    
    const leadsGap = leadsData.count - metaDiariaLeads;
    const faturamentoMeta = metaDiariaLeads * 250;
    const faturamentoGap = leadsData.totalValue - faturamentoMeta;
    const ticketMedioRealizado = leadsData.count > 0 ? leadsData.totalValue / leadsData.count : 0;
    const ticketMedioGap = ticketMedioRealizado - 250;
    
    dailyData.push({
      date: dateKey,
      leads: {
        realizado: leadsData.count,
        meta: metaDiariaLeads,
        gap: leadsGap
      },
      vendas: {
        realizado: 0, // TODO: Implementar quando você me disser onde buscar
        meta: 0,
        gap: 0
      },
      faturamento: {
        realizado: leadsData.totalValue,
        meta: faturamentoMeta,
        gap: faturamentoGap
      },
      conversao: {
        realizado: 0, // TODO: Implementar quando você me disser onde buscar
        meta: 30, // 30% de conversão padrão
        gap: 0
      },
      ticketMedio: {
        realizado: ticketMedioRealizado,
        meta: 250, // R$ 250 ticket médio padrão
        gap: ticketMedioGap
      }
    });
    
    current.setDate(current.getDate() + 1);
  }
  
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

    // Fallback para datas se não estiverem definidas
    let dataInicio = startDate;
    let dataFim = endDate;
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      const hoje = new Date().toISOString().split('T')[0];
      dataInicio = hoje;
      dataFim = hoje;
      console.log('⚠️ DailyPerformanceService: Usando datas fallback (hoje):', { dataInicio, dataFim });
    }

    // Construir filtros
    const filters = await buildFilters(selectedFunnel, selectedUnit, selectedSeller, selectedOrigin);
    
    // Calcular total de dias
    const start = new Date(dataInicio);
    const end = new Date(dataFim);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Buscar dados de leads por dia
    const dailyLeads = await fetchLeadsDataByDay(dataInicio, dataFim, filters);
    
    // Buscar meta de leads
    const metaDiariaLeads = await fetchLeadsMeta(selectedUnit, selectedFunnel, totalDays);
    
    // Gerar dados diários estruturados
    const dailyData = generateDailyData(dataInicio, dataFim, dailyLeads, metaDiariaLeads);
    
    // Calcular dados de resumo
    const summaryData = calculateSummaryData(dailyData);
    
    console.log('✅ DailyPerformanceService: Dados processados:');
    console.log('  - Total de dias:', dailyData.length);
    console.log('  - Meta diária de leads:', metaDiariaLeads);
    console.log('  - Dados de resumo:', summaryData);
    
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
