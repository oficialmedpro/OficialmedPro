import { supabase } from './supabase';

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * 🎯 FUNÇÃO PARA BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO RECURSIVA
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

  console.log('📄 RFV: Iniciando paginação para URL:', url);

  while (hasMore) {
    // Construir URL com offset e limit nativos do Supabase
    const separator = url.includes('?') ? '&' : '?';
    const paginatedUrl = `${url}${separator}offset=${offset}&limit=${pageSize}`;
    
    console.log(`📄 RFV: Buscando página ${Math.floor(offset / pageSize) + 1} - URL:`, paginatedUrl);

    try {
      const response = await fetch(paginatedUrl, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        console.error(`❌ RFV: Erro na página ${Math.floor(offset / pageSize) + 1}:`, response.status);
        console.error(`❌ RFV: Response text:`, await response.text());
        break;
      }

      const pageData = await response.json();
      allRecords = allRecords.concat(pageData);

      console.log(`📄 RFV: Página ${Math.floor(offset / pageSize) + 1}: ${pageData.length} registros | Total: ${allRecords.length}`);

      // Se retornou menos que o tamanho da página, não há mais dados
      if (pageData.length < pageSize) {
        hasMore = false;
        console.log(`📄 RFV: Última página atingida (${pageData.length} < ${pageSize})`);
      } else {
        offset += pageSize;
      }

      // Verificar Content-Range header para confirmar se há mais dados
      const contentRange = response.headers.get('Content-Range');
      if (contentRange) {
        console.log(`📄 RFV: Content-Range header:`, contentRange);
        const match = contentRange.match(/(\d+)-(\d+)\/(\d+|\*)/);
        if (match) {
          const [, start, end, total] = match;
          console.log(`📄 RFV: Range: ${start}-${end}/${total}`);
          if (total !== '*' && parseInt(end) >= parseInt(total) - 1) {
            hasMore = false;
            console.log(`📄 RFV: Fim dos dados detectado pelo Content-Range`);
          }
        }
      }

    } catch (error) {
      console.error(`❌ RFV: Erro ao buscar página ${Math.floor(offset / pageSize) + 1}:`, error);
      break;
    }
  }

  console.log(`✅ RFV: Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
};

// Flag global para evitar múltiplas chamadas simultâneas
let isProcessing = false;

// Service NOVO para RFV usando o mesmo padrão do OportunidadesGanhasCard/thermometerService (REST PostgREST)
export const rfvRealService = {
  async getRFVAnalysis({ startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin } = {}) {
    // Evitar múltiplas chamadas simultâneas
    if (isProcessing) {
      console.log('🚫 rfvRealService: Chamada bloqueada - já processando');
      return null;
    }
    
    isProcessing = true;
    console.log('🔒 rfvRealService: BLOQUEIO ATIVADO - processando...');
    
    try {
      console.log('🔍 rfvRealService: Iniciando análise RFV com dados reais...');
      console.log('🔍 rfvRealService: Filtros recebidos:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
      console.log('🔍 rfvRealService: Stack trace:', new Error().stack?.split('\n').slice(1, 4).join('\n'));
      console.log('🔍 rfvRealService: TIMESTAMP:', new Date().toISOString());

      // 🔧 CORREÇÃO: Aplicar filtros exatos que a interface usa + campos do lead
      let queryParams = `select=id,value,user_id,lead_id,create_date,gain_date,status,lead_firstname,lead_lastname,lead_whatsapp&archived=eq.0&status=eq.gain`;

      // Aplicar filtro de data para análise RFV (mesma lógica dos cartões)
      if (startDate && endDate) {
        const dataInicio = startDate + 'T00:00:00';
        const dataFim = endDate + 'T23:59:59';
        queryParams += `&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}`;
        console.log('📅 RFV: Filtro de data aplicado para treemap:', dataInicio, 'até', dataFim);
      } else {
        console.log('📅 RFV: Sem filtro de data - buscando base histórica completa');
      }

      let filtrosCombinados = '';
      
      // 🔧 FILTRO FIXO: Funil 6 e 14 (identificado via SQL)
      filtrosCombinados += `&funil_id=in.(6,14)`;
      
      // 🔧 FILTRO FIXO: Unidade não nula e não vazia
      filtrosCombinados += `&unidade_id=not.is.null&unidade_id=neq.`;
      
      // 🔧 FILTRO FIXO: Vendedor não nulo e maior que zero
      filtrosCombinados += `&user_id=not.is.null&user_id=gt.0`;

      // Aplicar filtros adicionais se especificados
      if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '6,14') {
        filtrosCombinados += `&funil_id=eq.${selectedFunnel}`;
      }

      if (selectedUnit && selectedUnit !== 'all') {
        filtrosCombinados += `&unidade_id=eq.${selectedUnit}`;
      }

      if (selectedSeller && selectedSeller !== 'all') {
        filtrosCombinados += `&user_id=eq.${selectedSeller}`;
      }

      const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?${queryParams}${filtrosCombinados}`;
      console.log('🔗 URL da consulta:', url);

      const baseHeaders = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Prefer': 'count=exact'
      };

      // Usar paginação para buscar TODOS os registros
      console.log('🔄 RFV Treemap: Iniciando busca de oportunidades...');
      const oportunidades = await fetchAllRecords(url, baseHeaders);
      console.log('📊 RFV Treemap: Oportunidades encontradas:', oportunidades.length);
      console.log('📊 RFV Treemap: Primeiras 3 oportunidades:', oportunidades.slice(0, 3));
      
      if (oportunidades.length === 0) {
        console.warn('⚠️ RFV Treemap: Nenhuma oportunidade encontrada!');
        throw new Error('Nenhuma oportunidade encontrada para análise RFV');
      }

      // Calcular métricas RFV simples
      const clientesMap = new Map();
      let totalFaturamento = 0;
      let totalOportunidades = oportunidades.length;

      oportunidades.forEach((op, index) => {
        // Usar lead_id como identificador único do cliente, não user_id (que é o vendedor)
        const leadId = op.lead_id || op.id || `cliente_${index}`;
        const valor = parseFloat(op.value) || 0;
        const dataStr = op.gain_date || op.create_date;
        const data = dataStr ? new Date(dataStr) : null;

        totalFaturamento += valor;

        if (!clientesMap.has(leadId)) {
          clientesMap.set(leadId, { 
            lead_id: leadId, 
            totalValor: 0, 
            frequencia: 0, 
            ultimaCompra: null,
            nome: op.lead_firstname || '',
            sobrenome: op.lead_lastname || '',
            whatsapp: op.lead_whatsapp || ''
          });
        }
        const c = clientesMap.get(leadId);
        c.totalValor += valor;
        c.frequencia += 1;
        if (data && (!c.ultimaCompra || data > c.ultimaCompra)) {
          c.ultimaCompra = data;
          // Atualizar dados do lead com a oportunidade mais recente
          c.nome = op.lead_firstname || c.nome;
          c.sobrenome = op.lead_lastname || c.sobrenome;
          c.whatsapp = op.lead_whatsapp || c.whatsapp;
        }
      });

      const hoje = new Date();
      const clientesBasicos = Array.from(clientesMap.values()).map(c => {
        const recencia = c.ultimaCompra ? Math.floor((hoje - c.ultimaCompra) / (1000 * 60 * 60 * 24)) : 999;
        return { ...c, recencia };
      });

      // Agora calcular scores RFV para todos os clientes
      const clientes = clientesBasicos.map(c => {
        const rfvScores = this.calcularRFVScores(c.recencia, c.frequencia, c.totalValor, clientesBasicos);
        const segmento = this.classificarSegmento(rfvScores);
        return { ...c, ...rfvScores, segmento };
      });

      console.log('👥 Total de clientes únicos:', clientes.length);
      console.log('💰 Faturamento total:', totalFaturamento);
      console.log('📊 Distribuição por segmento:', clientes.reduce((acc, c) => {
        acc[c.segmento] = (acc[c.segmento] || 0) + 1;
        return acc;
      }, {}));

      // Montar distribuição para os gráficos de barras
      const distributionData = {
        recencia: [
          { score: 1, count: clientes.filter(c => c.r === 1).length, label: 'R1' },
          { score: 2, count: clientes.filter(c => c.r === 2).length, label: 'R2' },
          { score: 3, count: clientes.filter(c => c.r === 3).length, label: 'R3' },
          { score: 4, count: clientes.filter(c => c.r === 4).length, label: 'R4' },
          { score: 5, count: clientes.filter(c => c.r === 5).length, label: 'R5' }
        ],
        frequencia: [
          { score: 1, count: clientes.filter(c => c.f === 1).length, label: 'F1' },
          { score: 2, count: clientes.filter(c => c.f === 2).length, label: 'F2' },
          { score: 3, count: clientes.filter(c => c.f === 3).length, label: 'F3' },
          { score: 4, count: clientes.filter(c => c.f === 4).length, label: 'F4' },
          { score: 5, count: clientes.filter(c => c.f === 5).length, label: 'F5' }
        ],
        valor: [
          { 
            score: 1, 
            count: clientes.filter(c => c.v === 1).length, 
            label: 'V1',
            valorTotal: clientes.filter(c => c.v === 1).reduce((sum, c) => sum + c.totalValor, 0)
          },
          { 
            score: 2, 
            count: clientes.filter(c => c.v === 2).length, 
            label: 'V2',
            valorTotal: clientes.filter(c => c.v === 2).reduce((sum, c) => sum + c.totalValor, 0)
          },
          { 
            score: 3, 
            count: clientes.filter(c => c.v === 3).length, 
            label: 'V3',
            valorTotal: clientes.filter(c => c.v === 3).reduce((sum, c) => sum + c.totalValor, 0)
          },
          { 
            score: 4, 
            count: clientes.filter(c => c.v === 4).length, 
            label: 'V4',
            valorTotal: clientes.filter(c => c.v === 4).reduce((sum, c) => sum + c.totalValor, 0)
          },
          { 
            score: 5, 
            count: clientes.filter(c => c.v === 5).length, 
            label: 'V5',
            valorTotal: clientes.filter(c => c.v === 5).reduce((sum, c) => sum + c.totalValor, 0)
          }
        ]
      };

      // 🔧 DEBUG: Verificar distribuição de frequência corrigida
      console.log('🔧 DEBUG - Distribuição de frequência corrigida:');
      console.log('  F1:', distributionData.frequencia[0].count, 'clientes');
      console.log('  F2:', distributionData.frequencia[1].count, 'clientes');
      console.log('  F3:', distributionData.frequencia[2].count, 'clientes');
      console.log('  F4:', distributionData.frequencia[3].count, 'clientes');
      console.log('  F5:', distributionData.frequencia[4].count, 'clientes');
      
      // 🔧 DEBUG: Verificar distribuição de VALOR corrigida
      console.log('🔧 DEBUG - Distribuição de VALOR corrigida:');
      console.log('  V1:', distributionData.valor[0].count, 'clientes | R$', distributionData.valor[0].valorTotal.toFixed(2));
      console.log('  V2:', distributionData.valor[1].count, 'clientes | R$', distributionData.valor[1].valorTotal.toFixed(2));
      console.log('  V3:', distributionData.valor[2].count, 'clientes | R$', distributionData.valor[2].valorTotal.toFixed(2));
      console.log('  V4:', distributionData.valor[3].count, 'clientes | R$', distributionData.valor[3].valorTotal.toFixed(2));
      console.log('  V5:', distributionData.valor[4].count, 'clientes | R$', distributionData.valor[4].valorTotal.toFixed(2));
      
      // 🔧 DEBUG: Verificar frequências reais dos clientes
      const frequenciasReais = clientes.map(c => c.frequencia);
      const contagemFrequencias = {};
      frequenciasReais.forEach(f => {
        contagemFrequencias[f] = (contagemFrequencias[f] || 0) + 1;
      });
      console.log('🔧 DEBUG - Frequências reais dos clientes:', contagemFrequencias);
      
      // 🔧 DEBUG: Verificar valores reais dos clientes
      const valoresReais = clientes.map(c => c.totalValor);
      const valoresOrdenados = [...valoresReais].sort((a, b) => a - b);
      const valoresUnicos = [...new Set(valoresReais)].sort((a, b) => a - b);
      
      console.log('🔧 DEBUG - Estatísticas dos valores:');
      console.log('  - Total de clientes:', valoresReais.length);
      console.log('  - Valores únicos:', valoresUnicos.length);
      console.log('  - Valor mínimo:', Math.min(...valoresReais));
      console.log('  - Valor máximo:', Math.max(...valoresReais));
      console.log('  - Valor médio:', (valoresReais.reduce((a, b) => a + b, 0) / valoresReais.length).toFixed(2));
      console.log('  - Valores menores (10 primeiros):', valoresOrdenados.slice(0, 10));
      console.log('  - Valores maiores (10 últimos):', valoresOrdenados.slice(-10));
      
      // Verificar distribuição real
      const distribuicaoValores = {};
      valoresReais.forEach(v => {
        const faixa = Math.floor(v / 1000) * 1000; // Agrupar por milhares
        distribuicaoValores[faixa] = (distribuicaoValores[faixa] || 0) + 1;
      });
      console.log('🔧 DEBUG - Distribuição por faixas de valor:', distribuicaoValores);
      
      // Mostrar as faixas de valor aplicadas
      console.log('🔧 DEBUG - Faixas de valor aplicadas:');
      console.log('  - V1 (0-100):', valoresReais.filter(v => v <= 100).length, 'clientes');
      console.log('  - V2 (100-300):', valoresReais.filter(v => v > 100 && v <= 300).length, 'clientes');
      console.log('  - V3 (300-600):', valoresReais.filter(v => v > 300 && v <= 600).length, 'clientes');
      console.log('  - V4 (600-1500):', valoresReais.filter(v => v > 600 && v <= 1500).length, 'clientes');
      console.log('  - V5 (1500+):', valoresReais.filter(v => v > 1500).length, 'clientes');
      
      console.log('🔧 DEBUG - Amostra de scores V:', clientes.slice(0, 10).map(c => ({ 
        lead_id: c.lead_id, 
        valor: c.totalValor, 
        v: c.v,
        percentil: ((valoresOrdenados.findIndex(v => v >= c.totalValor) / valoresOrdenados.length) * 100).toFixed(1) + '%'
      })));
      
      const matrixData = {};

      const result = {
        clientes,
        totalClientes: clientes.length,
        totalFaturamento,
        totalOportunidades,
        distributionData,
        matrixData,
        dataSource: {
          isReal: true,
          message: '✅ Dados reais da tabela: oportunidade_sprint'
        }
      };

      // Cache removido - causava problemas de valores mudando
      console.log('🔍 rfvRealService: RESULTADO FINAL:', {
        totalClientes: result.clientes?.length || 0,
        totalSegmentos: result.segmentos?.length || 0,
        primeiroSegmento: result.segmentos?.[0]?.nome || 'N/A',
        primeiroClientes: result.segmentos?.[0]?.clientes || 0,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('❌ rfvRealService: Erro na análise RFV com dados reais:', error);
      throw error;
    } finally {
      isProcessing = false;
      console.log('🔓 rfvRealService: BLOQUEIO LIBERADO');
    }
  },

  // Função clearCache removida - cache foi removido

  async getRFVMetrics(params = {}) {
    try {
      // Para métricas, buscar dados do período específico (com filtro de data)
      const { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin } = params;
      
      console.log('📊 getRFVMetrics: Parâmetros recebidos:', {
        startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin
      });
      
      // 🔧 CORREÇÃO: Aplicar filtros exatos que a interface usa + campos do lead
      let queryParams = `select=id,value,user_id,lead_id,create_date,gain_date,status,lead_firstname,lead_lastname,lead_whatsapp&archived=eq.0&status=eq.gain`;

      // Aplicar filtro de data para métricas do período
      if (startDate && endDate) {
        const dataInicio = startDate + 'T00:00:00';
        const dataFim = endDate + 'T23:59:59';
        queryParams += `&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}`;
        console.log('📊 Métricas: Filtro de data aplicado:', dataInicio, 'até', dataFim);
      }

      let filtrosCombinados = '';
      
      // 🔧 FILTRO FIXO: Funil 6 e 14 (identificado via SQL)
      filtrosCombinados += `&funil_id=in.(6,14)`;
      
      // 🔧 FILTRO FIXO: Unidade não nula e não vazia
      filtrosCombinados += `&unidade_id=not.is.null&unidade_id=neq.`;
      
      // 🔧 FILTRO FIXO: Vendedor não nulo e maior que zero
      filtrosCombinados += `&user_id=not.is.null&user_id=gt.0`;

      // Aplicar filtros adicionais se especificados
      if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '6,14') {
        filtrosCombinados += `&funil_id=eq.${selectedFunnel}`;
      }
      if (selectedUnit && selectedUnit !== 'all') {
        filtrosCombinados += `&unidade_id=eq.${selectedUnit}`;
      }
      if (selectedSeller && selectedSeller !== 'all') {
        filtrosCombinados += `&user_id=eq.${selectedSeller}`;
      }

      const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?${queryParams}${filtrosCombinados}`;
      
      console.log('🔗 URL da consulta para métricas:', url);

      const baseHeaders = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Prefer': 'count=exact'
      };

      // Usar paginação para buscar TODOS os registros do período
      const oportunidades = await fetchAllRecords(url, baseHeaders);
      console.log('📊 Oportunidades para métricas:', oportunidades.length);

      // Calcular métricas do período
      const clientesMap = new Map();
      let totalFaturamento = 0;
      let totalOportunidades = oportunidades.length;

      oportunidades.forEach((op, index) => {
        const leadId = op.lead_id || op.id || `cliente_${index}`;
        const valor = parseFloat(op.value) || 0;
        const dataStr = op.gain_date || op.create_date;
        const data = dataStr ? new Date(dataStr) : null;

        totalFaturamento += valor;

        if (!clientesMap.has(leadId)) {
          clientesMap.set(leadId, { 
            lead_id: leadId, 
            totalValor: 0, 
            frequencia: 0, 
            ultimaCompra: null,
            nome: op.lead_firstname || '',
            sobrenome: op.lead_lastname || '',
            whatsapp: op.lead_whatsapp || ''
          });
        }
        const c = clientesMap.get(leadId);
        c.totalValor += valor;
        c.frequencia += 1;
        if (data && (!c.ultimaCompra || data > c.ultimaCompra)) {
          c.ultimaCompra = data;
          // Atualizar dados do lead com a oportunidade mais recente
          c.nome = op.lead_firstname || c.nome;
          c.sobrenome = op.lead_lastname || c.sobrenome;
          c.whatsapp = op.lead_whatsapp || c.whatsapp;
        }
      });

      // Calcular recência e scores RFV para cada cliente
      const hoje = new Date();
      const clientesBasicos = Array.from(clientesMap.values()).map(c => {
        const ultimaCompra = c.ultimaCompra ? new Date(c.ultimaCompra) : null;
        const recencia = ultimaCompra ? Math.floor((hoje - ultimaCompra) / (1000 * 60 * 60 * 24)) : 999;
        return { ...c, recencia };
      });

      // Calcular scores RFV para cada cliente
      const clientes = clientesBasicos.map(c => {
        const rfvScores = this.calcularRFVScores(c.recencia, c.frequencia, c.totalValor, clientesBasicos);
        const segmento = this.classificarSegmento(rfvScores);
        return { ...c, ...rfvScores, segmento };
      });

      // Usar EXATAMENTE a mesma lógica de segmentação do treemap
      const clientesAtivos = clientes.filter(c => c.recencia <= 30).length; // Ativos: até 30 dias
      const clientesEmAtencao = clientes.filter(c => c.recencia >= 31 && c.recencia <= 35).length; // Atenção: 31-35 dias
      const clientesEmRisco = clientes.filter(c => c.segmento === 'em_risco').length; // Risco: APENAS segmento "em_risco" (igual ao treemap)

      // Contar segmentos para debug
      const segmentosCount = {};
      clientes.forEach(c => {
        segmentosCount[c.segmento] = (segmentosCount[c.segmento] || 0) + 1;
      });

      console.log('📊 RFV Métricas calculadas:');
      console.log('  - Total de clientes:', clientes.length);
      console.log('  - Clientes ativos (≤30 dias):', clientesAtivos);
      console.log('  - Clientes em atenção (31-35 dias):', clientesEmAtencao);
      console.log('  - Clientes em risco (segmento "em_risco"):', clientesEmRisco);
      console.log('  - Distribuição de segmentos RFV:', segmentosCount);
      console.log('  - Verificação: em_risco no treemap =', segmentosCount['em_risco'] || 0, 'clientes');
      console.log('  - Amostra de clientes:', clientes.slice(0, 3).map(c => ({ 
        lead_id: c.lead_id, 
        recencia: c.recencia, 
        segmento: c.segmento,
        r: c.r, f: c.f, v: c.v 
      })));

      return {
        totalClientes: clientes.length,
        faturamento: totalFaturamento,
        ticketMedio: totalFaturamento / (totalOportunidades || 1),
        clientesAtivos,
        clientesNovos: clientes.filter(c => c.frequencia === 1).length,
        clientesEmRisco,
        clientesEmAtencao
      };
    } catch (error) {
      console.error('❌ rfvRealService: Erro ao calcular métricas RFV:', error);
      throw error;
    }
  },

  // Calcular scores RFV (1-5) para cada cliente
  calcularRFVScores(recencia, frequencia, valor, todosClientes) {
    // Calcular percentis para normalização
    const valores = todosClientes.map(c => c.totalValor);
    const frequencias = todosClientes.map(c => c.frequencia);
    const recencias = todosClientes.map(c => c.recencia);

    // Scores baseados em percentis
    const valorScore = this.calcularScoreValor(valor, valores); // 🔧 CORREÇÃO: Função específica para valor
    const frequenciaScore = this.calcularScoreFrequencia(frequencia, frequencias); // 🔧 CORREÇÃO: Função específica para frequência
    const recenciaScore = this.calcularScoreRecencia(recencia, recencias); // Invertido: menor recência = score maior

    return {
      r: recenciaScore,
      f: frequenciaScore,
      v: valorScore
    };
  },

  // 🔧 NOVA FUNÇÃO: Calcular score de valor baseado em faixas realistas
  calcularScoreValor(valor, array) {
    // 🔧 CORREÇÃO: Usar faixas de valor mais realistas para o negócio
    // Baseado nos dados reais: min=0, max=24.741, médio=482
    
    if (valor <= 100) return 1; // V1: Valores muito baixos (0-100)
    if (valor <= 300) return 2; // V2: Valores baixos (100-300)
    if (valor <= 600) return 3; // V3: Valores médios (300-600)
    if (valor <= 1500) return 4; // V4: Valores altos (600-1500)
    return 5; // V5: Valores muito altos (1500+)
  },

  // 🔧 NOVA FUNÇÃO: Calcular score de frequência baseado em valores exatos
  calcularScoreFrequencia(frequencia, array) {
    // Para frequência: usar o valor exato (1, 2, 3, 4, 5+)
    if (frequencia <= 1) return 1;
    if (frequencia <= 2) return 2;
    if (frequencia <= 3) return 3;
    if (frequencia <= 4) return 4;
    return 5; // 5 ou mais
  },

  calcularScore(valor, array) {
    // 🔧 FUNÇÃO MANTIDA PARA COMPATIBILIDADE (não usada mais)
    // Para frequência: usar o valor exato (1, 2, 3, 4, 5+)
    if (valor <= 1) return 1;
    if (valor <= 2) return 2;
    if (valor <= 3) return 3;
    if (valor <= 4) return 4;
    return 5; // 5 ou mais
  },

  calcularScoreRecencia(recencia, array) {
    // Invertido: menor recência = score maior
    const sorted = [...array].sort((a, b) => b - a);
    const percentil = sorted.findIndex(r => r <= recencia) / sorted.length;

    if (percentil <= 0.2) return 5; // Muito recente
    if (percentil <= 0.4) return 4;
    if (percentil <= 0.6) return 3;
    if (percentil <= 0.8) return 2;
    return 1; // Muito antigo
  },

  // Classificar cliente em segmento baseado nos scores RFV
  classificarSegmento({r, f, v}) {
    // 🔧 LÓGICA CORRIGIDA para segmentação mais precisa
    
    // Campeões - R4-5, F4-5, V4-5 (clientes mais valiosos)
    if ((r === 4 || r === 5) && (f === 4 || f === 5) && (v === 4 || v === 5)) return 'campeoes';
    
    // Clientes fiéis - R3-5, F3-5, V3-5 (clientes leais e valiosos)
    if ((r === 3 || r === 4 || r === 5) && (f === 3 || f === 4 || f === 5) && (v === 3 || v === 4 || v === 5)) return 'clientes_fieis';
    
    // Potenciais fiéis - R2-5, F2-5, V2-5 (clientes promissores)
    if ((r === 2 || r === 3 || r === 4 || r === 5) && (f === 2 || f === 3 || f === 4 || f === 5) && (v === 2 || v === 3 || v === 4 || v === 5)) return 'potenciais_fieis';
    
    // Promissores - R4-5, F1-2, V1-3 (clientes novos com potencial, MAS com recência alta)
    if ((r === 4 || r === 5) && (f === 1 || f === 2) && (v === 1 || v === 2 || v === 3)) return 'promissores';
    
    // Clientes recentes - R4-5, F1, V1-2 (clientes novos)
    if ((r === 4 || r === 5) && f === 1 && (v === 1 || v === 2)) return 'clientes_recentes';
    
    // Em risco - R1-2, F2-5, V2-5 (clientes valiosos que podem sair) - MAIS FLEXÍVEL
    if ((r === 1 || r === 2) && (f === 2 || f === 3 || f === 4 || f === 5) && (v === 2 || v === 3 || v === 4 || v === 5)) return 'em_risco';
    
    // Precisam de atenção - R2-4, F2-4, V2-4 (clientes que precisam de cuidado) - ULTRA FLEXÍVEL
    if ((r === 2 || r === 3 || r === 4) && (f === 2 || f === 3 || f === 4) && (v === 2 || v === 3 || v === 4)) return 'precisam_atencao';
    
    // Prestes a hibernar - R2-3, F1-2, V1-2 (clientes quase inativos)
    if ((r === 2 || r === 3) && (f === 1 || f === 2) && (v === 1 || v === 2)) return 'prestes_hibernar';
    
    // Hibernando - R2-4, F1-2, V1-2 (clientes inativos) - ULTRA FLEXÍVEL
    if ((r === 2 || r === 3 || r === 4) && (f === 1 || f === 2) && (v === 1 || v === 2)) return 'hibernando';
    
    // Hibernando - R3-5, F1-2, V1-2 (clientes inativos) - ADICIONAL PARA CAPTURAR MAIS
    if ((r === 3 || r === 4 || r === 5) && (f === 1 || f === 2) && (v === 1 || v === 2)) return 'hibernando';
    
    // Precisam de atenção - R3-5, F2-3, V2-3 (clientes que precisam de cuidado) - ADICIONAL
    if ((r === 3 || r === 4 || r === 5) && (f === 2 || f === 3) && (v === 2 || v === 3)) return 'precisam_atencao';
    
    // Perdidos - R1-2, F1-2, V1-2 (clientes perdidos)
    if ((r === 1 || r === 2) && (f === 1 || f === 2) && (v === 1 || v === 2)) return 'perdidos';
    
    // Não posso perder - R1, F4-5, V4-5 (clientes críticos) - MAIS FLEXÍVEL
    if (r === 1 && (f === 4 || f === 5) && (v === 4 || v === 5)) return 'nao_posso_perder';
    
    // Casos especiais - MAIS FLEXÍVEIS
    if ((r === 1 || r === 2) && f === 1 && (v === 3 || v === 4 || v === 5)) return 'novos_valiosos';
    if ((r === 4 || r === 5) && (f === 1 || f === 2) && (v === 3 || v === 4 || v === 5)) return 'recencia_alta_valor_alto';
    
    // Default para outros casos
    return 'outros';
  }
};