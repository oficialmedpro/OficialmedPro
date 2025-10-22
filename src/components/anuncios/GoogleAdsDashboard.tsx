import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Eye, 
  MousePointer, 
  UserCheck, 
  TrendingUp, 
  TestTube,
  AlertCircle,
  CheckCircle,
  Activity,
  Target,
  Users,
  BarChart3,
  TrendingDown,
  ArrowUpDown
} from 'lucide-react';
import { useGoogleAds } from '../../hooks/useGoogleAds';
import { useAuth } from '../../hooks/useAuth';
import GoogleAdsChart from '../charts/GoogleAdsChart';
import './GoogleAdsDashboard.css';

interface GoogleAdsDashboardProps {
  dateRange: { since: string; until: string };
  filteredCampaigns: any[];
}

interface GoogleAdsStatistics {
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCTR: number;
  averageCPC: number;
  averageConversionRate: number;
  totalCampaigns: number;
}

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
    <div className="google-metric-card">
      <div className="google-metric-header">
        <div className="google-metric-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div className="google-metric-content">
          <h4 className="google-metric-title">{title}</h4>
          <p className="google-metric-value">{value}</p>
          {subtitle && <p className="google-metric-subtitle">{subtitle}</p>}
        </div>
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="google-sparkline">
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

// Componente para ranking de campanhas por custo de conversão
const CampaignRanking: React.FC<{
  campaigns: any[];
}> = ({ campaigns }) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Calcular custo por conversão para cada campanha
  const campaignRanking = useMemo(() => {
    return campaigns
      .filter(campaign => campaign.metrics)
      .map(campaign => {
        const cost = campaign.metrics?.cost_micros ? campaign.metrics.cost_micros / 1000000 : 0;
        const conversions = campaign.metrics?.conversions || 0;
        const costPerConversion = conversions > 0 ? cost / conversions : cost;

        return {
          name: campaign.name && campaign.name.length > 35 ? campaign.name.substring(0, 35) + '...' : campaign.name || 'Sem nome',
          cost: costPerConversion,
          conversions,
          spend: cost
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
    <div className="google-campaign-ranking">
      <div className="google-ranking-header">
        <h4>Ranking de Campanhas</h4>
        <button 
          className="google-sort-button"
          onClick={toggleSortOrder}
          title={sortOrder === 'asc' ? 'Ordenar do maior para menor' : 'Ordenar do menor para maior'}
        >
          {sortOrder === 'asc' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        </button>
      </div>
      <div className="google-ranking-subtitle">
        Por custo de conversão ({sortOrder === 'asc' ? 'menor' : 'maior'} primeiro)
      </div>
      <div className="google-ranking-list">
        <div className="google-ranking-table-header">
          <span className="google-ranking-campaign-header">Nome da Campanha</span>
          <span className="google-ranking-cost-header">Custo (R$)</span>
        </div>
        {campaignRanking.map((campaign, index) => (
          <div key={index} className="google-ranking-item">
            <div className="google-ranking-position">{index + 1}</div>
            <div className="google-ranking-campaign">
              <span className="google-ranking-campaign-name" title={campaign.name}>
                {campaign.name}
              </span>
              <span className="google-ranking-campaign-info">
                {campaign.conversions} conversões
              </span>
            </div>
            <div className="google-ranking-cost">
              R$ {campaign.cost.toFixed(2)}
            </div>
          </div>
        ))}
        {campaignRanking.length === 0 && (
          <div className="google-ranking-empty">
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
    <div className="google-right-panel">
      {/* Ranking de Campanhas */}
      <CampaignRanking campaigns={campaigns} />

      {/* Melhores Anúncios */}
      <div className="google-top-ads">
        <h4>Melhores Anúncios</h4>
        <p className="google-top-ads-subtitle">5 principais - Campanhas</p>
        <div className="google-ads-list">
          {topAds.map((ad, index) => (
            <div key={index} className="google-ad-item">
              <span className="google-ad-name">{ad.name}</span>
              <span className="google-ad-value">{ad.conversions}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Melhor Dia */}
      <div className="google-best-day">
        <h4>Melhor Dia</h4>
        <div className="google-best-day-chart">
          <div className="google-day-bars">
            {bestDay?.map((day: any, index: number) => (
              <div key={index} className="google-day-bar">
                <div 
                  className="google-day-bar-fill"
                  style={{ height: `${(day.value / Math.max(...bestDay.map((d: any) => d.value))) * 100}%` }}
                ></div>
                <span className="google-day-label">{day.name}</span>
                <span className="google-day-value">{day.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const GoogleAdsDashboard: React.FC<GoogleAdsDashboardProps> = ({ 
  dateRange, 
  filteredCampaigns 
}) => {
  const { userLevel } = useAuth();
  const {
    googleAdsStats,
    getGoogleAdsStats,
    loading,
    error,
    isConfigured,
    validateConnection
  } = useGoogleAds();

  // Usar campanhas do hook ou campanhas filtradas
  const allCampaigns = campaigns || filteredCampaigns || [];

  // Calcular métricas principais
  const metrics = useMemo(() => {
    // Se temos estatísticas do hook, usar elas
    if (googleAdsStats) {
      return {
        totalSpent: googleAdsStats.gastoTotal || 0,
        totalImpressions: googleAdsStats.impressions || 0,
        totalClicks: googleAdsStats.clicks || 0,
        totalConversions: googleAdsStats.totalConversions || 0,
        ctr: googleAdsStats.ctr || 0,
        cpc: googleAdsStats.cpc || 0,
        conversionRate: googleAdsStats.conversionRate || 0,
        costPerConversion: (googleAdsStats.totalConversions > 0) ? (googleAdsStats.gastoTotal / googleAdsStats.totalConversions) : 0
      };
    }

    // Fallback para calcular das campanhas
    const totalSpent = allCampaigns.reduce((sum, campaign) => {
      const cost = campaign.metrics?.cost_micros ? campaign.metrics.cost_micros / 1000000 : 0;
      return sum + cost;
    }, 0);
    
    const totalImpressions = allCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.impressions || 0), 0);
    const totalClicks = allCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.clicks || 0), 0);
    const totalConversions = allCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.conversions || 0), 0);

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const costPerConversion = totalConversions > 0 ? totalSpent / totalConversions : 0;

    return {
      totalSpent,
      totalImpressions,
      totalClicks,
      totalConversions,
      ctr,
      cpc,
      conversionRate,
      costPerConversion
    };
  }, [allCampaigns, googleAdsStats]);

  // Top 5 campanhas por conversões
  const topAds = useMemo(() => {
    return allCampaigns
      .filter(campaign => campaign.metrics?.conversions)
      .map(campaign => ({
        name: campaign.name && campaign.name.length > 30 ? campaign.name.substring(0, 30) + '...' : campaign.name || 'Sem nome',
        conversions: campaign.metrics?.conversions || 0
      }))
      .filter(ad => ad.conversions > 0)
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 5);
  }, [allCampaigns]);

  // Calcular melhor dia baseado nos dados das campanhas (simulado)
  const bestDay = useMemo(() => {
    const days = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
    const totalConversions = metrics.totalConversions;
    
    // Distribuir conversões pelos dias da semana (simulado baseado em padrões típicos)
    return days.map((name, index) => {
      let multiplier;
      switch (index) {
        case 0: multiplier = 0.18; break; // Segunda
        case 1: multiplier = 0.22; break; // Terça  
        case 2: multiplier = 0.25; break; // Quarta
        case 3: multiplier = 0.20; break; // Quinta
        case 4: multiplier = 0.10; break; // Sexta
        case 5: multiplier = 0.03; break; // Sábado
        case 6: multiplier = 0.02; break; // Domingo
        default: multiplier = 0.1;
      }
      return {
        name,
        value: Math.floor(totalConversions * multiplier)
      };
    });
  }, [metrics.totalConversions]);

  // Sparkline baseado nos últimos 30 dias (simulado)
  const sparklineData = useMemo(() => {
    const base = metrics.totalSpent / 30;
    return Array.from({ length: 12 }, (_, i) => {
      const variation = (Math.sin(i * 0.5) + 1) * 0.5; // Variação suave
      return Math.floor(base * (0.5 + variation));
    });
  }, [metrics.totalSpent]);

  const [statistics, setStatistics] = useState<GoogleAdsStatistics>({
    totalSpent: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    averageCTR: 0,
    averageCPC: 0,
    averageConversionRate: 0,
    totalCampaigns: 0
  });

  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    testing: boolean;
  }>({
    connected: false,
    message: 'Não testado',
    testing: false
  });

  // Atualizar estatísticas quando os dados mudarem
  useEffect(() => {
    if (googleAdsStats) {
      console.log('📊 Atualizando estatísticas com dados da API:', googleAdsStats);
      
      const newStatistics: GoogleAdsStatistics = {
        totalSpent: googleAdsStats.gastoTotal || 0,
        totalImpressions: googleAdsStats.impressions || 0,
        totalClicks: googleAdsStats.clicks || 0,
        totalConversions: googleAdsStats.totalConversions || 0,
        averageCTR: googleAdsStats.ctr || 0,
        averageCPC: googleAdsStats.cpc || 0,
        averageConversionRate: googleAdsStats.conversionRate || 0,
        totalCampaigns: allCampaigns.length
      };

      setStatistics(newStatistics);
    }
  }, [googleAdsStats, allCampaigns]);


  // Carregar dados quando o intervalo de datas mudar
  useEffect(() => {
    if (isConfigured && dateRange.since && dateRange.until) {
      console.log('🔄 Carregando dados do Google Ads para período:', dateRange);
      
      // Carregar estatísticas
      getGoogleAdsStats(dateRange);
      
      // Carregar campanhas com métricas
      getCampaignsWithMetrics(dateRange);
    }
  }, [dateRange, isConfigured, getGoogleAdsStats, getCampaignsWithMetrics]);

  const handleTestConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, testing: true }));
    
    try {
      const result = await validateConnection();
      setConnectionStatus({
        connected: result.connected,
        message: result.message,
        testing: false
      });
    } catch (error) {
      setConnectionStatus({
        connected: false,
        message: error instanceof Error ? error.message : 'Erro ao testar conexão',
        testing: false
      });
    }
  };


  // Verificar permissões
  if (userLevel === 'loja') {
    return (
      <div className="google-error-container">
        <div className="google-error-card">
          <h3>Acesso Negado</h3>
          <p>Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="google-error-container">
        <div className="google-error-card">
          <h3>Configuração Necessária</h3>
          <p>As credenciais do Google Ads não estão configuradas.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="google-error-container">
        <div className="google-error-card">
          <h3>Erro ao carregar dados</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="google-retry-button"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="google-dashboard-container">
      {/* Métricas principais */}
      <div className="google-metrics-section">
        <div className="google-distribution-metrics">
          <h3>DISTRIBUIÇÃO</h3>
          <div className="google-metrics-grid">
            {loading && allCampaigns.length === 0 ? (
              // Loading skeleton para cards
              Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="google-metric-card google-loading-card">
                  <div className="google-loading-skeleton"></div>
                </div>
              ))
            ) : (
              <>
                <MetricCard
                  title="Impressões"
                  value={metrics.totalImpressions.toLocaleString()}
                  icon={<Eye size={16} />}
                  color="#3B82F6"
                  sparkline={sparklineData}
                />
                <MetricCard
                  title="Cliques"
                  value={metrics.totalClicks.toLocaleString()}
                  icon={<MousePointer size={16} />}
                  color="#10B981"
                  sparkline={sparklineData}
                />
                <MetricCard
                  title="CTR"
                  value={`${metrics.ctr.toFixed(2)}%`}
                  icon={<TrendingUp size={16} />}
                  color="#F59E0B"
                  sparkline={sparklineData}
                />
                <MetricCard
                  title="CPC"
                  value={`R$ ${metrics.cpc.toFixed(2)}`}
                  icon={<DollarSign size={16} />}
                  color="#EF4444"
                  sparkline={sparklineData}
                />
                <MetricCard
                  title="Investimento"
                  value={`R$ ${metrics.totalSpent.toFixed(2)}`}
                  icon={<DollarSign size={16} />}
                  color="#3B82F6"
                  sparkline={sparklineData}
                />
                <MetricCard
                  title="Conversões"
                  value={metrics.totalConversions}
                  icon={<UserCheck size={16} />}
                  color="#10B981"
                  sparkline={sparklineData}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="google-main-content">
        <div className="google-left-content">
          {/* Gráfico temporal - usando o novo componente */}
          <GoogleAdsChart 
            campaigns={allCampaigns}
            dateRange={dateRange}
            loading={loading}
          />
        </div>

        {/* Painel lateral direito */}
        <RightPanel
          campaigns={allCampaigns}
          topAds={topAds}
          bestDay={bestDay}
        />
      </div>

      {/* Rodapé */}
      <div className="google-footer">
        <div className="google-footer-left">
          <span>Data da última atualização: {new Date().toLocaleString('pt-BR')}</span>
        </div>
        <div className="google-footer-right">
          <a href="#" className="google-privacy-link">Política de Privacidade</a>
        </div>
      </div>
    </div>
  );
};

export default GoogleAdsDashboard;
