/**
 * Serviço focado em métricas de conversão do Meta Ads
 * Fonte: tabela oportunidade_sprint (schema api)
 * - totalCriadas: count de oportunidades criadas no período (qualquer status)
 * - totalGanhas: count de oportunidades com status=gain no período (gain_date)
 * - valorGanho: soma de value das oportunidades gain no período
 * - taxaConversao: totalGanhas / totalCriadas * 100
 *
 * Observação: Mantém o filtro de origem Meta independente da seleção
 * para não quebrar o card, replicando a lógica usada noutros serviços.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

const baseHeaders = {
  'Accept': 'application/json',
  'Authorization': `Bearer ${supabaseServiceKey}`,
  'apikey': supabaseServiceKey,
  'Accept-Profile': supabaseSchema,
  'Prefer': 'count=exact'
};

/**
 * 🔍 FUNÇÃO PARA BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO RECURSIVA
 * 
 * @param {string} url - URL base da query
 * @param {Object} headers - Headers da requisição
 * @returns {Array} Todos os registros encontrados
 */
const fetchAllRecords = async (url, headers) => {
  const pageSize = 1000; // Tamanho padrão da página do Supabase
  let allRecords = [];
  let offset = 0;
  let hasMore = true;

  console.log('📄 Iniciando paginação para URL:', url);

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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const records = Array.isArray(data) ? data : [];
      
      console.log(`📄 Página ${Math.floor(offset / pageSize) + 1}: ${records.length} registros`);
      
      if (records.length === 0) {
        hasMore = false;
      } else {
        allRecords = allRecords.concat(records);
        offset += pageSize;
        
        // Se retornou menos que o pageSize, é a última página
        if (records.length < pageSize) {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error(`❌ Erro na paginação (offset ${offset}):`, error);
      hasMore = false;
    }
  }

  console.log(`✅ Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
};

/**
 * 🎯 FUNÇÃO PARA BUSCAR MÉTRICAS DE CONVERSÃO DO META
 * 
 * @param {string} startDate - Data de início (YYYY-MM-DD)
 * @param {string} endDate - Data de fim (YYYY-MM-DD)
 * @param {Object} filters - Filtros adicionais (selectedFunnel, selectedUnit, selectedSeller)
 * @returns {Promise<Object>} Métricas de conversão
 */
export const getConversaoMetrics = async (startDate, endDate, filters = {}) => {
  try {
    console.log('='.repeat(80));
    console.log('📊 MetaConversaoService: Iniciando busca de métricas de conversão');
    console.log('📅 Parâmetros recebidos:');
    console.log('  - startDate:', startDate, typeof startDate);
    console.log('  - endDate:', endDate, typeof endDate);
    console.log('  - filters:', filters);
    console.log('='.repeat(80));

    // Fallback para datas se não estiverem definidas
    let dataInicio = startDate;
    let dataFim = endDate;
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      const hoje = new Date().toISOString().split('T')[0];
      dataInicio = hoje;
      dataFim = hoje;
      console.log('⚠️ Datas não fornecidas, usando hoje como fallback:', dataInicio);
    }

    // Construir filtros de origem Meta
    const metaOriginFilter = getMetaOriginFilter();
    console.log('🎯 Filtro de origem Meta:', metaOriginFilter);
    console.log('🔍 Filtro construído:', metaOriginFilter);

    // Construir filtros adicionais
    let funilFilter = '';
    let sellerFilter = '';
    let unidadeFilter = '';

    if (filters.selectedFunnel && filters.selectedFunnel !== 'all') {
      funilFilter = `&funil_id=eq.${filters.selectedFunnel}`;
    }

    if (filters.selectedSeller && filters.selectedSeller !== 'all') {
      sellerFilter = `&seller_id=eq.${filters.selectedSeller}`;
    }

    if (filters.selectedUnit && filters.selectedUnit !== 'all') {
      // Converter unidade para formato correto se necessário
      let unidadeParaFiltro = filters.selectedUnit;
      if (typeof unidadeParaFiltro === 'string' && unidadeParaFiltro.includes('[')) {
        unidadeParaFiltro = unidadeParaFiltro;
      } else if (typeof unidadeParaFiltro === 'string') {
        unidadeParaFiltro = `[${unidadeParaFiltro}]`;
      }
      unidadeFilter = `&unidade_id=eq.${encodeURIComponent(unidadeParaFiltro)}`;
    }

    console.log('🔍 Filtros construídos:', { 
      funil: funilFilter, 
      seller: sellerFilter, 
      unidade: unidadeFilter 
    });

    // 1. TOTAL DE OPORTUNIDADES CRIADAS (qualquer status) - COM FILTRO META
    const totalCriadasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}T23:59:59${metaOriginFilter}${funilFilter}${sellerFilter}${unidadeFilter}`;
    console.log('🔍 URL Total Criadas (Meta):', totalCriadasUrl);
    console.log('🔍 Filtros aplicados:', { metaOriginFilter, funilFilter, sellerFilter, unidadeFilter });

    // 2. OPORTUNIDADES GANHAS (status=gain E gain_date no período) - COM FILTRO META
    const ganhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}T23:59:59${metaOriginFilter}${funilFilter}${sellerFilter}${unidadeFilter}`;
    console.log('🔍 URL Ganhas (Meta):', ganhasUrl);

    // 3. OPORTUNIDADES PERDIDAS (status=lost E lost_date no período) - COM FILTRO META
    const perdidasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&lost_date=gte.${dataInicio}&lost_date=lte.${dataFim}T23:59:59${metaOriginFilter}${funilFilter}${sellerFilter}${unidadeFilter}`;
    console.log('🔍 URL Perdidas (Meta):', perdidasUrl);

    // 4. OPORTUNIDADES ABERTAS (status=open) - COM FILTRO META
    const abertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open${metaOriginFilter}${funilFilter}${sellerFilter}${unidadeFilter}`;
    console.log('🔍 URL Abertas (Meta):', abertasUrl);

    // 5. BUSCAR ETAPAS DO FUNIL PARA NEGOCIAÇÃO E FOLLOW-UP
    const { getFunilEtapas } = await import('./supabase.js');
    const etapas = await getFunilEtapas(filters.selectedFunnel || 'all');
    
    const orcamentoEtapa = etapas.find(e => 
      e.name && e.name.toLowerCase().includes('orçamento') && 
      e.name.toLowerCase().includes('negociação')
    );
    const followEtapa = etapas.find(e => 
      e.name && e.name.toLowerCase().includes('follow')
    );

    console.log('🎯 Etapa Orçamento (Negociação):', orcamentoEtapa);
    console.log('🎯 Etapa Follow-Up:', followEtapa);

    // 6. OPORTUNIDADES EM NEGOCIAÇÃO E FOLLOW-UP (se etapas existirem)
    let negociacaoUrl = null;
    let followUpUrl = null;

    if (orcamentoEtapa) {
      negociacaoUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open&crm_column=eq.${orcamentoEtapa.id_etapa_sprint}${metaOriginFilter}`;
      console.log('🔍 MetaConversaoService - URL Negociação (OPEN):', negociacaoUrl);
    }

    if (followEtapa) {
      followUpUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open&crm_column=eq.${followEtapa.id_etapa_sprint}${metaOriginFilter}`;
      console.log('🔍 MetaConversaoService - URL Follow-Up (OPEN):', followUpUrl);
    }

    // Executar todas as consultas em paralelo
    const promises = [
      fetchAllRecords(totalCriadasUrl, baseHeaders),
      fetchAllRecords(ganhasUrl, baseHeaders),
      fetchAllRecords(perdidasUrl, baseHeaders),
      fetchAllRecords(abertasUrl, baseHeaders)
    ];

    // Adicionar consultas de negociação e follow-up se existirem
    if (negociacaoUrl) promises.push(fetchAllRecords(negociacaoUrl, baseHeaders));
    if (followUpUrl) promises.push(fetchAllRecords(followUpUrl, baseHeaders));

    const results = await Promise.allSettled(promises);

    // Processar resultados
    const totalCriadas = results[0].status === 'fulfilled' ? results[0].value : [];
    const ganhas = results[1].status === 'fulfilled' ? results[1].value : [];
    const perdidas = results[2].status === 'fulfilled' ? results[2].value : [];
    const abertas = results[3].status === 'fulfilled' ? results[3].value : [];

    let negociacao = [];
    let followUp = [];

    if (negociacaoUrl && results[4]) {
      negociacao = results[4].status === 'fulfilled' ? results[4].value : [];
      console.log('✅ Negociação (Meta):', negociacao.length, 'oportunidades');
    }

    if (followUpUrl) {
      const followUpIndex = negociacaoUrl ? 5 : 4;
      if (results[followUpIndex]) {
        followUp = results[followUpIndex].status === 'fulfilled' ? results[followUpIndex].value : [];
        console.log('✅ Follow-Up (Meta):', followUp.length, 'oportunidades');
      }
    }

    // Calcular métricas
    const totalCriadasCount = totalCriadas.length;
    const totalGanhas = ganhas.length;
    const totalPerdidas = perdidas.length;
    const totalAbertas = abertas.length;
    const totalNegociacao = negociacao.length;
    const totalFollowUp = followUp.length;

    // Calcular valores
    const valorGanho = ganhas.reduce((acc, r) => {
      const valor = parseFloat(r.value) || 0;
      return acc + valor;
    }, 0);

    const valorPerda = perdidas.reduce((acc, r) => {
      const valor = parseFloat(r.value) || 0;
      return acc + valor;
    }, 0);

    // Calcular valor das oportunidades em negociação
    let valorNegociacao = negociacao.reduce((acc, r) => {
      const valor = parseFloat(r.value) || 0;
      return acc + valor;
    }, 0);
    valorNegociacao = Math.round(valorNegociacao * 100) / 100;

    // Calcular valor das oportunidades em follow-up
    let valorFollowUp = followUp.reduce((acc, r) => {
      const valor = parseFloat(r.value) || 0;
      return acc + valor;
    }, 0);
    valorFollowUp = Math.round(valorFollowUp * 100) / 100;

    // Calcular taxa de conversão
    const taxaConversao = totalCriadasCount > 0 ? (totalGanhas / totalCriadasCount) * 100 : 0;

    console.log('📊 Métricas calculadas (Meta):');
    console.log('  - Total Criadas (Meta):', totalCriadasCount);
    console.log('  - Total Ganhas (Meta):', totalGanhas);
    console.log('  - Total Perdidas (Meta):', totalPerdidas);
    console.log('  - Total Abertas (Meta):', totalAbertas);
    console.log('  - Total em Negociação (Meta):', totalNegociacao);
    console.log('  - Total em Follow-Up (Meta):', totalFollowUp);
    console.log('  - Taxa de Conversão (Meta):', taxaConversao.toFixed(2) + '%');
    console.log('  - Valor Ganho (Meta):', valorGanho);
    console.log('  - Valor Perda (Meta):', valorPerda);
    console.log('  - Valor em Negociação (Meta):', valorNegociacao);
    console.log('  - Valor em Follow-Up (Meta):', valorFollowUp);

    return {
      totalCriadas: totalCriadasCount,
      totalGanhas,
      totalPerdidas,
      totalAbertas,
      valorGanho,
      valorPerda,
      taxaConversao,
      totalNegociacao,
      totalFollowUp,
      valorNegociacao,
      valorFollowUp
    };

  } catch (error) {
    console.error('❌ MetaConversaoService: Erro geral:', error);
    throw error;
  }
};

/**
 * 🎯 FUNÇÃO PARA CONSTRUIR FILTRO DE ORIGEM META
 * Replica a lógica do googleOriginFilter mas para Meta
 */
const getMetaOriginFilter = () => {
  // Filtros de origem Meta (Facebook, Instagram, Meta Ads)
  const metaOrigins = [
    'meta',
    'facebook', 
    'instagram',
    'meta ads',
    'facebook ads',
    'instagram ads'
  ];

  // Construir filtro OR para múltiplas origens
  const originConditions = metaOrigins.map(origin => 
    `or(origem_oportunidade.ilike.*${origin}*,utm_source.ilike.*${origin}*)`
  ).join(',');

  return `&or(${originConditions})`;
};

// Exportar o serviço
export const metaConversaoService = {
  getConversaoMetrics
};
