/**
 * 🔥 MAPA DE CALOR SERVICE - VERSÃO CORRIGIDA
 *
 * Service para buscar dados de leads agrupados por dia da semana e hora
 * seguindo EXATAMENTE a mesma lógica do DailyPerformanceVertical
 *
 * LÓGICA:
 * - Dados criados das 7h às 8h → aparecem no quadro das 8h
 * - Dados criados das 8h às 9h → aparecem no quadro das 9h
 * - E assim por diante...
 * - Usar create_date para leads (não gain_date)
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * Função SIMPLES: sempre buscar a última segunda-feira (ignorar período do FilterBar)
 */
const getLastMonday = () => {
  console.log(`📅 MAPA DE CALOR: Calculando última segunda-feira (ignora filtro de período)`);

  const today = new Date();
  let lastMonday = new Date(today);

  console.log(`📅 Hoje: ${today.toISOString().split('T')[0]} (dia da semana: ${today.getDay()})`);

  // Se hoje é segunda-feira (1), usar hoje
  if (today.getDay() === 1) {
    console.log(`✅ HOJE É SEGUNDA-FEIRA: usando hoje ${today.toISOString().split('T')[0]}`);
    return today.toISOString().split('T')[0];
  }

  // Senão, voltar até encontrar a última segunda-feira
  while (lastMonday.getDay() !== 1) {
    lastMonday.setDate(lastMonday.getDate() - 1);
  }

  const mondayString = lastMonday.toISOString().split('T')[0];
  console.log(`✅ ÚLTIMA SEGUNDA-FEIRA ENCONTRADA: ${mondayString}`);

  return mondayString;
};

/**
 * Função SIMPLES: sempre buscar a última terça-feira (ignorar período do FilterBar)
 */
const getLastTuesday = () => {
  console.log(`📅 MAPA DE CALOR: Calculando última terça-feira (ignora filtro de período)`);

  const today = new Date();
  let lastTuesday = new Date(today);

  console.log(`📅 Hoje: ${today.toISOString().split('T')[0]} (dia da semana: ${today.getDay()})`);

  // Se hoje é terça-feira (2), usar hoje
  if (today.getDay() === 2) {
    console.log(`✅ HOJE É TERÇA-FEIRA: usando hoje ${today.toISOString().split('T')[0]}`);
    return today.toISOString().split('T')[0];
  }

  // Senão, voltar até encontrar a última terça-feira
  while (lastTuesday.getDay() !== 2) {
    lastTuesday.setDate(lastTuesday.getDate() - 1);
  }

  const tuesdayString = lastTuesday.toISOString().split('T')[0];
  console.log(`✅ ÚLTIMA TERÇA-FEIRA ENCONTRADA: ${tuesdayString}`);

  return tuesdayString;
};

/**
 * Função SIMPLES: sempre buscar a última quarta-feira (ignorar período do FilterBar)
 */
const getLastWednesday = () => {
  console.log(`📅 MAPA DE CALOR: Calculando última quarta-feira (ignora filtro de período)`);

  const today = new Date();
  let lastWednesday = new Date(today);

  console.log(`📅 Hoje: ${today.toISOString().split('T')[0]} (dia da semana: ${today.getDay()})`);

  // Se hoje é quarta-feira (3), usar hoje
  if (today.getDay() === 3) {
    console.log(`✅ HOJE É QUARTA-FEIRA: usando hoje ${today.toISOString().split('T')[0]}`);
    return today.toISOString().split('T')[0];
  }

  // Senão, voltar até encontrar a última quarta-feira
  while (lastWednesday.getDay() !== 3) {
    lastWednesday.setDate(lastWednesday.getDate() - 1);
  }

  const wednesdayString = lastWednesday.toISOString().split('T')[0];
  console.log(`✅ ÚLTIMA QUARTA-FEIRA ENCONTRADA: ${wednesdayString}`);

  return wednesdayString;
};

/**
 * Construir filtros (mesma lógica do TotalOportunidadesService)
 */
const buildFilters = async (selectedFunnel, selectedUnit, selectedSeller, selectedOrigin) => {
  let funilFilter = '';
  if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
    funilFilter = `&funil_id=eq.${selectedFunnel}`;
  } else {
    funilFilter = `&funil_id=in.(6,14)`;
  }

  let unidadeFilter = '';
  if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
    const unidadeValue = selectedUnit.toString();
    const unidadeEncoded = encodeURIComponent(unidadeValue);
    unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
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
          'Accept-Profile': 'api',
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
      console.log('⚠️ Erro ao buscar origem, usando ID diretamente:', error);
      originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
    }
  }

  return funilFilter + unidadeFilter + sellerFilter + originFilter;
};

/**
 * Buscar dados de um dia específico
 */
const fetchDayData = async (nomeDay, dateString, filtrosCombinados, rawLeadsData, key) => {
  console.log(`🎯 BUSCANDO DADOS DE ${nomeDay.toUpperCase()}: ${dateString}`);

  const totalDiaQuery = `oportunidade_sprint?select=id,value&archived=eq.0&create_date=gte.${dateString}&create_date=lte.${dateString}T23:59:59${filtrosCombinados}`;

  console.log(`🔍 Query ${nomeDay}:`, `${supabaseUrl}/rest/v1/${totalDiaQuery}`);

  const totalDiaResponse = await fetch(`${supabaseUrl}/rest/v1/${totalDiaQuery}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': 'api',
      'Content-Profile': 'api'
    }
  });

  if (totalDiaResponse.ok) {
    const totalDiaLeads = await totalDiaResponse.json();
    rawLeadsData[key] = totalDiaLeads;
    console.log(`🎯 TOTAL ${nomeDay.toUpperCase()}: ${totalDiaLeads.length} leads encontrados`);
  } else {
    console.error(`❌ Erro ao buscar dados de ${nomeDay}:`, totalDiaResponse.status);
    rawLeadsData[key] = [];
  }
};

/**
 * Buscar dados por hora para um dia específico
 */
const fetchHourlyData = async (dateString, diaSemana, horarios, filtrosCombinados, heatmapData, nomeDay) => {
  console.log(`🎯 PROCESSANDO HORAS DE ${nomeDay.toUpperCase()}: ${dateString}`);

  for (const horaFim of horarios) {
    const horaInicio = horaFim - 1; // Das 7h às 8h = mostra no quadro 8h

    console.log(`🎯 ${nomeDay} - HORA ${horaFim}h (dados criados das ${horaInicio}h às ${horaFim}h)`);

    // BUSCA LEADS por hora
    let leadsQuery = `oportunidade_sprint?select=id,create_date&archived=eq.0`;

    // Aplicar filtro de horário
    const horaInicioStr = `${String(horaInicio).padStart(2, '0')}:00:00`;
    const horaFimStr = `${String(horaFim).padStart(2, '0')}:00:00`;

    const dataInicio = `${dateString}T${horaInicioStr}`;
    const dataFim = `${dateString}T${horaFimStr}`;

    leadsQuery += `&create_date=gte.${dataInicio}&create_date=lt.${dataFim}`;
    leadsQuery += filtrosCombinados;

    console.log(`🔍 Query ${nomeDay} ${horaFim}h:`, `${supabaseUrl}/rest/v1/${leadsQuery}`);

    // Executar busca
    const leadsResponse = await fetch(`${supabaseUrl}/rest/v1/${leadsQuery}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    let leadsCount = 0;

    if (leadsResponse.ok) {
      const horaLeads = await leadsResponse.json();
      leadsCount = horaLeads.length;
      console.log(`🎯 ${nomeDay} ${horaFim}h: ${leadsCount} leads encontrados`);
    } else {
      console.error(`❌ Erro ao buscar leads ${nomeDay} hora ${horaFim}h:`, leadsResponse.status);
    }

    // Adicionar ao array de dados processados
    heatmapData.push({
      dia_semana: diaSemana,
      hora: horaFim,
      total_leads: leadsCount
    });
  }
};

/**
 * Buscar dados do mapa de calor seguindo lógica do DailyPerformanceVertical
 * @param {Object} params - Parâmetros de filtro
 */
export const getMapaDeCalorData = async (params) => {
  try {
    const { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin } = params;

    console.log('🔥 MapaDeCalor: Buscando dados com lógica corrigida...', params);
    console.log('🚨 IGNORANDO período do FilterBar, sempre buscar última segunda, terça e quarta!');

    // Buscar datas da última segunda-feira, terça-feira e quarta-feira
    const mondayDate = getLastMonday();
    const tuesdayDate = getLastTuesday();
    const wednesdayDate = getLastWednesday();
    console.log(`🎯 DATAS FIXAS PARA HEATMAP:`);
    console.log(`   📅 Segunda-feira: ${mondayDate}`);
    console.log(`   📅 Terça-feira: ${tuesdayDate}`);
    console.log(`   📅 Quarta-feira: ${wednesdayDate}`);

    // Array para armazenar dados por hora
    const heatmapData = [];
    const rawLeadsData = {
      segunda: [],
      terca: [],
      quarta: [],
      segundaDate: mondayDate,
      tercaDate: tuesdayDate,
      quartaDate: wednesdayDate
    };

    // Definir horários fixos de 8h às 22h (seguindo padrão do mapa de calor)
    const horarios = [];
    for (let hora = 8; hora <= 22; hora++) {
      horarios.push(hora);
    }

    console.log('🎯 PROCESSANDO HORÁRIOS:', horarios);

    // BUSCAR DADOS DE SEGUNDA-FEIRA E TERÇA-FEIRA SEPARADAMENTE
    console.log('🎯 BUSCANDO DADOS DE AMBOS OS DIAS...');

    // Construir filtros (mesma lógica do TotalOportunidadesService)
    const filtrosCombinados = await buildFilters(selectedFunnel, selectedUnit, selectedSeller, selectedOrigin);

    // BUSCAR DADOS DA SEGUNDA-FEIRA
    await fetchDayData('segunda-feira', mondayDate, filtrosCombinados, rawLeadsData, 'segunda');

    // BUSCAR DADOS DA TERÇA-FEIRA
    await fetchDayData('terça-feira', tuesdayDate, filtrosCombinados, rawLeadsData, 'terca');

    // BUSCAR DADOS DA QUARTA-FEIRA
    await fetchDayData('quarta-feira', wednesdayDate, filtrosCombinados, rawLeadsData, 'quarta');

    // BUSCAR DADOS POR HORA PARA SEGUNDA, TERÇA E QUARTA-FEIRA
    await fetchHourlyData(mondayDate, 1, horarios, filtrosCombinados, heatmapData, 'Segunda-feira');
    await fetchHourlyData(tuesdayDate, 2, horarios, filtrosCombinados, heatmapData, 'Terça-feira');
    await fetchHourlyData(wednesdayDate, 3, horarios, filtrosCombinados, heatmapData, 'Quarta-feira');

    console.log('✅ MapaDeCalor: Processamento concluído');
    console.log('📊 Dados por hora:', heatmapData);
    console.log('📊 Totais por dia:', {
      segunda: rawLeadsData.segunda ? rawLeadsData.segunda.length : 0,
      terca: rawLeadsData.terca ? rawLeadsData.terca.length : 0,
      quarta: rawLeadsData.quarta ? rawLeadsData.quarta.length : 0
    });

    // Calcular totais
    const totalPorHora = heatmapData.reduce((sum, item) => sum + item.total_leads, 0);
    const totalSegunda = rawLeadsData.segunda ? rawLeadsData.segunda.length : 0;
    const totalTerca = rawLeadsData.terca ? rawLeadsData.terca.length : 0;
    const totalQuarta = rawLeadsData.quarta ? rawLeadsData.quarta.length : 0;

    console.log('🎯 TOTAIS CALCULADOS:');
    console.log(`   - Soma células por hora: ${totalPorHora}`);
    console.log(`   - Total Segunda-feira: ${totalSegunda}`);
    console.log(`   - Total Terça-feira: ${totalTerca}`);
    console.log(`   - Total Quarta-feira: ${totalQuarta}`);

    return {
      heatmapData: heatmapData,
      rawData: rawLeadsData, // Estrutura com segunda, terca, quarta, segundaDate, tercaDate, quartaDate
      totalLeads: totalSegunda + totalTerca + totalQuarta
    };

  } catch (error) {
    console.error('❌ Erro ao buscar dados do mapa de calor:', error);

    return {
      heatmapData: [],
      rawData: [],
      totalLeads: 0
    };
  }
};