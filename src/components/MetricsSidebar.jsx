import React, { useState, useEffect } from 'react';
import './MetricsSidebar.css';
import GoogleInvestimentoCard from './GoogleInvestimentoCard';
import { metaAdsService } from '../service/metaAdsService';
import { unitMetaService } from '../service/unitMetaService';

const MetricsSidebar = ({ formatCurrency, t, selectedPeriod, startDate, endDate, selectedUnit, selectedFunnel, selectedSeller }) => {
  // Estados para os filtros do Meta
  const [metaFilters, setMetaFilters] = useState({
    campaign: 'all',
    adSet: 'all',
    ad: 'all'
  });

  // Estados para os dados do Meta
  const [metaData, setMetaData] = useState({
    campaigns: [],
    adSets: [],
    ads: [],
    currentSpend: 0,
    totalSpend: 0,
    loading: false,
    error: null
  });

  // Estados para os dados reais do UnitMetaService
  const [realMetaData, setRealMetaData] = useState({
    totalInvestido: 0,
    currentInvestido: 0, // Valor investido da seleção atual
    leadsGerados: 0,
    oportunidadesFechadas: 0,
    valorGanho: 0,
    oportunidadesPerdidas: 0,
    valorPerda: 0,
    oportunidadesAbertas: 0,
    taxaConversao: 0,
    roas: 0,
    loading: false,
    error: null,
    adSets: [],
    loadingAdSets: false,
    ads: [],
    loadingAds: false
  });

  // Estados para os dropdowns
  const [openDropdown, setOpenDropdown] = useState(null);
  
  // Estados para gastos individuais dos anúncios
  const [adSpends, setAdSpends] = useState({});

  // Função para recalcular métricas baseado na seleção atual
  const recalculateMetrics = async () => {
    try {
      console.log('🔄 Recalculando métricas para seleção atual...');
      
      // Por enquanto, sempre usar métricas totais da unidade (sem filtros específicos)
      // TODO: Implementar filtros por UTM quando os dados estiverem disponíveis
      console.log('📊 Usando métricas totais da unidade (filtros por campanha/UTM ainda não implementados)');
      
      // Buscar métricas totais da unidade (sem filtros de campanha)
      const totalMetrics = await unitMetaService.getCompleteMetaMetrics(
        getDateRange(), 
        selectedUnit, 
        null // Sem filtros específicos por enquanto
      );
      
      // Atualizar métricas de oportunidades usando sempre os totais
      // Apenas o valor investido será específico da seleção
      setRealMetaData(prev => ({
        ...prev,
        // Manter currentInvestido como está (gerenciado pelos outros métodos)
        leadsGerados: totalMetrics.leadsGerados,
        oportunidadesFechadas: totalMetrics.oportunidadesFechadas,
        valorGanho: totalMetrics.valorGanho,
        oportunidadesPerdidas: totalMetrics.oportunidadesPerdidas,
        valorPerda: totalMetrics.valorPerda,
        oportunidadesAbertas: totalMetrics.oportunidadesAbertas,
        taxaConversao: prev.currentInvestido > 0 && totalMetrics.leadsGerados > 0 ? 
          (totalMetrics.oportunidadesFechadas / totalMetrics.leadsGerados) * 100 : 0,
        roas: prev.currentInvestido > 0 ? totalMetrics.valorGanho / prev.currentInvestido : 0
      }));
      
      console.log('✅ Métricas atualizadas (usando totais da unidade)');
      console.log(`📊 Valor Investido (específico): $${prev.currentInvestido?.toFixed(2) || 0}`);
      console.log(`📊 Oportunidades (totais): ${totalMetrics.oportunidadesFechadas} fechadas, ${totalMetrics.oportunidadesPerdidas} perdidas`);
      
      // Debug específico se taxa de conversão estiver em 0%
      if (totalMetrics.taxaConversao === 0 && totalMetrics.leadsGerados > 0) {
        console.log('🚨 PROBLEMA DETECTADO: Taxa de Conversão = 0% mas há leads!');
        console.log(`📊 Leads: ${totalMetrics.leadsGerados}, Fechadas: ${totalMetrics.oportunidadesFechadas}`);
        console.log('🔍 Executando teste diagnóstico...');
        
        // Executar teste de consultas Supabase
        setTimeout(() => {
          unitMetaService.testSupabaseQueries(selectedUnit)
            .then(result => {
              console.log('🔍 Resultado do teste de consultas:', result);
            })
            .catch(err => {
              console.error('❌ Erro no teste de consultas:', err);
            });
        }, 500);
      }
      
    } catch (error) {
      console.error('❌ Erro ao recalcular métricas:', error);
    }
  };

  // Função para obter o período baseado no FilterBar
  const getDateRange = () => {
    if (startDate && endDate) {
      return { since: startDate, until: endDate };
    }

    // Períodos pré-definidos
    const today = new Date();
    switch (selectedPeriod) {
      case 'today':
        return { since: today.toISOString().split('T')[0], until: today.toISOString().split('T')[0] };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { since: yesterday.toISOString().split('T')[0], until: yesterday.toISOString().split('T')[0] };
      case 'last7Days':
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        return { since: last7Days.toISOString().split('T')[0], until: today.toISOString().split('T')[0] };
      case 'thisMonth':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { since: firstDay.toISOString().split('T')[0], until: lastDay.toISOString().split('T')[0] };
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        return { since: quarterStart.toISOString().split('T')[0], until: quarterEnd.toISOString().split('T')[0] };
      case 'thisYear':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31);
        return { since: yearStart.toISOString().split('T')[0], until: yearEnd.toISOString().split('T')[0] };
      default:
        return { since: today.toISOString().split('T')[0], until: today.toISOString().split('T')[0] };
    }
  };

  // Função para buscar dados reais do Meta usando UnitMetaService
  const fetchRealMetaData = async () => {
    try {
      setRealMetaData(prev => ({ ...prev, loading: true, error: null }));
      
      const dateRange = getDateRange();
      console.log('🏢 Buscando dados reais do Meta para unidade:', selectedUnit);
      console.log('📅 Período:', dateRange);
      
      // Buscar métricas completas usando o novo service
      const metrics = await unitMetaService.getCompleteMetaMetrics(dateRange, selectedUnit);
      
      setRealMetaData(prev => ({
        ...prev,
        totalInvestido: metrics.totalInvestido,
        currentInvestido: metrics.totalInvestido, // Inicialmente igual ao total
        leadsGerados: metrics.leadsGerados,
        oportunidadesFechadas: metrics.oportunidadesFechadas,
        valorGanho: metrics.valorGanho,
        oportunidadesPerdidas: metrics.oportunidadesPerdidas,
        valorPerda: metrics.valorPerda,
        oportunidadesAbertas: metrics.oportunidadesAbertas,
        taxaConversao: metrics.taxaConversao,
        roas: metrics.roas,
        loading: false,
        error: null,
        accountInfo: metrics.accountInfo,
        campanhas: metrics.campanhas
      }));

      console.log('✅ Dados reais do Meta carregados:', metrics);

    } catch (error) {
      console.error('❌ Erro ao buscar dados reais do Meta:', error);
      setRealMetaData(prev => ({
        ...prev,
        loading: false,
        error: `Erro ao carregar dados: ${error.message}`
      }));
    }
  };

  // Função para buscar dados do Meta (mantida para compatibilidade)
  const fetchMetaData = async () => {
    try {
      setMetaData(prev => ({ ...prev, loading: true, error: null }));
      
      const dateRange = getDateRange();
      console.log('📅 Buscando dados do Meta para período:', dateRange);
      
      // Buscar campanhas com insights
      const campaignsWithInsights = await metaAdsService.getCampaignsWithInsights(dateRange);
      
      if (!campaignsWithInsights || campaignsWithInsights.length === 0) {
        setMetaData(prev => ({
          ...prev,
          campaigns: [],
          adSets: [],
          ads: [],
          currentSpend: 0,
          totalSpend: 0,
          loading: false,
          error: 'Nenhuma campanha encontrada para este período'
        }));
        return;
      }

      // Calcular gasto total
      const totalSpend = campaignsWithInsights.reduce((total, campaign) => {
        if (campaign.insights && campaign.insights.spend) {
          return total + parseFloat(campaign.insights.spend);
        }
        return total;
      }, 0);

      setMetaData(prev => ({
        ...prev,
        campaigns: campaignsWithInsights,
        adSets: [], // Será preenchido quando uma campanha for selecionada
        ads: [], // Será preenchido quando um adSet for selecionado
        currentSpend: totalSpend,
        totalSpend: totalSpend,
        loading: false,
        error: null
      }));

      console.log('✅ Dados do Meta carregados:', {
        campaigns: campaignsWithInsights.length,
        totalSpend: totalSpend
      });

    } catch (error) {
      console.error('❌ Erro ao buscar dados do Meta:', error);
      setMetaData(prev => ({
        ...prev,
        loading: false,
        error: `Erro ao carregar dados: ${error.message}`
      }));
    }
  };

  // Carregar dados quando mudar o período, datas ou unidade selecionada
  useEffect(() => {
    // Carregar dados reais baseados na unidade selecionada
    fetchRealMetaData();
    
    // Manter compatibilidade com dados antigos
    fetchMetaData();
  }, [selectedPeriod, startDate, endDate, selectedUnit]);

  // Função para alternar dropdowns
  const toggleDropdown = (dropdownName) => {
    if (openDropdown === dropdownName) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(dropdownName);
    }
  };

  // Função para selecionar campanha
  const handleCampaignChange = async (campaignName) => {
    setMetaFilters(prev => ({ ...prev, campaign: campaignName, adSet: 'all', ad: 'all' }));
    setOpenDropdown(null);

    console.log('🎯 Campanha selecionada:', campaignName);

    if (campaignName === 'all') {
      // Mostrar totais de todas as campanhas e restaurar valor total
      console.log('📊 Mostrando totais de todas as campanhas');
      setRealMetaData(prev => ({ 
        ...prev, 
        currentInvestido: prev.totalInvestido, // Volta ao valor total
        adSets: [], 
        loadingAdSets: false, 
        ads: [], 
        loadingAds: false 
      }));
      
      // Recalcular métricas para todas as campanhas
      setTimeout(() => recalculateMetrics(), 100);
      return;
    }

    try {
      // Buscar dados da campanha específica selecionada
      const selectedCampaign = realMetaData.campanhas?.detalhes?.find(c => c.name === campaignName);
      if (selectedCampaign && realMetaData.accountInfo) {
        const campaignSpend = parseFloat(selectedCampaign.spend) || 0;
        console.log(`💰 Campanha ${campaignName}: $${campaignSpend.toFixed(2)}`);
        
        // Buscar ID da campanha real (precisa buscar da API Meta)
        setRealMetaData(prev => ({ ...prev, loadingAdSets: true }));
        
        // Primeiro, vamos buscar a campanha completa para obter o ID
        const fullCampaigns = await unitMetaService.getOficialMedProCampaigns(
          getDateRange(), 
          selectedUnit
        );
        
        const fullCampaign = fullCampaigns.campaigns.find(c => c.name === campaignName);
        
        if (fullCampaign) {
          // Buscar gasto específico da campanha
          const campaignInsights = await unitMetaService.getCampaignInsights(
            fullCampaign.id, 
            getDateRange(), 
            selectedUnit
          );
          
          // Buscar grupos de anúncios desta campanha
          const adSets = await unitMetaService.getCampaignAdSets(fullCampaign.id, selectedUnit);
          
          setRealMetaData(prev => ({ 
            ...prev, 
            currentInvestido: campaignInsights.spend, // Atualizar valor investido
            adSets: adSets,
            loadingAdSets: false
          }));
          
          console.log(`✅ ${adSets.length} grupos encontrados para campanha ${campaignName}`);
          console.log(`💰 Valor investido da campanha: $${campaignInsights.spend.toFixed(2)}`);
          
          // Recalcular métricas para a campanha específica
          setTimeout(() => recalculateMetrics(), 100);
        } else {
          console.warn('⚠️ Campanha não encontrada para buscar grupos');
          setRealMetaData(prev => ({ ...prev, adSets: [], loadingAdSets: false }));
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar grupos de anúncios:', error);
      setRealMetaData(prev => ({ ...prev, adSets: [], loadingAdSets: false }));
    }
  };

  // Função para selecionar grupo de anúncios
  const handleAdSetChange = async (adSetId) => {
    setMetaFilters(prev => ({ ...prev, adSet: adSetId, ad: 'all' }));
    setOpenDropdown(null);

    console.log('🎯 AdSet selecionado:', adSetId);

    if (adSetId === 'all') {
      // Mostrar todos os grupos e restaurar valor da campanha
      console.log('📊 Mostrando todos os grupos de anúncios');
      
      // Buscar valor da campanha atual para restaurar
      if (metaFilters.campaign !== 'all') {
        try {
          const fullCampaigns = await unitMetaService.getOficialMedProCampaigns(
            getDateRange(), 
            selectedUnit
          );
          
          const fullCampaign = fullCampaigns.campaigns.find(c => c.name === metaFilters.campaign);
          
          if (fullCampaign) {
            const campaignInsights = await unitMetaService.getCampaignInsights(
              fullCampaign.id, 
              getDateRange(), 
              selectedUnit
            );
            
            setRealMetaData(prev => ({ 
              ...prev, 
              currentInvestido: campaignInsights.spend, // Volta ao valor da campanha
              ads: [], 
              loadingAds: false 
            }));
          }
        } catch (error) {
          console.error('❌ Erro ao restaurar valor da campanha:', error);
          setRealMetaData(prev => ({ ...prev, ads: [], loadingAds: false }));
        }
      } else {
        setRealMetaData(prev => ({ ...prev, ads: [], loadingAds: false }));
      }
      return;
    }

    try {
      // Buscar gasto específico do grupo e anúncios
      setRealMetaData(prev => ({ ...prev, loadingAds: true }));
      
      // Buscar insights do grupo
      const adSetInsights = await unitMetaService.getAdSetInsights(
        adSetId, 
        getDateRange(), 
        selectedUnit
      );
      
      // Buscar anúncios do grupo
      const ads = await unitMetaService.getAdSetAds(adSetId, selectedUnit);
      
      // Buscar gastos individuais de cada anúncio (em paralelo)
      console.log(`🔍 Buscando gastos individuais de ${ads.length} anúncios...`);
      const adsWithSpends = await Promise.allSettled(
        ads.map(async (ad) => {
          const insights = await unitMetaService.getAdInsights(
            ad.id, 
            getDateRange(), 
            selectedUnit
          );
          return {
            ...ad,
            spend: insights.spend,
            insights: insights.insights
          };
        })
      );
      
      // Processar resultados e criar mapa de gastos
      const newAdSpends = {};
      const enrichedAds = adsWithSpends.map((result, index) => {
        if (result.status === 'fulfilled') {
          const adData = result.value;
          newAdSpends[adData.id] = adData.spend;
          return adData;
        } else {
          console.error(`❌ Erro ao buscar gasto do anúncio ${ads[index].id}:`, result.reason);
          newAdSpends[ads[index].id] = 0;
          return { ...ads[index], spend: 0 };
        }
      });
      
      // Calcular total de gastos dos anúncios para comparação
      const totalAdsSpend = Object.values(newAdSpends).reduce((sum, spend) => sum + spend, 0);
      
      setAdSpends(newAdSpends);
      setRealMetaData(prev => ({ 
        ...prev, 
        currentInvestido: adSetInsights.spend, // Atualizar valor investido
        ads: enrichedAds,
        loadingAds: false
      }));
      
      console.log(`✅ ${ads.length} anúncios encontrados para grupo ${adSetId}`);
      console.log(`💰 Valor investido do grupo: $${adSetInsights.spend.toFixed(2)}`);
      console.log(`💰 Soma dos gastos individuais: $${totalAdsSpend.toFixed(2)}`);
      console.log(`📊 Gastos por anúncio:`, newAdSpends);
      
      // Recalcular métricas para o grupo específico
      setTimeout(() => recalculateMetrics(), 100);
      
    } catch (error) {
      console.error('❌ Erro ao buscar anúncios:', error);
      setRealMetaData(prev => ({ ...prev, ads: [], loadingAds: false }));
    }
  };

  // Função para selecionar anúncio
  const handleAdChange = async (adId) => {
    setMetaFilters(prev => ({ ...prev, ad: adId }));
    setOpenDropdown(null);

    console.log('🎯 Anúncio selecionado:', adId);

    if (adId === 'all') {
      // Mostrar todos os anúncios e restaurar valor do grupo
      console.log('📊 Mostrando todos os anúncios do grupo');
      
      // Restaurar valor do grupo atual
      if (metaFilters.adSet !== 'all') {
        try {
          const adSetInsights = await unitMetaService.getAdSetInsights(
            metaFilters.adSet, 
            getDateRange(), 
            selectedUnit
          );
          
          setRealMetaData(prev => ({ 
            ...prev, 
            currentInvestido: adSetInsights.spend // Volta ao valor do grupo
          }));
          
          console.log(`💰 Restaurado valor do grupo: $${adSetInsights.spend.toFixed(2)}`);
        } catch (error) {
          console.error('❌ Erro ao restaurar valor do grupo:', error);
        }
      }
      return;
    }

    // Buscar dados específicos do anúncio selecionado
    const selectedAd = realMetaData.ads.find(a => a.id === adId);
    if (selectedAd) {
      const adSpend = selectedAd.spend || 0;
      
      setRealMetaData(prev => ({ 
        ...prev, 
        currentInvestido: adSpend // Usar gasto já carregado
      }));
      
      console.log(`📱 Anúncio: ${selectedAd.name} (${selectedAd.status})`);
      console.log(`💰 Valor investido do anúncio: $${adSpend.toFixed(2)}`);
      
      if (adSpend === 0) {
        console.log(`⚠️ Este anúncio não teve gastos no período selecionado`);
        console.log(`🔍 Status: ${selectedAd.status} - Possíveis motivos: sem impressões, budget zerado, ou recém-criado`);
      }
      
      // Recalcular métricas para o anúncio específico
      setTimeout(() => recalculateMetrics(), 100);
    }
  };

  // Função para formatar valor monetário
  const formatSpend = (value) => {
    if (typeof value === 'number') {
      return formatCurrency(value, 'USD');
    }
    return formatCurrency(0, 'USD');
  };

  return (
    <div className="ms-users-sidebar">
      <div className="ms-users-header">
        <h3>{t.financialMetrics}</h3>
      </div>
      
      <div className="ms-financial-metrics-new">
        {/* Google Metrics Card (dados reais Supabase) */}
        <GoogleInvestimentoCard 
          t={t}
          formatCurrency={formatCurrency}
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={selectedSeller}
        />
        
        {/* Meta Metrics Card - DADOS REAIS DA UNIDADE SELECIONADA */}
        <div className="ms-metric-card ms-meta-card">
          <div className="ms-metric-card-header">
            <div className="ms-platform-icon ms-meta-icon">M</div>
            <span className="ms-platform-name">
              Meta {realMetaData.accountInfo?.unitName ? `(${realMetaData.accountInfo.unitName})` : ''}
            </span>
            <div className={`ms-roas-badge ${realMetaData.roas >= 4 ? 'ms-roas-excellent' : realMetaData.roas >= 3 ? 'ms-roas-good' : 'ms-roas-poor'}`}>
              {realMetaData.loading ? 'Carregando...' : `ROAS ${realMetaData.roas.toFixed(2)}x`}
            </div>
          </div>

          {/* Filtros em cascata para Meta */}
          <div className="ms-meta-filters">
            {/* Filtro de Campanhas */}
            <div className="ms-filter-group">
              <div className="ms-filter-dropdown">
                <button 
                  className="ms-filter-button"
                  onClick={() => toggleDropdown('campaigns')}
                  disabled={realMetaData.loading}
                >
                  <span>
                    {realMetaData.loading ? 'Carregando campanhas...' :
                     metaFilters.campaign === 'all' 
                      ? `Todas as Campanhas (${realMetaData.campanhas?.detalhes?.length || 0})` 
                      : realMetaData.campanhas?.detalhes?.find(c => c.name === metaFilters.campaign)?.name || 'Campanha'
                    }
                  </span>
                  <span className="ms-filter-arrow">▼</span>
                </button>
                
                {openDropdown === 'campaigns' && !realMetaData.loading && (
                  <div className="ms-filter-menu">
                    <div 
                      className={`ms-filter-item ${metaFilters.campaign === 'all' ? 'ms-selected' : ''}`}
                      onClick={() => handleCampaignChange('all')}
                    >
                      Todas as Campanhas ({realMetaData.campanhas?.total || 0})
                    </div>
                    {realMetaData.campanhas?.detalhes?.map((campaign, index) => (
                      <div 
                        key={campaign.name + index}
                        className={`ms-filter-item ${metaFilters.campaign === campaign.name ? 'ms-selected' : ''}`}
                        onClick={() => handleCampaignChange(campaign.name)}
                        title={campaign.name}
                      >
                        <div className="ms-campaign-item">
                          <span className="ms-campaign-name">{campaign.name}</span>
                          <span className="ms-campaign-spend">
                            {formatCurrency(parseFloat(campaign.spend || 0) * 5.2, 'BRL')}
                          </span>
                        </div>
                      </div>
                    )) || (
                      <div className="ms-filter-item ms-disabled">
                        Nenhuma campanha [OficialMedPro] encontrada
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Filtro de Grupos de Anúncios (só aparece se campanha selecionada) */}
            {metaFilters.campaign !== 'all' && (
              <div className="ms-filter-group">
                <div className="ms-filter-dropdown">
                  <button 
                    className="ms-filter-button"
                    onClick={() => toggleDropdown('adSets')}
                    disabled={realMetaData.loadingAdSets}
                  >
                    <span>
                      {realMetaData.loadingAdSets ? 'Carregando grupos...' :
                       metaFilters.adSet === 'all' 
                        ? `Todos os Grupos (${realMetaData.adSets.length})` 
                        : realMetaData.adSets.find(a => a.id === metaFilters.adSet)?.name || 'Grupo Selecionado'
                      }
                    </span>
                    <span className="ms-filter-arrow">▼</span>
                  </button>
                  
                  {openDropdown === 'adSets' && !realMetaData.loadingAdSets && (
                    <div className="ms-filter-menu">
                      <div 
                        className={`ms-filter-item ${metaFilters.adSet === 'all' ? 'ms-selected' : ''}`}
                        onClick={() => handleAdSetChange('all')}
                      >
                        Todos os Grupos ({realMetaData.adSets.length})
                      </div>
                      {realMetaData.adSets.length > 0 ? realMetaData.adSets.map((adSet) => (
                        <div 
                          key={adSet.id}
                          className={`ms-filter-item ${metaFilters.adSet === adSet.id ? 'ms-selected' : ''}`}
                          onClick={() => handleAdSetChange(adSet.id)}
                          title={adSet.name}
                        >
                          <div className="ms-campaign-item">
                            <span className="ms-campaign-name">{adSet.name}</span>
                            <span className="ms-campaign-spend">
                              {adSet.status === 'ACTIVE' ? '✅' : '⏸️'}
                            </span>
                          </div>
                        </div>
                      )) : (
                        <div className="ms-filter-item ms-disabled">
                          Nenhum grupo de anúncios encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Filtro de Anúncios (só aparece se grupo selecionado) */}
            {metaFilters.adSet !== 'all' && metaFilters.campaign !== 'all' && (
              <div className="ms-filter-group">
                <div className="ms-filter-dropdown">
                  <button 
                    className="ms-filter-button"
                    onClick={() => toggleDropdown('ads')}
                    disabled={realMetaData.loadingAds}
                  >
                    <span>
                      {realMetaData.loadingAds ? 'Carregando anúncios...' :
                       metaFilters.ad === 'all' 
                        ? `Todos os Anúncios (${realMetaData.ads.length})` 
                        : realMetaData.ads.find(a => a.id === metaFilters.ad)?.name || 'Anúncio Selecionado'
                      }
                    </span>
                    <span className="ms-filter-arrow">▼</span>
                  </button>
                  
                  {openDropdown === 'ads' && !realMetaData.loadingAds && (
                    <div className="ms-filter-menu">
                      <div 
                        className={`ms-filter-item ${metaFilters.ad === 'all' ? 'ms-selected' : ''}`}
                        onClick={() => handleAdChange('all')}
                      >
                        Todos os Anúncios ({realMetaData.ads.length})
                      </div>
                      {realMetaData.ads.length > 0 ? realMetaData.ads.map((ad) => (
                        <div 
                          key={ad.id}
                          className={`ms-filter-item ${metaFilters.ad === ad.id ? 'ms-selected' : ''}`}
                          onClick={() => handleAdChange(ad.id)}
                          title={ad.name}
                        >
                          <div className="ms-campaign-item">
                            <span className="ms-campaign-name">{ad.name}</span>
                            <span className="ms-campaign-spend">
                              {ad.spend !== undefined ? 
                                formatCurrency(ad.spend * 5.2, 'BRL') :
                                (ad.status === 'ACTIVE' ? '✅' : 
                                 ad.status === 'PAUSED' ? '⏸️' : 
                                 ad.status === 'ARCHIVED' ? '🗄️' : '❓')
                              }
                            </span>
                          </div>
                        </div>
                      )) : (
                        <div className="ms-filter-item ms-disabled">
                          Nenhum anúncio encontrado neste grupo
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="ms-metrics-grid">
            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Investido</span>
                <span className="ms-metric-value">
                  {realMetaData.loading ? 'Carregando...' : 
                   realMetaData.error ? 'Erro' :
                   formatCurrency(realMetaData.currentInvestido * 5.2, 'BRL')
                  }
                </span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: realMetaData.totalInvestido > 0 ? 
                        `${Math.min((realMetaData.currentInvestido / realMetaData.totalInvestido) * 100, 100)}%` : 
                        '0%',
                      background: 'linear-gradient(90deg, #ef4444, #dc2626)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Taxa Conversão</span>
                <span className="ms-metric-value">
                  {realMetaData.loading ? 'Carregando...' : 
                   realMetaData.error ? 'Erro' :
                   `${realMetaData.leadsGerados} → ${realMetaData.oportunidadesFechadas} (${realMetaData.taxaConversao.toFixed(1)}%)`
                  }
                </span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: `${Math.min(realMetaData.taxaConversao, 100)}%`, 
                      background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Ganho</span>
                <span className="ms-metric-value">
                  {realMetaData.loading ? 'Carregando...' : 
                   realMetaData.error ? 'Erro' :
                   formatCurrency(realMetaData.valorGanho, 'BRL')
                  }
                </span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: realMetaData.valorGanho > 0 ? `${Math.min((realMetaData.valorGanho / 200000) * 100, 100)}%` : '0%', 
                      background: 'linear-gradient(90deg, #10b981, #059669)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Perdidas</span>
                <span className="ms-metric-value">
                  {realMetaData.loading ? 'Carregando...' : 
                   realMetaData.error ? 'Erro' :
                   realMetaData.oportunidadesPerdidas
                  }
                </span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: `${Math.min((realMetaData.oportunidadesPerdidas / 100) * 100, 100)}%`, 
                      background: 'linear-gradient(90deg, #f59e0b, #d97706)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Abertas</span>
                <span className="ms-metric-value">
                  {realMetaData.loading ? 'Carregando...' : 
                   realMetaData.error ? 'Erro' :
                   realMetaData.oportunidadesAbertas
                  }
                </span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: `${Math.min((realMetaData.oportunidadesAbertas / 50) * 100, 100)}%`, 
                      background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Perda</span>
                <span className="ms-metric-value">
                  {realMetaData.loading ? 'Carregando...' : 
                   realMetaData.error ? 'Erro' :
                   formatCurrency(realMetaData.valorPerda, 'BRL')
                  }
                </span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: realMetaData.valorPerda > 0 ? `${Math.min((realMetaData.valorPerda / 150000) * 100, 100)}%` : '0%', 
                      background: 'linear-gradient(90deg, #ef4444, #dc2626)'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagem de erro ou carregamento */}
          {realMetaData.error && (
            <div className="ms-error-message">
              ⚠️ {realMetaData.error}
            </div>
          )}
          
          {realMetaData.loading && (
            <div className="ms-loading-message">
              🔄 Carregando dados reais do Meta...
            </div>
          )}

          {/* Informações adicionais quando carregado */}
          {!realMetaData.loading && !realMetaData.error && realMetaData.accountInfo && (
            <div className="ms-meta-info">
              <small>
                📊 Conta: {realMetaData.accountInfo.accountName} | 
                🏢 Unidade: {realMetaData.accountInfo.unitName} |
                🎯 {realMetaData.campanhas?.total || 0} campanhas [OficialMedPro]
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsSidebar;
