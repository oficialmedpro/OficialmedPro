const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'api' }
});

async function removeDuplicates() {
    console.log('🔍 Removendo duplicados na tabela leads_exportados_sprinthub...');
    
    try {
        // Primeiro, vamos ver quantos registros temos
        const { count: totalCount, error: countError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('*', { count: 'exact', head: true });
            
        if (countError) {
            console.error('❌ Erro ao contar registros:', countError.message);
            return;
        }
        
        console.log(`📊 Total de registros na tabela: ${totalCount}`);
        
        // Usar SQL direto para encontrar e remover duplicados
        const { data: duplicates, error: duplicatesError } = await supabase.rpc('remove_duplicates_sprinthub');
        
        if (duplicatesError) {
            console.log('⚠️  Função SQL não existe, criando...');
            
            // Criar função SQL para remover duplicados
            const createFunctionSQL = `
                CREATE OR REPLACE FUNCTION remove_duplicates_sprinthub()
                RETURNS INTEGER AS $$
                DECLARE
                    removed_count INTEGER := 0;
                BEGIN
                    -- Remover duplicados mantendo apenas o mais recente (maior created_at)
                    WITH duplicates AS (
                        SELECT id,
                               ROW_NUMBER() OVER (
                                   PARTITION BY COALESCE(telefone, whatsapp) 
                                   ORDER BY created_at DESC
                               ) as rn
                        FROM api.leads_exportados_sprinthub
                        WHERE telefone IS NOT NULL OR whatsapp IS NOT NULL
                    )
                    DELETE FROM api.leads_exportados_sprinthub
                    WHERE id IN (
                        SELECT id FROM duplicates WHERE rn > 1
                    );
                    
                    GET DIAGNOSTICS removed_count = ROW_COUNT;
                    RETURN removed_count;
                END;
                $$ LANGUAGE plpgsql;
            `;
            
            const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
            
            if (createError) {
                console.error('❌ Erro ao criar função:', createError.message);
                return;
            }
            
            console.log('✅ Função SQL criada com sucesso!');
            
            // Executar a função
            const { data: result, error: execError } = await supabase.rpc('remove_duplicates_sprinthub');
            
            if (execError) {
                console.error('❌ Erro ao executar função:', execError.message);
                return;
            }
            
            console.log(`✅ Função executada! Removidos ${result} duplicados`);
            
        } else {
            console.log(`✅ Removidos ${duplicates} duplicados`);
        }
        
        // Verificar total final
        const { count: finalCount, error: finalCountError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('*', { count: 'exact', head: true });
            
        if (finalCountError) {
            console.error('❌ Erro ao contar registros finais:', finalCountError.message);
        } else {
            console.log(`\n📊 RESUMO DA LIMPEZA:`);
            console.log(`  📊 Total inicial: ${totalCount}`);
            console.log(`  📊 Total final: ${finalCount}`);
            console.log(`  🗑️  Registros removidos: ${totalCount - finalCount}`);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

(async () => {
    console.log('🚀 Iniciando remoção de duplicados...');
    await removeDuplicates();
    console.log('✅ Processo concluído!');
})();

