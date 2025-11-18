const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function investigateOportunidadeSprintDeep() {
    console.log('🔍 INVESTIGAÇÃO PROFUNDA da tabela oportunidade_sprint...');
    
    try {
        // 1. Verificar estrutura da tabela
        console.log('\n📋 ESTRUTURA DA TABELA:');
        const { data: tableInfo, error: tableError } = await supabase
            .from('oportunidade_sprint')
            .select('*')
            .limit(1);
        
        if (tableError) {
            console.error('❌ Erro ao verificar estrutura:', tableError.message);
            return;
        }
        
        if (tableInfo && tableInfo.length > 0) {
            console.log('Campos disponíveis:', Object.keys(tableInfo[0]));
        }
        
        // 2. Verificar se há lead_ids nulos ou vazios
        console.log('\n🔍 VERIFICANDO LEAD_IDS NULOS/VAZIOS:');
        const { count: nullLeadIds, error: nullError } = await supabase
            .from('oportunidade_sprint')
            .select('*', { count: 'exact' })
            .is('lead_id', null);
        
        if (!nullError) {
            console.log(`📊 Registros com lead_id NULL: ${nullLeadIds}`);
        }
        
        const { count: emptyLeadIds, error: emptyError } = await supabase
            .from('oportunidade_sprint')
            .select('*', { count: 'exact' })
            .eq('lead_id', '');
        
        if (!emptyError) {
            console.log(`📊 Registros com lead_id vazio: ${emptyLeadIds}`);
        }
        
        // 3. Verificar range de lead_ids
        console.log('\n📊 RANGE DE LEAD_IDS:');
        const { data: minMax, error: minMaxError } = await supabase
            .from('oportunidade_sprint')
            .select('lead_id')
            .not('lead_id', 'is', null)
            .order('lead_id', { ascending: true });
        
        if (!minMaxError && minMax && minMax.length > 0) {
            const leadIds = minMax.map(item => parseInt(item.lead_id)).filter(id => !isNaN(id));
            if (leadIds.length > 0) {
                console.log(`🔢 Lead ID mínimo: ${Math.min(...leadIds)}`);
                console.log(`🔢 Lead ID máximo: ${Math.max(...leadIds)}`);
            }
        }
        
        // 4. Verificar se há outras tabelas relacionadas
        console.log('\n🔍 VERIFICANDO OUTRAS TABELAS COM LEADS:');
        
        // Verificar tabela leads
        const { count: leadsCount, error: leadsError } = await supabase
            .from('leads')
            .select('*', { count: 'exact' });
        
        if (!leadsError) {
            console.log(`📊 Total na tabela 'leads': ${leadsCount}`);
        }
        
        // Verificar tabela leads_exportados_sprinthub
        const { count: exportedLeadsCount, error: exportedError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('*', { count: 'exact' });
        
        if (!exportedError) {
            console.log(`📊 Total na tabela 'leads_exportados_sprinthub': ${exportedLeadsCount}`);
        }
        
        // 5. Verificar se há leads na tabela leads que não estão em oportunidade_sprint
        console.log('\n🔍 COMPARANDO TABELAS:');
        
        // Buscar alguns lead_ids da tabela leads
        const { data: sampleLeads, error: sampleLeadsError } = await supabase
            .from('leads')
            .select('id')
            .limit(10);
        
        if (!sampleLeadsError && sampleLeads) {
            console.log('📋 Amostra de IDs da tabela leads:');
            sampleLeads.forEach((lead, index) => {
                console.log(`${index + 1}. ID: ${lead.id}`);
            });
        }
        
        // 6. Verificar se há leads na oportunidade_sprint que não estão na tabela leads
        const { data: sampleOportunidades, error: sampleOportError } = await supabase
            .from('oportunidade_sprint')
            .select('lead_id')
            .limit(10);
        
        if (!sampleOportError && sampleOportunidades) {
            console.log('\n📋 Amostra de lead_ids da tabela oportunidade_sprint:');
            sampleOportunidades.forEach((oportunidade, index) => {
                console.log(`${index + 1}. Lead ID: ${oportunidade.lead_id}`);
            });
        }
        
        // 7. Verificar se há padrões nos lead_ids
        console.log('\n🔍 ANÁLISE DE PADRÕES:');
        const { data: allLeadIds, error: allLeadIdsError } = await supabase
            .from('oportunidade_sprint')
            .select('lead_id')
            .not('lead_id', 'is', null)
            .limit(100);
        
        if (!allLeadIdsError && allLeadIds) {
            const leadIds = allLeadIds.map(item => parseInt(item.lead_id)).filter(id => !isNaN(id));
            if (leadIds.length > 0) {
                console.log(`📊 Amostra de 100 lead_ids: ${leadIds.slice(0, 20).join(', ')}...`);
                
                // Verificar se são sequenciais
                const sortedIds = [...leadIds].sort((a, b) => a - b);
                const isSequential = sortedIds.every((id, index) => index === 0 || id === sortedIds[index - 1] + 1);
                console.log(`🔢 Lead IDs são sequenciais: ${isSequential ? 'SIM' : 'NÃO'}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

investigateOportunidadeSprintDeep();

