const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SPRINTHUB_CONFIG = {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN
};

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function fixCorruptedLeads() {
    console.log('🔧 CORRIGINDO LEADS CORROMPIDOS...\n');
    
    try {
        // 1. Primeiro, limpar TODOS os dados corrompidos (strings "null")
        console.log('🧹 Limpando dados corrompidos...');
        
        const { error: updateError } = await supabase
            .from('leads')
            .update({
                firstname: null,
                lastname: null,
                phone: null,
                whatsapp: null,
                mobile: null,
                status: null,
                origem: null,
                categoria: null,
                segmento: null,
                stage: null,
                observacao: null,
                produto: null
            })
            .or('firstname.eq.null,lastname.eq.null,phone.eq.null,whatsapp.eq.null,mobile.eq.null,status.eq.null,origem.eq.null');
        
        if (updateError) {
            console.error('❌ Erro ao limpar dados:', updateError.message);
        } else {
            console.log('✅ Dados corrompidos limpos!');
        }
        
        // 2. Buscar leads do SprintHub e re-sincronizar
        console.log('\n🔄 Re-sincronizando leads do SprintHub...');
        
        let page = 0;
        let totalProcessed = 0;
        let totalFixed = 0;
        const PAGE_LIMIT = 100;
        
        while (page < 10) { // Processar apenas 10 páginas para teste
            const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?i=${SPRINTHUB_CONFIG.instance}&page=${page}&limit=${PAGE_LIMIT}&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
            
            try {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                        'apitoken': SPRINTHUB_CONFIG.apiToken
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const leads = data.data.leads;
                
                if (!leads || leads.length === 0) {
                    console.log('🏁 Nenhuma lead encontrada. Finalizando.');
                    break;
                }
                
                console.log(`📄 Página ${page + 1}: ${leads.length} leads encontrados`);
                
                for (const sprintHubLead of leads) {
                    totalProcessed++;
                    
                    // Mapear dados corretamente
                    const fullname = sprintHubLead.fullname || '';
                    const nameParts = fullname.split(' ');
                    const firstname = nameParts[0] || null;
                    const lastname = nameParts.slice(1).join(' ') || null;
                    
                    const mappedLead = {
                        id: sprintHubLead.id,
                        firstname: firstname,
                        lastname: lastname,
                        email: sprintHubLead.email || null,
                        phone: sprintHubLead.phone || null,
                        mobile: sprintHubLead.mobile || null,
                        whatsapp: sprintHubLead.whatsapp || null,
                        address: sprintHubLead.address || null,
                        city: sprintHubLead.city || null,
                        state: sprintHubLead.state || null,
                        zipcode: sprintHubLead.zipcode || null,
                        country: sprintHubLead.country || null,
                        company: sprintHubLead.company || null,
                        status: sprintHubLead.status || null,
                        origem: sprintHubLead.origin || null,
                        categoria: sprintHubLead.category || null,
                        segmento: sprintHubLead.segment || null,
                        stage: sprintHubLead.stage || null,
                        observacao: sprintHubLead.observation || null,
                        produto: sprintHubLead.product || null,
                        create_date: sprintHubLead.createDate ? new Date(sprintHubLead.createDate).toISOString() : null,
                        updated_date: sprintHubLead.updateDate ? new Date(sprintHubLead.updateDate).toISOString() : null,
                        synced_at: new Date().toISOString(),
                    };
                    
                    // Inserir/atualizar no Supabase
                    const { error: insertError } = await supabase
                        .from('leads')
                        .upsert(mappedLead, { onConflict: 'id', ignoreDuplicates: false });
                    
                    if (insertError) {
                        console.error(`❌ Erro ao inserir lead ${sprintHubLead.id}:`, insertError.message);
                    } else {
                        totalFixed++;
                    }
                }
                
                console.log(`✅ Página ${page + 1}: ${leads.length} leads processados`);
                page++;
                
                // Delay entre páginas
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ Erro na página ${page + 1}:`, error.message);
                break;
            }
        }
        
        console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
        console.log(`Total de leads processados: ${totalProcessed}`);
        console.log(`Total de leads corrigidos: ${totalFixed}`);
        
        // 3. Verificar resultado
        console.log('\n📊 Verificando resultado...');
        const { count: validCount, error: validError } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .not('firstname', 'is', null)
            .neq('firstname', '');
        
        if (!validError) {
            console.log(`✅ Leads com firstname válido: ${validCount}`);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

fixCorruptedLeads();

