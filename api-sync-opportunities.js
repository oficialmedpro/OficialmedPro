#!/usr/bin/env node

/**
 * 🌐 API DE SINCRONIZAÇÃO DE OPORTUNIDADES
 * Endpoint: https://sincro.oficialmed.com.br/oportunidades
 * Executa automaticamente via cronjob do Supabase
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// 🔐 FUNÇÃO PARA LER SECRETS (seguindo padrão prime-sync-api)
function readSecret(envVarFile, fallbackEnvVar) {
    try {
        if (envVarFile && fs.existsSync(envVarFile)) {
            const content = fs.readFileSync(envVarFile, 'utf8').trim();
            console.log(`✅ Secret lido de: ${envVarFile}`);
            return content;
        }
    } catch (error) {
        console.warn(`⚠️ Erro ao ler secret ${envVarFile}:`, error.message);
    }
    
    // Fallback para variável de ambiente direta
    const fallbackValue = process.env[fallbackEnvVar];
    if (fallbackValue) {
        console.log(`✅ Usando variável de ambiente: ${fallbackEnvVar}`);
        return fallbackValue;
    }
    
    throw new Error(`❌ Não foi possível ler ${envVarFile} ou ${fallbackEnvVar}`);
}

// 🔐 LER CONFIGURAÇÕES DOS SECRETS
const SUPABASE_URL = readSecret(process.env.SUPABASE_URL_FILE, 'VITE_SUPABASE_URL');
const SUPABASE_KEY = readSecret(process.env.SUPABASE_KEY_FILE, 'VITE_SUPABASE_SERVICE_ROLE_KEY');
const SPRINTHUB_BASE_URL = readSecret(process.env.SPRINTHUB_BASE_URL_FILE, 'VITE_SPRINTHUB_BASE_URL');
const SPRINTHUB_INSTANCE = readSecret(process.env.SPRINTHUB_INSTANCE_FILE, 'VITE_SPRINTHUB_INSTANCE');
const SPRINTHUB_TOKEN = readSecret(process.env.SPRINTHUB_TOKEN_FILE, 'VITE_SPRINTHUB_API_TOKEN');

console.log('🔧 Configurações carregadas:');
console.log(`   Supabase URL: ${SUPABASE_URL}`);
console.log(`   SprintHub: ${SPRINTHUB_BASE_URL}`);
console.log(`   Instância: ${SPRINTHUB_INSTANCE}`);

// Configuração Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: 'api' }
});

// Configuração SprintHub
const SPRINTHUB_CONFIG = {
    baseUrl: SPRINTHUB_BASE_URL,
    instance: SPRINTHUB_INSTANCE,
    apiToken: SPRINTHUB_TOKEN
};

// Configuração dos funis
const FUNIS_CONFIG = {
    6: {
        name: '[1] COMERCIAL APUCARANA',
        stages: [130, 231, 82, 207, 83, 85, 232]
    },
    14: {
        name: '[2] RECOMPRA',
        stages: [227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150]
    }
};

const PAGE_LIMIT = 100;
const DELAY_BETWEEN_PAGES = 2000;
const DELAY_BETWEEN_STAGES = 1000;

// Função para buscar oportunidades de uma etapa
async function fetchOpportunitiesFromStage(funnelId, stageId, page = 0, limit = PAGE_LIMIT) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`;
    
    try {
        const postData = JSON.stringify({ page, limit, columnId: stageId });
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: postData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
        
    } catch (error) {
        console.error(`❌ Erro ao buscar etapa ${stageId} do funil ${funnelId}:`, error.message);
        return [];
    }
}

// Função para mapear campos da oportunidade
function mapOpportunityFields(opportunity, funnelId) {
    const fields = opportunity.fields || {};
    const lead = opportunity.dataLead || {};
    const utmTags = (lead.utmTags && lead.utmTags[0]) || {};

    return {
        id: opportunity.id,
        title: opportunity.title,
        value: parseFloat(opportunity.value) || 0.00,
        crm_column: opportunity.crm_column,
        lead_id: opportunity.lead_id,
        firstname: lead.firstname || null,
        lastname: lead.lastname || null,
        email: lead.email || null,
        phone: lead.phone || null,
        mobile: lead.mobile || null,
        whatsapp: lead.whatsapp || null,
        address: lead.address || null,
        city: lead.city || null,
        state: lead.state || null,
        zipcode: lead.zipcode || null,
        country: lead.country || null,
        company: lead.company || null,
        funil_id: funnelId,
        status: opportunity.status || null,
        origem: lead.origin || null,
        categoria: lead.category || null,
        segmento: lead.segment || null,
        stage: lead.stage || null,
        observacao: lead.observation || null,
        produto: lead.product || null,
        utm_source: utmTags.utm_source || null,
        utm_medium: utmTags.utm_medium || null,
        utm_campaign: utmTags.utm_campaign || null,
        utm_content: utmTags.utm_content || null,
        utm_term: utmTags.utm_term || null,
        create_date: opportunity.createDate ? new Date(opportunity.createDate).toISOString() : null,
        update_date: opportunity.updateDate ? new Date(opportunity.updateDate).toISOString() : null,
        synced_at: new Date().toISOString()
    };
}

// Função para inserir/atualizar oportunidade
async function insertOrUpdateOpportunity(opportunityData) {
    try {
        const { data, error } = await supabase
            .from('oportunidade_sprint')
            .upsert(opportunityData, { onConflict: 'id', ignoreDuplicates: false })
            .select();

        if (error) {
            console.error(`❌ Erro na inserção/atualização da oportunidade ${opportunityData.id}:`, error.message);
            return { success: false, error: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error(`❌ Erro inesperado ao inserir/atualizar oportunidade ${opportunityData.id}:`, error.message);
        return { success: false, error: error.message };
    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Função principal de sincronização
async function syncOpportunities() {
    console.log('🚀 Iniciando sincronização de oportunidades via API...');
    
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    
    // Processar cada funil
    for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
        console.log(`\n📊 Processando Funil ${funnelId}: ${funnelConfig.name}`);
        console.log(`   Etapas: ${funnelConfig.stages.length}`);
        
        // Processar cada etapa do funil
        for (const stageId of funnelConfig.stages) {
            console.log(`\n   🔄 Etapa ${stageId}...`);
            let page = 0;
            let hasMore = true;
            
            while (hasMore) {
                const opportunities = await fetchOpportunitiesFromStage(funnelId, stageId, page);
                
                if (!opportunities || opportunities.length === 0) {
                    hasMore = false;
                    break;
                }
                
                console.log(`     📄 Página ${page + 1}: ${opportunities.length} oportunidades`);
                
                // Processar cada oportunidade
                for (const opportunity of opportunities) {
                    totalProcessed++;
                    const mappedOpportunity = mapOpportunityFields(opportunity, funnelId);
                    const result = await insertOrUpdateOpportunity(mappedOpportunity);
                    
                    if (result.success) {
                        if (result.data && result.data.length > 0) {
                            totalInserted++;
                        } else {
                            totalUpdated++;
                        }
                    } else {
                        totalErrors++;
                    }
                }
                
                page++;
                await sleep(DELAY_BETWEEN_PAGES);
            }
            
            console.log(`     ✅ Etapa ${stageId} concluída`);
            await sleep(DELAY_BETWEEN_STAGES);
        }
        
        console.log(`✅ Funil ${funnelId} concluído`);
    }
    
    return {
        totalProcessed,
        totalInserted,
        totalUpdated,
        totalErrors
    };
}

// Endpoint principal (compatível com Traefik StripPrefix e sem StripPrefix)
const handleSync = async (req, res) => {
    const startTime = new Date();
    console.log(`\n🕒 [${startTime.toISOString()}] Iniciando sincronização de oportunidades...`);
    
    try {
        const result = await syncOpportunities();
        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;
        
        console.log(`✅ [${endTime.toISOString()}] Sincronização concluída em ${duration.toFixed(2)}s`);
        console.log(`📊 Processadas: ${result.totalProcessed}, Inseridas: ${result.totalInserted}, Atualizadas: ${result.totalUpdated}, Erros: ${result.totalErrors}`);
        
        res.json({
            success: true,
            message: 'Sincronização de oportunidades concluída com sucesso',
            data: {
                ...result,
                duration: `${duration.toFixed(2)}s`,
                timestamp: endTime.toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Erro na sincronização de oportunidades:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na sincronização de oportunidades',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
app.get('/oportunidades', handleSync);
app.get('/', handleSync);

// Endpoint de status (compatível com Traefik StripPrefix)
const handleStatus = async (req, res) => {
    try {
        const { count, error } = await supabase.from('oportunidade_sprint').select('*', { count: 'exact', head: true });
        
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            data: {
                totalOpportunities: count,
                lastCheck: new Date().toISOString()
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar status',
            error: error.message
        });
    }
};
app.get('/oportunidades/status', handleStatus);
app.get('/status', handleStatus);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'API Sync Opportunities',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 API de sincronização de oportunidades rodando na porta ${PORT}`);
    console.log(`📡 Endpoints disponíveis:`);
    console.log(`   GET /oportunidades  | /  - Sincronizar oportunidades`);
    console.log(`   GET /oportunidades/status  | /status - Status das oportunidades`);
    console.log(`   GET /health - Health check`);
});

module.exports = app;

