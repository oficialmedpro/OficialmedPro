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
 * Função SIMPLES: sempre buscar a última quinta-feira (ignorar período do FilterBar)
 */
const getLastThursday = () => {
  console.log(`📅 MAPA DE CALOR: Calculando última quinta-feira (ignora filtro de período)`);

  const today = new Date();
  let lastThursday = new Date(today);

  console.log(`📅 Hoje: ${today.toISOString().split('T')[0]} (dia da semana: ${today.getDay()})`);

  // Se hoje é quinta-feira (4), usar hoje
  if (today.getDay() === 4) {
    console.log(`✅ HOJE É QUINTA-FEIRA: usando hoje ${today.toISOString().split('T')[0]}`);
    return today.toISOString().split('T')[0];
  }

  // Senão, voltar até encontrar a última quinta-feira
  while (lastThursday.getDay() !== 4) {
    lastThursday.setDate(lastThursday.getDate() - 1);
  }

  const thursdayString = lastThursday.toISOString().split('T')[0];
  console.log(`✅ ÚLTIMA QUINTA-FEIRA ENCONTRADA: ${thursdayString}`);

  return thursdayString;
};

/**
 * Função SIMPLES: sempre buscar a última sexta-feira (ignorar período do FilterBar)
 */
const getLastFriday = () => {
  console.log(`📅 MAPA DE CALOR: Calculando última sexta-feira (ignora filtro de período)`);

  const today = new Date();
  let lastFriday = new Date(today);

  console.log(`📅 Hoje: ${today.toISOString().split('T')[0]} (dia da semana: ${today.getDay()})`);

  // Se hoje é sexta-feira (5), usar hoje
  if (today.getDay() === 5) {
    console.log(`✅ HOJE É SEXTA-FEIRA: usando hoje ${today.toISOString().split('T')[0]}`);
    return today.toISOString().split('T')[0];
  }

  // Senão, voltar até encontrar a última sexta-feira
  while (lastFriday.getDay() !== 5) {
    lastFriday.setDate(lastFriday.getDate() - 1);
  }

  const fridayString = lastFriday.toISOString().split('T')[0];
  console.log(`✅ ÚLTIMA SEXTA-FEIRA ENCONTRADA: ${fridayString}`);

  return fridayString;
};

/**
 * Função SIMPLES: sempre buscar o último sábado (ignorar período do FilterBar)
 */
const getLastSaturday = () => {
  console.log(`📅 MAPA DE CALOR: Calculando último sábado (ignora filtro de período)`);

  const today = new Date();
  let lastSaturday = new Date(today);

  console.log(`📅 Hoje: ${today.toISOString().split('T')[0]} (dia da semana: ${today.getDay()})`);

  // Se hoje é sábado (6), usar hoje
  if (today.getDay() === 6) {
    console.log(`✅ HOJE É SÁBADO: usando hoje ${today.toISOString().split('T')[0]}`);
    return today.toISOString().split('T')[0];
  }

  // Senão, voltar até encontrar o último sábado
  while (lastSaturday.getDay() !== 6) {
    lastSaturday.setDate(lastSaturday.getDate() - 1);
  }

  const saturdayString = lastSaturday.toISOString().split('T')[0];
  console.log(`✅ ÚLTIMO SÁBADO ENCONTRADO: ${saturdayString}`);

  return saturdayString;
};

/**
 * Função SIMPLES: sempre buscar o último domingo (ignorar período do FilterBar)
 */
const getLastSunday = () => {
  console.log(`📅 MAPA DE CALOR: Calculando último domingo (ignora filtro de período)`);

  const today = new Date();
  let lastSunday = new Date(today);

  console.log(`📅 Hoje: ${today.toISOString().split('T')[0]} (dia da semana: ${today.getDay()})`);

  // Se hoje é domingo (0), usar hoje
  if (today.getDay() === 0) {
    console.log(`✅ HOJE É DOMINGO: usando hoje ${today.toISOString().split('T')[0]}`);
    return today.toISOString().split('T')[0];
  }

  // Senão, voltar até encontrar o último domingo
  while (lastSunday.getDay() !== 0) {
    lastSunday.setDate(lastSunday.getDate() - 1);
  }

  const sundayString = lastSunday.toISOString().split('T')[0];
  console.log(`✅ ÚLTIMO DOMINGO ENCONTRADO: ${sundayString}`);

  return sundayString;
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
    console.log('🚨 IGNORANDO período do FilterBar, sempre buscar semana inteira!');

    // Buscar datas da semana inteira
    const mondayDate = getLastMonday();
    const tuesdayDate = getLastTuesday();
    const wednesdayDate = getLastWednesday();
    const thursdayDate = getLastThursday();
    const fridayDate = getLastFriday();
    const saturdayDate = getLastSaturday();
    const sundayDate = getLastSunday();
    console.log(`🎯 DATAS FIXAS PARA HEATMAP:`);
    console.log(`   📅 Segunda-feira: ${mondayDate}`);
    console.log(`   📅 Terça-feira: ${tuesdayDate}`);
    console.log(`   📅 Quarta-feira: ${wednesdayDate}`);
    console.log(`   📅 Quinta-feira: ${thursdayDate}`);
    console.log(`   📅 Sexta-feira: ${fridayDate}`);
    console.log(`   📅 Sábado: ${saturdayDate}`);
    console.log(`   📅 Domingo: ${sundayDate}`);

    // Array para armazenar dados por hora
    const heatmapData = [];
    const rawLeadsData = {
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
      sabado: [],
      domingo: [],
      segundaDate: mondayDate,
      tercaDate: tuesdayDate,
      quartaDate: wednesdayDate,
      quintaDate: thursdayDate,
      sextaDate: fridayDate,
      sabadoDate: saturdayDate,
      domingoDate: sundayDate
    };

    // Definir horários fixos de 8h às 22h (seguindo padrão do mapa de calor)
    const horarios = [];
    for (let hora = 8; hora <= 22; hora++) {
      horarios.push(hora);
    }

    console.log('🎯 PROCESSANDO HORÁRIOS:', horarios);

    // BUSCAR DADOS DE TODOS OS DIAS DA SEMANA
    console.log('🎯 BUSCANDO DADOS DE TODA A SEMANA...');

    // Construir filtros (mesma lógica do TotalOportunidadesService)
    const filtrosCombinados = await buildFilters(selectedFunnel, selectedUnit, selectedSeller, selectedOrigin);

    // BUSCAR DADOS TOTAIS POR DIA
    await fetchDayData('segunda-feira', mondayDate, filtrosCombinados, rawLeadsData, 'segunda');
    await fetchDayData('terça-feira', tuesdayDate, filtrosCombinados, rawLeadsData, 'terca');
    await fetchDayData('quarta-feira', wednesdayDate, filtrosCombinados, rawLeadsData, 'quarta');
    await fetchDayData('quinta-feira', thursdayDate, filtrosCombinados, rawLeadsData, 'quinta');
    await fetchDayData('sexta-feira', fridayDate, filtrosCombinados, rawLeadsData, 'sexta');
    await fetchDayData('sábado', saturdayDate, filtrosCombinados, rawLeadsData, 'sabado');
    await fetchDayData('domingo', sundayDate, filtrosCombinados, rawLeadsData, 'domingo');

    // BUSCAR DADOS POR HORA PARA TODA A SEMANA
    await fetchHourlyData(mondayDate, 1, horarios, filtrosCombinados, heatmapData, 'Segunda-feira');
    await fetchHourlyData(tuesdayDate, 2, horarios, filtrosCombinados, heatmapData, 'Terça-feira');
    await fetchHourlyData(wednesdayDate, 3, horarios, filtrosCombinados, heatmapData, 'Quarta-feira');
    await fetchHourlyData(thursdayDate, 4, horarios, filtrosCombinados, heatmapData, 'Quinta-feira');
    await fetchHourlyData(fridayDate, 5, horarios, filtrosCombinados, heatmapData, 'Sexta-feira');
    await fetchHourlyData(saturdayDate, 6, horarios, filtrosCombinados, heatmapData, 'Sábado');
    await fetchHourlyData(sundayDate, 0, horarios, filtrosCombinados, heatmapData, 'Domingo');

    console.log('✅ MapaDeCalor: Processamento concluído');
    console.log('📊 Dados por hora:', heatmapData);
    console.log('📊 Totais por dia:', {
      segunda: rawLeadsData.segunda ? rawLeadsData.segunda.length : 0,
      terca: rawLeadsData.terca ? rawLeadsData.terca.length : 0,
      quarta: rawLeadsData.quarta ? rawLeadsData.quarta.length : 0,
      quinta: rawLeadsData.quinta ? rawLeadsData.quinta.length : 0,
      sexta: rawLeadsData.sexta ? rawLeadsData.sexta.length : 0,
      sabado: rawLeadsData.sabado ? rawLeadsData.sabado.length : 0,
      domingo: rawLeadsData.domingo ? rawLeadsData.domingo.length : 0
    });

    // Calcular totais
    const totalPorHora = heatmapData.reduce((sum, item) => sum + item.total_leads, 0);
    const totalSegunda = rawLeadsData.segunda ? rawLeadsData.segunda.length : 0;
    const totalTerca = rawLeadsData.terca ? rawLeadsData.terca.length : 0;
    const totalQuarta = rawLeadsData.quarta ? rawLeadsData.quarta.length : 0;
    const totalQuinta = rawLeadsData.quinta ? rawLeadsData.quinta.length : 0;
    const totalSexta = rawLeadsData.sexta ? rawLeadsData.sexta.length : 0;
    const totalSabado = rawLeadsData.sabado ? rawLeadsData.sabado.length : 0;
    const totalDomingo = rawLeadsData.domingo ? rawLeadsData.domingo.length : 0;

    console.log('🎯 TOTAIS CALCULADOS:');
    console.log(`   - Soma células por hora: ${totalPorHora}`);
    console.log(`   - Total Segunda-feira: ${totalSegunda}`);
    console.log(`   - Total Terça-feira: ${totalTerca}`);
    console.log(`   - Total Quarta-feira: ${totalQuarta}`);
    console.log(`   - Total Quinta-feira: ${totalQuinta}`);
    console.log(`   - Total Sexta-feira: ${totalSexta}`);
    console.log(`   - Total Sábado: ${totalSabado}`);
    console.log(`   - Total Domingo: ${totalDomingo}`);

    return {
      heatmapData: heatmapData,
      rawData: rawLeadsData, // Estrutura com todos os 7 dias da semana
      totalLeads: totalSegunda + totalTerca + totalQuarta + totalQuinta + totalSexta + totalSabado + totalDomingo
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