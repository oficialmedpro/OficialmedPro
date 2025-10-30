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

async function syncLeadsWithExportedData() {
    console.log('🚀 SINCRONIZANDO LEADS USANDO DADOS EXPORTADOS + API...\n');
    
    try {
        // 1. Primeiro, adicionar campo id_sprinthub na tabela leads se não existir
        console.log('🔧 Verificando/criando campo id_sprinthub na tabela leads...');
        
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE api.leads 
                ADD COLUMN IF NOT EXISTS id_sprinthub BIGINT;
            `
        });
        
        if (alterError) {
            console.log('⚠️  Campo id_sprinthub já existe ou erro:', alterError.message);
        } else {
            console.log('✅ Campo id_sprinthub criado!');
        }
        
        // 2. Buscar leads exportados com dados válidos
        console.log('\n🔍 Buscando leads exportados com dados válidos...');
        
        const { data: exportedLeads, error: exportedError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('*')
            .not('firstname', 'is', null)
            .neq('firstname', '')
            .limit(100); // Processar apenas 100 para teste
        
        if (exportedError) {
            console.error('❌ Erro ao buscar leads exportados:', exportedError.message);
            return;
        }
        
        console.log(`📊 Encontrados ${exportedLeads.length} leads exportados com dados válidos`);
        
        // 3. Buscar dados da API do SprintHub para fazer match
        console.log('\n🔄 Buscando dados da API do SprintHub...');
        
        let page = 0;
        let apiLeads = [];
        const PAGE_LIMIT = 100;
        
        // Buscar algumas páginas da API
        while (page < 5) {
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
                    break;
                }
                
                apiLeads = apiLeads.concat(leads);
                console.log(`📄 Página ${page + 1}: ${leads.length} leads da API`);
                page++;
                
                // Delay entre páginas
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Erro na página ${page + 1}:`, error.message);
                break;
            }
        }
        
        console.log(`📊 Total de leads da API: ${apiLeads.length}`);
        
        // 4. Fazer match entre leads exportados e API
        console.log('\n🔗 Fazendo match entre leads exportados e API...');
        
        let matchedCount = 0;
        let insertedCount = 0;
        
        for (const exportedLead of exportedLeads) {
            // Tentar fazer match por nome e email
            const apiLead = apiLeads.find(apiLead => {
                const exportedName = `${exportedLead.firstname} ${exportedLead.lastname}`.toLowerCase().trim();
                const apiName = apiLead.fullname ? apiLead.fullname.toLowerCase().trim() : '';
                
                return (
                    (exportedName === apiName) ||
                    (exportedLead.email && apiLead.email && exportedLead.email === apiLead.email)
                );
            });
            
            if (apiLead) {
                matchedCount++;
                console.log(`✅ Match encontrado: ${exportedLead.firstname} ${exportedLead.lastname} -> ID ${apiLead.id}`);
                
                // Inserir/atualizar na tabela leads
                const leadData = {
                    id: apiLead.id, // ID do SprintHub
                    id_sprinthub: apiLead.id, // Campo específico para ID do SprintHub
                    firstname: exportedLead.firstname,
                    lastname: exportedLead.lastname,
                    email: exportedLead.email,
                    phone: exportedLead.phone,
                    mobile: exportedLead.mobile,
                    whatsapp: exportedLead.whatsapp,
                    address: exportedLead.address,
                    city: exportedLead.city,
                    state: exportedLead.state,
                    zipcode: exportedLead.zipcode,
                    country: exportedLead.country,
                    company: exportedLead.company,
                    status: exportedLead.status,
                    origem: exportedLead.origem,
                    categoria: exportedLead.categoria,
                    segmento: exportedLead.segmento,
                    stage: exportedLead.stage,
                    observacao: exportedLead.observacao,
                    produto: exportedLead.produto,
                    create_date: exportedLead.create_date,
                    updated_date: exportedLead.updated_date,
                    synced_at: new Date().toISOString(),
                };
                
                const { error: insertError } = await supabase
                    .from('leads')
                    .upsert(leadData, { onConflict: 'id', ignoreDuplicates: false });
                
                if (insertError) {
                    console.error(`❌ Erro ao inserir lead ${apiLead.id}:`, insertError.message);
                } else {
                    insertedCount++;
                }
            } else {
                console.log(`⚠️  Nenhum match para: ${exportedLead.firstname} ${exportedLead.lastname}`);
            }
        }
        
        console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA!');
        console.log(`📊 Leads exportados processados: ${exportedLeads.length}`);
        console.log(`🔗 Matches encontrados: ${matchedCount}`);
        console.log(`✅ Leads inseridos/atualizados: ${insertedCount}`);
        
        // 5. Verificar resultado final
        console.log('\n📊 Verificando resultado final...');
        const { count: totalCount, error: totalError } = await supabase
            .from('leads')
            .select('*', { count: 'exact' });
        
        const { count: validCount, error: validError } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .not('firstname', 'is', null)
            .neq('firstname', '');
        
        const { count: idSprintCount, error: idSprintError } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .not('id_sprinthub', 'is', null);
        
        if (!totalError) console.log(`📊 Total de leads: ${totalCount}`);
        if (!validError) console.log(`✅ Leads com firstname válido: ${validCount}`);
        if (!idSprintError) console.log(`🎯 Leads com id_sprinthub: ${idSprintCount}`);
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

syncLeadsWithExportedData();

