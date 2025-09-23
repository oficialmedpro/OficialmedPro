import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  MousePointer, 
  DollarSign, 
  UserCheck, 
  Target, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { GoogleAdsCampaign } from '../../services/googleAdsService';
import { getLeadsMetricsByLojaNome, LojaLeadsMetrics } from '../../services/leadsService';
import './CampaignCard.css';

interface GoogleAdsCampaignMetricsProps {
  campaign: GoogleAdsCampaign;
  showInsights: boolean;
  dateRange: { since: string; until: string };
}

const GoogleAdsCampaignMetrics: React.FC<GoogleAdsCampaignMetricsProps> = ({ 
  campaign, 
  showInsights,
  dateRange
}) => {
  const [showGeneralMetrics, setShowGeneralMetrics] = useState(false);
  const [lojaLeadsData, setLojaLeadsData] = useState<LojaLeadsMetrics | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const formatCurrency = (amount: number, currency: string = 'BRL') => {
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
      case 'enabled':
      case 'active':
        return '#10b981';
      case 'paused':
        return '#f59e0b';
      case 'removed':
      case 'deleted':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'enabled':
        return 'Ativa';
      case 'paused':
        return 'Pausada';
      case 'removed':
        return 'Removida';
      default:
        return status;
    }
  };

  // Função para extrair o nome da loja do título da campanha (copiada do CampaignCard)
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

          {/* Seção de métricas de performance do Google Ads */}
          <div className="performanceSection">
            <h4>Métricas Google Ads</h4>
            <div className="performanceGrid">
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
                      ? `R$ ${((campaign.metrics.cost_micros || 0) / 1000000 / campaign.metrics.conversions).toFixed(2)}`
                      : 'R$ 0,00'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

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

          {/* Seção de insights expandida */}
          {showGeneralMetrics && campaign.metrics && (
            <div className="insightsSection">
              <h4>Métricas Detalhadas</h4>
              <div className="insightsGrid">
                <div className="insightItem">
                  <div className="insightIcon">
                    <Eye size={16} />
                  </div>
                  <div className="insightContent">
                    <span className="insightLabel">All Conversions</span>
                    <span className="insightValue">
                      {campaign.metrics.all_conversions?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>

                <div className="insightItem">
                  <div className="insightIcon">
                    <DollarSign size={16} />
                  </div>
                  <div className="insightContent">
                    <span className="insightLabel">All Conversions Value</span>
                    <span className="insightValue">
                      R$ {(campaign.metrics.all_conversions_value || 0).toFixed(2)}
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
          <small>Criada em: {formatDate(campaign.created_time || new Date().toISOString())}</small>
          <small>Atualizada em: {formatDate(campaign.updated_time || new Date().toISOString())}</small>
        </div>
      </div>
    </div>
  );
};

export default GoogleAdsCampaignMetrics;