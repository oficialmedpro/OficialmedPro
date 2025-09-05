import React, { useState, useEffect } from 'react';
import './GoogleAdsMetricsBar.css';
import GoogleAdsLogoLight from '../assets/google_ads_light.png';
import GoogleAdsLogoDark from '../assets/google_ads_dark.png';

const SimpleGoogleAdsMetricsBar = ({ 
  isDarkMode = false, 
  dateRange = null,
  onAccountChange = null,
  onCampaignChange = null,
  onAdGroupChange = null,
  onAdChange = null
}) => {
  // Estados
  const [loading, setLoading] = useState(true);
  const [hasRealCredentials, setHasRealCredentials] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  const [accountBalance, setAccountBalance] = useState(0);
  
  // Dados
  const [customerInfo, setCustomerInfo] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  
  // Configurações
  const [campaignFilter, setCampaignFilter] = useState('active');

  // URLs da Edge Function
  const API_BASE_URL = 'https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api';

  /**
   * Faz requisição para a Edge Function
   */
  const fetchFromEdgeFunction = async (endpoint) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`🔍 Fazendo requisição: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const data = await response.json();
      console.log(`✅ Resposta recebida:`, data);
      return data;

    } catch (error) {
      console.error(`❌ Erro na requisição ${endpoint}:`, error);
      throw error;
    }
  };

  /**
   * Carrega os dados iniciais
   */
  const loadGoogleAdsData = async () => {
    try {
      setLoading(true);
      console.log('🔍 SimpleGoogleAdsMetricsBar: Carregando dados do Google Ads...');

      // 1. Testar conexão
      console.log('🧪 Testando conexão...');
      const connectionTest = await fetchFromEdgeFunction('/test-connection');
      
      if (!connectionTest.success) {
        throw new Error(connectionTest.error || 'Falha na conexão');
      }

      console.log('✅ Conexão estabelecida:', connectionTest);
      
      // 2. Configurar estados
      setHasRealCredentials(true);
      setConnectionStatus('Conectado');
      setCustomerInfo(connectionTest.customerInfo);

      // 3. Carregar campanhas
      console.log('🔍 Buscando campanhas...');
      const campaignsResponse = await fetchFromEdgeFunction(`/campaigns?status=${campaignFilter}`);
      
      if (campaignsResponse.success) {
        setCampaigns(campaignsResponse.data);
        console.log(`✅ ${campaignsResponse.count} campanhas carregadas`);
      }

      // 4. Carregar saldo da conta
      try {
        console.log('💰 Buscando saldo da conta...');
        const balanceResponse = await fetchFromEdgeFunction('/account-balance');
        
        if (balanceResponse.success) {
          setAccountBalance(balanceResponse.data.totalBudget || 0);
          console.log('✅ Saldo carregado:', balanceResponse.data.totalBudget);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao carregar saldo (não crítico):', error);
        setAccountBalance(0);
      }

      setLoading(false);
      console.log('✅ SimpleGoogleAdsMetricsBar: Dados carregados com sucesso!');

    } catch (error) {
      console.error('❌ SimpleGoogleAdsMetricsBar: Erro ao carregar dados:', error);
      setHasRealCredentials(false);
      setConnectionStatus('Erro na conexão');
      setLoading(false);
    }
  };

  /**
   * Carrega dados quando o componente monta ou filtro muda
   */
  useEffect(() => {
    loadGoogleAdsData();
  }, [campaignFilter]);

  /**
   * Handler para mudança de campanha
   */
  const handleCampaignChange = (campaign) => {
    setSelectedCampaign(campaign);
    
    if (onCampaignChange) {
      onCampaignChange(campaign);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="google-ads-metrics-bar">
        <div className="google-ads-metrics-bar-loading">
          <div className="google-ads-metrics-bar-spinner"></div>
          <span>Carregando dados reais do Google Ads...</span>
        </div>
      </div>
    );
  }

  // Erro ou sem credenciais
  if (!hasRealCredentials) {
    return (
      <div className="google-ads-metrics-bar">
        <div className="google-ads-metrics-bar-error">
          <span>❌ Erro ao conectar com Google Ads</span>
          <p>Verifique as credenciais na tabela 'unidades' do Supabase</p>
        </div>
      </div>
    );
  }

  // Sucesso - Exibir dados
  return (
    <div className={`google-ads-metrics-bar ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header com Logo e Status */}
      <div className="google-ads-metrics-bar-header">
        <div className="google-ads-metrics-bar-logo">
          <img 
            src={isDarkMode ? GoogleAdsLogoDark : GoogleAdsLogoLight} 
            alt="Google Ads" 
            className="google-ads-metrics-bar-logo-img"
          />
        </div>
        
        <div className="google-ads-metrics-bar-status">
          <span className="google-ads-metrics-bar-status-indicator active"></span>
          <span>{connectionStatus}</span>
          {customerInfo && (
            <span className="customer-info"> - {customerInfo.customerName}</span>
          )}
        </div>

        {/* Saldo da Conta */}
        <div className="google-ads-metrics-bar-balance">
          <span className="balance-label">Orçamento Total:</span>
          <span className="balance-value">
            R$ {accountBalance.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </span>
        </div>

        {/* Período dos Dados */}
        <div className="google-ads-metrics-bar-period">
          <span className="period-label">Período:</span>
          <span className="period-value">
            {dateRange?.startDate && dateRange?.endDate ? 
              `${dateRange.startDate.split('-').reverse().join('/')} - ${dateRange.endDate.split('-').reverse().join('/')}` :
              'Hoje'
            }
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

      {/* Lista de Campanhas */}
      <div className="google-ads-metrics-bar-filters">
        <div className="google-ads-metrics-bar-filter-group">
          <label className="google-ads-metrics-bar-filter-label">
            Campanha ({campaigns.length} encontradas)
          </label>
          <select 
            className="google-ads-metrics-bar-filter-select"
            value={selectedCampaign?.id || ''}
            onChange={(e) => {
              const campaign = campaigns.find(c => c.id === e.target.value);
              handleCampaignChange(campaign);
            }}
          >
            <option value="">Selecione uma campanha</option>
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} ({campaign.status})
              </option>
            ))}
          </select>
        </div>

        {selectedCampaign && (
          <div className="google-ads-metrics-bar-campaign-info">
            <span>✅ Campanha selecionada: <strong>{selectedCampaign.name}</strong></span>
            <span>Status: {selectedCampaign.status}</span>
            <span>Tipo: {selectedCampaign.channelType}</span>
          </div>
        )}
      </div>

      {/* Estatísticas Resumidas */}
      <div className="google-ads-metrics-bar-stats">
        <div className="stat-item">
          <span className="stat-label">Campanhas Ativas:</span>
          <span className="stat-value">{campaigns.filter(c => c.status === 'ENABLED').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total de Campanhas:</span>
          <span className="stat-value">{campaigns.length}</span>
        </div>
        {customerInfo && (
          <div className="stat-item">
            <span className="stat-label">Customer ID:</span>
            <span className="stat-value">{customerInfo.customerId}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleGoogleAdsMetricsBar;