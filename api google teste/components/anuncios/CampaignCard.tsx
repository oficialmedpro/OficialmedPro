import React, { useState, useEffect, useRef } from 'react';
import { Calendar, DollarSign, Target, TrendingUp, Eye, MousePointer, Users, UserCheck, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { MetaAdsCampaign } from '../../services/metaAdsService';
import { GoogleAdsCampaign } from '../../services/googleAdsService';
import { getLeadsMetricsByLojaNome, LojaLeadsMetrics } from '../../services/leadsService';
import './CampaignCard.css';

interface CampaignCardProps {
  campaign: MetaAdsCampaign | GoogleAdsCampaign;
  showInsights: boolean;
  dateRange: { since: string; until: string };
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, showInsights, dateRange }) => {
  const [showGeneralMetrics, setShowGeneralMetrics] = useState(false);
  const [lojaLeadsData, setLojaLeadsData] = useState<LojaLeadsMetrics | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(false);


  // Função para verificar se é uma campanha do Google Ads
  const isGoogleAdsCampaign = (campaign: MetaAdsCampaign | GoogleAdsCampaign): campaign is GoogleAdsCampaign => {
    return 'advertising_channel_type' in campaign;
  };

  // DEBUG: Log da campanha recebida com métricas reais
  React.useEffect(() => {
    if (isGoogleAdsCampaign(campaign)) {
      const hasRealMetrics = campaign.metrics && campaign.metrics.impressions > 0;
      console.log(`🎨 CARD: Renderizando campanha "${campaign.name}" ${hasRealMetrics ? '(MÉTRICAS REAIS)' : '(SEM MÉTRICAS)'}`);
      
      if (campaign.metrics && hasRealMetrics) {
        console.log('✅ CARD: Exibindo métricas REAIS:', {
          nome: campaign.name,
          impressions: campaign.metrics.impressions?.toLocaleString(),
          clicks: campaign.metrics.clicks?.toLocaleString(),
          custo: `R$ ${(campaign.metrics.cost_micros / 1000000).toFixed(2)}`,
          ctr: `${(campaign.metrics.ctr * 100).toFixed(2)}%`,
          conversions: campaign.metrics.conversions,
          conversions_value: `R$ ${campaign.metrics.conversions_value?.toFixed(2)}`
        });
      } else {
        console.log('⚠️ CARD: Campanha sem métricas ou métricas zeradas');
      }
    }
  }, [campaign]);


  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#10b981';
      case 'paused':
        return '#f59e0b';
      case 'deleted':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Ativa';
      case 'paused':
        return 'Pausada';
      case 'deleted':
        return 'Excluída';
      default:
        return status;
    }
  };

  const getObjectiveText = (objective: string) => {
    const objectives: Record<string, string> = {
      'OUTCOME_LEADS': 'Geração de Leads',
      'OUTCOME_SALES': 'Vendas',
      'OUTCOME_ENGAGEMENT': 'Engajamento',
      'OUTCOME_APP_PROMOTION': 'Promoção de App',
      'OUTCOME_AWARENESS': 'Reconhecimento',
      'OUTCOME_TRAFFIC': 'Tráfego',
      'OUTCOME_CONVERSIONS': 'Conversões'
    };
    return objectives[objective] || objective;
  };

  // Função para extrair o nome da loja do título da campanha
  const extractLojaNome = (campaignName: string): string | null => {
    // Padrões suportados:
    // 1. "[nome da loja] - data da campanha"
    // 2. "[nome da loja] data da campanha"
    // 3. "MSG NOME_DA_LOJA dd/mm" (novo padrão)
    
    // Primeiro, remove todos os colchetes
    const cleanName = campaignName.replace(/[\[\]]/g, '');
    
    // Padrão 1: Com hífen
    let match = cleanName.match(/^([^-]+)\s*-\s*/);
    if (match && match[1]) {
      const nomeExtraido = match[1].trim();
      return nomeExtraido.toLowerCase();
    }
    
    // Padrão 2: Formato "MSG NOME_DA_LOJA dd/mm"
    match = cleanName.match(/^MSG\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+?)\s+\d{1,2}\/\d{1,2}$/i);
    if (match && match[1]) {
      const nomeExtraido = match[1].trim();
      return nomeExtraido.toLowerCase();
    }
    
    // Padrão 3: Tudo antes da primeira data (formato dd/mm/yy ou dd/mm/yyyy)
    match = cleanName.match(/^([^0-9]+?)\s+\d{1,2}\/\d{1,2}(\/\d{2,4})?/);
    if (match && match[1]) {
      const nomeExtraido = match[1].trim();
      return nomeExtraido.toLowerCase();
    }
    
    return null;
  };

  // Função para calcular leads baseado nas actions
  const getLeadsCount = (insights: any) => {
    if (!insights?.actions) return 0;
    
    const leadAction = insights.actions.find((action: any) => 
      action.action_type === 'onsite_conversion.messaging_conversation_started_7d'
    );
    
    return leadAction ? Number(leadAction.value) || 0 : 0;
  };

  // Função para calcular taxa de conversão
  const getConversionRate = (insights: any) => {
    const leads = getLeadsCount(insights);
    const clicks = insights?.clicks || 0;
    
    return clicks > 0 ? (leads / clicks) * 100 : 0;
  };

  // Função para calcular custo por lead
  const getCostPerLead = (insights: any) => {
    const leads = getLeadsCount(insights);
    const spend = insights?.spend || 0;
    
    return leads > 0 ? spend / leads : 0;
  };

  const toggleGeneralMetrics = () => {
    setShowGeneralMetrics(!showGeneralMetrics);
  };

  // Evitar buscas repetidas: guarda a última chave buscada
  const lastFetchKeyRef = useRef<string | null>(null);

  // Buscar dados de leads da loja quando a campanha ou período mudar
  useEffect(() => {
    const fetchLojaLeads = async () => {
      if (!showInsights || !campaign.name) {
        return;
      }

      const lojaNome = extractLojaNome(campaign.name);
      if (!lojaNome) {
        return;
      }

      const fetchKey = `${lojaNome}__${dateRange.since}__${dateRange.until}`;
      if (lastFetchKeyRef.current === fetchKey) {
        return; // já buscado para esta combinação
      }

      lastFetchKeyRef.current = fetchKey;

      let isCancelled = false;
      setLoadingLeads(true);
      
      try {
        const leadsData = await getLeadsMetricsByLojaNome(lojaNome, dateRange.since, dateRange.until);
        if (!isCancelled) {
          setLojaLeadsData(leadsData);
        }
      } catch (error) {
        if (!isCancelled) {
          setLojaLeadsData(null);
        }
      } finally {
        if (!isCancelled) {
          setLoadingLeads(false);
        }
      }

      return () => {
        isCancelled = true;
      };
    };

    fetchLojaLeads();
  }, [campaign.name, showInsights, dateRange.since, dateRange.until]);



  return (
    <div className="campaignCard">
      <div className="campaignHeader">
        <div className="campaignTitle">
          <h3>{campaign.name}</h3>
          <div className="campaignMeta">
            <span 
              className="statusBadge"
              style={{ backgroundColor: getStatusColor(campaign.status) }}
            >
              {getStatusText(campaign.status)}
            </span>
            
          </div>
        </div>
     
      </div>


      <div className="budgetSection">
        <h4>Orçamento</h4>
        <div className="budgetGrid">
          {isGoogleAdsCampaign(campaign) ? (
            // Orçamento do Google Ads
            <>
              {campaign.budget_amount_micros > 0 && (
                <div className="budgetItem">
                  <span className="budgetLabel">Orçamento:</span>
                  <span className="budgetValue">
                    R$ {(campaign.budget_amount_micros / 1000000).toFixed(2)}
                  </span>
                </div>
              )}
              
              {showInsights && campaign.metrics?.cost_micros && campaign.metrics.cost_micros > 0 && (
                <div className="budgetItem">
                  <span className="budgetLabel">Gasto:</span>
                  <span className="budgetValue spent">
                    R$ {(campaign.metrics.cost_micros / 1000000).toFixed(2)}
                  </span>
                </div>
              )}
            </>
          ) : (
            // Orçamento do Meta Ads
            <>
              {campaign.daily_budget > 0 && (
                <div className="budgetItem">
                  <span className="budgetLabel">Diário:</span>
                  <span className="budgetValue">
                    {formatCurrency(campaign.daily_budget / 100, campaign.daily_budget_currency)}
                  </span>
                </div>
              )}
              
              {campaign.lifetime_budget > 0 && (
                <div className="budgetItem">
                  <span className="budgetLabel">Total:</span>
                  <span className="budgetValue">
                    {formatCurrency(campaign.lifetime_budget / 100, campaign.lifetime_budget_currency)}
                  </span>
                </div>
              )}
              
              {showInsights && campaign.insights?.spend && campaign.insights.spend > 0 && (
                <div className="budgetItem">
                  <span className="budgetLabel">Gasto:</span>
                  <span className="budgetValue spent">
                    {formatCurrency(campaign.insights.spend, 'BRL')}
                  </span>
                </div>
              )}
              
              {campaign.budget_remaining > 0 && (
                <div className="budgetItem">
                  <span className="budgetLabel">Restante:</span>
                  <span className="budgetValue remaining">
                    {formatCurrency(campaign.budget_remaining / 100, campaign.budget_remaining_currency)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {showInsights && (
        <>
        {/* Nova seção de métricas reais da loja */}
        {lojaLeadsData && (
            <div className="realMetricsSection">
              <h4>Métricas Reais - {lojaLeadsData.lojaNome}</h4>
              <div className="realMetricsGrid">
                <div className="realMetricsItem">
                  <div className="realMetricsIcon">
                    <UserCheck size={16} />
                  </div>
                  <div className="realMetricsContent">
                    <span className="realMetricsLabel">Leads WhatsApp</span>
                    <span className="realMetricsValue">
                      {lojaLeadsData.leadsWhatsapp.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="realMetricsItem">
                  <div className="realMetricsIcon">
                    <TrendingUp size={16} />
                  </div>
                  <div className="realMetricsContent">
                    <span className="realMetricsLabel">Conversão WhatsApp</span>
                    <span className="realMetricsValue">
                      {lojaLeadsData.conversaoWhatsapp.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DEBUG: Mostrar métricas brutas para diagnóstico */}
          {showInsights && isGoogleAdsCampaign(campaign) && (
            <div style={{ background: '#1a1a1a', border: '1px solid #333', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
              <h5 style={{ color: '#ff6b6b', fontSize: '12px', margin: '0 0 5px 0' }}>🔧 DEBUG - Métricas Brutas:</h5>
              <pre style={{ color: '#50fa7b', fontSize: '10px', margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(campaign.metrics, null, 2)}
              </pre>
            </div>
          )}

          {/* Seção de métricas de performance - sempre exibir se showInsights for true */}
          {showInsights && (
            <div className="performanceSection">
            <h4>Métricas {isGoogleAdsCampaign(campaign) ? 'Google Ads' : 'Meta Ads (Facebook/Instagram)'}</h4>
            <div className="performanceGrid">
              {isGoogleAdsCampaign(campaign) ? (
                // Métricas do Google Ads - Expandidas
                <>
                  <div className="performanceItem">
                    <div className="performanceIcon">
                      <Eye size={16} />
                    </div>
                    <div className="performanceContent">
                      <span className="performanceLabel">Impressões</span>
                      <span className="performanceValue">
                        {campaign.metrics?.impressions !== undefined && campaign.metrics.impressions !== null 
                          ? campaign.metrics.impressions.toLocaleString() 
                          : '0'}
                      </span>
                    </div>
                  </div>

                  <div className="performanceItem">
                    <div className="performanceIcon">
                      <MousePointer size={16} />
                    </div>
                    <div className="performanceContent">
                      <span className="performanceLabel">Cliques</span>
                      <span className="performanceValue">
                        {campaign.metrics?.clicks !== undefined && campaign.metrics.clicks !== null
                          ? campaign.metrics.clicks.toLocaleString() 
                          : '0'}
                      </span>
                    </div>
                  </div>

                  <div className="performanceItem">
                    <div className="performanceIcon">
                      <TrendingUp size={16} />
                    </div>
                    <div className="performanceContent">
                      <span className="performanceLabel">CTR</span>
                      <span className="performanceValue">
                        {campaign.metrics?.ctr !== undefined && campaign.metrics.ctr !== null 
                          ? `${(campaign.metrics.ctr * 100).toFixed(2)}%` 
                          : '0.00%'}
                      </span>
                    </div>
                  </div>

                  <div className="performanceItem">
                    <div className="performanceIcon">
                      <DollarSign size={16} />
                    </div>
                    <div className="performanceContent">
                      <span className="performanceLabel">CPC Médio</span>
                      <span className="performanceValue">
                        {campaign.metrics?.average_cpc !== undefined && campaign.metrics.average_cpc !== null
                          ? `R$ ${(campaign.metrics.average_cpc / 1000000).toFixed(2)}`
                          : 'R$ 0,00'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="performanceItem">
                    <div className="performanceIcon">
                      <DollarSign size={16} />
                    </div>
                    <div className="performanceContent">
                      <span className="performanceLabel">Gasto Total</span>
                      <span className="performanceValue">
                        {campaign.metrics?.cost_micros !== undefined && campaign.metrics.cost_micros !== null
                          ? `R$ ${(campaign.metrics.cost_micros / 1000000).toFixed(2)}`
                          : campaign.metrics?.cost !== undefined && campaign.metrics.cost !== null
                            ? `R$ ${parseFloat(campaign.metrics.cost.toString()).toFixed(2)}`
                            : 'R$ 0,00'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="performanceItem">
                    <div className="performanceIcon">
                      <UserCheck size={16} />
                    </div>
                    <div className="performanceContent">
                      <span className="performanceLabel">Conversões</span>
                      <span className="performanceValue">
                        {campaign.metrics?.conversions !== undefined && campaign.metrics.conversions !== null
                          ? campaign.metrics.conversions.toLocaleString() 
                          : '0'}
                      </span>
                    </div>
                  </div>

                  <div className="performanceItem">
                    <div className="performanceIcon">
                      <Target size={16} />
                    </div>
                    <div className="performanceContent">
                      <span className="performanceLabel">Taxa Conversão</span>
                      <span className="performanceValue">
                        {campaign.metrics?.conversion_rate !== undefined && campaign.metrics.conversion_rate !== null
                          ? `${(campaign.metrics.conversion_rate * 100).toFixed(2)}%`
                          : '0.00%'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="performanceItem">
                    <div className="performanceIcon">
                      <DollarSign size={16} />
                    </div>
                    <div className="performanceContent">
                      <span className="performanceLabel">Valor Conversões</span>
                      <span className="performanceValue">
                        {campaign.metrics?.conversions_value !== undefined && campaign.metrics.conversions_value !== null
                          ? `R$ ${campaign.metrics.conversions_value.toFixed(2)}`
                          : 'R$ 0,00'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="performanceItem">
                    <div className="performanceIcon">
                      <Target size={16} />
                    </div>
                    <div className="performanceContent">
                      <span className="performanceLabel">CPA</span>
                      <span className="performanceValue">
                        {campaign.metrics?.conversions !== undefined && 
                         campaign.metrics.conversions !== null && 
                         campaign.metrics.conversions > 0 
                          ? (campaign.metrics.cost_micros !== undefined && campaign.metrics.cost_micros !== null
                              ? `R$ ${((campaign.metrics.cost_micros / 1000000) / campaign.metrics.conversions).toFixed(2)}`
                              : campaign.metrics.cost !== undefined && campaign.metrics.cost !== null
                                ? `R$ ${(parseFloat(campaign.metrics.cost.toString()) / campaign.metrics.conversions).toFixed(2)}`
                                : 'R$ 0,00')
                          : 'R$ 0,00'
                        }
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                // Métricas do Meta Ads
                <>
                  <div className="performanceItem">
                    <div className="performanceIcon">
                      <UserCheck size={16} />
                    </div>
                    <div className="performanceContent">
                      <span className="performanceLabel">Leads</span>
                      <span className="performanceValue">
                        {campaign.insights ? getLeadsCount(campaign.insights).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="performanceItem">
                    <div className="performanceIcon">
                      <DollarSign size={16} />
                    </div>
                    <div className="performanceContent">
                      <span className="performanceLabel">Custo por Lead</span>
                      <span className="performanceValue">
                        {campaign.insights ? formatCurrency(getCostPerLead(campaign.insights), 'BRL') : 'R$ 0,00'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          )}

          {/* Botão para mostrar/ocultar métricas gerais */}
          <div className="metricsToggleSection">
            <button 
              className="metricsToggleButton"
              onClick={toggleGeneralMetrics}
            >
              <span>Ver Mais Detalhes</span>
              {showGeneralMetrics ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Seção de insights existente - agora condicional */}
          {showGeneralMetrics && (isGoogleAdsCampaign(campaign) ? campaign.metrics : campaign.insights) && (
            <div className="insightsSection">
              <h4>Métricas Gerais</h4>
              <div className="insightsGrid">
                <div className="insightItem">
                  <div className="insightIcon">
                    <Eye size={16} />
                  </div>
                  <div className="insightContent">
                    <span className="insightLabel">Impressões</span>
                    <span className="insightValue">
                      {isGoogleAdsCampaign(campaign) 
                        ? campaign.metrics?.impressions?.toLocaleString() || 'N/A'
                        : campaign.insights?.impressions?.toLocaleString() || 'N/A'
                      }
                    </span>
                  </div>
                </div>

                <div className="insightItem">
                  <div className="insightIcon">
                    <MousePointer size={16} />
                  </div>
                  <div className="insightContent">
                    <span className="insightLabel">Cliques</span>
                    <span className="insightValue">
                      {isGoogleAdsCampaign(campaign) 
                        ? campaign.metrics?.clicks?.toLocaleString() || 'N/A'
                        : campaign.insights?.clicks?.toLocaleString() || 'N/A'
                      }
                    </span>
                  </div>
                </div>

                {!isGoogleAdsCampaign(campaign) && (
                  <div className="insightItem">
                    <div className="insightIcon">
                      <Users size={16} />
                    </div>
                    <div className="insightContent">
                      <span className="insightLabel">Alcance</span>
                      <span className="insightValue">
                        {campaign.insights?.reach?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="insightItem">
                  <div className="insightIcon">
                    <TrendingUp size={16} />
                  </div>
                  <div className="insightContent">
                    <span className="insightLabel">CTR</span>
                    <span className="insightValue">
                      {isGoogleAdsCampaign(campaign) 
                        ? campaign.metrics?.ctr ? `${(campaign.metrics.ctr * 100).toFixed(2)}%` : 'N/A'
                        : campaign.insights && campaign.insights.impressions > 0 
                          ? `${((campaign.insights.clicks / campaign.insights.impressions) * 100).toFixed(2)}%`
                          : 'N/A'
                      }
                    </span>
                  </div>
                </div>

                <div className="insightItem">
                  <div className="insightIcon">
                    <DollarSign size={16} />
                  </div>
                  <div className="insightContent">
                    <span className="insightLabel">CPC</span>
                    <span className="insightValue">
                      {formatCurrency(campaign.insights.cpc, 'BRL')}
                    </span>
                  </div>
                </div>

                <div className="insightItem">
                  <div className="insightIcon">
                    <DollarSign size={16} />
                  </div>
                  <div className="insightContent">
                    <span className="insightLabel">CPM</span>
                    <span className="insightValue">
                      {formatCurrency(campaign.insights.cpm, 'BRL')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="campaignFooter">
        <div className="campaignDates">
          <small>Criada em: {formatDate(campaign.created_time)}</small>
          <small>Atualizada em: {formatDate(campaign.updated_time)}</small>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
