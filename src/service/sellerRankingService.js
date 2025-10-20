/**
 * 🏆 SELLER RANKING SERVICE
 *
 * Serviço para buscar ranking de vendedores por oportunidades ganhas
 * agrupados por user_id, ordenados por quantidade de oportunidades
 */

// Configurações do Supabase - usando configuração centralizada
import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js';

/**
 * 🏆 BUSCAR RANKING DE VENDEDORES (OPORTUNIDADES GANHAS AGRUPADAS POR USER_ID)
 *
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @param {number} page - Página atual (padrão: 1)
 * @param {number} pageSize - Tamanho da página (padrão: 6)
 * @returns {Object} Objeto com os dados paginados e informações da paginação
 */
export const getSellerRankingData = async (
  startDate = null,
  endDate = null,
  selectedFunnel = null,
  selectedUnit = null,
  selectedSeller = null,
  selectedOrigin = null,
  page = 1,
  pageSize = 6,
  rankingType = 'valor'
) => {
  try {
    // Normalizador robusto para valores monetários
    const parseMoneyValue = (raw) => {
      if (typeof raw === 'number') {
        return Number.isFinite(raw) ? raw : 0;
      }
      if (typeof raw === 'string') {
        const sanitized = raw.replace(/\./g, '').replace(',', '.');
        const num = Number(sanitized);
        return Number.isFinite(num) ? num : 0;
      }
      return 0;
    };

    console.log('='.repeat(80));
    console.log('🏆 SellerRankingService: INICIANDO BUSCA DE RANKING DE VENDEDORES');
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
      console.log('⚠️ SellerRankingService: Usando datas fallback (hoje):', { dataInicio, dataFim });
    } else {
      console.log('✅ SellerRankingService: Usando datas fornecidas:', { dataInicio, dataFim });
    }

    // Construir filtros baseados nos parâmetros
    let funilFilter = '';
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      funilFilter = `&funil_id=eq.${selectedFunnel}`;
      console.log('🔍 SellerRankingService: Filtro de funil específico aplicado:', funilFilter);
    }

    let unidadeFilter = '';
    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      const unidadeValue = selectedUnit.toString();
      const unidadeEncoded = encodeURIComponent(unidadeValue);
      unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
      console.log('🔍 SellerRankingService: Filtro unidade:', unidadeFilter);
    }

    let sellerFilter = '';
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined' && selectedSeller !== 'TODOS') {
      const sellerValue = encodeURIComponent(selectedSeller.toString());
      sellerFilter = `&user_id=eq.${sellerValue}`;
      console.log('🔍 SellerRankingService: Filtro de vendedor aplicado:', { selectedSeller, sellerFilter });
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

            if (originName.toLowerCase() === 'orgânico' || originName.toLowerCase() === 'organico') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent(originName)},origem_oportunidade.is.null)`;
            } else if (originName.toLowerCase() === 'google ads' || originName.toLowerCase() === 'googleads') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`;
            } else {
              originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
            }
            console.log('🔍 SellerRankingService: Filtro de origem:', { selectedOriginId: selectedOrigin, originName, originFilter });
          }
        }
      } catch (error) {
        console.log('⚠️ SellerRankingService: Erro ao buscar origem, usando ID diretamente:', error);
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
      }
    }

    const filtrosCombinados = originFilter + funilFilter + unidadeFilter + sellerFilter;

    console.log('🔍 SellerRankingService: Filtros construídos:', {
      funilFilter,
      unidadeFilter,
      sellerFilter,
      originFilter,
      filtrosCombinados
    });

    // 🏆 Determinar status e campo de data baseado no tipo de ranking
    let statusFilter, dateField, orderField;
    
    switch (rankingType) {
      case 'valor':
        statusFilter = 'status=eq.gain';
        dateField = 'gain_date';
        orderField = 'value.desc';
        break;
      case 'ticket':
        statusFilter = 'status=eq.gain';
        dateField = 'gain_date';
        orderField = 'value.desc'; // Será reordenado por ticket médio depois
        break;
      case 'abertas':
        statusFilter = 'status=eq.open';
        dateField = null; // Não precisa de filtro de data
        orderField = 'id.desc';
        break;
      case 'perdidas':
        statusFilter = 'status=eq.lost';
        dateField = 'lost_date';
        orderField = 'lost_date.desc';
        break;
      default:
        statusFilter = 'status=eq.gain';
        dateField = 'gain_date';
        orderField = 'value.desc';
    }

    // 🏆 URL para buscar oportunidades baseada no tipo de ranking
    let opportunitiesUrl;
    if (dateField) {
      // Com filtro de data
      opportunitiesUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,${dateField},user_id,lead_firstname,lead_city,funil_id,lead_id&archived=eq.0&${statusFilter}&${dateField}=gte.${dataInicio}&${dateField}=lte.${dataFim}${filtrosCombinados}&order=${orderField}`;
    } else {
      // Sem filtro de data (para oportunidades abertas)
      opportunitiesUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,user_id,lead_firstname,lead_city,funil_id,lead_id&archived=eq.0&${statusFilter}${filtrosCombinados}&order=${orderField}`;
    }

    console.log('🔍 SellerRankingService: URL construída:', opportunitiesUrl);
    console.log('🔍 SellerRankingService: Detalhes da URL:', {
      statusFilter,
      dateField,
      orderField,
      dataInicio,
      dataFim,
      filtrosCombinados
    });

    // Headers para a requisição
    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // Buscar todas as oportunidades
    const response = await fetch(opportunitiesUrl, {
      method: 'GET',
      headers: baseHeaders
    });

    if (!response.ok) {
      console.error('❌ SellerRankingService: Erro na requisição:', response.status);
      console.error('❌ SellerRankingService: URL que causou erro:', opportunitiesUrl);
      console.error('❌ SellerRankingService: Headers enviados:', baseHeaders);
      
      // Tentar capturar o corpo da resposta de erro
      try {
        const errorText = await response.text();
        console.error('❌ SellerRankingService: Corpo do erro:', errorText);
      } catch (e) {
        console.error('❌ SellerRankingService: Não foi possível ler o corpo do erro');
      }
      
      throw new Error(`Erro na requisição: ${response.status}`);
    }

    const allOpportunities = await response.json();

    console.log('🔍 SellerRankingService: Oportunidades encontradas:', {
      count: allOpportunities.length,
      sample: allOpportunities.slice(0, 3)
    });

    if (!allOpportunities || !Array.isArray(allOpportunities)) {
      console.error('❌ SellerRankingService: Erro ao buscar oportunidades');
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

    // 🏆 AGRUPAR OPORTUNIDADES POR USER_ID
    const sellerGroups = {};
    
    allOpportunities.forEach(opportunity => {
      if (opportunity.user_id) {
        if (!sellerGroups[opportunity.user_id]) {
          sellerGroups[opportunity.user_id] = {
            userId: opportunity.user_id,
            opportunities: [],
            totalValue: 0,
            opportunityCount: 0
          };
        }
        
        const value = parseMoneyValue(opportunity.value);
        sellerGroups[opportunity.user_id].opportunities.push(opportunity);
        sellerGroups[opportunity.user_id].totalValue += value;
        sellerGroups[opportunity.user_id].opportunityCount += 1;
      }
    });

    console.log('🏆 SellerRankingService: Vendedores agrupados:', {
      totalSellers: Object.keys(sellerGroups).length,
      sample: Object.keys(sellerGroups).slice(0, 3)
    });

    // 🏆 BUSCAR NOMES DOS VENDEDORES
    const sellerIds = Object.keys(sellerGroups);
    const sellerNames = {};

    console.log('🏆 SellerRankingService: IDs dos vendedores encontrados:', sellerIds);

    if (sellerIds.length > 0) {
      try {
        // Converter para int4 e construir query correta
        const sellerIdsInt = sellerIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        
        console.log('🏆 SellerRankingService: IDs convertidos para int:', sellerIdsInt);
        
        if (sellerIdsInt.length > 0) {
          const vendedoresUrl = `${supabaseUrl}/rest/v1/vendedores?select=id_sprint,nome&id_sprint=in.(${sellerIdsInt.join(',')})`;
          
          console.log('🏆 SellerRankingService: URL para buscar vendedores:', vendedoresUrl);
          
          const sellerResponse = await fetch(vendedoresUrl, {
            method: 'GET',
            headers: baseHeaders
          });

          console.log('🏆 SellerRankingService: Status da resposta:', sellerResponse.status);

          if (sellerResponse.ok) {
            const sellersData = await sellerResponse.json();
            console.log('🏆 SellerRankingService: Dados dos vendedores retornados:', sellersData);
            
            sellersData.forEach(seller => {
              sellerNames[seller.id_sprint] = seller.nome;
            });
            console.log('🏆 SellerRankingService: Nomes dos vendedores carregados:', sellerNames);
          } else {
            const errorText = await sellerResponse.text();
            console.error('❌ SellerRankingService: Erro ao buscar vendedores:', sellerResponse.status, errorText);
          }
        } else {
          console.log('⚠️ SellerRankingService: Nenhum ID válido para buscar vendedores');
        }
      } catch (error) {
        console.error('⚠️ SellerRankingService: Erro ao buscar nomes dos vendedores:', error);
      }
    }

    // 🏆 PROCESSAR E ORDENAR DADOS
    const processedSellers = Object.values(sellerGroups)
      .map(seller => {
        const sellerName = sellerNames[seller.userId] || `Vendedor ${seller.userId}`;
        console.log(`🏆 SellerRankingService: Mapeando vendedor ${seller.userId} -> ${sellerName}`);
        
        return {
          userId: seller.userId,
          name: sellerName,
          totalValue: seller.totalValue,
          opportunityCount: seller.opportunityCount,
          opportunities: seller.opportunities
        };
      })
      .sort((a, b) => {
        // Ordenar baseado no tipo de ranking
        switch (rankingType) {
          case 'valor':
            return b.totalValue - a.totalValue; // Por valor total
          case 'ticket':
            const ticketA = a.opportunityCount > 0 ? a.totalValue / a.opportunityCount : 0;
            const ticketB = b.opportunityCount > 0 ? b.totalValue / b.opportunityCount : 0;
            return ticketB - ticketA; // Por ticket médio
          case 'abertas':
          case 'perdidas':
            return b.opportunityCount - a.opportunityCount; // Por quantidade de oportunidades
          default:
            return b.totalValue - a.totalValue; // Padrão: por valor total
        }
      })
      .map((seller, index, sortedArray) => ({
        ...seller,
        rank: index + 1,
        progress: (() => {
          if (index === 0) return 100;
          const firstSeller = sortedArray[0]; // Usar o primeiro da lista ordenada
          let comparisonValue, currentValue;

          switch (rankingType) {
            case 'valor':
              comparisonValue = firstSeller.totalValue;
              currentValue = seller.totalValue;
              break;
            case 'ticket':
              const firstTicket = firstSeller.opportunityCount > 0 ? firstSeller.totalValue / firstSeller.opportunityCount : 0;
              const currentTicket = seller.opportunityCount > 0 ? seller.totalValue / seller.opportunityCount : 0;
              comparisonValue = firstTicket;
              currentValue = currentTicket;
              break;
            case 'abertas':
            case 'perdidas':
              comparisonValue = firstSeller.opportunityCount;
              currentValue = seller.opportunityCount;
              break;
            default:
              comparisonValue = firstSeller.totalValue;
              currentValue = seller.totalValue;
          }

          // Evitar divisão por zero e garantir que o progresso seja válido
          if (comparisonValue === 0 || currentValue === 0) {
            return 1;
          }

          const progressValue = (currentValue / comparisonValue) * 100;
          return Math.max(1, Math.min(100, Math.round(progressValue)));
        })()
      }));

    console.log('🏆 SellerRankingService: Vendedores processados:', {
      total: processedSellers.length,
      sample: processedSellers.slice(0, 3)
    });

    // 🏆 APLICAR PAGINAÇÃO
    const totalItems = processedSellers.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedData = processedSellers.slice(startIndex, endIndex);

    console.log(`✅ SellerRankingService: ${totalItems} vendedores encontrados`);
    console.log(`📄 SellerRankingService: Página ${page}/${totalPages} (${pagedData.length} itens)`);

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

    console.log('✅ SellerRankingService: Dados processados:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro no SellerRankingService:', error);
    throw error;
  }
};

/**
 * 🏆 BUSCAR INFORMAÇÕES ADICIONAIS PARA DISPLAY (nomes de filtros)
 *
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - ID da origem selecionada
 * @returns {Object} Nomes dos filtros para exibição
 */
export const getSellerRankingFilterNames = async (
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
      const sellerId = parseInt(selectedSeller);
      if (!isNaN(sellerId)) {
        promises.push(
          fetch(`${supabaseUrl}/rest/v1/vendedores?select=nome&id_sprint=eq.${sellerId}`, {
            method: 'GET',
            headers: baseHeaders
          }).then(res => res.json()).then(data => ({ type: 'seller', data }))
        );
      }
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
