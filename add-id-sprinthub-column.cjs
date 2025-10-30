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

async function addIdSprinthubColumn() {
    console.log('🔧 ADICIONANDO COLUNA id_sprinthub E POPULANDO COM IDs CORRETOS...\n');
    
    try {
        // 1. Adicionar coluna id_sprinthub na tabela leads
        console.log('🔧 Adicionando coluna id_sprinthub na tabela leads...');
        
        // Usar SQL direto para adicionar a coluna
        const { error: alterError } = await supabase
            .rpc('exec_sql', {
                sql: 'ALTER TABLE api.leads ADD COLUMN IF NOT EXISTS id_sprinthub BIGINT;'
            });
        
        if (alterError) {
            console.log('⚠️  Erro ao adicionar coluna (pode já existir):', alterError.message);
        } else {
            console.log('✅ Coluna id_sprinthub adicionada!');
        }
        
        // 2. Buscar leads exportados com dados válidos
        console.log('\n🔍 Buscando leads exportados com dados válidos...');
        
        const { data: exportedLeads, error: exportedError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('*')
            .not('primeiro_nome', 'is', null)
            .neq('primeiro_nome', '')
            .limit(100); // Processar 100 para teste
        
        if (exportedError) {
            console.error('❌ Erro ao buscar leads exportados:', exportedError.message);
            return;
        }
        
        console.log(`📊 Encontrados ${exportedLeads.length} leads exportados com dados válidos`);
        
        // 3. Buscar dados da API do SprintHub
        console.log('\n🔄 Buscando dados da API do SprintHub...');
        
        let apiLeads = [];
        let page = 0;
        const PAGE_LIMIT = 100;
        
        // Buscar várias páginas da API
        while (page < 10) {
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
        
        // 4. Fazer match e inserir/atualizar na tabela leads
        console.log('\n🔗 Fazendo match e populando IDs do SprintHub...');
        
        let matchedCount = 0;
        let updatedCount = 0;
        
        for (const exportedLead of exportedLeads) {
            // Tentar fazer match por nome completo
            const exportedName = exportedLead.nome_completo ? exportedLead.nome_completo.toLowerCase().trim() : '';
            const apiLead = apiLeads.find(apiLead => {
                const apiName = apiLead.fullname ? apiLead.fullname.toLowerCase().trim() : '';
                return exportedName === apiName;
            });
            
            if (apiLead) {
                matchedCount++;
                console.log(`✅ Match: ${exportedLead.nome_completo} -> ID ${apiLead.id}`);
                
                // Preparar dados completos para inserção/atualização
                const leadData = {
                    id: apiLead.id, // ID do SprintHub como chave primária
                    id_sprinthub: apiLead.id, // Campo específico para ID do SprintHub
                    firstname: exportedLead.primeiro_nome,
                    lastname: exportedLead.ultimo_nome,
                    email: exportedLead.email,
                    phone: exportedLead.telefone,
                    mobile: exportedLead.mobile,
                    whatsapp: exportedLead.whatsapp,
                    address: exportedLead.endereco_logradouro,
                    city: exportedLead.endereco_cidade,
                    state: exportedLead.endereco_estado,
                    zipcode: exportedLead.endereco_cep,
                    country: exportedLead.endereco_pais,
                    company: exportedLead.codigo_cliente,
                    status: exportedLead.status,
                    origem: exportedLead.origem,
                    categoria: exportedLead.categoria,
                    segmento: exportedLead.segmento,
                    stage: exportedLead.etapa_venda,
                    observacao: exportedLead.observacoes,
                    produto: exportedLead.produto_interesse,
                    create_date: exportedLead.data_cadastro,
                    updated_date: exportedLead.data_ultima_atualizacao,
                    synced_at: new Date().toISOString(),
                };
                
                // Inserir/atualizar na tabela leads
                const { error: upsertError } = await supabase
                    .from('leads')
                    .upsert(leadData, { onConflict: 'id', ignoreDuplicates: false });
                
                if (upsertError) {
                    console.error(`❌ Erro ao inserir/atualizar lead ${apiLead.id}:`, upsertError.message);
                } else {
                    updatedCount++;
                }
            } else {
                console.log(`⚠️  Nenhum match para: ${exportedLead.nome_completo}`);
            }
        }
        
        console.log('\n🎉 PROCESSO CONCLUÍDO!');
        console.log(`📊 Leads exportados processados: ${exportedLeads.length}`);
        console.log(`🔗 Matches encontrados: ${matchedCount}`);
        console.log(`✅ Leads inseridos/atualizados: ${updatedCount}`);
        
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
        
        // 6. Mostrar amostra dos leads com ID do SprintHub
        console.log('\n🔍 Amostra de leads com ID do SprintHub:');
        const { data: sampleLeads, error: sampleError } = await supabase
            .from('leads')
            .select('id, id_sprinthub, firstname, lastname, email, whatsapp')
            .not('id_sprinthub', 'is', null)
            .limit(5);
        
        if (!sampleError && sampleLeads) {
            sampleLeads.forEach((lead, index) => {
                console.log(`${index + 1}. ID: ${lead.id} | ID Sprint: ${lead.id_sprinthub} | Nome: ${lead.firstname} ${lead.lastname} | WhatsApp: ${lead.whatsapp}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

addIdSprinthubColumn();

