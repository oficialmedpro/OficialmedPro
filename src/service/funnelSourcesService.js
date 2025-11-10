/**
 * 📊 FUNNEL SOURCES SERVICE
 * 
 * Serviço dedicado para buscar métricas de origens na barra fc-sources-bar
 * - Oportunidades abertas por origem (status=open)
 * - Oportunidades criadas no período por origem (create_date)
 * - Oportunidades qualificadas (Novas - Desqualificadas)
 * 
 * Com paginação recursiva para garantir que todos os registros sejam buscados
 */

// Configurações do Supabase - usando configuração centralizada
import { supabaseUrl, supabaseAnonKey, supabaseSchema } from '../config/supabase.js';

// Importar serviço de qualificados
import { calcularQualificados, calcularQualificadosMultiplosFunils } from './qualificadosService.js';

/**
 * 🎯 FUNÇÃO AUXILIAR: Obter filtro de origem para fonte específica
 * 
 * @param {string} source - Nome da fonte (google, meta, organico, etc.)
 * @returns {string} Filtro de origem correspondente
 */
const getOriginFilterForSource = (source) => {
  const originFilters = {
    google: 'Google Ads',
    meta: 'Meta Ads',
    organico: 'Orgânico',
    whatsapp: 'WhatsApp',
    prescritor: 'Prescritor',
    franquia: 'Franquia'
  };
  return originFilters[source] || 'all';
};

/**
 * 📄 FUNÇÃO PARA BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO RECURSIVA
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

  console.log('📄 FunnelSources: Iniciando paginação para URL:', url);

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
        console.error(`❌ FunnelSources: Erro na página ${Math.floor(offset / pageSize) + 1}:`, response.status);
        break;
      }

      const pageData = await response.json();
      allRecords = allRecords.concat(pageData);

      console.log(`📄 FunnelSources: Página ${Math.floor(offset / pageSize) + 1}: ${pageData.length} registros | Total: ${allRecords.length}`);

      // Se retornou menos que o tamanho da página, não há mais dados
      if (pageData.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
      }

      // Verificar Content-Range header para confirmar se há mais dados
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
      console.error(`❌ FunnelSources: Erro ao buscar página ${Math.floor(offset / pageSize) + 1}:`, error);
      break;
    }
  }

  console.log(`✅ FunnelSources: Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
};

/**
 * 🎯 FUNÇÃO PARA MAPEAR ORIGEM SELECIONADA PARA NOME DA SOURCE
 */
const getSelectedSourceName = (selectedOrigin) => {
  if (!selectedOrigin || typeof selectedOrigin !== 'string') return null;
  
  switch (selectedOrigin.toLowerCase()) {
    case 'google ads':
    case 'google':
      return 'google';
    case 'meta ads':
    case 'meta':
    case 'facebook':
    case 'instagram':
      return 'meta';
    case 'orgânico':
    case 'organico':
    case 'organic':
      return 'organico';
    case 'whatsapp':
      return 'whatsapp';
    case 'prescritor':
      return 'prescritor';
    case 'franquia':
      return 'franquia';
    default:
      return null;
  }
};

/**
 * 🎯 FUNÇÃO PARA CLASSIFICAR ORIGEM DA OPORTUNIDADE
 * Usa a mesma lógica do TotalOportunidadesCard para garantir compatibilidade
 */
const classifyOrigin = (opp) => {
  const origem = opp.origem_oportunidade || opp.utm_source || '';
  const origemLower = origem.toLowerCase();
  
  // Lógica idêntica ao TotalOportunidadesCard
  if (origemLower.includes('google') || origemLower.includes('ads')) {
    return 'google';
  } else if (origemLower.includes('meta') || origemLower.includes('facebook') || origemLower.includes('instagram')) {
    return 'meta';
  } else if (origemLower.includes('organico') || origemLower.includes('orgânico') || origemLower.includes('organic') || origem === '' || origem === null) {
    return 'organico';
  } else if (origemLower.includes('whatsapp') || origemLower.includes('zap')) {
    return 'whatsapp';
  } else if (origemLower.includes('prescritor') || origemLower.includes('prescrição')) {
    return 'prescritor';
  } else if (origemLower.includes('franquia') || origemLower.includes('franchise')) {
    return 'franquia';
  } else {
    // Default para orgânico se não identificar (compatível com TotalOportunidadesCard)
    return 'organico';
  }
};

/**
 * 📊 BUSCAR MÉTRICAS DE ORIGENS PARA O FUNNEL
 *
 * @param {string} startDate - Data início (YYYY-MM-DD)
 * @param {string} endDate - Data fim (YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedOrigin - Origem selecionada (para filtrar se necessário)
 * @param {Array} etapas - Array de etapas do funil para garantir consistência
 * @returns {Object} Dados das origens organizados
 */
export const getFunnelSourcesMetrics = async (startDate, endDate, selectedFunnel, selectedSeller, selectedUnit, selectedOrigin = null, etapas = null) => {
  try {
    console.log('📊 FunnelSources: Iniciando busca de métricas...');
    console.log('📅 FunnelSources: Período:', { startDate, endDate });
    console.log('🎯 FunnelSources: Filtros:', { selectedFunnel, selectedSeller, selectedUnit, selectedOrigin });

    // Headers base com paginação
    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
      'Accept-Profile': supabaseSchema,
      'Content-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // Construir filtros dinâmicos (mesma lógica do googleConversaoService)
    let filters = '';
    
    // CORREÇÃO CRÍTICA: Usar EXATAMENTE a mesma lógica do GoogleConversaoService
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      filters += `&funil_id=eq.${selectedFunnel}`;
      console.log('🔍 FunnelSources: Filtro de funil específico aplicado:', filters);
    } else {
      filters += `&funil_id=in.(6,14)`;
      console.log('🔍 FunnelSources: Filtro de funil incluindo ambos (6 e 14):', filters);
    }
    
    if (selectedSeller && selectedSeller !== 'all') {
      filters += `&user_id=eq.${selectedSeller}`;
    }

    if (selectedUnit && selectedUnit !== 'all') {
      const unidadeEncoded = encodeURIComponent(selectedUnit.toString());
      filters += `&unidade_id=eq.${unidadeEncoded}`;
    }

    // Datas com timezone GMT-3 (compatível com GoogleConversaoService)
    const dataInicio = `${startDate}T00:00:00-03:00`;
    const dataFim = `${endDate}T23:59:59-03:00`;

    console.log('🔍 FunnelSources: Filtros construídos:', filters);
    console.log('📅 FunnelSources: Período formatado:', { dataInicio, dataFim });

    // DEFINIR FILTROS SQL POR ORIGEM (mesma lógica do GoogleConversaoService)
    const googleOriginFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`;
    const metaOriginFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Meta Ads')},origem_oportunidade.eq.${encodeURIComponent('Facebook')},origem_oportunidade.eq.${encodeURIComponent('Instagram')})`;
    const organicoOriginFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Orgânico')},origem_oportunidade.is.null)`;
    const whatsappOriginFilter = `&origem_oportunidade=eq.${encodeURIComponent('WhatsApp')}`;
    const prescritorOriginFilter = `&origem_oportunidade=eq.${encodeURIComponent('Prescritor')}`;
    const franquiaOriginFilter = `&origem_oportunidade=eq.${encodeURIComponent('Franquia')}`;

    // TEMPORARIAMENTE DESABILITADO: FILTRO DE ETAPAS
    // Removendo filtro de etapas para testar se é isso que causa a diferença
    let etapaFilter = '';
    console.log('⚠️ FunnelSources: Filtro de etapas DESABILITADO temporariamente para debug');

    // if (etapas && etapas.length > 0) {
    //   const etapaIds = etapas.map(e => e.id_etapa_sprint);
    //   etapaFilter = `&or=(${etapaIds.map(id => `crm_column.eq.${id}`).join(',')})`;
    //   console.log('🔍 FunnelSources: Aplicando filtro de etapas para consistência:', etapaFilter);
    //   console.log('🔍 FunnelSources: IDs das etapas:', etapaIds);
    // }

    // BUSCAR CADA ORIGEM SEPARADAMENTE COM FILTROS SQL ESPECÍFICOS
    console.log('🔍 FunnelSources: Buscando cada origem separadamente...');

    // Executar todas as queries em paralelo
    const promises = [];
    const sources = [
      { name: 'google', filter: googleOriginFilter },
      { name: 'meta', filter: metaOriginFilter },
      { name: 'organico', filter: organicoOriginFilter },
      { name: 'whatsapp', filter: whatsappOriginFilter },
      { name: 'prescritor', filter: prescritorOriginFilter },
      { name: 'franquia', filter: franquiaOriginFilter }
    ];

    // Se uma origem específica foi selecionada, buscar apenas essa origem
    if (selectedOrigin && selectedOrigin !== 'all' && typeof selectedOrigin === 'string') {
      console.log('🎯 FunnelSources: Filtro de origem específico aplicado:', selectedOrigin);
      
      // Encontrar o filtro correspondente à origem selecionada
      let selectedSourceFilter = '';
      switch (selectedOrigin.toLowerCase()) {
        case 'google ads':
        case 'google':
          selectedSourceFilter = googleOriginFilter;
          break;
        case 'meta ads':
        case 'meta':
        case 'facebook':
        case 'instagram':
          selectedSourceFilter = metaOriginFilter;
          break;
        case 'orgânico':
        case 'organico':
        case 'organic':
          selectedSourceFilter = organicoOriginFilter;
          break;
        case 'whatsapp':
          selectedSourceFilter = whatsappOriginFilter;
          break;
        case 'prescritor':
          selectedSourceFilter = prescritorOriginFilter;
          break;
        case 'franquia':
          selectedSourceFilter = franquiaOriginFilter;
          break;
        default:
          selectedSourceFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
          break;
      }

      // Buscar apenas a origem selecionada
      const abertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.open${selectedSourceFilter}${filters}${etapaFilter}`;
      promises.push({ type: 'abertas', source: 'selected', promise: fetchAllRecords(abertasUrl, baseHeaders) });
      
      const criadasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${selectedSourceFilter}${filters}`;
      promises.push({ type: 'criadas', source: 'selected', promise: fetchAllRecords(criadasUrl, baseHeaders) });
      
      const ganhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${selectedSourceFilter}${filters}`;
      promises.push({ type: 'ganhas', source: 'selected', promise: fetchAllRecords(ganhasUrl, baseHeaders) });
      
      const perdidasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${selectedSourceFilter}${filters}`;
      promises.push({ type: 'perdidas', source: 'selected', promise: fetchAllRecords(perdidasUrl, baseHeaders) });
      
    } else {
      // Para cada origem, buscar abertas, criadas e ganhas (comportamento padrão)
      sources.forEach(source => {
        // Abertas (status=open) - INCLUIR FILTRO DE ETAPAS PARA CONSISTÊNCIA
        const abertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.open${source.filter}${filters}${etapaFilter}`;
        promises.push({ type: 'abertas', source: source.name, promise: fetchAllRecords(abertasUrl, baseHeaders) });

        // Criadas no período
        const criadasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${source.filter}${filters}`;
        promises.push({ type: 'criadas', source: source.name, promise: fetchAllRecords(criadasUrl, baseHeaders) });

        // Ganhas no período (status=gain) - FILTRAR POR CREATE_DATE - COM VALOR
        const ganhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${source.filter}${filters}`;
        console.log(`🔍 FunnelSources: URL ganhas para ${source.name} (criadas no período):`, ganhasUrl);
        promises.push({ type: 'ganhas', source: source.name, promise: fetchAllRecords(ganhasUrl, baseHeaders) });

        // Perdidas no período (status=lost) - FILTRAR POR CREATE_DATE - COM VALOR
        const perdidasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${source.filter}${filters}`;
        console.log(`🔍 FunnelSources: URL perdidas para ${source.name} (criadas no período):`, perdidasUrl);
        console.log(`🔍 FunnelSources: Comparando URLs - Ganhas vs Perdidas (ambas por create_date):`);
        console.log(`   Ganhas: ${ganhasUrl}`);
        console.log(`   Perdidas: ${perdidasUrl}`);
        promises.push({ type: 'perdidas', source: source.name, promise: fetchAllRecords(perdidasUrl, baseHeaders) });
      });
    }

    // Total geral de criadas (sem filtro de origem)
    const totalCriadasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${filters}`;
    promises.push({ type: 'total', source: 'total', promise: fetchAllRecords(totalCriadasUrl, baseHeaders) });

    // Total geral de ganhas (sem filtro de origem) - FILTRAR POR CREATE_DATE - COM VALOR
    const totalGanhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${filters}`;
    console.log('🔍 FunnelSources: URL total ganhas (criadas no período):', totalGanhasUrl);
    promises.push({ type: 'totalGanhas', source: 'totalGanhas', promise: fetchAllRecords(totalGanhasUrl, baseHeaders) });

    // Total geral de perdidas (sem filtro de origem) - FILTRAR POR CREATE_DATE - COM VALOR
    const totalPerdidasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${filters}`;
    console.log('🔍 FunnelSources: URL total perdidas (criadas no período):', totalPerdidasUrl);
    
    // 🧪 TESTE: Query simples para verificar se há perdidas no banco (sem filtros de data)
    const testePerdidasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,status,lost_date&archived=eq.0&status=eq.lost&limit=5`;
    console.log('🧪 FunnelSources: TESTE - Query perdidas sem filtro de data:', testePerdidasUrl);
    promises.push({ type: 'testePerdidas', source: 'teste', promise: fetchAllRecords(testePerdidasUrl, baseHeaders) });
    
    promises.push({ type: 'totalPerdidas', source: 'totalPerdidas', promise: fetchAllRecords(totalPerdidasUrl, baseHeaders) });

    // 🚨 ADICIONAR QUERY PARA TOTAL DE ABERTAS PARA COMPARAÇÃO COM TotalOportunidadesCard
    const totalAbertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.open${filters}${etapaFilter}`;
    promises.push({ type: 'totalAbertas', source: 'totalAbertas', promise: fetchAllRecords(totalAbertasUrl, baseHeaders) });

    console.log('🚨 COMPARAÇÃO URL ABERTAS FunnelSources:', totalAbertasUrl);

    // Aguardar todas as promises
    const results = await Promise.all(promises.map(p => p.promise));

    // Inicializar contadores
    const sourcesData = {
      google: { abertas: 0, criadas: 0, qualificadas: 0, ganhas: 0, valorGanhas: 0, perdidas: 0, valorPerdidas: 0 },
      meta: { abertas: 0, criadas: 0, qualificadas: 0, ganhas: 0, valorGanhas: 0, perdidas: 0, valorPerdidas: 0 },
      organico: { abertas: 0, criadas: 0, qualificadas: 0, ganhas: 0, valorGanhas: 0, perdidas: 0, valorPerdidas: 0 },
      whatsapp: { abertas: 0, criadas: 0, qualificadas: 0, ganhas: 0, valorGanhas: 0, perdidas: 0, valorPerdidas: 0 },
      prescritor: { abertas: 0, criadas: 0, qualificadas: 0, ganhas: 0, valorGanhas: 0, perdidas: 0, valorPerdidas: 0 },
      franquia: { abertas: 0, criadas: 0, qualificadas: 0, ganhas: 0, valorGanhas: 0, perdidas: 0, valorPerdidas: 0 },
      total: 0,
      totalQualificadas: 0, // NOVA MÉTRICA: TOTAL DE QUALIFICADAS
      totalAbertas: 0, // ADICIONAR TOTAL REAL DE ABERTAS
      totalGanhas: 0, // ADICIONAR TOTAL DE GANHAS
      totalValorGanhas: 0, // ADICIONAR TOTAL VALOR GANHAS
      totalPerdidas: 0, // ADICIONAR TOTAL PERDIDAS
      totalValorPerdidas: 0 // ADICIONAR TOTAL VALOR PERDIDAS
    };

    // Processar resultados
    promises.forEach((promiseData, index) => {
      const data = results[index];
      const count = data ? data.length : 0;

      // Calcular valor total se houver campo 'value'
      let valorTotal = 0;
      if (data && data.length > 0) {
        console.log(`🔍 FunnelSources: Primeiro item de dados para ${promiseData.type} (${promiseData.source}):`, data[0]);
        if (data[0].value !== undefined) {
          valorTotal = data.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
          console.log(`💰 FunnelSources: Valor total calculado para ${promiseData.type} (${promiseData.source}):`, valorTotal);
        } else {
          console.log(`⚠️ FunnelSources: Campo 'value' não encontrado para ${promiseData.type} (${promiseData.source})`);
        }
      }

      if (promiseData.type === 'total') {
        sourcesData.total = count;
      } else if (promiseData.type === 'totalGanhas') {
        sourcesData.totalGanhas = count;
        sourcesData.totalValorGanhas = valorTotal;
        console.log('🎯 FunnelSources: Total ganhas encontrado:', count, 'Valor:', valorTotal);
      } else if (promiseData.type === 'totalPerdidas') {
        sourcesData.totalPerdidas = count;
        sourcesData.totalValorPerdidas = valorTotal;
        console.log('🎯 FunnelSources: Total perdidas encontrado:', count, 'Valor:', valorTotal);
        console.log('📊 FunnelSources: Dados completos de total perdidas:', data);
      } else if (promiseData.type === 'testePerdidas') {
        console.log('🧪 FunnelSources: TESTE - Perdidas encontradas no banco (sem filtro de data):', count);
        console.log('🧪 FunnelSources: TESTE - Dados de teste perdidas:', data);
      } else if (promiseData.type === 'totalAbertas') {
        sourcesData.totalAbertas = count; // SALVAR O TOTAL REAL
        console.log('🚨 COMPARAÇÃO TOTAL ABERTAS FunnelSources:', count);
      } else if (promiseData.source === 'selected') {
        // Para origem específica selecionada, aplicar o valor apenas à origem correspondente
        // e zerar as outras
        const selectedSourceName = getSelectedSourceName(selectedOrigin);
        if (selectedSourceName) {
          if (promiseData.type === 'ganhas') {
            sourcesData[selectedSourceName].ganhas = count;
            sourcesData[selectedSourceName].valorGanhas = valorTotal;
            console.log(`🎯 FunnelSources: Ganhas para origem selecionada (${selectedSourceName}):`, count, 'Valor:', valorTotal);
          } else if (promiseData.type === 'perdidas') {
            sourcesData[selectedSourceName].perdidas = count;
            sourcesData[selectedSourceName].valorPerdidas = valorTotal;
            console.log(`🎯 FunnelSources: Perdidas para origem selecionada (${selectedSourceName}):`, count, 'Valor:', valorTotal);
          } else {
            sourcesData[selectedSourceName][promiseData.type] = count;
          }
        }
      } else {
        if (promiseData.type === 'ganhas') {
          sourcesData[promiseData.source].ganhas = count;
          sourcesData[promiseData.source].valorGanhas = valorTotal;
          console.log(`🎯 FunnelSources: Ganhas para ${promiseData.source}:`, count, 'Valor:', valorTotal);
          console.log(`📊 FunnelSources: Dados completos de ganhas para ${promiseData.source}:`, data);
        } else if (promiseData.type === 'perdidas') {
          sourcesData[promiseData.source].perdidas = count;
          sourcesData[promiseData.source].valorPerdidas = valorTotal;
          console.log(`🎯 FunnelSources: Perdidas para ${promiseData.source}:`, count, 'Valor:', valorTotal);
          console.log(`📊 FunnelSources: Dados completos de perdidas para ${promiseData.source}:`, data);
        } else {
          sourcesData[promiseData.source][promiseData.type] = count;
        }
      }
    });

    // Se uma origem específica foi selecionada, zerar as outras origens
    if (selectedOrigin && selectedOrigin !== 'all' && typeof selectedOrigin === 'string') {
      const selectedSourceName = getSelectedSourceName(selectedOrigin);
      Object.keys(sourcesData).forEach(key => {
        if (key !== 'total' && key !== 'totalQualificadas' && key !== 'totalAbertas' && key !== 'totalGanhas' && key !== 'totalValorGanhas' && key !== 'totalPerdidas' && key !== 'totalValorPerdidas' && key !== selectedSourceName) {
          sourcesData[key] = { abertas: 0, criadas: 0, qualificadas: 0, ganhas: 0, valorGanhas: 0, perdidas: 0, valorPerdidas: 0 };
        }
      });
    }

    console.log('📊 FunnelSources: Sources data calculado (com filtros SQL):', sourcesData);

    // 🎯 CALCULAR MÉTRICAS QUALIFICADAS
    console.log('🎯 FunnelSources: Calculando métricas qualificadas...');
    
    try {
      // Determinar funis para cálculo
      let funilsParaCalculo = [];
      if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
        funilsParaCalculo = [selectedFunnel];
      } else {
        funilsParaCalculo = [6, 14]; // Ambos funis por padrão
      }

      // Calcular qualificadas para cada origem
      const filtrosParaQualificados = {
        selectedUnit,
        selectedSeller,
        selectedOrigin
      };

      // Calcular qualificadas para total
      console.log('🚨 DEBUG CRÍTICO: Valor sourcesData.total antes do cálculo:', sourcesData.total);
      console.log('🚨 DEBUG CRÍTICO: Tipo do valor:', typeof sourcesData.total);
      console.log('🚨 DEBUG CRÍTICO: Parâmetros para cálculo:', { startDate, endDate, funilsParaCalculo, filtrosParaQualificados });

      sourcesData.totalQualificadas = await calcularQualificadosMultiplosFunils(
        sourcesData.total,
        startDate,
        endDate,
        funilsParaCalculo,
        filtrosParaQualificados
      );

      console.log('🚨 DEBUG CRÍTICO: Resultado totalQualificadas:', sourcesData.totalQualificadas);

      // Calcular qualificadas para cada origem
      const origens = ['google', 'meta', 'organico', 'whatsapp', 'prescritor', 'franquia'];
      
      for (const origem of origens) {
        if (sourcesData[origem].criadas > 0) {
          // Para origem específica, usar apenas o funil selecionado ou ambos
          sourcesData[origem].qualificadas = await calcularQualificadosMultiplosFunils(
            sourcesData[origem].criadas,
            startDate,
            endDate,
            funilsParaCalculo,
            {
              ...filtrosParaQualificados,
              selectedOrigin: getOriginFilterForSource(origem)
            }
          );
        }
      }

      console.log('✅ FunnelSources: Métricas qualificadas calculadas:', {
        total: sourcesData.total,
        totalQualificadas: sourcesData.totalQualificadas,
        google: { criadas: sourcesData.google.criadas, qualificadas: sourcesData.google.qualificadas },
        meta: { criadas: sourcesData.meta.criadas, qualificadas: sourcesData.meta.qualificadas },
        organico: { criadas: sourcesData.organico.criadas, qualificadas: sourcesData.organico.qualificadas }
      });

    } catch (error) {
      console.error('❌ FunnelSources: Erro ao calcular qualificadas:', error);
      // Em caso de erro, manter qualificadas = criadas
      sourcesData.totalQualificadas = sourcesData.total;
      ['google', 'meta', 'organico', 'whatsapp', 'prescritor', 'franquia'].forEach(origem => {
        sourcesData[origem].qualificadas = sourcesData[origem].criadas;
      });
    }

    return sourcesData;

  } catch (error) {
    console.error('❌ FunnelSources: Erro ao buscar métricas:', error);
    throw error;
  }
};