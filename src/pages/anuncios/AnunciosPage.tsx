import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, TrendingUp, DollarSign, Eye, MousePointer, Users, ChevronLeft, ChevronRight, UserCheck, TestTube } from 'lucide-react';
import { useMetaAds } from '../../hooks/useMetaAds';
import { useGoogleAds } from '../../hooks/useGoogleAds';
import CampaignCard from '../../components/anuncios/CampaignCard';
import GoogleAdsCampaignMetrics from '../../components/anuncios/GoogleAdsCampaignMetrics';
import CampaignFilters from '../../components/anuncios/CampaignFilters';
import { useAuth } from '../../hooks/useAuth';
import { getLojasPermitidas } from '../../services/rankingService';
import { supabase } from '../../services/supabase';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Sidebar from '../../components/dashboard/Sidebar';
import AppFooter from '../../components/ui/AppFooter';
import MetaAdsDashboard from './MetaAdsDashboard';
import GoogleAdsDashboard from '../../components/anuncios/GoogleAdsDashboard';
/* AccountInfoCard removido */
import './AnunciosPage.css';

const AnunciosPage: React.FC = () => {
  const location = useLocation();
  const { userWithLevel, userLevel } = useAuth();
  
  // Meta Ads Hook
  const { 
    campaigns: metaCampaigns, 
    loading: metaLoading, 
    error: metaError, 
    accountInfo: metaAccountInfo, 
    metaStats,
    refreshCampaigns: refreshMetaCampaigns, 
    refreshCampaignsWithInsights: refreshMetaCampaignsWithInsights,
    getMetaStats,
    getAllCampaigns: getAllMetaCampaigns,
    getAllCampaignsWithInsights: getAllMetaCampaignsWithInsights,
    isConfigured: metaIsConfigured,
    configuredAccounts: metaConfiguredAccounts
  } = useMetaAds();

  // Google Ads Hook
  const {
    campaigns: googleCampaigns,
    loading: googleLoading,
    error: googleError,
    accountInfo: googleAccountInfo,
    googleAdsStats,
    refreshCampaigns: refreshGoogleCampaigns,
    refreshCampaignsWithMetrics: refreshGoogleCampaignsWithMetrics,
    getGoogleAdsStats,
    getAllCampaigns: getAllGoogleCampaigns,
    getAllCampaignsWithMetrics: getAllGoogleCampaignsWithMetrics,
    isConfigured: googleIsConfigured,
    configuredAccounts: googleConfiguredAccounts,
    validateConnection: validateGoogleConnection
  } = useGoogleAds();

  // Estados compartilhados
  type TabType = 'meta' | 'google';
  const [activeTab, setActiveTab] = useState<TabType>('meta'); // Aba ativa
  const [filteredCampaigns, setFilteredCampaigns] = useState<any[]>([]);
  const [showInsights, setShowInsights] = useState(true); // Sempre ativo por padrão
  const [currentPage, setCurrentPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true); // Loading inicial
  const [selectedAccount, setSelectedAccount] = useState<'ACCOUNT_1' | 'ACCOUNT_2' | 'ALL'>('ACCOUNT_1'); // Conta selecionada
  const [dateRange, setDateRange] = useState({
    since: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split('T')[0], // 3 meses atrás
    until: new Date().toISOString().split('T')[0] // Dia atual
  });

  // Estados derivados baseados na aba ativa
  const campaigns = activeTab === 'meta' ? metaCampaigns : googleCampaigns;
  
  // DEBUG: Log das campanhas que chegam do hook
  React.useEffect(() => {
    if (activeTab === 'google' && googleCampaigns.length > 0) {
      console.log('📥 PÁGINA: Campanhas recebidas do hook Google Ads:', {
        total: googleCampaigns.length,
        firstCampaign: googleCampaigns[0],
        firstCampaignHasMetrics: !!googleCampaigns[0]?.metrics,
        firstCampaignMetrics: googleCampaigns[0]?.metrics
      });
    }
  }, [googleCampaigns, activeTab]);
  const loading = activeTab === 'meta' ? metaLoading : googleLoading;
  const error = activeTab === 'meta' ? metaError : googleError;
  const configuredAccounts = activeTab === 'meta' ? metaConfiguredAccounts : googleConfiguredAccounts;

  // Verificação de permissões movida para o início do componente

  const CAMPAIGNS_PER_PAGE = 10;

  // Função para carregar campanhas baseada na aba e conta selecionada
  const loadCampaigns = async () => {
    if (activeTab === 'meta') {
      if (selectedAccount === 'ALL') {
        await getAllMetaCampaignsWithInsights(dateRange);
      } else {
        await refreshMetaCampaignsWithInsights(dateRange, selectedAccount);
      }
    } else {
      if (selectedAccount === 'ALL') {
        await getAllGoogleCampaignsWithMetrics(dateRange);
      } else {
        await refreshGoogleCampaignsWithMetrics(dateRange, selectedAccount);
      }
    }
  };

  // Carregar insights automaticamente quando a página carregar ou conta mudar
  React.useEffect(() => {
    const loadInitialData = async () => {
      const currentIsConfigured = activeTab === 'meta' ? metaIsConfigured : googleIsConfigured;
      if (currentIsConfigured && campaigns.length > 0) {
        setInitialLoading(true);
        try {
          await loadCampaigns();
        } catch (error) {
          console.error('Erro ao carregar insights iniciais:', error);
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, [metaIsConfigured, googleIsConfigured, campaigns.length, selectedAccount, dateRange, activeTab]);

  // Atualizar campanhas filtradas quando campaigns mudar
  React.useEffect(() => {
    const filtrarCampanhasPorPermissao = async () => {
      console.log('🔍 FILTRO: Iniciando filtro de campanhas por permissão', {
        userWithLevel: userWithLevel?.nivel,
        campaignsCount: campaigns.length,
        firstCampaignHasMetrics: campaigns.length > 0 ? !!(campaigns[0] as any).metrics : null,
        activeTab
      });
      
      if (!userWithLevel || !campaigns.length) {
        console.log('🔍 FILTRO: Sem user ou sem campanhas, aplicando campaigns direto');
        setFilteredCampaigns(campaigns);
        return;
      }

      try {
        if (userWithLevel.nivel === 'diretor') {
          // Diretor pode ver todas as campanhas
          console.log('🔍 FILTRO: Diretor - aplicando todas as campanhas', {
            totalCampaigns: campaigns.length,
            firstCampaignMetrics: campaigns.length > 0 ? (campaigns[0] as any).metrics : null,
            firstCampaignComplete: campaigns.length > 0 ? campaigns[0] : null
          });
          setFilteredCampaigns(campaigns);
        } else if (userWithLevel.nivel === 'supervisor') {
          // Supervisor vê apenas campanhas das lojas vinculadas a ele
          const lojasPermitidas = await getLojasPermitidas(userWithLevel);
          
          // Buscar nomes das lojas permitidas
          const { data: lojasData, error: lojasError } = await supabase
            .from('lojas')
            .select('id, nome')
            .in('id', lojasPermitidas);

          if (lojasError) {
            console.error('Erro ao buscar lojas:', lojasError);
            setFilteredCampaigns([]);
            return;
          }

          // Função para extrair nome da loja do título da campanha
          const extractLojaNome = (campaignName: string): string | null => {
            const cleanName = campaignName.replace(/[\[\]]/g, '');
            
            // Padrão 1: Com hífen
            let match = cleanName.match(/^([^-]+)\s*-\s*/);
            if (match && match[1]) {
              return match[1].trim().toLowerCase();
            }
            
            // Padrão 2: Formato "MSG NOME_DA_LOJA dd/mm"
            match = cleanName.match(/^MSG\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+?)\s+\d{1,2}\/\d{1,2}$/i);
            if (match && match[1]) {
              return match[1].trim().toLowerCase();
            }
            
            // Padrão 3: Tudo antes da primeira data
            match = cleanName.match(/^([^0-9]+?)\s+\d{1,2}\/\d{1,2}(\/\d{2,4})?/);
            if (match && match[1]) {
              return match[1].trim().toLowerCase();
            }
            
            return null;
          };

          // Função para encontrar loja similar
          const encontrarLojaSimilar = (nomeExtraido: string, lojasDisponiveis: any[]): any | null => {
            const nomeNormalizado = nomeExtraido.toLowerCase();
            
            // Match exato
            const matchExato = lojasDisponiveis.find(loja => 
              loja.nome.toLowerCase() === nomeNormalizado
            );
            if (matchExato) return matchExato;
            
            // Match por cidade + número
            const palavrasExtraido = nomeNormalizado.split(' ');
            if (palavrasExtraido.length >= 2) {
              const cidadeExtraido = palavrasExtraido[0];
              const numeroExtraido = palavrasExtraido[1];
              
              const matchCidadeNumero = lojasDisponiveis.find(loja => {
                const nomeLoja = loja.nome.toLowerCase();
                const palavrasLoja = nomeLoja.split(' ');
                
                if (palavrasLoja.length >= 4) {
                  const cidadeLoja = palavrasLoja[0];
                  const tipoLoja = palavrasLoja[2];
                  const numeroLoja = palavrasLoja[3];
                  
                  const cidadeLojaSemAcento = cidadeLoja.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  const cidadeExtraidoSemAcento = cidadeExtraido.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  
                  if (cidadeLojaSemAcento === cidadeExtraidoSemAcento && 
                      tipoLoja === 'loja' && 
                      numeroLoja === numeroExtraido) {
                    return true;
                  }
                }
                return false;
              });
              
              if (matchCidadeNumero) return matchCidadeNumero;
            }
            
            // Match por cidade apenas
            if (palavrasExtraido.length === 1) {
              const cidadeExtraido = palavrasExtraido[0];
              const cidadeExtraidoSemAcento = cidadeExtraido.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              
              const matchCidade = lojasDisponiveis.find(loja => {
                const nomeLoja = loja.nome.toLowerCase();
                const palavrasLoja = nomeLoja.split(' ');
                
                if (palavrasLoja.length >= 1) {
                  const cidadeLoja = palavrasLoja[0];
                  const cidadeLojaSemAcento = cidadeLoja.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  
                  if (cidadeLojaSemAcento === cidadeExtraidoSemAcento) {
                    return true;
                  }
                }
                return false;
              });
              
              if (matchCidade) return matchCidade;
            }
            
            return null;
          };

          // Filtrar campanhas que correspondem às lojas do supervisor
          const campanhasFiltradas = campaigns.filter(campaign => {
            const nomeLojaCampanha = extractLojaNome(campaign.name);
            if (!nomeLojaCampanha) {
              return false;
            }
            
            // Verificar se a campanha corresponde a alguma das lojas do supervisor
            return lojasData.some(loja => {
              const lojaEncontrada = encontrarLojaSimilar(nomeLojaCampanha, [loja]);
              return lojaEncontrada !== null;
            });
          });
          
          console.log('🔍 Supervisor - Campanhas filtradas:', {
            totalCampanhas: campaigns.length,
            campanhasFiltradas: campanhasFiltradas.length,
            lojasPermitidas: lojasData.length,
            lojasIds: lojasData.map(l => l.id)
          });
          
          setFilteredCampaigns(campanhasFiltradas);
        } else {
          // Outros níveis não devem acessar esta tela
          setFilteredCampaigns([]);
        }
      } catch (error) {
        console.error('Erro ao filtrar campanhas por permissão:', error);
        setFilteredCampaigns([]);
      }
    };

    filtrarCampanhasPorPermissao();
  }, [campaigns, userWithLevel]);

  // Reset da página quando as campanhas mudarem
  React.useEffect(() => {
    setCurrentPage(1);
  }, [campaigns]);

  // Calcular paginação
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredCampaigns.length / CAMPAIGNS_PER_PAGE);
    const startIndex = (currentPage - 1) * CAMPAIGNS_PER_PAGE;
    const endIndex = startIndex + CAMPAIGNS_PER_PAGE;
    const currentCampaigns = filteredCampaigns.slice(startIndex, endIndex);
    
    // DEBUG: Log da paginação
    console.log('📄 PAGINAÇÃO: Calculando dados de paginação:', {
      filteredCampaignsCount: filteredCampaigns.length,
      firstFilteredHasMetrics: filteredCampaigns.length > 0 ? !!filteredCampaigns[0]?.metrics : null,
      currentCampaignsCount: currentCampaigns.length,
      firstCurrentHasMetrics: currentCampaigns.length > 0 ? !!currentCampaigns[0]?.metrics : null,
      startIndex,
      endIndex
    });
    
    return {
      totalPages,
      currentPage,
      currentCampaigns,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, filteredCampaigns.length),
      totalCampaigns: filteredCampaigns.length
    };
  }, [filteredCampaigns, currentPage]);

  // Funções de paginação
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < paginationData.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleRefresh = async () => {
    if (activeTab === 'meta') {
      await refreshMetaCampaignsWithInsights(dateRange);
    } else {
      await refreshGoogleCampaignsWithMetrics(dateRange);
    }
  };

  // Função para testar com período específico que pode ter dados
  const handleTestWithKnownPeriod = async () => {
    const testPeriod = {
      since: '2024-11-01', // Novembro 2024
      until: '2024-11-30'
    };
    console.log('🧪 TESTE: Buscando métricas para período conhecido:', testPeriod);
    
    if (activeTab === 'google') {
      await refreshGoogleCampaignsWithMetrics(testPeriod);
    }
  };

  const handleDateRangeChange = async (newDateRange: { since: string; until: string }) => {
    setDateRange(newDateRange);
    if (activeTab === 'meta') {
      await refreshMetaCampaignsWithInsights(newDateRange);
    } else {
      await refreshGoogleCampaignsWithMetrics(newDateRange);
    }
  };

  const handleFilterChange = (filtered: any[]) => {
    console.log('🔍 FILTROS: handleFilterChange chamado com:', {
      filteredCount: filtered.length,
      firstFiltered: filtered[0],
      firstFilteredHasMetrics: filtered.length > 0 ? !!filtered[0]?.metrics : null
    });
    setFilteredCampaigns(filtered);
    setCurrentPage(1); // Reset para primeira página quando aplicar filtros
  };

  // Exemplo de como usar o novo método getMetaStats
  const handleGetMetaStats = async () => {
    try {
      await getMetaStats(dateRange, 'exemplo'); // Busca campanhas com "exemplo" no nome
      console.log('Estatísticas do Meta carregadas:', metaStats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  // Função de teste para Google Ads API via Supabase Edge Functions
  const handleTestGoogleAdsAPI = async () => {
    console.log('🧪 INICIANDO TESTE SUPABASE EDGE FUNCTIONS GOOGLE ADS API');
    console.log('📋 Teste usando Supabase Edge Functions');
    console.log('✅ Backend local foi removido - usando apenas Edge Functions');
    
    try {
      // Teste 1: Validar Conexão via hook
      console.log('🔍 Teste 1: Validando conexão via Supabase...');
      const result1 = await validateGoogleConnection('ACCOUNT_1');
      console.log('📊 Resultado Teste 1 (validateConnection):', result1);
      
      // Teste 2: Buscar campanhas via hook
      console.log('🔍 Teste 2: Buscando campanhas via Supabase...');
      await refreshGoogleCampaigns('ACCOUNT_1');
      console.log('📊 Campanhas carregadas no hook');
      console.log('🔍 Total de campanhas:', googleCampaigns.length);
      
      // Teste 3: Buscar campanhas com métricas
      console.log('🔍 Teste 3: Buscando campanhas com métricas via Supabase...');
      const dateRange = {
        since: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0]
      };
      await refreshGoogleCampaignsWithMetrics(dateRange, 'ACCOUNT_1');
      console.log('📊 Campanhas com métricas carregadas no hook');
      console.log('🔍 Período testado:', dateRange);
      
      // Teste 4: Buscar estatísticas
      console.log('🔍 Teste 4: Buscando estatísticas via Supabase...');
      await getGoogleAdsStats(dateRange, undefined, 'ACCOUNT_1');
      console.log('📊 Estatísticas carregadas no hook');
      console.log('🔍 Estatísticas:', googleAdsStats);
      
      console.log('✅ TESTE SUPABASE EDGE FUNCTIONS COMPLETO FINALIZADO!');
      console.log('🔧 Todas as chamadas foram feitas via Supabase Edge Functions');
      console.log('🚫 Backend local foi removido - apenas Edge Functions são suportadas');
      console.log('📊 RESUMO DOS TESTES:');
      console.log('Teste 1 (validateConnection):', result1.connected ? '✅ SUCESSO' : '❌ FALHOU');
      console.log('Teste 2 (getCampaigns):', googleCampaigns.length > 0 ? '✅ SUCESSO' : '❌ FALHOU');
      console.log('Teste 3 (getCampaignsWithMetrics):', '✅ EXECUTADO');
      console.log('Teste 4 (getGoogleAdsStats):', '✅ EXECUTADO');
      console.log('==========================================');
      
    } catch (error) {
      console.error('❌ Erro no teste da Google Ads API via Supabase Edge Functions:', error);
      console.log('💡 Dica: Verifique se as Edge Functions estão configuradas corretamente');
      console.log('💡 Backend local foi removido - apenas Edge Functions são suportadas');
    }
  };

  // Calcular estatísticas gerais baseadas na aba ativa
  const getStatistics = () => {
    if (activeTab === 'meta') {
      const totalSpent = metaCampaigns.reduce((sum, campaign) => {
        return sum + (campaign.insights?.spend || 0);
      }, 0);

      const totalImpressions = metaCampaigns.reduce((sum, campaign) => {
        return sum + (campaign.insights?.impressions || 0);
      }, 0);

      const totalClicks = metaCampaigns.reduce((sum, campaign) => {
        return sum + (campaign.insights?.clicks || 0);
      }, 0);

      const totalReach = metaCampaigns.reduce((sum, campaign) => {
        return sum + (campaign.insights?.reach || 0);
      }, 0);

      // Calcular total de leads
      const totalLeads = metaCampaigns.reduce((sum, campaign) => {
        if (!campaign.insights?.actions) return sum;
        const leadAction = campaign.insights.actions.find((action: any) => 
          action.action_type === 'onsite_conversion.messaging_conversation_started_7d'
        );
        return sum + (leadAction ? Number(leadAction.value) || 0 : 0);
      }, 0);

      const costPerLead = totalLeads > 0 ? totalSpent / totalLeads : 0;
      const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const averageCPC = totalClicks > 0 ? totalSpent / totalClicks : 0;

      return { totalSpent, totalImpressions, totalClicks, totalReach, totalLeads, costPerLead, averageCTR, averageCPC };
    } else {
      const totalSpent = googleCampaigns.reduce((sum, campaign) => {
        return sum + ((campaign.metrics?.cost_micros || 0) / 1000000);
      }, 0);

      const totalImpressions = googleCampaigns.reduce((sum, campaign) => {
        return sum + (campaign.metrics?.impressions || 0);
      }, 0);

      const totalClicks = googleCampaigns.reduce((sum, campaign) => {
        return sum + (campaign.metrics?.clicks || 0);
      }, 0);

      const totalConversions = googleCampaigns.reduce((sum, campaign) => {
        return sum + (campaign.metrics?.conversions || 0);
      }, 0);

      const costPerConversion = totalConversions > 0 ? totalSpent / totalConversions : 0;
      const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const averageCPC = totalClicks > 0 ? totalSpent / totalClicks : 0;

      return { 
        totalSpent, 
        totalImpressions, 
        totalClicks, 
        totalReach: 0, // Google Ads não tem reach
        totalLeads: totalConversions, 
        costPerLead: costPerConversion, 
        averageCTR, 
        averageCPC 
      };
    }
  };

  const statistics = getStatistics();

  // Criar sidebar e bottom menu
  const sidebarContent = (
    <Sidebar 
      currentPath={location.pathname}
    />
  );


  // Verificar permissões de acesso
  if (userLevel === 'loja') {
    return (
      <DashboardLayout
        title="Anúncios Meta"
        showBackButton={true}
        backUrl="/diario/detalhe"
        sidebar={sidebarContent}
      >
        <div className="errorContainer">
          <div className="errorCard">
            <h3>Acesso Negado</h3>
            <p>Você não tem permissão para acessar esta página. Apenas diretores e supervisores podem visualizar os anúncios Meta.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Verificação específica para Meta Ads (apenas quando a aba Meta estiver ativa)
  if (activeTab === 'meta' && !metaIsConfigured) {
    return (
      <DashboardLayout
        title="Anúncios Meta"
        showBackButton={true}
        backUrl="/diario/detalhe"
        sidebar={sidebarContent}
        headerFiltersGrid={
          <div className="ads-tab-container">
            {/* Tabs de navegação */}
            <div className="ads-tabs">
              <button 
                className={`ads-tab ${activeTab === 'meta' ? 'active' : ''}`}
                onClick={() => setActiveTab('meta')}
              >
                <img 
                  src="/logos/meta_ads_logo.png" 
                  alt="Meta Ads" 
                  className="ads-tab-logo"
                />
                Meta Ads
                {metaIsConfigured && <span className="tab-badge">{metaConfiguredAccounts.length}</span>}
              </button>
              <button 
                className={`ads-tab ${activeTab === 'google' as TabType ? 'active' : ''}`}
                onClick={() => setActiveTab('google' as 'google')}
              >
                <img 
                  src="/logos/google_ads_logo.webp" 
                  alt="Google Ads" 
                  className="ads-tab-logo"
                />
                Google Ads
                {googleIsConfigured && <span className="tab-badge">{googleConfiguredAccounts.length}</span>}
              </button>
            </div>
          </div>
        }
      >
        <div className="errorContainer">
          <div className="errorCard">
            <h3>Configuração Necessária</h3>
            <p>As credenciais do Meta Ads não estão configuradas ou são inválidas.</p>
            <div className="configInstructions">
              <h4>Como configurar:</h4>
              <ol>
                <li>Acesse <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer">Facebook Developers</a></li>
                <li>Crie um aplicativo ou use um existente</li>
                <li>Configure o Meta Ads API</li>
                <li>Obtenha o ID da conta de anúncios (formato: act_XXXXXXXXXX)</li>
                <li>Gere um token de acesso com permissões ads_read</li>
                <li>Configure as credenciais no arquivo <code>src/constants/metaAds.ts</code></li>
              </ol>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

    return (
      <DashboardLayout
        title={`Anúncios ${activeTab === 'meta' ? 'Meta' : 'Google'}`}
        showBackButton={true}
        backUrl="/diario/detalhe"
        sidebar={sidebarContent}
        headerFiltersGrid={
          <div className="ads-tab-container">
            {/* Tabs de navegação */}
            <div className="ads-tabs">
              <button 
                className={`ads-tab ${activeTab === 'meta' ? 'active' : ''}`}
                onClick={() => setActiveTab('meta')}
              >
                <img 
                  src="/logos/meta_ads_logo.png" 
                  alt="Meta Ads" 
                  className="ads-tab-logo"
                />
                Meta Ads
                {metaIsConfigured && <span className="tab-badge">{metaConfiguredAccounts.length}</span>}
              </button>
              <button 
                className={`ads-tab ${activeTab === 'google' as TabType ? 'active' : ''}`}
                onClick={() => setActiveTab('google' as 'google')}
              >
                <img 
                  src="/logos/google_ads_logo.webp" 
                  alt="Google Ads" 
                  className="ads-tab-logo"
                />
                Google Ads
                {googleIsConfigured && <span className="tab-badge">{googleConfiguredAccounts.length}</span>}
              </button>
            </div>
            
            {/* Filtros da campanha ativa */}
            <CampaignFilters 
              campaigns={campaigns}
              onFilterChange={handleFilterChange}
              showInsights={showInsights}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              loading={loading || initialLoading}
              selectedAccount={selectedAccount}
              onAccountChange={setSelectedAccount}
              configuredAccounts={configuredAccounts}
            />
          </div>
        }
      >
      <div className="anuncios-dashboard-content">
        {/* Dashboard baseado na aba ativa */}
        {activeTab === 'meta' ? (
          <MetaAdsDashboard 
            dateRange={dateRange} 
            filteredCampaigns={filteredCampaigns}
          />
        ) : (
          <GoogleAdsDashboard 
            dateRange={dateRange} 
            filteredCampaigns={filteredCampaigns}
          />
        )}
        
        {/* Seção de Campanhas Individuais */}
        <div className="campaignsContainer">
          <h2 className="campaigns-section-title">
            Campanhas Individuais {activeTab === 'meta' ? 'Meta' : 'Google'}
          </h2>
          

          {error && (
            <div className="errorContainer">
              <div className="errorCard">
                <h3>Erro ao carregar dados</h3>
                <p>{error}</p>
                <button onClick={handleRefresh} className="botaoTentarNovamente">
                  Tentar Novamente
                </button>
              </div>
            </div>
          )}

          {loading || initialLoading ? (
            <div className="loadingContainer">
              <div className="loadingSpinner"></div>
              <p>{initialLoading ? 'Carregando insights das campanhas...' : 'Carregando campanhas...'}</p>
            </div>
          ) : (
            <>
              {filteredCampaigns.length === 0 ? (
                <div className="emptyState">
                  <h3>Nenhuma campanha encontrada</h3>
                  <p>Não há campanhas ativas ou que correspondam aos filtros aplicados.</p>
                </div>
              ) : (
                <>
                  <div className="campaignsGrid">
                    {paginationData.currentCampaigns.map((campaign, index) => {
                      console.log(`📄 PÁGINA: Passando campanha ${index + 1} "${campaign.name}" para componente:`, {
                        hasMetrics: !!campaign.metrics,
                        activeTab,
                        campaignKeys: Object.keys(campaign),
                        metricsKeys: campaign.metrics ? Object.keys(campaign.metrics) : null,
                        campaignComplete: campaign
                      });
                      
                      return activeTab === 'google' ? (
                        <GoogleAdsCampaignMetrics 
                          key={campaign.id} 
                          campaign={campaign}
                          showInsights={showInsights}
                          dateRange={dateRange}
                        />
                      ) : (
                        <CampaignCard 
                          key={campaign.id} 
                          campaign={campaign} 
                          showInsights={showInsights}
                          dateRange={dateRange}
                        />
                      )
                    })}
                  </div>
                  
                  {/* Paginação */}
                  {paginationData.totalPages > 1 && (
                    <div className="paginationContainer">
                      <div className="paginationInfo">
                        <span>
                          Mostrando {paginationData.startIndex} a {paginationData.endIndex} de {paginationData.totalCampaigns} campanhas
                        </span>
                      </div>
                      
                      <div className="paginationControls">
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="paginationButton"
                        >
                          <ChevronLeft size={16} />
                          Anterior
                        </button>
                        
                        <div className="paginationPages">
                          {Array.from({ length: paginationData.totalPages }, (_, index) => {
                            const pageNumber = index + 1;
                            const isCurrentPage = pageNumber === currentPage;
                            const isNearCurrent = Math.abs(pageNumber - currentPage) <= 2;
                            const isFirstOrLast = pageNumber === 1 || pageNumber === paginationData.totalPages;
                            
                            if (isCurrentPage || isNearCurrent || isFirstOrLast) {
                              return (
                                <button
                                  key={pageNumber}
                                  onClick={() => goToPage(pageNumber)}
                                  className={`paginationPage ${isCurrentPage ? 'active' : ''}`}
                                >
                                  {pageNumber}
                                </button>
                              );
                            } else if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
                              return <span key={pageNumber} className="paginationEllipsis">...</span>;
                            }
                            return null;
                          })}
                        </div>
                        
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === paginationData.totalPages}
                          className="paginationButton"
                        >
                          Próxima
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      <AppFooter />
    </DashboardLayout>
  );
};

export default AnunciosPage;
