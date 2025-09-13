// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * 🔄 FUNÇÃO PARA BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO RECURSIVA
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

export const getOrcamentoNegociacaoMetrics = async (
  startDate, 
  endDate, 
  selectedFunnel, 
  selectedUnit, 
  selectedSeller, 
  selectedOrigin
) => {
  try {
    console.log('🔄 orcamentoNegociacaoService: Iniciando busca de métricas...');
    console.log('📅 Período:', startDate, 'até', endDate);
    console.log('🎯 Filtros:', { selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });

    // Converter datas para o formato correto
    const dataInicio = startDate;
    const dataFim = endDate;
    const hoje = new Date().toISOString().split('T')[0];

    // Construir filtros dinâmicos
    let unidadeFilter = '';
    let sellerFilter = '';
    let originFilter = '';
    let funilFilter = '';

    // Filtro de unidade (usar mesmo campo do serviço que funciona)
    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== 'TODOS' && selectedUnit !== '') {
      const unidadeValue = selectedUnit.toString();
      const unidadeEncoded = encodeURIComponent(unidadeValue);
      unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
      console.log('🏢 Filtro unidade com colchetes codificados:', unidadeFilter, 'valor original:', unidadeValue, '-> codificado:', unidadeEncoded);
    }

    // Filtro de vendedor
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== 'TODOS' && selectedSeller !== '') {
      sellerFilter = `&user_id=eq.${selectedSeller}`;
      console.log(`👤 Filtro de vendedor aplicado: ${selectedSeller}`);
    }

    // Filtro de origem — converter ID para nome e tratar Orgânico como nome OU NULL
    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== 'TODOS' && selectedOrigin !== '') {
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
              console.log('🌱 Filtro de origem Orgânico (incluindo NULL):', { selectedOrigin, originName, originFilter });
            } else if (lower === 'google ads' || lower === 'googleads') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent(originName)},utm_source.eq.google,utm_source.eq.GoogleAds)`;
              console.log('🔎 Filtro de origem Google Ads (inclui utm_source google/GoogleAds):', { selectedOrigin, originName, originFilter });
            } else {
              originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
              console.log('🔍 Filtro de origem convertido:', { selectedOrigin, originName, originFilter });
            }
          }
        } else {
          // fallback simples
          originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
          console.log('⚠️ Erro ao buscar origem, usando ID diretamente:', selectedOrigin);
        }
      } catch (error) {
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
        console.log('⚠️ Erro ao buscar origem por nome, usando ID diretamente:', error);
      }
    }

    // Filtro de funil
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS') {
      funilFilter = `&funil_id=eq.${selectedFunnel}`;
      console.log(`🎯 Filtro de funil aplicado: ${selectedFunnel}`);
    } else {
      // Quando não há funil selecionado, buscar nos funis 6 e 14
      funilFilter = '&funil_id=in.(6,14)';
      console.log('🎯 Sem funil específico, buscando nos funis 6 e 14');
    }

    // Combinar todos os filtros
    const filtrosCombinados = `${unidadeFilter}${sellerFilter}${originFilter}${funilFilter}`;

    // 1. Orçamento em Negociação - Oportunidades abertas nas etapas de orçamento (crm_column)
    let orcamentoNegociacaoUrl;
    let useDualFetch = false;
    
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS') {
      // Funil específico selecionado: considerar ambas etapas (206 e 207), se existirem
      orcamentoNegociacaoUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&or=(crm_column.eq.207,crm_column.eq.206)&funil_id=eq.${selectedFunnel}&status=eq.open${sellerFilter}${unidadeFilter}${originFilter}`;
      console.log(`🎯 Usando etapas ORÇAMENTO (206/207) do funil ${selectedFunnel} com status OPEN`);
    } else {
      // Sem funil específico: somar todos os funis da unidade nas etapas 206 e 207 (sem filtrar por status)
      orcamentoNegociacaoUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&or=(crm_column.eq.207,crm_column.eq.206)${sellerFilter}${unidadeFilter}${originFilter}`;
      console.log('🎯 Somando etapas ORÇAMENTO (206 e 207) para todos os funis da unidade, sem filtro de status');
    }
    
    console.log('🔍 URL Orçamento Negociação:', orcamentoNegociacaoUrl);

    // 2. Meta de Orçamento em Negociação (espelhar lógica do serviço que funciona)
    const unidadeParaMeta = (selectedUnit && selectedUnit !== 'all' && selectedUnit !== 'TODOS' && selectedUnit !== '')
      ? selectedUnit
      : '[1]';

    let metaOrcamentoNegociacaoUrl;
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      // Funil específico selecionado - buscar meta específica do funil
      metaOrcamentoNegociacaoUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}&dashboard=eq.orcamentos_oportunidades&funil=eq.${selectedFunnel}`;
      console.log('🎯 Buscando meta específica do funil para orçamento em negociação:', selectedFunnel);
    } else {
      // Apenas unidade selecionada - buscar AMBOS funis (6 e 14) e somar
      metaOrcamentoNegociacaoUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}&dashboard=eq.orcamentos_oportunidades&funil=in.(6,14)`;
      console.log('🎯 Buscando metas de ambos funis (6 e 14) para somar - orçamento em negociação');
    }

    console.log('🔍 URL Meta Orçamento Negociação:', metaOrcamentoNegociacaoUrl);

    // 🔄 EXECUTAR QUERIES COM PAGINAÇÃO
    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // Executar queries com paginação em paralelo
    const [orcamentoData, metaResponse] = await Promise.all([
      fetchAllRecords(orcamentoNegociacaoUrl, baseHeaders),
      fetch(metaOrcamentoNegociacaoUrl, {
        method: 'GET',
        headers: baseHeaders
      })
    ]);

    // Processar resposta do orçamento em negociação - usando paginação
    let orcamentoNegociacao = 0;
    let valorTotalOrcamento = 0;
    let quantidadeOrcamento = 0;

    if (orcamentoData && Array.isArray(orcamentoData)) {
      console.log('🔍 Dados brutos de Orçamento em Negociação recebidos (paginação):', orcamentoData.length, 'registros');

      quantidadeOrcamento = orcamentoData.length;
      valorTotalOrcamento = orcamentoData.reduce((total, item) => {
        const valor = parseFloat(item.value) || 0;
        return total + valor;
      }, 0);
      orcamentoNegociacao = quantidadeOrcamento; // Quantidade de oportunidades
      console.log(`✅ Orçamento Negociação: ${quantidadeOrcamento} oportunidades, R$ ${valorTotalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    } else {
      console.error('❌ Erro ao buscar orçamento em negociação com paginação');
    }

    // Processar meta (mesma regra do serviço que funciona: somar quando sem funil)
    let metaOrcamentoNegociacao = 0;
    if (metaResponse && metaResponse.ok) {
      const metaData = await metaResponse.json();
      if (metaData && metaData.length > 0) {
        if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS') {
          // Funil específico - usar valor único
          metaOrcamentoNegociacao = parseFloat(metaData[0].valor_da_meta) || 0;
          console.log(`✅ Meta Orçamento Negociação (funil ${selectedFunnel}): ${metaOrcamentoNegociacao}`);
        } else {
          // Unidade selecionada (ambos funis) - somar as metas dos funis 6 e 14
          metaOrcamentoNegociacao = metaData.reduce((total, meta) => {
            const valor = parseFloat(meta.valor_da_meta) || 0;
            return total + valor;
          }, 0);
          console.log(`✅ Meta Orçamento Negociação (soma funis 6+14): ${metaOrcamentoNegociacao}`);
          console.log(`🔍 Detalhes das metas encontradas:`, metaData.map(m => ({ valor: m.valor_da_meta })));
        }
      } else {
        console.log('⚠️ Nenhuma meta encontrada para orçamento em negociação, usando valor padrão');
        metaOrcamentoNegociacao = 0; // Valor padrão
      }
    } else {
      console.error('❌ Erro ao buscar meta de orçamento em negociação:', metaResponse.status);
      metaOrcamentoNegociacao = 0; // Valor padrão em caso de erro
    }

    // 🎯 DADOS ANTERIORES - Buscar dados do período anterior para comparação
    console.log('📊 Buscando dados do período anterior para comparação...');
    const dadosAnteriores = await getOrcamentoNegociacaoAnteriores(dataInicio, dataFim, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin);

    // Calcular mudança percentual
    const mudancaPercentual = dadosAnteriores.quantidade > 0 
      ? ((orcamentoNegociacao - dadosAnteriores.quantidade) / dadosAnteriores.quantidade) * 100
      : 0;

    const isPositive = mudancaPercentual >= 0;

    // Calcular percentual da meta
    const percentualMeta = metaOrcamentoNegociacao > 0 
      ? (orcamentoNegociacao / metaOrcamentoNegociacao) * 100
      : 0;

    const resultado = {
      value: orcamentoNegociacao.toString(),
      opportunityValue: `R$ ${valorTotalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      previousValue: dadosAnteriores.quantidade.toString(),
      change: mudancaPercentual,
      isPositive: isPositive,
      meta: metaOrcamentoNegociacao.toString(),
      metaPercentage: `${Math.round(percentualMeta)}%`
    };

    console.log('✅ orcamentoNegociacaoService: Resultado final:', resultado);
    return resultado;

  } catch (error) {
    console.error('❌ orcamentoNegociacaoService: Erro geral:', error);
    throw error;
  }
};

// Função para buscar dados do período anterior
const getOrcamentoNegociacaoAnteriores = async (dataInicio, dataFim, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin) => {
  try {
    // Calcular período anterior
    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);
    const duracaoDias = Math.ceil((dataFimObj - dataInicioObj) / (1000 * 60 * 60 * 24)) + 1;
    
    const dataInicioAnterior = new Date(dataInicioObj);
    dataInicioAnterior.setDate(dataInicioAnterior.getDate() - duracaoDias);
    
    const dataFimAnterior = new Date(dataFimObj);
    dataFimAnterior.setDate(dataFimAnterior.getDate() - duracaoDias);
    
    const dataInicioAnteriorStr = dataInicioAnterior.toISOString().split('T')[0];
    const dataFimAnteriorStr = dataFimAnterior.toISOString().split('T')[0];

    console.log(`📅 Período anterior: ${dataInicioAnteriorStr} até ${dataFimAnteriorStr}`);

    // Construir filtros dinâmicos (mesmos do período atual)
    let unidadeFilter = '';
    let sellerFilter = '';
    let originFilter = '';
    let funilFilter = '';

    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== 'TODOS' && selectedUnit !== '') {
      const unidadeValue = selectedUnit.toString();
      const unidadeEncoded = encodeURIComponent(unidadeValue);
      unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
    }

    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== 'TODOS' && selectedSeller !== '') {
      sellerFilter = `&user_id=eq.${selectedSeller}`;
    }

    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== 'TODOS' && selectedOrigin !== '') {
      // originFilter será resolvido por nome aqui também, como na função principal
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
      } catch (e) {
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
      }
    }

    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS') {
      funilFilter = `&funil_id=eq.${selectedFunnel}`;
    } else {
      funilFilter = '&funil_id=in.(6,14)';
    }

    const filtrosCombinados = `${unidadeFilter}${sellerFilter}${originFilter}${funilFilter}`;

    // Buscar orçamento em negociação do período anterior
    let orcamentoAnteriorUrl;
    
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS') {
      // Funil específico: considerar as duas etapas, sem filtrar por status
      orcamentoAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&or=(crm_column.eq.207,crm_column.eq.206)&funil_id=eq.${selectedFunnel}&create_date=gte.${dataInicioAnteriorStr}&create_date=lte.${dataFimAnteriorStr}T23:59:59${sellerFilter}${unidadeFilter}${originFilter}`;
    } else {
      // Todos os funis: etapas 206 e 207 para a unidade, sem filtrar por status
      orcamentoAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&or=(crm_column.eq.207,crm_column.eq.206)&create_date=gte.${dataInicioAnteriorStr}&create_date=lte.${dataFimAnteriorStr}T23:59:59${sellerFilter}${unidadeFilter}${originFilter}`;
    }

    console.log('🔍 URL Orçamento Negociação Anterior:', orcamentoAnteriorUrl);

    // 🔄 EXECUTAR QUERY COM PAGINAÇÃO PARA DADOS ANTERIORES
    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    const orcamentoAnteriorData = await fetchAllRecords(orcamentoAnteriorUrl, baseHeaders);

    if (orcamentoAnteriorData && Array.isArray(orcamentoAnteriorData)) {
      const quantidadeAnterior = orcamentoAnteriorData.length;
      const valorTotalAnterior = orcamentoAnteriorData.reduce((total, item) => {
        const valor = parseFloat(item.value) || 0;
        return total + valor;
      }, 0);
      
      console.log(`✅ Orçamento Negociação Anterior: ${quantidadeAnterior} oportunidades, R$ ${valorTotalAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      
      return {
        quantidade: quantidadeAnterior,
        valorTotal: valorTotalAnterior
      };
    } else {
      console.error('❌ Erro ao buscar orçamento em negociação anterior com paginação');
      return { quantidade: 0, valorTotal: 0 };
    }

  } catch (error) {
    console.error('❌ Erro ao buscar dados anteriores de orçamento em negociação:', error);
    return { quantidade: 0, valorTotal: 0 };
  }
};
