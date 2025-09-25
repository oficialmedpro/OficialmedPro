/**
 * 🟢 OPORTUNIDADES GANHAS SERVICE
 * 
 * Serviço específico para buscar as duas métricas de Oportunidades Ganhas:
 * 1. Total de Oportunidades Ganhas (gain_date=hoje, status="gain")
 * 2. Ganhas Novas (create_date no período, status="gain")
 */

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * 🟢 FUNÇÃO PARA BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO RECURSIVA
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
        console.error(`❌ Erro na página ${Math.floor(offset / pageSize) + 1}:`, response.status);
        break;
      }

      const pageData = await response.json();
      allRecords = allRecords.concat(pageData);

      console.log(`📄 Página ${Math.floor(offset / pageSize) + 1}: ${pageData.length} registros | Total: ${allRecords.length}`);

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
      console.error(`❌ Erro ao buscar página ${Math.floor(offset / pageSize) + 1}:`, error);
      break;
    }
  }

  console.log(`✅ Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
};

/**
 * 🟢 BUSCAR MÉTRICAS DE OPORTUNIDADES GANHAS
 * 
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada (formato [1], [2], etc.)
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @returns {Object} Objeto com as métricas calculadas
 */
export const getOportunidadesGanhasMetrics = async (
  startDate = null, 
  endDate = null, 
  selectedFunnel = null, 
  selectedUnit = null, 
  selectedSeller = null, 
  selectedOrigin = null
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
    console.log('🟢 OportunidadesGanhasService: INICIANDO BUSCA DE MÉTRICAS');
    console.log('📅 Parâmetros recebidos:');
    console.log('  - startDate:', startDate, typeof startDate);
    console.log('  - endDate:', endDate, typeof endDate);
    console.log('  - selectedFunnel:', selectedFunnel, typeof selectedFunnel);
    console.log('  - selectedUnit:', selectedUnit, typeof selectedUnit);
    console.log('  - selectedSeller:', selectedSeller, typeof selectedSeller);
    console.log('  - selectedOrigin:', selectedOrigin, typeof selectedOrigin);
    console.log('='.repeat(80));

    // Data de hoje para fallback
    const hoje = new Date().toISOString().split('T')[0];

    // Fallback para datas se não estiverem definidas
    let dataInicio = startDate;
    let dataFim = endDate;
    
    // Usar a data fornecida em vez de "hoje" fixo
    console.log('📅 Usando data fornecida para total de ganhas:', dataInicio);
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      dataInicio = hoje;
      dataFim = hoje;
      console.log('⚠️ OportunidadesGanhasService: Usando datas fallback (hoje):', { dataInicio, dataFim });
    } else {
      console.log('✅ OportunidadesGanhasService: Usando datas fornecidas:', { dataInicio, dataFim });
    }

    // Construir filtros baseados nos parâmetros
    let funilFilter = '';
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      funilFilter = `&funil_id=eq.${selectedFunnel}`;
      console.log('🔍 OportunidadesGanhasService: Filtro de funil específico aplicado:', funilFilter);
    } else {
      funilFilter = `&funil_id=in.(6,14)`;
      console.log('🔍 OportunidadesGanhasService: Filtro de funil incluindo ambos (6 e 14):', funilFilter);
    }
    
    let unidadeFilter = '';
    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      const unidadeValue = selectedUnit.toString();
      const unidadeEncoded = encodeURIComponent(unidadeValue);
      
      unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
      console.log('🔍 Filtro unidade com colchetes codificados:', unidadeFilter);
      console.log('🔍 Valor original:', unidadeValue, '-> Codificado:', unidadeEncoded);
    }
    
    let sellerFilter = '';
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined' && selectedSeller !== 'TODOS') {
      const sellerValue = encodeURIComponent(selectedSeller.toString());
      sellerFilter = `&user_id=eq.${sellerValue}`;
      console.log('🔍 Filtro de vendedor aplicado:', { selectedSeller, sellerFilter });
    } else {
      console.log('🔍 Sem filtro de vendedor:', { selectedSeller, type: typeof selectedSeller });
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
              console.log('🌱 Filtro de origem Orgânico (incluindo NULL):', { selectedOriginId: selectedOrigin, originName, originFilter });
            // 🔎 LÓGICA PARA "GOOGLE ADS": usar EXATAMENTE o mesmo filtro OR do GoogleInvestimentoCard
            } else if (originName.toLowerCase() === 'google ads' || originName.toLowerCase() === 'googleads') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`;
              console.log('🔎 Filtro Google Ads com OR completo (origem OU utm_source):', { selectedOriginId: selectedOrigin, originName, originFilter });
            } else {
              originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
              console.log('🔍 Filtro de origem convertido:', { selectedOriginId: selectedOrigin, originName, originFilter });
            }
          } else {
            console.log('⚠️ Origem não encontrada para ID:', selectedOrigin);
          }
        } else {
          console.log('⚠️ Erro ao buscar origem, usando ID diretamente:', selectedOrigin);
          originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar origem, usando ID diretamente:', error);
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
      }
    }

    // CORREÇÃO CRÍTICA: Colocar originFilter PRIMEIRO para evitar conflito com AND/OR no PostgREST
    const filtrosCombinados = originFilter + funilFilter + unidadeFilter + sellerFilter;
    const filtrosSemVendedor = originFilter + funilFilter + unidadeFilter + /* no seller */ '';

    console.log('🔍 Filtros construídos:');
    console.log('  - funilFilter:', funilFilter);
    console.log('  - unidadeFilter:', unidadeFilter);
    console.log('  - sellerFilter:', sellerFilter);
    console.log('  - originFilter:', originFilter);
    console.log('  - filtrosCombinados:', filtrosCombinados);

    // 🟢 URLs principais (sempre SEM vendedor) para manter os totais gerais inalterados ao selecionar vendedor
    // CORREÇÃO CRÍTICA: Verificar se as datas já têm timezone antes de adicionar
    const dataInicioFormatada = dataInicio.includes('T') ? dataInicio : `${dataInicio}T00:00:00-03:00`;
    const dataFimFormatada = dataFim.includes('T') ? dataFim : `${dataFim}T23:59:59-03:00`;
    
    const totalOportunidadesGanhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicioFormatada}&gain_date=lte.${dataFimFormatada}${filtrosSemVendedor}`;
    const ganhasNovasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&create_date=gte.${dataInicioFormatada}&create_date=lte.${dataFimFormatada}${filtrosSemVendedor}`;
    console.log('🔍 URL Total Ganhas (GERAL):', totalOportunidadesGanhasUrl);
    console.log('🔍 URL Ganhas Novas (GERAL):', ganhasNovasUrl);

    // Se houver vendedor selecionado, montar URLs específicas do vendedor também
    const totalOportunidadesGanhasSellerUrl = (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined' && selectedSeller !== 'TODOS')
      ? `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicioFormatada}&gain_date=lte.${dataFimFormatada}${filtrosCombinados}`
      : null;
    const ganhasNovasSellerUrl = (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined' && selectedSeller !== 'TODOS')
      ? `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&create_date=gte.${dataInicioFormatada}&create_date=lte.${dataFimFormatada}${filtrosCombinados}`
      : null;

    // 🎯 3. CALCULAR META DINÂMICA BASEADA NO PERÍODO
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : '[1]';
    
    // Calcular meta baseada no período selecionado
    const metaOportunidadesGanhas = await calcularMetaDinamica(
      dataInicio, 
      dataFim, 
      selectedFunnel, 
      unidadeParaMeta,
      selectedSeller // Passar selectedSeller para calcular metas por vendedor
    );
    
    console.log('🎯 Meta calculada dinamicamente:', metaOportunidadesGanhas);

    // 🟢 EXECUTAR QUERIES COM PAGINAÇÃO
    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // Executar todas as queries com paginação em paralelo
    const [ganhasData, novasData, ganhasSellerData, novasSellerData] = await Promise.all([
      fetchAllRecords(totalOportunidadesGanhasUrl, baseHeaders),
      fetchAllRecords(ganhasNovasUrl, baseHeaders),
      totalOportunidadesGanhasSellerUrl ? fetchAllRecords(totalOportunidadesGanhasSellerUrl, baseHeaders) : Promise.resolve([]),
      ganhasNovasSellerUrl ? fetchAllRecords(ganhasNovasSellerUrl, baseHeaders) : Promise.resolve([])
    ]);

    // Processar resultados
    let totalOportunidadesGanhas = 0;
    let valorTotalOportunidadesGanhas = 0;
    let ganhasNovas = 0;
    let valorGanhasNovas = 0;
    // Totais do vendedor (quando houver)
    let sellerTotalGanhas = 0;
    let sellerValorGanhas = 0;
    let sellerGanhasNovas = 0;
    let sellerValorGanhasNovas = 0;

    // 1. Total de Oportunidades Ganhas (gain_date=período) - usando paginação
    if (ganhasData && Array.isArray(ganhasData)) {
      totalOportunidadesGanhas = ganhasData.length;
      // Para compatibilizar com o CRM: somar valores por oportunidade já truncados (sem centavos)
      // Ex.: 10,90 + 10,20 + 10,99 → 10 + 10 + 10 = 30 (CRM)
      valorTotalOportunidadesGanhas = ganhasData.reduce((total, opp) => {
        const valor = Math.floor(parseMoneyValue(opp.value));
        return total + valor;
      }, 0);
      // Arredondar para 2 casas para evitar ruídos de ponto flutuante
      valorTotalOportunidadesGanhas = Math.round(valorTotalOportunidadesGanhas * 100) / 100;
      console.log(`✅ Total Oportunidades Ganhas (período): ${totalOportunidadesGanhas} (R$ ${valorTotalOportunidadesGanhas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar total de oportunidades ganhas com paginação');
    }

    // 2. Ganhas Novas (create_date no período) - usando paginação
    if (novasData && Array.isArray(novasData)) {
      ganhasNovas = novasData.length;
      valorGanhasNovas = novasData.reduce((total, opp) => {
        const valor = Math.floor(parseMoneyValue(opp.value));
        return total + valor;
      }, 0);
      valorGanhasNovas = Math.round(valorGanhasNovas * 100) / 100;
      console.log(`✅ Ganhas Novas (período ${dataInicio} a ${dataFim}): ${ganhasNovas} (R$ ${valorGanhasNovas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar ganhas novas com paginação');
    }

    // 2b. Totais do vendedor (se houver) - usando paginação
    if (ganhasSellerData && Array.isArray(ganhasSellerData)) {
      sellerTotalGanhas = ganhasSellerData.length;
      sellerValorGanhas = ganhasSellerData.reduce((total, opp) => {
        const valor = Math.floor(parseMoneyValue(opp.value));
        return total + valor;
      }, 0);
    }
    if (novasSellerData && Array.isArray(novasSellerData)) {
      sellerGanhasNovas = novasSellerData.length;
      sellerValorGanhasNovas = novasSellerData.reduce((total, opp) => {
        const valor = Math.floor(parseMoneyValue(opp.value));
        return total + valor;
      }, 0);
    }

    // Meta já foi calculada dinamicamente acima

    // 🎯 DADOS ANTERIORES - Buscar dados do período anterior para comparação
    console.log('📊 Buscando dados do período anterior para comparação...');
    const dadosAnteriores = await getOportunidadesGanhasAnteriores(dataInicio, dataFim, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin);

    // 🎯 CALCULAR PERCENTUAL DA META (valor total ganho vs meta em R$)
    const percentualMeta = metaOportunidadesGanhas > 0 ? 
      ((valorTotalOportunidadesGanhas - metaOportunidadesGanhas) / metaOportunidadesGanhas) * 100 : 0;
    
    console.log(`📊 Cálculo do percentual da meta:`);
    console.log(`   - Valor Total Ganho: R$ ${valorTotalOportunidadesGanhas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`   - Meta: R$ ${metaOportunidadesGanhas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`   - Percentual: ${percentualMeta.toFixed(2)}%`);

    // 🎯 FORMATAR DADOS PARA O COMPONENTE
    const metrics = {
      totalOportunidadesGanhas: {
        current: totalOportunidadesGanhas, // Número principal: oportunidades ganhas hoje
        previous: dadosAnteriores.totalOportunidadesGanhas,
        value: valorTotalOportunidadesGanhas, // Valor embaixo: soma das oportunidades ganhas
        meta: metaOportunidadesGanhas, // Meta real da tabela metas
        metaPercentage: percentualMeta, // Percentual calculado: (ganhas - meta) / meta * 100
        change: dadosAnteriores.totalOportunidadesGanhas > 0 ? 
          ((totalOportunidadesGanhas - dadosAnteriores.totalOportunidadesGanhas) / dadosAnteriores.totalOportunidadesGanhas) * 100 : 0,
        isPositive: totalOportunidadesGanhas >= dadosAnteriores.totalOportunidadesGanhas, // Para ganhas, mais é melhor
        sellerBreakdown: selectedSeller && selectedSeller !== 'all' ? {
          count: sellerTotalGanhas,
          value: sellerValorGanhas,
          percentCount: totalOportunidadesGanhas > 0 ? (sellerTotalGanhas / totalOportunidadesGanhas) * 100 : 0,
          percentValue: valorTotalOportunidadesGanhas > 0 ? (sellerValorGanhas / valorTotalOportunidadesGanhas) * 100 : 0
        } : null
      },
      ganhasNovas: {
        current: ganhasNovas, // Número principal: oportunidades criadas no período que foram ganhas
        previous: dadosAnteriores.ganhasNovas,
        value: valorGanhasNovas, // Valor embaixo: soma das ganhas novas
        meta: Math.round(metaOportunidadesGanhas * 0.3), // Meta proporcional (30% da meta total)
        metaPercentage: percentualMeta, // Percentual calculado: (ganhas - meta) / meta * 100
        change: dadosAnteriores.ganhasNovas > 0 ? 
          ((ganhasNovas - dadosAnteriores.ganhasNovas) / dadosAnteriores.ganhasNovas) * 100 : 0,
        isPositive: ganhasNovas >= dadosAnteriores.ganhasNovas,
        sellerBreakdown: selectedSeller && selectedSeller !== 'all' ? {
          count: sellerGanhasNovas,
          value: sellerValorGanhasNovas,
          percentCount: ganhasNovas > 0 ? (sellerGanhasNovas / ganhasNovas) * 100 : 0,
          percentValue: valorGanhasNovas > 0 ? (sellerValorGanhasNovas / valorGanhasNovas) * 100 : 0
        } : null
      }
    };

    console.log('✅ OportunidadesGanhasService: Métricas calculadas:', metrics);
    return metrics;

  } catch (error) {
    console.error('❌ Erro no OportunidadesGanhasService:', error);
    throw error;
  }
};

/**
 * 🟢 BUSCAR DADOS DO PERÍODO ANTERIOR (para comparação)
 */
const getOportunidadesGanhasAnteriores = async (startDate, endDate, selectedFunnel = null, selectedUnit = null, selectedSeller = null, selectedOrigin = null) => {
  try {
    console.log('📊 Buscando dados do período anterior - ganhas...');
    
    // Data de ontem para total de ganhas anteriores
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toISOString().split('T')[0];

    // Calcular período anterior (mesmo intervalo de dias)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const startAnterior = new Date(start);
    startAnterior.setDate(startAnterior.getDate() - diffDays - 1);
    
    const endAnterior = new Date(start);
    endAnterior.setDate(endAnterior.getDate() - 1);
    
    const dataInicioAnterior = startAnterior.toISOString().split('T')[0];
    const dataFimAnterior = endAnterior.toISOString().split('T')[0];
    
    console.log('📅 Período anterior - ganhas:', { ontem: ontemStr, dataInicioAnterior, dataFimAnterior });

    // Construir filtros
    const funilFilter = selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' ? `&funil_id=eq.${selectedFunnel}` : `&funil_id=in.(6,14)`;
    const unidadeFilter = selectedUnit && selectedUnit !== 'all' ? `&unidade_id=eq.${encodeURIComponent(selectedUnit.toString())}` : '';
    const sellerFilter = selectedSeller && selectedSeller !== 'all' ? `&user_id=eq.${selectedSeller}` : '';
    
    // Filtro de origem (mesma lógica da função principal)
    let originFilter = '';
    if (selectedOrigin && selectedOrigin !== 'all') {
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
              // MESMA LÓGICA OR COMPLETA para dados anteriores
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`;
            } else {
              originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar origem para período anterior - ganhas:', error);
      }
    }

    // CORREÇÃO CRÍTICA: Colocar originFilter PRIMEIRO (mesma lógica da função principal)
    const filtrosCombinados = originFilter + funilFilter + unidadeFilter + sellerFilter;

    // 🟢 BUSCAR DADOS ESPECÍFICOS DO PERÍODO ANTERIOR
    const totalGanhasAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${ontemStr}T00:00:00-03:00&gain_date=lte.${ontemStr}T23:59:59-03:00${filtrosCombinados}`;
    const ganhasNovasAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&create_date=gte.${dataInicioAnterior}T00:00:00-03:00&create_date=lte.${dataFimAnterior}T23:59:59-03:00${filtrosCombinados}`;
    
    // 🟢 EXECUTAR QUERIES COM PAGINAÇÃO PARA DADOS ANTERIORES
    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // Executar queries em paralelo com paginação
    const [totalGanhasData, ganhasNovasData] = await Promise.all([
      fetchAllRecords(totalGanhasAnteriorUrl, baseHeaders),
      fetchAllRecords(ganhasNovasAnteriorUrl, baseHeaders)
    ]);

    if (totalGanhasData && ganhasNovasData) {
      return {
        totalOportunidadesGanhas: totalGanhasData.length,
        ganhasNovas: ganhasNovasData.length
      };
    }

    // Fallback se não conseguir buscar dados anteriores
    return {
      totalOportunidadesGanhas: 0,
      ganhasNovas: 0
    };

  } catch (error) {
    console.error('❌ Erro ao buscar dados anteriores - ganhas:', error);
    return {
      totalOportunidadesGanhas: 0,
      ganhasNovas: 0
    };
  }
};

/**
 * 🎯 CALCULAR META DINÂMICA BASEADA NO PERÍODO
 * 
 * @param {string} dataInicio - Data inicial (YYYY-MM-DD)
 * @param {string} dataFim - Data final (YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} unidadeFranquia - Unidade franquia (ex: "[1]")
 * @returns {number} Meta calculada
 */
const calcularMetaDinamica = async (dataInicio, dataFim, selectedFunnel, unidadeFranquia, selectedSeller = null) => {
  try {
    console.log('🎯 Calculando meta dinâmica para período:', { dataInicio, dataFim, selectedFunnel, unidadeFranquia, selectedSeller });
    
    // Verificar se é período mensal (mês inteiro)
    // Se as datas já têm timezone, usar diretamente, senão adicionar
    const inicio = dataInicio.includes('T') ? new Date(dataInicio) : new Date(dataInicio + 'T00:00:00');
    const fim = dataFim.includes('T') ? new Date(dataFim) : new Date(dataFim + 'T23:59:59');
    
    console.log('🔍 Debug datas:', { 
      dataInicio, 
      dataFim, 
      inicio: inicio.toISOString(), 
      fim: fim.toISOString(),
      inicioDate: inicio.getDate(),
      fimDate: fim.getDate(),
      inicioMonth: inicio.getMonth(),
      fimMonth: fim.getMonth(),
      inicioYear: inicio.getFullYear(),
      fimYear: fim.getFullYear()
    });
    
    // Verificar se é o mesmo mês e ano
    const mesmoMesAno = inicio.getMonth() === fim.getMonth() && inicio.getFullYear() === fim.getFullYear();
    
    // Verificar se começa no dia 1 e termina no último dia do mês
    const comecaNoDia1 = inicio.getDate() === 1;
    const ultimoDiaDoMes = new Date(fim.getFullYear(), fim.getMonth() + 1, 0).getDate();
    const terminaNoUltimoDia = fim.getDate() === ultimoDiaDoMes;
    
    const isMesInteiro = mesmoMesAno && comecaNoDia1 && terminaNoUltimoDia;
    
    console.log('🔍 Debug mês inteiro:', { 
      mesmoMesAno, 
      comecaNoDia1, 
      terminaNoUltimoDia, 
      ultimoDiaDoMes,
      isMesInteiro 
    });
    
    if (isMesInteiro) {
      console.log('📅 Período mensal detectado - buscando meta mensal');
      console.log('📅 Debug período mensal:', { 
        dataInicio, 
        dataFim, 
        selectedSeller, 
        selectedFunnel, 
        unidadeFranquia 
      });
      const metaMensal = await buscarMetaPorTipo('mensal', selectedFunnel, unidadeFranquia, selectedSeller);
      console.log('🎯 Meta mensal calculada:', metaMensal);
      return metaMensal;
    }
    
    // Verificar se é período de 1 dia
    const diffTime = fim.getTime() - inicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('🔍 Debug período:', { 
      diffTime, 
      diffDays, 
      inicio: inicio.toISOString(), 
      fim: fim.toISOString(),
      isMesmoDia: inicio.toDateString() === fim.toDateString()
    });
    
    // Verificar se é o mesmo dia (mais confiável que diffDays)
    const isMesmoDia = inicio.toDateString() === fim.toDateString();
    
    if (isMesmoDia) {
      // Período de 1 dia - verificar se é sábado, domingo ou dia da semana
      const diaSemana = inicio.getDay(); // 0=domingo, 1=segunda, ..., 6=sábado
      
      console.log('🔍 Debug dia da semana:', { 
        dataInicio, 
        diaSemana, 
        nomeDia: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][diaSemana]
      });
      
      if (diaSemana === 0) {
        console.log('📅 Domingo detectado - meta = 0');
        return 0;
      } else if (diaSemana === 6) {
        console.log('📅 Sábado detectado - buscando meta de sábado');
        return await buscarMetaPorTipo('sabado', selectedFunnel, unidadeFranquia, selectedSeller);
      } else {
        console.log('📅 Dia da semana detectado - buscando meta diária');
        return await buscarMetaPorTipo('diaria', selectedFunnel, unidadeFranquia, selectedSeller);
      }
    }
    
    // Período customizado - calcular baseado nos dias
    console.log('📅 Período customizado detectado - calculando por dias');
    return await calcularMetaPeriodoCustomizado(dataInicio, dataFim, selectedFunnel, unidadeFranquia, selectedSeller);
    
  } catch (error) {
    console.error('❌ Erro ao calcular meta dinâmica:', error);
    return 0;
  }
};

/**
 * 🎯 BUSCAR META POR TIPO (diaria, sabado, mensal)
 */
const buscarMetaPorTipo = async (tipoMeta, selectedFunnel, unidadeFranquia, selectedSeller = null) => {
  try {
    let funilFilter = '';
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      funilFilter = `&funil=eq.${selectedFunnel}`;
    } else {
      funilFilter = `&funil=in.(6,14)`;
    }
    
    // Se há vendedor selecionado, buscar meta específica do vendedor
    let vendedorFilter = '';
    let tipoMetaParaBusca = tipoMeta;
    
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== 'TODOS' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      vendedorFilter = `&vendedor_id=eq.${selectedSeller}`;
      // Para vendedor específico, usar tipo_meta com prefixo vendedor_
      if (tipoMeta === 'diaria') {
        tipoMetaParaBusca = 'vendedor_diaria';
      } else if (tipoMeta === 'sabado') {
        tipoMetaParaBusca = 'sabado'; // Sábado já tem vendedor_id
      } else if (tipoMeta === 'mensal') {
        tipoMetaParaBusca = 'vendedor_mensal';
      }
    }
    
    // Para vendedor específico, usar dashboard de faturamento baseado no tipo de meta
    let dashboardParaBusca = 'ganhos_oportunidades'; // Padrão para dados gerais
    
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== 'TODOS' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      if (tipoMeta === 'diaria') {
        dashboardParaBusca = 'oportunidades_faturamento';
      } else if (tipoMeta === 'sabado') {
        dashboardParaBusca = 'oportunidades_faturamento_sabado';
      } else if (tipoMeta === 'mensal') {
        dashboardParaBusca = 'oportunidades_faturamento_mensal';
      }
    }
    
    const metaUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta,funil&unidade_franquia=eq.${encodeURIComponent(unidadeFranquia)}&dashboard=eq.${dashboardParaBusca}&tipo_meta=eq.${tipoMetaParaBusca}${funilFilter}${vendedorFilter}`;
    
    console.log('🔍 Buscando meta por tipo:', { tipoMeta, tipoMetaParaBusca, selectedSeller, metaUrl });
    
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
        const totalMeta = metaData.reduce((total, meta) => {
          const valor = parseFloat(meta.valor_da_meta) || 0;
          return total + valor;
        }, 0);
        
        console.log(`✅ Meta ${tipoMeta} encontrada:`, { 
          funis: metaData.map(m => ({ funil: m.funil, valor: m.valor_da_meta })),
          total: totalMeta 
        });
        
        return totalMeta;
      }
    }
    
    console.log(`⚠️ Nenhuma meta ${tipoMeta} encontrada`);
    return 0;
    
  } catch (error) {
    console.error(`❌ Erro ao buscar meta ${tipoMeta}:`, error);
    return 0;
  }
};

/**
 * 🎯 CALCULAR META PARA PERÍODO CUSTOMIZADO
 */
const calcularMetaPeriodoCustomizado = async (dataInicio, dataFim, selectedFunnel, unidadeFranquia, selectedSeller = null) => {
  try {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    // Contar dias da semana, sábados e domingos
    let diasSemana = 0;
    let sabados = 0;
    let domingos = 0;
    
    const currentDate = new Date(inicio);
    while (currentDate <= fim) {
      const diaSemana = currentDate.getDay();
      
      if (diaSemana === 0) {
        domingos++;
      } else if (diaSemana === 6) {
        sabados++;
      } else {
        diasSemana++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('📊 Contagem de dias no período:', { diasSemana, sabados, domingos });
    
    // Buscar metas
    const [metaDiaria, metaSabado] = await Promise.all([
      buscarMetaPorTipo('diaria', selectedFunnel, unidadeFranquia, selectedSeller),
      buscarMetaPorTipo('sabado', selectedFunnel, unidadeFranquia, selectedSeller)
    ]);
    
    // Calcular meta total
    const metaTotal = (diasSemana * metaDiaria) + (sabados * metaSabado) + (domingos * 0);
    
    console.log('📊 Cálculo da meta customizada:', {
      diasSemana,
      sabados,
      domingos,
      metaDiaria,
      metaSabado,
      metaTotal: `(${diasSemana} × ${metaDiaria}) + (${sabados} × ${metaSabado}) + (${domingos} × 0) = ${metaTotal}`
    });
    
    return metaTotal;
    
  } catch (error) {
    console.error('❌ Erro ao calcular meta período customizado:', error);
    return 0;
  }
};
