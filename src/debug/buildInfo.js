/**
 * 🔧 DEBUG - Informações do Build
 *
 * Este arquivo ajuda a debugar problemas de variáveis de ambiente
 */

export const buildInfo = {
  // Informações básicas
  buildTime: new Date().toISOString(),
  mode: import.meta.env.MODE,

  // Status das variáveis do Supabase
  hasSupabaseUrl: !!(import.meta.env.VITE_SUPABASE_URL),
  hasSupabaseKey: !!(import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY),
  hasSupabaseSchema: !!(import.meta.env.VITE_SUPABASE_SCHEMA),

  // URLs parciais (para debug sem expor dados completos)
  supabaseUrlStart: import.meta.env.VITE_SUPABASE_URL?.substring(0, 20) || 'NOT_FOUND',
  supabaseKeyStart: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) || 'NOT_FOUND',
  supabaseSchema: import.meta.env.VITE_SUPABASE_SCHEMA || 'NOT_FOUND',

  // Todas as variáveis ENV disponíveis (chaves apenas, sem valores)
  allEnvKeys: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
};

// Log automático para facilitar debug
console.log('🔧 Build Info:', buildInfo);

export default buildInfo;