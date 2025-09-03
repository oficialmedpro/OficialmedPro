import React, { useState, useEffect } from 'react';
import './GoogleAdsMetricsBar.css';

// Importar logos do Google Ads
import GoogleAdsLogoDark from '../assets/google_ads_dark.png';
import GoogleAdsLogoLight from '../assets/google_ads_light.png';

const GoogleAdsMetricsBar = ({ 
  isDarkMode, 
  onAccountChange, 
  onCampaignChange, 
  onAdGroupChange, 
  onAdChange 
}) => {
  // Estados para os filtros
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedAdGroup, setSelectedAdGroup] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);

  // Estados para os dados
  const [accounts, setAccounts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [adGroups, setAdGroups] = useState([]);
  const [ads, setAds] = useState([]);

  // Estado de carregamento
  const [loading, setLoading] = useState(true);

  // Simular dados da Unidade 1 (Apucarana)
  useEffect(() => {
    const loadGoogleAdsData = async () => {
      try {
        setLoading(true);
        
        // Simular dados da Unidade 1 - Apucarana
        const mockAccounts = [
          {
            id: '1',
            name: 'Unidade 1 - Apucarana',
            status: 'active',
            currency: 'BRL',
            timezone: 'America/Sao_Paulo'
          }
        ];

        const mockCampaigns = [
          { id: '1', name: 'Campanha Principal - Apucarana', status: 'active', budget: 5000 },
          { id: '2', name: 'Campanha Sazonal - Apucarana', status: 'active', budget: 3000 },
          { id: '3', name: 'Campanha Promocional - Apucarana', status: 'paused', budget: 2000 }
        ];

        const mockAdGroups = [
          { id: '1', name: 'Grupo Principal - Produtos', status: 'active', campaignId: '1' },
          { id: '2', name: 'Grupo Secundário - Serviços', status: 'active', campaignId: '1' },
          { id: '3', name: 'Grupo Sazonal - Ofertas', status: 'active', campaignId: '2' }
        ];

        const mockAds = [
          { id: '1', name: 'Anúncio Principal - Produto A', status: 'active', adGroupId: '1' },
          { id: '2', name: 'Anúncio Secundário - Produto B', status: 'active', adGroupId: '1' },
          { id: '3', name: 'Anúncio de Serviço - Consulta', status: 'active', adGroupId: '2' }
        ];

        setAccounts(mockAccounts);
        setCampaigns(mockCampaigns);
        setAdGroups(mockAdGroups);
        setAds(mockAds);

        // Selecionar automaticamente a conta da Unidade 1
        if (mockAccounts.length > 0) {
          setSelectedAccount(mockAccounts[0]);
        }

      } catch (error) {
        console.error('Erro ao carregar dados do Google Ads:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoogleAdsData();
  }, []);

  // Handlers para mudanças de seleção
  const handleAccountChange = (account) => {
    setSelectedAccount(account);
    setSelectedCampaign(null);
    setSelectedAdGroup(null);
    setSelectedAd(null);
    setCampaigns([]);
    setAdGroups([]);
    setAds([]);
    
    if (onAccountChange) {
      onAccountChange(account);
    }
  };

  const handleCampaignChange = (campaign) => {
    setSelectedCampaign(campaign);
    setSelectedAdGroup(null);
    setSelectedAd(null);
    setAdGroups([]);
    setAds([]);
    
    if (onCampaignChange) {
      onCampaignChange(campaign);
    }
  };

  const handleAdGroupChange = (adGroup) => {
    setSelectedAdGroup(adGroup);
    setSelectedAd(null);
    setAds([]);
    
    if (onAdGroupChange) {
      onAdGroupChange(adGroup);
    }
  };

  const handleAdChange = (ad) => {
    setSelectedAd(ad);
    
    if (onAdChange) {
      onAdChange(ad);
    }
  };

  // Filtrar dados baseado na seleção
  const filteredCampaigns = campaigns.filter(campaign => 
    !selectedAccount || campaign.accountId === selectedAccount.id
  );

  const filteredAdGroups = adGroups.filter(adGroup => 
    !selectedCampaign || adGroup.campaignId === selectedCampaign.id
  );

  const filteredAds = ads.filter(ad => 
    !selectedAdGroup || ad.adGroupId === selectedAdGroup.id
  );

  if (loading) {
    return (
      <div className="google-ads-metrics-bar">
        <div className="google-ads-metrics-bar-loading">
          <div className="google-ads-metrics-bar-spinner"></div>
          <span>Carregando dados do Google Ads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`google-ads-metrics-bar ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header com Logo */}
      <div className="google-ads-metrics-bar-header">
        <div className="google-ads-metrics-bar-logo">
          <img 
            src={isDarkMode ? GoogleAdsLogoDark : GoogleAdsLogoLight} 
            alt="Google Ads" 
            className="google-ads-metrics-bar-logo-img"
          />
          <span className="google-ads-metrics-bar-title">Google Ads</span>
        </div>
        <div className="google-ads-metrics-bar-status">
          <span className="google-ads-metrics-bar-status-indicator active"></span>
          <span>Conectado</span>
        </div>
      </div>

      {/* Filtros em Cascata */}
      <div className="google-ads-metrics-bar-filters">
        {/* Filtro de Conta */}
        <div className="google-ads-metrics-bar-filter-group">
          <label className="google-ads-metrics-bar-filter-label">Conta</label>
          <select 
            className="google-ads-metrics-bar-filter-select"
            value={selectedAccount?.id || ''}
            onChange={(e) => {
              const account = accounts.find(acc => acc.id === e.target.value);
              handleAccountChange(account);
            }}
          >
            <option value="">Selecione uma conta</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Campanha */}
        <div className="google-ads-metrics-bar-filter-group">
          <label className="google-ads-metrics-bar-filter-label">Campanha</label>
          <select 
            className="google-ads-metrics-bar-filter-select"
            value={selectedCampaign?.id || ''}
            onChange={(e) => {
              const campaign = campaigns.find(camp => camp.id === e.target.value);
              handleCampaignChange(campaign);
            }}
            disabled={!selectedAccount}
          >
            <option value="">Selecione uma campanha</option>
            {filteredCampaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Grupo de Anúncios */}
        <div className="google-ads-metrics-bar-filter-group">
          <label className="google-ads-metrics-bar-filter-label">Grupo de Anúncios</label>
          <select 
            className="google-ads-metrics-bar-filter-select"
            value={selectedAdGroup?.id || ''}
            onChange={(e) => {
              const adGroup = adGroups.find(group => group.id === e.target.value);
              handleAdGroupChange(adGroup);
            }}
            disabled={!selectedCampaign}
          >
            <option value="">Selecione um grupo</option>
            {filteredAdGroups.map(adGroup => (
              <option key={adGroup.id} value={adGroup.id}>
                {adGroup.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Anúncios */}
        <div className="google-ads-metrics-bar-filter-group">
          <label className="google-ads-metrics-bar-filter-label">Anúncios</label>
          <select 
            className="google-ads-metrics-bar-filter-select"
            value={selectedAd?.id || ''}
            onChange={(e) => {
              const ad = ads.find(ad => ad.id === e.target.value);
              handleAdChange(ad);
            }}
            disabled={!selectedAdGroup}
          >
            <option value="">Selecione um anúncio</option>
            {filteredAds.map(ad => (
              <option key={ad.id} value={ad.id}>
                {ad.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumo da Seleção */}
      {selectedAccount && (
        <div className="google-ads-metrics-bar-summary">
          <div className="google-ads-metrics-bar-summary-item">
            <span className="google-ads-metrics-bar-summary-label">Conta:</span>
            <span className="google-ads-metrics-bar-summary-value">{selectedAccount.name}</span>
          </div>
          {selectedCampaign && (
            <div className="google-ads-metrics-bar-summary-item">
              <span className="google-ads-metrics-bar-summary-label">Campanha:</span>
              <span className="google-ads-metrics-bar-summary-value">{selectedCampaign.name}</span>
            </div>
          )}
          {selectedAdGroup && (
            <div className="google-ads-metrics-bar-summary-item">
              <span className="google-ads-metrics-bar-summary-label">Grupo:</span>
              <span className="google-ads-metrics-bar-summary-value">{selectedAdGroup.name}</span>
            </div>
          )}
          {selectedAd && (
            <div className="google-ads-metrics-bar-summary-item">
              <span className="google-ads-metrics-bar-summary-label">Anúncio:</span>
              <span className="google-ads-metrics-bar-summary-value">{selectedAd.name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoogleAdsMetricsBar;
