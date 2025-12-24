import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from '../config/supabase.js'

// Snapshot inicial das configurações públicas
let {
  supabaseUrl,
  supabaseAnonKey,
  supabaseSchema
} = getSupabaseConfig();

// Função utilitária para atualizar o snapshot sempre que necessário
const refreshSupabaseConfig = () => {
  const config = getSupabaseConfig();
  supabaseUrl = config.supabaseUrl;
  supabaseAnonKey = config.supabaseAnonKey;
  supabaseSchema = config.supabaseSchema;
  return config;
};

// Cache do cliente Supabase (lazy initialization)
let supabaseClient = null;

// Função para obter ou criar o cliente Supabase (lazy initialization)
const getSupabaseClient = () => {
  // Se já existe, retornar
  if (supabaseClient) {
    return supabaseClient;
  }
  
  // Obter configuração atualizada (pode ter mudado se window.ENV foi injetado)
  const { supabaseUrl: currentSupabaseUrl, supabaseAnonKey: currentSupabaseAnonKey, supabaseSchema: currentSupabaseSchema } = refreshSupabaseConfig();
  
  // Validar URLs antes de criar cliente
  let validSupabaseUrl = currentSupabaseUrl;
  let validSupabaseAnonKey = currentSupabaseAnonKey;

  // Validar e limpar URL
  if (validSupabaseUrl && typeof validSupabaseUrl === 'string') {
    validSupabaseUrl = validSupabaseUrl.trim();
  }

  // Validar URL antes de usar
  if (!validSupabaseUrl || 
      typeof validSupabaseUrl !== 'string' || 
      validSupabaseUrl === 'undefined' || 
      validSupabaseUrl === 'null' || 
      validSupabaseUrl === '' || 
      !validSupabaseUrl.startsWith('http')) {
    console.error('❌ [supabase.js] URL inválida:', validSupabaseUrl);
    validSupabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
  }

  // Validar URL com new URL() para garantir que é válida
  try {
    const testUrl = new URL(validSupabaseUrl);
    if (!testUrl.hostname || !testUrl.protocol) {
      throw new Error('URL sem hostname ou protocolo');
    }
  } catch (e) {
    console.error('❌ [supabase.js] Erro ao validar URL:', e.message);
    console.error('❌ [supabase.js] URL recebida:', validSupabaseUrl);
    validSupabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
  }

  // Garantir que a URL final é válida
  if (!validSupabaseUrl || !validSupabaseUrl.startsWith('https://')) {
    validSupabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
  }

  // Validar anon key
  if (!validSupabaseAnonKey || 
      typeof validSupabaseAnonKey !== 'string' || 
      validSupabaseAnonKey === 'undefined' || 
      validSupabaseAnonKey === 'null' || 
      validSupabaseAnonKey === '') {
    console.error('❌ [supabase.js] Anon key inválida. Configure VITE_SUPABASE_ANON_KEY.');
    validSupabaseAnonKey = '';
  }

  const defaultSchema = currentSupabaseSchema || 'api';
  const globalHeaders = {
    'Accept-Profile': defaultSchema,
    'Content-Profile': defaultSchema,
  };
  if (validSupabaseAnonKey) {
    globalHeaders.apikey = validSupabaseAnonKey;
    globalHeaders.Authorization = `Bearer ${validSupabaseAnonKey}`;
  }

  // Criar cliente Supabase com anon key (somente privilégios públicos)
  supabaseClient = createClient(validSupabaseUrl, validSupabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: defaultSchema
    },
    global: {
      headers: globalHeaders
    }
  });
  
  return supabaseClient;
};

// Exportar getter que faz lazy initialization
export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseClient();
    return client[prop];
  }
});

// Função para obter o cliente com schema específico
// Cache de clientes Supabase para evitar múltiplas instâncias
const supabaseClients = new Map();

export const getSupabaseWithSchema = (schema) => {
  const schemaKey = schema || 'api';
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  
  // Verificar se já existe um cliente para este schema
  if (supabaseClients.has(schemaKey)) {
    console.log('✅ [getSupabaseWithSchema] Cliente já existe no cache para schema:', schemaKey);
    return supabaseClients.get(schemaKey);
  }
  
  // Validar URL e anon key antes de criar cliente
  let urlToUse = supabaseUrl;
  let keyToUse = supabaseAnonKey;
  
  if (!urlToUse || typeof urlToUse !== 'string' || !urlToUse.startsWith('https://')) {
    console.error('❌ [getSupabaseWithSchema] URL inválida, usando fallback');
    urlToUse = 'https://agdffspstbxeqhqtltvb.supabase.co';
  }
  
  try {
    new URL(urlToUse);
  } catch (e) {
    console.error('❌ [getSupabaseWithSchema] Erro ao validar URL:', e.message);
    urlToUse = 'https://agdffspstbxeqhqtltvb.supabase.co';
  }
  
  if (!keyToUse || typeof keyToUse !== 'string') {
    console.error('❌ [getSupabaseWithSchema] Anon key inválida. Configure VITE_SUPABASE_ANON_KEY.');
    keyToUse = '';
  }
  
  console.log('🔧 [getSupabaseWithSchema] Criando novo cliente Supabase...');
  console.log('🔍 [getSupabaseWithSchema] Configuração:', {
    schema: schemaKey,
    url: urlToUse ? `${urlToUse.substring(0, 30)}...` : 'NÃO DEFINIDA',
    hasAnonKey: !!keyToUse,
    anonKeyLength: keyToUse?.length || 0
  });
  
  const globalHeadersSchema = {
    'Accept-Profile': schemaKey,
    'Content-Profile': schemaKey,
  };
  if (keyToUse) {
    globalHeadersSchema.apikey = keyToUse;
    globalHeadersSchema.Authorization = `Bearer ${keyToUse}`;
  }

  const client = createClient(urlToUse, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    // Define o schema do PostgREST corretamente
    db: {
      schema: schemaKey
    },
    // Garante os headers também (algumas versões do SDK dependem desses)
    global: {
      headers: globalHeadersSchema
    }
  });
  
  console.log('✅ [getSupabaseWithSchema] Cliente criado com sucesso');
  console.log('🔍 [getSupabaseWithSchema] Headers configurados:', {
    'Accept-Profile': schemaKey,
    'Content-Profile': schemaKey
  });
  
  // Armazenar no cache
  supabaseClients.set(schemaKey, client);
  return client;
}

// Função para testar a conexão
export const testConnection = async () => {
  try {
    console.log('🔌 Testando conexão com Supabase...')
    const { supabaseUrl, supabaseAnonKey, supabaseSchema } = getSupabaseConfig();
    console.log('URL:', supabaseUrl)
    console.log('Schema:', supabaseSchema)
    console.log('Anon Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Não configurada')
    
    // Testar conexão básica com schema específico
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Erro ao conectar:', error)
      return false
    }
    
    console.log('✅ Conexão realizada com sucesso')
    return true
  } catch (error) {
    console.error('❌ Erro na conexão:', error)
    return false
  }
}

// Funções básicas do supabase (não relacionadas ao FilterBar)
export const getOportunidadesSprint = async (limit = 10) => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('*')
      .limit(limit)
    
    if (error) {
      console.error('❌ Erro ao buscar oportunidades:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('❌ Erro ao buscar oportunidades Sprint:', error)
    throw error
  }
}

export const getOportunidadesPorStatus = async (status, limit = 20) => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('*')
      .eq('status', status)
      .limit(limit)
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Erro ao buscar oportunidades por status:', error)
    throw error
  }
}

export const getOportunidadesPorUnidade = async (unidadeId, limit = 20) => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('*')
      .eq('unidade_id', unidadeId)
      .limit(limit)
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Erro ao buscar oportunidades por unidade:', error)
    throw error
  }
}

export const getEstatisticasOportunidades = async () => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    
    const { data: abertas } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('id')
      .eq('status', 'open')
    
    const { data: fechadas } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('id')
      .eq('status', 'won')
    
    const { data: perdidas } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('id')
      .eq('status', 'lost')
    
    return {
      abertas: abertas?.length || 0,
      fechadas: fechadas?.length || 0,
      perdidas: perdidas?.length || 0
    }
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    throw error
  }
}

/**
 * 📄 FUNÇÃO PARA BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO RECURSIVA
 * 
 * @param {string} url - URL base da query
 * @param {Object} headers - Headers da requisição
 * @returns {Array} Todos os registros encontrados
 */
const fetchAllRecords = async (url, headers) => {
  const pageSize = 1000;
  let allRecords = [];
  let offset = 0;
  let hasMore = true;

  console.log('📄 Supabase: Iniciando paginação para URL:', url);

  while (hasMore) {
    const paginatedUrl = `${url}`;
    const paginationHeaders = {
      ...headers,
      'Range': `${offset}-${offset + pageSize - 1}`
    };

    try {
      const response = await fetch(paginatedUrl, {
        method: 'GET',
        headers: paginationHeaders
      });

      if (!response.ok) {
        console.error(`❌ Supabase: Erro na página ${Math.floor(offset / pageSize) + 1}:`, response.status);
        break;
      }

      const pageData = await response.json();
      allRecords = allRecords.concat(pageData);

      console.log(`📄 Supabase: Página ${Math.floor(offset / pageSize) + 1}: ${pageData.length} registros | Total: ${allRecords.length}`);

      if (pageData.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
      }

      const contentRange = response.headers.get('Content-Range');
      if (contentRange) {
        const match = contentRange.match(/(\d+)-(\d+)\/(\d+|\*)/);
        if (match) {
          const [, , end, total] = match;
          if (total !== '*' && parseInt(end) >= parseInt(total) - 1) {
            hasMore = false;
          }
        }
      }

    } catch (error) {
      console.error(`❌ Supabase: Erro ao buscar página ${Math.floor(offset / pageSize) + 1}:`, error);
      break;
    }
  }

  console.log(`✅ Supabase: Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
};

// 🎯 FUNÇÃO PARA BUSCAR FUNIS POR IDs
export const getFunisPorIds = async (ids) => {
  try {
    const client = getSupabaseWithSchema('api');
    
    if (!ids || ids.length === 0) {
      console.warn('⚠️ [getFunisPorIds] Nenhum ID fornecido');
      return [];
    }

    const { data, error } = await client
      .from('funis')
      .select('id_funil_sprint, nome_funil')
      .in('id_funil_sprint', ids);

    if (error) {
      console.error('❌ [getFunisPorIds] Erro ao buscar funis:', error);
      throw error;
    }

    console.log(`✅ [getFunisPorIds] ${data?.length || 0} funis encontrados`);
    return data || [];
  } catch (error) {
    console.error('❌ [getFunisPorIds] Erro ao buscar funis:', error);
    throw error;
  }
};

// 🎯 FUNÇÃO PARA BUSCAR VENDEDORES POR IDs
export const getVendedoresPorIds = async (ids) => {
  try {
    const client = getSupabaseWithSchema('api');
    
    if (!ids || ids.length === 0) {
      console.warn('⚠️ [getVendedoresPorIds] Nenhum ID fornecido');
      return [];
    }

    const { data, error } = await client
      .from('vendedores')
      .select('id, nome, id_sprint, id_unidade, status')
      .in('id_sprint', ids)
      .eq('status', 'ativo');

    if (error) {
      console.error('❌ [getVendedoresPorIds] Erro ao buscar vendedores:', error);
      throw error;
    }

    console.log(`✅ [getVendedoresPorIds] ${data?.length || 0} vendedores encontrados`);
    return data || [];
  } catch (error) {
    console.error('❌ [getVendedoresPorIds] Erro ao buscar vendedores:', error);
    throw error;
  }
};

// 🎯 FUNÇÃO PARA BUSCAR TODOS OS FUNIS ATIVOS (para filtros)
// Filtra apenas funis comerciais da unidade Apucarana ('[1]')
// Funis comerciais: 6, 14, 33, 41, 38
export const getAllFunis = async () => {
  try {
    const { FUNIS_COMERCIAIS_APUCARANA } = await import('./cockpitConstants');
    const client = getSupabaseWithSchema('api');
    
    const { data, error } = await client
      .from('funis')
      .select('id_funil_sprint, nome_funil')
      .eq('unidade', '[1]') // Apenas unidade Apucarana
      .in('id_funil_sprint', FUNIS_COMERCIAIS_APUCARANA) // Apenas funis comerciais
      .or('status.eq.ativo,status.is.null')
      .order('nome_funil', { ascending: true });

    if (error) {
      console.error('❌ [getAllFunis] Erro ao buscar funis:', error);
      throw error;
    }

    console.log(`✅ [getAllFunis] ${data?.length || 0} funis comerciais encontrados (unidade Apucarana)`);
    return data || [];
  } catch (error) {
    console.error('❌ [getAllFunis] Erro ao buscar funis:', error);
    throw error;
  }
};

// 🎯 FUNÇÃO PARA BUSCAR TODOS OS VENDEDORES ATIVOS (para filtros)
export const getAllVendedores = async () => {
  try {
    const client = getSupabaseWithSchema('api');
    
    const { data, error } = await client
      .from('vendedores')
      .select('id, nome, id_sprint, id_unidade, status')
      .eq('status', 'ativo')
      .order('nome', { ascending: true });

    if (error) {
      console.error('❌ [getAllVendedores] Erro ao buscar vendedores:', error);
      throw error;
    }

    console.log(`✅ [getAllVendedores] ${data?.length || 0} vendedores encontrados`);
    return data || [];
  } catch (error) {
    console.error('❌ [getAllVendedores] Erro ao buscar vendedores:', error);
    throw error;
  }
};

// 🎯 FUNÇÕES PARA CONFIGURAÇÃO DO COCKPIT VENDEDORES
export const getCockpitVendedoresConfig = async () => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    console.log('🔍 [getCockpitVendedoresConfig] Buscando configurações...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_vendedores_config?select=*&ativo=eq.true&order=tipo_secao.asc,ordem_exibicao.asc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [getCockpitVendedoresConfig] Erro ao buscar configurações:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log(`✅ [getCockpitVendedoresConfig] ${data?.length || 0} configurações encontradas`);
    return data || [];
  } catch (error) {
    console.error('❌ [getCockpitVendedoresConfig] Erro:', error);
    throw error;
  }
};

export const createCockpitVendedoresConfig = async (config) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_vendedores_config`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [createCockpitVendedoresConfig] Erro ao criar configuração:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [createCockpitVendedoresConfig] Erro:', error);
    throw error;
  }
};

export const updateCockpitVendedoresConfig = async (id, updates) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_vendedores_config?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [updateCockpitVendedoresConfig] Erro ao atualizar configuração:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [updateCockpitVendedoresConfig] Erro:', error);
    throw error;
  }
};

export const deleteCockpitVendedoresConfig = async (id) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_vendedores_config?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [deleteCockpitVendedoresConfig] Erro ao deletar configuração:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('❌ [deleteCockpitVendedoresConfig] Erro:', error);
    throw error;
  }
};

// 🎯 FUNÇÕES PARA TIPOS DE SEÇÃO
export const getTiposSecao = async () => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_tipos_secao?select=*&ativo=eq.true&order=ordem.asc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [getTiposSecao] Erro ao buscar tipos de seção:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('❌ [getTiposSecao] Erro:', error);
    throw error;
  }
};

export const createTipoSecao = async (tipo) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_tipos_secao`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(tipo)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [createTipoSecao] Erro ao criar tipo de seção:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [createTipoSecao] Erro:', error);
    throw error;
  }
};

export const updateTipoSecao = async (id, updates) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_tipos_secao?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [updateTipoSecao] Erro ao atualizar tipo de seção:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [updateTipoSecao] Erro:', error);
    throw error;
  }
};

export const deleteTipoSecao = async (id) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_tipos_secao?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [deleteTipoSecao] Erro ao deletar tipo de seção:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('❌ [deleteTipoSecao] Erro:', error);
    throw error;
  }
};

// 🎯 FUNÇÕES PARA METAS DOS VENDEDORES
export const getMetasVendedores = async () => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_vendedores?select=*&ativo=eq.true&order=vendedor_id_sprint.asc,dia_semana.asc,nome_meta.asc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [getMetasVendedores] Erro ao buscar metas:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('❌ [getMetasVendedores] Erro:', error);
    throw error;
  }
};

export const createMetaVendedor = async (meta) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_vendedores`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(meta)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [createMetaVendedor] Erro ao criar meta:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [createMetaVendedor] Erro:', error);
    throw error;
  }
};

export const updateMetaVendedor = async (id, updates) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_vendedores?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [updateMetaVendedor] Erro ao atualizar meta:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [updateMetaVendedor] Erro:', error);
    throw error;
  }
};

export const deleteMetaVendedor = async (id) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_vendedores?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [deleteMetaVendedor] Erro ao deletar meta:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('❌ [deleteMetaVendedor] Erro:', error);
    throw error;
  }
};

// Função para obter meta de um vendedor baseado no dia da semana atual
export const getMetaVendedorPorDia = (metas, vendedorId, nomeMeta) => {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0 = domingo, 6 = sábado
  
  let diaSemanaMeta = 'seg_sex';
  
  if (diaSemana === 6) { // Sábado
    diaSemanaMeta = 'sabado';
  } else if (diaSemana === 0) { // Domingo - usa meta do sábado
    diaSemanaMeta = 'sabado';
  } else { // Segunda a Sexta
    diaSemanaMeta = 'seg_sex';
  }
  
  const meta = metas.find(m => 
    m.vendedor_id_sprint === vendedorId &&
    m.nome_meta === nomeMeta &&
    m.dia_semana === diaSemanaMeta &&
    m.ativo === true
  );
  
  return meta?.valor_meta || null;
};

// 🎯 FUNÇÕES PARA TIPOS DE METAS
export const getTiposMetas = async () => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_tipos_metas?select=*&ativo=eq.true&order=ordem.asc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [getTiposMetas] Erro ao buscar tipos de metas:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('❌ [getTiposMetas] Erro:', error);
    throw error;
  }
};

export const createTipoMeta = async (tipo) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_tipos_metas`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(tipo)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [createTipoMeta] Erro ao criar tipo de meta:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [createTipoMeta] Erro:', error);
    throw error;
  }
};

export const updateTipoMeta = async (id, updates) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_tipos_metas?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [updateTipoMeta] Erro ao atualizar tipo de meta:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [updateTipoMeta] Erro:', error);
    throw error;
  }
};

export const deleteTipoMeta = async (id) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_tipos_metas?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [deleteTipoMeta] Erro ao deletar tipo de meta:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('❌ [deleteTipoMeta] Erro:', error);
    throw error;
  }
};

// 🎯 FUNÇÕES PARA NOMES DE METAS
export const getNomesMetas = async () => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_nomes_metas?select=*&ativo=eq.true&order=ordem.asc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [getNomesMetas] Erro ao buscar nomes de metas:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('❌ [getNomesMetas] Erro:', error);
    throw error;
  }
};

export const createNomeMeta = async (nome) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_nomes_metas`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(nome)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [createNomeMeta] Erro ao criar nome de meta:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [createNomeMeta] Erro:', error);
    throw error;
  }
};

export const updateNomeMeta = async (id, updates) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_nomes_metas?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [updateNomeMeta] Erro ao atualizar nome de meta:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [updateNomeMeta] Erro:', error);
    throw error;
  }
};

export const deleteNomeMeta = async (id) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_nomes_metas?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [deleteNomeMeta] Erro ao deletar nome de meta:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('❌ [deleteNomeMeta] Erro:', error);
    throw error;
  }
};

// 🎯 FUNÇÕES PARA METAS POR RONDA (HORÁRIO)
export const getMetasRondas = async () => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_rondas?select=*&ativo=eq.true&order=vendedor_id_sprint.asc,horario.asc,nome_meta.asc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [getMetasRondas] Erro ao buscar metas por ronda:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('❌ [getMetasRondas] Erro:', error);
    throw error;
  }
};

export const createMetaRonda = async (meta) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_rondas`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(meta)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [createMetaRonda] Erro ao criar meta por ronda:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [createMetaRonda] Erro:', error);
    throw error;
  }
};

export const updateMetaRonda = async (id, updates) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_rondas?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [updateMetaRonda] Erro ao atualizar meta por ronda:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [updateMetaRonda] Erro:', error);
    throw error;
  }
};

export const deleteMetaRonda = async (id) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_rondas?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [deleteMetaRonda] Erro ao deletar meta por ronda:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('❌ [deleteMetaRonda] Erro:', error);
    throw error;
  }
};

// 🎯 FUNÇÕES PARA METAS DE TEMPO DA JORNADA
export const getMetasTempo = async () => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_tempo?select=*&ativo=eq.true&order=vendedor_id_sprint.asc,dia_semana.asc,nome_etapa.asc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [getMetasTempo] Erro ao buscar metas de tempo:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('❌ [getMetasTempo] Erro:', error);
    throw error;
  }
};

export const createMetaTempo = async (meta) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_tempo`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(meta)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [createMetaTempo] Erro ao criar meta de tempo:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [createMetaTempo] Erro:', error);
    throw error;
  }
};

export const updateMetaTempo = async (id, updates) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_tempo?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [updateMetaTempo] Erro ao atualizar meta de tempo:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [updateMetaTempo] Erro:', error);
    throw error;
  }
};

export const deleteMetaTempo = async (id) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_tempo?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [deleteMetaTempo] Erro ao deletar meta de tempo:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('❌ [deleteMetaTempo] Erro:', error);
    throw error;
  }
};

// 🎯 FUNÇÃO PARA BUSCAR ETAPAS DINÂMICAS DO FUNIL
/**
 * 🎯 Buscar entradas por dia e vendedor (user_id)
 * Conta quantas oportunidades têm entrada_compra preenchido em uma data específica por vendedor
 *
 * @param {number[]|null} userIds - lista opcional de user_id para filtrar
 * @param {Date|string|null} date - data desejada (Date ou 'YYYY-MM-DD'); se null, usa hoje (timezone Brasil)
 */
/**
 * 🎯 Buscar entradas por ronda (faixa horária) e vendedor
 * Agrupa entradas por faixas horárias: 10h (00:01-10:00), 12h (10:01-12:00), 14h (12:01-14:00), 16h (14:01-16:00), 18h (16:01-18:00)
 * 
 * @param {number[]|null} userIds - lista opcional de user_id para filtrar
 * @param {Date|string|null} date - data desejada (Date ou 'YYYY-MM-DD'); se null, usa hoje (timezone Brasil)
 * @returns {Object} { user_id: { '10h': count, '12h': count, '14h': count, '16h': count, '18h': count } }
 */
export const getEntradasVendedoresPorRonda = async (userIds = null, date = null, funilIdsMap = null) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    console.log('🔍 [getEntradasVendedoresPorRonda] Buscando entradas por ronda...');
    
    // Determinar data base (em timezone do Brasil)
    let baseDate;
    if (date instanceof Date) {
      baseDate = new Date(date);
    } else if (typeof date === 'string' && date.length >= 10) {
      baseDate = new Date(`${date}T00:00:00`);
    } else {
      const hoje = new Date();
      baseDate = new Date(hoje.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    }

    baseDate.setHours(0, 0, 0, 0);
    
    // Converter para ISO string para usar na query
    const inicioISO = baseDate.toISOString();
    const fim = new Date(baseDate);
    fim.setHours(23, 59, 59, 999);
    const fimISO = fim.toISOString();
    
    // Mapeamento de funil_id para campo de entrada
    const funilParaCampo = {
      6: 'entrada_compra',
      14: 'entrada_recompra',
      33: 'entrada_ativacao',
      41: 'entrada_monitoramento',
      38: 'entrada_reativacao'
    };
    
    let promises = [];
    
    // Se funilIdsMap foi fornecido, buscar apenas os campos específicos de cada funil
    if (funilIdsMap && typeof funilIdsMap === 'object') {
      // Agrupar userIds por funil_id
      const funisAgrupados = {};
      Object.entries(funilIdsMap).forEach(([userId, funilId]) => {
        const funilIdNum = parseInt(funilId);
        if (!funisAgrupados[funilIdNum]) {
          funisAgrupados[funilIdNum] = [];
        }
        funisAgrupados[funilIdNum].push(parseInt(userId));
      });
      
      // Buscar cada funil separadamente
      Object.entries(funisAgrupados).forEach(([funilId, userIdsList]) => {
        const campoNome = funilParaCampo[parseInt(funilId)];
        if (!campoNome) {
          console.warn(`⚠️ [getEntradasVendedoresPorRonda] Funil ID ${funilId} não mapeado, ignorando`);
          return;
        }
        
        const funilUserIdsFilter = `&user_id=in.(${userIdsList.join(',')})`;
        const funilFilter = `&funil_id=eq.${funilId}`;
        const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id,${campoNome}&${campoNome}=gte.${inicioISO}&${campoNome}=lt.${fimISO}&${campoNome}=not.is.null${funilUserIdsFilter}${funilFilter}`;
        
        promises.push(
          fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'apikey': supabaseAnonKey,
              'Accept-Profile': 'api',
              'Content-Profile': 'api'
            }
          }).then(response => {
            if (!response.ok) {
              console.warn(`⚠️ [getEntradasVendedoresPorRonda] Erro ao buscar ${campoNome} (funil ${funilId}):`, response.status);
              return [];
            }
            return response.json();
          }).catch(error => {
            console.warn(`⚠️ [getEntradasVendedoresPorRonda] Erro ao buscar ${campoNome} (funil ${funilId}):`, error);
            return [];
          })
        );
      });
    } else {
      // Se não há funilIdsMap, buscar TODOS os campos (comportamento anterior)
      const camposEntrada = Object.values(funilParaCampo);
      const userIdsFilter = userIds && Array.isArray(userIds) && userIds.length > 0 
        ? `&user_id=in.(${userIds.join(',')})` 
        : '';
      
      promises = camposEntrada.map(nome => {
        const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id,${nome}&${nome}=gte.${inicioISO}&${nome}=lt.${fimISO}&${nome}=not.is.null${userIdsFilter}`;
        
        return fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey,
            'Accept-Profile': 'api',
            'Content-Profile': 'api'
          }
        }).then(response => {
          if (!response.ok) {
            console.warn(`⚠️ [getEntradasVendedoresPorRonda] Erro ao buscar ${nome}:`, response.status);
            return [];
          }
          return response.json();
        }).catch(error => {
          console.warn(`⚠️ [getEntradasVendedoresPorRonda] Erro ao buscar ${nome}:`, error);
          return [];
        });
      });
    }
    
    const results = await Promise.all(promises);
    
    // Agrupar por user_id e horário (ronda), usando Set para evitar duplicatas
    const contagemPorVendedorRonda = {};
    const oportunidadesProcessadas = new Set();
    
    results.forEach((data) => {
      
      if (Array.isArray(data)) {
        data.forEach(opp => {
          if (!opp.user_id) return;
          
          // Usar id como chave única para evitar processar a mesma oportunidade múltiplas vezes
          const chaveUnica = `${opp.user_id}-${opp.id}`;
          if (oportunidadesProcessadas.has(chaveUnica)) return;
          oportunidadesProcessadas.add(chaveUnica);
          
          // Buscar o campo de entrada preenchido (verificar todos os campos)
          let dataEntrada = null;
          const campos = Object.values(funilParaCampo);
          for (const campo of campos) {
            if (opp[campo]) {
              dataEntrada = opp[campo];
              break;
            }
          }
          if (!dataEntrada) return;
          
          const entradaDate = new Date(dataEntrada);
          // Ajustar para o fuso horário de São Paulo para extrair a hora correta
          const localTime = new Date(entradaDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
          const hora = localTime.getHours();
          const minuto = localTime.getMinutes();
          const totalMinutos = hora * 60 + minuto;
          
          // Determinar ronda baseado nas faixas:
          // 10h: 00:01 até 10:00 (1 minuto até 600 minutos)
          // 12h: 10:01 até 12:00 (601 até 720 minutos)
          // 14h: 12:01 até 14:00 (721 até 840 minutos)
          // 16h: 14:01 até 16:00 (841 até 960 minutos)
          // 18h: 16:01 até 18:00 (961 até 1080 minutos)
          let ronda = null;
          
          if (totalMinutos >= 1 && totalMinutos <= 600) {
            ronda = '10h';
          } else if (totalMinutos >= 601 && totalMinutos <= 720) {
            ronda = '12h';
          } else if (totalMinutos >= 721 && totalMinutos <= 840) {
            ronda = '14h';
          } else if (totalMinutos >= 841 && totalMinutos <= 960) {
            ronda = '16h';
          } else if (totalMinutos >= 961 && totalMinutos <= 1080) {
            ronda = '18h';
          }
          
          if (ronda) {
            if (!contagemPorVendedorRonda[opp.user_id]) {
              contagemPorVendedorRonda[opp.user_id] = { '10h': 0, '12h': 0, '14h': 0, '16h': 0, '18h': 0 };
            }
            contagemPorVendedorRonda[opp.user_id][ronda] = (contagemPorVendedorRonda[opp.user_id][ronda] || 0) + 1;
          }
        });
      }
    });
    
    console.log(`✅ [getEntradasVendedoresPorRonda] Entradas agrupadas por ronda:`, contagemPorVendedorRonda);
    return contagemPorVendedorRonda;
  } catch (error) {
    console.error('❌ [getEntradasVendedoresPorRonda] Erro:', error);
    return {};
  }
};

export const getEntradasVendedoresHoje = async (userIds = null, date = null, funilIdsMap = null) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    console.log('🔍 [getEntradasVendedoresHoje] Buscando entradas por dia (todos os funis)...');
    
    // Determinar data base (em timezone do Brasil)
    let baseDate;
    if (date instanceof Date) {
      baseDate = new Date(date);
    } else if (typeof date === 'string' && date.length >= 10) {
      // Interpretar como YYYY-MM-DD na timezone do Brasil
      baseDate = new Date(`${date}T00:00:00`);
    } else {
      const hoje = new Date();
      baseDate = new Date(hoje.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    }

    baseDate.setHours(0, 0, 0, 0);
    
    // Converter para ISO string para usar na query
    // Formato: YYYY-MM-DDTHH:mm:ss.sssZ
    const inicioISO = baseDate.toISOString();
    
    // Fim do dia (23:59:59.999)
    const fim = new Date(baseDate);
    fim.setHours(23, 59, 59, 999);
    const fimISO = fim.toISOString();
    
    // Construir filtro de userIds se fornecido
    const userIdsFilter = userIds && Array.isArray(userIds) && userIds.length > 0 
      ? `&user_id=in.(${userIds.join(',')})` 
      : '';
    
    // Mapeamento de funil_id para campo de entrada
    const funilParaCampo = {
      6: 'entrada_compra',
      14: 'entrada_recompra',
      33: 'entrada_ativacao',
      41: 'entrada_monitoramento',
      38: 'entrada_reativacao'
    };
    
    let promises = [];
    
    // Se funilIdsMap foi fornecido, buscar apenas os campos específicos de cada funil
    if (funilIdsMap && typeof funilIdsMap === 'object') {
      // Agrupar userIds por funil_id
      const funisAgrupados = {};
      Object.entries(funilIdsMap).forEach(([userId, funilId]) => {
        const funilIdNum = parseInt(funilId);
        if (!funisAgrupados[funilIdNum]) {
          funisAgrupados[funilIdNum] = [];
        }
        funisAgrupados[funilIdNum].push(parseInt(userId));
      });
      
      // Buscar cada funil separadamente
      Object.entries(funisAgrupados).forEach(([funilId, userIdsList]) => {
        const campo = funilParaCampo[parseInt(funilId)];
        if (!campo) {
          console.warn(`⚠️ [getEntradasVendedoresHoje] Funil ID ${funilId} não mapeado, ignorando`);
          return;
        }
        
        const funilUserIdsFilter = `&user_id=in.(${userIdsList.join(',')})`;
        const funilFilter = `&funil_id=eq.${funilId}`;
        const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id&${campo}=gte.${inicioISO}&${campo}=lt.${fimISO}&${campo}=not.is.null${funilUserIdsFilter}${funilFilter}`;
        
        promises.push(
          fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'apikey': supabaseAnonKey,
              'Accept-Profile': 'api',
              'Content-Profile': 'api',
              'Prefer': 'count=exact'
            }
          }).then(response => {
            if (!response.ok) {
              console.warn(`⚠️ [getEntradasVendedoresHoje] Erro ao buscar ${campo} (funil ${funilId}):`, response.status);
              return [];
            }
            return response.json();
          }).catch(error => {
            console.warn(`⚠️ [getEntradasVendedoresHoje] Erro ao buscar ${campo} (funil ${funilId}):`, error);
            return [];
          })
        );
      });
    } else {
      // Se não há funilIdsMap, buscar TODOS os campos (comportamento anterior)
      const camposEntrada = Object.values(funilParaCampo);
      
      promises = camposEntrada.map(campo => {
        const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id&${campo}=gte.${inicioISO}&${campo}=lt.${fimISO}&${campo}=not.is.null${userIdsFilter}`;
        
        return fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey,
            'Accept-Profile': 'api',
            'Content-Profile': 'api',
            'Prefer': 'count=exact'
          }
        }).then(response => {
          if (!response.ok) {
            console.warn(`⚠️ [getEntradasVendedoresHoje] Erro ao buscar ${campo}:`, response.status);
            return [];
          }
          return response.json();
        }).catch(error => {
          console.warn(`⚠️ [getEntradasVendedoresHoje] Erro ao buscar ${campo}:`, error);
          return [];
        });
      });
    }
    
    const results = await Promise.all(promises);
    
    // Combinar todos os resultados usando Set para evitar duplicatas
    const oportunidadesUnicas = new Set();
    const contagemPorVendedor = {};
    
    results.forEach(data => {
      if (Array.isArray(data)) {
        data.forEach(opp => {
          if (opp.user_id !== null && opp.user_id !== undefined && opp.id !== null && opp.id !== undefined) {
            // Usar id como chave única para evitar contar a mesma oportunidade múltiplas vezes
            const chaveUnica = `${opp.user_id}-${opp.id}`;
            if (!oportunidadesUnicas.has(chaveUnica)) {
              oportunidadesUnicas.add(chaveUnica);
              contagemPorVendedor[opp.user_id] = (contagemPorVendedor[opp.user_id] || 0) + 1;
            }
          }
        });
      }
    });
    
    console.log(`✅ [getEntradasVendedoresHoje] ${Object.keys(contagemPorVendedor).length} vendedores com entradas hoje:`, contagemPorVendedor);
    return contagemPorVendedor;
  } catch (error) {
    console.error('❌ [getEntradasVendedoresHoje] Erro:', error);
    // Retornar objeto vazio em caso de erro para não quebrar o componente
    return {};
  }
};

// ============================================================================
// FUNÇÕES PARA BUSCAR ORÇAMENTOS (ORÇAMENTO OU NEGOCIAÇÃO)
// ============================================================================

/**
 * Busca orçamentos por vendedor para uma data específica
 * Um orçamento é contabilizado quando o lead passa pela etapa ORÇAMENTO OU NEGOCIAÇÃO
 * Se passar pelas duas etapas, conta apenas 1 orçamento (usa a data mais antiga)
 */
export const getOrcamentosVendedoresHoje = async (userIds = null, date = null, funilIdsMap = null) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    console.log('🔍 [getOrcamentosVendedoresHoje] Buscando orçamentos por dia...');
    
    let baseDate;
    if (date instanceof Date) {
      baseDate = new Date(date);
    } else if (typeof date === 'string' && date.length >= 10) {
      baseDate = new Date(`${date}T00:00:00`);
    } else {
      const hoje = new Date();
      baseDate = new Date(hoje.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    }

    baseDate.setHours(0, 0, 0, 0);
    
    const inicioISO = baseDate.toISOString();
    const fim = new Date(baseDate);
    fim.setHours(23, 59, 59, 999);
    const fimISO = fim.toISOString();
    
    const funilParaCampos = {
      6: { orcamento: 'orcamento_compra', negociacao: 'negociacao_compra' },
      14: { orcamento: 'orcamento_recompra', negociacao: 'negociacao_recompra' },
      33: { orcamento: 'orcamento_ativacao', negociacao: 'negociacao_ativacao' },
      41: { orcamento: 'orcamento_monitoramento', negociacao: 'negociacao_monitoramento' },
      38: { orcamento: 'orcamento_reativacao', negociacao: 'negociacao_reativacao' }
    };
    
    const allOpportunities = [];
    const oportunidadesProcessadas = new Set();

    if (funilIdsMap && typeof funilIdsMap === 'object') {
      const funisAgrupados = {};
      Object.entries(funilIdsMap).forEach(([userId, funilId]) => {
        const funilIdNum = parseInt(funilId);
        if (!funisAgrupados[funilIdNum]) {
          funisAgrupados[funilIdNum] = [];
        }
        funisAgrupados[funilIdNum].push(parseInt(userId));
      });
      
      for (const [funilId, userIdsList] of Object.entries(funisAgrupados)) {
        const campos = funilParaCampos[parseInt(funilId)];
        if (!campos) {
          console.warn(`⚠️ [getOrcamentosVendedoresHoje] Funil ID ${funilId} não mapeado`);
          continue;
        }
        
        const funilUserIdsFilter = `&user_id=in.(${userIdsList.join(',')})`;
        const funilFilter = `&funil_id=eq.${funilId}`;
        
        // Buscar oportunidades com orcamento OU negociacao no intervalo de datas
        // Como o PostgREST não suporta OR fácil, vamos buscar separadamente e combinar
        const promises = [];
        
        // Buscar orcamentos no intervalo
        const urlOrc = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id,${campos.orcamento},${campos.negociacao}${funilUserIdsFilter}${funilFilter}&${campos.orcamento}=gte.${inicioISO}&${campos.orcamento}=lt.${fimISO}&${campos.orcamento}=not.is.null`;
        promises.push(
          fetch(urlOrc, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'apikey': supabaseAnonKey,
              'Accept-Profile': 'api',
              'Content-Profile': 'api',
              'Prefer': 'count=exact'
            }
          }).then(response => response.ok ? response.json() : []).catch(() => [])
        );
        
        // Buscar negociacoes no intervalo
        const urlNeg = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id,${campos.orcamento},${campos.negociacao}${funilUserIdsFilter}${funilFilter}&${campos.negociacao}=gte.${inicioISO}&${campos.negociacao}=lt.${fimISO}&${campos.negociacao}=not.is.null`;
        promises.push(
          fetch(urlNeg, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'apikey': supabaseAnonKey,
              'Accept-Profile': 'api',
              'Content-Profile': 'api',
              'Prefer': 'count=exact'
            }
          }).then(response => response.ok ? response.json() : []).catch(() => [])
        );
        
        try {
          const [dataOrc, dataNeg] = await Promise.all(promises);
          const dataCombinada = [...dataOrc, ...dataNeg];
          
          dataCombinada.forEach(opp => {
            const chaveUnica = `${opp.user_id}-${opp.id}`;
            if (oportunidadesProcessadas.has(chaveUnica)) return;
            
            // Se chegou aqui, já está no intervalo de datas (a query já filtra)
            allOpportunities.push(opp);
            oportunidadesProcessadas.add(chaveUnica);
          });
        } catch (error) {
          console.warn(`⚠️ [getOrcamentosVendedoresHoje] Erro ao buscar funil ${funilId}:`, error);
        }
      }
    }
    
    const contagemPorVendedor = {};
    allOpportunities.forEach(opp => {
      if (opp.user_id !== null && opp.user_id !== undefined) {
        contagemPorVendedor[opp.user_id] = (contagemPorVendedor[opp.user_id] || 0) + 1;
      }
    });
    
    console.log(`✅ [getOrcamentosVendedoresHoje] ${Object.keys(contagemPorVendedor).length} vendedores com orçamentos:`, contagemPorVendedor);
    return contagemPorVendedor;
  } catch (error) {
    console.error('❌ [getOrcamentosVendedoresHoje] Erro:', error);
    return {};
  }
};

/**
 * Busca orçamentos agrupados por ronda (horários específicos)
 */
export const getOrcamentosVendedoresPorRonda = async (userIds = null, date = null, funilIdsMap = null) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    console.log('🔍 [getOrcamentosVendedoresPorRonda] Buscando orçamentos por ronda...');

    let baseDate;
    if (date instanceof Date) {
      baseDate = new Date(date);
    } else if (typeof date === 'string' && date.length >= 10) {
      baseDate = new Date(`${date}T00:00:00`);
    } else {
      const hoje = new Date();
      baseDate = new Date(hoje.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    }
    baseDate.setHours(0, 0, 0, 0);

    const inicioISO = baseDate.toISOString();
    const fim = new Date(baseDate);
    fim.setHours(23, 59, 59, 999);
    const fimISO = fim.toISOString();

    const funilParaCampos = {
      6: { orcamento: 'orcamento_compra', negociacao: 'negociacao_compra' },
      14: { orcamento: 'orcamento_recompra', negociacao: 'negociacao_recompra' },
      33: { orcamento: 'orcamento_ativacao', negociacao: 'negociacao_ativacao' },
      41: { orcamento: 'orcamento_monitoramento', negociacao: 'negociacao_monitoramento' },
      38: { orcamento: 'orcamento_reativacao', negociacao: 'negociacao_reativacao' }
    };

    const allOpportunities = [];
    const oportunidadesProcessadas = new Set();

    if (funilIdsMap && typeof funilIdsMap === 'object') {
      const funisAgrupados = {};
      Object.entries(funilIdsMap).forEach(([userId, funilId]) => {
        const funilIdNum = parseInt(funilId);
        if (!funisAgrupados[funilIdNum]) {
          funisAgrupados[funilIdNum] = [];
        }
        funisAgrupados[funilIdNum].push(parseInt(userId));
      });
      
      for (const [funilId, userIdsList] of Object.entries(funisAgrupados)) {
        const campos = funilParaCampos[parseInt(funilId)];
        if (!campos) continue;
        
        const funilUserIdsFilter = `&user_id=in.(${userIdsList.join(',')})`;
        const funilFilter = `&funil_id=eq.${funilId}`;
        
        // Buscar orcamentos e negociacoes separadamente no intervalo de datas
        const promises = [];
        
        // Buscar orcamentos
        const urlOrc = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id,${campos.orcamento},${campos.negociacao}${funilUserIdsFilter}${funilFilter}&${campos.orcamento}=gte.${inicioISO}&${campos.orcamento}=lt.${fimISO}&${campos.orcamento}=not.is.null`;
        promises.push(
          fetch(urlOrc, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'apikey': supabaseAnonKey,
              'Accept-Profile': 'api',
              'Content-Profile': 'api'
            }
          }).then(response => response.ok ? response.json() : []).catch(() => [])
        );
        
        // Buscar negociacoes
        const urlNeg = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id,${campos.orcamento},${campos.negociacao}${funilUserIdsFilter}${funilFilter}&${campos.negociacao}=gte.${inicioISO}&${campos.negociacao}=lt.${fimISO}&${campos.negociacao}=not.is.null`;
        promises.push(
          fetch(urlNeg, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'apikey': supabaseAnonKey,
              'Accept-Profile': 'api',
              'Content-Profile': 'api'
            }
          }).then(response => response.ok ? response.json() : []).catch(() => [])
        );
        
        try {
          const [dataOrc, dataNeg] = await Promise.all(promises);
          const dataCombinada = [...dataOrc, ...dataNeg];
          
          dataCombinada.forEach(opp => {
            const chaveUnica = `${opp.user_id}-${opp.id}`;
            if (oportunidadesProcessadas.has(chaveUnica)) return;
            
            // Se chegou aqui, já está no intervalo de datas (a query já filtra)
            allOpportunities.push({ ...opp, funil_id: parseInt(funilId) });
            oportunidadesProcessadas.add(chaveUnica);
          });
        } catch (error) {
          console.warn(`⚠️ [getOrcamentosVendedoresPorRonda] Erro ao buscar funil ${funilId}:`, error);
        }
      }
    }

    const contagemPorVendedorPorRonda = {};

    const rondasHorarios = {
      '10h': { start: 0, end: 10 * 60 },
      '12h': { start: 10 * 60 + 1, end: 12 * 60 },
      '14h': { start: 12 * 60 + 1, end: 14 * 60 },
      '16h': { start: 14 * 60 + 1, end: 16 * 60 },
      '18h': { start: 16 * 60 + 1, end: 18 * 60 },
    };

    allOpportunities.forEach(opp => {
      if (opp.user_id !== null && opp.user_id !== undefined) {
        // Encontrar o funil_id correto baseado no user_id
        const funilIdParaOpp = funilIdsMap ? funilIdsMap[opp.user_id] : null;
        if (!funilIdParaOpp) return;
        
        const campos = funilParaCampos[parseInt(funilIdParaOpp)];
        if (!campos) return;
        
        // Usar a data mais antiga entre orcamento e negociacao
        const dataOrcamento = opp[campos.orcamento] ? new Date(opp[campos.orcamento]) : null;
        const dataNegociacao = opp[campos.negociacao] ? new Date(opp[campos.negociacao]) : null;
        
        let dataParaUsar = null;
        if (dataOrcamento && dataNegociacao) {
          dataParaUsar = dataOrcamento <= dataNegociacao ? dataOrcamento : dataNegociacao;
        } else if (dataOrcamento) {
          dataParaUsar = dataOrcamento;
        } else if (dataNegociacao) {
          dataParaUsar = dataNegociacao;
        }
        
        if (!dataParaUsar) return;
        
        const localTime = new Date(dataParaUsar.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const minutesOfDay = localTime.getHours() * 60 + localTime.getMinutes();

        if (!contagemPorVendedorPorRonda[opp.user_id]) {
          contagemPorVendedorPorRonda[opp.user_id] = {
            '10h': 0, '12h': 0, '14h': 0, '16h': 0, '18h': 0
          };
        }

        for (const ronda in rondasHorarios) {
          const { start, end } = rondasHorarios[ronda];
          if (minutesOfDay >= start && minutesOfDay <= end) {
            contagemPorVendedorPorRonda[opp.user_id][ronda]++;
            break;
          }
        }
      }
    });

    console.log(`✅ [getOrcamentosVendedoresPorRonda] Orçamentos por ronda encontrados:`, contagemPorVendedorPorRonda);
    return contagemPorVendedorPorRonda;
  } catch (error) {
    console.error('❌ [getOrcamentosVendedoresPorRonda] Erro:', error);
    return {};
  }
};

// ============================================================================
// FUNÇÕES PARA BUSCAR VENDAS (CADASTRO OU STATUS='gain')
// ============================================================================

/**
 * Busca vendas por vendedor para uma data específica
 * Uma venda é contabilizada quando:
 * - status='gain' OU
 * - campo cadastro_* está preenchido
 * Retorna objeto com contagem, valorTotal e ticketMedio por vendedor
 */
export const getVendasVendedoresHoje = async (userIds = null, date = null, funilIdsMap = null) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    console.log(`🔍 [getVendasVendedoresHoje] Buscando vendas para data: ${date || 'hoje'}`);
    
    // Processar data: garantir que seja sempre interpretada como data local
    let dataStr;
    if (date instanceof Date) {
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      dataStr = `${ano}-${mes}-${dia}`;
    } else if (typeof date === 'string' && date.length >= 10) {
      // Se já vem no formato YYYY-MM-DD, usar diretamente
      dataStr = date.substring(0, 10);
    } else {
      // Usar hoje no timezone de São Paulo
      const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      dataStr = `${ano}-${mes}-${dia}`;
    }
    
    // Para comparar com as datas do banco, precisamos converter para Date object
    // Mas usar apenas para logs, a comparação será feita com strings
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const baseDate = new Date(ano, mes - 1, dia, 0, 0, 0, 0); // Local time
    const inicioISO = baseDate.toISOString();
    const fim = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
    const fimISO = fim.toISOString();
    
    // Mapeamento de funil_id para campo de cadastro
    const funilParaCampo = {
      6: 'cadastro_compra',
      14: 'cadastro_recompra',
      33: 'cadastro_ativacao',
      41: 'cadastro_monitoramento',
      38: 'cadastro_reativacao'
    };
    
    const allOpportunities = [];
    const oportunidadesProcessadas = new Set();

    if (funilIdsMap && typeof funilIdsMap === 'object') {
      const funisAgrupados = {};
      Object.entries(funilIdsMap).forEach(([userId, funilId]) => {
        const funilIdNum = parseInt(funilId);
        if (!funisAgrupados[funilIdNum]) {
          funisAgrupados[funilIdNum] = [];
        }
        funisAgrupados[funilIdNum].push(parseInt(userId));
      });
      
      for (const [funilId, userIdsList] of Object.entries(funisAgrupados)) {
        const campoCadastro = funilParaCampo[parseInt(funilId)];
        if (!campoCadastro) {
          console.warn(`⚠️ [getVendasVendedoresHoje] Funil ID ${funilId} não mapeado`);
          continue;
        }
        
        const funilUserIdsFilter = `&user_id=in.(${userIdsList.join(',')})`;
        const funilFilter = `&funil_id=eq.${funilId}`;
        
        // Buscar vendas: status='gain' OU campo cadastro_* preenchido
        // Fazer duas queries separadas para ganhar performance e evitar problemas com OR complexo
        // Query 1: Vendas com gain_date na data específica
        const urlGainDate = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id,value,status,gain_date,${campoCadastro},create_date${funilUserIdsFilter}${funilFilter}&status=eq.gain&value=gt.0&gain_date=gte.${dataStr}T00:00:00&gain_date=lt.${dataStr}T23:59:59.999`;
        
        // Query 2: Vendas com cadastro_* na data específica (mas sem gain_date na data)
        const urlCadastro = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id,value,status,gain_date,${campoCadastro},create_date${funilUserIdsFilter}${funilFilter}&${campoCadastro}=not.is.null&${campoCadastro}=gte.${dataStr}T00:00:00&${campoCadastro}=lt.${dataStr}T23:59:59.999&value=gt.0`;
        // URL removida dos logs para reduzir poluição
        
        try {
          // Buscar dados de ambas as queries em paralelo
          const [responseGain, responseCadastro] = await Promise.all([
            fetch(urlGainDate, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey,
                'Accept-Profile': 'api',
                'Content-Profile': 'api',
                'Prefer': 'count=exact'
              }
            }),
            fetch(urlCadastro, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey,
                'Accept-Profile': 'api',
                'Content-Profile': 'api',
                'Prefer': 'count=exact'
              }
            })
          ]);
          
          let data = [];
          
          if (responseGain.ok) {
            const dataGain = await responseGain.json();
            data = data.concat(dataGain);
          } else {
            console.warn(`⚠️ [getVendasVendedoresHoje] Erro ao buscar gain_date funil ${funilId}:`, responseGain.status);
          }
          
          if (responseCadastro.ok) {
            const dataCadastro = await responseCadastro.json();
            // Adicionar apenas se não estiver na lista (evitar duplicatas)
            const idsGain = new Set(data.map(d => d.id));
            data = data.concat(dataCadastro.filter(d => !idsGain.has(d.id)));
          } else {
            console.warn(`⚠️ [getVendasVendedoresHoje] Erro ao buscar cadastro funil ${funilId}:`, responseCadastro.status);
          }
          
          let incluidosCount = 0;
          let excluidosCount = 0;
          
          data.forEach(opp => {
            const chaveUnica = `${opp.user_id}-${opp.id}`;
            if (oportunidadesProcessadas.has(chaveUnica)) return;
            
            // Como já filtramos por data na query, todas as oportunidades aqui já são da data correta
            // Apenas precisamos garantir que não há duplicatas e adicionar ao array
            incluidosCount++;
            allOpportunities.push({
              ...opp,
              dataVenda: opp.gain_date ? new Date(opp.gain_date) : (opp[campoCadastro] ? new Date(opp[campoCadastro]) : new Date(opp.create_date)),
              funil_id: parseInt(funilId)
            });
            oportunidadesProcessadas.add(chaveUnica);
          });
          
          console.log(`📊 [getVendasVendedoresHoje] Funil ${funilId}: ${data.length} oportunidades recebidas para ${dataStr}`);
        } catch (error) {
          console.warn(`⚠️ [getVendasVendedoresHoje] Erro ao buscar funil ${funilId}:`, error);
        }
      }
    }
    
    // Agrupar por vendedor: contagem, valor total, ticket médio
    const vendasPorVendedor = {};
    
    allOpportunities.forEach(opp => {
      if (opp.user_id !== null && opp.user_id !== undefined && opp.value && opp.value > 0) {
        if (!vendasPorVendedor[opp.user_id]) {
          vendasPorVendedor[opp.user_id] = {
            contagem: 0,
            valorTotal: 0,
            ticketMedio: 0
          };
        }
        vendasPorVendedor[opp.user_id].contagem++;
        vendasPorVendedor[opp.user_id].valorTotal += parseFloat(opp.value) || 0;
      }
    });
    
    // Calcular ticket médio para cada vendedor
    Object.keys(vendasPorVendedor).forEach(userId => {
      const vendedor = vendasPorVendedor[userId];
      vendedor.ticketMedio = vendedor.contagem > 0 ? vendedor.valorTotal / vendedor.contagem : 0;
    });
    
    console.log(`✅ [getVendasVendedoresHoje] ${Object.keys(vendasPorVendedor).length} vendedores com vendas. Total de oportunidades processadas: ${allOpportunities.length}`);
    return vendasPorVendedor;
  } catch (error) {
    console.error('❌ [getVendasVendedoresHoje] Erro:', error);
    return {};
  }
};

/**
 * Busca vendas agrupadas por ronda (horários específicos)
 */
export const getVendasVendedoresPorRonda = async (userIds = null, date = null, funilIdsMap = null) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    console.log('🔍 [getVendasVendedoresPorRonda] Buscando vendas por ronda...');

    // Processar data: garantir que seja sempre interpretada como data local
    let dataStr;
    if (date instanceof Date) {
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      dataStr = `${ano}-${mes}-${dia}`;
    } else if (typeof date === 'string' && date.length >= 10) {
      // Se já vem no formato YYYY-MM-DD, usar diretamente
      dataStr = date.substring(0, 10);
    } else {
      // Usar hoje no timezone de São Paulo
      const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      dataStr = `${ano}-${mes}-${dia}`;
    }
    
    // Para comparar com as datas do banco, precisamos converter para Date object
    // Mas usar apenas para logs, a comparação será feita com strings
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const baseDate = new Date(ano, mes - 1, dia, 0, 0, 0, 0); // Local time
    const inicioISO = baseDate.toISOString();
    const fim = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
    const fimISO = fim.toISOString();

    const funilParaCampo = {
      6: 'cadastro_compra',
      14: 'cadastro_recompra',
      33: 'cadastro_ativacao',
      41: 'cadastro_monitoramento',
      38: 'cadastro_reativacao'
    };

    const allOpportunities = [];
    const oportunidadesProcessadas = new Set();

    if (funilIdsMap && typeof funilIdsMap === 'object') {
      const funisAgrupados = {};
      Object.entries(funilIdsMap).forEach(([userId, funilId]) => {
        const funilIdNum = parseInt(funilId);
        if (!funisAgrupados[funilIdNum]) {
          funisAgrupados[funilIdNum] = [];
        }
        funisAgrupados[funilIdNum].push(parseInt(userId));
      });
      
      for (const [funilId, userIdsList] of Object.entries(funisAgrupados)) {
        const campoCadastro = funilParaCampo[parseInt(funilId)];
        if (!campoCadastro) continue;
        
        const funilUserIdsFilter = `&user_id=in.(${userIdsList.join(',')})`;
        const funilFilter = `&funil_id=eq.${funilId}`;
        
        // Buscar vendas: status='gain' OU campo cadastro_* preenchido
        // Fazer duas queries separadas para ganhar performance e evitar problemas com OR complexo
        // Query 1: Vendas com gain_date na data específica
        const urlGainDate = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id,value,status,gain_date,${campoCadastro},create_date${funilUserIdsFilter}${funilFilter}&status=eq.gain&value=gt.0&gain_date=gte.${dataStr}T00:00:00&gain_date=lt.${dataStr}T23:59:59.999`;
        
        // Query 2: Vendas com cadastro_* na data específica (mas sem gain_date na data)
        const urlCadastro = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id,value,status,gain_date,${campoCadastro},create_date${funilUserIdsFilter}${funilFilter}&${campoCadastro}=not.is.null&${campoCadastro}=gte.${dataStr}T00:00:00&${campoCadastro}=lt.${dataStr}T23:59:59.999&value=gt.0`;
        
        try {
          // Buscar dados de ambas as queries em paralelo
          const [responseGain, responseCadastro] = await Promise.all([
            fetch(urlGainDate, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey,
                'Accept-Profile': 'api',
                'Content-Profile': 'api'
              }
            }),
            fetch(urlCadastro, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey,
                'Accept-Profile': 'api',
                'Content-Profile': 'api'
              }
            })
          ]);
          
          let data = [];
          
          if (responseGain.ok) {
            const dataGain = await responseGain.json();
            data = data.concat(dataGain);
          }
          
          if (responseCadastro.ok) {
            const dataCadastro = await responseCadastro.json();
            // Adicionar apenas se não estiver na lista (evitar duplicatas)
            const idsGain = new Set(data.map(d => d.id));
            data = data.concat(dataCadastro.filter(d => !idsGain.has(d.id)));
          }
          
          data.forEach(opp => {
            const chaveUnica = `${opp.user_id}-${opp.id}`;
            if (oportunidadesProcessadas.has(chaveUnica)) return;
            
            // Como já filtramos por data na query, todas as oportunidades aqui já são da data correta
            allOpportunities.push({
              ...opp,
              dataVenda: opp.gain_date ? new Date(opp.gain_date) : (opp[campoCadastro] ? new Date(opp[campoCadastro]) : new Date(opp.create_date)),
              funil_id: parseInt(funilId)
            });
            oportunidadesProcessadas.add(chaveUnica);
          });
        } catch (error) {
          console.warn(`⚠️ [getVendasVendedoresPorRonda] Erro ao buscar funil ${funilId}:`, error);
        }
      }
    }

    const vendasPorVendedorPorRonda = {};
    const rondasHorarios = {
      '10h': { start: 0, end: 10 * 60 },
      '12h': { start: 10 * 60 + 1, end: 12 * 60 },
      '14h': { start: 12 * 60 + 1, end: 14 * 60 },
      '16h': { start: 14 * 60 + 1, end: 16 * 60 },
      '18h': { start: 16 * 60 + 1, end: 18 * 60 },
    };

    allOpportunities.forEach(opp => {
      if (opp.user_id !== null && opp.user_id !== undefined && opp.dataVenda) {
        const localTime = new Date(opp.dataVenda.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const minutesOfDay = localTime.getHours() * 60 + localTime.getMinutes();
        const valor = parseFloat(opp.value) || 0;

        if (!vendasPorVendedorPorRonda[opp.user_id]) {
          vendasPorVendedorPorRonda[opp.user_id] = {
            '10h': { contagem: 0, valorTotal: 0 },
            '12h': { contagem: 0, valorTotal: 0 },
            '14h': { contagem: 0, valorTotal: 0 },
            '16h': { contagem: 0, valorTotal: 0 },
            '18h': { contagem: 0, valorTotal: 0 }
          };
        }

        for (const ronda in rondasHorarios) {
          const { start, end } = rondasHorarios[ronda];
          if (minutesOfDay >= start && minutesOfDay <= end) {
            vendasPorVendedorPorRonda[opp.user_id][ronda].contagem++;
            vendasPorVendedorPorRonda[opp.user_id][ronda].valorTotal += valor;
            break;
          }
        }
      }
    });

    console.log(`✅ [getVendasVendedoresPorRonda] Vendas por ronda encontradas:`, vendasPorVendedorPorRonda);
    return vendasPorVendedorPorRonda;
  } catch (error) {
    console.error('❌ [getVendasVendedoresPorRonda] Erro:', error);
    return {};
  }
};

export const getFunilEtapas = async (idFunilSprint) => {
  try {
    console.log('🔍 Buscando etapas do funil ID:', idFunilSprint)
    
    const response = await fetch(`${supabaseUrl}/rest/v1/funil_etapas?select=*&id_funil_sprint=eq.${idFunilSprint}&order=ordem_etapa.asc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro HTTP:', response.status, errorText)
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
    }
    
    const etapas = await response.json()
    console.log(`✅ Etapas encontradas: ${etapas.length}`, etapas)
    return etapas

  } catch (error) {
    console.error('❌ Erro ao buscar etapas do funil:', error)
    throw error
  }
}

// Função para buscar dados de oportunidades por etapa do funil
export const getOportunidadesPorEtapaFunil = async (etapas, startDate = null, endDate = null, selectedFunnel = null, selectedSeller = null) => {
  try {
    console.log('📊 Buscando dados do funil para etapas:', etapas.length);
    console.log('📅 Período selecionado:', { startDate, endDate });
    console.log('🎯 Filtros:', { selectedFunnel, selectedSeller });
    
    if (!etapas || etapas.length === 0) {
      console.log('⚠️ Nenhuma etapa fornecida');
      return { etapas: [], conversaoGeral: { totalCriadas: 0, totalFechadas: 0, taxaConversao: 0, valorTotal: 0, ticketMedio: 0 } };
    }
    
    // 🎯 BUSCAR OPORTUNIDADES CRIADAS NO PERÍODO SELECIONADO PRIMEIRO PARA TER AS DATAS
    let dataInicio, dataFim;
    if (startDate && endDate) {
      dataInicio = getStartOfDaySP(startDate);
      dataFim = getEndOfDaySP(endDate);
    } else {
      const hoje = getTodayDateSP();
      dataInicio = getStartOfDaySP(hoje);
      dataFim = getEndOfDaySP(hoje);
    }
    
    // Construir filtro de funil se fornecido (APLICAR EM TODAS AS QUERIES)
    const funilFilter = selectedFunnel ? `&funil_id=eq.${selectedFunnel}` : '';
    
    // Construir lista de etapas para o filtro - SINTAXE CORRETA SUPABASE
    const etapaIds = etapas.map(e => e.id_etapa_sprint);
    const etapaFilter = etapaIds.map(id => `crm_column.eq.${id}`).join(',');
    
    // Construir filtro de vendedor se fornecido
    const sellerFilter = selectedSeller && selectedSeller !== 'all' ? `&user_id=eq.${selectedSeller}` : '';
    
    // BUSCAR APENAS OPORTUNIDADES ABERTAS (STATUS=OPEN) - COM PAGINAÇÃO E FILTROS CORRETOS
    const openUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,crm_column,value,user_id&archived=eq.0&status=eq.open&or=(${etapaFilter})${funilFilter}${sellerFilter}`;
    console.log('🔍 URL oportunidades abertas:', openUrl);

    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
      'Accept-Profile': supabaseSchema,
      'Content-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    const oportunidadesAbertas = await fetchAllRecords(openUrl, baseHeaders);
    console.log(`✅ Oportunidades abertas encontradas (paginação): ${oportunidadesAbertas.length}`);

    // 1. TOTAL GERAL (para primeira etapa - ENTRADA) - COM PAGINAÇÃO
    const criadasPeriodoTotalUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}`;
    
    const totalData = await fetchAllRecords(criadasPeriodoTotalUrl, baseHeaders);
    const criadasPeriodoTotal = totalData.length;
    console.log(`✅ TOTAL oportunidades criadas no período (paginação): ${criadasPeriodoTotal}`);

    // 2. BUSCAR OPORTUNIDADES FECHADAS (WON) NO PERÍODO - COM PAGINAÇÃO
    const fechadasHojeUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.won&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}`;
    
    const fechadasHoje = await fetchAllRecords(fechadasHojeUrl, baseHeaders);
    console.log(`✅ Oportunidades fechadas (paginação): ${fechadasHoje.length}`);
    
    const valorTotalFechadas = fechadasHoje.reduce((acc, opp) => {
      const valor = parseFloat(opp.value) || 0;
      return acc + valor;
    }, 0);

    // 3. PROCESSAR DADOS POR ETAPA
    const resultado = [];
    
    for (const etapa of etapas) {
      const abertosEtapa = oportunidadesAbertas.filter(o => o.crm_column === etapa.id_etapa_sprint);
      
      const valorEmAberto = abertosEtapa.reduce((acc, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return acc + valor;
      }, 0);

      let criadasPeriodoEtapa = 0;
      if (etapa.ordem_etapa === 0 || etapa.nome_etapa.toLowerCase().includes('entrada')) {
        criadasPeriodoEtapa = criadasPeriodoTotal;
      }

      resultado.push({
        ...etapa,
        abertos: abertosEtapa.length,
        valorEmAberto: valorEmAberto,
        criadasPeriodo: criadasPeriodoEtapa,
        passaramPorEtapa: 0,
        taxaPassagem: null
      });
    }

    // 4. CALCULAR QUANTOS PASSARAM POR CADA ETAPA
    for (let i = 0; i < resultado.length; i++) {
      if (i === 0) {
        resultado[i].passaramPorEtapa = resultado[i].criadasPeriodo;
      } else {
        const etapaAnterior = resultado[i - 1];
        const passaramAnterior = etapaAnterior.passaramPorEtapa || 0;
        const ficouNaAnterior = etapaAnterior.abertos || 0;
        
        resultado[i].passaramPorEtapa = Math.max(0, passaramAnterior - ficouNaAnterior);
      }
    }

    // 5. CALCULAR TAXAS DE PASSAGEM
    for (let i = 0; i < resultado.length; i++) {
      if (i < resultado.length - 1) {
        const etapaAtual = resultado[i];
        const proximaEtapa = resultado[i + 1];
        
        const passaramAtual = etapaAtual.passaramPorEtapa || 0;
        const passaramProxima = proximaEtapa.passaramPorEtapa || 0;
        
        if (passaramAtual > 0) {
          const taxa = (passaramProxima / passaramAtual) * 100;
          proximaEtapa.taxaPassagem = Math.round(taxa * 10) / 10;
        } else {
          proximaEtapa.taxaPassagem = 0;
        }
      }
    }

    // 6. BUSCAR DADOS DE SOURCES (ORIGENS DAS OPORTUNIDADES)
    console.log('🔍 Buscando dados de sources...');
    
    // Buscar oportunidades abertas com origem para calcular sources - COM PAGINAÇÃO
    const sourcesUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=origem_oportunidade,utm_source&archived=eq.0&status=eq.open${funilFilter}${sellerFilter}`;
    
    const sourcesOpps = await fetchAllRecords(sourcesUrl, baseHeaders);
    console.log(`✅ Oportunidades para sources (paginação): ${sourcesOpps.length}`);

    let sourcesData = {
      google: { abertas: 0, criadas: 0 },
      meta: { abertas: 0, criadas: 0 },
      organico: { abertas: 0, criadas: 0 },
      whatsapp: { abertas: 0, criadas: 0 },
      prescritor: { abertas: 0, criadas: 0 },
      franquia: { abertas: 0, criadas: 0 },
      total: criadasPeriodoTotal
    };

    // Contar por origem
    sourcesOpps.forEach(opp => {
      const origem = opp.origem_oportunidade || opp.utm_source || 'whatsapp';
      const origemLower = origem.toLowerCase();
      
      if (origemLower.includes('google') || origemLower.includes('ads')) {
        sourcesData.google.abertas++;
      } else if (origemLower.includes('meta') || origemLower.includes('facebook') || origemLower.includes('instagram')) {
        sourcesData.meta.abertas++;
      } else if (origemLower.includes('organico') || origemLower.includes('orgânico') || origemLower.includes('organic')) {
        sourcesData.organico.abertas++;
      } else if (origemLower.includes('whatsapp') || origemLower.includes('zap')) {
        sourcesData.whatsapp.abertas++;
      } else if (origemLower.includes('prescritor') || origemLower.includes('prescrição')) {
        sourcesData.prescritor.abertas++;
      } else if (origemLower.includes('franquia') || origemLower.includes('franchise')) {
        sourcesData.franquia.abertas++;
      } else {
        // Default para WhatsApp se não identificar
        sourcesData.whatsapp.abertas++;
      }
    });
    
    // Buscar oportunidades criadas no período por origem - COM PAGINAÇÃO
    const sourcesCriadasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=origem_oportunidade,utm_source&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}`;
    
    const sourcesCriadasOpps = await fetchAllRecords(sourcesCriadasUrl, baseHeaders);
    console.log(`✅ Oportunidades criadas para sources (paginação): ${sourcesCriadasOpps.length}`);
    
    sourcesCriadasOpps.forEach(opp => {
      const origem = opp.origem_oportunidade || opp.utm_source || 'whatsapp';
      const origemLower = origem.toLowerCase();
      
      if (origemLower.includes('google') || origemLower.includes('ads')) {
        sourcesData.google.criadas++;
      } else if (origemLower.includes('meta') || origemLower.includes('facebook') || origemLower.includes('instagram')) {
        sourcesData.meta.criadas++;
      } else if (origemLower.includes('organico') || origemLower.includes('orgânico') || origemLower.includes('organic')) {
        sourcesData.organico.criadas++;
      } else if (origemLower.includes('whatsapp') || origemLower.includes('zap')) {
        sourcesData.whatsapp.criadas++;
      } else if (origemLower.includes('prescritor') || origemLower.includes('prescrição')) {
        sourcesData.prescritor.criadas++;
      } else if (origemLower.includes('franquia') || origemLower.includes('franchise')) {
        sourcesData.franquia.criadas++;
      } else {
        sourcesData.whatsapp.criadas++;
      }
    });
    
    console.log('📊 Sources data calculado (paginação):', sourcesData);

    const resultadoCompleto = {
      etapas: resultado,
      conversaoGeral: {
        totalCriadas: criadasPeriodoTotal,
        totalFechadas: fechadasHoje.length,
        taxaConversao: criadasPeriodoTotal > 0 ? (fechadasHoje.length / criadasPeriodoTotal) * 100 : 0,
        valorTotal: valorTotalFechadas,
        ticketMedio: fechadasHoje.length > 0 ? valorTotalFechadas / fechadasHoje.length : 0
      },
      sourcesData: sourcesData
    };

    return resultadoCompleto;

  } catch (error) {
    console.error('❌ Erro ao buscar dados do funil:', error);
    throw error;
  }
}

// Re-exports para compatibilidade (funções movidas para FilterBarService.js)
export { getUnidades, getFunisPorUnidade, getVendedores, getOrigens } from './FilterBarService.js'

// ============================================================================
// FUNÇÕES PARA CONFIGURAÇÃO DE DIAS ÚTEIS
// ============================================================================

/**
 * Buscar configuração de dias úteis para um mês/ano específico
 */
export const getDiasUteis = async (ano, mes) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_dias_uteis?ano=eq.${ano}&mes=eq.${mes}&select=*`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [getDiasUteis] Erro ao buscar dias úteis:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('❌ [getDiasUteis] Erro:', error);
    throw error;
  }
};

/**
 * Buscar todas as configurações de dias úteis
 */
export const getAllDiasUteis = async () => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_dias_uteis?select=*&order=ano.desc,mes.desc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [getAllDiasUteis] Erro ao buscar dias úteis:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('❌ [getAllDiasUteis] Erro:', error);
    throw error;
  }
};

/**
 * Criar ou atualizar configuração de dias úteis
 */
export const upsertDiasUteis = async (ano, mes, diasUteisTotal, diasUteisRestantes = null) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    // Se diasUteisRestantes não foi fornecido, calcular automaticamente
    let diasRestantes = diasUteisRestantes;
    if (diasRestantes === null) {
      const hoje = new Date();
      const hojeBrasil = new Date(hoje.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const anoAtual = hojeBrasil.getFullYear();
      const mesAtual = hojeBrasil.getMonth() + 1;
      
      // Se for o mês atual, calcular dias restantes
      if (ano === anoAtual && mes === mesAtual) {
        // Contar dias úteis restantes do mês (excluindo fins de semana)
        const ultimoDia = new Date(ano, mes, 0).getDate();
        let diasUteisRestantesCont = 0;
        for (let dia = hojeBrasil.getDate(); dia <= ultimoDia; dia++) {
          const data = new Date(ano, mes - 1, dia);
          const diaSemana = data.getDay();
          if (diaSemana !== 0 && diaSemana !== 6) { // Não é domingo (0) nem sábado (6)
            diasUteisRestantesCont++;
          }
        }
        diasRestantes = diasUteisRestantesCont;
      } else {
        diasRestantes = null; // Não calcular para meses futuros/passados
      }
    }
    
    const payload = {
      ano,
      mes,
      dias_uteis_total: diasUteisTotal,
      dias_uteis_restantes: diasRestantes,
      updated_at: new Date().toISOString()
    };
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_dias_uteis`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [upsertDiasUteis] Erro ao salvar dias úteis:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [upsertDiasUteis] Erro:', error);
    throw error;
  }
};

/**
 * Atualizar dias úteis restantes (permite edição manual)
 */
export const updateDiasUteisRestantes = async (id, diasUteisRestantes) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_dias_uteis?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        dias_uteis_restantes: diasUteisRestantes,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [updateDiasUteisRestantes] Erro ao atualizar dias úteis restantes:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [updateDiasUteisRestantes] Erro:', error);
    throw error;
  }
};

/**
 * Deletar configuração de dias úteis
 */
export const deleteDiasUteis = async (id) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_dias_uteis?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [deleteDiasUteis] Erro ao deletar dias úteis:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('❌ [deleteDiasUteis] Erro:', error);
    throw error;
  }
};

// ============================================================================
// FUNÇÕES PARA FATURAMENTO GERAL E COMPARATIVO MENSAL
// ============================================================================

/**
 * Buscar faturamento mensal por funil e vendedor
 * @param {number} ano - Ano (ex: 2025)
 * @param {number} mes - Mês (1-12)
 * @param {number|null} funilId - ID do funil (null = todos)
 * @param {number|null} vendedorId - ID do vendedor (null = todos)
 * @returns {Object} { porFunil: {...}, porVendedor: {...}, total: { contagem, valorTotal } }
 */
export const getFaturamentoMensal = async (ano, mes, funilId = null, vendedorId = null) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    // Calcular intervalo do mês
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59, 999);
    const inicioISO = dataInicio.toISOString();
    const fimISO = dataFim.toISOString();
    
    // Construir filtros
    let funilFilter = '';
    if (funilId !== null) {
      funilFilter = `&funil_id=eq.${funilId}`;
    } else {
      // Se não houver funil específico, usar funis comerciais de Apucarana
      const { FUNIS_COMERCIAIS_APUCARANA } = await import('./cockpitConstants');
      funilFilter = `&funil_id=in.(${FUNIS_COMERCIAIS_APUCARANA.join(',')})`;
    }
    
    let vendedorFilter = '';
    if (vendedorId !== null) {
      vendedorFilter = `&user_id=eq.${vendedorId}`;
    }
    
    // Buscar vendas do mês: apenas unidade Apucarana e status='gain'
    // Usar gain_date para filtrar pelo mês
    const unidadeFilter = `&unidade_id=eq.%5B1%5D`; // [1] codificado para URL
    const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,user_id,funil_id,value,gain_date&status=eq.gain&unidade_id=eq.%5B1%5D&gain_date=gte.${inicioISO}&gain_date=lte.${fimISO}${funilFilter}${vendedorFilter}`;
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });
    
    let todasVendas = [];
    if (res.ok) {
      todasVendas = await res.json();
    }
    
    // Agrupar por funil e vendedor
    const porFunil = {};
    const porVendedor = {};
    let totalContagem = 0;
    let totalValor = 0;
    
    todasVendas.forEach(venda => {
      const valor = parseFloat(venda.value) || 0;
      const funil = venda.funil_id || 'desconhecido';
      const vendedor = venda.user_id || 'desconhecido';
      
      // Por funil
      if (!porFunil[funil]) {
        porFunil[funil] = { contagem: 0, valorTotal: 0 };
      }
      porFunil[funil].contagem++;
      porFunil[funil].valorTotal += valor;
      
      // Por vendedor
      if (!porVendedor[vendedor]) {
        porVendedor[vendedor] = { contagem: 0, valorTotal: 0 };
      }
      porVendedor[vendedor].contagem++;
      porVendedor[vendedor].valorTotal += valor;
      
      // Total
      totalContagem++;
      totalValor += valor;
    });
    
    return {
      porFunil,
      porVendedor,
      total: {
        contagem: totalContagem,
        valorTotal: totalValor
      }
    };
  } catch (error) {
    console.error('❌ [getFaturamentoMensal] Erro:', error);
    throw error;
  }
};

// ============================================================================
// FUNÇÕES PARA METAS MENSais DE FATURAMENTO
// ============================================================================

/**
 * Buscar meta mensal de faturamento
 */
export const getMetaFaturamentoMensal = async (ano, mes) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_faturamento_mensal?ano=eq.${ano}&mes=eq.${mes}&select=*`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [getMetaFaturamentoMensal] Erro ao buscar meta:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('❌ [getMetaFaturamentoMensal] Erro:', error);
    throw error;
  }
};

/**
 * Buscar todas as metas mensais de faturamento
 */
export const getAllMetasFaturamentoMensal = async () => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_faturamento_mensal?select=*&order=ano.desc,mes.desc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [getAllMetasFaturamentoMensal] Erro ao buscar metas:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('❌ [getAllMetasFaturamentoMensal] Erro:', error);
    throw error;
  }
};

/**
 * Criar ou atualizar meta mensal de faturamento
 */
export const upsertMetaFaturamentoMensal = async (ano, mes, valorMeta) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const payload = {
      ano,
      mes,
      valor_meta: valorMeta,
      updated_at: new Date().toISOString()
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_faturamento_mensal?ano=eq.${ano}&mes=eq.${mes}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=representation,resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // Se não encontrou, criar novo
      const createResponse = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_faturamento_mensal`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Accept-Profile': 'api',
          'Content-Profile': 'api',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('❌ [upsertMetaFaturamentoMensal] Erro ao criar meta:', createResponse.status, errorText);
        throw new Error(`Erro ${createResponse.status}: ${errorText}`);
      }

      const createData = await createResponse.json();
      return Array.isArray(createData) ? createData[0] : createData;
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ [upsertMetaFaturamentoMensal] Erro:', error);
    throw error;
  }
};

/**
 * Deletar meta mensal de faturamento
 */
export const deleteMetaFaturamentoMensal = async (id) => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/cockpit_metas_faturamento_mensal?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [deleteMetaFaturamentoMensal] Erro ao deletar meta:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('❌ [deleteMetaFaturamentoMensal] Erro:', error);
    throw error;
  }
};