import axios from 'axios';
import { supabase } from './supabase';

/**
 * Serviço especializado para integração Meta Ads por Unidade
 * Busca credenciais específicas da unidade selecionada e calcula métricas completas
 */
class UnitMetaService {
  constructor() {
    // URLs e configurações base
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    this.supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';
    this.metaBaseUrl = 'https://graph.facebook.com/v18.0';
    
    // Configurações padrão (Apucarana)
    this.defaultUnit = {
      codigo_sprint: '[1]',
      name: 'Apucarana'
    };
    
    // Cache das credenciais da unidade atual
    this.currentUnitCredentials = null;
    this.currentUnitCode = null;
    
    console.log('🏢 UnitMetaService inicializado');
  }

  /**
   * Busca credenciais Meta da unidade específica no Supabase
   * @param {string} unitCode - Código da unidade (ex: "[1]")
   * @returns {Promise<Object>}
   */
  async getUnitCredentials(unitCode = null) {
    try {
      // Se não fornecido, usar Apucarana como padrão
      const targetUnitCode = unitCode || this.defaultUnit.codigo_sprint;
      
      console.log('🔍 Buscando credenciais Meta para unidade:', targetUnitCode);

      // Se já temos as credenciais em cache para esta unidade, retornar
      if (this.currentUnitCode === targetUnitCode && this.currentUnitCredentials) {
        console.log('✅ Usando credenciais em cache para unidade:', targetUnitCode);
        return this.currentUnitCredentials;
      }

      // Buscar credenciais da unidade no Supabase
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/unidades?select=codigo_sprint,unidade,meta_bm_id,meta_token,validade_token,meta_app_id&codigo_sprint=eq.${encodeURIComponent(targetUnitCode)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.supabaseServiceKey}`,
            'apikey': this.supabaseServiceKey,
            'Accept-Profile': this.supabaseSchema,
            'Content-Profile': this.supabaseSchema
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar unidade: ${response.status}`);
      }

      const unitData = await response.json();
      
      if (!unitData || unitData.length === 0) {
        console.log('⚠️ Unidade não encontrada, usando Apucarana como fallback');
        // Fallback para Apucarana se unidade não encontrada
        return this.getUnitCredentials(this.defaultUnit.codigo_sprint);
      }

      const unit = unitData[0];
      
      // Validar se a unidade tem credenciais Meta configuradas
      if (!unit.meta_bm_id || !unit.meta_token || !unit.meta_app_id) {
        throw new Error(`Unidade ${unit.unidade} não possui credenciais Meta configuradas`);
      }

      // Verificar se o token ainda é válido
      const tokenValidation = await this.validateToken(unit.meta_token);
      if (!tokenValidation.valid) {
        throw new Error(`Token Meta da unidade ${unit.unidade} é inválido ou expirado`);
      }

      // Armazenar credenciais em cache
      this.currentUnitCredentials = {
        businessId: unit.meta_bm_id,
        accessToken: unit.meta_token,
        appId: unit.meta_app_id,
        validUntil: unit.validade_token,
        unitName: unit.unidade,
        unitCode: unit.codigo_sprint
      };
      
      this.currentUnitCode = targetUnitCode;

      console.log('✅ Credenciais Meta carregadas para:', unit.unidade);
      console.log('📊 Business ID:', unit.meta_bm_id);
      console.log('🔑 App ID:', unit.meta_app_id);
      console.log('⏰ Token válido até:', unit.validade_token);

      return this.currentUnitCredentials;

    } catch (error) {
      console.error('❌ Erro ao buscar credenciais da unidade:', error);
      throw error;
    }
  }

  /**
   * Valida se o token Meta ainda é válido
   * @param {string} token - Token de acesso
   * @returns {Promise<Object>}
   */
  async validateToken(token) {
    try {
      const response = await axios.get('https://graph.facebook.com/debug_token', {
        params: {
          input_token: token,
          access_token: token
        }
      });

      const isValid = response.data.data.is_valid;
      return { 
        valid: isValid, 
        data: response.data.data 
      };
    } catch (error) {
      console.error('❌ Erro ao validar token Meta:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Busca campanhas Meta que começam com [OficialMedPro]
   * @param {Object} dateRange - Período {since: 'YYYY-MM-DD', until: 'YYYY-MM-DD'}
   * @param {string} unitCode - Código da unidade
   * @returns {Promise<Object>}
   */
  async getOficialMedProCampaigns(dateRange, unitCode = null) {
    try {
      console.log('🎯 Buscando campanhas [OficialMedPro] para período:', dateRange);

      // Obter credenciais da unidade
      const credentials = await this.getUnitCredentials(unitCode);
      
      // Buscar contas de anúncios do Business Manager
      const adAccountsResponse = await axios.get(
        `${this.metaBaseUrl}/${credentials.businessId}/owned_ad_accounts`,
        {
          params: {
            access_token: credentials.accessToken,
            fields: 'id,name,account_status,account_id',
            limit: 100
          }
        }
      );

      const adAccounts = adAccountsResponse.data.data || [];
      const activeAccounts = adAccounts.filter(account => 
        account.account_status === 1 || account.account_status === 2
      );

      if (activeAccounts.length === 0) {
        throw new Error('Nenhuma conta de anúncios ativa encontrada');
      }

      // Usar a primeira conta ativa
      const firstAccount = activeAccounts[0];
      const workingAccountId = (firstAccount.account_id || firstAccount.id).startsWith('act_') 
        ? (firstAccount.account_id || firstAccount.id)
        : `act_${firstAccount.account_id || firstAccount.id}`;

      console.log('🎯 Usando conta Meta:', workingAccountId, '(', firstAccount.name, ')');

      // Buscar todas as campanhas com insights
      const campaignsResponse = await axios.get(
        `${this.metaBaseUrl}/${workingAccountId}/campaigns`,
        {
          params: {
            access_token: credentials.accessToken,
            limit: 500,
            fields: `name,insights.time_range({"since":"${dateRange.since}","until":"${dateRange.until}"}){spend,actions,action_values,impressions,clicks,reach}`
          }
        }
      );

      const allCampaigns = campaignsResponse.data.data || [];
      console.log('✅ Total campanhas encontradas:', allCampaigns.length);

      // Filtrar apenas campanhas que começam com [OficialMedPro]
      const oficialMedProCampaigns = allCampaigns.filter(campaign => 
        campaign.name && campaign.name.startsWith('[OficialMedPro]')
      );

      console.log('🎯 Campanhas [OficialMedPro] encontradas:', oficialMedProCampaigns.length);

      // Processar dados das campanhas
      let totalSpend = 0;
      let totalLeads = 0;
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalReach = 0;

      console.log('🔍 PROCESSAMENTO DETALHADO POR CAMPANHA:');
      console.log('==========================================');

      oficialMedProCampaigns.forEach((campaign, index) => {
        if (campaign.insights && campaign.insights.data && campaign.insights.data.length > 0) {
          const insights = campaign.insights.data[0];
          
          // Somar gastos
          const spend = parseFloat(insights.spend) || 0;
          totalSpend += spend;
          
          // Somar impressões, cliques, alcance
          const campaignImpressions = parseInt(insights.impressions) || 0;
          const campaignClicks = parseInt(insights.clicks) || 0;
          const campaignReach = parseInt(insights.reach) || 0;
          
          totalImpressions += campaignImpressions;
          totalClicks += campaignClicks;
          totalReach += campaignReach;
          
          // Calcular leads DESTA CAMPANHA (não acumulativo)
          let campaignLeads = 0;
          if (insights.actions) {
            const leadActions = insights.actions.filter(action => 
              action.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
              action.action_type === 'lead' ||
              action.action_type === 'onsite_conversion.lead_grouped'
            );
            
            leadActions.forEach(action => {
              campaignLeads += parseInt(action.value) || 0;
            });
          }
          
          // Somar ao total
          totalLeads += campaignLeads;
          
          console.log(`📊 ${index + 1}. Campanha: ${campaign.name}`);
          console.log(`   💰 Gasto: $${spend.toFixed(2)}`);
          console.log(`   👥 Leads desta campanha: ${campaignLeads}`);
          console.log(`   👁️ Impressões: ${campaignImpressions.toLocaleString()}`);
          console.log(`   👆 Cliques: ${campaignClicks}`);
          console.log(`   🎯 Total leads acumulado: ${totalLeads}`);
          
          // Verificar se há actions suspeitas
          if (insights.actions) {
            console.log(`   📋 Actions disponíveis:`);
            insights.actions.forEach(action => {
              console.log(`      - ${action.action_type}: ${action.value}`);
            });
          } else {
            console.log(`   ⚠️ Nenhuma action encontrada para esta campanha`);
          }
          
          console.log(`   ---`);
        } else {
          console.log(`📊 ${index + 1}. Campanha: ${campaign.name} - SEM INSIGHTS`);
        }
      });

      console.log('==========================================');
      console.log(`🎯 TOTAIS FINAIS:`);
      console.log(`   💰 Gasto Total: $${totalSpend.toFixed(2)}`);
      console.log(`   👥 Leads Total: ${totalLeads}`);
      console.log(`   👁️ Impressões Total: ${totalImpressions.toLocaleString()}`);
      console.log(`   👆 Cliques Total: ${totalClicks}`);
      console.log('==========================================');

      return {
        campaigns: oficialMedProCampaigns,
        totalCampaigns: oficialMedProCampaigns.length,
        totalSpend,
        totalLeads,
        totalImpressions,
        totalClicks,
        totalReach,
        accountInfo: {
          accountId: workingAccountId,
          accountName: firstAccount.name,
          businessId: credentials.businessId,
          unitName: credentials.unitName
        },
        period: dateRange,
        credentials: credentials
      };

    } catch (error) {
      console.error('❌ Erro ao buscar campanhas [OficialMedPro]:', error);
      throw error;
    }
  }

  /**
   * Busca dados de oportunidades Meta Ads no Supabase
   * @param {Object} dateRange - Período {since: 'YYYY-MM-DD', until: 'YYYY-MM-DD'}
   * @param {string} unitCode - Código da unidade (opcional)
   * @param {Object} campaignFilter - Filtros específicos {campaignName, adSetId, adId}
   * @returns {Promise<Object>}
   */
  async getMetaAdsOpportunities(dateRange, unitCode = null, campaignFilter = null) {
    try {
      console.log('🔍 Buscando oportunidades Meta Ads no período:', dateRange);

      // Construir filtros baseados na unidade se fornecida
      let unitFilter = '';
      if (unitCode && unitCode !== 'all') {
        // Remover colchetes do código se existirem para comparar com unidade_id
        const cleanUnitCode = unitCode.replace(/[\[\]]/g, '');
        unitFilter = `&unidade_id=eq.%5B${cleanUnitCode}%5D`;
      }

      // Construir filtros específicos de campanha 
      let campaignFilterStr = '';
      if (campaignFilter && campaignFilter.campaignName !== 'all') {
        console.log('🎯 Tentando aplicar filtros específicos:', campaignFilter);
        console.log('⚠️ ATENÇÃO: Filtros por campanha temporariamente desabilitados');
        console.log('📋 Motivo: Dados UTM (utm_campaign, utm_content, utm_source, utm_term) ainda não estão sendo preenchidos');
        console.log('🔜 TODO: Implementar filtros por UTMs quando dados estiverem disponíveis');
        
        // Filtros desabilitados temporariamente até UTMs serem implementadas
        // if (campaignFilter.campaignName) {
        //   campaignFilterStr = `&utm_campaign=ilike.*${encodeURIComponent(campaignFilter.campaignName)}*`;
        // }
        // if (campaignFilter.adSetId) {
        //   campaignFilterStr += `&utm_content=eq.${campaignFilter.adSetId}`;
        // }
        // if (campaignFilter.adId) {
        //   campaignFilterStr += `&utm_term=eq.${campaignFilter.adId}`;
        // }
      }

      // URLs para diferentes status
      // TODO: Adicionar campos UTM quando disponíveis: utm_campaign,utm_content,utm_source,utm_term
      const baseUrl = `${this.supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value,status,create_date,gain_date,lost_date,observacoes&origem_oportunidade=eq.Meta Ads${unitFilter}${campaignFilterStr}`;
      
      const ganhAsUrl = `${baseUrl}&status=eq.gain&gain_date=gte.${dateRange.since}&gain_date=lte.${dateRange.until}T23:59:59`;
      const perdidasUrl = `${baseUrl}&status=eq.lost&lost_date=gte.${dateRange.since}&lost_date=lte.${dateRange.until}T23:59:59`;
      const abertasUrl = `${baseUrl}&status=eq.open`;

      console.log('🔍 URLs de consulta:');
      console.log('  - Ganhas:', ganhAsUrl);
      console.log('  - Perdidas:', perdidasUrl);
      console.log('  - Abertas:', abertasUrl);

      // Executar consultas em paralelo
      const [ganhAsResponse, perdidasResponse, abertasResponse] = await Promise.all([
        fetch(ganhAsUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.supabaseServiceKey}`,
            'apikey': this.supabaseServiceKey,
            'Accept-Profile': this.supabaseSchema,
            'Content-Profile': this.supabaseSchema
          }
        }),
        fetch(perdidasUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.supabaseServiceKey}`,
            'apikey': this.supabaseServiceKey,
            'Accept-Profile': this.supabaseSchema,
            'Content-Profile': this.supabaseSchema
          }
        }),
        fetch(abertasUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.supabaseServiceKey}`,
            'apikey': this.supabaseServiceKey,
            'Accept-Profile': this.supabaseSchema,
            'Content-Profile': this.supabaseSchema
          }
        })
      ]);

      // Processar resultados e fazer debug
      let ganhAsData = [];
      let perdidasData = [];
      let abertasData = [];

      // Debug detalhado das respostas
      if (ganhAsResponse.ok) {
        ganhAsData = await ganhAsResponse.json();
        console.log('✅ Resposta Ganhas - Status:', ganhAsResponse.status, 'Total:', ganhAsData.length);
      } else {
        console.error('❌ Erro na consulta Ganhas - Status:', ganhAsResponse.status);
        const errorText = await ganhAsResponse.text();
        console.error('❌ Erro detalhado:', errorText);
      }

      if (perdidasResponse.ok) {
        perdidasData = await perdidasResponse.json();
        console.log('✅ Resposta Perdidas - Status:', perdidasResponse.status, 'Total:', perdidasData.length);
      } else {
        console.error('❌ Erro na consulta Perdidas - Status:', perdidasResponse.status);
        const errorText = await perdidasResponse.text();
        console.error('❌ Erro detalhado:', errorText);
      }

      if (abertasResponse.ok) {
        abertasData = await abertasResponse.json();
        console.log('✅ Resposta Abertas - Status:', abertasResponse.status, 'Total:', abertasData.length);
      } else {
        console.error('❌ Erro na consulta Abertas - Status:', abertasResponse.status);
        const errorText = await abertasResponse.text();
        console.error('❌ Erro detalhado:', errorText);
      }

      // Calcular métricas
      const oportunidadesFechadas = ganhAsData.length;
      
      // Debug detalhado das oportunidades ganhas
      if (ganhAsData.length > 0) {
        console.log('🔍 Primeiras oportunidades ganhas:', ganhAsData.slice(0, 3));
      } else {
        console.log('⚠️ NENHUMA oportunidade ganha encontrada - possíveis problemas:');
        console.log('  1. Campo origem_oportunidade não está exatamente como "Meta Ads"');
        console.log('  2. Datas gain_date fora do período consultado');
        console.log('  3. Unidade_id não está no formato correto');
        console.log('  4. Schema ou tabela incorretos');
      }
      
      const valorGanho = ganhAsData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);

      const oportunidadesPerdidas = perdidasData.length;
      const valorPerda = perdidasData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);

      const oportunidadesAbertas = abertasData.length;

      console.log('📊 Oportunidades Meta Ads processadas:');
      console.log(`  ✅ Fechadas: ${oportunidadesFechadas} (R$ ${valorGanho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
      console.log(`  ❌ Perdidas: ${oportunidadesPerdidas} (R$ ${valorPerda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
      console.log(`  🟡 Abertas: ${oportunidadesAbertas}`);

      // Debug adicional para investigar Taxa de Conversão
      console.log('🔍 DEBUG - Taxa de Conversão:');
      console.log(`  📊 Total de oportunidades encontradas: ${oportunidadesFechadas + oportunidadesPerdidas + oportunidadesAbertas}`);
      console.log(`  📅 Período consultado: ${dateRange.since} até ${dateRange.until}`);
      console.log(`  🏢 Unidade consultada: ${unitCode || 'Todas'}`);
      console.log(`  🔗 Origem consultada: "Meta Ads"`);
      
      // Mostrar URLs completas para debug
      console.log('🔍 URLs executadas:');
      console.log('  - Ganhas:', ganhAsUrl.substring(0, 200) + '...');
      console.log('  - Perdidas:', perdidasUrl.substring(0, 200) + '...');
      console.log('  - Abertas:', abertasUrl.substring(0, 200) + '...');

      return {
        oportunidadesFechadas,
        valorGanho,
        oportunidadesPerdidas,
        valorPerda,
        oportunidadesAbertas,
        periodo: dateRange,
        unitFilter: unitCode
      };

    } catch (error) {
      console.error('❌ Erro ao buscar oportunidades Meta Ads:', error);
      throw error;
    }
  }

  /**
   * Calcula todas as métricas Meta Ads completas
   * @param {Object} dateRange - Período {since: 'YYYY-MM-DD', until: 'YYYY-MM-DD'}
   * @param {string} unitCode - Código da unidade
   * @param {Object} campaignFilter - Filtros específicos {campaignName, adSetId, adId}
   * @returns {Promise<Object>}
   */
  async getCompleteMetaMetrics(dateRange, unitCode = null, campaignFilter = null) {
    try {
      console.log('📊 Calculando métricas completas Meta Ads...');
      console.log('📅 Período:', dateRange);
      console.log('🏢 Unidade:', unitCode || 'Apucarana (padrão)');

      // Log dos filtros aplicados
      if (campaignFilter) {
        console.log('🎯 Filtros específicos:', campaignFilter);
      }

      // Buscar dados em paralelo
      const [metaCampaignsData, supabaseOpportunities] = await Promise.all([
        this.getOficialMedProCampaigns(dateRange, unitCode),
        this.getMetaAdsOpportunities(dateRange, unitCode, campaignFilter)
      ]);

      // Dados das campanhas Meta
      const totalInvestido = metaCampaignsData.totalSpend;
      const leadsGerados = metaCampaignsData.totalLeads;

      // DEBUG DETALHADO - Leads por período
      console.log('🔍 DEBUG - Análise de Leads por Período:');
      console.log('==========================================');
      console.log(`📅 Período consultado: ${dateRange.since} até ${dateRange.until}`);
      console.log(`📊 Leads encontrados: ${leadsGerados}`);
      console.log(`💰 Valor investido: $${totalInvestido.toFixed(2)}`);
      console.log(`📈 Campanhas processadas: ${metaCampaignsData.totalCampaigns}`);
      
      // Calcular dias no período
      const startDateObj = new Date(dateRange.since);
      const endDateObj = new Date(dateRange.until);
      const diffTime = Math.abs(endDateObj - startDateObj);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      console.log(`📆 Total de dias no período: ${diffDays}`);
      console.log(`📊 Média de leads por dia: ${(leadsGerados / diffDays).toFixed(2)}`);
      
      // Debug das campanhas individuais
      if (metaCampaignsData.campaigns && metaCampaignsData.campaigns.length > 0) {
        console.log('🎯 Detalhes das campanhas:');
        metaCampaignsData.campaigns.forEach((campaign, index) => {
          const insights = campaign.insights?.data?.[0];
          const campaignSpend = parseFloat(insights?.spend || 0);
          const campaignImpressions = parseInt(insights?.impressions || 0);
          const campaignClicks = parseInt(insights?.clicks || 0);
          
          // Calcular leads desta campanha específica
          let campaignLeads = 0;
          if (insights?.actions) {
            const leadActions = insights.actions.filter(action => 
              action.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
              action.action_type === 'lead' ||
              action.action_type === 'onsite_conversion.lead_grouped'
            );
            
            leadActions.forEach(action => {
              campaignLeads += parseInt(action.value) || 0;
            });
          }
          
          console.log(`  ${index + 1}. ${campaign.name}:`);
          console.log(`     💰 Gasto: $${campaignSpend.toFixed(2)}`);
          console.log(`     👥 Leads: ${campaignLeads}`);
          console.log(`     👁️ Impressões: ${campaignImpressions.toLocaleString()}`);
          console.log(`     👆 Cliques: ${campaignClicks}`);
          
          // Alertas para campanhas suspeitas
          if (campaignLeads > 100 && campaignSpend < 10) {
            console.log(`     🚨 SUSPEITO: Muitos leads (${campaignLeads}) com baixo gasto ($${campaignSpend})`);
          }
          if (campaignLeads > campaignClicks) {
            console.log(`     🚨 SUSPEITO: Mais leads (${campaignLeads}) que cliques (${campaignClicks})`);
          }
        });
      }

      console.log('==========================================');

      // Dados das oportunidades Supabase
      const oportunidadesFechadas = supabaseOpportunities.oportunidadesFechadas;
      const valorGanho = supabaseOpportunities.valorGanho;
      const oportunidadesPerdidas = supabaseOpportunities.oportunidadesPerdidas;
      const valorPerda = supabaseOpportunities.valorPerda;
      const oportunidadesAbertas = supabaseOpportunities.oportunidadesAbertas;

      // Calcular métricas derivadas
      const taxaConversao = leadsGerados > 0 ? (oportunidadesFechadas / leadsGerados) * 100 : 0;
      const roas = totalInvestido > 0 ? valorGanho / totalInvestido : 0;

      // Métricas finais
      const metrics = {
        // Dados brutos
        totalInvestido,
        leadsGerados,
        oportunidadesFechadas,
        valorGanho,
        oportunidadesPerdidas,
        valorPerda,
        oportunidadesAbertas,
        
        // Métricas calculadas
        taxaConversao,
        roas,
        
        // Dados contextuais
        campanhas: {
          total: metaCampaignsData.totalCampaigns,
          detalhes: metaCampaignsData.campaigns.map(c => ({
            name: c.name,
            spend: c.insights?.data?.[0]?.spend || 0
          }))
        },
        
        accountInfo: metaCampaignsData.accountInfo,
        periodo: dateRange,
        unidade: unitCode || this.defaultUnit.codigo_sprint,
        timestamp: new Date().toISOString()
      };

      console.log('🎯 MÉTRICAS FINAIS CALCULADAS:');
      console.log('==========================================');
      console.log(`💰 Total Investido: R$ ${totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`👥 Leads Gerados: ${leadsGerados}`);
      console.log(`✅ Oportunidades Fechadas: ${oportunidadesFechadas}`);
      console.log(`📈 Taxa de Conversão: ${taxaConversao.toFixed(2)}%`);
      console.log(`🎯 ROAS: ${roas.toFixed(2)}x`);
      console.log(`💚 Valor Ganho: R$ ${valorGanho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`❌ Oportunidades Perdidas: ${oportunidadesPerdidas}`);
      console.log(`💔 Valor Perda: R$ ${valorPerda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`🟡 Oportunidades Abertas: ${oportunidadesAbertas}`);
      console.log(`🏢 Conta: ${metaCampaignsData.accountInfo.accountName}`);
      console.log('==========================================');

      return metrics;

    } catch (error) {
      console.error('❌ Erro ao calcular métricas completas:', error);
      throw error;
    }
  }

  /**
   * Busca grupos de anúncios (AdSets) de uma campanha específica
   * @param {string} campaignId - ID da campanha
   * @param {string} unitCode - Código da unidade (opcional)
   * @returns {Promise<Array>}
   */
  async getCampaignAdSets(campaignId, unitCode = null) {
    try {
      console.log('🔍 Buscando grupos de anúncios da campanha:', campaignId);

      // Obter credenciais da unidade
      const credentials = await this.getUnitCredentials(unitCode);

      // Buscar adSets da campanha
      const response = await axios.get(
        `${this.metaBaseUrl}/${campaignId}/adsets`,
        {
          params: {
            access_token: credentials.accessToken,
            limit: 100,
            fields: 'id,name,status,optimization_goal,billing_event,bid_amount,daily_budget,lifetime_budget'
          }
        }
      );

      const adSets = response.data.data || [];
      console.log(`✅ Grupos de anúncios encontrados: ${adSets.length}`);

      return adSets.map(adSet => ({
        id: adSet.id,
        name: adSet.name,
        status: adSet.status,
        optimization_goal: adSet.optimization_goal,
        daily_budget: adSet.daily_budget,
        lifetime_budget: adSet.lifetime_budget
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar grupos de anúncios:', error);
      
      // Se for erro de permissão, retornar array vazio
      if (error.response?.data?.error?.code === 100) {
        console.warn('⚠️ Sem permissão para acessar grupos desta campanha');
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Busca anúncios de um grupo específico (AdSet)
   * @param {string} adSetId - ID do grupo de anúncios
   * @param {string} unitCode - Código da unidade (opcional)
   * @returns {Promise<Array>}
   */
  async getAdSetAds(adSetId, unitCode = null) {
    try {
      console.log('🔍 Buscando anúncios do grupo:', adSetId);

      // Obter credenciais da unidade
      const credentials = await this.getUnitCredentials(unitCode);

      // Buscar anúncios do grupo
      const response = await axios.get(
        `${this.metaBaseUrl}/${adSetId}/ads`,
        {
          params: {
            access_token: credentials.accessToken,
            limit: 100,
            fields: 'id,name,status,creative,adset_id,campaign_id,created_time,updated_time'
          }
        }
      );

      const ads = response.data.data || [];
      console.log(`✅ Anúncios encontrados: ${ads.length}`);

      return ads.map(ad => ({
        id: ad.id,
        name: ad.name,
        status: ad.status,
        adset_id: ad.adset_id,
        campaign_id: ad.campaign_id,
        created_time: ad.created_time,
        updated_time: ad.updated_time
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar anúncios:', error);
      
      // Se for erro de permissão, retornar array vazio
      if (error.response?.data?.error?.code === 100) {
        console.warn('⚠️ Sem permissão para acessar anúncios deste grupo');
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Busca gasto de uma campanha específica com insights
   * @param {string} campaignId - ID da campanha
   * @param {Object} dateRange - Período
   * @param {string} unitCode - Código da unidade (opcional)
   * @returns {Promise<Object>}
   */
  async getCampaignInsights(campaignId, dateRange, unitCode = null) {
    try {
      console.log('💰 Buscando gasto da campanha:', campaignId);

      // Obter credenciais da unidade
      const credentials = await this.getUnitCredentials(unitCode);

      // Buscar insights da campanha
      const response = await axios.get(
        `${this.metaBaseUrl}/${campaignId}/insights`,
        {
          params: {
            access_token: credentials.accessToken,
            fields: 'spend,actions,action_values,impressions,clicks,reach',
            time_range: JSON.stringify(dateRange),
            limit: 1
          }
        }
      );

      const insights = response.data.data?.[0] || {};
      const spend = parseFloat(insights.spend) || 0;
      
      console.log(`✅ Gasto da campanha: $${spend.toFixed(2)}`);
      
      return {
        spend,
        insights
      };

    } catch (error) {
      console.error('❌ Erro ao buscar insights da campanha:', error);
      return { spend: 0, insights: null };
    }
  }

  /**
   * Busca gasto de um grupo de anúncios específico
   * @param {string} adSetId - ID do grupo
   * @param {Object} dateRange - Período
   * @param {string} unitCode - Código da unidade (opcional)
   * @returns {Promise<Object>}
   */
  async getAdSetInsights(adSetId, dateRange, unitCode = null) {
    try {
      console.log('💰 Buscando gasto do grupo:', adSetId);

      // Obter credenciais da unidade
      const credentials = await this.getUnitCredentials(unitCode);

      // Buscar insights do grupo
      const response = await axios.get(
        `${this.metaBaseUrl}/${adSetId}/insights`,
        {
          params: {
            access_token: credentials.accessToken,
            fields: 'spend,actions,action_values,impressions,clicks,reach',
            time_range: JSON.stringify(dateRange),
            limit: 1
          }
        }
      );

      const insights = response.data.data?.[0] || {};
      const spend = parseFloat(insights.spend) || 0;
      
      console.log(`✅ Gasto do grupo: $${spend.toFixed(2)}`);
      
      return {
        spend,
        insights
      };

    } catch (error) {
      console.error('❌ Erro ao buscar insights do grupo:', error);
      return { spend: 0, insights: null };
    }
  }

  /**
   * Busca gasto de um anúncio específico
   * @param {string} adId - ID do anúncio
   * @param {Object} dateRange - Período
   * @param {string} unitCode - Código da unidade (opcional)
   * @returns {Promise<Object>}
   */
  async getAdInsights(adId, dateRange, unitCode = null) {
    try {
      console.log('💰 Buscando gasto do anúncio:', adId);

      // Obter credenciais da unidade
      const credentials = await this.getUnitCredentials(unitCode);

      // Buscar insights do anúncio
      const response = await axios.get(
        `${this.metaBaseUrl}/${adId}/insights`,
        {
          params: {
            access_token: credentials.accessToken,
            fields: 'spend,actions,action_values,impressions,clicks,reach',
            time_range: JSON.stringify(dateRange),
            limit: 1
          }
        }
      );

      const insights = response.data.data?.[0] || {};
      const spend = parseFloat(insights.spend) || 0;
      
      console.log(`✅ Gasto do anúncio ${adId}: $${spend.toFixed(2)}`);
      console.log(`📊 Insights completos:`, insights);
      
      // Log adicional se gasto for zero
      if (spend === 0) {
        console.log(`⚠️ Anúncio ${adId} não teve gastos no período ${JSON.stringify(dateRange)}`);
        console.log(`🔍 Possíveis motivos: anúncio pausado, sem impressões, ou sem budget alocado`);
      }
      
      return {
        spend,
        insights
      };

    } catch (error) {
      console.error('❌ Erro ao buscar insights do anúncio:', error);
      return { spend: 0, insights: null };
    }
  }

  /**
   * Testa consultas específicas no Supabase para debug da Taxa de Conversão
   * @param {string} unitCode - Código da unidade
   * @returns {Promise<Object>}
   */
  async testSupabaseQueries(unitCode = null) {
    try {
      console.log('🔍 TESTE DE CONSULTAS SUPABASE - Taxa de Conversão');
      console.log('================================================');
      
      const targetUnit = unitCode || '[1]'; // Apucarana por padrão
      console.log('🏢 Testando para unidade:', targetUnit);
      
      // Teste 1: Consulta básica sem filtros de data
      const basicUrl = `${this.supabaseUrl}/rest/v1/oportunidade_sprint?select=id,origem_oportunidade,status&origem_oportunidade=eq.Meta Ads&limit=5`;
      console.log('📋 Teste 1 - Consulta básica:', basicUrl);
      
      const basicResponse = await fetch(basicUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
          'apikey': this.supabaseServiceKey,
          'Accept-Profile': this.supabaseSchema,
          'Content-Profile': this.supabaseSchema
        }
      });
      
      if (basicResponse.ok) {
        const basicData = await basicResponse.json();
        console.log('✅ Teste 1 OK - Total encontrado:', basicData.length);
        console.log('📊 Amostra:', basicData);
      } else {
        console.error('❌ Teste 1 FALHOU - Status:', basicResponse.status);
        console.error('❌ Erro:', await basicResponse.text());
      }
      
      // Teste 2: Consulta com filtro de unidade
      const unitUrl = `${this.supabaseUrl}/rest/v1/oportunidade_sprint?select=id,origem_oportunidade,status,unidade_id&origem_oportunidade=eq.Meta Ads&unidade_id=eq.${encodeURIComponent(targetUnit)}&limit=5`;
      console.log('📋 Teste 2 - Com filtro unidade:', unitUrl);
      
      const unitResponse = await fetch(unitUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
          'apikey': this.supabaseServiceKey,
          'Accept-Profile': this.supabaseSchema,
          'Content-Profile': this.supabaseSchema
        }
      });
      
      if (unitResponse.ok) {
        const unitData = await unitResponse.json();
        console.log('✅ Teste 2 OK - Total encontrado:', unitData.length);
        console.log('📊 Amostra:', unitData);
      } else {
        console.error('❌ Teste 2 FALHOU - Status:', unitResponse.status);
        console.error('❌ Erro:', await unitResponse.text());
      }
      
      // Teste 3: Consulta de contagem por status
      const countUrl = `${this.supabaseUrl}/rest/v1/oportunidade_sprint?select=status&origem_oportunidade=eq.Meta Ads`;
      console.log('📋 Teste 3 - Contagem por status:', countUrl);
      
      const countResponse = await fetch(countUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
          'apikey': this.supabaseServiceKey,
          'Accept-Profile': this.supabaseSchema,
          'Content-Profile': this.supabaseSchema
        }
      });
      
      if (countResponse.ok) {
        const countData = await countResponse.json();
        const statusCount = countData.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
        console.log('✅ Teste 3 OK - Contagem por status:', statusCount);
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro no teste de consultas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Testa a conexão e configuração para uma unidade específica
   * @param {string} unitCode - Código da unidade
   * @returns {Promise<Object>}
   */
  async testUnitConnection(unitCode = null) {
    try {
      console.log('🔍 Testando conexão Meta para unidade:', unitCode || 'Apucarana (padrão)');

      // Obter credenciais
      const credentials = await this.getUnitCredentials(unitCode);
      
      // Testar acesso ao Business Manager
      const businessResponse = await axios.get(
        `${this.metaBaseUrl}/${credentials.businessId}`,
        {
          params: {
            access_token: credentials.accessToken,
            fields: 'id,name,verification_status'
          }
        }
      );

      console.log('✅ Teste de conexão bem-sucedido!');
      return {
        success: true,
        unitName: credentials.unitName,
        businessName: businessResponse.data.name,
        businessId: credentials.businessId,
        appId: credentials.appId
      };

    } catch (error) {
      console.error('❌ Teste de conexão falhou:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Exportar instância única do serviço
export const unitMetaService = new UnitMetaService();

// Exportar também a classe para casos específicos
export default UnitMetaService;