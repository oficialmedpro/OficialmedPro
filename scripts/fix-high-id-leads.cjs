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

async function fixHighIdLeads() {
    console.log('🔧 CORRIGINDO LEADS COM IDs ALTOS (MAIS RECENTES)...\n');
    
    try {
        // 1. Buscar leads com IDs altos que têm strings "null"
        console.log('🔍 Buscando leads com IDs altos corrompidos...');
        
        const { data: corruptedLeads, error: searchError } = await supabase
            .from('leads')
            .select('id')
            .eq('firstname', 'null')
            .gte('id', 117000) // IDs altos (mais recentes)
            .order('id', { ascending: false })
            .limit(50);
        
        if (searchError) {
            console.error('❌ Erro ao buscar leads corrompidos:', searchError.message);
            return;
        }
        
        console.log(`📊 Encontrados ${corruptedLeads.length} leads corrompidos com IDs altos`);
        
        if (corruptedLeads.length === 0) {
            console.log('✅ Nenhum lead corrompido encontrado!');
            return;
        }
        
        // 2. Buscar dados do SprintHub para esses IDs específicos
        console.log('\n🔄 Buscando dados do SprintHub para IDs específicos...');
        
        let fixedCount = 0;
        
        for (const lead of corruptedLeads) {
            try {
                // Buscar dados específicos do SprintHub para este ID
                const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?i=${SPRINTHUB_CONFIG.instance}&page=0&limit=100&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
                
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                        'apitoken': SPRINTHUB_CONFIG.apiToken
                    }
                });

                if (!response.ok) {
                    console.error(`❌ Erro HTTP ${response.status} para lead ${lead.id}`);
                    continue;
                }

                const data = await response.json();
                const leads = data.data.leads;
                
                // Encontrar o lead específico
                const sprintHubLead = leads.find(l => l.id === lead.id);
                
                if (!sprintHubLead) {
                    console.log(`⚠️  Lead ${lead.id} não encontrado no SprintHub`);
                    continue;
                }
                
                console.log(`🔍 Processando lead ${lead.id}:`, sprintHubLead.fullname || 'Sem nome');
                
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
                
                // Atualizar no Supabase
                const { error: updateError } = await supabase
                    .from('leads')
                    .upsert(mappedLead, { onConflict: 'id', ignoreDuplicates: false });
                
                if (updateError) {
                    console.error(`❌ Erro ao atualizar lead ${lead.id}:`, updateError.message);
                } else {
                    console.log(`✅ Lead ${lead.id} corrigido: "${firstname} ${lastname}"`);
                    fixedCount++;
                }
                
                // Delay entre atualizações
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`❌ Erro ao processar lead ${lead.id}:`, error.message);
            }
        }
        
        console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
        console.log(`Total de leads corrigidos: ${fixedCount}/${corruptedLeads.length}`);
        
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

fixHighIdLeads();

