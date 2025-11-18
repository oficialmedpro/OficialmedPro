const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function checkColumnExists() {
    console.log('🔍 VERIFICANDO SE A COLUNA id_sprinthub EXISTE...\n');
    
    try {
        // Tentar buscar informações da tabela leads
        const { data, error } = await supabase
            .from('leads')
            .select('id, id_sprinthub')
            .limit(1);
        
        if (error) {
            console.error('❌ Erro ao acessar a coluna id_sprinthub:', error.message);
            
            if (error.message.includes('Could not find the \'id_sprinthub\' column')) {
                console.log('\n🔧 A coluna id_sprinthub NÃO EXISTE ainda!');
                console.log('💡 Você precisa criar a coluna primeiro.');
                console.log('📝 SQL necessário:');
                console.log('   ALTER TABLE api.leads ADD COLUMN id_sprinthub BIGINT;');
            }
        } else {
            console.log('✅ Coluna id_sprinthub existe e está acessível!');
            console.log('📊 Dados encontrados:', data);
        }
        
        // Tentar verificar o schema da tabela
        console.log('\n🔍 Verificando schema da tabela leads...');
        const { data: schemaData, error: schemaError } = await supabase
            .rpc('exec_sql', {
                sql: `
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = 'api' 
                    AND table_name = 'leads' 
                    AND column_name = 'id_sprinthub';
                `
            });
        
        if (schemaError) {
            console.log('⚠️  Não foi possível verificar o schema via RPC:', schemaError.message);
        } else {
            console.log('📋 Schema da coluna id_sprinthub:', schemaData);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

checkColumnExists();

