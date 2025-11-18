const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY, 
  { db: { schema: 'api' } }
);

async function checkExportedTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela leads_exportados_sprinthub...\n');
    
    // Buscar uma amostra para ver a estrutura
    const { data: sampleData, error: sampleError } = await supabase
      .from('leads_exportados_sprinthub')
      .select('*')
      .limit(5);
    
    if (sampleError) {
      console.error('❌ Erro ao buscar dados:', sampleError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${sampleData.length} registros na tabela`);
    
    if (sampleData.length > 0) {
      console.log('\n🔍 ESTRUTURA DA TABELA:');
      const firstRecord = sampleData[0];
      Object.keys(firstRecord).forEach(key => {
        console.log(`  - ${key}: "${firstRecord[key]}" (tipo: ${typeof firstRecord[key]})`);
      });
      
      console.log('\n📋 CAMPOS DISPONÍVEIS:');
      Object.keys(firstRecord).forEach(key => {
        console.log(`  - ${key}`);
      });
    }
    
    // Contar total
    const { count: totalCount, error: countError } = await supabase
      .from('leads_exportados_sprinthub')
      .select('*', { count: 'exact' });
    
    if (!countError) {
      console.log(`\n📊 Total de registros: ${totalCount}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkExportedTableStructure();

