import { supabaseUrl, supabaseAnonKey, supabaseSchema } from '../config/supabase.js';

/**
 * 🔧 DEBUG - Informações do Build
 *
 * Este arquivo ajuda a debugar problemas de variáveis de ambiente
 */

export const buildInfo = {
  // Informações básicas
  buildTime: new Date().toISOString(),
  mode: import.meta.env.MODE,

  // Status das variáveis do Supabase (runtime)
  hasSupabaseUrl: !!supabaseUrl,
  hasSupabaseKey: !!supabaseAnonKey,
  hasSupabaseSchema: !!supabaseSchema,

  // URLs parciais (para debug sem expor dados completos)
  supabaseUrlStart: supabaseUrl?.substring(0, 20) || 'NOT_FOUND',
  supabaseKeyStart: supabaseAnonKey?.substring(0, 10) || 'NOT_FOUND',
  supabaseSchemaValue: supabaseSchema || 'NOT_FOUND',

  // Todas as variáveis ENV disponíveis em tempo de build (referência)
  buildEnvKeys: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
};

// Log automático para facilitar debug
console.log('🔧 Build Info:', buildInfo);

export default buildInfo;