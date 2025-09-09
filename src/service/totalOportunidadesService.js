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
      console.log('🔍 TotalOportunidadesService: Filtro de funil aplicado:', funilFilter);
      console.log('🔍 TotalOportunidadesService: selectedFunnel valor:', selectedFunnel, 'tipo:', typeof selectedFunnel);
    } else {
      console.log('🔍 TotalOportunidadesService: Sem filtro de funil (selectedFunnel:', selectedFunnel, ')');
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
      // 🔍 CORREÇÃO: selectedOrigin é o ID da origem, mas precisamos do nome
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
    console.log('🔍 Filtros combinados para abertas:', filtrosCombinados);

    // 🎯 2. TOTAL DE OPORTUNIDADES NOVAS - Todos os status, COM filtro de data
    const totalOportunidadesNovasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}T23:59:59${filtrosCombinados}`;
    console.log('🔍 URL Total Oportunidades Novas (período):', totalOportunidadesNovasUrl);
    console.log('🔍 Filtros combinados para novas:', filtrosCombinados);

    // 🎯 3. BUSCAR META DE OPORTUNIDADES NOVAS - Tabela metas
    // Usar selectedUnit ou fallback para [1] se não especificado
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : '[1]';
    
    let metaOportunidadesNovasUrl;
    
    // 🎯 LÓGICA DE META BASEADA NA SELEÇÃO
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      // Funil específico selecionado - buscar meta específica do funil
      metaOportunidadesNovasUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}&dashboard=eq.novas_oportunidades&funil=eq.${selectedFunnel}`;
      console.log('🎯 Buscando meta específica do funil:', selectedFunnel);
    } else {
      // Apenas unidade selecionada - buscar AMBOS funis (6 e 14) e somar
      metaOportunidadesNovasUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}&dashboard=eq.novas_oportunidades&funil=in.(6,14)`;
      console.log('🎯 Buscando metas de ambos funis (6 e 14) para somar');
    }
    
    console.log('🔍 URL Meta Oportunidades Novas:', metaOportunidadesNovasUrl);
    console.log('🔍 Filtros da meta - Unidade:', unidadeParaMeta, 'Funil:', selectedFunnel || 'ambos (6+14)');

    // Executar todas as queries em paralelo
    const [abertasResponse, novasResponse, metaResponse] = await Promise.all([
      fetch(totalOportunidadesAbertasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }),
      fetch(totalOportunidadesNovasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }),
      fetch(metaOportunidadesNovasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
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
        if (selectedFunnel && selectedFunnel !== 'all') {
          // Funil específico - usar valor único
          metaOportunidadesNovas = parseFloat(metaData[0].valor_da_meta) || 0;
          console.log(`✅ Meta Oportunidades Novas (funil ${selectedFunnel}): ${metaOportunidadesNovas}`);
        } else {
          // Unidade selecionada (ambos funis) - somar as metas dos funis 6 e 14
          metaOportunidadesNovas = metaData.reduce((total, meta) => {
            const valor = parseFloat(meta.valor_da_meta) || 0;
            return total + valor;
          }, 0);
          console.log(`✅ Meta Oportunidades Novas (soma funis 6+14): ${metaOportunidadesNovas}`);
          console.log(`🔍 Detalhes das metas encontradas:`, metaData.map(m => ({ valor: m.valor_da_meta })));
        }
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
    // 🔍 CORREÇÃO: Converter ID da origem para nome (mesma lógica da função principal)
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
            
            // 🌱 LÓGICA PARA ORIGEM "ORGÂNICO": incluir também registros com origem_oportunidade=null
            if (originName.toLowerCase() === 'orgânico' || originName.toLowerCase() === 'organico') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent(originName)},origem_oportunidade.is.null)`;
              console.log('🌱 Filtro de origem Orgânico para período anterior (incluindo NULL):', originName);
            } else {
              originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar origem para período anterior:', error);
      }
    }
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
        }
      }),
      fetch(totalNovasAnteriorUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
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

/**
 * 🎯 FUNÇÃO PARA TESTAR FUNIL ESPECÍFICO COM UNIDADE
 */
export const testFunilSpecificWithUnit = async (funilId, unidadeId) => {
  try {
    console.log(`🔍 Testando funil ${funilId} com unidade ${unidadeId}...`);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';
    
    // Testar sem filtros
    const urlSemFiltros = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,funil_id,unidade_id,status&archived=eq.0&status=eq.open`;
    console.log('🔍 URL sem filtros:', urlSemFiltros);
    
    const responseSemFiltros = await fetch(urlSemFiltros, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    });
    
    if (responseSemFiltros.ok) {
      const dataSemFiltros = await responseSemFiltros.json();
      console.log(`✅ Total de oportunidades abertas (sem filtro): ${dataSemFiltros.length}`);
      
      // Filtrar por funil_id
      const oportunidadesFunil = dataSemFiltros.filter(opp => opp.funil_id == funilId);
      console.log(`✅ Oportunidades do funil ${funilId}: ${oportunidadesFunil.length}`);
      
      // Filtrar por funil_id E unidade_id
      const oportunidadesFunilUnidade = dataSemFiltros.filter(opp => 
        opp.funil_id == funilId && opp.unidade_id === unidadeId
      );
      console.log(`✅ Oportunidades do funil ${funilId} na unidade ${unidadeId}: ${oportunidadesFunilUnidade.length}`);
      
      // Mostrar algumas amostras
      if (oportunidadesFunilUnidade.length > 0) {
        console.log('📋 Amostras de oportunidades do funil na unidade:', oportunidadesFunilUnidade.slice(0, 3));
      } else {
        console.log('📋 Verificando distribuição por unidade:');
        const distribuicaoUnidades = {};
        oportunidadesFunil.forEach(opp => {
          const unidade = opp.unidade_id || 'null';
          distribuicaoUnidades[unidade] = (distribuicaoUnidades[unidade] || 0) + 1;
        });
        console.log('📊 Distribuição por unidade:', distribuicaoUnidades);
      }
      
      // Testar com filtro direto
      const unidadeEncoded = encodeURIComponent(unidadeId);
      const urlComFiltro = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,funil_id,unidade_id,status&archived=eq.0&status=eq.open&funil_id=eq.${funilId}&unidade_id=eq.${unidadeEncoded}`;
      console.log('🔍 URL com filtro direto:', urlComFiltro);
      
      const responseComFiltro = await fetch(urlComFiltro, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      });
      
      if (responseComFiltro.ok) {
        const dataComFiltro = await responseComFiltro.json();
        console.log(`✅ Oportunidades com filtro direto: ${dataComFiltro.length}`);
      } else {
        console.error('❌ Erro na query com filtro direto:', responseComFiltro.status);
      }
      
      return {
        success: true,
        totalSemFiltro: dataSemFiltros.length,
        totalFunil: oportunidadesFunil.length,
        totalFunilUnidade: oportunidadesFunilUnidade.length,
        funilId: funilId,
        unidadeId: unidadeId
      };
    } else {
      console.error('❌ Erro na query sem filtros:', responseSemFiltros.status);
      return { success: false, error: `HTTP ${responseSemFiltros.status}` };
    }
    
  } catch (error) {
    console.error('❌ Erro no teste do funil com unidade:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 🎯 FUNÇÃO PARA TESTAR FUNIL ESPECÍFICO
 */
export const testFunilSpecific = async (funilId) => {
  try {
    console.log(`🔍 Testando funil específico: ${funilId}`);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';
    
    // Testar sem filtros
    const urlSemFiltros = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,funil_id,status&archived=eq.0&status=eq.open`;
    console.log('🔍 URL sem filtros:', urlSemFiltros);
    
    const responseSemFiltros = await fetch(urlSemFiltros, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    });
    
    if (responseSemFiltros.ok) {
      const dataSemFiltros = await responseSemFiltros.json();
      console.log(`✅ Total de oportunidades abertas (sem filtro): ${dataSemFiltros.length}`);
      
      // Filtrar por funil_id
      const oportunidadesFunil = dataSemFiltros.filter(opp => opp.funil_id == funilId);
      console.log(`✅ Oportunidades do funil ${funilId}: ${oportunidadesFunil.length}`);
      
      // Mostrar algumas amostras
      if (oportunidadesFunil.length > 0) {
        console.log('📋 Amostras de oportunidades do funil:', oportunidadesFunil.slice(0, 3));
      }
      
      // Testar com filtro direto
      const urlComFiltro = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,funil_id,status&archived=eq.0&status=eq.open&funil_id=eq.${funilId}`;
      console.log('🔍 URL com filtro direto:', urlComFiltro);
      
      const responseComFiltro = await fetch(urlComFiltro, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      });
      
      if (responseComFiltro.ok) {
        const dataComFiltro = await responseComFiltro.json();
        console.log(`✅ Oportunidades com filtro direto: ${dataComFiltro.length}`);
      } else {
        console.error('❌ Erro na query com filtro direto:', responseComFiltro.status);
      }
      
      return {
        success: true,
        totalSemFiltro: dataSemFiltros.length,
        totalFunil: oportunidadesFunil.length,
        funilId: funilId
      };
    } else {
      console.error('❌ Erro na query sem filtros:', responseSemFiltros.status);
      return { success: false, error: `HTTP ${responseSemFiltros.status}` };
    }
    
  } catch (error) {
    console.error('❌ Erro no teste do funil:', error);
    return { success: false, error: error.message };
  }
};

