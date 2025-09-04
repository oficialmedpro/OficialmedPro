import React, { useState, useEffect } from 'react';
import './MetaAdsMetricsBar.css';
import { unitMetaService } from '../service/unitMetaService';
import { metaAdsService } from '../service/metaAdsService';

// Importar bandeiras e logos
import MetaLogoDark from '../../icones/meta-dark.svg';
import MetaLogoLight from '../../icones/meta-light.svg';

const RealMetaAdsMetricsBar = ({ 
  isDarkMode = true, 
  formatCurrency, 
  onFilterChange,
  selectedUnit = '[1]', // Unidade padrão Apucarana
  selectedPeriod = 'thisMonth' // Período padrão
}) => {
  console.log('🚀 RealMetaAdsMetricsBar iniciado - DADOS REAIS APENAS');
  
  // Estados para dados reais do Meta Ads
  const [realMetaData, setRealMetaData] = useState({
    // Dados de campanhas
    totalCampaigns: 0,
    activeCampaigns: 0,
    pausedCampaigns: 0,
    
    // Dados de grupos de anúncios
    totalAdSets: 0,
    activeAdSets: 0,
    
    // Dados de anúncios
    totalAds: 0,
    activeAds: 0,
    
    // Dados financeiros
    totalInvestido: 0,
    leadsGerados: 0,
    
    // Dados de oportunidades (do Supabase)
    oportunidadesFechadas: 0,
    valorGanho: 0,
    oportunidadesPerdidas: 0,
    valorPerda: 0,
    oportunidadesAbertas: 0,
    
    // Métricas calculadas
    taxaConversao: 0,
    roas: 0,
    
    // Informações da conta
    accountInfo: null,
    
    // Estados de carregamento
    loading: true,
    error: null
  });

  // Estados para filtros
  const [campaignsList, setCampaignsList] = useState([]);
  const [adSetsList, setAdSetsList] = useState([]);
  const [adsList, setAdsList] = useState([]);
  
  // Seleções atuais
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [selectedAdSet, setSelectedAdSet] = useState('all');
  const [selectedAd, setSelectedAd] = useState('all');

  // Função para calcular período baseado na seleção
  const calculateDateRange = () => {
    const today = new Date();
    let since, until;

    switch (selectedPeriod) {
      case 'today':
        since = until = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        since = until = yesterday.toISOString().split('T')[0];
        break;
      case 'last7Days':
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        since = last7Days.toISOString().split('T')[0];
        until = today.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        since = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        until = today.toISOString().split('T')[0];
        break;
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3);
        since = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        until = today.toISOString().split('T')[0];
        break;
      case 'thisYear':
        since = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        until = today.toISOString().split('T')[0];
        break;
      default:
        since = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        until = today.toISOString().split('T')[0];
    }

    return { since, until };
  };

  // Função principal para carregar dados reais
  const loadRealMetaData = async () => {
    try {
      console.log('🔄 Carregando dados REAIS do Meta Ads...');
      setRealMetaData(prev => ({ ...prev, loading: true, error: null }));

      const dateRange = calculateDateRange();
      console.log('📅 Período selecionado:', dateRange);
      console.log('🏢 Unidade selecionada:', selectedUnit);

      // Buscar métricas completas usando UnitMetaService
      const completeMetrics = await unitMetaService.getCompleteMetaMetrics(
        dateRange, 
        selectedUnit
      );

      console.log('✅ Métricas completas carregadas:', completeMetrics);

      // Buscar campanhas [OficialMedPro] para filtros
      const campaignsData = await unitMetaService.getOficialMedProCampaigns(
        dateRange, 
        selectedUnit
      );

      console.log('✅ Campanhas [OficialMedPro] carregadas:', campaignsData.campaigns.length);

      // Atualizar estado com dados reais
      setRealMetaData({
        // Dados de campanhas
        totalCampaigns: campaignsData.totalCampaigns,
        activeCampaigns: campaignsData.campaigns.filter(c => c.status === 'ACTIVE').length,
        pausedCampaigns: campaignsData.campaigns.filter(c => c.status === 'PAUSED').length,
        
        // Dados financeiros e de performance
        totalInvestido: completeMetrics.totalInvestido,
        leadsGerados: completeMetrics.leadsGerados,
        
        // Dados de oportunidades
        oportunidadesFechadas: completeMetrics.oportunidadesFechadas,
        valorGanho: completeMetrics.valorGanho,
        oportunidadesPerdidas: completeMetrics.oportunidadesPerdidas,
        valorPerda: completeMetrics.valorPerda,
        oportunidadesAbertas: completeMetrics.oportunidadesAbertas,
        
        // Métricas calculadas
        taxaConversao: completeMetrics.taxaConversao,
        roas: completeMetrics.roas,
        
        // Informações da conta
        accountInfo: completeMetrics.accountInfo,
        
        // Estados
        loading: false,
        error: null
      });

      // Configurar listas de filtros com dados reais
      setupFilterLists(campaignsData.campaigns);

      console.log('✅ Dados reais do Meta Ads carregados com sucesso');

    } catch (error) {
      console.error('❌ Erro ao carregar dados reais:', error);
      
      let errorMessage = 'Erro ao carregar dados do Meta Ads';
      
      if (error.message.includes('Credenciais do Meta Ads não configuradas')) {
        errorMessage = 'Credenciais do Meta Ads não configuradas para esta unidade';
      } else if (error.message.includes('Token inválido')) {
        errorMessage = 'Token de acesso inválido ou expirado';
      } else if (error.message.includes('sem permissões')) {
        errorMessage = 'Sem permissões para acessar os dados do Meta Ads';
      } else if (error.message.includes('User request limit reached')) {
        errorMessage = 'Limite de requisições atingido. Tente novamente em alguns minutos.';
      }

      setRealMetaData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  // Função para configurar listas de filtros
  const setupFilterLists = (campaigns) => {
    // Lista de campanhas
    setCampaignsList([
      { value: 'all', label: 'Todas as Campanhas' },
      ...campaigns.map(campaign => ({
        value: campaign.id,
        label: campaign.name,
        status: campaign.status
      }))
    ]);

    // Inicialmente, grupos e anúncios vazios (serão carregados quando campanha for selecionada)
    setAdSetsList([{ value: 'all', label: 'Todos os Grupos de Anúncios' }]);
    setAdsList([{ value: 'all', label: 'Todos os Anúncios' }]);
  };

  // Carregar dados quando o componente montar ou quando mudar unidade/período
  useEffect(() => {
    loadRealMetaData();
  }, [selectedUnit, selectedPeriod]);

  // Função para lidar com mudanças na campanha
  const handleCampaignChange = async (campaignId) => {
    setSelectedCampaign(campaignId);
    setSelectedAdSet('all');
    setSelectedAd('all');
    
    console.log(`🎯 Campanha alterada para:`, campaignId);
    
    if (campaignId === 'all') {
      setAdSetsList([{ value: 'all', label: 'Todos os Grupos de Anúncios' }]);
      setAdsList([{ value: 'all', label: 'Todos os Anúncios' }]);
      return;
    }

    try {
      // Buscar grupos de anúncios da campanha selecionada
      const adSets = await unitMetaService.getCampaignAdSets(campaignId, selectedUnit);
      
      setAdSetsList([
        { value: 'all', label: 'Todos os Grupos de Anúncios' },
        ...adSets.map(adSet => ({
          value: adSet.id,
          label: adSet.name,
          status: adSet.status
        }))
      ]);

      // Buscar anúncios do primeiro grupo (se houver)
      if (adSets.length > 0) {
        const ads = await unitMetaService.getAdSetAds(adSets[0].id, selectedUnit);
        setAdsList([
          { value: 'all', label: 'Todos os Anúncios' },
          ...ads.map(ad => ({
            value: ad.id,
            label: ad.name,
            status: ad.status
          }))
        ]);
      } else {
        setAdsList([{ value: 'all', label: 'Todos os Anúncios' }]);
      }

    } catch (error) {
      console.error('❌ Erro ao carregar grupos de anúncios:', error);
      setAdSetsList([{ value: 'all', label: 'Erro ao carregar grupos' }]);
      setAdsList([{ value: 'all', label: 'Erro ao carregar anúncios' }]);
    }

    if (onFilterChange) {
      onFilterChange('campaigns', campaignId);
    }
  };

  // Função para lidar com mudanças no grupo de anúncios
  const handleAdSetChange = async (adSetId) => {
    setSelectedAdSet(adSetId);
    setSelectedAd('all');
    
    console.log(`🎯 Grupo de Anúncios alterado para:`, adSetId);
    
    if (adSetId === 'all') {
      setAdsList([{ value: 'all', label: 'Todos os Anúncios' }]);
      return;
    }

    try {
      // Buscar anúncios do grupo selecionado
      const ads = await unitMetaService.getAdSetAds(adSetId, selectedUnit);
      
      setAdsList([
        { value: 'all', label: 'Todos os Anúncios' },
        ...ads.map(ad => ({
          value: ad.id,
          label: ad.name,
          status: ad.status
        }))
      ]);

    } catch (error) {
      console.error('❌ Erro ao carregar anúncios:', error);
      setAdsList([{ value: 'all', label: 'Erro ao carregar anúncios' }]);
    }

    if (onFilterChange) {
      onFilterChange('adSets', adSetId);
    }
  };

  // Função para lidar com mudanças no anúncio
  const handleAdChange = (adId) => {
    setSelectedAd(adId);
    console.log(`🎯 Anúncio alterado para:`, adId);
    
    if (onFilterChange) {
      onFilterChange('ads', adId);
    }
  };

  // Função para lidar com mudanças no status
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setSelectedCampaign('all');
    setSelectedAdSet('all');
    setSelectedAd('all');
    
    console.log(`🔄 Status alterado para:`, status);
    
    // Filtrar campanhas baseado no status
    const allCampaigns = campaignsList.filter(c => c.value !== 'all');
    let filteredCampaigns = allCampaigns;
    
    if (status !== 'all') {
      const statusMap = {
        'active': 'ACTIVE',
        'paused': 'PAUSED',
        'completed': 'COMPLETED'
      };
      
      if (statusMap[status]) {
        filteredCampaigns = allCampaigns.filter(c => c.status === statusMap[status]);
      }
    }
    
    setCampaignsList([
      { value: 'all', label: 'Todas as Campanhas' },
      ...filteredCampaigns
    ]);
  };

  // Função para testar conexão
  const testConnection = async () => {
    try {
      console.log('🔧 Testando conexão...');
      const result = await unitMetaService.testUnitConnection(selectedUnit);
      
      if (result.success) {
        alert(`✅ Conexão OK!\n\nUnidade: ${result.unitName}\nBusiness Manager: ${result.businessName}\nBusiness ID: ${result.businessId}\nApp ID: ${result.appId}`);
      } else {
        alert(`❌ Falha na conexão: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Erro no teste: ${error.message}`);
    }
  };

  // Estados de carregamento
  if (realMetaData.loading) {
    return (
      <div className="meta-ads-metrics-bar">
        <div className="meta-ads-top-row">
          <div className="meta-ads-logo">
            <img 
              src={isDarkMode ? MetaLogoDark : MetaLogoLight} 
              alt="Meta Ads" 
              className="meta-logo-img"
            />
          </div>
          <div className="meta-ads-loading">
            <div className="loading-spinner"></div>
            <span>Carregando dados reais do Meta Ads...</span>
          </div>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (realMetaData.error) {
    return (
      <div className="meta-ads-metrics-bar">
        <div className="meta-ads-top-row">
          <div className="meta-ads-logo">
            <img 
              src={isDarkMode ? MetaLogoDark : MetaLogoLight} 
              alt="Meta Ads" 
              className="meta-logo-img"
            />
          </div>
          <div className="meta-ads-error">
            <span>⚠️ {realMetaData.error}</span>
            <button onClick={testConnection} className="test-connection-btn">
              🔧 Testar Conexão
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderização principal com dados reais
  return (
    <div className="meta-ads-metrics-bar">
      {/* Logo + Filtros */}
      <div className="meta-ads-top-row">
        <div className="meta-ads-logo">
          <img 
            src={isDarkMode ? MetaLogoDark : MetaLogoLight} 
            alt="Meta Ads" 
            className="meta-logo-img"
          />
          {realMetaData.accountInfo && (
            <div className="meta-account-info">
              <small>{realMetaData.accountInfo.unitName}</small>
            </div>
          )}
        </div>
        
        <div className="meta-ads-filters">
          {/* Filtro de Status */}
          <div className="meta-filter-item">
            <select 
              className="meta-filter-select meta-filter-status"
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="active">🟢 Ativos ({realMetaData.activeCampaigns})</option>
              <option value="paused">🟡 Pausados ({realMetaData.pausedCampaigns})</option>
              <option value="all">🌐 Todos ({realMetaData.totalCampaigns})</option>
            </select>
          </div>

          {/* Filtro de Campanhas */}
          <div className="meta-filter-item">
            <select 
              className="meta-filter-select"
              value={selectedCampaign}
              onChange={(e) => handleCampaignChange(e.target.value)}
            >
              {campaignsList.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filtro de Grupos de Anúncios */}
          <div className="meta-filter-item">
            <select 
              className="meta-filter-select"
              value={selectedAdSet}
              onChange={(e) => handleAdSetChange(e.target.value)}
              disabled={selectedCampaign === 'all'}
            >
              {adSetsList.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filtro de Anúncios */}
          <div className="meta-filter-item">
            <select 
              className="meta-filter-select"
              value={selectedAd}
              onChange={(e) => handleAdChange(e.target.value)}
              disabled={selectedAdSet === 'all'}
            >
              {adsList.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Métricas Reais */}
      <div className="meta-ads-metrics-grid">
        <div className="meta-metric-item">
          <div className="meta-metric-label">💰 Investido</div>
          <div className="meta-metric-value">
            {formatCurrency(realMetaData.totalInvestido * 5.2, 'BRL')}
          </div>
        </div>

        <div className="meta-metric-item">
          <div className="meta-metric-label">👥 Leads</div>
          <div className="meta-metric-value">{realMetaData.leadsGerados}</div>
        </div>

        <div className="meta-metric-item">
          <div className="meta-metric-label">✅ Fechadas</div>
          <div className="meta-metric-value">{realMetaData.oportunidadesFechadas}</div>
        </div>

        <div className="meta-metric-item">
          <div className="meta-metric-label">📈 Taxa Conversão</div>
          <div className="meta-metric-value">{realMetaData.taxaConversao.toFixed(1)}%</div>
        </div>

        <div className="meta-metric-item">
          <div className="meta-metric-label">🎯 ROAS</div>
          <div className="meta-metric-value">{realMetaData.roas.toFixed(2)}x</div>
        </div>

        <div className="meta-metric-item">
          <div className="meta-metric-label">💚 Valor Ganho</div>
          <div className="meta-metric-value">
            {formatCurrency(realMetaData.valorGanho, 'BRL')}
          </div>
        </div>
      </div>

      {/* Informações adicionais */}
      {realMetaData.accountInfo && (
        <div className="meta-ads-info">
          <small>
            📊 {realMetaData.totalCampaigns} campanhas | 
            🎯 {realMetaData.accountInfo.accountName} | 
            🏢 {realMetaData.accountInfo.unitName}
          </small>
        </div>
      )}
    </div>
  );
};

export default RealMetaAdsMetricsBar;
