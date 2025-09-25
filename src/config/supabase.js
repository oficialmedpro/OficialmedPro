/**
 * 🔧 CONFIGURAÇÃO DO SUPABASE
 *
 * Este arquivo centraliza a configuração do Supabase
 * com fallbacks para produção
 */

// Fallback para produção se as variáveis não estiverem disponíveis
const getSupabaseConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://agdffspstbxeqhqtltvb.supabase.co';
  const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

  // Log de debug para entender o que está acontecendo
  console.log('🔧 Configuração Supabase:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey,
    schema: supabaseSchema,
    environment: import.meta.env.MODE
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