const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'api' }
});

async function removeDuplicatesSafe() {
    console.log('🔍 Removendo duplicados de forma segura...');
    
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
        
        // Buscar duplicados apenas com telefone/whatsapp válidos (não vazios)
        const { data: duplicates, error: duplicatesError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('id, telefone, whatsapp, created_at')
            .or('telefone.not.is.null,whatsapp.not.is.null')
            .not('telefone', 'eq', '')
            .not('whatsapp', 'eq', '');
            
        if (duplicatesError) {
            console.error('❌ Erro ao buscar registros:', duplicatesError.message);
            return;
        }
        
        console.log(`📊 Registros com telefone/whatsapp válido: ${duplicates.length}`);
        
        // Agrupar por telefone/whatsapp
        const groups = {};
        duplicates.forEach(record => {
            const key = record.telefone || record.whatsapp;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(record);
        });
        
        // Encontrar grupos com duplicados
        const duplicateGroups = Object.entries(groups).filter(([key, records]) => records.length > 1);
        
        console.log(`🔍 Grupos com duplicados: ${duplicateGroups.length}`);
        
        let totalRemoved = 0;
        
        // Para cada grupo de duplicados, manter apenas o mais recente
        for (const [key, records] of duplicateGroups) {
            // Ordenar por created_at (mais recente primeiro)
            records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Manter o primeiro (mais recente) e remover os outros
            const toRemove = records.slice(1);
            const idsToRemove = toRemove.map(r => r.id);
            
            const { error: deleteError } = await supabase
                .from('leads_exportados_sprinthub')
                .delete()
                .in('id', idsToRemove);
                
            if (deleteError) {
                console.error(`❌ Erro ao remover duplicados para ${key}:`, deleteError.message);
            } else {
                totalRemoved += idsToRemove.length;
                console.log(`✅ Removidos ${idsToRemove.length} duplicados para ${key}`);
            }
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
            console.log(`  🗑️  Registros removidos: ${totalRemoved}`);
            console.log(`  📉 Redução: ${totalCount - finalCount} registros`);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

(async () => {
    console.log('🚀 Iniciando remoção segura de duplicados...');
    await removeDuplicatesSafe();
    console.log('✅ Processo concluído!');
})();

