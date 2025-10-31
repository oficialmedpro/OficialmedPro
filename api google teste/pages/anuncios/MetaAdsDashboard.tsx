import React, { useState, useMemo, useEffect } from 'react';
import { 
  DollarSign, 
  Eye, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Target,
  ArrowUpDown,
  TrendingDown
} from 'lucide-react';
import { useMetaAds } from '../../hooks/useMetaAds';
import { useAuth } from '../../hooks/useAuth';
import MetaAdsChart from '../../components/charts/MetaAdsChart';
import './MetaAdsDashboard.css';

// Componente para cards de métricas pequenas
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  sparkline?: number[];
}> = ({ title, value, subtitle, icon, color, sparkline }) => {
  return (
    <div className="meta-metric-card">
      <div className="meta-metric-header">
        <div className="meta-metric-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div className="meta-metric-content">
          <h4 className="meta-metric-title">{title}</h4>
          <p className="meta-metric-value">{value}</p>
          {subtitle && <p className="meta-metric-subtitle">{subtitle}</p>}
        </div>
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="meta-sparkline">
          <svg width="100%" height="30" viewBox="0 0 200 30">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={sparkline.map((val, i) => {
                const maxVal = Math.max(...sparkline);
                const normalizedVal = maxVal > 0 ? val / maxVal : 0;
                const x = sparkline.length > 1 ? (i / (sparkline.length - 1)) * 200 : 100;
                const y = 30 - (normalizedVal * 30);
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>
        </div>
      )}
    </div>
  );
};

// Interface para props do MetaAdsDashboard
interface MetaAdsDashboardProps {
  dateRange?: { since: string; until: string };
  filteredCampaigns?: any[]; // Campanhas filtradas vindas dos filtros
}

// Componente para ranking de campanhas por custo de conversão
const CampaignRanking: React.FC<{
  campaigns: any[];
}> = ({ campaigns }) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Calcular custo por conversão para cada campanha
  const campaignRanking = useMemo(() => {
    return campaigns
      .filter(campaign => campaign.insights)
      .map(campaign => {
        const spend = campaign.insights?.spend || 0;
        const leadAction = campaign.insights?.actions?.find((action: any) => 
          action.action_type === 'onsite_conversion.messaging_conversation_started_7d'
        );
        const conversions = leadAction ? Number(leadAction.value) || 0 : 0;
        const costPerConversion = conversions > 0 ? spend / conversions : spend;

        return {
          name: campaign.name.length > 35 ? campaign.name.substring(0, 35) + '...' : campaign.name,
          cost: costPerConversion,
          conversions,
          spend
        };
      })
      .filter(campaign => campaign.conversions > 0 || campaign.spend > 0)
      .sort((a, b) => {
        return sortOrder === 'asc' ? a.cost - b.cost : b.cost - a.cost;
      })
      .slice(0, 8); // Top 8 campanhas
  }, [campaigns, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="meta-campaign-ranking">
      <div className="meta-ranking-header">
        <h4>Ranking de Campanhas</h4>
        <button 
          className="meta-sort-button"
          onClick={toggleSortOrder}
          title={sortOrder === 'asc' ? 'Ordenar do maior para menor' : 'Ordenar do menor para maior'}
        >
          {sortOrder === 'asc' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        </button>
      </div>
      <div className="meta-ranking-subtitle">
        Por custo de conversão ({sortOrder === 'asc' ? 'menor' : 'maior'} primeiro)
      </div>
      <div className="meta-ranking-list">
        <div className="meta-ranking-table-header">
          <span className="meta-ranking-campaign-header">Nome da Campanha</span>
          <span className="meta-ranking-cost-header">Custo (R$)</span>
        </div>
        {campaignRanking.map((campaign, index) => (
          <div key={index} className="meta-ranking-item">
            <div className="meta-ranking-position">{index + 1}</div>
            <div className="meta-ranking-campaign">
              <span className="meta-ranking-campaign-name" title={campaign.name}>
                {campaign.name}
              </span>
              <span className="meta-ranking-campaign-info">
                {campaign.conversions} conversões
              </span>
            </div>
            <div className="meta-ranking-cost">
              R$ {campaign.cost.toFixed(2)}
            </div>
          </div>
        ))}
        {campaignRanking.length === 0 && (
          <div className="meta-ranking-empty">
            <p>Nenhuma campanha com conversões encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para painel lateral direito
const RightPanel: React.FC<{
  campaigns: any[];
  topAds: any[];
  bestDay: any;
}> = ({ campaigns, topAds, bestDay }) => {
  return (
    <div className="meta-right-panel">
      {/* Ranking de Campanhas */}
      <CampaignRanking campaigns={campaigns} />

      {/* Melhores Anúncios */}
      <div className="meta-top-ads">
        <h4>Melhores Anúncios</h4>
        <p className="meta-top-ads-subtitle">5 principais - Anúncio</p>
        <div className="meta-ads-list">
          {topAds.map((ad, index) => (
            <div key={index} className="meta-ad-item">
              <span className="meta-ad-name">{ad.name}</span>
              <span className="meta-ad-value">{ad.messages}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Melhor Dia */}
      <div className="meta-best-day">
        <h4>Melhor Dia</h4>
        <div className="meta-best-day-chart">
          <div className="meta-day-bars">
            {bestDay?.map((day: any, index: number) => (
              <div key={index} className="meta-day-bar">
                <div 
                  className="meta-day-bar-fill"
                  style={{ height: `${(day.value / Math.max(...bestDay.map((d: any) => d.value))) * 100}%` }}
                ></div>
                <span className="meta-day-label">{day.name}</span>
                <span className="meta-day-value">{day.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetaAdsDashboard: React.FC<MetaAdsDashboardProps> = ({ dateRange: externalDateRange, filteredCampaigns }) => {
  const { userLevel } = useAuth();
  const { 
    campaigns: allCampaigns, 
    loading, 
    error,
    metaStats,
    refreshCampaignsWithInsights,
    getMetaStats,
    isConfigured
  } = useMetaAds();

  // Usar campanhas filtradas se fornecidas, caso contrário usar todas as campanhas
  const campaigns = filteredCampaigns || allCampaigns;

  const [dateRange, setDateRange] = useState(externalDateRange || {
    since: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    until: new Date().toISOString().split('T')[0]
  });

  // Atualizar dateRange quando externalDateRange mudar
  useEffect(() => {
    if (externalDateRange) {
      setDateRange(externalDateRange);
    }
  }, [externalDateRange]);

  // Carregar insights quando o componente montar
  useEffect(() => {
    const loadInsights = async () => {
      if (isConfigured && allCampaigns.length > 0) {
        try {
          await refreshCampaignsWithInsights(dateRange);
          await getMetaStats(dateRange);
        } catch (error) {
          console.error('Erro ao carregar insights:', error);
        }
      }
    };

    loadInsights();
  }, [isConfigured, allCampaigns.length, dateRange.since, dateRange.until]);

  // Calcular métricas principais
  const metrics = useMemo(() => {
    const totalSpent = campaigns.reduce((sum, campaign) => sum + (campaign.insights?.spend || 0), 0);
    const totalImpressions = campaigns.reduce((sum, campaign) => sum + (campaign.insights?.impressions || 0), 0);
    const totalClicks = campaigns.reduce((sum, campaign) => sum + (campaign.insights?.clicks || 0), 0);
    const totalReach = campaigns.reduce((sum, campaign) => sum + (campaign.insights?.reach || 0), 0);
    const totalLeads = campaigns.reduce((sum, campaign) => {
      if (!campaign.insights?.actions) return sum;
      const leadAction = campaign.insights.actions.find((action: any) => 
        action.action_type === 'onsite_conversion.messaging_conversation_started_7d'
      );
      return sum + (leadAction ? Number(leadAction.value) || 0 : 0);
    }, 0);

    const frequency = totalReach > 0 ? totalImpressions / totalReach : 0;
    const cpm = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;
    const cpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const costPerLead = totalLeads > 0 ? totalSpent / totalLeads : 0;
    const roas = totalSpent > 0 ? (totalLeads * 100) / totalSpent : 0; // Mock ROAS

    return {
      totalSpent,
      totalImpressions,
      totalClicks,
      totalReach,
      totalLeads,
      frequency,
      cpm,
      cpc,
      ctr,
      costPerLead,
      roas
    };
  }, [campaigns]);

  // Top 5 campanhas por leads/mensagens
  const topAds = useMemo(() => {
    return campaigns
      .filter(campaign => campaign.insights?.actions)
      .map(campaign => {
        const leadAction = campaign.insights?.actions?.find((action: any) => 
          action.action_type === 'onsite_conversion.messaging_conversation_started_7d'
        );
        return {
          name: campaign.name.length > 30 ? campaign.name.substring(0, 30) + '...' : campaign.name,
          messages: leadAction ? Number(leadAction.value) || 0 : 0
        };
      })
      .filter(ad => ad.messages > 0)
      .sort((a, b) => b.messages - a.messages)
      .slice(0, 5);
  }, [campaigns]);

  // Calcular melhor dia baseado nos dados das campanhas (simulado)
  const bestDay = useMemo(() => {
    const days = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
    const totalLeads = metrics.totalLeads;
    
    // Distribuir leads pelos dias da semana (simulado baseado em padrões típicos)
    return days.map((name, index) => {
      let multiplier;
      switch (index) {
        case 0: multiplier = 0.2; break; // Segunda
        case 1: multiplier = 0.25; break; // Terça  
        case 2: multiplier = 0.2; break; // Quarta
        case 3: multiplier = 0.15; break; // Quinta
        case 4: multiplier = 0.1; break; // Sexta
        case 5: multiplier = 0.05; break; // Sábado
        case 6: multiplier = 0.05; break; // Domingo
        default: multiplier = 0.1;
      }
      return {
        name,
        value: Math.floor(totalLeads * multiplier)
      };
    });
  }, [metrics.totalLeads]);

  // Sparkline baseado nos últimos 30 dias (simulado)
  const sparklineData = useMemo(() => {
    const base = metrics.totalSpent / 30;
    return Array.from({ length: 12 }, (_, i) => {
      const variation = (Math.sin(i * 0.5) + 1) * 0.5; // Variação suave
      return Math.floor(base * (0.5 + variation));
    });
  }, [metrics.totalSpent]);

  // Verificar permissões
  if (userLevel === 'loja') {
    return (
      <div className="meta-error-container">
        <div className="meta-error-card">
          <h3>Acesso Negado</h3>
          <p>Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="meta-error-container">
        <div className="meta-error-card">
          <h3>Configuração Necessária</h3>
          <p>As credenciais do Meta Ads não estão configuradas.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meta-error-container">
        <div className="meta-error-card">
          <h3>Erro ao carregar dados</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="meta-retry-button"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="meta-dashboard-container">
      {/* Métricas principais */}
      <div className="meta-metrics-section">
        <div className="meta-distribution-metrics">
          <h3>DISTRIBUIÇÃO</h3>
          <div className="meta-metrics-grid">
            {loading && campaigns.length === 0 ? (
              // Loading skeleton para cards
              Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="meta-metric-card meta-loading-card">
                  <div className="meta-loading-skeleton"></div>
                </div>
              ))
            ) : (
              <>
                <MetricCard
                  title="Alcance"
                  value={metrics.totalReach.toLocaleString()}
                  icon={<Users size={16} />}
                  color="#9B6CFF"
                  sparkline={sparklineData}
                />
                <MetricCard
                  title="Impressões"
                  value={metrics.totalImpressions.toLocaleString()}
                  icon={<Eye size={16} />}
                  color="#2EA6FF"
                  sparkline={sparklineData}
                />
                <MetricCard
                  title="Frequência"
                  value={metrics.frequency.toFixed(2)}
                  icon={<TrendingUp size={16} />}
                  color="#2DD4BF"
                  sparkline={sparklineData}
                />
                <MetricCard
                  title="CPM"
                  value={`R$ ${metrics.cpm.toFixed(2)}`}
                  icon={<DollarSign size={16} />}
                  color="#FFB86B"
                  sparkline={sparklineData}
                />
                <MetricCard
                  title="Investimento"
                  value={`R$ ${metrics.totalSpent.toFixed(2)}`}
                  icon={<DollarSign size={16} />}
                  color="#9B6CFF"
                  sparkline={sparklineData}
                />
                <MetricCard
                  title="Conversões"
                  value={metrics.totalLeads}
                  icon={<Users size={16} />}
                  color="#2DD4BF"
                  sparkline={sparklineData}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="meta-main-content">
        <div className="meta-left-content">
          {/* Gráfico temporal - usando o novo componente */}
          <MetaAdsChart 
            campaigns={campaigns}
            dateRange={dateRange}
            loading={loading}
          />
        </div>

        {/* Painel lateral direito */}
        <RightPanel
          campaigns={campaigns}
          topAds={topAds}
          bestDay={bestDay}
        />
      </div>

      {/* Rodapé */}
      <div className="meta-footer">
        <div className="meta-footer-left">
          <span>Data da última atualização: {new Date().toLocaleString('pt-BR')}</span>
        </div>
        <div className="meta-footer-right">
          <a href="#" className="meta-privacy-link">Política de Privacidade</a>
        </div>
      </div>
    </div>
  );
};

export default MetaAdsDashboard;
