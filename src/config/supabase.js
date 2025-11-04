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
  if (!supabaseUrl && import.meta.env.VITE_SUPABASE_URL) {
    const urlValue = getValidValue(import.meta.env.VITE_SUPABASE_URL);
    if (urlValue && urlValue.startsWith('http')) {
      supabaseUrl = urlValue;
    }
  }
  
  // Fallback se não encontrou
  if (!supabaseUrl) {
    supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
  }

  let supabaseServiceKey = null;
  
  // Tentar ler de window.ENV primeiro
  if (isBrowser) {
    try {
      if (window.ENV && window.ENV.VITE_SUPABASE_SERVICE_ROLE_KEY) {
        const keyValue = getValidValue(window.ENV.VITE_SUPABASE_SERVICE_ROLE_KEY);
        if (keyValue && keyValue.length > 50) {
          supabaseServiceKey = keyValue;
        }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao ler window.ENV.VITE_SUPABASE_SERVICE_ROLE_KEY:', e);
    }
  }
  
  // Se não conseguiu de window.ENV, tentar import.meta.env
  if (!supabaseServiceKey && import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    const keyValue = getValidValue(import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
    if (keyValue && keyValue.length > 50) {
      supabaseServiceKey = keyValue;
    }
  }
  
  // Fallback se não encontrou
  if (!supabaseServiceKey) {
    supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA';
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
  if (!supabaseSchema && import.meta.env.VITE_SUPABASE_SCHEMA) {
    const schemaValue = getValidValue(import.meta.env.VITE_SUPABASE_SCHEMA);
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

  // Garantir que service key é válida
  if (!supabaseServiceKey || typeof supabaseServiceKey !== 'string' || supabaseServiceKey.length < 50) {
    console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY não encontrada ou inválida, usando fallback');
    supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA';
  }
  
  // Garantir que schema é válido
  if (!supabaseSchema || typeof supabaseSchema !== 'string') {
    supabaseSchema = 'api';
  }

  // Log de debug para entender o que está acontecendo
  console.log('🔧 Configuração Supabase:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey,
    schema: supabaseSchema,
    environment: import.meta.env.MODE,
    urlStart: supabaseUrl?.substring(0, 30) + '...',
    keyStart: supabaseServiceKey?.substring(0, 20) + '...',
    source: {
      fromWindowEnv: !!(isBrowser && window.ENV?.VITE_SUPABASE_URL),
      fromImportMeta: !!import.meta.env.VITE_SUPABASE_URL,
      usingFallback: !(isBrowser && window.ENV?.VITE_SUPABASE_URL) && !import.meta.env.VITE_SUPABASE_URL
    }
  });

  return {
    supabaseUrl,
    supabaseServiceKey,
    supabaseSchema
  };
};

// Exportar a função para permitir revalidação quando window.ENV estiver disponível
export { getSupabaseConfig };

// Exportar valores iniciais (para compatibilidade)
export const { supabaseUrl, supabaseServiceKey, supabaseSchema } = getSupabaseConfig();

export default {
  supabaseUrl,
  supabaseServiceKey,
  supabaseSchema
};