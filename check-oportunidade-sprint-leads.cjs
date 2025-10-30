const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function checkOportunidadeSprintLeads() {
    console.log('🔍 Verificando leads únicos na tabela oportunidade_sprint...');
    
    try {
        // Contar total de registros
        const { count: totalCount, error: totalError } = await supabase
            .from('oportunidade_sprint')
            .select('*', { count: 'exact' });
        
        if (totalError) {
            console.error('❌ Erro ao contar total de registros:', totalError.message);
            return;
        }
        
        console.log(`📊 Total de registros na tabela: ${totalCount}`);
        
        // Contar leads únicos (lead_id não nulo)
        const { count: leadsUnicosCount, error: leadsError } = await supabase
            .from('oportunidade_sprint')
            .select('lead_id', { count: 'exact' })
            .not('lead_id', 'is', null);
        
        if (leadsError) {
            console.error('❌ Erro ao contar leads únicos:', leadsError.message);
            return;
        }
        
        console.log(`🎯 Leads únicos (lead_id não nulo): ${leadsUnicosCount}`);
        
        // Buscar leads únicos distintos
        const { data: distinctLeads, error: distinctError } = await supabase
            .from('oportunidade_sprint')
            .select('lead_id')
            .not('lead_id', 'is', null);
        
        if (distinctError) {
            console.error('❌ Erro ao buscar leads distintos:', distinctError.message);
            return;
        }
        
        // Contar leads únicos manualmente
        const uniqueLeadIds = [...new Set(distinctLeads.map(item => item.lead_id))];
        console.log(`🔢 Leads únicos distintos: ${uniqueLeadIds.length}`);
        
        // Amostra de 10 lead_ids
        console.log('\n🔍 Amostra de 10 lead_ids:');
        uniqueLeadIds.slice(0, 10).forEach((leadId, index) => {
            console.log(`${index + 1}. Lead ID: ${leadId}`);
        });
        
        // Verificar se há lead_ids duplicados
        const leadIdCounts = {};
        distinctLeads.forEach(item => {
            leadIdCounts[item.lead_id] = (leadIdCounts[item.lead_id] || 0) + 1;
        });
        
        const duplicatedLeads = Object.entries(leadIdCounts).filter(([leadId, count]) => count > 1);
        console.log(`\n🔄 Leads com múltiplas oportunidades: ${duplicatedLeads.length}`);
        
        if (duplicatedLeads.length > 0) {
            console.log('📋 Top 5 leads com mais oportunidades:');
            duplicatedLeads
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([leadId, count], index) => {
                    console.log(`${index + 1}. Lead ID: ${leadId} - ${count} oportunidades`);
                });
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

checkOportunidadeSprintLeads();

