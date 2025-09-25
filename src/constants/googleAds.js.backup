/**
 * Configurações do Google Ads
 * Baseado nas variáveis de ambiente e padrão do projeto
 */

// Configuração da conta 1 (Principal)
const GOOGLE_ADS_ACCOUNT_1 = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID,
  CLIENT_SECRET: import.meta.env.VITE_GOOGLE_ADS_CLIENT_SECRET,
  REFRESH_TOKEN: import.meta.env.VITE_GOOGLE_ADS_REFRESH_TOKEN,
  CUSTOMER_ID: import.meta.env.VITE_GOOGLE_ADS_CUSTOMER_ID,
  DEVELOPER_TOKEN: import.meta.env.VITE_GOOGLE_ADS_DEVELOPER_TOKEN,
};

// Configuração da conta 2 (Secundária) - opcional
const GOOGLE_ADS_ACCOUNT_2 = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID_2,
  CLIENT_SECRET: import.meta.env.VITE_GOOGLE_ADS_CLIENT_SECRET_2,
  REFRESH_TOKEN: import.meta.env.VITE_GOOGLE_ADS_REFRESH_TOKEN_2,
  CUSTOMER_ID: import.meta.env.VITE_GOOGLE_ADS_CUSTOMER_ID_2,
  DEVELOPER_TOKEN: import.meta.env.VITE_GOOGLE_ADS_DEVELOPER_TOKEN_2,
};

// Mapeamento das contas
const GOOGLE_ADS_ACCOUNTS = {
  ACCOUNT_1: {
    ...GOOGLE_ADS_ACCOUNT_1,
    name: 'Conta Principal',
    key: 'ACCOUNT_1'
  },
  ACCOUNT_2: {
    ...GOOGLE_ADS_ACCOUNT_2,
    name: 'Conta Secundária', 
    key: 'ACCOUNT_2'
  }
};

/**
 * Obtém a configuração de uma conta específica do Google Ads
 * @param {string} accountKey - Chave da conta ('ACCOUNT_1' ou 'ACCOUNT_2')
 * @returns {object} Configuração da conta
 */
export const getGoogleAdsConfig = (accountKey = 'ACCOUNT_1') => {
  const config = GOOGLE_ADS_ACCOUNTS[accountKey];
  
  if (!config) {
    console.warn(`⚠️ Configuração não encontrada para a conta: ${accountKey}`);
    return GOOGLE_ADS_ACCOUNTS.ACCOUNT_1; // Fallback para conta principal
  }
  
  return config;
};

/**
 * Obtém todas as contas do Google Ads configuradas
 * @returns {array} Array com as contas configuradas
 */
export const getConfiguredGoogleAdsAccounts = () => {
  const accounts = [];
  
  // Verificar conta 1
  if (isAccountConfigured('ACCOUNT_1')) {
    accounts.push(GOOGLE_ADS_ACCOUNTS.ACCOUNT_1);
  }
  
  // Verificar conta 2
  if (isAccountConfigured('ACCOUNT_2')) {
    accounts.push(GOOGLE_ADS_ACCOUNTS.ACCOUNT_2);
  }
  
  return accounts;
};

/**
 * Verifica se uma conta está configurada
 * @param {string} accountKey - Chave da conta
 * @returns {boolean} True se a conta está configurada
 */
export const isAccountConfigured = (accountKey) => {
  const config = GOOGLE_ADS_ACCOUNTS[accountKey];
  
  if (!config) return false;
  
  // Verificar se todas as credenciais essenciais estão presentes
  return !!(
    config.CLIENT_ID && 
    config.CLIENT_SECRET && 
    config.REFRESH_TOKEN && 
    config.CUSTOMER_ID && 
    config.DEVELOPER_TOKEN
  );
};

/**
 * Obtém o nome de uma conta
 * @param {string} accountKey - Chave da conta
 * @returns {string} Nome da conta
 */
export const getAccountName = (accountKey) => {
  const config = GOOGLE_ADS_ACCOUNTS[accountKey];
  return config ? config.name : accountKey;
};

/**
 * Configurações gerais do Google Ads
 */
export const GOOGLE_ADS_CONFIG = {
  // URLs da API
  API_VERSION: 'v15',
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

// Debug das configurações (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔧 Google Ads Configurações:', {
    account1: isAccountConfigured('ACCOUNT_1') ? '✅ Configurada' : '❌ Não configurada',
    account2: isAccountConfigured('ACCOUNT_2') ? '✅ Configurada' : '❌ Não configurada',
    totalAccounts: getConfiguredGoogleAdsAccounts().length
  });
}
