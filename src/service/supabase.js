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

// 🎯 FUNÇÃO PARA BUSCAR ETAPAS DINÂMICAS DO FUNIL
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