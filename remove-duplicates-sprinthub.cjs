const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'api' }
});

async function removeDuplicates() {
    console.log('🔍 Procurando duplicados na tabela leads_exportados_sprinthub...');
    
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
        
        // Buscar duplicados por telefone/whatsapp
        const { data: duplicates, error: duplicatesError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('telefone, whatsapp, COUNT(*) as count')
            .not('telefone', 'is', null)
            .or('whatsapp.not.is.null')
            .group('telefone, whatsapp')
            .having('COUNT(*) > 1');
            
        if (duplicatesError) {
            console.error('❌ Erro ao buscar duplicados:', duplicatesError.message);
            return;
        }
        
        console.log(`🔍 Encontrados ${duplicates.length} grupos de duplicados`);
        
        if (duplicates.length === 0) {
            console.log('✅ Nenhum duplicado encontrado!');
            return;
        }
        
        let totalRemoved = 0;
        
        // Para cada grupo de duplicados, manter apenas o mais recente
        for (const duplicate of duplicates) {
            const { data: records, error: recordsError } = await supabase
                .from('leads_exportados_sprinthub')
                .select('id, created_at')
                .or(`telefone.eq.${duplicate.telefone},whatsapp.eq.${duplicate.whatsapp}`)
                .order('created_at', { ascending: false });
                
            if (recordsError) {
                console.error('❌ Erro ao buscar registros:', recordsError.message);
                continue;
            }
            
            if (records.length > 1) {
                // Manter o primeiro (mais recente) e remover os outros
                const toRemove = records.slice(1);
                const idsToRemove = toRemove.map(r => r.id);
                
                const { error: deleteError } = await supabase
                    .from('leads_exportados_sprinthub')
                    .delete()
                    .in('id', idsToRemove);
                    
                if (deleteError) {
                    console.error('❌ Erro ao remover duplicados:', deleteError.message);
                } else {
                    totalRemoved += idsToRemove.length;
                    console.log(`✅ Removidos ${idsToRemove.length} duplicados para telefone/whatsapp: ${duplicate.telefone || duplicate.whatsapp}`);
                }
            }
        }
        
        console.log(`\n📊 RESUMO DA LIMPEZA:`);
        console.log(`  🗑️  Total de registros removidos: ${totalRemoved}`);
        
        // Verificar total final
        const { count: finalCount, error: finalCountError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('*', { count: 'exact', head: true });
            
        if (finalCountError) {
            console.error('❌ Erro ao contar registros finais:', finalCountError.message);
        } else {
            console.log(`  📊 Total final na tabela: ${finalCount}`);
            console.log(`  📉 Redução: ${totalCount - finalCount} registros`);
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

