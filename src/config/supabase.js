/**
 * 🔧 CONFIGURAÇÃO DO SUPABASE
 *
 * Este arquivo centraliza a configuração do Supabase
 * com fallbacks para produção
 */

// Fallback para produção se as variáveis não estiverem disponíveis
const getSupabaseConfig = () => {
  // Priorizar window.ENV (injetado pelo docker-entrypoint.sh) sobre import.meta.env
  let supabaseUrl = window.ENV?.VITE_SUPABASE_URL ||
                    import.meta.env.VITE_SUPABASE_URL ||
                    process.env.VITE_SUPABASE_URL ||
                    'https://agdffspstbxeqhqtltvb.supabase.co';

  let supabaseServiceKey = window.ENV?.VITE_SUPABASE_SERVICE_ROLE_KEY ||
                          import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
                          process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzUyNTUzNSwiZXhwIjoyMDMzMTAxNTM1fQ.gxoHQn-5MwRqgMgXoFOyGCcFrCH7GzHE4ZQXQPNIRV4';

  let supabaseSchema = window.ENV?.VITE_SUPABASE_SCHEMA ||
                       import.meta.env.VITE_SUPABASE_SCHEMA ||
                       process.env.VITE_SUPABASE_SCHEMA ||
                       'api';

  // Validação adicional para garantir que a URL seja válida
  if (!supabaseUrl || supabaseUrl === 'undefined' || supabaseUrl === 'null' || !supabaseUrl.startsWith('http')) {
    console.warn('⚠️ VITE_SUPABASE_URL não encontrada ou inválida, usando fallback');
    console.warn('⚠️ URL recebida:', supabaseUrl);
    supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
  }

  if (!supabaseServiceKey || supabaseServiceKey === 'undefined' || supabaseServiceKey === 'null') {
    console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY não encontrada, usando fallback');
    supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzUyNTUzNSwiZXhwIjoyMDMzMTAxNTM1fQ.gxoHQn-5MwRqgMgXoFOyGCcFrCH7GzHE4ZQXQPNIRV4';
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
      fromWindowEnv: !!window.ENV?.VITE_SUPABASE_URL,
      fromImportMeta: !!import.meta.env.VITE_SUPABASE_URL,
      fromProcessEnv: !!process.env.VITE_SUPABASE_URL,
      usingFallback: !window.ENV?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL && !process.env.VITE_SUPABASE_URL
    }
  });

  return {
    supabaseUrl,
    supabaseServiceKey,
    supabaseSchema
  };
};

export const { supabaseUrl, supabaseServiceKey, supabaseSchema } = getSupabaseConfig();

export default {
  supabaseUrl,
  supabaseServiceKey,
  supabaseSchema
};