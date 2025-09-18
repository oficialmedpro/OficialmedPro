/**
 * 📊 ORIGEM RANKING SERVICE
 *
 * Serviço para buscar rankings de origens das oportunidades
 * - Ranking por faturamento (oportunidades ganhas com valor)
 * - Ranking por quantidade (oportunidades criadas)
 * - Ranking por perdas (oportunidades perdidas)
 *
 * Baseado no funnelSourcesService.js para manter consistência
 */

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * 📄 FUNÇÃO PARA BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO RECURSIVA
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

  console.log('📄 OrigemRanking: Iniciando paginação para URL:', url);

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
        console.error(`❌ OrigemRanking: Erro na página ${Math.floor(offset / pageSize) + 1}:`, response.status);
        break;
      }

      const pageData = await response.json();
      allRecords = allRecords.concat(pageData);

      console.log(`📄 OrigemRanking: Página ${Math.floor(offset / pageSize) + 1}: ${pageData.length} registros | Total: ${allRecords.length}`);

      if (pageData.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
      }

      const contentRange = response.headers.get('Content-Range');
      if (contentRange) {
        const match = contentRange.match(/(\\d+)-(\\d+)\\/(\\d+|\\*)/);
        if (match) {
          const [, , end, total] = match;
          if (total !== '*' && parseInt(end) >= parseInt(total) - 1) {
            hasMore = false;
          }
        }
      }

    } catch (error) {
      console.error(`❌ OrigemRanking: Erro ao buscar página ${Math.floor(offset / pageSize) + 1}:`, error);
      break;
    }
  }

  console.log(`✅ OrigemRanking: Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
};

/**
 * 🎯 CONSTRUIR FILTROS BASEADOS NOS PARÂMETROS
 *
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @returns {string} String com filtros construídos
 */
const buildFilters = (selectedFunnel, selectedUnit, selectedSeller) => {
  let filters = '';

  // Filtro de funil (mesma lógica do funnelSourcesService)
  if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
    filters += `&funil_id=eq.${selectedFunnel}`;
    console.log('🔍 OrigemRanking: Filtro de funil específico aplicado:', filters);
  } else {
    filters += `&funil_id=in.(6,14)`;
    console.log('🔍 OrigemRanking: Filtro de funil padrão aplicado (6,14):', filters);
  }

  // Filtro de vendedor
  if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
    filters += `&user_id=eq.${selectedSeller}`;
  }

  // Filtro de unidade
  if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
    const unidadeEncoded = encodeURIComponent(selectedUnit.toString());
    filters += `&unidade_id=eq.${unidadeEncoded}`;
  }

  return filters;
};

/**
 * 🎯 PROCESSAR E AGRUPAR DADOS POR ORIGEM
 *
 * @param {Array} data - Array de oportunidades
 * @param {string} type - Tipo de processamento ('faturamento', 'quantidade', 'perdas')
 * @returns {Array} Array com dados agrupados por origem
 */
const processOriginData = (data, type) => {
  const originMap = {};
  let totalCount = 0;
  let totalValue = 0;

  // Agrupar por origem
  data.forEach(item => {
    const origem = item.origem_oportunidade || 'Sem Origem';
    const value = parseFloat(item.value) || 0;

    if (!originMap[origem]) {
      originMap[origem] = {
        origem,
        count: 0,
        totalValue: 0
      };
    }

    originMap[origem].count++;
    originMap[origem].totalValue += value;
    totalCount++;
    totalValue += value;
  });

  // Converter para array e adicionar percentuais
  const result = Object.values(originMap).map(item => ({
    ...item,
    percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0
  }));

  // Ordenar baseado no tipo
  if (type === 'faturamento') {
    // Ordenar por valor total (maior para menor)
    result.sort((a, b) => b.totalValue - a.totalValue);
  } else if (type === 'quantidade') {
    // Ordenar por quantidade (maior para menor)
    result.sort((a, b) => b.count - a.count);
  } else if (type === 'perdas') {
    // Ordenar por quantidade de perdas (maior para menor)
    result.sort((a, b) => b.count - a.count);
  }

  console.log(`📊 OrigemRanking: Processados ${result.length} origens para tipo ${type}`, {
    totalCount,
    totalValue: totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    topOrigins: result.slice(0, 3).map(o => ({ origem: o.origem, count: o.count, value: o.totalValue }))
  });

  return result;
};

/**
 * 💰 BUSCAR RANKING DE ORIGENS POR FATURAMENTO
 * Oportunidades ganhas ordenadas por valor total
 */
const getOrigemRankingFaturamento = async (startDate, endDate, selectedFunnel, selectedUnit, selectedSeller) => {
  try {
    console.log('💰 OrigemRanking: Buscando ranking por faturamento...', {
      startDate, endDate, selectedFunnel, selectedUnit, selectedSeller
    });

    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // Construir filtros
    const filters = buildFilters(selectedFunnel, selectedUnit, selectedSeller);

    // Formatar datas
    const dataInicio = `${startDate}T00:00:00-03:00`;
    const dataFim = `${endDate}T23:59:59-03:00`;

    // Buscar oportunidades ganhas no período com valor
    const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=origem_oportunidade,value&archived=eq.0&status=eq.gain&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${filters}`;

    console.log('🔍 OrigemRanking: URL faturamento:', url);

    const data = await fetchAllRecords(url, baseHeaders);
    const result = processOriginData(data, 'faturamento');

    console.log('✅ OrigemRanking: Ranking faturamento concluído:', result.length, 'origens');

    return { success: true, data: result };

  } catch (error) {
    console.error('❌ OrigemRanking: Erro ao buscar ranking faturamento:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * 📈 BUSCAR RANKING DE ORIGENS POR QUANTIDADE
 * Oportunidades criadas ordenadas por quantidade
 */
const getOrigemRankingQuantidade = async (startDate, endDate, selectedFunnel, selectedUnit, selectedSeller) => {
  try {
    console.log('📈 OrigemRanking: Buscando ranking por quantidade...', {
      startDate, endDate, selectedFunnel, selectedUnit, selectedSeller
    });

    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // Construir filtros
    const filters = buildFilters(selectedFunnel, selectedUnit, selectedSeller);

    // Formatar datas
    const dataInicio = `${startDate}T00:00:00-03:00`;
    const dataFim = `${endDate}T23:59:59-03:00`;

    // Buscar oportunidades criadas no período
    const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=origem_oportunidade,value&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${filters}`;

    console.log('🔍 OrigemRanking: URL quantidade:', url);

    const data = await fetchAllRecords(url, baseHeaders);
    const result = processOriginData(data, 'quantidade');

    console.log('✅ OrigemRanking: Ranking quantidade concluído:', result.length, 'origens');

    return { success: true, data: result };

  } catch (error) {
    console.error('❌ OrigemRanking: Erro ao buscar ranking quantidade:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * 📉 BUSCAR RANKING DE ORIGENS POR PERDAS
 * Oportunidades perdidas ordenadas por quantidade
 */
const getOrigemRankingPerdas = async (startDate, endDate, selectedFunnel, selectedUnit, selectedSeller) => {
  try {
    console.log('📉 OrigemRanking: Buscando ranking por perdas...', {
      startDate, endDate, selectedFunnel, selectedUnit, selectedSeller
    });

    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // Construir filtros
    const filters = buildFilters(selectedFunnel, selectedUnit, selectedSeller);

    // Formatar datas
    const dataInicio = `${startDate}T00:00:00-03:00`;
    const dataFim = `${endDate}T23:59:59-03:00`;

    // Buscar oportunidades perdidas no período
    const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=origem_oportunidade,value&archived=eq.0&status=eq.lost&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${filters}`;

    console.log('🔍 OrigemRanking: URL perdas:', url);

    const data = await fetchAllRecords(url, baseHeaders);
    const result = processOriginData(data, 'perdas');

    console.log('✅ OrigemRanking: Ranking perdas concluído:', result.length, 'origens');

    return { success: true, data: result };

  } catch (error) {
    console.error('❌ OrigemRanking: Erro ao buscar ranking perdas:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * 🧪 FUNÇÃO PARA TESTAR CONEXÃO DO ORIGEM RANKING SERVICE
 */
const testOrigemRankingConnection = async () => {
  try {
    console.log('🔌 OrigemRanking: Testando conexão...');

    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [faturamento, quantidade, perdas] = await Promise.all([
      getOrigemRankingFaturamento(ontem, hoje, 'all', 'all', 'all'),
      getOrigemRankingQuantidade(ontem, hoje, 'all', 'all', 'all'),
      getOrigemRankingPerdas(ontem, hoje, 'all', 'all', 'all')
    ]);

    console.log('✅ OrigemRanking: Conexão bem-sucedida!', {
      faturamento: faturamento.data?.length || 0,
      quantidade: quantidade.data?.length || 0,
      perdas: perdas.data?.length || 0
    });

    return { success: true, data: { faturamento, quantidade, perdas } };
  } catch (error) {
    console.error('❌ OrigemRanking: Erro na conexão:', error);
    return { success: false, error: error.message };
  }
};

// Exportar service como objeto
export const origemRankingService = {
  getOrigemRankingFaturamento,
  getOrigemRankingQuantidade,
  getOrigemRankingPerdas,
  testOrigemRankingConnection
};