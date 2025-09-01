import React, { useState, useEffect } from 'react';
import './MetaAdsMetricsBar.css';
import { metaAdsService } from '../service/metaAdsService';

// Importar bandeiras e logos
import MetaLogoDark from '../../icones/meta-dark.svg';
import MetaLogoLight from '../../icones/meta-light.svg';

console.log('🖼️ Imagens Meta carregadas:', { MetaLogoDark, MetaLogoLight });

const MetaAdsMetricsBar = ({ 
  isDarkMode = true, 
  formatCurrency, 
  onFilterChange
}) => {
  console.log('🚀 MetaAdsMetricsBar component iniciado');
  // Estados para dados reais do Meta Ads
  const [metaData, setMetaData] = useState({
    balance: 0,
    balanceChange: '+0.0%',
    campaigns: 0,
    activeCampaigns: 0,
    adSets: 0,
    activeAdSets: 0,
    ads: 0,
    activeAds: 0
  });

  // Dados brutos para filtros
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [allAdSets, setAllAdSets] = useState([]);
  const [allAds, setAllAds] = useState([]);

  // Listas filtradas para os selects
  const [campaignsList, setCampaignsList] = useState([]);
  const [adSetsList, setAdSetsList] = useState([]);
  const [adsList, setAdsList] = useState([]);
  
  // Seleções atuais
  const [selectedStatus, setSelectedStatus] = useState('active'); // Por padrão, mostrar apenas ativos
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [selectedAdSet, setSelectedAdSet] = useState('all');
  const [selectedAd, setSelectedAd] = useState('all');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPartialData, setHasPartialData] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  // Função para testar conexão manualmente
  const testConnectionManually = async () => {
    try {
      console.log('🔧 Testando conexão manualmente...');
      setDebugInfo({ status: 'testing', message: 'Testando conexão...' });
      
      const connectionTest = await metaAdsService.testConnection();
      console.log('🔍 Resultado do teste manual:', connectionTest);
      
      setDebugInfo({ 
        status: connectionTest.success ? 'success' : 'error',
        message: connectionTest.success ? 'Conexão OK!' : connectionTest.error,
        data: connectionTest
      });
    } catch (error) {
      console.error('❌ Erro no teste manual:', error);
      setDebugInfo({ 
        status: 'error', 
        message: error.message,
        error: error
      });
    }
  };

  // Função para verificar configuração
  const checkConfiguration = () => {
    const config = {
      appId: import.meta.env.VITE_META_APP_ID,
      businessId: import.meta.env.VITE_META_BUSINESS_ID,
      accessToken: import.meta.env.VITE_META_ACCESS_TOKEN,
      serviceConfigured: metaAdsService.isConfigured()
    };
    
    console.log('🔍 Configuração atual:', config);
    setDebugInfo({ 
      status: 'info', 
      message: 'Configuração verificada',
      config: config
    });
    
    return config;
  };

  // Função para tentar recarregar dados
  const retryLoadData = async () => {
    try {
      console.log('🔄 Tentando recarregar dados...');
      setError(null);
      setHasPartialData(false);
      setIsLoading(true);
      
      // Aguardar um pouco antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Chamar fetchMetaData novamente
      const fetchMetaData = async () => {
        try {
          console.log('🔍 fetchMetaData iniciado');
          setIsLoading(true);
          setError(null);

          console.log('🔍 Iniciando busca de dados do Meta Ads...');

          // Verificar se o serviço está configurado
          if (!metaAdsService.isConfigured()) {
            console.warn('⚠️ Meta Ads Service não está configurado. Usando dados simulados.');
            
            // Usar dados simulados quando não configurado
            setMetaData({
              balance: 42483.35,
              balanceChange: '-15.0%',
              campaigns: 18,
              activeCampaigns: 9,
              adSets: 18,
              activeAdSets: 18,
              ads: 45,
              activeAds: 45
            });
            
            // Definir listas de filtros simuladas
            setCampaignsList([
              { value: 'all', label: 'Todas as Campanhas' },
              { value: 'camp_1', label: 'Campanha Vendas Q4' },
              { value: 'camp_2', label: 'Campanha Black Friday' },
              { value: 'camp_3', label: 'Campanha Natal' }
            ]);
            
            setAdSetsList([
              { value: 'all', label: 'Todos os Grupos de Anúncios' },
              { value: 'adset_1', label: 'Grupo Interesse Compra' },
              { value: 'adset_2', label: 'Grupo Lookalike' },
              { value: 'adset_3', label: 'Grupo Retargeting' }
            ]);
            
            setAdsList([
              { value: 'all', label: 'Todos os Anúncios' },
              { value: 'ad_1', label: 'Anúncio Vídeo Principal' },
              { value: 'ad_2', label: 'Anúncio Carrossel' },
              { value: 'ad_3', label: 'Anúncio Imagem' }
            ]);
            
            setError(null); // Não é um erro, apenas não configurado
            setHasPartialData(true);
            return;
          }

          // Testar conexão
          const connectionTest = await metaAdsService.testConnection();
          if (!connectionTest.success) {
            throw new Error(`Falha na conexão: ${connectionTest.error}`);
          }

          console.log('✅ Conexão com Meta Ads estabelecida');

          // Buscar campanhas
          const campaigns = await metaAdsService.getCampaigns();
          console.log('📊 Campanhas encontradas:', campaigns.length);

          // Armazenar dados brutos
          setAllCampaigns(campaigns);

          // Filtrar campanhas por status
          const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
          const pausedCampaigns = campaigns.filter(c => c.status === 'PAUSED');
          const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED');

          // Buscar insights para calcular gastos
          const today = new Date();
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

          const dateRange = {
            since: firstDay.toISOString().split('T')[0],
            until: lastDay.toISOString().split('T')[0]
          };

          // Buscar stats para calcular gastos e leads
          const stats = await metaAdsService.getMetaStats(dateRange);
          console.log('💰 Stats calculados:', stats);

          // Calcular saldo (simulado - você pode ajustar conforme sua lógica de negócio)
          const estimatedBalance = Math.max(0, 50000 - stats.gastoTotal);
          const balanceChange = stats.gastoTotal > 0 ? `-${((stats.gastoTotal / 50000) * 100).toFixed(1)}%` : '+0.0%';

          // Buscar grupos de anúncios e anúncios reais
          console.log('🔍 Buscando grupos de anúncios e anúncios reais...');
          
          try {
            // Buscar todos os grupos de anúncios
            console.log('🔍 Buscando grupos de anúncios...');
            const allAdSets = await metaAdsService.getAllAdSets();
            setAllAdSets(allAdSets);
            console.log('✅ Grupos de anúncios carregados:', allAdSets.length);
            
            // Buscar todos os anúncios
            console.log('🔍 Buscando anúncios...');
            const allAds = await metaAdsService.getAllAds();
            setAllAds(allAds);
            console.log('✅ Anúncios carregados:', allAds.length);
            
            console.log('✅ Dados reais carregados com sucesso:', {
              adSets: allAdSets.length,
              ads: allAds.length
            });
            
            // Atualizar estado com dados reais
            setMetaData({
              balance: estimatedBalance,
              balanceChange,
              campaigns: campaigns.length,
              activeCampaigns: activeCampaigns.length,
              adSets: allAdSets.length,
              activeAdSets: allAdSets.filter(adSet => adSet.status === 'ACTIVE').length,
              ads: allAds.length,
              activeAds: allAds.filter(ad => ad.status === 'ACTIVE').length
            });
          } catch (error) {
            console.error('❌ Erro ao buscar dados reais:', error.message);
            
            // Verificar se é limite de requisições
            if (error.message.includes('User request limit reached')) {
              console.log('⚠️ Limite de requisições atingido - usando dados parciais');
              
              setAllAdSets([]);
              setAllAds([]);
              
              // Atualizar estado com contadores zerados para grupos/anúncios
              setMetaData({
                balance: estimatedBalance,
                balanceChange,
                campaigns: campaigns.length,
                activeCampaigns: activeCampaigns.length,
                adSets: 0,
                activeAdSets: 0,
                ads: 0,
                activeAds: 0
              });
              
              // Definir listas de filtros simuladas para grupos/anúncios
              setAdSetsList([
                { value: 'all', label: 'Todos os Grupos de Anúncios' },
                { value: 'adset_1', label: 'Grupo Interesse Compra' },
                { value: 'adset_2', label: 'Grupo Lookalike' },
                { value: 'adset_3', label: 'Grupo Retargeting' }
              ]);
              
              setAdsList([
                { value: 'all', label: 'Todos os Anúncios' },
                { value: 'ad_1', label: 'Anúncio Vídeo Principal' },
                { value: 'ad_2', label: 'Anúncio Carrossel' },
                { value: 'ad_3', label: 'Anúncio Imagem' }
              ]);
              
              // Não re-lançar o erro - continuar com dados parciais
              console.log('✅ Continuando com dados parciais (apenas campanhas)');
              setHasPartialData(true);
              setError('Limite de requisições atingido - usando dados parciais');
              return;
            }
            
            // Se conseguimos carregar campanhas mas falhou nos grupos/anúncios, 
            // não é um erro fatal - apenas mostrar contadores zerados
            if (campaigns.length > 0) {
              console.log('⚠️ Carregamento parcial: campanhas OK, grupos/anúncios falharam');
              
              setAllAdSets([]);
              setAllAds([]);
              
              // Atualizar estado com contadores zerados para grupos/anúncios
              setMetaData({
                balance: estimatedBalance,
                balanceChange,
                campaigns: campaigns.length,
                activeCampaigns: activeCampaigns.length,
                adSets: 0,
                activeAdSets: 0,
                ads: 0,
                activeAds: 0
              });
              
              // Não re-lançar o erro - continuar com dados parciais
              console.log('✅ Continuando com dados parciais (apenas campanhas)');
              setHasPartialData(true);
              return;
            } else {
              // Se nem campanhas carregaram, aí sim é um erro fatal
              throw error;
            }
          }

          // Inicializar com status ativo (padrão)
          updateFilterLists('active', activeCampaigns, pausedCampaigns, completedCampaigns, campaigns);

          console.log('✅ Dados do Meta Ads carregados com sucesso');

        } catch (error) {
          console.error('❌ Erro ao buscar dados do Meta Ads:', error);
          
          // Determinar mensagem de erro específica
          let errorMessage = 'Não foi possível carregar os dados do Meta Ads';
          
          if (error.message.includes('User request limit reached')) {
            errorMessage = 'Limite de requisições atingido. Tente novamente em alguns minutos.';
          } else if (error.message.includes('Token inválido')) {
            errorMessage = 'Token de acesso inválido. Verifique as credenciais.';
          } else if (error.message.includes('sem permissões')) {
            errorMessage = 'Sem permissões para acessar os dados. Verifique as permissões do token.';
          } else if (error.message.includes('400')) {
            errorMessage = 'Erro de permissão na API. Algumas campanhas podem não ter grupos de anúncios.';
          } else if (error.message.includes('does not exist')) {
            errorMessage = 'Algumas campanhas não foram encontradas ou não têm permissão de acesso.';
          }
          
          setError(errorMessage);
          
          // Não usar dados simulados - deixar tudo zerado
          setMetaData({
            balance: 0,
            balanceChange: '0.0%',
            campaigns: 0,
            activeCampaigns: 0,
            adSets: 0,
            activeAdSets: 0,
            ads: 0,
            activeAds: 0
          });
          
          // Limpar dados dos filtros
          setAllCampaigns([]);
          setAllAdSets([]);
          setAllAds([]);
          setCampaignsList([]);
          setAdSetsList([]);
          setAdsList([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchMetaData();
    } catch (error) {
      console.error('❌ Erro ao tentar recarregar:', error);
      setError('Erro ao tentar recarregar dados');
    }
  };

  // Buscar dados reais do Meta Ads
  useEffect(() => {
    console.log('🔄 useEffect do MetaAdsMetricsBar iniciado');
    
    const fetchMetaData = async () => {
      try {
        console.log('🔍 fetchMetaData iniciado');
        setIsLoading(true);
        setError(null);

        console.log('🔍 Iniciando busca de dados do Meta Ads...');

        // Verificar se o serviço está configurado
        if (!metaAdsService.isConfigured()) {
          console.warn('⚠️ Meta Ads Service não está configurado. Usando dados simulados.');
          
          // Usar dados simulados quando não configurado
          setMetaData({
            balance: 42483.35,
            balanceChange: '-15.0%',
            campaigns: 18,
            activeCampaigns: 9,
            adSets: 18,
            activeAdSets: 18,
            ads: 45,
            activeAds: 45
          });
          
          // Definir listas de filtros simuladas
          setCampaignsList([
            { value: 'all', label: 'Todas as Campanhas' },
            { value: 'camp_1', label: 'Campanha Vendas Q4' },
            { value: 'camp_2', label: 'Campanha Black Friday' },
            { value: 'camp_3', label: 'Campanha Natal' }
          ]);
          
          setAdSetsList([
            { value: 'all', label: 'Todos os Grupos de Anúncios' },
            { value: 'adset_1', label: 'Grupo Interesse Compra' },
            { value: 'adset_2', label: 'Grupo Lookalike' },
            { value: 'adset_3', label: 'Grupo Retargeting' }
          ]);
          
          setAdsList([
            { value: 'all', label: 'Todos os Anúncios' },
            { value: 'ad_1', label: 'Anúncio Vídeo Principal' },
            { value: 'ad_2', label: 'Anúncio Carrossel' },
            { value: 'ad_3', label: 'Anúncio Imagem' }
          ]);
          
          setError(null); // Não é um erro, apenas não configurado
          setHasPartialData(true);
          return;
        }

        // Testar conexão
        const connectionTest = await metaAdsService.testConnection();
        if (!connectionTest.success) {
          throw new Error(`Falha na conexão: ${connectionTest.error}`);
        }

        console.log('✅ Conexão com Meta Ads estabelecida');

        // Buscar campanhas
        const campaigns = await metaAdsService.getCampaigns();
        console.log('📊 Campanhas encontradas:', campaigns.length);

        // Armazenar dados brutos
        setAllCampaigns(campaigns);

        // Filtrar campanhas por status
        const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
        const pausedCampaigns = campaigns.filter(c => c.status === 'PAUSED');
        const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED');

        // Buscar insights para calcular gastos
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const dateRange = {
          since: firstDay.toISOString().split('T')[0],
          until: lastDay.toISOString().split('T')[0]
        };

        // Buscar stats para calcular gastos e leads
        const stats = await metaAdsService.getMetaStats(dateRange);
        console.log('💰 Stats calculados:', stats);

        // Calcular saldo (simulado - você pode ajustar conforme sua lógica de negócio)
        const estimatedBalance = Math.max(0, 50000 - stats.gastoTotal);
        const balanceChange = stats.gastoTotal > 0 ? `-${((stats.gastoTotal / 50000) * 100).toFixed(1)}%` : '+0.0%';

        // Buscar grupos de anúncios e anúncios reais
        console.log('🔍 Buscando grupos de anúncios e anúncios reais...');
        
        try {
          // Buscar todos os grupos de anúncios
          console.log('🔍 Buscando grupos de anúncios...');
          const allAdSets = await metaAdsService.getAllAdSets();
          setAllAdSets(allAdSets);
          console.log('✅ Grupos de anúncios carregados:', allAdSets.length);
          
          // Buscar todos os anúncios
          console.log('🔍 Buscando anúncios...');
          const allAds = await metaAdsService.getAllAds();
          setAllAds(allAds);
          console.log('✅ Anúncios carregados:', allAds.length);
          
          console.log('✅ Dados reais carregados com sucesso:', {
            adSets: allAdSets.length,
            ads: allAds.length
          });
          
          // Atualizar estado com dados reais
          setMetaData({
            balance: estimatedBalance,
            balanceChange,
            campaigns: campaigns.length,
            activeCampaigns: activeCampaigns.length,
            adSets: allAdSets.length,
            activeAdSets: allAdSets.filter(adSet => adSet.status === 'ACTIVE').length,
            ads: allAds.length,
            activeAds: allAds.filter(ad => ad.status === 'ACTIVE').length
          });
        } catch (error) {
          console.error('❌ Erro ao buscar dados reais:', error.message);
          
          // Verificar se é limite de requisições
          if (error.message.includes('User request limit reached')) {
            console.log('⚠️ Limite de requisições atingido - usando dados parciais');
            
            setAllAdSets([]);
            setAllAds([]);
            
            // Atualizar estado com contadores zerados para grupos/anúncios
            setMetaData({
              balance: estimatedBalance,
              balanceChange,
              campaigns: campaigns.length,
              activeCampaigns: activeCampaigns.length,
              adSets: 0,
              activeAdSets: 0,
              ads: 0,
              activeAds: 0
            });
            
            // Definir listas de filtros simuladas para grupos/anúncios
            setAdSetsList([
              { value: 'all', label: 'Todos os Grupos de Anúncios' },
              { value: 'adset_1', label: 'Grupo Interesse Compra' },
              { value: 'adset_2', label: 'Grupo Lookalike' },
              { value: 'adset_3', label: 'Grupo Retargeting' }
            ]);
            
            setAdsList([
              { value: 'all', label: 'Todos os Anúncios' },
              { value: 'ad_1', label: 'Anúncio Vídeo Principal' },
              { value: 'ad_2', label: 'Anúncio Carrossel' },
              { value: 'ad_3', label: 'Anúncio Imagem' }
            ]);
            
            // Não re-lançar o erro - continuar com dados parciais
            console.log('✅ Continuando com dados parciais (apenas campanhas)');
            setHasPartialData(true);
            setError('Limite de requisições atingido - usando dados parciais');
            return;
          }
          
          // Se conseguimos carregar campanhas mas falhou nos grupos/anúncios, 
          // não é um erro fatal - apenas mostrar contadores zerados
          if (campaigns.length > 0) {
            console.log('⚠️ Carregamento parcial: campanhas OK, grupos/anúncios falharam');
            
            setAllAdSets([]);
            setAllAds([]);
            
            // Atualizar estado com contadores zerados para grupos/anúncios
            setMetaData({
              balance: estimatedBalance,
              balanceChange,
              campaigns: campaigns.length,
              activeCampaigns: activeCampaigns.length,
              adSets: 0,
              activeAdSets: 0,
              ads: 0,
              activeAds: 0
            });
            
            // Não re-lançar o erro - continuar com dados parciais
            console.log('✅ Continuando com dados parciais (apenas campanhas)');
            setHasPartialData(true);
            return;
          } else {
            // Se nem campanhas carregaram, aí sim é um erro fatal
            throw error;
          }
        }

        // Inicializar com status ativo (padrão)
        updateFilterLists('active', activeCampaigns, pausedCampaigns, completedCampaigns, campaigns);

        console.log('✅ Dados do Meta Ads carregados com sucesso');

      } catch (error) {
        console.error('❌ Erro ao buscar dados do Meta Ads:', error);
        
        // Determinar mensagem de erro específica
        let errorMessage = 'Não foi possível carregar os dados do Meta Ads';
        
        if (error.message.includes('User request limit reached')) {
          errorMessage = 'Limite de requisições atingido. Tente novamente em alguns minutos.';
        } else if (error.message.includes('Token inválido')) {
          errorMessage = 'Token de acesso inválido. Verifique as credenciais.';
        } else if (error.message.includes('sem permissões')) {
          errorMessage = 'Sem permissões para acessar os dados. Verifique as permissões do token.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Erro de permissão na API. Algumas campanhas podem não ter grupos de anúncios.';
        } else if (error.message.includes('does not exist')) {
          errorMessage = 'Algumas campanhas não foram encontradas ou não têm permissão de acesso.';
        }
        
        setError(errorMessage);
        
        // Não usar dados simulados - deixar tudo zerado
        setMetaData({
          balance: 0,
          balanceChange: '0.0%',
          campaigns: 0,
          activeCampaigns: 0,
          adSets: 0,
          activeAdSets: 0,
          ads: 0,
          activeAds: 0
        });
        
        // Limpar dados dos filtros
        setAllCampaigns([]);
        setAllAdSets([]);
        setAllAds([]);
        setCampaignsList([]);
        setAdSetsList([]);
        setAdsList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetaData();
  }, []);

  // Função para atualizar listas de filtros
  const updateFilterLists = (status, activeCampaigns, pausedCampaigns, completedCampaigns, allCampaigns) => {
    let filteredCampaigns, filteredAdSets, filteredAds;
    
    switch(status) {
      case 'active':
        filteredCampaigns = activeCampaigns;
        // Filtrar grupos de anúncios reais por campanha ativa
        filteredAdSets = allAdSets.filter(adSet => {
          return activeCampaigns.some(c => c.id === adSet.campaign_id);
        });
        // Filtrar anúncios reais por campanha ativa
        filteredAds = allAds.filter(ad => {
          return activeCampaigns.some(c => c.id === ad.campaign_id);
        });
        break;
      case 'paused':
        filteredCampaigns = pausedCampaigns;
        // Filtrar grupos de anúncios reais por campanha pausada
        filteredAdSets = allAdSets.filter(adSet => {
          return pausedCampaigns.some(c => c.id === adSet.campaign_id);
        });
        // Filtrar anúncios reais por campanha pausada
        filteredAds = allAds.filter(ad => {
          return pausedCampaigns.some(c => c.id === ad.campaign_id);
        });
        break;
      case 'completed':
        filteredCampaigns = completedCampaigns;
        // Filtrar grupos de anúncios reais por campanha concluída
        filteredAdSets = allAdSets.filter(adSet => {
          return completedCampaigns.some(c => c.id === adSet.campaign_id);
        });
        // Filtrar anúncios reais por campanha concluída
        filteredAds = allAds.filter(ad => {
          return completedCampaigns.some(c => c.id === ad.campaign_id);
        });
        break;
      default:
        filteredCampaigns = allCampaigns;
        // Para "Todos", mostrar todos os grupos e anúncios
        filteredAdSets = allAdSets;
        filteredAds = allAds;
    }

    // Não sobrescrever os dados brutos aqui - apenas usar para filtrar
    // setAllAdSets(filteredAdSets);
    // setAllAds(filteredAds);

    // Atualizar listas dos filtros com os nomes reais
    setCampaignsList([
      { value: 'all', label: 'Todas as Campanhas' },
      ...filteredCampaigns.map(campaign => ({
        value: campaign.id,
        label: campaign.name
      }))
    ]);

    setAdSetsList([
      { value: 'all', label: 'Todos os Grupos de Anúncios' },
      ...filteredAdSets.map(adSet => ({
        value: adSet.id,
        label: adSet.name,
        campaignId: adSet.campaign_id // Campo real da API
      }))
    ]);

    setAdsList([
      { value: 'all', label: 'Todos os Anúncios' },
      ...filteredAds.map(ad => ({
        value: ad.id,
        label: ad.name,
        campaignId: ad.campaign_id, // Campo real da API
        adSetId: ad.adset_id // Campo real da API
      }))
    ]);
  };

  // Função para lidar com mudanças nos filtros
  const handleFilterChange = (filterType, value) => {
    console.log(`🎯 Filtro ${filterType} alterado para:`, value);
    
    if (onFilterChange) {
      onFilterChange(filterType, value);
    }
  };

  // Função para lidar com mudanças na campanha
  const handleCampaignChange = (campaignId) => {
    setSelectedCampaign(campaignId);
    setSelectedAdSet('all'); // Resetar seleção de grupo
    setSelectedAd('all'); // Resetar seleção de anúncio
    console.log(`🎯 Campanha alterada para:`, campaignId);
    
    // Filtrar grupos de anúncios baseado na campanha selecionada
    if (campaignId !== 'all') {
      const campaignAdSets = allAdSets.filter(adSet => adSet.campaign_id === campaignId);
      setAdSetsList([
        { value: 'all', label: 'Todos os Grupos de Anúncios' },
        ...campaignAdSets.map(adSet => ({
          value: adSet.id,
          label: adSet.name,
          campaignId: adSet.campaign_id
        }))
      ]);
      
      // Filtrar anúncios baseado na campanha selecionada
      const campaignAds = allAds.filter(ad => ad.campaign_id === campaignId);
      setAdsList([
        { value: 'all', label: 'Todos os Anúncios' },
        ...campaignAds.map(ad => ({
          value: ad.id,
          label: ad.name,
          campaignId: ad.campaign_id,
          adSetId: ad.adset_id
        }))
      ]);
    } else {
      // Se "Todas as Campanhas" for selecionado, re-aplicar o filtro de status atual
      updateFilterLists(selectedStatus, 
        allCampaigns.filter(c => c.status === 'ACTIVE'),
        allCampaigns.filter(c => c.status === 'PAUSED'),
        allCampaigns.filter(c => c.status === 'COMPLETED'),
        allCampaigns
      );
    }
    
    if (onFilterChange) {
      onFilterChange('campaigns', campaignId);
    }
  };

  // Função para lidar com mudanças no grupo de anúncios
  const handleAdSetChange = (adSetId) => {
    setSelectedAdSet(adSetId);
    setSelectedAd('all'); // Resetar seleção de anúncio
    console.log(`🎯 Grupo de Anúncios alterado para:`, adSetId);
    
    // Filtrar anúncios baseado no grupo selecionado
    if (adSetId !== 'all') {
      const adSetAds = allAds.filter(ad => ad.adset_id === adSetId);
      setAdsList([
        { value: 'all', label: 'Todos os Anúncios' },
        ...adSetAds.map(ad => ({
          value: ad.id,
          label: ad.name,
          campaignId: ad.campaign_id,
          adSetId: ad.adset_id
        }))
      ]);
    } else {
      // Se "Todos os Grupos" for selecionado, mostrar anúncios da campanha
      if (selectedCampaign !== 'all') {
        const campaignAds = allAds.filter(ad => ad.campaign_id === selectedCampaign);
        setAdsList([
          { value: 'all', label: 'Todos os Anúncios' },
          ...campaignAds.map(ad => ({
            value: ad.id,
            label: ad.name,
            campaignId: ad.campaign_id,
            adSetId: ad.adset_id
          }))
        ]);
      } else {
        // Se nenhuma campanha estiver selecionada, re-aplicar o filtro de status
        updateFilterLists(selectedStatus, 
          allCampaigns.filter(c => c.status === 'ACTIVE'),
          allCampaigns.filter(c => c.status === 'PAUSED'),
          allCampaigns.filter(c => c.status === 'COMPLETED'),
          allCampaigns
        );
      }
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
    setSelectedCampaign('all'); // Resetar seleção de campanha
    setSelectedAdSet('all'); // Resetar seleção de grupo
    setSelectedAd('all'); // Resetar seleção de anúncio
    console.log(`🔄 Status alterado para:`, status);
    
    // Atualizar as listas dos filtros baseado no novo status
    if (allCampaigns.length > 0) {
      const activeCampaigns = allCampaigns.filter(c => c.status === 'ACTIVE');
      const pausedCampaigns = allCampaigns.filter(c => c.status === 'PAUSED');
      const completedCampaigns = allCampaigns.filter(c => c.status === 'COMPLETED');
      
      updateFilterLists(status, activeCampaigns, pausedCampaigns, completedCampaigns, allCampaigns);
    }
  };

  if (isLoading) {
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
            <span>Carregando dados do Meta Ads...</span>
          </div>
        </div>

        {/* Seção de Debug */}
        <div className="meta-ads-debug-section">
          <h4>🔧 Debug - Meta Ads</h4>
          <div className="debug-buttons">
            <button onClick={checkConfiguration} className="debug-btn">
              Verificar Configuração
            </button>
            <button onClick={testConnectionManually} className="debug-btn">
              Testar Conexão
            </button>
          </div>
          
          {debugInfo.status && (
            <div className={`debug-info ${debugInfo.status}`}>
              <strong>{debugInfo.message}</strong>
              {debugInfo.config && (
                <pre className="debug-config">
                  {JSON.stringify(debugInfo.config, null, 2)}
                </pre>
              )}
              {debugInfo.data && (
                <pre className="debug-data">
                  {JSON.stringify(debugInfo.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
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
            <span>⚠️ Erro ao carregar dados: {error}</span>
          </div>
        </div>

        {/* Seção de Debug */}
        <div className="meta-ads-debug-section">
          <h4>🔧 Debug - Meta Ads</h4>
          <div className="debug-buttons">
            <button onClick={checkConfiguration} className="debug-btn">
              Verificar Configuração
            </button>
            <button onClick={testConnectionManually} className="debug-btn">
              Testar Conexão
            </button>
          </div>
          
          {debugInfo.status && (
            <div className={`debug-info ${debugInfo.status}`}>
              <strong>{debugInfo.message}</strong>
              {debugInfo.config && (
                <pre className="debug-config">
                  {JSON.stringify(debugInfo.config, null, 2)}
                </pre>
              )}
              {debugInfo.data && (
                <pre className="debug-data">
                  {JSON.stringify(debugInfo.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="meta-ads-metrics-bar">
      {/* Aviso de dados parciais ou não configurados */}
      {hasPartialData && !error && (
        <div className="meta-ads-partial-warning">
          <span>⚠️ Meta Ads não configurado - usando dados simulados para demonstração</span>
        </div>
      )}
      
      {hasPartialData && error && error.includes('Limite de requisições') && (
        <div className="meta-ads-partial-warning">
          <span>⚠️ Limite de requisições da API atingido - usando dados parciais</span>
          <div className="retry-info">
            <small>⏰ Aguarde alguns minutos e tente novamente, ou use os botões de debug para testar</small>
            <button onClick={retryLoadData} className="retry-btn">
              🔄 Tentar Novamente
            </button>
          </div>
        </div>
      )}
      
      {hasPartialData && error && !error.includes('Limite de requisições') && (
        <div className="meta-ads-partial-warning">
          <span>⚠️ Dados parciais: Campanhas carregadas, grupos e anúncios não disponíveis</span>
        </div>
      )}
      
      {/* Logo + Filtros */}
      <div className="meta-ads-top-row">
        <div className="meta-ads-logo">
          <img 
            src={isDarkMode ? MetaLogoDark : MetaLogoLight} 
            alt="Meta Ads" 
            className="meta-logo-img"
          />
        </div>
        
        <div className="meta-ads-filters">
          {/* Filtro de Status - Primeiro */}
          <div className="meta-filter-item">
            <select 
              className="meta-filter-select meta-filter-status"
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="active">🟢 Ativos</option>
              <option value="paused">🟡 Pausados</option>
              <option value="completed">🔴 Concluídos</option>
              <option value="all">🌐 Todos</option>
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
    </div>
  );
};

export default MetaAdsMetricsBar;
