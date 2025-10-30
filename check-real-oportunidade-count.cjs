const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function checkRealOportunidadeCount() {
    console.log('🔍 VERIFICANDO CONTAGEM REAL SEM LIMITAÇÃO...');
    
    try {
        // 1. Contar total de registros usando count
        console.log('\n📊 CONTAGEM TOTAL:');
        const { count: totalCount, error: countError } = await supabase
            .from('oportunidade_sprint')
            .select('*', { count: 'exact' });
        
        if (countError) {
            console.error('❌ Erro ao contar total:', countError.message);
            return;
        }
        
        console.log(`📊 Total de registros na tabela oportunidade_sprint: ${totalCount}`);
        
        // 2. Contar leads únicos usando count
        const { count: uniqueLeadsCount, error: uniqueError } = await supabase
            .from('oportunidade_sprint')
            .select('lead_id', { count: 'exact' })
            .not('lead_id', 'is', null);
        
        if (uniqueError) {
            console.error('❌ Erro ao contar leads únicos:', uniqueError.message);
            return;
        }
        
        console.log(`📊 Total de registros com lead_id: ${uniqueLeadsCount}`);
        
        // 3. Buscar leads únicos distintos em lotes
        console.log('\n🔍 BUSCANDO LEADS ÚNICOS DISTINTOS...');
        
        let allLeadIds = [];
        let offset = 0;
        const BATCH_SIZE = 1000;
        
        while (true) {
            const { data: batch, error: batchError } = await supabase
                .from('oportunidade_sprint')
                .select('lead_id')
                .not('lead_id', 'is', null)
                .range(offset, offset + BATCH_SIZE - 1);
            
            if (batchError) {
                console.error('❌ Erro ao buscar batch:', batchError.message);
                break;
            }
            
            if (!batch || batch.length === 0) {
                break;
            }
            
            allLeadIds = allLeadIds.concat(batch.map(item => item.lead_id));
            console.log(`📦 Batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${batch.length} registros | Total: ${allLeadIds.length}`);
            
            offset += BATCH_SIZE;
        }
        
        // 4. Contar leads únicos
        const uniqueLeadIds = [...new Set(allLeadIds)];
        console.log(`\n📊 Total de registros processados: ${allLeadIds.length}`);
        console.log(`🎯 Leads únicos distintos: ${uniqueLeadIds.length}`);
        console.log(`📈 Média de oportunidades por lead: ${(allLeadIds.length / uniqueLeadIds.length).toFixed(2)}`);
        
        // 5. Verificar distribuição de oportunidades por lead
        console.log('\n📊 DISTRIBUIÇÃO DE OPORTUNIDADES POR LEAD:');
        
        const leadIdCounts = {};
        allLeadIds.forEach(leadId => {
            leadIdCounts[leadId] = (leadIdCounts[leadId] || 0) + 1;
        });
        
        const distribution = {};
        Object.values(leadIdCounts).forEach(count => {
            distribution[count] = (distribution[count] || 0) + 1;
        });
        
        Object.entries(distribution)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .forEach(([oportunidades, leads]) => {
                console.log(`📊 ${leads} leads têm ${oportunidades} oportunidade(s)`);
            });
        
        // 6. Verificar leads com mais oportunidades
        console.log('\n🔍 LEADS COM MAIS OPORTUNIDADES:');
        
        const leadsWithManyOportunidades = Object.entries(leadIdCounts)
            .filter(([leadId, count]) => count > 10)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
        
        if (leadsWithManyOportunidades.length > 0) {
            console.log('🚨 Top 20 leads com mais oportunidades:');
            leadsWithManyOportunidades.forEach(([leadId, count]) => {
                console.log(`   Lead ID ${leadId}: ${count} oportunidades`);
            });
        } else {
            console.log('✅ Nenhum lead tem mais de 10 oportunidades');
        }
        
        // 7. Verificar range de lead_ids
        console.log('\n🔍 RANGE DE LEAD_IDS:');
        
        const leadIdsNumeric = uniqueLeadIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        if (leadIdsNumeric.length > 0) {
            leadIdsNumeric.sort((a, b) => a - b);
            console.log(`📊 Lead ID mínimo: ${Math.min(...leadIdsNumeric)}`);
            console.log(`📊 Lead ID máximo: ${Math.max(...leadIdsNumeric)}`);
            console.log(`📊 Range: ${Math.max(...leadIdsNumeric) - Math.min(...leadIdsNumeric)}`);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

checkRealOportunidadeCount();

