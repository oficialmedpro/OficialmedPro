/**
 * 🔥 MAPA DE CALOR SERVICE
 *
 * Service para buscar dados de leads agrupados por dia da semana e hora
 * para criar o heatmap de distribuição temporal
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * Buscar todos os registros com paginação recursiva (igual ao TotalOportunidadesService)
 */
const fetchAllRecords = async (url, headers) => {
  const pageSize = 1000;
  let allRecords = [];
  let offset = 0;
  let hasMore = true;

  console.log('📄 MapaDeCalor: Iniciando paginação para URL:', url);

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
      console.error(`❌ Erro ao buscar página ${Math.floor(offset / pageSize) + 1}:`, error);
      break;
    }
  }

  console.log(`✅ MapaDeCalor: Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
};

/**
 * Buscar dados do mapa de calor
 * Agrupa leads por dia da semana (1=Segunda, 7=Domingo) e hora (8-22)
 */
export const getMapaDeCalorData = async (params) => {
  try {
    console.log('🔥 Buscando dados do mapa de calor...', params);

    const { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin } = params;

    // Usar query direta do Supabase - mais confiável
    const fallbackData = await getMapaDeCalorDataFallback(params);
    return fallbackData;

  } catch (error) {
    console.error('❌ Erro ao buscar dados do mapa de calor:', error);

    // Retornar dados vazios em caso de erro
    return {
      heatmapData: [],
      totalLeads: 0
    };
  }
};

/**
 * Buscar dados usando a tabela correta (oportunidade_sprint)
 */
const getMapaDeCalorDataFallback = async (params) => {
  try {
    const { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin } = params;

    // Usar a tabela correta conforme outros services
    let select = `create_date`;
    let filters = [];

    // Aplicar filtros EXATAMENTE como no TotalOportunidadesService (linha 235)
    // archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}T23:59:59${filtrosCombinados}

    filters.push('archived.eq.0');

    if (startDate && endDate) {
      filters.push(`create_date.gte.${startDate}`);
      filters.push(`create_date.lte.${endDate}T23:59:59`);
    }

    // Construir filtros exatamente como TotalOportunidadesService (linhas 126-197)
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      filters.push(`funil_id.eq.${selectedFunnel}`);
    } else {
      filters.push(`funil_id.in.(6,14)`);
    }

    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      const unidadeValue = selectedUnit.toString();
      const unidadeEncoded = encodeURIComponent(unidadeValue);
      filters.push(`unidade_id.eq.${unidadeEncoded}`);
    }

    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      filters.push(`user_id.eq.${selectedSeller}`);
    }

    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== '' && selectedOrigin !== 'undefined') {
      // Buscar nome da origem como no TotalOportunidadesService
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
              filters.push(`or=(origem_oportunidade.eq.${encodeURIComponent(originName)},origem_oportunidade.is.null)`);
            } else if (lower === 'google ads' || lower === 'googleads') {
              filters.push(`or=(origem_oportunidade.eq.${encodeURIComponent(originName)},utm_source.eq.google,utm_source.eq.GoogleAds)`);
            } else {
              filters.push(`origem_oportunidade.eq.${encodeURIComponent(originName)}`);
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar origem, usando ID diretamente:', error);
        filters.push(`origem_oportunidade.eq.${encodeURIComponent(selectedOrigin)}`);
      }
    }

    const queryString = `?select=${select}&${filters.join('&')}`;

    console.log('🔍 MapaDeCalor Query final:', `${supabaseUrl}/rest/v1/oportunidade_sprint${queryString}`);
    console.log('🔍 MapaDeCalor Filtros aplicados:', {
      startDate: startDate,
      endDate: endDate,
      selectedFunnel: selectedFunnel,
      selectedUnit: selectedUnit,
      selectedSeller: selectedSeller,
      selectedOrigin: selectedOrigin,
      filters: filters
    });

    console.log('❓ PERGUNTA CRÍTICA: Este período é para qual análise?');
    console.log('   - Período completo:', startDate, 'até', endDate);
    console.log('   - É um dia específico?', startDate === endDate ? 'SIM' : 'NÃO');
    console.log('   - TotalOportunidadesCard vai contar TODOS os leads deste período, não por dia!');

    // USAR PAGINAÇÃO para buscar TODOS os registros (não apenas 1000)
    console.log('🔄 Buscando TODOS os registros com paginação...');

    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Content-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    // Buscar todos os registros com paginação
    const allData = await fetchAllRecords(`${supabaseUrl}/rest/v1/oportunidade_sprint${queryString}`, baseHeaders);
    console.log('✅ Total de registros carregados com paginação:', allData.length);

    // Simular response para manter compatibilidade
    const response = { ok: true };

    if (!response.ok) {
      console.error('❌ Erro na paginação');
      throw new Error('Erro ao buscar dados com paginação');
    }

    const rawData = allData; // Usar dados paginados
    console.log('✅ MapaDeCalor - Dados brutos carregados:', rawData.length, 'registros');
    console.log('🔍 MapaDeCalor - Primeiros 3 registros:', rawData.slice(0, 3));

    // TESTE DE COMPARAÇÃO: Fazer EXATAMENTE a mesma query que o TotalOportunidadesCard usa
    console.log('🧪 TESTE COMPARATIVO: Fazendo query IGUAL ao TotalOportunidadesCard...');

    // Recriar exatamente a query do TotalOportunidadesService linha 235
    let filtrosCombinados = '';

    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      filtrosCombinados += `&funil_id=eq.${selectedFunnel}`;
    } else {
      filtrosCombinados += `&funil_id=in.(6,14)`;
    }

    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      const unidadeEncoded = encodeURIComponent(selectedUnit.toString());
      filtrosCombinados += `&unidade_id=eq.${unidadeEncoded}`;
    }

    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      filtrosCombinados += `&user_id=eq.${selectedSeller}`;
    }

    // Query exata do TotalOportunidadesCard para "oportunidades novas"
    const testQuery = `oportunidade_sprint?select=id,value&archived=eq.0&create_date=gte.${startDate}&create_date=lte.${endDate}T23:59:59${filtrosCombinados}`;

    console.log('🧪 TESTE Query TotalOportunidadesCard:', `${supabaseUrl}/rest/v1/${testQuery}`);

    const testResponse = await fetch(`${supabaseUrl}/rest/v1/${testQuery}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('🧪 TESTE RESULTADO:', testData.length, 'registros (deveria bater com TotalOportunidadesCard)');
      console.log('📊 COMPARAÇÃO:');
      console.log('   MapaDeCalor (original):', rawData.length, 'registros');
      console.log('   TotalOportunidadesCard (teste):', testData.length, 'registros');
      console.log('   Diferença:', Math.abs(rawData.length - testData.length), 'registros');

      if (rawData.length !== testData.length) {
        console.log('❌ DIVERGÊNCIA encontrada! Queries não são idênticas.');
        console.log('🔍 MapaDeCalor query:', `${supabaseUrl}/rest/v1/oportunidade_sprint${queryString}`);
        console.log('🔍 TotalOportunidadesCard query:', `${supabaseUrl}/rest/v1/${testQuery}`);
      } else {
        console.log('✅ SUCESSO! Queries são idênticas.');
      }
    } else {
      console.log('❌ TESTE falhou:', testResponse.status);
    }

    // Processar dados no frontend usando create_date
    const processedData = processRawDataToHeatmap(rawData);
    console.log('🔥 Dados processados para heatmap:', processedData.length, 'células');
    console.log('📊 Amostra dados processados:', processedData.filter(d => d.total_leads > 0).slice(0, 5));

    return {
      heatmapData: processedData,
      rawData: rawData, // ADICIONAR: dados originais para cálculos corretos
      totalLeads: rawData.length
    };

  } catch (error) {
    console.error('❌ Erro no fallback:', error);
    return {
      heatmapData: [],
      totalLeads: 0
    };
  }
};

/**
 * Processar dados brutos para criar o heatmap
 * Usando create_date da tabela oportunidade_sprint
 */
const processRawDataToHeatmap = (rawData) => {
  console.log('🔄 Processando', rawData.length, 'registros para heatmap...');

  // TESTE: Contar leads por dia específico para comparar com seus números
  console.log('🧮 CONTAGEM POR DIA ESPECÍFICO:');
  const dailyCounts = {};

  rawData.forEach(item => {
    const date = new Date(item.create_date);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!dailyCounts[dateKey]) {
      dailyCounts[dateKey] = 0;
    }
    dailyCounts[dateKey]++;
  });

  Object.keys(dailyCounts).sort().forEach(date => {
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}/${month}`;
    console.log(`📅 ${formattedDate} (${date}): ${dailyCounts[date]} leads`);
  });

  console.log('🎯 Seus números corretos:');
  console.log('   22/09: deveria ser 203 leads');
  console.log('   17/09: deveria ser 317 leads');
  console.log('   18/09: deveria ser 248 leads');

  console.log('');
  console.log('📋 SQL PARA TESTAR NO BANCO:');
  console.log(`
-- TESTE 1: Contar leads por dia (período completo)
SELECT
  DATE(create_date) as data,
  COUNT(*) as total_leads
FROM oportunidade_sprint
WHERE archived = 0
  AND create_date >= '2025-09-17'
  AND create_date <= '2025-09-23 23:59:59'
  AND funil_id IN (6, 14)
  AND unidade_id = '[1]'
GROUP BY DATE(create_date)
ORDER BY data;

-- TESTE 2: Leads do dia 22/09 específico
SELECT COUNT(*) as leads_22_09
FROM oportunidade_sprint
WHERE archived = 0
  AND DATE(create_date) = '2025-09-22'
  AND funil_id IN (6, 14)
  AND unidade_id = '[1]';

-- TESTE 3: Verificar se existem registros na tabela
SELECT COUNT(*) as total_registros FROM oportunidade_sprint;

-- TESTE 4: Ver primeiros registros para debug
SELECT id, create_date, funil_id, unidade_id, archived
FROM oportunidade_sprint
WHERE create_date >= '2025-09-22'
  AND create_date < '2025-09-23'
LIMIT 10;
  `);
  console.log('');
  console.log('🔍 Execute esse SQL no seu banco e me diga os resultados!');

  const grouped = {};

  rawData.forEach((item, index) => {
    // Usar create_date em vez de data_criacao
    const date = new Date(item.create_date);
    const diaSemana = date.getDay() === 0 ? 7 : date.getDay(); // Domingo = 7, Segunda = 1
    const hora = date.getHours();

    if (index < 3) {
      console.log(`📅 Registro ${index}:`, {
        create_date: item.create_date,
        date: date,
        diaSemana,
        hora,
        isValidHour: hora >= 8 && hora <= 22
      });
    }

    // Apenas horários entre 8h e 22h
    if (hora >= 8 && hora <= 22) {
      const key = `${diaSemana}-${hora}`;
      if (!grouped[key]) {
        grouped[key] = {
          dia_semana: diaSemana,
          hora: hora,
          total_leads: 0
        };
      }
      grouped[key].total_leads++;
    }
  });

  console.log('📊 Agrupamentos encontrados:', Object.keys(grouped).length);
  return Object.values(grouped);
};

/**
 * Processar dados do heatmap para garantir completude
 * Apenas preenche com 0 onde não há dados reais
 */
const processHeatmapData = (data) => {
  const result = [];

  // Criar matriz completa de dias (1-7) x horas (8-22)
  // Apenas preencher com 0 onde não há dados reais
  for (let dia = 1; dia <= 7; dia++) {
    for (let hora = 8; hora <= 22; hora++) {
      const existing = data.find(item =>
        item.dia_semana === dia && item.hora === hora
      );

      result.push({
        dia_semana: dia,
        hora: hora,
        total_leads: existing ? existing.total_leads : 0
      });
    }
  }

  return result;
};

