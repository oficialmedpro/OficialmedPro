import React, { useState, useEffect } from 'react';
import './MetricsSidebar.css';
import { metaAdsService } from '../service/metaAdsService';

const MetricsSidebar = ({ formatCurrency, t, selectedPeriod, startDate, endDate }) => {
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

  // Estados para os dropdowns
  const [openDropdown, setOpenDropdown] = useState(null);

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

  // Função para buscar dados do Meta
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

  // Carregar dados quando mudar o período ou datas
  useEffect(() => {
    fetchMetaData();
  }, [selectedPeriod, startDate, endDate]);

  // Função para alternar dropdowns
  const toggleDropdown = (dropdownName) => {
    if (openDropdown === dropdownName) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(dropdownName);
    }
  };

  // Função para selecionar campanha
  const handleCampaignChange = async (campaignId) => {
    setMetaFilters(prev => ({ ...prev, campaign: campaignId, adSet: 'all', ad: 'all' }));
    setOpenDropdown(null);

    if (campaignId === 'all') {
      // Resetar para total de todas as campanhas
      setMetaData(prev => ({ ...prev, currentSpend: prev.totalSpend }));
      return;
    }

    try {
      // Buscar grupos de anúncios da campanha selecionada
      const campaign = metaData.campaigns.find(c => c.id === campaignId);
      if (campaign && campaign.insights) {
        const campaignSpend = parseFloat(campaign.insights.spend) || 0;
        setMetaData(prev => ({ 
          ...prev, 
          currentSpend: campaignSpend,
          adSets: [], // TODO: Implementar busca de adSets
          ads: []
        }));
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados da campanha:', error);
    }
  };

  // Função para selecionar grupo de anúncios
  const handleAdSetChange = (adSetId) => {
    setMetaFilters(prev => ({ ...prev, adSet: adSetId, ad: 'all' }));
    setOpenDropdown(null);

    if (adSetId === 'all') {
      // Voltar para o gasto da campanha
      const campaign = metaData.campaigns.find(c => c.id === metaFilters.campaign);
      if (campaign && campaign.insights) {
        const campaignSpend = parseFloat(campaign.insights.spend) || 0;
        setMetaData(prev => ({ ...prev, currentSpend: campaignSpend }));
      }
      return;
    }

    // TODO: Implementar busca de gasto do adSet
    console.log('🎯 AdSet selecionado:', adSetId);
  };

  // Função para selecionar anúncio
  const handleAdChange = (adId) => {
    setMetaFilters(prev => ({ ...prev, ad: adId }));
    setOpenDropdown(null);

    if (adId === 'all') {
      // Voltar para o gasto do adSet
      handleAdSetChange(metaFilters.adSet);
      return;
    }

    // TODO: Implementar busca de gasto do anúncio
    console.log('🎯 Anúncio selecionado:', adId);
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
        {/* Google Metrics Card */}
        <div className="ms-metric-card ms-google-card">
          <div className="ms-metric-card-header">
            <div className="ms-platform-icon ms-google-icon">G</div>
            <span className="ms-platform-name">Google</span>
            <div className="ms-roas-badge ms-roas-excellent">ROAS 3.47x</div>
          </div>
          
          <div className="ms-metrics-grid">
            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Investido</span>
                <span className="ms-metric-value">{formatCurrency(45000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '85%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Taxa Conversão</span>
                <span className="ms-metric-value">78 → 5 (6.4%)</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '64%', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Ganho</span>
                <span className="ms-metric-value">{formatCurrency(156000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '92%', background: 'linear-gradient(90deg, #10b981, #059669)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Perdidas</span>
                <span className="ms-metric-value">73</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '73%', background: 'linear-gradient(90deg, #f59e0b, #d97706)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Abertas</span>
                <span className="ms-metric-value">12</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '30%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Perda</span>
                <span className="ms-metric-value">{formatCurrency(89000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '57%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Meta Metrics Card - COM FILTROS EM CASCATA */}
        <div className="ms-metric-card ms-meta-card">
          <div className="ms-metric-card-header">
            <div className="ms-platform-icon ms-meta-icon">M</div>
            <span className="ms-platform-name">Meta</span>
            <div className="ms-roas-badge ms-roas-good">ROAS 3.06x</div>
          </div>

          {/* Filtros em cascata para Meta */}
          <div className="ms-meta-filters">
            {/* Filtro de Campanhas */}
            <div className="ms-filter-group">
              <div className="ms-filter-dropdown">
                <button 
                  className="ms-filter-button"
                  onClick={() => toggleDropdown('campaigns')}
                >
                  <span>
                    {metaFilters.campaign === 'all' 
                      ? 'Todas as Campanhas' 
                      : metaData.campaigns.find(c => c.id === metaFilters.campaign)?.name || 'Campanha'
                    }
                  </span>
                  <span className="ms-filter-arrow">▼</span>
                </button>
                
                {openDropdown === 'campaigns' && (
                  <div className="ms-filter-menu">
                    <div 
                      className={`ms-filter-item ${metaFilters.campaign === 'all' ? 'ms-selected' : ''}`}
                      onClick={() => handleCampaignChange('all')}
                    >
                      Todas as Campanhas
                    </div>
                    {metaData.campaigns.map((campaign) => (
                      <div 
                        key={campaign.id}
                        className={`ms-filter-item ${metaFilters.campaign === campaign.id ? 'ms-selected' : ''}`}
                        onClick={() => handleCampaignChange(campaign.id)}
                      >
                        {campaign.name}
                      </div>
                    ))}
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
                  >
                    <span>
                      {metaFilters.adSet === 'all' 
                        ? 'Todos os Grupos' 
                        : 'Grupo Selecionado'
                      }
                    </span>
                    <span className="ms-filter-arrow">▼</span>
                  </button>
                  
                  {openDropdown === 'adSets' && (
                    <div className="ms-filter-menu">
                      <div 
                        className={`ms-filter-item ${metaFilters.adSet === 'all' ? 'ms-selected' : ''}`}
                        onClick={() => handleAdSetChange('all')}
                      >
                        Todos os Grupos
                      </div>
                      {/* TODO: Implementar lista de adSets */}
                      <div className="ms-filter-item ms-disabled">
                        Carregando grupos...
                      </div>
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
                  >
                    <span>
                      {metaFilters.ad === 'all' 
                        ? 'Todos os Anúncios' 
                        : 'Anúncio Selecionado'
                      }
                    </span>
                    <span className="ms-filter-arrow">▼</span>
                  </button>
                  
                  {openDropdown === 'ads' && (
                    <div className="ms-filter-menu">
                      <div 
                        className={`ms-filter-item ${metaFilters.ad === 'all' ? 'ms-selected' : ''}`}
                        onClick={() => handleAdChange('all')}
                      >
                        Todos os Anúncios
                      </div>
                      {/* TODO: Implementar lista de anúncios */}
                      <div className="ms-filter-item ms-disabled">
                        Carregando anúncios...
                      </div>
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
                  {metaData.loading ? 'Carregando...' : 
                   metaData.error ? 'Erro' :
                   formatSpend(metaData.currentSpend)
                  }
                </span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: metaData.totalSpend > 0 ? `${(metaData.currentSpend / metaData.totalSpend) * 100}%` : '0%',
                      background: 'linear-gradient(90deg, #ef4444, #dc2626)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Taxa Conversão</span>
                <span className="ms-metric-value">45 → 3 (6.7%)</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '67%', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Ganho</span>
                <span className="ms-metric-value">{formatCurrency(98000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '63%', background: 'linear-gradient(90deg, #10b981, #059669)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Perdidas</span>
                <span className="ms-metric-value">42</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '42%', background: 'linear-gradient(90deg, #f59e0b, #d97706)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Abertas</span>
                <span className="ms-metric-value">8</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '20%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Perda</span>
                <span className="ms-metric-value">{formatCurrency(67000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '43%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagem de erro ou carregamento */}
          {metaData.error && (
            <div className="ms-error-message">
              ⚠️ {metaData.error}
            </div>
          )}
          
          {metaData.loading && (
            <div className="ms-loading-message">
              🔄 Carregando dados do Meta...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsSidebar;
