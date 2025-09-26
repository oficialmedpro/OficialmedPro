/**
 * 🔧 CONFIGURAÇÃO DO SUPABASE
 *
 * Este arquivo centraliza a configuração do Supabase
 * com fallbacks para produção
 */

// Fallback para produção se as variáveis não estiverem disponíveis
const getSupabaseConfig = () => {
  // Tentar diferentes formas de obter as variáveis
  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL ||
                    window.ENV?.VITE_SUPABASE_URL ||
                    'https://agdffspstbxeqhqtltvb.supabase.co';

  let supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
                          window.ENV?.VITE_SUPABASE_SERVICE_ROLE_KEY ||
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzUyNTUzNSwiZXhwIjoyMDMzMTAxNTM1fQ.gxoHQn-5MwRqgMgXoFOyGCcFrCH7GzHE4ZQXQPNIRV4';

  let supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA ||
                       window.ENV?.VITE_SUPABASE_SCHEMA ||
                       'api';

  // Log de debug para entender o que está acontecendo
  console.log('🔧 Configuração Supabase:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey,
    schema: supabaseSchema,
    environment: import.meta.env.MODE,
    urlStart: supabaseUrl?.substring(0, 30) + '...',
    keyStart: supabaseServiceKey?.substring(0, 20) + '...'
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