const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

// Função para normalizar telefone
function normalizePhone(phone) {
    if (!phone) return null;
    
    // Remover todos os caracteres não numéricos
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Se começar com 55 (código do Brasil), remover
    if (cleanPhone.startsWith('55')) {
        cleanPhone = cleanPhone.substring(2);
    }
    
    // Se tiver 11 dígitos e não começar com 9, adicionar 9
    if (cleanPhone.length === 11 && !cleanPhone.startsWith('9')) {
        cleanPhone = '9' + cleanPhone;
    }
    
    // Se tiver 10 dígitos, adicionar 9 (celular)
    if (cleanPhone.length === 10) {
        cleanPhone = '9' + cleanPhone;
    }
    
    return cleanPhone;
}

async function updateLeadsExportadosWithNormalizedPhone() {
    console.log('🔄 ATUALIZANDO leads_exportados_sprinthub com normalização de telefone...');
    
    try {
        // 1. Buscar todas as oportunidades com telefones normalizados
        console.log('\n📊 Buscando oportunidades e normalizando telefones...');
        
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
        
        // 2. Criar mapa de lead_id por telefone normalizado e email
        console.log('\n🔗 Criando mapa com telefones normalizados...');
        
        const normalizedPhoneToLeadId = {};
        const emailToLeadId = {};
        
        allOportunidades.forEach(oportunidade => {
            const leadId = oportunidade.lead_id;
            const whatsapp = oportunidade.lead_whatsapp;
            const email = oportunidade.lead_email;
            
            if (whatsapp && whatsapp.trim() !== '') {
                const normalizedPhone = normalizePhone(whatsapp);
                if (normalizedPhone) {
                    normalizedPhoneToLeadId[normalizedPhone] = leadId;
                }
            }
            
            if (email && email.trim() !== '') {
                emailToLeadId[email.trim().toLowerCase()] = leadId;
            }
        });
        
        console.log(`📊 Mapa de telefones normalizados: ${Object.keys(normalizedPhoneToLeadId).length} entradas`);
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
        
        // 4. Processar matches com telefones normalizados
        console.log('\n🔗 Processando matches com telefones normalizados...');
        
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
                
                // Tentar match por telefone normalizado primeiro
                if (exportedLead.whatsapp && exportedLead.whatsapp.trim() !== '') {
                    const normalizedPhone = normalizePhone(exportedLead.whatsapp);
                    if (normalizedPhone) {
                        leadId = normalizedPhoneToLeadId[normalizedPhone];
                        if (leadId) {
                            matchMethod = 'whatsapp_normalized';
                        }
                    }
                }
                
                // Se não encontrou por telefone, tentar por Email
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
        console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA COM NORMALIZAÇÃO!');
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

updateLeadsExportadosWithNormalizedPhone();

