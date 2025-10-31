import { useState, useEffect, useCallback } from 'react';
import { googleAdsApiService } from '../service/googleAdsApiService';

export const useGoogleAds = () => {
  const [googleAdsStats, setGoogleAdsStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    message: 'Não testado'
  });

  // Verificar se está configurado
  useEffect(() => {
    const checkConfiguration = () => {
      const hasCredentials = !!(
        import.meta.env.VITE_GOOGLE_CLIENT_ID &&
        import.meta.env.VITE_GOOGLE_CLIENT_SECRET &&
        import.meta.env.VITE_GOOGLE_REFRESH_TOKEN &&
        import.meta.env.VITE_GOOGLE_CUSTOMER_ID
      );
      setIsConfigured(hasCredentials);
    };

    checkConfiguration();
  }, []);

  // Testar conexão
  const validateConnection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Testando conexão com Google Ads API...');
      const result = await googleAdsApiService.testConnection();
      
      if (result.success) {
        setConnectionStatus({
          connected: true,
          message: 'Conectado com sucesso'
        });
        return { connected: true, message: 'Conectado com sucesso' };
      } else {
        setConnectionStatus({
          connected: false,
          message: result.error || 'Falha na conexão'
        });
        return { connected: false, message: result.error || 'Falha na conexão' };
      }
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
      setConnectionStatus({
        connected: false,
        message: error.message || 'Erro na conexão'
      });
      setError(error.message);
      return { connected: false, message: error.message || 'Erro na conexão' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar estatísticas
  const getGoogleAdsStats = useCallback(async (dateRange, searchTerm = null, accountKey = 'ACCOUNT_1') => {
    if (!dateRange?.since || !dateRange?.until) {
      console.warn('⚠️ DateRange inválido:', dateRange);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Buscando estatísticas do Google Ads...', { dateRange, searchTerm, accountKey });
      
      const stats = await googleAdsApiService.getStats(dateRange.since, dateRange.until);
      
      console.log('✅ Estatísticas carregadas:', stats);
      
      // Converter para o formato esperado pelo dashboard
      const formattedStats = {
        totalConversions: stats.totalConversions || 0,
        gastoTotal: stats.totalCost || 0,
        impressions: stats.totalImpressions || 0,
        clicks: stats.totalClicks || 0,
        ctr: stats.ctr || 0,
        cpc: stats.cpc || 0,
        conversionRate: stats.conversionRate || 0,
        dadosCampanhas: { total: 0, filtradas: 0 }
      };
      
      setGoogleAdsStats(formattedStats);
      return formattedStats;
      
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar campanhas
  const getCampaigns = useCallback(async (dateRange, accountKey = 'ACCOUNT_1') => {
    if (!dateRange?.since || !dateRange?.until) {
      console.warn('⚠️ DateRange inválido:', dateRange);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Buscando campanhas do Google Ads...', { dateRange, accountKey });
      
      const campaignsData = await googleAdsApiService.getCampaigns(dateRange.since, dateRange.until);
      
      console.log('✅ Campanhas carregadas:', campaignsData);
      
      setCampaigns(campaignsData || []);
      return campaignsData || [];
      
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar campanhas com métricas
  const getCampaignsWithMetrics = useCallback(async (dateRange, accountKey = 'ACCOUNT_1') => {
    if (!dateRange?.since || !dateRange?.until) {
      console.warn('⚠️ DateRange inválido:', dateRange);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Buscando campanhas com métricas do Google Ads...', { dateRange, accountKey });
      
      const campaignsData = await googleAdsApiService.getCampaigns(dateRange.since, dateRange.until);
      
      console.log('✅ Campanhas com métricas carregadas:', campaignsData);
      
      setCampaigns(campaignsData || []);
      return campaignsData || [];
      
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas com métricas:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    googleAdsStats,
    campaigns,
    loading,
    error,
    isConfigured,
    connectionStatus,
    validateConnection,
    getGoogleAdsStats,
    getCampaigns,
    getCampaignsWithMetrics,
    setError
  };
};
