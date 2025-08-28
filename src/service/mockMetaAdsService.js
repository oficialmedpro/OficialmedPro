/**
 * Service Mock para demonstração do Meta Ads Dashboard
 * Simula dados reais da API do Facebook Ads para desenvolvimento
 */

// Dados simulados de campanhas
const mockCampaigns = [
  {
    id: "120210000001234567",
    name: "🎯 LONDRINA - Leads Qualificados - Agosto 2025",
    status: "ACTIVE",
    objective: "OUTCOME_LEADS",
    budget_remaining: 150000, // centavos
    budget_remaining_currency: "BRL",
    spend_cap: null,
    spend_cap_currency: null,
    daily_budget: 5000, // centavos  
    daily_budget_currency: "BRL",
    lifetime_budget: 200000, // centavos
    lifetime_budget_currency: "BRL",
    created_time: "2025-08-01T10:00:00-0300",
    updated_time: "2025-08-28T14:30:00-0300",
    start_time: "2025-08-01T10:00:00-0300",
    stop_time: null,
    insights: {
      impressions: 45830,
      clicks: 2275,
      spend: 8750.50,
      reach: 28450,
      frequency: 1.61,
      cpm: 19.09,
      cpc: 3.85,
      ctr: 4.97,
      actions: [
        { action_type: "onsite_conversion.messaging_conversation_started_7d", value: "127" },
        { action_type: "link_click", value: "2275" },
        { action_type: "post_engagement", value: "892" }
      ]
    }
  },
  {
    id: "120210000001234568",
    name: "🛍️ APUCARANA - Vendas Setembro - Black Friday Prep",
    status: "ACTIVE", 
    objective: "CONVERSIONS",
    budget_remaining: 95000,
    budget_remaining_currency: "BRL",
    daily_budget: 8000,
    daily_budget_currency: "BRL",
    lifetime_budget: 350000,
    lifetime_budget_currency: "BRL",
    created_time: "2025-08-15T09:00:00-0300",
    updated_time: "2025-08-28T16:45:00-0300",
    start_time: "2025-08-15T09:00:00-0300",
    stop_time: "2025-09-30T23:59:59-0300",
    insights: {
      impressions: 62150,
      clicks: 1845,
      spend: 12340.80,
      reach: 35200,
      frequency: 1.77,
      cpm: 19.87,
      cpc: 6.69,
      ctr: 2.97,
      actions: [
        { action_type: "onsite_conversion.messaging_conversation_started_7d", value: "89" },
        { action_type: "offsite_conversion.fb_pixel_purchase", value: "23" },
        { action_type: "link_click", value: "1845" }
      ]
    }
  },
  {
    id: "120210000001234569",
    name: "📍 BOM JESUS - Awareness Campanha Regional",
    status: "PAUSED",
    objective: "REACH",
    budget_remaining: 75000,
    budget_remaining_currency: "BRL",
    daily_budget: 3000,
    daily_budget_currency: "BRL",
    lifetime_budget: 120000,
    lifetime_budget_currency: "BRL",
    created_time: "2025-07-20T08:30:00-0300",
    updated_time: "2025-08-25T11:20:00-0300",
    start_time: "2025-07-20T08:30:00-0300",
    stop_time: null,
    insights: {
      impressions: 98750,
      clicks: 895,
      spend: 4580.25,
      reach: 67300,
      frequency: 1.47,
      cpm: 4.64,
      cpc: 5.12,
      ctr: 0.91,
      actions: [
        { action_type: "onsite_conversion.messaging_conversation_started_7d", value: "34" },
        { action_type: "link_click", value: "895" },
        { action_type: "post_reaction", value: "445" }
      ]
    }
  },
  {
    id: "120210000001234570",
    name: "🏥 BALNEÁRIO CAMBORIÚ - Especialidades Médicas",
    status: "ACTIVE",
    objective: "OUTCOME_LEADS",
    budget_remaining: 85000,
    budget_remaining_currency: "BRL",
    daily_budget: 4500,
    daily_budget_currency: "BRL",
    lifetime_budget: 180000,
    lifetime_budget_currency: "BRL",
    created_time: "2025-08-10T12:00:00-0300",
    updated_time: "2025-08-28T18:10:00-0300",
    start_time: "2025-08-10T12:00:00-0300",
    stop_time: null,
    insights: {
      impressions: 38920,
      clicks: 1650,
      spend: 6789.40,
      reach: 24800,
      frequency: 1.57,
      cpm: 17.45,
      cpc: 4.11,
      ctr: 4.24,
      actions: [
        { action_type: "onsite_conversion.messaging_conversation_started_7d", value: "98" },
        { action_type: "link_click", value: "1650" },
        { action_type: "post_engagement", value: "567" }
      ]
    }
  },
  {
    id: "120210000001234571",
    name: "⚡ ARAPONGAS - Campanha Relâmpago - Desconto 30%",
    status: "ARCHIVED",
    objective: "CONVERSIONS",
    budget_remaining: 0,
    budget_remaining_currency: "BRL",
    daily_budget: 6000,
    daily_budget_currency: "BRL",
    lifetime_budget: 50000,
    lifetime_budget_currency: "BRL",
    created_time: "2025-07-01T06:00:00-0300",
    updated_time: "2025-07-15T23:59:00-0300",
    start_time: "2025-07-01T06:00:00-0300",
    stop_time: "2025-07-15T23:59:59-0300",
    insights: {
      impressions: 55600,
      clicks: 2890,
      spend: 4999.95,
      reach: 32100,
      frequency: 1.73,
      cpm: 8.99,
      cpc: 1.73,
      ctr: 5.20,
      actions: [
        { action_type: "onsite_conversion.messaging_conversation_started_7d", value: "156" },
        { action_type: "offsite_conversion.fb_pixel_purchase", value: "67" },
        { action_type: "link_click", value: "2890" }
      ]
    }
  }
];

class MockMetaAdsService {
  constructor() {
    this.appId = "MOCK_APP_ID";
    this.businessId = "MOCK_BUSINESS_ID";
    this.accessToken = "MOCK_ACCESS_TOKEN";
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    
    console.log('🎭 MockMetaAdsService inicializado com dados simulados');
  }

  isConfigured() {
    return true;
  }

  async getAccountInfo() {
    // Simula delay de API
    await this.delay(800);
    
    return {
      id: "act_2142222679331172",
      name: "OficialMed - Conta de Anúncios Principal",
      account_status: 1,
      currency: "BRL",
      timezone_name: "America/Sao_Paulo"
    };
  }

  async getCampaignsWithInsights(dateRange) {
    console.log('🎭 [MOCK] Buscando campanhas para período:', dateRange);
    
    // Simula delay de API
    await this.delay(1200);
    
    // Filtra campanhas baseado no período (simulação simples)
    const filteredCampaigns = mockCampaigns.filter(campaign => {
      const campaignDate = new Date(campaign.created_time);
      const sinceDate = new Date(dateRange.since);
      const untilDate = new Date(dateRange.until);
      return campaignDate >= sinceDate && campaignDate <= untilDate;
    });
    
    console.log('✅ [MOCK] Campanhas encontradas:', filteredCampaigns.length);
    return filteredCampaigns;
  }

  async getCampaigns() {
    console.log('🎭 [MOCK] Buscando campanhas básicas');
    await this.delay(900);
    
    // Retorna campanhas sem insights
    const campaignsWithoutInsights = mockCampaigns.map(({ insights, ...campaign }) => campaign);
    
    return campaignsWithoutInsights;
  }

  async getCampaignInsights(campaignId, dateRange) {
    await this.delay(600);
    
    const campaign = mockCampaigns.find(c => c.id === campaignId);
    return campaign?.insights || null;
  }

  async getMetaStats(dateRange, searchTerm = '') {
    console.log('📊 [MOCK] Calculando estatísticas para:', dateRange, 'termo:', searchTerm);
    await this.delay(1000);
    
    // Filtra campanhas baseado no termo de busca
    let relevantCampaigns = mockCampaigns;
    if (searchTerm) {
      relevantCampaigns = mockCampaigns.filter(campaign => 
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Calcula métricas
    let totalLeads = 0;
    let gastoTotal = 0;
    
    relevantCampaigns.forEach(campaign => {
      if (campaign.insights) {
        gastoTotal += campaign.insights.spend || 0;
        
        const leadAction = campaign.insights.actions?.find(action => 
          action.action_type === 'onsite_conversion.messaging_conversation_started_7d'
        );
        
        if (leadAction) {
          totalLeads += Number(leadAction.value) || 0;
        }
      }
    });
    
    // Calcula métricas ajustadas (-30%)
    const totalLeadsAjustado = Math.floor(totalLeads * 0.7);
    const custoMedioPorLead = totalLeads > 0 ? gastoTotal / totalLeads : 0;
    const custoMedioPorLeadAjustado = totalLeadsAjustado > 0 ? gastoTotal / totalLeadsAjustado : 0;
    
    const stats = {
      totalLeads,
      totalLeadsAjustado,
      gastoTotal,
      custoMedioPorLead,
      custoMedioPorLeadAjustado,
      dadosAnuncios: {
        total: mockCampaigns.length,
        filtrados: relevantCampaigns.length
      }
    };
    
    console.log('📈 [MOCK] Stats calculados:', stats);
    return stats;
  }

  async getMetaStatsForUnit(unidadeNome = '') {
    console.log('🏢 [MOCK] Buscando stats para unidade:', unidadeNome);
    await this.delay(1100);
    
    // Filtra campanhas por unidade (baseado no nome)
    const searchTerm = unidadeNome?.toLowerCase() || '';
    let relevantCampaigns = mockCampaigns;
    
    if (searchTerm) {
      relevantCampaigns = mockCampaigns.filter(campaign => 
        campaign.name.toLowerCase().includes(searchTerm)
      );
    }
    
    // Calcula métricas para a unidade
    let totalLeads = 0;
    let gastoTotal = 0;
    
    relevantCampaigns.forEach(campaign => {
      if (campaign.insights) {
        gastoTotal += campaign.insights.spend || 0;
        
        const leadAction = campaign.insights.actions?.find(action => 
          action.action_type === 'onsite_conversion.messaging_conversation_started_7d'
        );
        
        if (leadAction) {
          totalLeads += Number(leadAction.value) || 0;
        }
      }
    });
    
    const totalLeadsAjustado = Math.floor(totalLeads * 0.7);
    const custoMedioPorLead = totalLeads > 0 ? gastoTotal / totalLeads : 0;
    const custoMedioPorLeadAjustado = totalLeadsAjustado > 0 ? gastoTotal / totalLeadsAjustado : 0;
    
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      totalLeads,
      totalLeadsAjustado,
      gastoTotal,
      custoMedioPorLead,
      custoMedioPorLeadAjustado,
      dadosAnuncios: {
        total: mockCampaigns.length,
        filtrados: relevantCampaigns.length
      },
      campanhas: relevantCampaigns,
      periodo: {
        since: firstDay.toISOString().split('T')[0],
        until: lastDay.toISOString().split('T')[0]
      }
    };
  }

  async validateAccessToken() {
    await this.delay(500);
    
    return {
      valid: true,
      data: {
        app_id: "MOCK_APP_ID",
        is_valid: true,
        scopes: ["ads_read", "ads_management"],
        type: "USER"
      }
    };
  }

  handleApiError(error) {
    return new Error(error.message || 'Erro simulado da API');
  }

  // Método auxiliar para simular delay da API
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar instância mock
export const mockMetaAdsService = new MockMetaAdsService();
export default MockMetaAdsService;