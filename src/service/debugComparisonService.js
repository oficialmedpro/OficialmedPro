/**
 * Serviço temporário para comparar URLs e resultados entre serviços
 */

import { supabaseUrl, supabaseAnonKey, supabaseSchema } from '../config/supabase.js';

const baseHeaders = {
  'Accept': 'application/json',
  'Authorization': `Bearer ${supabaseAnonKey}`,
  'apikey': supabaseAnonKey,
  'Accept-Profile': supabaseSchema,
};

export const debugComparisonService = {
  async compareServices(startDate, endDate, selectedOrigin = null) {
    console.log('🔍 COMPARAÇÃO DE SERVIÇOS - Debug DIRETO');
    console.log('='.repeat(80));
    console.log('📅 Período:', startDate, 'até', endDate);
    console.log('🎯 Origem selecionada:', selectedOrigin);
    
    // FORÇAR TESTE COM GOOGLE ADS (ID = 1) se selectedOrigin = "all"
    let testOriginId = selectedOrigin;
    if (!selectedOrigin || selectedOrigin === 'all') {
      testOriginId = '1'; // ID do Google Ads
      console.log('🔍 FORÇANDO TESTE COM GOOGLE ADS (ID = 1)');
    }
    
    // TESTE DIRETO: Comparar URLs exatas
    console.log('\n🎯 URLs DIRETAS - LADO A LADO:');
    const googleUrl = await this.buildGoogleConversaoUrl(startDate, endDate);
    const oportUrl = await this.buildOportunidadesGanhasUrl(startDate, endDate, testOriginId);
    
    console.log('\n🟦 GoogleConversaoService URL:');
    console.log(googleUrl);
    
    console.log('\n🟩 OportunidadesGanhasService URL:');
    console.log(oportUrl);
    
    console.log('\n🔍 URLs SÃO IDÊNTICAS?', googleUrl === oportUrl ? '✅ SIM' : '❌ NÃO');
    
    // TESTE DIRETO: Executar as duas consultas
    const [googleData, oportData] = await Promise.all([
      this.executarConsulta(googleUrl, 'Google'),
      this.executarConsulta(oportUrl, 'Oportunidades')
    ]);
    
    console.log('\n🎯 RESULTADOS FINAIS:');
    console.log('Google:', googleData);
    console.log('Oportunidades:', oportData);
    console.log('DIFERENÇA TOTAL:', googleData.total - oportData.total);
    console.log('DIFERENÇA VALOR:', (googleData.valor - oportData.valor).toFixed(2));
  },

  async testGoogleInvestimento(startDate, endDate) {
    // Simular exatamente como o GoogleInvestimentoService faz
    const hoje = new Date().toISOString().split('T')[0];
    let dataInicio = startDate;
    let dataFim = endDate;
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      dataInicio = hoje;
      dataFim = hoje;
    }
    
    // CORREÇÃO: Como investimento_patrocinados já tem timezone GMT-3, usar a data diretamente
    const start = `${dataInicio} 00:00:00-03`;
    const end = `${dataInicio} 23:59:59-03`;
    
    const url = `${supabaseUrl}/rest/v1/investimento_patrocinados?select=data,valor,plataforma&plataforma=eq.google&data=gte.${encodeURIComponent(start)}&data=lte.${encodeURIComponent(end)}`;
    
    console.log('  - Data usada:', dataInicio);
    console.log('  - Start processado:', start);
    console.log('  - End processado:', end);
    console.log('  - URL:', url);
    
    try {
      const response = await fetch(url, { method: 'GET', headers: baseHeaders });
      const rows = await response.json();
      const total = (rows || []).reduce((sum, row) => sum + (Number(row.valor) || 0), 0);
      
      console.log('  - Registros encontrados:', rows?.length || 0);
      console.log('  - Total calculado:', total);
      rows?.forEach((row, index) => {
        console.log(`    ${index + 1}. Data: ${row.data}, Valor: ${row.valor}`);
      });
    } catch (error) {
      console.error('  - Erro:', error);
    }
  },

  async testGoogleConversao(startDate, endDate) {
    const hoje = new Date().toISOString().split('T')[0];
    let dataInicio = startDate;
    let dataFim = endDate;
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      dataInicio = hoje;
      dataFim = hoje;
    }
    
    const googleOriginOr = `or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`;
    
    const ganhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}T23:59:59&${googleOriginOr}`;
    
    console.log('  - Data início:', dataInicio);
    console.log('  - Data fim:', dataFim);
    console.log('  - Filtro Google:', googleOriginOr);
    console.log('  - URL Ganhas:', ganhasUrl);
    
    try {
      const response = await fetch(ganhasUrl, { method: 'GET', headers: baseHeaders });
      const rows = await response.json();
      
      // Processar valores como no GoogleConversaoService
      const parseMoneyValue = (raw) => {
        if (typeof raw === 'number') {
          return Number.isFinite(raw) ? raw : 0;
        }
        if (typeof raw === 'string') {
          const sanitized = raw.replace(/\./g, '').replace(',', '.');
          const num = Number(sanitized);
          return Number.isFinite(num) ? num : 0;
        }
        return 0;
      };
      
      let valorGanho = rows.reduce((acc, r) => {
        const valor = Math.floor(parseMoneyValue(r.value));
        return acc + valor;
      }, 0);
      valorGanho = Math.round(valorGanho * 100) / 100;
      
      console.log('  - Registros encontrados:', rows?.length || 0);
      console.log('  - Valor total calculado:', valorGanho);
      rows?.forEach((row, index) => {
        const valorOriginal = row.value;
        const valorTruncado = Math.floor(parseMoneyValue(row.value));
        console.log(`    ${index + 1}. ID: ${row.id}, Valor original: ${valorOriginal}, Valor truncado: ${valorTruncado}`);
      });
      
      return {
        totalGanhas: rows?.length || 0,
        valorGanho: valorGanho
      };
    } catch (error) {
      console.error('  - Erro:', error);
      return null;
    }
  },

  async testOportunidadesGanhasGoogle(startDate, endDate, selectedOrigin = null) {
    // Simular exatamente como OportunidadesGanhasService faz para Google
    const hoje = new Date().toISOString().split('T')[0];
    let dataInicio = startDate;
    let dataFim = endDate;
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      dataInicio = hoje;
      dataFim = hoje;
    }
    
    // Filtro de funil padrão (como OportunidadesGanhasService)
    const funilFilter = `&funil_id=in.(6,14)`;
    
    // Filtro de origem (como OportunidadesGanhasService)
    let originFilter = '';
    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== '') {
      // Simular busca da origem
      try {
        const originResponse = await fetch(`${supabaseUrl}/rest/v1/origem_oportunidade?select=nome&id=eq.${selectedOrigin}`, {
          method: 'GET',
          headers: baseHeaders
        });

        if (originResponse.ok) {
          const originData = await originResponse.json();
          if (originData && originData.length > 0) {
            const originName = originData[0].nome;
            
            if (originName.toLowerCase() === 'google ads' || originName.toLowerCase() === 'googleads') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent(originName)},utm_source.eq.google,utm_source.eq.GoogleAds)`;
              console.log('  - Filtro Google aplicado:', originFilter);
            } else {
              originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
              console.log('  - Filtro origem aplicado:', originFilter);
            }
          }
        }
      } catch (error) {
        console.log('  - Erro ao buscar origem:', error);
      }
    }
    
    const filtrosSemVendedor = funilFilter + /* no unidade */ '' + /* no seller */ '' + originFilter;
    
    const totalOportunidadesGanhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}T23:59:59${filtrosSemVendedor}`;
    
    console.log('  - Data início:', dataInicio);
    console.log('  - Data fim:', dataFim);
    console.log('  - Funil filter:', funilFilter);
    console.log('  - Origin filter:', originFilter);
    console.log('  - Filtros sem vendedor:', filtrosSemVendedor);
    console.log('  - URL Total Ganhas:', totalOportunidadesGanhasUrl);
    
    try {
      const response = await fetch(totalOportunidadesGanhasUrl, { method: 'GET', headers: baseHeaders });
      const rows = await response.json();
      
      // Processar valores como no OportunidadesGanhasService
      const parseMoneyValue = (raw) => {
        if (typeof raw === 'number') {
          return Number.isFinite(raw) ? raw : 0;
        }
        if (typeof raw === 'string') {
          const sanitized = raw.replace(/\./g, '').replace(',', '.');
          const num = Number(sanitized);
          return Number.isFinite(num) ? num : 0;
        }
        return 0;
      };
      
      let valorTotalOportunidadesGanhas = rows.reduce((total, opp) => {
        const valor = Math.floor(parseMoneyValue(opp.value));
        return total + valor;
      }, 0);
      valorTotalOportunidadesGanhas = Math.round(valorTotalOportunidadesGanhas * 100) / 100;
      
      console.log('  - Registros encontrados:', rows?.length || 0);
      console.log('  - Valor total calculado:', valorTotalOportunidadesGanhas);
      rows?.forEach((row, index) => {
        const valorOriginal = row.value;
        const valorTruncado = Math.floor(parseMoneyValue(row.value));
        console.log(`    ${index + 1}. ID: ${row.id}, Valor original: ${valorOriginal}, Valor truncado: ${valorTruncado}`);
      });
      
      return {
        totalGanhas: rows?.length || 0,
        valorGanho: valorTotalOportunidadesGanhas
      };
    } catch (error) {
      console.error('  - Erro:', error);
      return null;
    }
  },

  // FUNÇÕES AUXILIARES PARA DEBUG DIRETO
  async buildGoogleConversaoUrl(startDate, endDate) {
    const hoje = new Date().toISOString().split('T')[0];
    let dataInicio = startDate || hoje;
    let dataFim = endDate || hoje;
    
    const googleOriginFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`;
    const funilFilter = `&funil_id=in.(6,14)`;
    
    return `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}T00:00:00-03:00&gain_date=lte.${dataFim}T23:59:59-03:00${googleOriginFilter}${funilFilter}`;
  },

  async buildOportunidadesGanhasUrl(startDate, endDate, selectedOrigin) {
    const hoje = new Date().toISOString().split('T')[0];
    let dataInicio = startDate || hoje;
    let dataFim = endDate || hoje;
    
    // Simular busca da origem se fornecida
    let originFilter = '';
    if (selectedOrigin && selectedOrigin !== 'all') {
      try {
        const originResponse = await fetch(`${supabaseUrl}/rest/v1/origem_oportunidade?select=nome&id=eq.${selectedOrigin}`, {
          method: 'GET',
          headers: baseHeaders
        });
        
        if (originResponse.ok) {
          const originData = await originResponse.json();
          if (originData && originData.length > 0) {
            const originName = originData[0].nome;
            if (originName.toLowerCase() === 'google ads' || originName.toLowerCase() === 'googleads') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`;
            }
          }
        }
      } catch (error) {
        console.log('Erro ao buscar origem:', error);
      }
    }
    
    const funilFilter = `&funil_id=in.(6,14)`;
    
    return `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}T00:00:00-03:00&gain_date=lte.${dataFim}T23:59:59-03:00${originFilter}${funilFilter}`;
  },

  async executarConsulta(url, nome) {
    try {
      const response = await fetch(url, { method: 'GET', headers: baseHeaders });
      const data = await response.json();
      
      const parseMoneyValue = (raw) => {
        if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
        if (typeof raw === 'string') {
          const sanitized = raw.replace(/\./g, '').replace(',', '.');
          const num = Number(sanitized);
          return Number.isFinite(num) ? num : 0;
        }
        return 0;
      };
      
      let valorTotal = data.reduce((acc, r) => {
        const valor = Math.floor(parseMoneyValue(r.value));
        return acc + valor;
      }, 0);
      
      console.log(`\n📊 ${nome} - Registros individuais:`);
      data.forEach((row, index) => {
        const valorOriginal = row.value;
        const valorTruncado = Math.floor(parseMoneyValue(row.value));
        console.log(`  ${index + 1}. ID: ${row.id}, Valor original: ${valorOriginal}, Valor truncado: ${valorTruncado}`);
      });
      
      return {
        total: data.length,
        valor: Math.round(valorTotal * 100) / 100,
        registros: data
      };
    } catch (error) {
      console.error(`Erro ao executar consulta ${nome}:`, error);
      return { total: 0, valor: 0, registros: [] };
    }
  },

  // Copiar a função de conversão de timezone
  convertDateToSaoPauloTZ(dateString, isEndOfDay = false) {
    if (!dateString) return '';
    
    const date = new Date(dateString + 'T' + (isEndOfDay ? '23:59:59' : '00:00:00'));
    const utcDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
    
    return utcDate.toISOString().replace('.000Z', '');
  }
};
