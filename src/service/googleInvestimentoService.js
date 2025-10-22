import { getTodayDateSP, getStartOfDaySP, getEndOfDaySP } from '../utils/utils'
import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js'
import { googleAdsApiService } from './googleAdsApiService.js'

/**
 * Service para buscar investimento em mídia paga (Google) no Supabase
 * Tabela: investimento_patrocinados (schema api)
 * Campos: data (timestamptz), valor (numeric), plataforma (text)
 * 
 * IMPORTANTE: 
 * - Implementa paginação automática para buscar TODOS os registros (não limitado a 1000)
 * - Usa timezone GMT-3 (America/Sao_Paulo) consistente com as outras tabelas
 * - Retorna total calculado em BRL e array com todos os itens encontrados
 */
export const googleInvestimentoService = {
  /**
   * Retorna a soma do valor investido no período para plataforma="google"
   * @param {string|null} startDate YYYY-MM-DD (timezone São Paulo)
   * @param {string|null} endDate YYYY-MM-DD (timezone São Paulo)
   * @returns {Promise<{ total: number, items: Array }>} total em BRL
   */
  async getInvestimentoTotal(startDate = null, endDate = null) {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 GoogleInvestimentoService.getInvestimentoTotal INICIANDO');
    console.log('='.repeat(80));
    
    // CORREÇÃO: Usar exatamente a mesma lógica do OportunidadesGanhasService
    const hoje = new Date().toISOString().split('T')[0];
    let dataInicio = startDate;
    let dataFim = endDate;
    
    // Usar a data fornecida em vez de "hoje" fixo
    console.log('📅 Datas recebidas:', { startDate, endDate });
    console.log('📅 Hoje (fallback):', hoje);
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      dataInicio = hoje;
      dataFim = hoje;
      console.log('⚠️ GoogleInvestimentoService: Usando datas fallback (hoje):', { dataInicio, dataFim });
    } else {
      console.log('✅ GoogleInvestimentoService: Usando datas fornecidas:', { dataInicio, dataFim });
    }
    
    // CORREÇÃO CRÍTICA: Usar dataFim para o end, não dataInicio
    // Como investimento_patrocinados já tem timezone GMT-3, usar as datas diretamente
    const start = `${dataInicio} 00:00:00-03`;
    const end = `${dataFim} 23:59:59-03`;

    // Verificar credenciais do Supabase
    console.log('\n🔑 Credenciais Supabase:');
    console.log('  - URL:', supabaseUrl);
    console.log('  - Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 30)}...` : '❌ NÃO DEFINIDA');
    console.log('  - Schema:', supabaseSchema);
    
    // Monta URL com filtros (PostgREST) - Agora com timezone
    // Incluir tanto 'Custo' (string) quanto 'valor' (numeric) para garantir compatibilidade
    const url = `${supabaseUrl}/rest/v1/investimento_patrocinados?select=data,valor,Custo,plataforma&plataforma=eq.google&data=gte.${encodeURIComponent(start)}&data=lte.${encodeURIComponent(end)}`
    
    console.log('\n🔍 GoogleInvestimentoService - Debug (CORRIGIDO):');
    console.log('  - startDate recebido:', startDate);
    console.log('  - endDate recebido:', endDate);
    console.log('  - dataInicio usada:', dataInicio);
    console.log('  - dataFim usada:', dataFim);
    console.log('  - start processado:', start);
    console.log('  - end processado:', end);
    console.log('  - Período em dias:', Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)));
    console.log('  - URL final:', url);
    
    // TESTE: Verificar se a URL está correta para o período
    if (dataInicio !== dataFim) {
      console.log('🧪 TESTE PARA PERÍODO MÚLTIPLO:');
      console.log(`  - Deveria buscar registros de ${dataInicio} até ${dataFim}`);
      console.log(`  - Start: ${start}`);
      console.log(`  - End: ${end}`);
      console.log(`  - Dias incluídos: ${Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24))}`);
    } else {
      console.log('🧪 TESTE PARA DIA ÚNICO:');
      console.log(`  - Deveria buscar apenas registros de ${dataInicio}`);
    }
    
    // Teste: verificar se o período está correto
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    console.log('  - Período coberto:');
    console.log('    * Início:', startDateObj.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    console.log('    * Fim:', endDateObj.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

    // BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO
    let allRows = [];
    let offset = 0;
    let hasMore = true;
    const pageSize = 1000;

    console.log('\n🔍 Iniciando busca com paginação...');
    console.log('  - Page size:', pageSize);
    console.log('  - Offset inicial:', offset);

    while (hasMore) {
      const urlPaginated = `${url}&limit=${pageSize}&offset=${offset}`;
      console.log(`\n📄 Buscando página ${Math.floor(offset / pageSize) + 1}...`);
      console.log('  - URL completa:', urlPaginated);
      
      try {
        const response = await fetch(urlPaginated, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        })
        
        console.log(`  - Status HTTP:`, response.status, response.statusText);
        console.log(`  - Headers enviados:`, {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey.substring(0, 30)}...`,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erro na resposta HTTP:', errorText);
          console.error('❌ Status:', response.status);
          console.error('❌ Status Text:', response.statusText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const pageRows = await response.json();
        console.log(`  - Registros retornados:`, pageRows.length);
        
        // DEBUG: Mostrar primeiro registro da página
        if (pageRows.length > 0) {
          console.log(`  - Primeiro registro da página:`, {
            data: pageRows[0].data,
            valor: pageRows[0].valor,
            Custo: pageRows[0].Custo,
            plataforma: pageRows[0].plataforma,
            valorUsado: pageRows[0].valor || parseFloat(pageRows[0].Custo) || 0
          });
        }
        
        if (!pageRows || pageRows.length === 0) {
          console.log('  ⚠️ Nenhum registro encontrado nesta página. Finalizando busca.');
          hasMore = false;
        } else {
          allRows = allRows.concat(pageRows);
          console.log(`  ✅ ${pageRows.length} registros nesta página | Total acumulado: ${allRows.length}`);
          offset += pageSize;
          
          if (pageRows.length < pageSize) {
            console.log('  ℹ️ Página incompleta. Última página alcançada.');
            hasMore = false;
          }
        }
      } catch (error) {
        console.error('❌ ERRO durante fetch:', error);
        console.error('❌ Stack:', error.stack);
        throw error;
      }
    }

    const rows = allRows;
    
    // Calcular total usando 'valor' (numeric) ou 'Custo' (string) como fallback
    const total = (rows || []).reduce((sum, row) => {
      // Priorizar 'valor' (numeric), se não existir, usar 'Custo' (string convertido)
      const valorNumerico = row.valor || parseFloat(row.Custo) || 0;
      return sum + valorNumerico;
    }, 0)
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 GoogleInvestimentoService - RESULTADOS FINAIS');
    console.log('='.repeat(80));
    console.log('📊 Total de registros encontrados:', rows?.length || 0);
    console.log('💰 Total calculado: R$', total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    
    if (rows?.length === 0) {
      console.log('\n⚠️ NENHUM REGISTRO ENCONTRADO!');
      console.log('Possíveis causas:');
      console.log('  1. Não há dados na tabela investimento_patrocinados para o período');
      console.log('  2. O filtro de plataforma="google" não está retornando resultados');
      console.log('  3. As datas estão fora do range dos dados disponíveis');
      console.log('  4. Problema de permissões no Supabase');
    }
    
    // Mostrar apenas os primeiros 5 e últimos 5 registros para não poluir o console
    if (rows?.length > 0) {
      console.log('\n📋 Primeiros 5 registros:');
      rows.slice(0, 5).forEach((row, index) => {
        const data = row.data ? new Date(row.data).toLocaleDateString('pt-BR') : 'N/A';
        const valorFinal = row.valor || parseFloat(row.Custo) || 0;
        console.log(`  ${index + 1}. Data: ${data} | Valor: R$ ${valorFinal.toFixed(2)} | Custo: ${row.Custo} | valor: ${row.valor} | Plataforma: ${row.plataforma}`);
      });
      
      if (rows.length > 10) {
        console.log('\n  ... (' + (rows.length - 10) + ' registros intermediários ocultos) ...');
        console.log('\n📋 Últimos 5 registros:');
        rows.slice(-5).forEach((row, index) => {
          const data = row.data ? new Date(row.data).toLocaleDateString('pt-BR') : 'N/A';
          const valorFinal = row.valor || parseFloat(row.Custo) || 0;
          console.log(`  ${rows.length - 4 + index}. Data: ${data} | Valor: R$ ${valorFinal.toFixed(2)} | Custo: ${row.Custo} | valor: ${row.valor} | Plataforma: ${row.plataforma}`);
        });
      } else if (rows.length > 5) {
        console.log('\n📋 Demais registros:');
        rows.slice(5).forEach((row, index) => {
          const data = row.data ? new Date(row.data).toLocaleDateString('pt-BR') : 'N/A';
          const valorFinal = row.valor || parseFloat(row.Custo) || 0;
          console.log(`  ${6 + index}. Data: ${data} | Valor: R$ ${valorFinal.toFixed(2)} | Custo: ${row.Custo} | valor: ${row.valor} | Plataforma: ${row.plataforma}`);
        });
      }
      
      // Debug: Mostrar distribuição por data
      const datasCounts = {};
      rows.forEach(r => {
        const data = r.data ? new Date(r.data).toLocaleDateString('pt-BR') : 'N/A';
        datasCounts[data] = (datasCounts[data] || 0) + 1;
      });
      console.log(`\n📅 Distribuição: ${Object.keys(datasCounts).length} dias únicos`);
      const datasOrdenadas = Object.keys(datasCounts).sort();
      if (datasOrdenadas.length > 0) {
        console.log('  - Primeira data:', datasOrdenadas[0]);
        console.log('  - Última data:', datasOrdenadas[datasOrdenadas.length - 1]);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ GoogleInvestimentoService.getInvestimentoTotal FINALIZADO');
    console.log('='.repeat(80) + '\n');
    
    return { total, items: rows || [] }
  },

  /**
   * Busca custos em TEMPO REAL da API do Google Ads
   * @param {string} startDate YYYY-MM-DD
   * @param {string} endDate YYYY-MM-DD
   * @returns {Promise<{ total: number, items: Array, source: string }>}
   */
  async getInvestimentoRealTime(startDate, endDate) {
    console.log('\n' + '='.repeat(80));
    console.log('🔴 MODO TEMPO REAL - Google Ads API');
    console.log('='.repeat(80));
    console.log('📅 Período:', startDate, 'até', endDate);

    try {
      // Buscar estatísticas da API do Google Ads
      const stats = await googleAdsApiService.getStats(startDate, endDate);
      
      console.log('✅ Dados recebidos da API Google Ads:', stats);
      
      // Extrair o custo total
      const total = stats.cost || stats.totalCost || stats.metrics?.cost_micros / 1000000 || 0;
      
      console.log('💰 Custo total da API:', total);
      
      return {
        total,
        items: [{
          data: new Date().toISOString(),
          valor: total,
          Custo: total.toString(),
          plataforma: 'google',
          source: 'google-ads-api-realtime'
        }],
        source: 'google-ads-api'
      };
    } catch (error) {
      console.error('❌ Erro ao buscar da API do Google Ads:', error);
      throw error;
    }
  },

  /**
   * Busca custos HÍBRIDO: Tenta banco primeiro, depois API em tempo real
   * @param {string} startDate YYYY-MM-DD
   * @param {string} endDate YYYY-MM-DD
   * @returns {Promise<{ total: number, items: Array, source: string }>}
   */
  async getInvestimentoHybrid(startDate, endDate) {
    console.log('\n' + '='.repeat(80));
    console.log('🔄 MODO HÍBRIDO - Banco + API Google Ads');
    console.log('='.repeat(80));

    try {
      // 1. Tentar buscar do banco primeiro
      console.log('1️⃣ Tentando buscar do banco de dados...');
      const bancoDados = await this.getInvestimentoTotal(startDate, endDate);
      
      // 2. Se tiver dados no banco, retornar
      if (bancoDados.items && bancoDados.items.length > 0) {
        console.log('✅ Dados encontrados no banco:', bancoDados.items.length, 'registros');
        return {
          ...bancoDados,
          source: 'supabase-database'
        };
      }
      
      // 3. Se não tiver dados no banco, buscar da API
      console.log('⚠️ Nenhum dado no banco. Buscando da API Google Ads...');
      const apiData = await this.getInvestimentoRealTime(startDate, endDate);
      
      // 4. Verificar se a API retornou custos válidos
      if (apiData.total > 0) {
        console.log('✅ Dados obtidos da API Google Ads com custos válidos:', apiData.total);
        return apiData;
      } else {
        console.log('⚠️ API retornou custos zero. Usando dados do banco como fallback...');
        // Tentar buscar do banco novamente com período mais amplo
        const fallbackData = await this.getInvestimentoTotal(startDate, endDate);
        if (fallbackData.items && fallbackData.items.length > 0) {
          console.log('✅ Usando dados do banco como fallback');
          return {
            ...fallbackData,
            source: 'supabase-database-fallback'
          };
        }
        
        console.log('⚠️ Nenhum dado disponível em banco ou API');
        return {
          total: 0,
          items: [],
          source: 'no-data'
        };
      }
      
    } catch (error) {
      console.error('❌ Erro no modo híbrido:', error);
      throw error;
    }
  }
}

export default googleInvestimentoService


