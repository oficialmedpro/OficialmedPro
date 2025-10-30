#!/usr/bin/env node

/**
 * 🌐 API DE SINCRONIZAÇÃO DE LEADS
 * Endpoint: https://sincro.oficialmed.com.br/leads
 * Executa a cada 30 minutos via cronjob
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    { db: { schema: 'api' } }
);

// Configuração SprintHub
const SPRINTHUB_CONFIG = {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '9ad36c85-5858-4960-9935-e73c3698dd0c'
};

const PAGE_LIMIT = 100;
const DELAY_BETWEEN_PAGES = 2000;

// Função para buscar leads do SprintHub
async function fetchLeadsFromSprintHub(page = 0, limit = PAGE_LIMIT) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?i=${SPRINTHUB_CONFIG.instance}&page=${page}&limit=${limit}&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data?.leads || [];
        
    } catch (error) {
        console.error(`❌ Erro ao buscar leads da página ${page + 1}:`, error.message);
        return [];
    }
}

// Função para mapear lead
function mapLeadToSupabase(sprintHubLead) {
    return {
        id: sprintHubLead.id,
        firstname: sprintHubLead.firstname || null,
        lastname: sprintHubLead.lastname || null,
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
        synced_at: new Date().toISOString()
    };
}

// Função para inserir/atualizar lead
async function insertOrUpdateLead(leadData) {
    try {
        const { data, error } = await supabase
            .from('leads')
            .upsert(leadData, { onConflict: 'id', ignoreDuplicates: false })
            .select();

        if (error) {
            console.error(`❌ Erro na inserção/atualização do lead ${leadData.id}:`, error.message);
            return { success: false, error: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error(`❌ Erro inesperado ao inserir/atualizar lead ${leadData.id}:`, error.message);
        return { success: false, error: error.message };
    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Função principal de sincronização
async function syncLeads() {
    console.log('🚀 Iniciando sincronização de leads via API...');
    
    let page = 0;
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    
    while (true) {
        const leadsPage = await fetchLeadsFromSprintHub(page);
        
        if (!leadsPage || leadsPage.length === 0) {
            console.log('🏁 Nenhuma lead encontrada. Finalizando sincronização.');
            break;
        }
        
        console.log(`📄 Processando página ${page + 1}: ${leadsPage.length} leads`);
        
        for (const sprintHubLead of leadsPage) {
            totalProcessed++;
            const mappedLead = mapLeadToSupabase(sprintHubLead);
            const result = await insertOrUpdateLead(mappedLead);
            
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
        
        console.log(`✅ Página ${page + 1}: ${totalInserted + totalUpdated} processadas, ${totalErrors} erros`);
        
        page++;
        await sleep(DELAY_BETWEEN_PAGES);
    }
    
    return {
        totalProcessed,
        totalInserted,
        totalUpdated,
        totalErrors
    };
}

// Endpoint principal
app.get('/leads', async (req, res) => {
    const startTime = new Date();
    console.log(`\n🕒 [${startTime.toISOString()}] Iniciando sincronização de leads...`);
    
    try {
        const result = await syncLeads();
        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;
        
        console.log(`✅ [${endTime.toISOString()}] Sincronização concluída em ${duration.toFixed(2)}s`);
        console.log(`📊 Processadas: ${result.totalProcessed}, Inseridas: ${result.totalInserted}, Atualizadas: ${result.totalUpdated}, Erros: ${result.totalErrors}`);
        
        res.json({
            success: true,
            message: 'Sincronização de leads concluída com sucesso',
            data: {
                ...result,
                duration: `${duration.toFixed(2)}s`,
                timestamp: endTime.toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Erro na sincronização de leads:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na sincronização de leads',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint de status
app.get('/leads/status', async (req, res) => {
    try {
        const { count, error } = await supabase.from('leads').select('*', { count: 'exact' });
        
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            data: {
                totalLeads: count,
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
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'API Sync Leads',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 API de sincronização de leads rodando na porta ${PORT}`);
    console.log(`📡 Endpoints disponíveis:`);
    console.log(`   GET /leads - Sincronizar leads`);
    console.log(`   GET /leads/status - Status dos leads`);
    console.log(`   GET /health - Health check`);
});

module.exports = app;

