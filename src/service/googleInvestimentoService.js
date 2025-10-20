import { getTodayDateSP, getStartOfDaySP, getEndOfDaySP } from '../utils/utils'

/**
 * Service para buscar investimento em mídia paga (Google) no Supabase
 * Tabela: investimento_patrocinados (schema api)
 * Campos: data (date/timestamp), valor (numeric), plataforma (text)
 */
export const googleInvestimentoService = {
  /**
   * Retorna a soma do valor investido no período para plataforma="google"
   * @param {string|null} startDate YYYY-MM-DD (timezone São Paulo)
   * @param {string|null} endDate YYYY-MM-DD (timezone São Paulo)
   * @returns {Promise<{ total: number, items: Array }>} total em BRL
   */
  async getInvestimentoTotal(startDate = null, endDate = null) {
    import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js'

    // CORREÇÃO: Usar exatamente a mesma lógica do OportunidadesGanhasService
    const hoje = new Date().toISOString().split('T')[0];
    let dataInicio = startDate;
    let dataFim = endDate;
    
    // Usar a data fornecida em vez de "hoje" fixo
    console.log('📅 Usando data fornecida para investimento Google:', dataInicio);
    
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

    // Monta URL com filtros (PostgREST) - Agora com timezone
    const url = `${supabaseUrl}/rest/v1/investimento_patrocinados?select=data,valor,plataforma&plataforma=eq.google&data=gte.${encodeURIComponent(start)}&data=lte.${encodeURIComponent(end)}`
    
    console.log('🔍 GoogleInvestimentoService - Debug (CORRIGIDO):');
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

    console.log('🔍 Fazendo requisição para:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    })
    
    console.log('🔍 Status da resposta:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }


    const rows = await response.json()
    const total = (rows || []).reduce((sum, row) => sum + (Number(row.valor) || 0), 0)
    
    console.log('🔍 GoogleInvestimentoService - Resultados:');
    console.log('  - Total de registros encontrados:', rows?.length || 0);
    console.log('  - Registros detalhados:');
    rows?.forEach((row, index) => {
      console.log(`    ${index + 1}. Data: ${row.data}, Valor: ${row.valor}, Plataforma: ${row.plataforma}`);
    });
    console.log('  - Total calculado:', total);
    
    // Debug específico para verificar se está incluindo dados de outros dias
    if (rows?.length > 1) {
      console.log('⚠️ ATENÇÃO: Encontrados múltiplos registros para o período!');
      console.log('  - Datas únicas encontradas:', [...new Set(rows.map(r => r.data))]);
    }
    
    return { total, items: rows || [] }
  }
}

export default googleInvestimentoService


