/**
 * 🎯 TICKET RANKING SERVICE
 *
 * Serviço para buscar as oportunidades ganhas ordenadas por valor (ticket)
 * do maior para o menor, com paginação e filtros
 */

// Configurações do Supabase - usando configuração centralizada
import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js';

/**
 * 🎯 FUNÇÃO PARA BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO RECURSIVA
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

  console.log('📄 TicketRanking: Iniciando paginação para URL:', url);

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
        console.error(`❌ TicketRanking: Erro na página ${Math.floor(offset / pageSize) + 1}:`, response.status);
        break;
      }

      const pageData = await response.json();
      allRecords = allRecords.concat(pageData);

      console.log(`📄 TicketRanking: Página ${Math.floor(offset / pageSize) + 1}: ${pageData.length} registros | Total: ${allRecords.length}`);

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
      console.error(`❌ TicketRanking: Erro ao buscar página ${Math.floor(offset / pageSize) + 1}:`, error);
      break;
    }
  }

  console.log(`✅ TicketRanking: Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
};

/**
 * 🎯 BUSCAR RANKING DE TICKETS (OPORTUNIDADES GANHAS ORDENADAS POR VALOR)
 *
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada (formato [1], [2], etc.)
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @param {number} page - Página atual (padrão: 1)
 * @param {number} pageSize - Tamanho da página (padrão: 20)
 * @returns {Object} Objeto com os dados paginados e informações da paginação
 */
export const getTicketRankingData = async (
  startDate = null,
  endDate = null,
  selectedFunnel = null,
  selectedUnit = null,
  selectedSeller = null,
  selectedOrigin = null,
  page = 1,
  pageSize = 20
) => {
  try {
    // Normalizador robusto para valores monetários vindos do Supabase/CRM
    const parseMoneyValue = (raw) => {
      if (typeof raw === 'number') {
        return Number.isFinite(raw) ? raw : 0;
      }
      if (typeof raw === 'string') {
        // Trata formatos "1.234,56" e "1234.56"
        const sanitized = raw.replace(/\./g, '').replace(',', '.');
        const num = Number(sanitized);
        return Number.isFinite(num) ? num : 0;
      }
      return 0;
    };

    console.log('='.repeat(80));
    console.log('🎯 TicketRankingService: INICIANDO BUSCA DE RANKING');
    console.log('📅 Parâmetros recebidos:');
    console.log('  - startDate:', startDate, typeof startDate);
    console.log('  - endDate:', endDate, typeof endDate);
    console.log('  - selectedFunnel:', selectedFunnel, typeof selectedFunnel);
    console.log('  - selectedUnit:', selectedUnit, typeof selectedUnit);
    console.log('  - selectedSeller:', selectedSeller, typeof selectedSeller);
    console.log('  - selectedOrigin:', selectedOrigin, typeof selectedOrigin);
    console.log('  - page:', page, '| pageSize:', pageSize);
    console.log('='.repeat(80));

    // Data de hoje para fallback
    const hoje = new Date().toISOString().split('T')[0];

    // Fallback para datas se não estiverem definidas
    let dataInicio = startDate;
    let dataFim = endDate;

    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      dataInicio = hoje;
      dataFim = hoje;
      console.log('⚠️ TicketRankingService: Usando datas fallback (hoje):', { dataInicio, dataFim });
    } else {
      console.log('✅ TicketRankingService: Usando datas fornecidas:', { dataInicio, dataFim });
    }

    // Construir filtros baseados nos parâmetros
    let funilFilter = '';
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      funilFilter = `&funil_id=eq.${selectedFunnel}`;
      console.log('🔍 TicketRankingService: Filtro de funil específico aplicado:', funilFilter);
    } else {
      // Para debug inicial, vou remover o filtro de funil para ver se retorna dados
      funilFilter = '';
      console.log('🔍 TicketRankingService: DEBUG - Removendo filtro de funil para testar');
    }

    let unidadeFilter = '';
    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      const unidadeValue = selectedUnit.toString();
      const unidadeEncoded = encodeURIComponent(unidadeValue);

      unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
      console.log('🔍 TicketRanking: Filtro unidade:', unidadeFilter);
    }

    let sellerFilter = '';
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined' && selectedSeller !== 'TODOS') {
      const sellerValue = encodeURIComponent(selectedSeller.toString());
      sellerFilter = `&user_id=eq.${sellerValue}`;
      console.log('🔍 TicketRanking: Filtro de vendedor aplicado:', { selectedSeller, sellerFilter });
    } else {
      console.log('🔍 TicketRanking: Sem filtro de vendedor:', { selectedSeller, type: typeof selectedSeller });
    }

    let originFilter = '';
    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== '' && selectedOrigin !== 'undefined') {
      // Buscar o nome da origem na tabela origem_oportunidade
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

            // 🌱 LÓGICA PARA ORIGEM "ORGÂNICO": incluir também registros com origem_oportunidade=null
            if (originName.toLowerCase() === 'orgânico' || originName.toLowerCase() === 'organico') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent(originName)},origem_oportunidade.is.null)`;
              console.log('🌱 TicketRanking: Filtro de origem Orgânico (incluindo NULL):', { selectedOriginId: selectedOrigin, originName, originFilter });
            // 🔎 LÓGICA PARA "GOOGLE ADS": usar EXATAMENTE o mesmo filtro OR
            } else if (originName.toLowerCase() === 'google ads' || originName.toLowerCase() === 'googleads') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`;
              console.log('🔎 TicketRanking: Filtro Google Ads com OR completo:', { selectedOriginId: selectedOrigin, originName, originFilter });
            } else {
              originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
              console.log('🔍 TicketRanking: Filtro de origem convertido:', { selectedOriginId: selectedOrigin, originName, originFilter });
            }
          } else {
            console.log('⚠️ TicketRanking: Origem não encontrada para ID:', selectedOrigin);
          }
        } else {
          console.log('⚠️ TicketRanking: Erro ao buscar origem, usando ID diretamente:', selectedOrigin);
          originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
        }
      } catch (error) {
        console.log('⚠️ TicketRanking: Erro ao buscar origem, usando ID diretamente:', error);
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
      }
    }

    // CORREÇÃO CRÍTICA: Colocar originFilter PRIMEIRO para evitar conflito com AND/OR no PostgREST
    const filtrosCombinados = originFilter + funilFilter + unidadeFilter + sellerFilter;

    console.log('🔍 TicketRanking: Filtros construídos:');
    console.log('  - funilFilter:', funilFilter);
    console.log('  - unidadeFilter:', unidadeFilter);
    console.log('  - sellerFilter:', sellerFilter);
    console.log('  - originFilter:', originFilter);
    console.log('  - filtrosCombinados:', filtrosCombinados);

    // 🎯 URL para buscar oportunidades ganhas - incluindo campos do lead, funil_id e lead_id para os links
    const ticketRankingUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,gain_date,lead_firstname,lead_city,lead_whatsapp,funil_id,lead_id&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}${filtrosCombinados}&order=value.desc`;

    // URL simplificada para debug - incluindo campos do lead
    const debugUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,gain_date,status,lead_firstname,lead_city&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}&order=value.desc&limit=10`;

    console.log('🔍 TicketRanking: URL DEBUG simplificada:', debugUrl);

    console.log('🔍 TicketRanking: URL construída:', ticketRankingUrl);
    console.log('🔍 TicketRanking: Detalhes dos filtros:', {
      dataInicio,
      dataFim,
      selectedFunnel,
      selectedUnit,
      selectedSeller,
      selectedOrigin,
      filtrosCombinados
    });

    // 🎯 EXECUTAR QUERY COM PAGINAÇÃO PARA OBTER TODOS OS REGISTROS
    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // Teste inicial: buscar com URL simplificada primeiro
    console.log('🔍 TicketRanking: Testando busca simplificada primeiro...');
    try {
      const testResponse = await fetch(debugUrl, {
        method: 'GET',
        headers: baseHeaders
      });

      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ TicketRanking: Teste simples retornou:', {
          count: testData.length,
          sample: testData.slice(0, 2)
        });
      } else {
        console.error('❌ TicketRanking: Teste simples falhou:', testResponse.status);
      }
    } catch (error) {
      console.error('❌ TicketRanking: Erro no teste simples:', error);
    }

    // Buscar todos os registros
    const allOpportunities = await fetchAllRecords(ticketRankingUrl, baseHeaders);

    console.log('🔍 TicketRanking: Resultado da busca:', {
      type: typeof allOpportunities,
      isArray: Array.isArray(allOpportunities),
      length: allOpportunities ? allOpportunities.length : 'N/A',
      sample: allOpportunities ? allOpportunities.slice(0, 3) : 'N/A'
    });

    if (!allOpportunities || !Array.isArray(allOpportunities)) {
      console.error('❌ TicketRanking: Erro ao buscar oportunidades');
      return {
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          pageSize: pageSize,
          hasNext: false,
          hasPrev: false
        }
      };
    }

    // 🎯 PROCESSAR E FORMATAR DADOS
    const processedOpportunities = allOpportunities.map((opp, index) => {
      const valor = parseMoneyValue(opp.value);

      // Criar nome no formato: "ID Oportunidade | Nome | Cidade"
      let displayName = `${opp.id}`;

      if (opp.lead_firstname) {
        displayName += ` | ${opp.lead_firstname}`;
      }

      if (opp.lead_city) {
        displayName += ` | ${opp.lead_city}`;
      }

      return {
        id: opp.id,
        rank: index + 1, // Ranking baseado na posição após ordenação
        name: displayName,
        ticket: valor,
        progress: index === 0 ? 100 : Math.max(1, Math.round((valor / allOpportunities[0].value) * 100)), // Progresso relativo ao maior valor
        gainDate: opp.gain_date,
        funnelId: opp.funil_id, // Para construir o link do CRM
        leadId: opp.lead_id, // Para construir o link do perfil do lead
        leadWhatsapp: opp.lead_whatsapp // WhatsApp do lead
      };
    });

    // 🎯 CALCULAR PAGINAÇÃO
    const totalItems = processedOpportunities.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedData = processedOpportunities.slice(startIndex, endIndex);

    console.log(`✅ TicketRanking: ${totalItems} oportunidades encontradas`);
    console.log(`📄 TicketRanking: Página ${page}/${totalPages} (${pagedData.length} itens)`);

    const result = {
      data: pagedData,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        pageSize: pageSize,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    console.log('✅ TicketRankingService: Dados processados:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro no TicketRankingService:', error);
    throw error;
  }
};

/**
 * 🎯 BUSCAR INFORMAÇÕES ADICIONAIS PARA DISPLAY (nomes de filtros)
 *
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - ID da origem selecionada
 * @returns {Object} Nomes dos filtros para exibição
 */
export const getTicketRankingFilterNames = async (
  selectedFunnel = null,
  selectedUnit = null,
  selectedSeller = null,
  selectedOrigin = null
) => {
  try {
    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
    };

    const promises = [];

    // Buscar nome do funil
    if (selectedFunnel && selectedFunnel !== 'all') {
      promises.push(
        fetch(`${supabaseUrl}/rest/v1/funis?select=nome_funil&id_funil_sprint=eq.${selectedFunnel}`, {
          method: 'GET',
          headers: baseHeaders
        }).then(res => res.json()).then(data => ({ type: 'funnel', data }))
      );
    }

    // Buscar nome da unidade
    if (selectedUnit && selectedUnit !== 'all') {
      promises.push(
        fetch(`${supabaseUrl}/rest/v1/unidades?select=unidade&codigo_sprint=eq.${encodeURIComponent(selectedUnit)}`, {
          method: 'GET',
          headers: baseHeaders
        }).then(res => res.json()).then(data => ({ type: 'unit', data }))
      );
    }

    // Buscar nome do vendedor
    if (selectedSeller && selectedSeller !== 'all') {
      promises.push(
        fetch(`${supabaseUrl}/rest/v1/vendedores?select=nome&id_sprint=eq.${parseInt(selectedSeller)}`, {
          method: 'GET',
          headers: baseHeaders
        }).then(res => res.json()).then(data => ({ type: 'seller', data }))
      );
    }

    // Buscar nome da origem
    if (selectedOrigin && selectedOrigin !== 'all') {
      promises.push(
        fetch(`${supabaseUrl}/rest/v1/origem_oportunidade?select=nome&id=eq.${selectedOrigin}`, {
          method: 'GET',
          headers: baseHeaders
        }).then(res => res.json()).then(data => ({ type: 'origin', data }))
      );
    }

    const results = await Promise.all(promises);

    const filterNames = {
      funnelName: '',
      unitName: '',
      sellerName: '',
      originName: ''
    };

    results.forEach(result => {
      if (result.data && result.data.length > 0) {
        switch (result.type) {
          case 'funnel':
            filterNames.funnelName = result.data[0].nome_funil;
            break;
          case 'unit':
            filterNames.unitName = result.data[0].unidade;
            break;
          case 'seller':
            filterNames.sellerName = result.data[0].nome;
            break;
          case 'origin':
            filterNames.originName = result.data[0].nome;
            break;
        }
      }
    });

    return filterNames;

  } catch (error) {
    console.error('❌ Erro ao buscar nomes dos filtros:', error);
    return {
      funnelName: '',
      unitName: '',
      sellerName: '',
      originName: ''
    };
  }
};