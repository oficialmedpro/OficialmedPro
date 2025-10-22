import { useState, useEffect, useCallback } from 'react';
import { metaAdsService, MetaAdsCampaign, MetaStats } from '../services/metaAdsService';
import { getConfiguredAccounts } from '../constants/metaAds';

interface UseMetaAdsReturn {
  campaigns: MetaAdsCampaign[];
  loading: boolean;
  error: string | null;
  accountInfo: any;
  metaStats: MetaStats | null;
  refreshCampaigns: (accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => Promise<void>;
  refreshCampaignsWithInsights: (dateRange: { since: string; until: string }, accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => Promise<void>;
  getMetaStats: (dateRange: { since: string; until: string }, searchTerm?: string, accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => Promise<void>;
  getMetaStatsAdapted: (unidadeNome?: string, accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => Promise<any>;
  getAllCampaigns: (accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => Promise<void>;
  getAllCampaignsWithInsights: (dateRange: { since: string; until: string }, accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => Promise<void>;
  isConfigured: boolean;
  configuredAccounts: Array<{ key: 'ACCOUNT_1' | 'ACCOUNT_2'; name: string }>;
}

export const useMetaAds = (): UseMetaAdsReturn => {
  const [campaigns, setCampaigns] = useState<MetaAdsCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [metaStats, setMetaStats] = useState<MetaStats | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [configuredAccounts, setConfiguredAccounts] = useState<Array<{ key: 'ACCOUNT_1' | 'ACCOUNT_2'; name: string }>>([]);

  // Verificar contas configuradas ao inicializar
  useEffect(() => {
    const accounts = getConfiguredAccounts();
    setConfiguredAccounts(accounts.map(acc => ({ key: acc.key, name: acc.name })));
    setIsConfigured(accounts.length > 0);
  }, []);

  const fetchAccountInfo = useCallback(async (accountKey: 'ACCOUNT_1' | 'ACCOUNT_2' = 'ACCOUNT_1') => {
    try {
      const info = await metaAdsService.getAccountInfo(accountKey);
      setAccountInfo(info);
    } catch (err) {
      console.error(`Erro ao buscar informações da conta ${accountKey}:`, err);
    }
  }, []);

  const fetchCampaigns = useCallback(async (accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => {
    if (!metaAdsService.isConfigured(accountKey || 'ACCOUNT_1')) {
      setError(`Credenciais do Meta Ads não configuradas para ${accountKey || 'ACCOUNT_1'}`);
      setIsConfigured(false);
      return;
    }

    setIsConfigured(true);
    setLoading(true);
    setError(null);

    try {
      const campaignsData = await metaAdsService.getCampaigns(accountKey);
      setCampaigns(campaignsData);
      
      // Buscar informações da conta se ainda não foram buscadas
      if (!accountInfo) {
        await fetchAccountInfo(accountKey);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar campanhas';
      setError(errorMessage);
      console.error('Erro no hook useMetaAds:', err);
    } finally {
      setLoading(false);
    }
  }, [accountInfo, fetchAccountInfo]);

  const fetchCampaignsWithInsights = useCallback(async (dateRange: { since: string; until: string }, accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => {
    if (!metaAdsService.isConfigured(accountKey || 'ACCOUNT_1')) {
      setError(`Credenciais do Meta Ads não configuradas para ${accountKey || 'ACCOUNT_1'}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const campaignsWithInsights = await metaAdsService.getCampaignsWithInsights(dateRange, accountKey);
      setCampaigns(campaignsWithInsights);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar campanhas com insights';
      setError(errorMessage);
      console.error('Erro ao buscar campanhas com insights:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMetaStats = useCallback(async (dateRange: { since: string; until: string }, searchTerm?: string, accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => {
    if (!metaAdsService.isConfigured(accountKey || 'ACCOUNT_1')) {
      setError(`Credenciais do Meta Ads não configuradas para ${accountKey || 'ACCOUNT_1'}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const stats = await metaAdsService.getMetaStats(dateRange, searchTerm, accountKey);
      setMetaStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar estatísticas do Meta';
      setError(errorMessage);
      console.error('Erro ao buscar estatísticas do Meta:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMetaStatsAdapted = useCallback(async (unidadeNome?: string, accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => {
    if (!metaAdsService.isConfigured(accountKey || 'ACCOUNT_1')) {
      setError(`Credenciais do Meta Ads não configuradas para ${accountKey || 'ACCOUNT_1'}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const stats = await metaAdsService.getMetaStatsAdapted(unidadeNome, accountKey);
      setMetaStats(stats);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar estatísticas adaptadas do Meta';
      setError(errorMessage);
      console.error('Erro ao buscar estatísticas adaptadas do Meta:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Novos métodos para buscar de todas as contas
  const getAllCampaigns = useCallback(async (accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => {
    if (accountKey && !metaAdsService.isConfigured(accountKey)) {
      setError(`Credenciais do Meta Ads não configuradas para ${accountKey}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allCampaigns = await metaAdsService.getAllCampaigns(accountKey);
      setCampaigns(allCampaigns);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar campanhas de todas as contas';
      setError(errorMessage);
      console.error('Erro ao buscar campanhas de todas as contas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllCampaignsWithInsights = useCallback(async (dateRange: { since: string; until: string }, accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => {
    if (accountKey && !metaAdsService.isConfigured(accountKey)) {
      setError(`Credenciais do Meta Ads não configuradas para ${accountKey}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allCampaignsWithInsights = await metaAdsService.getAllCampaignsWithInsights(dateRange, accountKey);
      setCampaigns(allCampaignsWithInsights);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar campanhas com insights de todas as contas';
      setError(errorMessage);
      console.error('Erro ao buscar campanhas com insights de todas as contas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Métodos de refresh (aliases para compatibilidade)
  const refreshCampaigns = useCallback(async (accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => {
    return fetchCampaigns(accountKey);
  }, [fetchCampaigns]);

  const refreshCampaignsWithInsights = useCallback(async (dateRange: { since: string; until: string }, accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2') => {
    return fetchCampaignsWithInsights(dateRange, accountKey);
  }, [fetchCampaignsWithInsights]);

  // Carregar campanhas na inicialização - apenas uma vez
  useEffect(() => {
    fetchCampaigns();
  }, []); // Removida dependência fetchCampaigns

  return {
    campaigns,
    loading,
    error,
    accountInfo,
    metaStats,
    refreshCampaigns,
    refreshCampaignsWithInsights,
    getMetaStats,
    getMetaStatsAdapted,
    getAllCampaigns,
    getAllCampaignsWithInsights,
    isConfigured,
    configuredAccounts
  };
};
