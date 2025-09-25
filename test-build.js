// Teste simples para verificar se as variáveis chegam no build
console.log('🔍 Teste de Variáveis de Ambiente:');
console.log('MODE:', import.meta.env.MODE);
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
console.log('VITE_SUPABASE_SERVICE_ROLE_KEY:', import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
console.log('VITE_SUPABASE_SCHEMA:', import.meta.env.VITE_SUPABASE_SCHEMA ? 'ENCONTRADA' : 'NÃO ENCONTRADA');

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL não encontrada - usando fallback');
} else {
  console.log('✅ Todas as variáveis Supabase encontradas');
}