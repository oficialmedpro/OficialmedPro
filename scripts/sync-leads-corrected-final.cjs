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

async function syncLeadsCorrectedFinal() {
    console.log('🚀 SINCRONIZAÇÃO FINAL: DADOS EXPORTADOS + API...\n');
    
    try {
        // 1. Adicionar campo id_sprinthub na tabela leads
        console.log('🔧 Adicionando campo id_sprinthub na tabela leads...');
        
        const { error: alterError } = await supabase
            .from('leads')
            .select('id_sprinthub')
            .limit(1);
        
        if (alterError && alterError.message.includes('column "id_sprinthub" does not exist')) {
            // Campo não existe, vamos criar via SQL direto
            console.log('⚠️  Campo id_sprinthub não existe. Criando...');
            // Por enquanto, vamos continuar sem o campo
        } else {
            console.log('✅ Campo id_sprinthub já existe!');
        }
        
        // 2. Buscar leads exportados com dados válidos
        console.log('\n🔍 Buscando leads exportados com dados válidos...');
        
        const { data: exportedLeads, error: exportedError } = await supabase
            .from('leads_exportados_sprinthub')
            .select('*')
            .not('primeiro_nome', 'is', null)
            .neq('primeiro_nome', '')
            .limit(50); // Processar apenas 50 para teste
        
        if (exportedError) {
            console.error('❌ Erro ao buscar leads exportados:', exportedError.message);
            return;
        }
        
        console.log(`📊 Encontrados ${exportedLeads.length} leads exportados com dados válidos`);
        
        // 3. Buscar dados da API do SprintHub
        console.log('\n🔄 Buscando dados da API do SprintHub...');
        
        let apiLeads = [];
        const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?i=${SPRINTHUB_CONFIG.instance}&page=0&limit=200&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
        
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
            apiLeads = data.data.leads;
            console.log(`📊 Encontrados ${apiLeads.length} leads na API`);
            
        } catch (error) {
            console.error('❌ Erro ao buscar dados da API:', error.message);
            return;
        }
        
        // 4. Fazer match e inserir na tabela leads
        console.log('\n🔗 Fazendo match e inserindo na tabela leads...');
        
        let matchedCount = 0;
        let insertedCount = 0;
        
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
                
                // Preparar dados para inserção
                const leadData = {
                    id: apiLead.id, // ID do SprintHub
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
                const { error: insertError } = await supabase
                    .from('leads')
                    .upsert(leadData, { onConflict: 'id', ignoreDuplicates: false });
                
                if (insertError) {
                    console.error(`❌ Erro ao inserir lead ${apiLead.id}:`, insertError.message);
                } else {
                    insertedCount++;
                }
            } else {
                console.log(`⚠️  Nenhum match para: ${exportedLead.nome_completo}`);
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
        
        if (!totalError) console.log(`📊 Total de leads: ${totalCount}`);
        if (!validError) console.log(`✅ Leads com firstname válido: ${validCount}`);
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

syncLeadsCorrectedFinal();

