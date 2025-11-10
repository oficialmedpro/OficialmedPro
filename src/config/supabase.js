/**
 * 🔧 CONFIGURAÇÃO DO SUPABASE
 *
 * Este arquivo centraliza a configuração do Supabase
 * com fallbacks para produção
 */

// Fallback para produção se as variáveis não estiverem disponíveis
const getSupabaseConfig = () => {
  // Verificar se está no browser antes de acessar window
  const isBrowser = typeof window !== 'undefined';
  
  // Função helper para validar valor de variável
  const getValidValue = (value) => {
    if (!value || 
        value === 'undefined' || 
        value === 'null' || 
        value === '' || 
        typeof value !== 'string' ||
        value.trim() === '') {
      return null;
    }
    const trimmed = value.trim();
    // Verificar se não é uma string que representa undefined/null
    if (trimmed === 'undefined' || trimmed === 'null') {
      return null;
    }
    return trimmed;
  };
  
  // Disponibilizar import.meta.env de forma segura (em Node pode ser undefined)
  const importMetaEnv = typeof import.meta !== 'undefined' && import.meta?.env ? import.meta.env : {};

  // Priorizar window.ENV (injetado pelo docker-entrypoint.sh) sobre import.meta.env
  // Validar valores antes de usar
  let supabaseUrl = null;
  
  // Tentar ler de window.ENV primeiro (se estiver disponível)
  if (isBrowser) {
    try {
      // Aguardar um pouco se window.ENV ainda não estiver disponível (pode ser injetado assincronamente)
      if (window.ENV && window.ENV.VITE_SUPABASE_URL) {
        const urlValue = getValidValue(window.ENV.VITE_SUPABASE_URL);
        if (urlValue && urlValue.startsWith('http')) {
          supabaseUrl = urlValue;
        }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao ler window.ENV.VITE_SUPABASE_URL:', e);
    }
  }
  
  // Se não conseguiu de window.ENV, tentar import.meta.env
  if (!supabaseUrl && importMetaEnv.VITE_SUPABASE_URL) {
    const urlValue = getValidValue(importMetaEnv.VITE_SUPABASE_URL);
    if (urlValue && urlValue.startsWith('http')) {
      supabaseUrl = urlValue;
    }
  }
  
  // Fallback se não encontrou
  if (!supabaseUrl) {
    supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
  }

  let supabaseAnonKey = null;

  // Tentar ler de window.ENV primeiro
  if (isBrowser) {
    try {
      if (window.ENV && window.ENV.VITE_SUPABASE_ANON_KEY) {
        const anonValue = getValidValue(window.ENV.VITE_SUPABASE_ANON_KEY);
        if (anonValue) {
          supabaseAnonKey = anonValue;
        }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao ler window.ENV.VITE_SUPABASE_ANON_KEY:', e);
    }
  }

  // Se não conseguiu de window.ENV, tentar import.meta.env
  if (!supabaseAnonKey && importMetaEnv.VITE_SUPABASE_ANON_KEY) {
    const anonValue = getValidValue(importMetaEnv.VITE_SUPABASE_ANON_KEY);
    if (anonValue) {
      supabaseAnonKey = anonValue;
    }
  }

  // Logar aviso se não encontrou chave pública
  if (!supabaseAnonKey) {
    console.warn('⚠️ VITE_SUPABASE_ANON_KEY não encontrada. Configure a chave pública do Supabase.');
  }

  let supabaseSchema = null;
  
  // Tentar ler de window.ENV primeiro
  if (isBrowser) {
    try {
      if (window.ENV && window.ENV.VITE_SUPABASE_SCHEMA) {
        const schemaValue = getValidValue(window.ENV.VITE_SUPABASE_SCHEMA);
        if (schemaValue) {
          supabaseSchema = schemaValue;
        }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao ler window.ENV.VITE_SUPABASE_SCHEMA:', e);
    }
  }
  
  // Se não conseguiu de window.ENV, tentar import.meta.env
  if (!supabaseSchema && importMetaEnv.VITE_SUPABASE_SCHEMA) {
    const schemaValue = getValidValue(importMetaEnv.VITE_SUPABASE_SCHEMA);
    if (schemaValue) {
      supabaseSchema = schemaValue;
    }
  }
  
  // Fallback se não encontrou
  if (!supabaseSchema) {
    supabaseSchema = 'api';
  }

  // Validação adicional para garantir que a URL seja válida
  // Garantir que supabaseUrl é string válida
  if (!supabaseUrl || typeof supabaseUrl !== 'string' || !supabaseUrl.startsWith('http')) {
    console.warn('⚠️ VITE_SUPABASE_URL não encontrada ou inválida, usando fallback');
    console.warn('⚠️ URL recebida:', supabaseUrl);
    supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
  }
  
  // Validar URL antes de usar
  try {
    const testUrl = new URL(supabaseUrl);
    if (!testUrl.hostname || !testUrl.protocol) {
      throw new Error('URL sem hostname ou protocolo');
    }
  } catch (e) {
    console.error('❌ VITE_SUPABASE_URL inválida, usando fallback:', e.message);
    console.error('❌ URL recebida:', supabaseUrl);
    supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
  }

  // Garantir que anon key é válida
  if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string' || supabaseAnonKey.trim() === '') {
    console.warn('⚠️ VITE_SUPABASE_ANON_KEY não encontrada ou inválida. É necessário informar a chave pública.');
    supabaseAnonKey = null;
  }
  
  // Garantir que schema é válido
  if (!supabaseSchema || typeof supabaseSchema !== 'string') {
    supabaseSchema = 'api';
  }

  // Log de debug para entender o que está acontecendo
  console.log('🔧 Configuração Supabase:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    schema: supabaseSchema,
    environment: importMetaEnv.MODE,
    urlStart: supabaseUrl?.substring(0, 30) + '...',
    anonKeyStart: supabaseAnonKey?.substring(0, 20) + '...',
    source: {
      fromWindowEnv: !!(isBrowser && window.ENV?.VITE_SUPABASE_URL),
      fromImportMeta: !!importMetaEnv.VITE_SUPABASE_URL,
      usingFallback: !(isBrowser && window.ENV?.VITE_SUPABASE_URL) && !importMetaEnv.VITE_SUPABASE_URL
    }
  });

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseSchema
  };
};

// Exportar a função para permitir revalidação quando window.ENV estiver disponível
export { getSupabaseConfig };

// Exportar valores iniciais (para compatibilidade)
export const { supabaseUrl, supabaseAnonKey, supabaseSchema } = getSupabaseConfig();

// ✅ Garantir que as variáveis fiquem disponíveis globalmente (browser e SSR)
if (typeof globalThis !== 'undefined') {
  globalThis.supabaseUrl = supabaseUrl;
  globalThis.supabaseAnonKey = supabaseAnonKey;
  globalThis.supabaseSchema = supabaseSchema;
  globalThis.SUPABASE_URL = supabaseUrl;
  globalThis.SUPABASE_ANON_KEY = supabaseAnonKey;
}

export default {
  supabaseUrl,
  supabaseAnonKey,
  supabaseSchema
};