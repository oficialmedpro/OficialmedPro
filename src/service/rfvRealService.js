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
        console.error(`❌ RFV: Erro na página ${Math.floor(offset / pageSize) + 1}:`, response.status);
        break;
      }

      const pageData = await response.json();
      allRecords = allRecords.concat(pageData);

      console.log(`📄 RFV: Página ${Math.floor(offset / pageSize) + 1}: ${pageData.length} registros | Total: ${allRecords.length}`);

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
      console.error(`❌ RFV: Erro ao buscar página ${Math.floor(offset / pageSize) + 1}:`, error);
      break;
    }
  }

  console.log(`✅ RFV: Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
};

// Service NOVO para RFV usando o mesmo padrão do OportunidadesGanhasCard/thermometerService (REST PostgREST)
export const rfvRealService = {
  async getRFVAnalysis({ startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin } = {}) {
    try {
      console.log('🔍 rfvRealService: Iniciando análise RFV com dados reais...');
      console.log('🔍 rfvRealService: Filtros recebidos:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });

      let queryParams = `select=id,value,user_id,lead_id,create_date,gain_date,status&archived=eq.0&status=eq.gain`;

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
      // Aplicar filtro de funil
      if (selectedFunnel && selectedFunnel !== 'all') {
        filtrosCombinados += `&funil_id=eq.${selectedFunnel}`;
      }

      // Aplicar filtro de unidade
      if (selectedUnit && selectedUnit !== 'all') {
        filtrosCombinados += `&unidade_id=eq.${selectedUnit}`;
      }

      // Aplicar filtro de vendedor
      if (selectedSeller && selectedSeller !== 'all') {
        filtrosCombinados += `&user_id=eq.${selectedSeller}`;
      }

      // Aplicar filtro de origem
      if (selectedOrigin && selectedOrigin !== 'all') {
        filtrosCombinados += `&origin_id=eq.${selectedOrigin}`;
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
      const oportunidades = await fetchAllRecords(url, baseHeaders);
      console.log('📊 RFV Treemap: Oportunidades encontradas:', oportunidades.length);

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
          clientesMap.set(leadId, { lead_id: leadId, totalValor: 0, frequencia: 0, ultimaCompra: null });
        }
        const c = clientesMap.get(leadId);
        c.totalValor += valor;
        c.frequencia += 1;
        if (data && (!c.ultimaCompra || data > c.ultimaCompra)) c.ultimaCompra = data;
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
          { score: 1, count: clientes.filter(c => c.v === 1).length, label: 'V1' },
          { score: 2, count: clientes.filter(c => c.v === 2).length, label: 'V2' },
          { score: 3, count: clientes.filter(c => c.v === 3).length, label: 'V3' },
          { score: 4, count: clientes.filter(c => c.v === 4).length, label: 'V4' },
          { score: 5, count: clientes.filter(c => c.v === 5).length, label: 'V5' }
        ]
      };
      
      const matrixData = {};

      return {
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

    } catch (error) {
      console.error('❌ rfvRealService: Erro na análise RFV com dados reais:', error);
      throw error;
    }
  },

  async getRFVMetrics(params = {}) {
    try {
      // Para métricas, buscar dados do período específico (com filtro de data)
      const { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin } = params;
      
      console.log('📊 getRFVMetrics: Parâmetros recebidos:', {
        startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin
      });
      
      let queryParams = `select=id,value,user_id,lead_id,create_date,gain_date,status&archived=eq.0&status=eq.gain`;

      // Aplicar filtro de data para métricas do período
      if (startDate && endDate) {
        const dataInicio = startDate + 'T00:00:00';
        const dataFim = endDate + 'T23:59:59';
        queryParams += `&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}`;
        console.log('📊 Métricas: Filtro de data aplicado:', dataInicio, 'até', dataFim);
      }

      let filtrosCombinados = '';
      if (selectedFunnel && selectedFunnel !== 'all') {
        filtrosCombinados += `&funil_id=eq.${selectedFunnel}`;
      }
      if (selectedUnit && selectedUnit !== 'all') {
        filtrosCombinados += `&unidade_id=eq.${selectedUnit}`;
      }
      if (selectedSeller && selectedSeller !== 'all') {
        filtrosCombinados += `&user_id=eq.${selectedSeller}`;
      }
      if (selectedOrigin && selectedOrigin !== 'all') {
        filtrosCombinados += `&origin_id=eq.${selectedOrigin}`;
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
          clientesMap.set(leadId, { lead_id: leadId, totalValor: 0, frequencia: 0, ultimaCompra: null });
        }
        const c = clientesMap.get(leadId);
        c.totalValor += valor;
        c.frequencia += 1;
        if (data && (!c.ultimaCompra || data > c.ultimaCompra)) c.ultimaCompra = data;
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
    const valorScore = this.calcularScore(valor, valores);
    const frequenciaScore = this.calcularScore(frequencia, frequencias);
    const recenciaScore = this.calcularScoreRecencia(recencia, recencias); // Invertido: menor recência = score maior

    return {
      r: recenciaScore,
      f: frequenciaScore,
      v: valorScore
    };
  },

  calcularScore(valor, array) {
    const sorted = [...array].sort((a, b) => a - b);
    const percentil = sorted.findIndex(v => v >= valor) / sorted.length;

    if (percentil <= 0.2) return 1;
    if (percentil <= 0.4) return 2;
    if (percentil <= 0.6) return 3;
    if (percentil <= 0.8) return 4;
    return 5;
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
    // Lógica baseada nos segmentos da imagem
    if (r >= 4 && f >= 4 && v >= 4) return 'campeoes';
    if (r >= 4 && f >= 3 && v >= 3) return 'leais';
    if (r <= 2 && f >= 3 && v >= 3) return 'em_risco';
    if (r >= 4 && f <= 2 && v <= 3) return 'novos';
    if (r <= 2 && f <= 2) return 'perdidos';
    if (r <= 3 && f <= 2) return 'hibernando';
    if (r >= 3 && f >= 3 && v >= 2) return 'potenciais';
    return 'outros';
  }
};