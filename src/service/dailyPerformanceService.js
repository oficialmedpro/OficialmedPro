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

    // ⚡ OTIMIZAÇÃO: Limitar busca para reduzir paginação desnecessária
    const leadsUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,create_date&archived=eq.0&create_date=gte.${startDate}&create_date=lte.${endDate}T23:59:59${filters.combined}&limit=10000`;
    
    console.log('⚡ DailyPerformanceService: URL leads OTIMIZADA (limit=10000):', leadsUrl);
    console.log('⚡ DailyPerformanceService: Parâmetros:', { startDate, endDate, filtersCombined: filters.combined });
    
    // ⚡ OTIMIZAÇÃO: Usar fetchAllRecords apenas se necessário
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
 * @param {Date} currentDate - Data atual para verificar dia da semana
 * @returns {number} Meta diária de leads
 */
const fetchLeadsMeta = async (selectedUnit, selectedFunnel, selectedSeller, totalDays, currentDate = null) => {
  try {
    console.log('📊 DailyPerformanceService: Buscando meta de leads...');
    
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : null;
    
    // Verificar dia da semana para aplicar regras específicas
    const dayOfWeek = currentDate ? currentDate.getDay() : null;

    // Se for domingo (0), meta = 0
    if (dayOfWeek === 0) {
      console.log('🟡 DailyPerformanceService: Domingo detectado - meta de leads = 0');
      return 0;
    }

    // Dashboard específico para metas diárias de oportunidades
    let dashboard = 'oportunidades_diaria';

    // Se for sábado (6), usar dashboard específico
    if (dayOfWeek === 6) {
      dashboard = 'oportunidades_sabado';
      console.log('🟡 DailyPerformanceService: Sábado detectado - usando dashboard específico:', dashboard);
    }
    
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
        console.log(`✅ DailyPerformanceService: Meta diária de leads encontrada: ${totalMeta}`);
        return Math.round(totalMeta);
      }
    }

    // Se é um funil específico e não encontrou meta, retornar 0
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      console.log(`⚠️ DailyPerformanceService: Nenhuma meta encontrada para funil ${selectedFunnel} - retornando 0`);
      return 0;
    }

    // Fallback: meta padrão de 80 leads por dia (apenas para "todos os funis")
    const metaPadrao = 80;
    console.log(`⚠️ DailyPerformanceService: Usando meta padrão: ${metaPadrao} leads/dia`);
    return metaPadrao;
    
  } catch (error) {
    console.error('❌ DailyPerformanceService: Erro ao buscar meta de leads:', error);
    // Se é um funil específico e deu erro, retornar 0
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      return 0;
    }
    return 80; // Meta padrão apenas para "todos os funis"
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

    // ⚡ OTIMIZAÇÃO: Limitar busca para vendas também
    const vendasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,gain_date&archived=eq.0&status=eq.gain&gain_date=gte.${startDate}&gain_date=lte.${endDate}T23:59:59${filters.combined}&limit=10000`;
    
    console.log('⚡ DailyPerformanceService: URL vendas OTIMIZADA (limit=10000):', vendasUrl);
    console.log('⚡ DailyPerformanceService: Parâmetros:', { startDate, endDate, filtersCombined: filters.combined });
    
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
 * @param {Date} currentDate - Data atual para verificar dia da semana
 * @returns {number} Meta diária de vendas
 */
const fetchVendasMeta = async (selectedUnit, selectedFunnel, selectedSeller, totalDays, currentDate = null) => {
  try {
    console.log('📊 DailyPerformanceService: Buscando meta de vendas...');
    
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : null;
    
    // Verificar dia da semana para aplicar regras específicas
    const dayOfWeek = currentDate ? currentDate.getDay() : null;

    // Se for domingo (0), meta = 0
    if (dayOfWeek === 0) {
      console.log('🟡 DailyPerformanceService: Domingo detectado - meta de vendas = 0');
      return 0;
    }

    // Dashboard específico para metas diárias de vendas/ganhas
    let dashboard = 'oportunidades_diaria_ganhas';

    // Se for sábado (6), usar dashboard específico
    if (dayOfWeek === 6) {
      dashboard = 'oportunidades_aabado_ganhas'; // Como especificado pelo usuário
      console.log('🟡 DailyPerformanceService: Sábado detectado - usando dashboard específico:', dashboard);
    }
    
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
        console.log(`✅ DailyPerformanceService: Meta diária de vendas encontrada: ${totalMeta}`);
        return Math.round(totalMeta);
      }
    }

    // Se é um funil específico e não encontrou meta, retornar 0
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      console.log(`⚠️ DailyPerformanceService: Nenhuma meta de vendas encontrada para funil ${selectedFunnel} - retornando 0`);
      return 0;
    }

    // Fallback: meta padrão de 20 vendas por dia (apenas para "todos os funis")
    const metaPadrao = 20;
    console.log(`⚠️ DailyPerformanceService: Usando meta padrão de vendas: ${metaPadrao} vendas/dia`);
    return metaPadrao;
    
  } catch (error) {
    console.error('❌ DailyPerformanceService: Erro ao buscar meta de vendas:', error);
    // Se é um funil específico e deu erro, retornar 0
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      return 0;
    }
    return 20; // Meta padrão apenas para "todos os funis"
  }
};

/**
 * 🎯 BUSCAR META DE FATURAMENTO POR DIA
 *
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {number} totalDays - Total de dias no período
 * @param {Date} currentDate - Data atual para verificar dia da semana
 * @returns {number} Meta diária de faturamento
 */
const fetchFaturamentoMeta = async (selectedUnit, selectedFunnel, selectedSeller, totalDays, currentDate = null) => {
  try {
    console.log('📊 DailyPerformanceService: Buscando meta de faturamento...');
    
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : null;
    
    // Verificar dia da semana para aplicar regras específicas
    const dayOfWeek = currentDate ? currentDate.getDay() : null;

    // Se for domingo (0), meta = 0
    if (dayOfWeek === 0) {
      console.log('🟡 DailyPerformanceService: Domingo detectado - meta de faturamento = 0');
      return 0;
    }

    // Dashboard específico para metas de faturamento
    let dashboard = 'oportunidades_faturamento';

    // Se for sábado (6), usar dashboard específico
    if (dayOfWeek === 6) {
      dashboard = 'oportunidades_faturamento_sabado';
      console.log('🟡 DailyPerformanceService: Sábado detectado - usando dashboard específico:', dashboard);
    }
    
    // Montar filtros
    const unidadeFilter = unidadeParaMeta ? `&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}` : '';
    const funilFilter = (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined')
      ? `&funil=eq.${selectedFunnel}`
      : `&funil=in.(6,14)`;
    const vendedorFilter = (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined')
      ? `&vendedor_id=eq.${selectedSeller}`
      : '';
    
    const metaUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&dashboard=eq.${dashboard}${funilFilter}${vendedorFilter}${unidadeFilter}`;
    
    console.log('🔍 DailyPerformanceService: URL meta faturamento:', metaUrl);
    
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
        console.log(`✅ DailyPerformanceService: Meta diária de faturamento encontrada: ${totalMeta}`);
        return Math.round(totalMeta);
      }
    }

    // Se é um funil específico e não encontrou meta, retornar 0
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      console.log(`⚠️ DailyPerformanceService: Nenhuma meta de faturamento encontrada para funil ${selectedFunnel} - retornando 0`);
      return 0;
    }

    // Fallback: meta padrão de R$ 6.000 por dia (apenas para "todos os funis")
    const metaPadrao = 6000;
    console.log(`⚠️ DailyPerformanceService: Usando meta padrão de faturamento: R$ ${metaPadrao}/dia`);
    return metaPadrao;
    
  } catch (error) {
    console.error('❌ DailyPerformanceService: Erro ao buscar meta de faturamento:', error);
    // Se é um funil específico e deu erro, retornar 0
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      return 0;
    }
    return 6000; // Meta padrão apenas para "todos os funis"
  }
};

/**
 * 🎯 BUSCAR META DE TAXA DE CONVERSÃO POR DIA
 *
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {Date} currentDate - Data atual para verificar dia da semana
 * @returns {number} Meta diária de taxa de conversão em %
 */
const fetchTaxaConversaoMeta = async (selectedUnit, selectedFunnel, selectedSeller, currentDate = null) => {
  try {
    console.log('📊 DailyPerformanceService: Buscando meta de taxa de conversão...');

    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : null;

    // Verificar dia da semana para aplicar regras específicas
    const dayOfWeek = currentDate ? currentDate.getDay() : null;

    // Se for domingo (0), meta = 0
    if (dayOfWeek === 0) {
      console.log('🟡 DailyPerformanceService: Domingo detectado - meta de taxa de conversão = 0');
      return 0;
    }

    // Dashboard específico para metas de taxa de conversão diária
    let dashboard = 'taxa_conversao_diaria';

    // Se for sábado (6), usar dashboard específico
    if (dayOfWeek === 6) {
      dashboard = 'taxa_conversao_sabado';
      console.log('🟡 DailyPerformanceService: Sábado detectado - usando dashboard específico:', dashboard);
    }

    // Montar filtros
    const unidadeFilter = unidadeParaMeta ? `&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}` : '';
    const funilFilter = (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined')
      ? `&funil=eq.${selectedFunnel}`
      : `&funil=in.(6,14)`;
    const vendedorFilter = (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined')
      ? `&vendedor_id=eq.${selectedSeller}`
      : '';

    const metaUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&dashboard=eq.${dashboard}${funilFilter}${vendedorFilter}${unidadeFilter}`;

    console.log('🔍 DailyPerformanceService: URL meta taxa conversão:', metaUrl);

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
        // Para taxa de conversão, calculamos a MÉDIA ao invés de somar (faz mais sentido estatisticamente)
        const validMetas = metaData.filter(meta => parseFloat(meta.valor_da_meta) > 0);
        if (validMetas.length > 0) {
          const totalMeta = validMetas.reduce((total, meta) => total + (parseFloat(meta.valor_da_meta) || 0), 0);
          const mediaMeta = totalMeta / validMetas.length;
          console.log(`✅ DailyPerformanceService: Meta média de taxa de conversão encontrada: ${mediaMeta}% (${validMetas.length} vendedor(es))`);
          return Math.round(mediaMeta * 100) / 100; // Arredondar para 2 casas decimais
        }
      }
    }

    // Se é um funil específico e não encontrou meta, retornar 0
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      console.log(`⚠️ DailyPerformanceService: Nenhuma meta de taxa de conversão encontrada para funil ${selectedFunnel} - retornando 0`);
      return 0;
    }

    // Fallback: meta padrão de 30% de conversão (apenas para "todos os funis")
    const metaPadrao = 30;
    console.log(`⚠️ DailyPerformanceService: Usando meta padrão de taxa de conversão: ${metaPadrao}%`);
    return metaPadrao;

  } catch (error) {
    console.error('❌ DailyPerformanceService: Erro ao buscar meta de taxa de conversão:', error);
    // Se é um funil específico e deu erro, retornar 0
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      return 0;
    }
    return 30; // Meta padrão apenas para "todos os funis"
  }
};

/**
 * 🎯 BUSCAR META DE TICKET MÉDIO POR DIA
 *
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {Date} currentDate - Data atual para verificar dia da semana
 * @returns {number} Meta de ticket médio em R$
 */
const fetchTicketMedioMeta = async (selectedUnit, selectedFunnel, selectedSeller, currentDate = null) => {
  try {
    console.log('📊 DailyPerformanceService: Buscando meta de ticket médio...');

    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : null;

    // Verificar dia da semana para aplicar regras específicas
    const dayOfWeek = currentDate ? currentDate.getDay() : null;

    // Se for domingo (0), meta = 0
    if (dayOfWeek === 0) {
      console.log('🟡 DailyPerformanceService: Domingo detectado - meta de ticket médio = 0');
      return 0;
    }

    // Dashboard específico para metas de ticket médio diário
    let dashboard = 'ticket_medio_diario';

    // Se for sábado (6), usar dashboard específico
    if (dayOfWeek === 6) {
      dashboard = 'ticket_medio_sabado';
      console.log('🟡 DailyPerformanceService: Sábado detectado - usando dashboard específico:', dashboard);
    }

    // Montar filtros
    const unidadeFilter = unidadeParaMeta ? `&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}` : '';
    const funilFilter = (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined')
      ? `&funil=eq.${selectedFunnel}`
      : `&funil=in.(6,14)`;
    const vendedorFilter = (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined')
      ? `&vendedor_id=eq.${selectedSeller}`
      : '';

    const metaUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&dashboard=eq.${dashboard}${funilFilter}${vendedorFilter}${unidadeFilter}`;

    console.log('🔍 DailyPerformanceService: URL meta ticket médio:', metaUrl);

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
        // Para ticket médio, calculamos a MÉDIA ao invés de somar (faz mais sentido estatisticamente)
        const validMetas = metaData.filter(meta => parseFloat(meta.valor_da_meta) > 0);
        if (validMetas.length > 0) {
          const totalMeta = validMetas.reduce((total, meta) => total + (parseFloat(meta.valor_da_meta) || 0), 0);
          const mediaMeta = totalMeta / validMetas.length;
          console.log(`✅ DailyPerformanceService: Meta média de ticket médio encontrada: R$ ${mediaMeta} (${validMetas.length} vendedor(es))`);
          return Math.round(mediaMeta * 100) / 100; // Arredondar para 2 casas decimais
        }
      }
    }

    // Se é um funil específico e não encontrou meta, retornar 0
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      console.log(`⚠️ DailyPerformanceService: Nenhuma meta de ticket médio encontrada para funil ${selectedFunnel} - retornando 0`);
      return 0;
    }

    // Fallback: meta padrão de R$ 250 (apenas para "todos os funis")
    const metaPadrao = 250;
    console.log(`⚠️ DailyPerformanceService: Usando meta padrão de ticket médio: R$ ${metaPadrao}`);
    return metaPadrao;

  } catch (error) {
    console.error('❌ DailyPerformanceService: Erro ao buscar meta de ticket médio:', error);
    // Se é um funil específico e deu erro, retornar 0
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      return 0;
    }
    return 250; // Meta padrão apenas para "todos os funis"
  }
};

/**
 * 🎯 BUSCAR TODAS AS METAS DE UMA VEZ (OTIMIZAÇÃO DE PERFORMANCE)
 *
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @returns {Object} Objeto com todas as metas organizadas por dashboard
 */
const fetchAllMetasOptimized = async (selectedUnit, selectedFunnel, selectedSeller) => {
  try {
    console.log('⚡ DailyPerformanceService: Buscando TODAS as metas de uma vez (OTIMIZADO)...');
    
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : null;
    
    // Montar filtros
    const unidadeFilter = unidadeParaMeta ? `&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}` : '';
    const funilFilter = (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined')
      ? `&funil=eq.${selectedFunnel}`
      : `&funil=in.(6,14)`;
    const vendedorFilter = (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined')
      ? `&vendedor_id=eq.${selectedSeller}`
      : '';
    
    // Buscar TODAS as metas em uma única requisição
    const metasUrl = `${supabaseUrl}/rest/v1/metas?select=*&dashboard=in.(oportunidades_diaria,oportunidades_sabado,oportunidades_diaria_ganhas,oportunidades_aabado_ganhas,oportunidades_faturamento,oportunidades_faturamento_sabado,taxa_conversao_diaria,taxa_conversao_sabado,ticket_medio_diario,ticket_medio_sabado)${funilFilter}${vendedorFilter}${unidadeFilter}`;
    
    console.log('⚡ DailyPerformanceService: URL otimizada para todas as metas:', metasUrl);
    
    const response = await fetch(metasUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
      }
    });

    if (!response.ok) {
      console.error('❌ Erro ao buscar metas otimizadas:', response.status);
      return {};
    }

    const allMetas = await response.json();
    console.log('⚡ DailyPerformanceService: Total de metas encontradas:', allMetas.length);
    
    // Organizar metas por dashboard e tipo
    const metasOrganizadas = {
      leads: {
        diaria: {},
        sabado: {}
      },
      vendas: {
        diaria: {},
        sabado: {}
      },
      faturamento: {
        diaria: {},
        sabado: {}
      },
      conversao: {
        diaria: {},
        sabado: {}
      },
      ticketMedio: {
        diaria: {},
        sabado: {}
      }
    };

    // Processar e organizar as metas
    allMetas.forEach(meta => {
      const valor = parseFloat(meta.valor_da_meta) || 0;
      
      // 🔧 CORREÇÃO: Usar chave única que combina funil + vendedor_id para evitar sobrescrita
      const chaveUnica = `${meta.funil}_${meta.vendedor_id || 'default'}`;
      
      switch (meta.dashboard) {
        case 'oportunidades_diaria':
          metasOrganizadas.leads.diaria[chaveUnica] = valor;
          break;
        case 'oportunidades_sabado':
          metasOrganizadas.leads.sabado[chaveUnica] = valor;
          break;
        case 'oportunidades_diaria_ganhas':
          metasOrganizadas.vendas.diaria[chaveUnica] = valor;
          break;
        case 'oportunidades_aabado_ganhas':
          metasOrganizadas.vendas.sabado[chaveUnica] = valor;
          break;
        case 'oportunidades_faturamento':
          metasOrganizadas.faturamento.diaria[chaveUnica] = valor;
          break;
        case 'oportunidades_faturamento_sabado':
          metasOrganizadas.faturamento.sabado[chaveUnica] = valor;
          break;
        case 'taxa_conversao_diaria':
          metasOrganizadas.conversao.diaria[chaveUnica] = valor;
          break;
        case 'taxa_conversao_sabado':
          metasOrganizadas.conversao.sabado[chaveUnica] = valor;
          break;
        case 'ticket_medio_diario':
          metasOrganizadas.ticketMedio.diaria[chaveUnica] = valor;
          break;
        case 'ticket_medio_sabado':
          metasOrganizadas.ticketMedio.sabado[chaveUnica] = valor;
          break;
      }
    });

    console.log('⚡ DailyPerformanceService: Metas organizadas:', metasOrganizadas);
    
    // 🔧 DEBUG: Mostrar detalhes da soma das metas
    console.log('🔧 DEBUG - Detalhes das metas por tipo:');
    Object.keys(metasOrganizadas).forEach(tipo => {
      const diaria = Object.keys(metasOrganizadas[tipo].diaria).length;
      const sabado = Object.keys(metasOrganizadas[tipo].sabado).length;
      const totalDiaria = Object.values(metasOrganizadas[tipo].diaria).reduce((sum, val) => sum + val, 0);
      const totalSabado = Object.values(metasOrganizadas[tipo].sabado).reduce((sum, val) => sum + val, 0);
      
      console.log(`  ${tipo}:`);
      console.log(`    - Diária: ${diaria} registros, total: ${totalDiaria}`);
      console.log(`    - Sábado: ${sabado} registros, total: ${totalSabado}`);
    });
    
    return metasOrganizadas;
    
  } catch (error) {
    console.error('❌ DailyPerformanceService: Erro ao buscar metas otimizadas:', error);
    return {};
  }
};

/**
 * 🎯 OBTER META ESPECÍFICA DAS METAS ORGANIZADAS
 *
 * @param {Object} metasOrganizadas - Metas organizadas por dashboard
 * @param {string} tipo - Tipo da meta (leads, vendas, faturamento, conversao, ticketMedio)
 * @param {Date} currentDate - Data atual para verificar dia da semana
 * @returns {number} Meta específica
 */
const getMetaFromOrganized = (metasOrganizadas, tipo, currentDate) => {
  const dayOfWeek = currentDate ? currentDate.getDay() : null;
  
  // Domingo = 0, meta = 0
  if (dayOfWeek === 0) {
    return 0;
  }
  
  // Sábado = 6, usar metas de sábado
  const isSabado = dayOfWeek === 6;
  const tipoMetas = metasOrganizadas[tipo] || {};
  const metasEspecificas = isSabado ? tipoMetas.sabado : tipoMetas.diaria;
  
  if (!metasEspecificas || Object.keys(metasEspecificas).length === 0) {
    // Fallback para metas padrão
    const metasPadrao = {
      leads: 80,
      vendas: 20,
      faturamento: 6000,
      conversao: 30,
      ticketMedio: 250
    };
    return metasPadrao[tipo] || 0;
  }
  
  // Somar todas as metas do tipo (pode haver múltiplos funis/vendedores)
  const totalMeta = Object.values(metasEspecificas).reduce((total, meta) => total + meta, 0);
  
  // Para conversão e ticket médio, calcular média se houver múltiplos valores
  if (tipo === 'conversao' || tipo === 'ticketMedio') {
    const valoresValidos = Object.values(metasEspecificas).filter(v => v > 0);
    return valoresValidos.length > 0 ? totalMeta / valoresValidos.length : 0;
  }
  
  return Math.round(totalMeta);
};

/**
 * 🎯 GERAR DADOS DIÁRIOS COM ESTRUTURA PADRONIZADA (OTIMIZADO)
 *
 * @param {string} startDate - Data inicial
 * @param {string} endDate - Data final
 * @param {Object} dailyLeads - Dados de leads por dia
 * @param {Object} dailyVendas - Dados de vendas por dia
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {number} totalDays - Total de dias no período
 * @returns {Array} Array com dados estruturados por dia
 */
const generateDailyData = async (startDate, endDate, dailyLeads, dailyVendas, selectedUnit, selectedFunnel, selectedSeller, totalDays) => {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');
  // Tratar "hoje" usando timezone local e incluindo todo o dia atual
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  console.log('🔍 DEBUG generateDailyData OTIMIZADO:', {
    startDate,
    endDate,
    start: start.toISOString(),
    end: end.toISOString(),
    today: today.toISOString(),
    totalKeysInDailyLeads: Object.keys(dailyLeads).length,
    dailyLeadsKeys: Object.keys(dailyLeads).sort()
  });
  
  // ⚡ OTIMIZAÇÃO: Buscar TODAS as metas de uma vez
  console.log('⚡ OTIMIZAÇÃO: Buscando todas as metas de uma vez...');
  const metasOrganizadas = await fetchAllMetasOptimized(selectedUnit, selectedFunnel, selectedSeller);
  
  const dailyData = [];
  const current = new Date(start);
  
  while (current <= end && current <= today) {
    // Data LOCAL para alinhar com os outros componentes
    const dateKey = current.toLocaleDateString('sv-SE');
    const leadsData = dailyLeads[dateKey] || { count: 0, totalValue: 0 };
    const vendasData = dailyVendas[dateKey] || { count: 0, totalValue: 0 };

    // ⚡ OTIMIZAÇÃO: Obter metas das organizadas (sem requisições adicionais)
    const metaDiariaLeads = getMetaFromOrganized(metasOrganizadas, 'leads', current);
    const metaDiariaVendas = getMetaFromOrganized(metasOrganizadas, 'vendas', current);
    const metaDiariaFaturamento = getMetaFromOrganized(metasOrganizadas, 'faturamento', current);
    const metaTaxaConversao = getMetaFromOrganized(metasOrganizadas, 'conversao', current);
    const metaTicketMedio = getMetaFromOrganized(metasOrganizadas, 'ticketMedio', current);

    console.log(`🔍 Processando dia ${dateKey}:`, {
      hasLeadsData: !!dailyLeads[dateKey],
      leadsCount: leadsData.count,
      hasVendasData: !!dailyVendas[dateKey],
      vendasCount: vendasData.count,
      currentDate: current.toISOString(),
      dayOfWeek: current.getDay(),
      isDomingo: current.getDay() === 0,
      isSabado: current.getDay() === 6,
      metaDiariaLeads,
      metaDiariaVendas,
      metaDiariaFaturamento,
      metaTaxaConversao,
      metaTicketMedio
    });

    // Cálculos de leads
    const leadsGap = leadsData.count - metaDiariaLeads;
    const leadsGapPercentual = metaDiariaLeads > 0 ? (leadsGap / metaDiariaLeads) * 100 : 0;

    // Cálculos de vendas
    const vendasGap = vendasData.count - metaDiariaVendas;
    const vendasGapPercentual = metaDiariaVendas > 0 ? (vendasGap / metaDiariaVendas) * 100 : 0;

    // Cálculos de faturamento (baseado nas vendas reais)
    const faturamentoRealizado = vendasData.totalValue || 0; // Soma dos valores das vendas
    const faturamentoGap = (faturamentoRealizado || 0) - (metaDiariaFaturamento || 0);
    const faturamentoGapPercentual = (metaDiariaFaturamento && metaDiariaFaturamento > 0) ? (faturamentoGap / metaDiariaFaturamento) * 100 : 0;

    // Cálculo de conversão (vendas / leads * 100)
    const conversaoRealizada = leadsData.count > 0 ? (vendasData.count / leadsData.count) * 100 : 0;
    const conversaoGap = conversaoRealizada - metaTaxaConversao;

    // Cálculo de ticket médio (faturamento / vendas)
    const ticketMedioRealizado = (vendasData.count > 0) ? (vendasData.totalValue || 0) / vendasData.count : 0;
    const ticketMedioGap = (ticketMedioRealizado || 0) - (metaTicketMedio || 0);
    const ticketMedioGapPercentual = (metaTicketMedio && metaTicketMedio > 0) ? (ticketMedioGap / metaTicketMedio) * 100 : 0;

    // Formatar gaps para valores inteiros (leads, vendas)
    const formatGapInteger = (gap, gapPercentual) => {
      if (isNaN(gap) || isNaN(gapPercentual)) {
        return '0 (0.0%)';
      }
      const sinalGap = gap >= 0 ? '+' : '';
      const sinalPerc = gapPercentual >= 0 ? '+' : '';
      return `${sinalGap}${Math.round(gap)} (${sinalPerc}${gapPercentual.toFixed(1)}%)`;
    };

    // Formatar gaps para valores monetários (faturamento, ticket médio)
    const formatGapMonetary = (gap, gapPercentual) => {
      // Forçar conversão para número
      const gapNumber = Number(gap) || 0;
      const gapPercNumber = Number(gapPercentual) || 0;

      if (isNaN(gapNumber) || isNaN(gapPercNumber)) {
        return 'R$ 0 (0.0%)';
      }

      const sinalGap = gapNumber >= 0 ? '+' : '-';
      const sinalPerc = gapPercNumber >= 0 ? '+' : '';

      try {
        // Usar valor absoluto apenas para formatação, mas manter sinal explícito
        const valorFormatado = Math.abs(gapNumber).toLocaleString('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
        return `${sinalGap}R$ ${valorFormatado} (${sinalPerc}${gapPercNumber.toFixed(1)}%)`;
      } catch (error) {
        return 'R$ 0 (0.0%)';
      }
    };

    dailyData.push({
      date: dateKey,
      leads: {
        realizado: leadsData.count,
        meta: metaDiariaLeads,
        gap: formatGapInteger(leadsGap, leadsGapPercentual)
      },
      vendas: {
        realizado: vendasData.count,
        meta: metaDiariaVendas,
        gap: formatGapInteger(vendasGap, vendasGapPercentual)
      },
      faturamento: {
        realizado: faturamentoRealizado,
        meta: metaDiariaFaturamento,
        gap: formatGapMonetary(faturamentoGap, faturamentoGapPercentual)
      },
      conversao: {
        realizado: conversaoRealizada,
        meta: metaTaxaConversao,
        gap: conversaoGap
      },
      ticketMedio: {
        realizado: ticketMedioRealizado,
        meta: metaTicketMedio,
        gap: formatGapMonetary(ticketMedioGap, ticketMedioGapPercentual)
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
    leads: { realizado: 0, meta: 0, gap: '' },
    vendas: { realizado: 0, meta: 0, gap: '' },
    faturamento: { realizado: 0, meta: 0, gap: '' },
    conversao: { realizado: 0, meta: 0, gap: '' },
    ticketMedio: { realizado: 0, meta: 0, gap: '' }
  };

  let daysWithMeta = 0; // Para cálculo de médias corretas

  dailyData.forEach((day, index) => {
    // Sempre somar o realizado
    summary.leads.realizado += day.leads.realizado;
    summary.vendas.realizado += day.vendas.realizado;
    summary.faturamento.realizado += day.faturamento.realizado;
    summary.conversao.realizado += day.conversao.realizado;
    summary.ticketMedio.realizado += day.ticketMedio.realizado;

    // Verificar se é domingo (meta = 0) para não somar na meta total
    const isDomingo = day.leads.meta === 0 && day.vendas.meta === 0 &&
                      day.faturamento.meta === 0 && day.conversao.meta === 0 &&
                      day.ticketMedio.meta === 0;

    if (!isDomingo) {
      summary.leads.meta += day.leads.meta;
      summary.vendas.meta += day.vendas.meta;
      summary.faturamento.meta += day.faturamento.meta;
      summary.conversao.meta += day.conversao.meta;
      summary.ticketMedio.meta += day.ticketMedio.meta;
      daysWithMeta++;
    }

    console.log(`🟡 Resumo - Dia ${index + 1}:`, {
      isDomingo,
      leadsMeta: day.leads.meta,
      vendasMeta: day.vendas.meta,
      daysWithMeta
    });
  });
  
  // Formatar gaps para valores inteiros (leads, vendas)
  const formatGapInteger = (gap, gapPercentual) => {
    if (isNaN(gap) || isNaN(gapPercentual)) {
      return '0 (0.0%)';
    }
    const sinalGap = gap >= 0 ? '+' : '';
    const sinalPerc = gapPercentual >= 0 ? '+' : '';
    return `${sinalGap}${Math.round(gap)} (${sinalPerc}${gapPercentual.toFixed(1)}%)`;
  };

  // Formatar gaps para valores monetários (faturamento, ticket médio)
  const formatGapMonetary = (gap, gapPercentual) => {
    // Forçar conversão para número
    const gapNumber = Number(gap) || 0;
    const gapPercNumber = Number(gapPercentual) || 0;

    if (isNaN(gapNumber) || isNaN(gapPercNumber)) {
      return 'R$ 0 (0.0%)';
    }

    const sinalGap = gapNumber >= 0 ? '+' : '-';
    const sinalPerc = gapPercNumber >= 0 ? '+' : '';

    try {
      // Usar valor absoluto apenas para formatação, mas manter sinal explícito
      const valorFormatado = Math.abs(gapNumber).toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      return `${sinalGap}R$ ${valorFormatado} (${sinalPerc}${gapPercNumber.toFixed(1)}%)`;
    } catch (error) {
      return 'R$ 0 (0.0%)';
    }
  };

  // Calcular gaps para itens que são somados
  const leadsGap = (summary.leads.realizado || 0) - (summary.leads.meta || 0);
  const leadsGapPercentual = (summary.leads.meta && summary.leads.meta > 0) ? (leadsGap / summary.leads.meta) * 100 : 0;
  summary.leads.gap = formatGapInteger(leadsGap, leadsGapPercentual);

  const vendasGap = (summary.vendas.realizado || 0) - (summary.vendas.meta || 0);
  const vendasGapPercentual = (summary.vendas.meta && summary.vendas.meta > 0) ? (vendasGap / summary.vendas.meta) * 100 : 0;
  summary.vendas.gap = formatGapInteger(vendasGap, vendasGapPercentual);

  const faturamentoGap = (summary.faturamento.realizado || 0) - (summary.faturamento.meta || 0);
  const faturamentoGapPercentual = (summary.faturamento.meta && summary.faturamento.meta > 0) ? (faturamentoGap / summary.faturamento.meta) * 100 : 0;
  summary.faturamento.gap = formatGapMonetary(faturamentoGap, faturamentoGapPercentual);

  // Calcular médias e totais corretos
  if (dailyData.length > 0) {
    // Para conversão: calcular taxa total (vendas totais / leads totais * 100)
    summary.conversao.realizado = summary.leads.realizado > 0 ? (summary.vendas.realizado / summary.leads.realizado) * 100 : 0;
    // Usar apenas dias com meta para cálculo da meta média (excluindo domingos)
    summary.conversao.meta = daysWithMeta > 0 ? summary.conversao.meta / daysWithMeta : 0;
    const conversaoGap = summary.conversao.realizado - summary.conversao.meta;
    summary.conversao.gap = conversaoGap;

    // Para ticket médio: calcular ticket total (faturamento total / vendas totais)
    summary.ticketMedio.realizado = (summary.vendas.realizado && summary.vendas.realizado > 0) ? (summary.faturamento.realizado || 0) / summary.vendas.realizado : 0;
    // Usar apenas dias com meta para cálculo da meta média (excluindo domingos)
    summary.ticketMedio.meta = daysWithMeta > 0 ? (summary.ticketMedio.meta || 0) / daysWithMeta : 0;
    const ticketMedioGap = (summary.ticketMedio.realizado || 0) - (summary.ticketMedio.meta || 0);
    const ticketMedioGapPercentual = (summary.ticketMedio.meta && summary.ticketMedio.meta > 0) ? (ticketMedioGap / summary.ticketMedio.meta) * 100 : 0;
    summary.ticketMedio.gap = formatGapMonetary(ticketMedioGap, ticketMedioGapPercentual);
  }

  console.log('🟡 Resumo final calculado:', {
    totalDays: dailyData.length,
    daysWithMeta,
    leadsMetaTotal: summary.leads.meta,
    vendasMetaTotal: summary.vendas.meta,
    faturamentoMetaTotal: summary.faturamento.meta
  });
  
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

    // Usar datas fornecidas ou defaultar para o mês corrente
    let dataInicioMes, dataFimMes;

    if (startDate && endDate) {
      // Usar as datas fornecidas
      dataInicioMes = startDate;
      dataFimMes = endDate;
      console.log('📅 Intervalo fornecido pelos parâmetros:', { dataInicioMes, dataFimMes });
    } else {
      // Fallback: mês corrente (01 até HOJE)
      const now = new Date();
      const hojeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const inicioMesDate = new Date(hojeDate.getFullYear(), hojeDate.getMonth(), 1);
      dataInicioMes = inicioMesDate.toISOString().split('T')[0];
      dataFimMes = hojeDate.toISOString().split('T')[0];
      console.log('📅 Intervalo padrão (mês atual):', { dataInicioMes, dataFimMes });
    }

    // Construir filtros
    const filters = await buildFilters(selectedFunnel, selectedUnit, selectedSeller, selectedOrigin);
    
    // Calcular total de dias
    const start = new Date(dataInicioMes);
    const end = new Date(dataFimMes);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Buscar dados de leads por dia (mês corrente)
    const dailyLeads = await fetchLeadsDataByDay(dataInicioMes, dataFimMes, filters);
    
    // Buscar dados de vendas por dia (mês corrente)
    const dailyVendas = await fetchVendasDataByDay(dataInicioMes, dataFimMes, filters);

    // Gerar dados diários estruturados (as metas são buscadas individualmente por dia)
    const dailyData = await generateDailyData(dataInicioMes, dataFimMes, dailyLeads, dailyVendas, selectedUnit, selectedFunnel, selectedSeller, totalDays);
    
    // Calcular dados de resumo
    const summaryData = calculateSummaryData(dailyData);
    
    console.log('✅ DailyPerformanceService: Dados processados:');
    console.log('  - Total de dias:', dailyData.length);
    console.log('  - Metas calculadas dinamicamente por dia (considerando domingo e sábado)');
    console.log('  - Dados de resumo:', summaryData);
    console.log('🔍 DEBUG: Estrutura dos dados diários:');
    console.log('  - Primeiros 3 dias:', dailyData.slice(0, 3));
    console.log('  - Últimos 3 dias:', dailyData.slice(-3));
    console.log('  - Todas as datas:', dailyData.map(d => d.date));

    // DEBUG: Verificar gaps formatados
    console.log('🔍 DEBUG: Gaps formatados do primeiro dia:');
    if (dailyData.length > 0) {
      const firstDay = dailyData[0];
      console.log('  - Faturamento gap:', firstDay.faturamento.gap);
      console.log('  - Ticket médio gap:', firstDay.ticketMedio.gap);
      console.log('  - Leads gap:', firstDay.leads.gap);
      console.log('  - Vendas gap:', firstDay.vendas.gap);
    }

    console.log('🔍 DEBUG: Gaps formatados do resumo:');
    console.log('  - Faturamento gap:', summaryData.faturamento.gap);
    console.log('  - Ticket médio gap:', summaryData.ticketMedio.gap);
    console.log('  - Leads gap:', summaryData.leads.gap);
    console.log('  - Vendas gap:', summaryData.vendas.gap);
    
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
