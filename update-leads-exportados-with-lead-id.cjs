const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function updateLeadsExportadosWithLeadId() {
    console.log('🔄 ATUALIZANDO leads_exportados_sprinthub com lead_id da oportunidade_sprint...');
    
    try {
        // 1. Buscar todas as oportunidades com lead_whatsapp e lead_email
        console.log('\n📊 Buscando oportunidades da tabela oportunidade_sprint...');
        
        let allOportunidades = [];
        let offset = 0;
        const BATCH_SIZE = 1000;
        
        while (true) {
            const { data: batch, error: batchError } = await supabase
                .from('oportunidade_sprint')
                .select('lead_id, lead_whatsapp, lead_email')
                .not('lead_id', 'is', null)
                .range(offset, offset + BATCH_SIZE - 1);
            
            if (batchError) {
                console.error('❌ Erro ao buscar batch de oportunidades:', batchError.message);
                break;
            }
            
            if (!batch || batch.length === 0) {
                break;
            }
            
            allOportunidades = allOportunidades.concat(batch);
            console.log(`📦 Batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${batch.length} oportunidades | Total: ${allOportunidades.length}`);
            
            offset += BATCH_SIZE;
        }
        
        console.log(`\n📊 Total de oportunidades processadas: ${allOportunidades.length}`);
        
        // 2. Criar mapa de lead_id por whatsapp e email
        console.log('\n🔗 Criando mapa de lead_id por whatsapp e email...');
        
        const whatsappToLeadId = {};
        const emailToLeadId = {};
        
        allOportunidades.forEach(oportunidade => {
            const leadId = oportunidade.lead_id;
            const whatsapp = oportunidade.lead_whatsapp;
            const email = oportunidade.lead_email;
            
            if (whatsapp && whatsapp.trim() !== '') {
                whatsappToLeadId[whatsapp.trim()] = leadId;
            }
            
            if (email && email.trim() !== '') {
                emailToLeadId[email.trim().toLowerCase()] = leadId;
            }
        });
        
        console.log(`📊 Mapa de WhatsApp: ${Object.keys(whatsappToLeadId).length} entradas`);
        console.log(`📊 Mapa de Email: ${Object.keys(emailToLeadId).length} entradas`);
        
        // 3. Buscar todos os leads exportados
        console.log('\n📊 Buscando leads da tabela leads_exportados_sprinthub...');
        
        let allExportedLeads = [];
        offset = 0;
        
        while (true) {
            const { data: batch, error: batchError } = await supabase
                .from('leads_exportados_sprinthub')
                .select('id, whatsapp, email, id_sprint')
                .range(offset, offset + BATCH_SIZE - 1);
            
            if (batchError) {
                console.error('❌ Erro ao buscar batch de leads exportados:', batchError.message);
                break;
            }
            
            if (!batch || batch.length === 0) {
                break;
            }
            
            allExportedLeads = allExportedLeads.concat(batch);
            console.log(`📦 Batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${batch.length} leads | Total: ${allExportedLeads.length}`);
            
            offset += BATCH_SIZE;
        }
        
        console.log(`\n📊 Total de leads exportados processados: ${allExportedLeads.length}`);
        
        // 4. Processar matches e atualizações
        console.log('\n🔗 Processando matches e atualizações...');
        
        let totalProcessed = 0;
        let totalMatched = 0;
        let totalUpdated = 0;
        let totalErrors = 0;
        const matchMethods = {};
        
        const UPDATE_BATCH_SIZE = 100;
        
        for (let i = 0; i < allExportedLeads.length; i += UPDATE_BATCH_SIZE) {
            const batch = allExportedLeads.slice(i, i + UPDATE_BATCH_SIZE);
            const batchNumber = Math.floor(i / UPDATE_BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(allExportedLeads.length / UPDATE_BATCH_SIZE);
            
            console.log(`\n📦 Processando lote ${batchNumber}/${totalBatches} (${batch.length} leads)`);
            
            for (const exportedLead of batch) {
                totalProcessed++;
                let leadId = null;
                let matchMethod = null;
                
                // Tentar match por WhatsApp primeiro
                if (exportedLead.whatsapp && exportedLead.whatsapp.trim() !== '') {
                    leadId = whatsappToLeadId[exportedLead.whatsapp.trim()];
                    if (leadId) {
                        matchMethod = 'whatsapp';
                    }
                }
                
                // Se não encontrou por WhatsApp, tentar por Email
                if (!leadId && exportedLead.email && exportedLead.email.trim() !== '') {
                    leadId = emailToLeadId[exportedLead.email.trim().toLowerCase()];
                    if (leadId) {
                        matchMethod = 'email';
                    }
                }
                
                if (leadId) {
                    totalMatched++;
                    matchMethods[matchMethod] = (matchMethods[matchMethod] || 0) + 1;
                    
                    // Atualizar o lead exportado com o lead_id
                    const { error: updateError } = await supabase
                        .from('leads_exportados_sprinthub')
                        .update({ id_sprint: leadId.toString() })
                        .eq('id', exportedLead.id);
                    
                    if (updateError) {
                        console.error(`❌ Erro ao atualizar lead ${exportedLead.id}:`, updateError.message);
                        totalErrors++;
                    } else {
                        totalUpdated++;
                        if (totalUpdated % 100 === 0) {
                            console.log(`✅ ${totalUpdated} leads atualizados...`);
                        }
                    }
                }
                
                if (totalProcessed % 1000 === 0) {
                    console.log(`📊 Progresso: ${totalProcessed}/${allExportedLeads.length} | Matches: ${totalMatched} | Atualizados: ${totalUpdated}`);
                }
            }
            
            // Pequeno delay entre lotes
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 5. Relatório final
        console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA!');
        console.log(`📊 Leads exportados processados: ${totalProcessed}`);
        console.log(`🔗 Matches encontrados: ${totalMatched}`);
        console.log(`✅ Leads atualizados: ${totalUpdated}`);
        console.log(`❌ Erros: ${totalErrors}`);
        
        console.log('\n📈 Métodos de match utilizados:');
        Object.entries(matchMethods).forEach(([method, count]) => {
            console.log(`  - ${method}: ${count} matches`);
        });
        
        // 6. Verificar resultado final
        console.log('\n📊 Verificando resultado final...');
        const { count: totalExportedLeads } = await supabase
            .from('leads_exportados_sprinthub')
            .select('*', { count: 'exact' });
        
        const { count: leadsWithIdSprint } = await supabase
            .from('leads_exportados_sprinthub')
            .select('*', { count: 'exact' })
            .not('id_sprint', 'is', null)
            .neq('id_sprint', 'null');
        
        console.log(`📊 Total de leads exportados: ${totalExportedLeads}`);
        console.log(`🎯 Leads com id_sprint preenchido: ${leadsWithIdSprint}`);
        
        const percentage = ((leadsWithIdSprint / totalExportedLeads) * 100).toFixed(1);
        console.log(`📈 Percentual de leads com id_sprint: ${percentage}%`);
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

updateLeadsExportadosWithLeadId();

