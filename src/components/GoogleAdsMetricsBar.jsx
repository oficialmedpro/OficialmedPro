import React, { useState, useEffect } from 'react';
import './GoogleAdsMetricsBar.css';
import { googleAdsApiService } from '../service/googleAdsApiService.js';

// Importar logos do Google Ads
import GoogleAdsLogoDark from '../assets/google_ads_dark.png';
import GoogleAdsLogoLight from '../assets/google_ads_light.png';

const GoogleAdsMetricsBar = ({ 
  isDarkMode, 
  onAccountChange, 
  onCampaignChange, 
  onAdGroupChange, 
  onAdChange,
  dateRange 
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

  // Estados de carregamento e conexão
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  const [error, setError] = useState(null);
  const [hasRealCredentials, setHasRealCredentials] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState('active'); // 'active' ou 'all'
  const [accountBalance, setAccountBalance] = useState(0);

  // Carregar dados reais da API do Google Ads
  useEffect(() => {
    loadGoogleAdsData();
  }, [campaignFilter]); // Recarregar quando o filtro mudar

  const loadGoogleAdsData = async () => {
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('Conectando...');

      console.log('🔍 Carregando dados reais do Google Ads...');

      // Testar conexão primeiro
      const connectionTest = await googleAdsApiService.testConnection();
      
      if (!connectionTest.success) {
        throw new Error(connectionTest.error || 'Falha na conexão com Google Ads API');
      }

      // Verificar se tem credenciais reais
      console.log('🔍 DEBUG connectionTest completo:', connectionTest);
      console.log('🔍 DEBUG isRealData:', connectionTest.isRealData, typeof connectionTest.isRealData);
      const hasRealCreds = connectionTest.isRealData;
      
      if (!hasRealCreds) {
        throw new Error('Credenciais do Google Ads não configuradas - apenas dados reais são permitidos');
      }
      
      setHasRealCredentials(hasRealCreds);
      setConnectionStatus('Conectado');

      // Buscar campanhas reais (por padrão apenas ativas)
      const realCampaigns = await googleAdsApiService.getCampaigns(campaignFilter);
      console.log(`✅ Campanhas reais carregadas (${campaignFilter}):`, realCampaigns.length);

      // Se não tem campanhas reais, não criar dados mockados
      if (realCampaigns.length === 0) {
        console.log('⚠️ Nenhuma campanha real encontrada - não exibir dados mockados');
        setAccounts([]);
        setCampaigns([]);
        return;
      }

      // Criar conta baseada na unidade real
      const realAccount = {
        id: '1',
        name: 'Unidade 1 - Apucarana',
        status: 'active',
        currency: 'BRL',
        timezone: 'America/Sao_Paulo'
      };

      // Mapear campanhas reais para o formato esperado
      const mappedCampaigns = realCampaigns.map(campaign => ({
        id: campaign.id.toString(),
        name: campaign.name,
        status: campaign.status ? campaign.status.toLowerCase() : 'unknown',
        accountId: '1',
        channelType: campaign.channelType
      }));

      setAccounts([realAccount]);
      setCampaigns(mappedCampaigns);
      setSelectedAccount(realAccount);

      // Buscar saldo real da conta (orçamento total)
      try {
        const balanceData = await googleAdsApiService.getAccountBalance();
        const realBalance = balanceData.totalBudget || 0;
        setAccountBalance(realBalance);
        console.log('💰 Saldo real da conta carregado:', realBalance);
      } catch (balanceError) {
        console.warn('⚠️ Não foi possível carregar saldo da conta:', balanceError);
        setAccountBalance(0); // Não mostrar valor fictício
      }

      // Notificar o componente pai sobre a seleção automática da conta
      if (onAccountChange) {
        console.log('🔔 GoogleAdsMetricsBar: Notificando seleção automática da conta:', realAccount);
        onAccountChange(realAccount);
      }

      console.log('✅ Dados reais do Google Ads carregados com sucesso');

    } catch (error) {
      console.error('❌ Erro ao carregar dados reais do Google Ads:', error);
      setError(error.message);
      setConnectionStatus('Erro na conexão');
      setHasRealCredentials(false);
      
      // NÃO carregar dados mockados - apenas dados reais
    } finally {
      setLoading(false);
    }
  };



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

  const handleCampaignChange = async (campaign) => {
    setSelectedCampaign(campaign);
    setSelectedAdGroup(null);
    setSelectedAd(null);
    setAdGroups([]);
    setAds([]);
    
    if (onCampaignChange) {
      onCampaignChange(campaign);
    }

    // Carregar grupos de anúncios reais
    if (campaign) {
      try {
        console.log('🔍 Carregando grupos de anúncios para campanha:', campaign.name);
        const realAdGroups = await googleAdsApiService.getAdGroups(campaign.id);
        
        const mappedAdGroups = realAdGroups.map(adGroup => ({
          id: adGroup.id.toString(),
          name: adGroup.name,
          status: adGroup.status ? adGroup.status.toLowerCase() : 'unknown',
          campaignId: campaign.id
        }));

        setAdGroups(mappedAdGroups);
        console.log('✅ Grupos de anúncios carregados:', mappedAdGroups.length);
      } catch (error) {
        console.error('❌ Erro ao carregar grupos de anúncios:', error);
        setAdGroups([]);
      }
    }
  };



  const handleAdGroupChange = async (adGroup) => {
    setSelectedAdGroup(adGroup);
    setSelectedAd(null);
    setAds([]);
    
    if (onAdGroupChange) {
      onAdGroupChange(adGroup);
    }

    // Carregar anúncios reais
    if (adGroup) {
      try {
        console.log('🔍 Carregando anúncios para grupo:', adGroup.name);
        const realAds = await googleAdsApiService.getAds(adGroup.id);
        
        const mappedAds = realAds.map(ad => ({
          id: ad.id.toString(),
          name: ad.name || `Anúncio ${ad.id}`,
          status: ad.status ? ad.status.toLowerCase() : 'unknown',
          adGroupId: adGroup.id
        }));

        setAds(mappedAds);
        console.log('✅ Anúncios carregados:', mappedAds.length);
      } catch (error) {
        console.error('❌ Erro ao carregar anúncios:', error);
        setAds([]);
      }
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

  // Se não tem credenciais reais ou não tem dados, não mostrar nada
  if (!hasRealCredentials || accounts.length === 0) {
    return (
      <div className="google-ads-metrics-bar">
        <div className="google-ads-metrics-bar-error">
          <span>❌ Credenciais do Google Ads não configuradas</span>
          <p>Configure as credenciais na tabela 'unidades' do Supabase para exibir dados reais</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`google-ads-metrics-bar ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header com Logo - Só aparece se tiver credenciais reais */}
      {hasRealCredentials && (
        <div className="google-ads-metrics-bar-header">
          <div className="google-ads-metrics-bar-logo">
            <img 
              src={isDarkMode ? GoogleAdsLogoDark : GoogleAdsLogoLight} 
              alt="Google Ads" 
              className="google-ads-metrics-bar-logo-img"
            />
          </div>
          
          <div className="google-ads-metrics-bar-status">
            <span className={`google-ads-metrics-bar-status-indicator ${
              connectionStatus === 'Conectado' ? 'active' : 
              connectionStatus === 'Modo Demo' ? 'demo' : 'error'
            }`}></span>
            <span>{connectionStatus}</span>
          </div>

          {/* Saldo da Conta */}
          <div className="google-ads-metrics-bar-balance">
            <span className="balance-label">Saldo:</span>
            <span className="balance-value">R$ {accountBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {/* Período dos Dados */}
          <div className="google-ads-metrics-bar-period">
            <span className="period-label">Período:</span>
            <span className="period-value">
              {(() => {
                console.log('📅 GoogleAdsMetricsBar: dateRange recebido:', dateRange);
                
                if (dateRange?.startDate && dateRange?.endDate) {
                  // Garantir que as datas sejam formatadas corretamente sem alterar fuso horário
                  const startFormatted = dateRange.startDate.split('-').reverse().join('/');
                  const endFormatted = dateRange.endDate.split('-').reverse().join('/');
                  const periodText = `${startFormatted} - ${endFormatted}`;
                  console.log('📅 GoogleAdsMetricsBar: Período formatado:', periodText);
                  return periodText;
                } else {
                  return 'Últimos 30 dias';
                }
              })()}
            </span>
          </div>
          
          {/* Filtro de Status das Campanhas */}
          <div className="google-ads-metrics-bar-campaign-filter">
            <label className="campaign-filter-label">Campanhas:</label>
            <select 
              className="campaign-filter-select"
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
            >
              <option value="active">Apenas Ativas</option>
              <option value="all">Todas (Ativas + Pausadas)</option>
            </select>
          </div>
        </div>
      )}

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

    </div>
  );
};

export default GoogleAdsMetricsBar;
