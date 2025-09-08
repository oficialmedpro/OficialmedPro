/**
 * 🎯 TOTAL OPORTUNIDADES SERVICE
 * 
 * Serviço específico para buscar as duas métricas de Total de Oportunidades:
 * 1. Total de Oportunidades Abertas (status="open", sem filtro de data)
 * 2. Total de Oportunidades Novas (todos status, com filtro de data)
 */

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * 🎯 BUSCAR MÉTRICAS DE TOTAL DE OPORTUNIDADES
 * 
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada (formato [1], [2], etc.)
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @returns {Object} Objeto com as métricas calculadas
 */
export const getTotalOportunidadesMetrics = async (
  startDate = null, 
  endDate = null, 
  selectedFunnel = null, 
  selectedUnit = null, 
  selectedSeller = null, 
  selectedOrigin = null
) => {
  try {
    console.log('='.repeat(80));
    console.log('🎯 TotalOportunidadesService: INICIANDO BUSCA DE MÉTRICAS');
    console.log('📅 Parâmetros recebidos:');
    console.log('  - startDate:', startDate, typeof startDate);
    console.log('  - endDate:', endDate, typeof endDate);
    console.log('  - selectedFunnel:', selectedFunnel, typeof selectedFunnel);
    console.log('  - selectedUnit:', selectedUnit, typeof selectedUnit);
    console.log('  - selectedSeller:', selectedSeller, typeof selectedSeller);
    console.log('  - selectedOrigin:', selectedOrigin, typeof selectedOrigin);
    console.log('='.repeat(80));

    // Fallback para datas se não estiverem definidas
    let dataInicio = startDate;
    let dataFim = endDate;
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      const hoje = new Date().toISOString().split('T')[0];
      dataInicio = hoje;
      dataFim = hoje;
      console.log('⚠️ TotalOportunidadesService: Usando datas fallback (hoje):', { dataInicio, dataFim });
    } else {
      console.log('✅ TotalOportunidadesService: Usando datas fornecidas:', { dataInicio, dataFim });
    }

    // Construir filtros baseados nos parâmetros
    let funilFilter = '';
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      funilFilter = `&funil_id=eq.${selectedFunnel}`;
    }
    
    let unidadeFilter = '';
    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      // O FilterBar passa o valor como "[1]", que é o formato correto na tabela
      // Precisamos codificar os colchetes para URL: [1] -> %5B1%5D
      const unidadeValue = selectedUnit.toString();
      const unidadeEncoded = encodeURIComponent(unidadeValue);
      
      unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
      console.log('🔍 Filtro unidade com colchetes codificados:', unidadeFilter);
      console.log('🔍 Valor original:', unidadeValue, '-> Codificado:', unidadeEncoded);
    }
    
    let sellerFilter = '';
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      sellerFilter = `&user_id=eq.${selectedSeller}`;
    }

    let originFilter = '';
    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== '' && selectedOrigin !== 'undefined') {
      originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
    }

    const filtrosCombinados = funilFilter + unidadeFilter + sellerFilter + originFilter;

    console.log('🔍 Filtros construídos:');
    console.log('  - funilFilter:', funilFilter);
    console.log('  - unidadeFilter:', unidadeFilter);
    console.log('  - sellerFilter:', sellerFilter);
    console.log('  - originFilter:', originFilter);
    console.log('  - filtrosCombinados:', filtrosCombinados);

    // 🎯 1. TOTAL DE OPORTUNIDADES ABERTAS - Apenas status="open", SEM filtro de data
    const totalOportunidadesAbertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open${filtrosCombinados}`;
    console.log('🔍 URL Total Oportunidades Abertas (sem data):', totalOportunidadesAbertasUrl);

    // 🎯 2. TOTAL DE OPORTUNIDADES NOVAS - Todos os status, COM filtro de data
    const totalOportunidadesNovasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}T23:59:59${filtrosCombinados}`;
    console.log('🔍 URL Total Oportunidades Novas (período):', totalOportunidadesNovasUrl);

    // 🎯 3. BUSCAR META DE OPORTUNIDADES NOVAS - Tabela metas
    const metaOportunidadesNovasUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent('[1]')}&dashboard=eq.novas_oportunidades`;
    console.log('🔍 URL Meta Oportunidades Novas:', metaOportunidadesNovasUrl);

    // Executar todas as queries em paralelo
    const [abertasResponse, novasResponse, metaResponse] = await Promise.all([
      fetch(totalOportunidadesAbertasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(totalOportunidadesNovasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(metaOportunidadesNovasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      })
    ]);

    // Processar resultados
    let totalOportunidadesAbertas = 0;
    let valorTotalOportunidadesAbertas = 0;
    let totalOportunidadesNovas = 0;
    let valorTotalOportunidadesNovas = 0;
    let metaOportunidadesNovas = 0;

    // 1. Total de Oportunidades Abertas (sem filtro de data)
    if (abertasResponse.ok) {
      const abertasData = await abertasResponse.json();
      totalOportunidadesAbertas = abertasData.length;
      valorTotalOportunidadesAbertas = abertasData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      console.log(`✅ Total Oportunidades Abertas (sem data): ${totalOportunidadesAbertas} (R$ ${valorTotalOportunidadesAbertas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar total de oportunidades abertas:', abertasResponse.status);
    }

    // 2. Total de Oportunidades Novas (com filtro de data)
    if (novasResponse.ok) {
      const novasData = await novasResponse.json();
      totalOportunidadesNovas = novasData.length;
      valorTotalOportunidadesNovas = novasData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      console.log(`✅ Total Oportunidades Novas (período ${dataInicio} a ${dataFim}): ${totalOportunidadesNovas} (R$ ${valorTotalOportunidadesNovas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar total de oportunidades novas:', novasResponse.status);
    }

    // 3. Meta de Oportunidades Novas
    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      if (metaData && metaData.length > 0) {
        metaOportunidadesNovas = parseFloat(metaData[0].valor_da_meta) || 0;
        console.log(`✅ Meta Oportunidades Novas: ${metaOportunidadesNovas}`);
      } else {
        console.log('⚠️ Nenhuma meta encontrada para oportunidades novas, usando valor padrão');
        metaOportunidadesNovas = 100; // Valor padrão
      }
    } else {
      console.error('❌ Erro ao buscar meta de oportunidades novas:', metaResponse.status);
      metaOportunidadesNovas = 100; // Valor padrão em caso de erro
    }

    // 🎯 DADOS ANTERIORES - Buscar dados do período anterior para comparação
    console.log('📊 Buscando dados do período anterior para comparação...');
    const dadosAnteriores = await getTotalOportunidadesAnteriores(dataInicio, dataFim, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin);

    // 🎯 CALCULAR PERCENTUAL DA META (novas oportunidades vs meta)
    const percentualMeta = metaOportunidadesNovas > 0 ? 
      ((totalOportunidadesNovas - metaOportunidadesNovas) / metaOportunidadesNovas) * 100 : 0;
    
    console.log(`📊 Cálculo do percentual da meta:`);
    console.log(`   - Oportunidades Novas: ${totalOportunidadesNovas}`);
    console.log(`   - Meta: ${metaOportunidadesNovas}`);
    console.log(`   - Percentual: ${percentualMeta.toFixed(2)}%`);

    // 🎯 FORMATAR DADOS PARA O COMPONENTE
    const metrics = {
      totalOportunidadesAbertas: {
        current: totalOportunidadesAbertas, // Número principal: oportunidades abertas (sem data)
        previous: dadosAnteriores.totalOportunidadesAbertas,
        value: valorTotalOportunidadesAbertas, // Valor embaixo: soma das oportunidades abertas
        meta: Math.max(50, Math.round(totalOportunidadesAbertas * 1.2)), // Meta dinâmica
        change: dadosAnteriores.totalOportunidadesAbertas > 0 ? 
          ((totalOportunidadesAbertas - dadosAnteriores.totalOportunidadesAbertas) / dadosAnteriores.totalOportunidadesAbertas) * 100 : 0,
        isPositive: totalOportunidadesAbertas >= dadosAnteriores.totalOportunidadesAbertas
      },
      totalOportunidadesNovas: {
        current: totalOportunidadesNovas, // Número principal: oportunidades criadas no período
        previous: dadosAnteriores.totalOportunidadesNovas,
        value: valorTotalOportunidadesNovas, // Valor embaixo: soma das oportunidades novas
        meta: metaOportunidadesNovas, // Meta real da tabela metas
        metaPercentage: percentualMeta, // Percentual calculado: (novas - meta) / meta * 100
        change: dadosAnteriores.totalOportunidadesNovas > 0 ? 
          ((totalOportunidadesNovas - dadosAnteriores.totalOportunidadesNovas) / dadosAnteriores.totalOportunidadesNovas) * 100 : 0,
        isPositive: totalOportunidadesNovas >= dadosAnteriores.totalOportunidadesNovas
      }
    };

    console.log('✅ TotalOportunidadesService: Métricas calculadas:', metrics);
    return metrics;

  } catch (error) {
    console.error('❌ Erro no TotalOportunidadesService:', error);
    throw error;
  }
};

/**
 * 🎯 BUSCAR DADOS DO PERÍODO ANTERIOR (para comparação)
 */
const getTotalOportunidadesAnteriores = async (startDate, endDate, selectedFunnel = null, selectedUnit = null, selectedSeller = null, selectedOrigin = null) => {
  try {
    console.log('📊 Buscando dados do período anterior...');
    
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
    
    console.log('📅 Período anterior:', { dataInicioAnterior, dataFimAnterior });

    // Construir filtros
    const funilFilter = selectedFunnel && selectedFunnel !== 'all' ? `&funil_id=eq.${selectedFunnel}` : '';
    const unidadeFilter = selectedUnit && selectedUnit !== 'all' ? `&unidade_id=eq.${encodeURIComponent(selectedUnit.toString())}` : '';
    const sellerFilter = selectedSeller && selectedSeller !== 'all' ? `&user_id=eq.${selectedSeller}` : '';
    const originFilter = selectedOrigin && selectedOrigin !== 'all' ? `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}` : '';
    const filtrosCombinados = funilFilter + unidadeFilter + sellerFilter + originFilter;

    // 🎯 BUSCAR DADOS ESPECÍFICOS DO PERÍODO ANTERIOR
    const totalAbertasAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open${filtrosCombinados}`;
    const totalNovasAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&create_date=gte.${dataInicioAnterior}&create_date=lte.${dataFimAnterior}T23:59:59${filtrosCombinados}`;
    
    // Executar queries em paralelo
    const [totalAbertasResponse, totalNovasResponse] = await Promise.all([
      fetch(totalAbertasAnteriorUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(totalNovasAnteriorUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      })
    ]);

    if (totalAbertasResponse.ok && totalNovasResponse.ok) {
      const totalAbertasData = await totalAbertasResponse.json();
      const totalNovasData = await totalNovasResponse.json();
      
      return {
        totalOportunidadesAbertas: totalAbertasData.length, // 🎯 DADO REAL com status=open (sem data)
        totalOportunidadesNovas: totalNovasData.length // 🎯 DADO REAL com create_date do período anterior
      };
    }

    // Fallback se não conseguir buscar dados anteriores
    return {
      totalOportunidadesAbertas: 0,
      totalOportunidadesNovas: 0
    };

  } catch (error) {
    console.error('❌ Erro ao buscar dados anteriores:', error);
    // Fallback
    return {
      totalOportunidadesAbertas: 0,
      totalOportunidadesNovas: 0
    };
  }
};

/**
 * 🎯 FUNÇÃO PARA TESTAR CONEXÃO DO TOTAL OPORTUNIDADES SERVICE
 */
export const testTotalOportunidadesConnection = async () => {
  try {
    console.log('🔌 TotalOportunidadesService: Testando conexão...');
    
    const metrics = await getTotalOportunidadesMetrics();
    console.log('✅ TotalOportunidadesService: Conexão bem-sucedida!', metrics);
    
    return { success: true, data: metrics };
  } catch (error) {
    console.error('❌ TotalOportunidadesService: Erro na conexão:', error);
    return { success: false, error: error.message };
  }
};

