const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function investigateLeadIdDiscrepancy() {
    console.log('🔍 INVESTIGANDO DISCREPÂNCIA: 41k oportunidades vs 943 leads únicos...');
    
    try {
        // 1. Verificar se há lead_ids duplicados (múltiplas oportunidades por lead)
        console.log('\n📊 ANÁLISE DE DUPLICATAS:');
        
        const { data: allOportunidades, error: allOportError } = await supabase
            .from('oportunidade_sprint')
            .select('lead_id');
        
        if (allOportError) {
            console.error('❌ Erro ao buscar oportunidades:', allOportError.message);
            return;
        }
        
        // Contar quantas vezes cada lead_id aparece
        const leadIdCounts = {};
        allOportunidades.forEach(oportunidade => {
            const leadId = oportunidade.lead_id;
            leadIdCounts[leadId] = (leadIdCounts[leadId] || 0) + 1;
        });
        
        const uniqueLeadIds = Object.keys(leadIdCounts);
        const totalOportunidades = allOportunidades.length;
        
        console.log(`📊 Total de oportunidades: ${totalOportunidades}`);
        console.log(`📊 Leads únicos: ${uniqueLeadIds.length}`);
        console.log(`📊 Média de oportunidades por lead: ${(totalOportunidades / uniqueLeadIds.length).toFixed(2)}`);
        
        // 2. Verificar distribuição de oportunidades por lead
        console.log('\n📈 DISTRIBUIÇÃO DE OPORTUNIDADES POR LEAD:');
        
        const distribution = {};
        Object.values(leadIdCounts).forEach(count => {
            distribution[count] = (distribution[count] || 0) + 1;
        });
        
        Object.entries(distribution)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .forEach(([oportunidades, leads]) => {
                console.log(`📊 ${leads} leads têm ${oportunidades} oportunidade(s)`);
            });
        
        // 3. Verificar se há leads com MUITAS oportunidades
        console.log('\n🔍 LEADS COM MAIS OPORTUNIDADES:');
        
        const leadsWithManyOportunidades = Object.entries(leadIdCounts)
            .filter(([leadId, count]) => count > 10)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
        
        if (leadsWithManyOportunidades.length > 0) {
            console.log('🚨 Leads com mais de 10 oportunidades:');
            leadsWithManyOportunidades.forEach(([leadId, count]) => {
                console.log(`   Lead ID ${leadId}: ${count} oportunidades`);
            });
        } else {
            console.log('✅ Nenhum lead tem mais de 10 oportunidades');
        }
        
        // 4. Verificar se há padrões estranhos nos lead_ids
        console.log('\n🔍 ANÁLISE DE PADRÕES NOS LEAD_IDS:');
        
        const leadIds = uniqueLeadIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        leadIds.sort((a, b) => a - b);
        
        console.log(`📊 Lead ID mínimo: ${Math.min(...leadIds)}`);
        console.log(`📊 Lead ID máximo: ${Math.max(...leadIds)}`);
        console.log(`📊 Range: ${Math.max(...leadIds) - Math.min(...leadIds)}`);
        
        // Verificar se há gaps grandes
        const gaps = [];
        for (let i = 1; i < leadIds.length; i++) {
            const gap = leadIds[i] - leadIds[i-1];
            if (gap > 1000) {
                gaps.push({ from: leadIds[i-1], to: leadIds[i], gap });
            }
        }
        
        if (gaps.length > 0) {
            console.log('\n🚨 GAPS GRANDES encontrados:');
            gaps.slice(0, 10).forEach(gap => {
                console.log(`   Gap de ${gap.gap} entre ${gap.from} e ${gap.to}`);
            });
        }
        
        // 5. Verificar se há lead_ids que não existem na tabela leads
        console.log('\n🔍 VERIFICANDO LEAD_IDS INEXISTENTES:');
        
        const { data: existingLeads, error: existingError } = await supabase
            .from('leads')
            .select('id')
            .in('id', leadIds.slice(0, 100)); // Verificar apenas os primeiros 100
        
        if (!existingError && existingLeads) {
            const existingIds = existingLeads.map(lead => lead.id);
            const missingIds = leadIds.slice(0, 100).filter(id => !existingIds.includes(id));
            
            if (missingIds.length > 0) {
                console.log(`🚨 ${missingIds.length} lead_ids não existem na tabela leads:`);
                console.log(`   Exemplos: ${missingIds.slice(0, 10).join(', ')}`);
            } else {
                console.log('✅ Todos os lead_ids verificados existem na tabela leads');
            }
        }
        
        // 6. Verificar se há leads na tabela leads que não têm oportunidades
        console.log('\n🔍 VERIFICANDO LEADS SEM OPORTUNIDADES:');
        
        const { count: totalLeads, error: totalLeadsError } = await supabase
            .from('leads')
            .select('*', { count: 'exact' });
        
        if (!totalLeadsError) {
            const leadsComOportunidades = uniqueLeadIds.length;
            const leadsSemOportunidades = totalLeads - leadsComOportunidades;
            const percentualComOportunidades = ((leadsComOportunidades / totalLeads) * 100).toFixed(2);
            
            console.log(`📊 Total de leads: ${totalLeads}`);
            console.log(`📊 Leads com oportunidades: ${leadsComOportunidades}`);
            console.log(`📊 Leads sem oportunidades: ${leadsSemOportunidades}`);
            console.log(`📊 Percentual com oportunidades: ${percentualComOportunidades}%`);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

investigateLeadIdDiscrepancy();

