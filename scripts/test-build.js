// Teste simples para verificar se as variáveis chegam no build
console.log('🔍 Teste de Variáveis de Ambiente:');
console.log('MODE:', import.meta.env.MODE);

// Testar import.meta.env
console.log('VITE_SUPABASE_URL (import.meta.env):', import.meta.env.VITE_SUPABASE_URL ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
console.log('VITE_SUPABASE_ANON_KEY (import.meta.env):', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
console.log('VITE_SUPABASE_SCHEMA (import.meta.env):', import.meta.env.VITE_SUPABASE_SCHEMA ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
console.log('VITE_SYNC_API_URL (import.meta.env):', import.meta.env.VITE_SYNC_API_URL ? 'ENCONTRADA' : 'NÃO ENCONTRADA');

// Testar window.ENV (injetado pelo docker-entrypoint.sh)
console.log('VITE_SUPABASE_URL (window.ENV):', window.ENV?.VITE_SUPABASE_URL ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
console.log('VITE_SUPABASE_ANON_KEY (window.ENV):', window.ENV?.VITE_SUPABASE_ANON_KEY ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
console.log('VITE_SUPABASE_SCHEMA (window.ENV):', window.ENV?.VITE_SUPABASE_SCHEMA ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
console.log('VITE_SYNC_API_URL (window.ENV):', window.ENV?.VITE_SYNC_API_URL ? 'ENCONTRADA' : 'NÃO ENCONTRADA');

// Verificar se pelo menos uma fonte tem as variáveis
const hasFromImportMeta = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
const hasFromWindowEnv = !!(window.ENV?.VITE_SUPABASE_URL && window.ENV?.VITE_SUPABASE_ANON_KEY);

if (hasFromImportMeta || hasFromWindowEnv) {
  console.log('✅ Todas as variáveis Supabase encontradas');
  console.log('📊 Fonte das variáveis:', hasFromWindowEnv ? 'window.ENV (runtime)' : 'import.meta.env (build-time)');
} else {
  console.error('❌ VITE_SUPABASE_URL não encontrada em nenhuma fonte - usando fallback');
}