/**
 * 🟣 TICKET MÉDIO SERVICE
 * 
 * Serviço específico para buscar as métricas de Ticket Médio:
 * 1. Ticket Médio do Período (valor total / quantidade total de oportunidades ganhas no período)
 * 2. Ticket Médio Geral (valor total / quantidade total de todas as oportunidades ganhas)
 */

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * 🟣 BUSCAR MÉTRICAS DE TICKET MÉDIO
 * 
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada (formato [1], [2], etc.)
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @returns {Object} Objeto com as métricas calculadas
 */
export const getTicketMedioMetrics = async (
  startDate = null, 
  endDate = null, 
  selectedFunnel = null, 
  selectedUnit = null, 
  selectedSeller = null, 
  selectedOrigin = null
) => {
  try {
    console.log('='.repeat(80));
    console.log('🟣 TicketMedioService: INICIANDO BUSCA DE MÉTRICAS');
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
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      dataInicio = hoje;
      dataFim = hoje;
      console.log('⚠️ TicketMedioService: Usando datas fallback (hoje):', { dataInicio, dataFim });
    } else {
      console.log('✅ TicketMedioService: Usando datas fornecidas:', { dataInicio, dataFim });
    }

    // Construir filtros baseados nos parâmetros
    let funilFilter = '';
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      funilFilter = `&funil_id=eq.${selectedFunnel}`;
      console.log('🔍 TicketMedioService: Filtro de funil específico aplicado:', funilFilter);
    } else {
      funilFilter = `&funil_id=in.(6,14)`;
      console.log('🔍 TicketMedioService: Filtro de funil incluindo ambos (6 e 14):', funilFilter);
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
      sellerFilter = `&user_id=eq.${selectedSeller}`;
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

    // 🟣 1. TICKET MÉDIO DO PERÍODO - gain_date no período + status="gain"
    const ticketMedioPeriodoUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}T23:59:59${filtrosCombinados}`;
    console.log('🔍 URL Ticket Médio do Período:', ticketMedioPeriodoUrl);

    // 🟣 2. TICKET MÉDIO GERAL - todas as oportunidades ganhas + status="gain"
    const ticketMedioGeralUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain${filtrosCombinados}`;
    console.log('🔍 URL Ticket Médio Geral:', ticketMedioGeralUrl);

    // 🎯 3. BUSCAR META DE TICKET MÉDIO - Tabela metas
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : '[1]';
    
    let metaTicketMedioUrl;
    
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      // Funil específico selecionado - buscar meta específica do funil
      metaTicketMedioUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}&dashboard=eq.ticketmedio_oportunidades&funil=eq.${selectedFunnel}`;
      console.log('🎯 Buscando meta específica do funil para ticket médio:', selectedFunnel);
    } else {
      // Apenas unidade selecionada - buscar AMBOS funis (6 e 14) e somar
      metaTicketMedioUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}&dashboard=eq.ticketmedio_oportunidades&funil=in.(6,14)`;
      console.log('🎯 Buscando metas de ambos funis (6 e 14) para somar - ticket médio');
    }
    
    console.log('🔍 URL Meta Ticket Médio:', metaTicketMedioUrl);

    // Executar todas as queries em paralelo
    const [periodoResponse, geralResponse, metaResponse] = await Promise.all([
      fetch(ticketMedioPeriodoUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }),
      fetch(ticketMedioGeralUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }),
      fetch(metaTicketMedioUrl, {
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
    let ticketMedioPeriodo = 0;
    let valorTotalPeriodo = 0;
    let quantidadePeriodo = 0;
    
    let ticketMedioGeral = 0;
    let valorTotalGeral = 0;
    let quantidadeGeral = 0;

    // 1. Ticket Médio do Período
    if (periodoResponse.ok) {
      const periodoData = await periodoResponse.json();
      quantidadePeriodo = periodoData.length;
      valorTotalPeriodo = periodoData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      
      ticketMedioPeriodo = quantidadePeriodo > 0 ? valorTotalPeriodo / quantidadePeriodo : 0;
      console.log(`✅ Ticket Médio do Período: R$ ${ticketMedioPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${quantidadePeriodo} oportunidades, R$ ${valorTotalPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar ticket médio do período:', periodoResponse.status);
    }

    // 2. Ticket Médio Geral
    if (geralResponse.ok) {
      const geralData = await geralResponse.json();
      quantidadeGeral = geralData.length;
      valorTotalGeral = geralData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      
      ticketMedioGeral = quantidadeGeral > 0 ? valorTotalGeral / quantidadeGeral : 0;
      console.log(`✅ Ticket Médio Geral: R$ ${ticketMedioGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${quantidadeGeral} oportunidades, R$ ${valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar ticket médio geral:', geralResponse.status);
    }

    // 3. Meta de Ticket Médio
    let metaTicketMedio = 0;
    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      if (metaData && metaData.length > 0) {
        if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS') {
          // Funil específico - usar valor único
          metaTicketMedio = parseFloat(metaData[0].valor_da_meta) || 0;
          console.log(`✅ Meta Ticket Médio (funil ${selectedFunnel}): R$ ${metaTicketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        } else {
          // Unidade selecionada (ambos funis) - calcular MÉDIA das metas dos funis 6 e 14
          const somaMetas = metaData.reduce((total, meta) => {
            const valor = parseFloat(meta.valor_da_meta) || 0;
            return total + valor;
          }, 0);
          const quantidadeFunils = metaData.length;
          metaTicketMedio = quantidadeFunils > 0 ? somaMetas / quantidadeFunils : 0;
          console.log(`✅ Meta Ticket Médio (média dos funis 6+14): R$ ${metaTicketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          console.log(`🔍 Detalhes: Soma=${somaMetas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Qtd=${quantidadeFunils}, Média=${metaTicketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          console.log(`🔍 Metas encontradas:`, metaData.map(m => ({ valor: m.valor_da_meta })));
        }
      } else {
        console.log('⚠️ Nenhuma meta encontrada para ticket médio, usando valor padrão');
        metaTicketMedio = 0; // Valor padrão
      }
    } else {
      console.error('❌ Erro ao buscar meta de ticket médio:', metaResponse.status);
      metaTicketMedio = 0; // Valor padrão em caso de erro
    }

    // 🎯 DADOS ANTERIORES - Buscar dados do período anterior para comparação
    console.log('📊 Buscando dados do período anterior para comparação...');
    const dadosAnteriores = await getTicketMedioAnteriores(dataInicio, dataFim, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin);

    // 🎯 CALCULAR PERCENTUAL DA META (ticket médio do período vs meta em R$)
    const percentualMeta = metaTicketMedio > 0 ? 
      ((ticketMedioPeriodo - metaTicketMedio) / metaTicketMedio) * 100 : 0;
    
    console.log(`📊 Cálculo do percentual da meta:`);
    console.log(`   - Ticket Médio do Período: R$ ${ticketMedioPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`   - Meta: R$ ${metaTicketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`   - Percentual: ${percentualMeta.toFixed(2)}%`);

    // 🎯 FORMATAR DADOS PARA O COMPONENTE
    const metrics = {
      ticketMedioPeriodo: {
        current: Math.round(ticketMedioPeriodo), // Número principal: ticket médio do período
        previous: dadosAnteriores.ticketMedioPeriodo,
        value: ticketMedioPeriodo, // Valor decimal para cálculos
        meta: metaTicketMedio, // Meta real da tabela metas
        metaPercentage: percentualMeta, // Percentual calculado: (ticket médio - meta) / meta * 100
        change: dadosAnteriores.ticketMedioPeriodo > 0 ? 
          ((ticketMedioPeriodo - dadosAnteriores.ticketMedioPeriodo) / dadosAnteriores.ticketMedioPeriodo) * 100 : 0,
        isPositive: ticketMedioPeriodo >= dadosAnteriores.ticketMedioPeriodo // Para ticket médio, mais é melhor
      },
      ticketMedioGeral: {
        current: Math.round(ticketMedioGeral), // Número principal: ticket médio geral
        previous: dadosAnteriores.ticketMedioGeral,
        value: ticketMedioGeral, // Valor decimal para cálculos
        meta: metaTicketMedio, // Meta real da tabela metas
        metaPercentage: percentualMeta, // Percentual calculado: (ticket médio - meta) / meta * 100
        change: dadosAnteriores.ticketMedioGeral > 0 ? 
          ((ticketMedioGeral - dadosAnteriores.ticketMedioGeral) / dadosAnteriores.ticketMedioGeral) * 100 : 0,
        isPositive: ticketMedioGeral >= dadosAnteriores.ticketMedioGeral // Para ticket médio, mais é melhor
      }
    };

    console.log('✅ TicketMedioService: Métricas calculadas:', metrics);
    return metrics;

  } catch (error) {
    console.error('❌ Erro no TicketMedioService:', error);
    throw error;
  }
};

/**
 * 🟣 BUSCAR DADOS DO PERÍODO ANTERIOR (para comparação)
 */
const getTicketMedioAnteriores = async (dataInicio, dataFim, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin) => {
  try {
    // Calcular período anterior
    const startDate = new Date(dataInicio);
    const endDate = new Date(dataFim);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const startAnterior = new Date(startDate);
    startAnterior.setDate(startAnterior.getDate() - diffDays - 1);
    
    const endAnterior = new Date(endDate);
    endAnterior.setDate(endAnterior.getDate() - diffDays - 1);
    
    const dataInicioAnterior = startAnterior.toISOString().split('T')[0];
    const dataFimAnterior = endAnterior.toISOString().split('T')[0];
    
    console.log('📅 Período anterior - ticket médio:', { dataInicioAnterior, dataFimAnterior });

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
            } else {
              originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar origem no período anterior:', error);
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
      }
    }

    const filtrosCombinados = funilFilter + unidadeFilter + sellerFilter + originFilter;

    // URLs para período anterior
    const ticketMedioPeriodoAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicioAnterior}&gain_date=lte.${dataFimAnterior}T23:59:59${filtrosCombinados}`;
    const ticketMedioGeralAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain${filtrosCombinados}`;

    // Executar queries
    const [periodoAnteriorResponse, geralAnteriorResponse] = await Promise.all([
      fetch(ticketMedioPeriodoAnteriorUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }),
      fetch(ticketMedioGeralAnteriorUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      })
    ]);

    let ticketMedioPeriodoAnterior = 0;
    let ticketMedioGeralAnterior = 0;

    // Processar ticket médio do período anterior
    if (periodoAnteriorResponse.ok) {
      const periodoAnteriorData = await periodoAnteriorResponse.json();
      const quantidadeAnterior = periodoAnteriorData.length;
      const valorTotalAnterior = periodoAnteriorData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      
      ticketMedioPeriodoAnterior = quantidadeAnterior > 0 ? valorTotalAnterior / quantidadeAnterior : 0;
    }

    // Processar ticket médio geral anterior
    if (geralAnteriorResponse.ok) {
      const geralAnteriorData = await geralAnteriorResponse.json();
      const quantidadeGeralAnterior = geralAnteriorData.length;
      const valorTotalGeralAnterior = geralAnteriorData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      
      ticketMedioGeralAnterior = quantidadeGeralAnterior > 0 ? valorTotalGeralAnterior / quantidadeGeralAnterior : 0;
    }

    return {
      ticketMedioPeriodo: Math.round(ticketMedioPeriodoAnterior),
      ticketMedioGeral: Math.round(ticketMedioGeralAnterior)
    };

  } catch (error) {
    console.error('❌ Erro ao buscar dados anteriores do ticket médio:', error);
    return {
      ticketMedioPeriodo: 0,
      ticketMedioGeral: 0
    };
  }
};
