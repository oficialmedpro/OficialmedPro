const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function debugMatchingIssues() {
    console.log('🔍 DEBUGANDO PROBLEMAS DE MATCHING...');
    
    try {
        // 1. Verificar amostra de leads exportados
        console.log('\n📊 AMOSTRA DE LEADS EXPORTADOS:');
        const { data: sampleExported, error: sampleExportedError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('whatsapp, email, id_sprint')
            .limit(10);
        
        if (!sampleExportedError && sampleExported) {
            sampleExported.forEach((lead, index) => {
                console.log(`${index + 1}. WhatsApp: "${lead.whatsapp}" | Email: "${lead.email}" | ID Sprint: "${lead.id_sprint}"`);
            });
        }
        
        // 2. Verificar amostra de oportunidades
        console.log('\n📊 AMOSTRA DE OPORTUNIDADES:');
        const { data: sampleOportunidades, error: sampleOportError } = await supabase
            .from('oportunidade_sprint')
            .select('lead_id, lead_whatsapp, lead_email')
            .limit(10);
        
        if (!sampleOportError && sampleOportunidades) {
            sampleOportunidades.forEach((oportunidade, index) => {
                console.log(`${index + 1}. Lead ID: ${oportunidade.lead_id} | WhatsApp: "${oportunidade.lead_whatsapp}" | Email: "${oportunidade.lead_email}"`);
            });
        }
        
        // 3. Verificar leads exportados com dados válidos
        console.log('\n📊 LEADS EXPORTADOS COM DADOS VÁLIDOS:');
        
        const { count: leadsComWhatsapp, error: whatsappError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('*', { count: 'exact' })
            .not('whatsapp', 'is', null)
            .neq('whatsapp', '');
        
        const { count: leadsComEmail, error: emailError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('*', { count: 'exact' })
            .not('email', 'is', null)
            .neq('email', '');
        
        if (!whatsappError && !emailError) {
            console.log(`📱 Leads com WhatsApp: ${leadsComWhatsapp}`);
            console.log(`📧 Leads com Email: ${leadsComEmail}`);
        }
        
        // 4. Verificar oportunidades com dados válidos
        console.log('\n📊 OPORTUNIDADES COM DADOS VÁLIDOS:');
        
        const { count: oportunidadesComWhatsapp, error: opWhatsappError } = await supabase
            .from('oportunidade_sprint')
            .select('*', { count: 'exact' })
            .not('lead_whatsapp', 'is', null)
            .neq('lead_whatsapp', '');
        
        const { count: oportunidadesComEmail, error: opEmailError } = await supabase
            .from('oportunidade_sprint')
            .select('*', { count: 'exact' })
            .not('lead_email', 'is', null)
            .neq('lead_email', '');
        
        if (!opWhatsappError && !opEmailError) {
            console.log(`📱 Oportunidades com WhatsApp: ${oportunidadesComWhatsapp}`);
            console.log(`📧 Oportunidades com Email: ${oportunidadesComEmail}`);
        }
        
        // 5. Verificar se há diferenças de formatação
        console.log('\n🔍 VERIFICANDO DIFERENÇAS DE FORMATAÇÃO:');
        
        const { data: sampleWhatsapp, error: sampleWhatsappError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('whatsapp')
            .not('whatsapp', 'is', null)
            .neq('whatsapp', '')
            .limit(5);
        
        if (!sampleWhatsappError && sampleWhatsapp) {
            console.log('📱 Exemplos de WhatsApp (leads_exportados_sprinthub):');
            sampleWhatsapp.forEach((lead, index) => {
                console.log(`   ${index + 1}. "${lead.whatsapp}" (tamanho: ${lead.whatsapp.length})`);
            });
        }
        
        const { data: sampleOpWhatsapp, error: sampleOpWhatsappError } = await supabase
            .from('oportunidade_sprint')
            .select('lead_whatsapp')
            .not('lead_whatsapp', 'is', null)
            .neq('lead_whatsapp', '')
            .limit(5);
        
        if (!sampleOpWhatsappError && sampleOpWhatsapp) {
            console.log('📱 Exemplos de WhatsApp (oportunidade_sprint):');
            sampleOpWhatsapp.forEach((oportunidade, index) => {
                console.log(`   ${index + 1}. "${oportunidade.lead_whatsapp}" (tamanho: ${oportunidade.lead_whatsapp.length})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

debugMatchingIssues();

