/**
 * 📊 FUNNEL STAGES SERVICE
 * 
 * Serviço dedicado para buscar dados das etapas do funil
 * - Oportunidades abertas por etapa (status=open)
 * - Oportunidades criadas no período
 * - Cálculos de passagem entre etapas
 * - Taxa de conversão por etapa
 * 
 * Com paginação recursiva para garantir que todos os registros sejam buscados
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

  console.log('📄 FunnelStages: Iniciando paginação para URL:', url);

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
        console.error(`❌ FunnelStages: Erro na página ${Math.floor(offset / pageSize) + 1}:`, response.status);
        break;
      }

      const pageData = await response.json();
      allRecords = allRecords.concat(pageData);

      console.log(`📄 FunnelStages: Página ${Math.floor(offset / pageSize) + 1}: ${pageData.length} registros | Total: ${allRecords.length}`);

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
      console.error(`❌ FunnelStages: Erro ao buscar página ${Math.floor(offset / pageSize) + 1}:`, error);
      break;
    }
  }

  console.log(`✅ FunnelStages: Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
};

/**
 * 🎯 BUSCAR OPORTUNIDADES ABERTAS POR ORIGEM EM UMA ETAPA ESPECÍFICA
 *
 * @param {number} etapaId - ID da etapa
 * @param {Object} baseHeaders - Headers da requisição
 * @param {string} selectedFunnel - Funil selecionado
 * @param {string} selectedSeller - Vendedor selecionado
 * @param {string} selectedUnit - Unidade selecionada
 * @returns {Object} Contagem por origem { google: X, meta: X, organico: X }
 */
const getOportunidadesPorOrigemEtapa = async (etapaId, baseHeaders, selectedFunnel = null, selectedSeller = null, selectedUnit = null) => {
  try {
    // Construir filtros baseados nos filtros do usuário
    let filtrosComuns = '';

    // FILTRO DE FUNIL
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      filtrosComuns += `&funil_id=eq.${selectedFunnel}`;
    } else {
      filtrosComuns += `&funil_id=in.(6,14)`;
    }

    // FILTRO DE VENDEDOR
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== 'undefined' && selectedSeller !== '') {
      filtrosComuns += `&user_id=eq.${selectedSeller}`;
    }

    // FILTRO DE UNIDADE
    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== 'TODOS' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      filtrosComuns += `&unidade_id=eq.${encodeURIComponent(selectedUnit.toString())}`;
    }

    // Definir filtros de origem específicos
    const googleFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`;
    const metaFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Meta Ads')},utm_source.eq.facebook,utm_source.eq.meta)`;
    const organicoFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Orgânico')},origem_oportunidade.is.null)`;

    // Buscar oportunidades abertas por origem nesta etapa COM FILTROS APLICADOS
    const queries = [
      // Google
      `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.open&crm_column=eq.${etapaId}${filtrosComuns}${googleFilter}`,
      // Meta
      `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.open&crm_column=eq.${etapaId}${filtrosComuns}${metaFilter}`,
      // Orgânico
      `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.open&crm_column=eq.${etapaId}${filtrosComuns}${organicoFilter}`
    ];

    console.log(`🎯 Buscando origens para etapa ${etapaId} COM FILTROS:`);
    console.log(`   Filtros aplicados: ${filtrosComuns}`);
    console.log(`   Google: ${queries[0]}`);
    console.log(`   Meta: ${queries[1]}`);
    console.log(`   Orgânico: ${queries[2]}`);

    const [googleData, metaData, organicoData] = await Promise.all(
      queries.map(url => fetchAllRecords(url, baseHeaders))
    );

    const resultado = {
      google: googleData.length,
      meta: metaData.length,
      organico: organicoData.length
    };

    console.log(`✅ Etapa ${etapaId} - Breakdown por origem COM FILTROS:`, resultado);
    console.log(`   Total somado: ${resultado.google + resultado.meta + resultado.organico}`);

    return resultado;

  } catch (error) {
    console.error(`❌ Erro ao buscar origens para etapa ${etapaId}:`, error);
    return { google: 0, meta: 0, organico: 0 };
  }
};

/**
 * 📊 BUSCAR DADOS COMPLETOS DO FUNIL POR ETAPAS
 * 
 * @param {Array} etapas - Array de etapas do funil
 * @param {string} startDate - Data início (YYYY-MM-DD) 
 * @param {string} endDate - Data fim (YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem selecionada (Google Ads, Meta Ads, etc.)
 * @param {string} selectedUnit - Unidade selecionada
 * @returns {Object} Dados completos do funil organizados por etapa
 */
export const getFunnelStagesData = async (etapas, startDate = null, endDate = null, selectedFunnel = null, selectedSeller = null, selectedOrigin = null, selectedUnit = null) => {
  try {
    console.log('=' .repeat(80));
    console.log('📊 FunnelStages: Iniciando busca de dados do funil...');
    console.log('📅 FunnelStages: Período:', { startDate, endDate });
    console.log('🎯 FunnelStages: Filtros:', { selectedFunnel, selectedSeller, selectedOrigin, selectedUnit });
    console.log('🏢 FunnelStages: Etapas recebidas:', etapas?.length || 0);
    if (etapas?.length > 0) {
      console.log('🏢 FunnelStages: Primeira etapa:', etapas[0]);
    }
    console.log('=' .repeat(80));

    if (!etapas || etapas.length === 0) {
      console.log('⚠️ FunnelStages: Nenhuma etapa fornecida');
      return { 
        etapas: [], 
        conversaoGeral: { 
          totalCriadas: 0, 
          totalFechadas: 0, 
          taxaConversao: 0, 
          valorTotal: 0, 
          ticketMedio: 0 
        },
        sourcesData: {
          google: { abertas: 0, criadas: 0 },
          meta: { abertas: 0, criadas: 0 },
          organico: { abertas: 0, criadas: 0 },
          whatsapp: { abertas: 0, criadas: 0 },
          prescritor: { abertas: 0, criadas: 0 },
          franquia: { abertas: 0, criadas: 0 },
          total: 0
        }
      };
    }

    // Preparar datas
    let dataInicio, dataFim;
    if (startDate && endDate) {
      dataInicio = `${startDate}T00:00:00-03:00`;
      dataFim = `${endDate}T23:59:59-03:00`;
    } else {
      const hoje = new Date().toISOString().split('T')[0];
      dataInicio = `${hoje}T00:00:00-03:00`;
      dataFim = `${hoje}T23:59:59-03:00`;
    }

    console.log('📅 FunnelStages: Período formatado:', { dataInicio, dataFim });

    // Headers base
    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Content-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // Construir filtros
    let filters = '';
    
    // FILTRO DE FUNIL: usar mesma lógica dos outros serviços
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      filters += `&funil_id=eq.${selectedFunnel}`;
      console.log('🔍 FunnelStages: Filtro de funil específico aplicado:', selectedFunnel);
    } else {
      filters += `&funil_id=in.(6,14)`;
      console.log('🔍 FunnelStages: Filtro de funil incluindo ambos (6 e 14)');
    }
    
    // FILTRO DE VENDEDOR
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== 'undefined' && selectedSeller !== '') {
      filters += `&user_id=eq.${selectedSeller}`;
    }

    // FILTRO DE UNIDADE
    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== 'undefined' && selectedUnit !== '') {
      const unidadeEncoded = encodeURIComponent(selectedUnit.toString());
      filters += `&unidade_id=eq.${unidadeEncoded}`;
    }

    // FILTRO DE ORIGEM (usando a mesma lógica do funnelSourcesService que está funcionando)
    let originFilter = '';
    console.log('🔍 FunnelStages: Verificando selectedOrigin:', { 
      valor: selectedOrigin, 
      tipo: typeof selectedOrigin,
      isString: typeof selectedOrigin === 'string',
      isAll: selectedOrigin === 'all',
      isUndefined: selectedOrigin === 'undefined',
      isEmpty: selectedOrigin === '',
      valorCompleto: JSON.stringify(selectedOrigin)
    });
    
    // DEFINIR FILTROS SQL POR ORIGEM (mesma lógica do funnelSourcesService)
    const googleOriginFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`;
    const metaOriginFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Meta Ads')},origem_oportunidade.eq.${encodeURIComponent('Facebook')},origem_oportunidade.eq.${encodeURIComponent('Instagram')})`;
    const organicoOriginFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Orgânico')},origem_oportunidade.is.null)`;
    const whatsappOriginFilter = `&origem_oportunidade=eq.${encodeURIComponent('WhatsApp')}`;
    const prescritorOriginFilter = `&origem_oportunidade=eq.${encodeURIComponent('Prescritor')}`;
    const franquiaOriginFilter = `&origem_oportunidade=eq.${encodeURIComponent('Franquia')}`;
    
    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== 'undefined' && selectedOrigin !== '') {
      console.log('🔍 FunnelStages: Aplicando filtro de origem:', selectedOrigin);
      
      // 🎯 CORREÇÃO: Converter ID da origem para nome (mesma lógica do oportunidadesGanhasService)
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
            console.log('✅ FunnelStages: Nome da origem encontrado:', originName);
            
            // Aplicar filtro baseado no nome da origem
            switch (originName.toLowerCase()) {
              case 'google ads':
              case 'googleads':
                originFilter = googleOriginFilter;
                console.log('✅ FunnelStages: Aplicando filtro Google Ads:', originFilter);
                break;
              case 'meta ads':
              case 'facebook':
              case 'instagram':
                originFilter = metaOriginFilter;
                console.log('✅ FunnelStages: Aplicando filtro Meta Ads:', originFilter);
                break;
              case 'orgânico':
              case 'organico':
                originFilter = organicoOriginFilter;
                console.log('✅ FunnelStages: Aplicando filtro Orgânico:', originFilter);
                break;
              case 'whatsapp':
                originFilter = whatsappOriginFilter;
                console.log('✅ FunnelStages: Aplicando filtro WhatsApp:', originFilter);
                break;
              case 'prescritor':
                originFilter = prescritorOriginFilter;
                console.log('✅ FunnelStages: Aplicando filtro Prescritor:', originFilter);
                break;
              case 'franquia':
                originFilter = franquiaOriginFilter;
                console.log('✅ FunnelStages: Aplicando filtro Franquia:', originFilter);
                break;
              default:
                originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
                console.log('⚠️ FunnelStages: Aplicando filtro padrão (origem não reconhecida):', originFilter);
                break;
            }
          } else {
            console.log('⚠️ FunnelStages: Origem não encontrada para ID:', selectedOrigin);
          }
        } else {
          console.log('⚠️ FunnelStages: Erro ao buscar origem, usando ID diretamente:', selectedOrigin);
          originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
        }
      } catch (error) {
        console.log('⚠️ FunnelStages: Erro ao buscar origem, usando ID diretamente:', error);
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
      }
    } else {
      console.log('🔍 FunnelStages: NÃO aplicando filtro de origem - condições não atendidas:', {
        selectedOrigin,
        hasValue: !!selectedOrigin,
        notAll: selectedOrigin !== 'all',
        notUndefined: selectedOrigin !== 'undefined',
        notEmpty: selectedOrigin !== ''
      });
    }

    console.log('🔍 FunnelStages: Filtros construídos:', filters);
    console.log('🔍 FunnelStages: Filtro de origem:', originFilter);
    console.log('🔍 FunnelStages: Condição para aplicar filtro de origem:', {
      selectedOrigin,
      hasValue: !!selectedOrigin,
      notAll: selectedOrigin !== 'all',
      notUndefined: selectedOrigin !== 'undefined',
      notEmpty: selectedOrigin !== '',
      isString: typeof selectedOrigin === 'string'
    });

    // 1. BUSCAR OPORTUNIDADES ABERTAS POR ETAPA (SEM FILTRO DE DATA - SÃO AS ABERTAS AGORA)
    const etapaIds = etapas.map(e => e.id_etapa_sprint);
    const etapaFilter = etapaIds.map(id => `crm_column.eq.${id}`).join(',');
    
    // FILTROS PARA ABERTAS: apenas funil, vendedor (sem data!)
    let filtrosAbertas = '';
    
    // FILTRO DE FUNIL para abertas
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      filtrosAbertas += `&funil_id=eq.${selectedFunnel}`;
      console.log('🔍 FunnelStages: Filtro de funil para abertas:', selectedFunnel);
    } else {
      filtrosAbertas += `&funil_id=in.(6,14)`;
      console.log('🔍 FunnelStages: Filtro de funil para abertas incluindo ambos (6 e 14)');
    }
    
    // FILTRO DE VENDEDOR para abertas
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== 'undefined' && selectedSeller !== '') {
      filtrosAbertas += `&user_id=eq.${selectedSeller}`;
    }

    // FILTRO DE UNIDADE para abertas
    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== 'undefined' && selectedUnit !== '') {
      const unidadeEncoded = encodeURIComponent(selectedUnit.toString());
      filtrosAbertas += `&unidade_id=eq.${unidadeEncoded}`;
    }
    
    const abertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,crm_column,value&archived=eq.0&status=eq.open&or=(${etapaFilter})${filtrosAbertas}${originFilter}`;
    console.log('🔍 FunnelStages: URL oportunidades abertas (COM FILTRO DE ORIGEM):', abertasUrl);
    
    // 2. BUSCAR OPORTUNIDADES CRIADAS NO PERÍODO (COM FILTRO DE ORIGEM)
    const criadasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${filters}${originFilter}`;
    console.log('🔍 FunnelStages: URL oportunidades criadas:', criadasUrl);
    
    // 3. BUSCAR OPORTUNIDADES GANHAS NO PERÍODO (COM FILTRO DE ORIGEM)
    const ganhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}${filters}${originFilter}`;
    console.log('🔍 FunnelStages: URL oportunidades ganhas:', ganhasUrl);

    // EXECUTAR TODAS AS QUERIES EM PARALELO
    const [oportunidadesAbertas, oportunidadesCriadas, oportunidadesGanhas] = await Promise.all([
      fetchAllRecords(abertasUrl, baseHeaders),
      fetchAllRecords(criadasUrl, baseHeaders),
      fetchAllRecords(ganhasUrl, baseHeaders)
    ]);

    console.log('✅ FunnelStages: Oportunidades abertas:', oportunidadesAbertas.length);
    console.log('✅ FunnelStages: Oportunidades criadas:', oportunidadesCriadas.length);
    console.log('✅ FunnelStages: Oportunidades ganhas:', oportunidadesGanhas.length);
    
    // DEBUG: Mostrar algumas oportunidades abertas para verificar estrutura
    if (oportunidadesAbertas.length > 0) {
      console.log('📋 FunnelStages: Primeiras 3 oportunidades abertas:', oportunidadesAbertas.slice(0, 3));
      console.log('📋 FunnelStages: Tipos dos crm_column nas oportunidades:', oportunidadesAbertas.slice(0, 3).map(o => ({ id: o.id, crm_column: o.crm_column, tipo: typeof o.crm_column })));
    }
    
    // DEBUG: Mostrar etapas e seus IDs
    console.log('📋 FunnelStages: Etapas recebidas:');
    etapas.forEach(etapa => {
      console.log(`   - "${etapa.nome_etapa}": ID = ${etapa.id_etapa_sprint} (tipo: ${typeof etapa.id_etapa_sprint})`);
    });
    
    // DEBUG: Mostrar todas as crm_column encontradas
    const crmColumnsEncontradas = [...new Set(oportunidadesAbertas.map(o => o.crm_column))];
    console.log('📋 FunnelStages: crm_column encontradas nas oportunidades:', crmColumnsEncontradas);
    
    // DEBUG: Mostrar IDs das etapas que estamos procurando
    const idsEtapas = etapas.map(e => e.id_etapa_sprint);
    console.log('📋 FunnelStages: IDs das etapas que estamos procurando:', idsEtapas);

    // PROCESSAR DADOS POR ETAPA
    const resultado = [];
    
    for (const etapa of etapas) {
      // Filtrar oportunidades abertas desta etapa (converter ambos para string para garantir comparação correta)
      const abertosEtapa = oportunidadesAbertas.filter(o => String(o.crm_column) === String(etapa.id_etapa_sprint));

      // DEBUG: Log detalhado por etapa
      console.log(`🔍 FunnelStages: Etapa "${etapa.nome_etapa}" (ID: ${etapa.id_etapa_sprint}):`);
      console.log(`   - Oportunidades abertas nesta etapa: ${abertosEtapa.length}`);
      if (abertosEtapa.length > 0) {
        console.log(`   - IDs das oportunidades: ${abertosEtapa.map(o => o.id).join(', ')}`);
      }

      // 🎯 BUSCAR BREAKDOWN POR ORIGEM PARA ESTA ETAPA ESPECÍFICA COM FILTROS
      const origemBreakdown = await getOportunidadesPorOrigemEtapa(
        etapa.id_etapa_sprint,
        baseHeaders,
        selectedFunnel,
        selectedSeller,
        selectedUnit
      );

      // Calcular valor em aberto
      const valorEmAberto = abertosEtapa.reduce((acc, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return acc + valor;
      }, 0);

      // LÓGICA PARA CRIADAS NO PERÍODO POR ETAPA
      let criadasPeriodoEtapa = 0;
      let valorCriadasPeriodoEtapa = 0; // Declarar no escopo correto

      if (etapa.ordem_etapa === 0 || etapa.nome_etapa?.toLowerCase().includes('entrada')) {
        // PRIMEIRA ETAPA: Total geral de criadas no período (para badge verde claro)
        criadasPeriodoEtapa = oportunidadesCriadas.length;
        // valorCriadasPeriodoEtapa já está declarado no escopo do loop
        console.log(`📊 FunnelStages: Primeira etapa "${etapa.nome_etapa}": ${criadasPeriodoEtapa} criadas no período (total geral)`);

        // TAMBÉM buscar criadas específicas da primeira etapa (para badge verde escuro)
        try {
          const criadasNaPrimeiraEtapaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}&crm_column=eq.${etapa.id_etapa_sprint}${filters}${originFilter}`;

          console.log(`🔍 FunnelStages: Buscando criadas específicas da primeira etapa:`, criadasNaPrimeiraEtapaUrl);

          const criadasEspecificasData = await fetchAllRecords(criadasNaPrimeiraEtapaUrl, baseHeaders);
          const criadasEspecificasPrimeiraEtapa = criadasEspecificasData ? criadasEspecificasData.length : 0;
          
          // Calcular valor total das criadas específicas
          const valorCriadasEspecificasPrimeiraEtapa = criadasEspecificasData ? criadasEspecificasData.reduce((acc, opp) => {
            const valor = parseFloat(opp.value) || 0;
            return acc + valor;
          }, 0) : 0;

          console.log(`✅ FunnelStages: Primeira etapa específicas: ${criadasEspecificasPrimeiraEtapa} criadas que ficaram na entrada, valor: R$ ${valorCriadasEspecificasPrimeiraEtapa.toFixed(2)}`);

          // BUSCAR PERDIDAS NA PRIMEIRA ETAPA
          let perdidasPrimeiraEtapa = 0;
          let valorPerdidasPrimeiraEtapa = 0;
          try {
            const perdidasNaPrimeiraEtapaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&lost_date=gte.${dataInicio}&lost_date=lte.${dataFim}&crm_column=eq.${etapa.id_etapa_sprint}${filters}${originFilter}`;

            console.log(`🔍 FunnelStages: Buscando perdidas na primeira etapa:`, perdidasNaPrimeiraEtapaUrl);

            const perdidasPrimeiraEtapaData = await fetchAllRecords(perdidasNaPrimeiraEtapaUrl, baseHeaders);
            perdidasPrimeiraEtapa = perdidasPrimeiraEtapaData ? perdidasPrimeiraEtapaData.length : 0;
            
            // Calcular valor total das perdidas
            valorPerdidasPrimeiraEtapa = perdidasPrimeiraEtapaData ? perdidasPrimeiraEtapaData.reduce((acc, opp) => {
              const valor = parseFloat(opp.value) || 0;
              return acc + valor;
            }, 0) : 0;

            console.log(`✅ FunnelStages: Primeira etapa perdidas: ${perdidasPrimeiraEtapa} perdidas no período, valor: R$ ${valorPerdidasPrimeiraEtapa.toFixed(2)}`);
          } catch (error) {
            console.error(`❌ FunnelStages: Erro ao buscar perdidas na primeira etapa:`, error);
            perdidasPrimeiraEtapa = 0;
            valorPerdidasPrimeiraEtapa = 0;
          }

          // BUSCAR GANHAS NA PRIMEIRA ETAPA
          let ganhasPrimeiraEtapa = 0;
          let valorGanhasPrimeiraEtapa = 0;
          try {
            const ganhasNaPrimeiraEtapaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}&crm_column=eq.${etapa.id_etapa_sprint}${filters}${originFilter}`;

            console.log(`🔍 FunnelStages: Buscando ganhas na primeira etapa:`, ganhasNaPrimeiraEtapaUrl);

            const ganhasPrimeiraEtapaData = await fetchAllRecords(ganhasNaPrimeiraEtapaUrl, baseHeaders);
            ganhasPrimeiraEtapa = ganhasPrimeiraEtapaData ? ganhasPrimeiraEtapaData.length : 0;
            
            // Calcular valor total das ganhas
            valorGanhasPrimeiraEtapa = ganhasPrimeiraEtapaData ? ganhasPrimeiraEtapaData.reduce((acc, opp) => {
              const valor = parseFloat(opp.value) || 0;
              return acc + valor;
            }, 0) : 0;

            console.log(`✅ FunnelStages: Primeira etapa ganhas: ${ganhasPrimeiraEtapa} ganhas no período, valor: R$ ${valorGanhasPrimeiraEtapa.toFixed(2)}`);
          } catch (error) {
            console.error(`❌ FunnelStages: Erro ao buscar ganhas na primeira etapa:`, error);
            ganhasPrimeiraEtapa = 0;
            valorGanhasPrimeiraEtapa = 0;
          }

          // Salvar as duas informações
          resultado.push({
            ...etapa,
            abertos: abertosEtapa.length,
            valorEmAberto: valorEmAberto,
            criadasPeriodo: criadasPeriodoEtapa, // Total geral (99)
            valorCriadasPeriodo: 0, // Será calculado separadamente para o total geral
            criadasEspecificasEtapa: criadasEspecificasPrimeiraEtapa, // Específicas da entrada
            valorCriadasEspecificasEtapa: valorCriadasEspecificasPrimeiraEtapa, // VALOR DAS CRIADAS ESPECÍFICAS
            perdidasPeriodo: perdidasPrimeiraEtapa, // PERDIDAS NA PRIMEIRA ETAPA
            valorPerdidasPeriodo: valorPerdidasPrimeiraEtapa, // VALOR DAS PERDIDAS NA PRIMEIRA ETAPA
            ganhasPeriodo: ganhasPrimeiraEtapa, // GANHAS NA PRIMEIRA ETAPA
            valorGanhasPeriodo: valorGanhasPrimeiraEtapa, // VALOR DAS GANHAS NA PRIMEIRA ETAPA
            passaramPorEtapa: 0,
            taxaPassagem: null,
            origens: origemBreakdown // 🎯 BREAKDOWN POR ORIGEM
          });

          continue; // Pular o resultado.push() padrão no final do loop
        } catch (error) {
          console.error(`❌ FunnelStages: Erro ao buscar criadas específicas da primeira etapa:`, error);
        }
      } else {
        // OUTRAS ETAPAS: Apenas criadas no período QUE ESTÃO nesta etapa específica
        // valorCriadasPeriodoEtapa já está declarado no escopo do loop
        try {
          const criadasNaEtapaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}&crm_column=eq.${etapa.id_etapa_sprint}${filters}${originFilter}`;

          console.log(`🔍 FunnelStages: Buscando criadas na etapa "${etapa.nome_etapa}":`, criadasNaEtapaUrl);

          const criadasNaEtapaData = await fetchAllRecords(criadasNaEtapaUrl, baseHeaders);
          criadasPeriodoEtapa = criadasNaEtapaData ? criadasNaEtapaData.length : 0;
          
          // Calcular valor total das criadas
          valorCriadasPeriodoEtapa = criadasNaEtapaData ? criadasNaEtapaData.reduce((acc, opp) => {
            const valor = parseFloat(opp.value) || 0;
            return acc + valor;
          }, 0) : 0;

          console.log(`✅ FunnelStages: Etapa "${etapa.nome_etapa}": ${criadasPeriodoEtapa} criadas no período e nesta etapa, valor: R$ ${valorCriadasPeriodoEtapa.toFixed(2)}`);
        } catch (error) {
          console.error(`❌ FunnelStages: Erro ao buscar criadas na etapa "${etapa.nome_etapa}":`, error);
          criadasPeriodoEtapa = 0;
          valorCriadasPeriodoEtapa = 0;
        }
      }

      // BUSCAR OPORTUNIDADES PERDIDAS NO PERÍODO PARA ESTA ETAPA
      let perdidasPeriodoEtapa = 0;
      let valorPerdidasPeriodoEtapa = 0;
      try {
        const perdidasNaEtapaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&lost_date=gte.${dataInicio}&lost_date=lte.${dataFim}&crm_column=eq.${etapa.id_etapa_sprint}${filters}${originFilter}`;

        console.log(`🔍 FunnelStages: Buscando perdidas na etapa "${etapa.nome_etapa}":`, perdidasNaEtapaUrl);

        const perdidasNaEtapaData = await fetchAllRecords(perdidasNaEtapaUrl, baseHeaders);
        perdidasPeriodoEtapa = perdidasNaEtapaData ? perdidasNaEtapaData.length : 0;
        
        // Calcular valor total das perdidas
        valorPerdidasPeriodoEtapa = perdidasNaEtapaData ? perdidasNaEtapaData.reduce((acc, opp) => {
          const valor = parseFloat(opp.value) || 0;
          return acc + valor;
        }, 0) : 0;

        console.log(`✅ FunnelStages: Etapa "${etapa.nome_etapa}": ${perdidasPeriodoEtapa} perdidas no período nesta etapa, valor: R$ ${valorPerdidasPeriodoEtapa.toFixed(2)}`);
      } catch (error) {
        console.error(`❌ FunnelStages: Erro ao buscar perdidas na etapa "${etapa.nome_etapa}":`, error);
        perdidasPeriodoEtapa = 0;
        valorPerdidasPeriodoEtapa = 0;
      }

      // BUSCAR OPORTUNIDADES GANHAS NO PERÍODO PARA ESTA ETAPA
      let ganhasPeriodoEtapa = 0;
      let valorGanhasPeriodoEtapa = 0;
      try {
        const ganhasNaEtapaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}&crm_column=eq.${etapa.id_etapa_sprint}${filters}${originFilter}`;

        console.log(`🔍 FunnelStages: Buscando ganhas na etapa "${etapa.nome_etapa}":`, ganhasNaEtapaUrl);

        const ganhasNaEtapaData = await fetchAllRecords(ganhasNaEtapaUrl, baseHeaders);
        ganhasPeriodoEtapa = ganhasNaEtapaData ? ganhasNaEtapaData.length : 0;
        
        // Calcular valor total das ganhas
        valorGanhasPeriodoEtapa = ganhasNaEtapaData ? ganhasNaEtapaData.reduce((acc, opp) => {
          const valor = parseFloat(opp.value) || 0;
          return acc + valor;
        }, 0) : 0;

        console.log(`✅ FunnelStages: Etapa "${etapa.nome_etapa}": ${ganhasPeriodoEtapa} ganhas no período nesta etapa, valor: R$ ${valorGanhasPeriodoEtapa.toFixed(2)}`);
      } catch (error) {
        console.error(`❌ FunnelStages: Erro ao buscar ganhas na etapa "${etapa.nome_etapa}":`, error);
        ganhasPeriodoEtapa = 0;
        valorGanhasPeriodoEtapa = 0;
      }

      resultado.push({
        ...etapa,
        abertos: abertosEtapa.length,
        valorEmAberto: valorEmAberto,
        criadasPeriodo: criadasPeriodoEtapa,
        valorCriadasPeriodo: valorCriadasPeriodoEtapa, // VALOR DAS CRIADAS NO PERÍODO
        criadasEspecificasEtapa: criadasPeriodoEtapa, // Para outras etapas, é igual ao criadasPeriodo
        valorCriadasEspecificasEtapa: valorCriadasPeriodoEtapa, // Para outras etapas, é igual ao valorCriadasPeriodo
        perdidasPeriodo: perdidasPeriodoEtapa, // ADICIONAR PERDIDAS NO PERÍODO
        valorPerdidasPeriodo: valorPerdidasPeriodoEtapa, // ADICIONAR VALOR DAS PERDIDAS NO PERÍODO
        ganhasPeriodo: ganhasPeriodoEtapa, // ADICIONAR GANHAS NO PERÍODO
        valorGanhasPeriodo: valorGanhasPeriodoEtapa, // ADICIONAR VALOR DAS GANHAS NO PERÍODO
        passaramPorEtapa: 0,
        taxaPassagem: null,
        origens: origemBreakdown // 🎯 BREAKDOWN POR ORIGEM
      });
    }

    // CALCULAR QUANTOS PASSARAM POR CADA ETAPA (LÓGICA CORRETA)
    for (let i = 0; i < resultado.length; i++) {
      if (i === 0) {
        // PRIMEIRA ETAPA: Total geral de criadas no período
        resultado[i].passaramPorEtapa = oportunidadesCriadas.length;
        console.log(`📊 FunnelStages: Primeira etapa "${resultado[i].nome_etapa}": ${resultado[i].passaramPorEtapa} entraram (total criadas)`);
      } else if (i === 1) {
        // SEGUNDA ETAPA: Total geral - Criadas que ficaram na primeira etapa
        const primeiraEtapa = resultado[0];
        const totalGeral = oportunidadesCriadas.length;
        const criadasQueFicaramPrimeira = primeiraEtapa.criadasEspecificasEtapa || 0;

        const calculado = totalGeral - criadasQueFicaramPrimeira;
        resultado[i].passaramPorEtapa = Math.max(0, calculado);
        console.log(`📊 FunnelStages: Segunda etapa "${resultado[i].nome_etapa}": ${totalGeral} (total) - ${criadasQueFicaramPrimeira} (ficaram na 1ª) = ${calculado} → ${resultado[i].passaramPorEtapa} passaram`);
      } else {
        // DEMAIS ETAPAS: Passaram da anterior - Criadas que ficaram na etapa anterior
        const etapaAnterior = resultado[i - 1];
        const passaramAnterior = etapaAnterior.passaramPorEtapa || 0;
        const criadasQueFicaramAnterior = etapaAnterior.criadasEspecificasEtapa || 0;

        const calculado = passaramAnterior - criadasQueFicaramAnterior;
        resultado[i].passaramPorEtapa = Math.max(0, calculado);
        console.log(`📊 FunnelStages: Etapa "${resultado[i].nome_etapa}": ${passaramAnterior} (passaram anterior) - ${criadasQueFicaramAnterior} (ficaram anterior) = ${calculado} → ${resultado[i].passaramPorEtapa} passaram`);
      }

      // DEBUG: Se o resultado for 0, mostrar mais detalhes
      if (resultado[i].passaramPorEtapa === 0 && i > 0) {
        console.log(`⚠️ FunnelStages: ZERO na etapa "${resultado[i].nome_etapa}" - Verificar se é esperado`);
      }
    }

    // CALCULAR TAXAS DE PASSAGEM
    for (let i = 0; i < resultado.length; i++) {
      if (i < resultado.length - 1) {
        const etapaAtual = resultado[i];
        const proximaEtapa = resultado[i + 1];
        
        // Verificar se a próxima etapa tem ampulheta=true OU se a etapa atual tem is_ganho=true
        if (proximaEtapa.ampulheta === true || etapaAtual.is_ganho === true) {
          if (proximaEtapa.ampulheta === true) {
            console.log(`⏳ FunnelStages: Etapa "${proximaEtapa.nome_etapa}" marcada como ampulheta=true - não calculando taxa de passagem`);
          }
          if (etapaAtual.is_ganho === true) {
            console.log(`🏆 FunnelStages: Etapa "${etapaAtual.nome_etapa}" marcada como is_ganho=true - não calculando taxa de passagem`);
          }
          proximaEtapa.taxaPassagem = null; // Não mostrar taxa para etapas ampulheta ou após ganho
        } else {
          const passaramAtual = etapaAtual.passaramPorEtapa || 0;
          const passaramProxima = proximaEtapa.passaramPorEtapa || 0;
          
          if (passaramAtual > 0) {
            const taxa = (passaramProxima / passaramAtual) * 100;
            proximaEtapa.taxaPassagem = Math.round(taxa * 10) / 10;
          } else {
            proximaEtapa.taxaPassagem = 0;
          }
        }
      }
    }

    // CALCULAR DADOS DE CONVERSÃO GERAL
    const totalCriadas = oportunidadesCriadas.length;
    const totalGanhas = oportunidadesGanhas.length;
    
    const valorTotalGanho = oportunidadesGanhas.reduce((acc, opp) => {
      const valor = parseFloat(opp.value) || 0;
      return acc + valor;
    }, 0);
    
    const taxaConversao = totalCriadas > 0 ? (totalGanhas / totalCriadas) * 100 : 0;
    const ticketMedio = totalGanhas > 0 ? valorTotalGanho / totalGanhas : 0;

    console.log('📊 FunnelStages: Dados processados:', {
      totalEtapas: resultado.length,
      totalCriadas,
      totalGanhas,
      valorTotalGanho,
      taxaConversao: taxaConversao.toFixed(2) + '%'
    });

    console.log('🔍 FunnelStages: Resumo das etapas processadas:');
    resultado.forEach((etapa, index) => {
      console.log(`   ${index + 1}. "${etapa.nome_etapa}": ${etapa.abertos} abertos | ${etapa.passaramPorEtapa} passaram | ${etapa.criadasPeriodo} criadas | ${etapa.perdidasPeriodo} perdidas | ${etapa.ganhasPeriodo} ganhas | taxa: ${etapa.taxaPassagem}%`);
    });

    const resultadoFinal = {
      etapas: resultado,
      conversaoGeral: {
        totalCriadas,
        totalFechadas: totalGanhas,
        taxaConversao,
        valorTotal: valorTotalGanho,
        ticketMedio
      },
      // Sources será buscado separadamente pelo funnelSourcesService
      sourcesData: null
    };

    console.log('✅ FunnelStages: Retornando resultado final com', resultado.length, 'etapas');
    console.log('=' .repeat(80));

    // RETORNAR DADOS FORMATADOS
    return resultadoFinal;

  } catch (error) {
    console.error('❌ FunnelStages: Erro ao buscar dados:', error);
    throw error;
  }
};

export default { getFunnelStagesData };