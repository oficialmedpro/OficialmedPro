/**
 * Configurações SEGURAS do Google Ads
 * Busca credenciais da Edge Function (runtime) ao invés de variáveis de build
 */

import { supabase } from '../supabaseClient';

// Cache das configurações (5 minutos)
let cachedConfig = null;
let configExpiry = null;

/**
 * Busca configurações do Google Ads via Edge Function (SEGURO)
 * @returns {Promise<object>} Configurações das contas
 */
export const getGoogleAdsConfigSecure = async () => {
  try {
    // Verificar cache
    if (cachedConfig && configExpiry && Date.now() < configExpiry) {
      console.log('✅ Usando configurações em cache');
      return cachedConfig;
    }

    console.log('🔍 Buscando configurações via Edge Function...');

    // Buscar via Edge Function (runtime - SEGURO)
    const { data, error } = await supabase.functions.invoke('google-ads-api', {
      body: { endpoint: 'get-config' }
    });

    if (error) {
      console.error('❌ Erro ao buscar configurações:', error);
      throw new Error(`Erro ao buscar configurações: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(`Erro na Edge Function: ${data.error}`);
    }

    // Transformar para formato esperado pelos services existentes
    const config = {
      ACCOUNT_1: {
        CLIENT_ID: data.config.GOOGLE_ADS_1.CLIENT_ID,
        CLIENT_SECRET: data.config.GOOGLE_ADS_1.CLIENT_SECRET,
        REFRESH_TOKEN: data.config.GOOGLE_ADS_1.REFRESH_TOKEN,
        CUSTOMER_ID: data.config.GOOGLE_ADS_1.CUSTOMER_ID,
        DEVELOPER_TOKEN: data.config.GOOGLE_ADS_1.DEVELOPER_TOKEN,
        name: 'Conta Principal',
        key: 'ACCOUNT_1'
      },
      ACCOUNT_2: {
        CLIENT_ID: data.config.GOOGLE_ADS_2.CLIENT_ID,
        CLIENT_SECRET: data.config.GOOGLE_ADS_2.CLIENT_SECRET,
        REFRESH_TOKEN: data.config.GOOGLE_ADS_2.REFRESH_TOKEN,
        CUSTOMER_ID: data.config.GOOGLE_ADS_2.CUSTOMER_ID,
        DEVELOPER_TOKEN: data.config.GOOGLE_ADS_2.DEVELOPER_TOKEN,
        name: 'Conta Secundária',
        key: 'ACCOUNT_2'
      }
    };

    // Cache por 5 minutos
    cachedConfig = config;
    configExpiry = Date.now() + 5 * 60 * 1000;

    console.log('✅ Configurações carregadas via Edge Function');
    return config;

  } catch (error) {
    console.error('❌ Erro ao buscar configurações seguras:', error);
    throw error;
  }
};

/**
 * Obtém a configuração de uma conta específica do Google Ads (ASYNC)
 * @param {string} accountKey - Chave da conta ('ACCOUNT_1' ou 'ACCOUNT_2')
 * @returns {Promise<object>} Configuração da conta
 */
export const getGoogleAdsConfig = async (accountKey = 'ACCOUNT_1') => {
  const configs = await getGoogleAdsConfigSecure();
  const config = configs[accountKey];

  if (!config) {
    console.warn(`⚠️ Configuração não encontrada para a conta: ${accountKey}`);
    return configs.ACCOUNT_1; // Fallback para conta principal
  }

  return config;
};

/**
 * Obtém todas as contas do Google Ads configuradas (ASYNC)
 * @returns {Promise<array>} Array com as contas configuradas
 */
export const getConfiguredGoogleAdsAccounts = async () => {
  const configs = await getGoogleAdsConfigSecure();
  const accounts = [];

  // Verificar conta 1
  if (await isAccountConfigured('ACCOUNT_1')) {
    accounts.push(configs.ACCOUNT_1);
  }

  // Verificar conta 2
  if (await isAccountConfigured('ACCOUNT_2')) {
    accounts.push(configs.ACCOUNT_2);
  }

  return accounts;
};

/**
 * Verifica se uma conta está configurada (ASYNC)
 * @param {string} accountKey - Chave da conta
 * @returns {Promise<boolean>} True se a conta está configurada
 */
export const isAccountConfigured = async (accountKey) => {
  try {
    const configs = await getGoogleAdsConfigSecure();
    const config = configs[accountKey];

    if (!config) return false;

    // Verificar se todas as credenciais essenciais estão presentes
    return !!(
      config.CLIENT_ID &&
      config.CLIENT_SECRET &&
      config.REFRESH_TOKEN &&
      config.CUSTOMER_ID &&
      config.DEVELOPER_TOKEN
    );
  } catch (error) {
    console.error('❌ Erro ao verificar configuração:', error);
    return false;
  }
};

/**
 * Obtém o nome de uma conta (ASYNC)
 * @param {string} accountKey - Chave da conta
 * @returns {Promise<string>} Nome da conta
 */
export const getAccountName = async (accountKey) => {
  try {
    const configs = await getGoogleAdsConfigSecure();
    const config = configs[accountKey];
    return config ? config.name : accountKey;
  } catch (error) {
    console.error('❌ Erro ao obter nome da conta:', error);
    return accountKey;
  }
};

/**
 * Configurações gerais do Google Ads (não sensíveis)
 */
export const GOOGLE_ADS_CONFIG = {
  // URLs da API
  API_VERSION: 'v21', // Atualizado para v21 como na Edge Function
  BASE_URL: 'https://googleads.googleapis.com',

  // Configurações de requisição
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,

  // Configurações de paginação
  DEFAULT_PAGE_SIZE: 10000,
  MAX_PAGE_SIZE: 10000,

  // Tipos de campanha suportados
  CAMPAIGN_TYPES: [
    'SEARCH',
    'DISPLAY',
    'SHOPPING',
    'VIDEO',
    'DISCOVERY',
    'LOCAL',
    'SMART',
    'PERFORMANCE_MAX'
  ],

  // Status de campanha
  CAMPAIGN_STATUSES: [
    'ENABLED',
    'PAUSED',
    'REMOVED'
  ],

  // Métricas padrão para consultas
  DEFAULT_METRICS: [
    'impressions',
    'clicks',
    'cost_micros',
    'conversions',
    'conversions_value',
    'ctr',
    'average_cpc',
    'all_conversions',
    'all_conversions_value'
  ]
};