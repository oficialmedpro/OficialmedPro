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

// Controle simples de lock e métricas em memória (réplica única)
let isSyncRunning = false;
let lastRun = { resource: null, start: null, end: null, status: 'idle', durationMs: 0 };

// 🔐 FUNÇÃO PARA LER SECRETS (compatível com Portainer secrets e EasyPanel env vars)
function readSecret(envVarFile, fallbackEnvVars) {
    // Se envVarFile existe e é um arquivo, ler do arquivo (Portainer secrets)
    try {
        if (envVarFile && fs.existsSync(envVarFile)) {
            const content = fs.readFileSync(envVarFile, 'utf8').trim();
            console.log(`✅ Secret lido de: ${envVarFile}`);
            return content;
        }
    } catch (error) {
        console.warn(`⚠️ Erro ao ler secret ${envVarFile}:`, error.message);
    }
    
    // Fallback para variáveis de ambiente diretas (EasyPanel ou desenvolvimento)
    // fallbackEnvVars pode ser string ou array
    const fallbacks = Array.isArray(fallbackEnvVars) ? fallbackEnvVars : [fallbackEnvVars];
    
    for (const fallbackEnvVar of fallbacks) {
        const fallbackValue = process.env[fallbackEnvVar];
        if (fallbackValue) {
            console.log(`✅ Usando variável de ambiente: ${fallbackEnvVar}`);
            return fallbackValue;
        }
    }
    
    throw new Error(`❌ Não foi possível ler ${envVarFile} ou variáveis: ${fallbacks.join(', ')}`);
}

// 🔐 LER CONFIGURAÇÕES DOS SECRETS (compatível com Portainer secrets e EasyPanel env vars)
const SUPABASE_URL = readSecret(process.env.SUPABASE_URL_FILE, ['SUPABASE_URL', 'VITE_SUPABASE_URL']);
const SUPABASE_KEY = readSecret(process.env.SUPABASE_KEY_FILE, ['SUPABASE_KEY', 'VITE_SUPABASE_SERVICE_ROLE_KEY']);
const SPRINTHUB_BASE_URL = readSecret(process.env.SPRINTHUB_BASE_URL_FILE, ['SPRINTHUB_BASE_URL', 'VITE_SPRINTHUB_BASE_URL']);
const SPRINTHUB_INSTANCE = readSecret(process.env.SPRINTHUB_INSTANCE_FILE, ['SPRINTHUB_INSTANCE', 'VITE_SPRINTHUB_INSTANCE']);
const SPRINTHUB_TOKEN = readSecret(process.env.SPRINTHUB_TOKEN_FILE, ['SPRINTHUB_TOKEN', 'VITE_SPRINTHUB_API_TOKEN']);

console.log('🔧 Configurações carregadas:');
console.log(`   Supabase URL: ${SUPABASE_URL}`);
console.log(`   SprintHub: ${SPRINTHUB_BASE_URL}`);
console.log(`   Instância: ${SPRINTHUB_INSTANCE}`);

// Configuração Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: 'api' }
});
// Helpers de log (api.sync_runs)
async function logRunStart(resource) {
    try {
        const { data, error } = await supabase
            .from('sync_runs')
            .insert({ resource, status: 'running' })
            .select('id')
            .single();
        if (!error && data) return data.id;
    } catch {}
    return null;
}

async function logRunFinish(runId, payload) {
    if (!runId) return;
    try {
        await supabase
            .from('sync_runs')
            .update({ ...payload, finished_at: new Date().toISOString() })
            .eq('id', runId);
    } catch {}
}

// Configuração SprintHub
const SPRINTHUB_CONFIG = {
    baseUrl: SPRINTHUB_BASE_URL,
    instance: SPRINTHUB_INSTANCE,
    apiToken: SPRINTHUB_TOKEN
};

// =============== LEADS (mesmo serviço) ==================
const LEADS_PAGE_LIMIT = 100;
let LEADS_DELAY_BETWEEN_PAGES = 500;

async function fetchLeadsFromSprintHub(page = 0, limit = LEADS_PAGE_LIMIT) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?i=${SPRINTHUB_CONFIG.instance}&page=${page}&limit=${limit}&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        // Suportar formatos diferentes
        if (Array.isArray(data)) return data;
        if (data?.data?.leads) return data.data.leads;
        return [];
    } catch (e) {
        console.error(`❌ Erro ao buscar leads página ${page + 1}:`, e.message);
        return [];
    }
}

function mapLeadToSupabase(lead) {
    return {
        id: lead.id,
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
        status: lead.status || null,
        origem: lead.origin || null,
        categoria: lead.category || null,
        segmento: lead.segment || null,
        stage: lead.stage || null,
        observacao: lead.observation || null,
        produto: lead.product || null,
        create_date: lead.createDate ? new Date(lead.createDate).toISOString() : null,
        updated_date: lead.updateDate ? new Date(lead.updateDate).toISOString() : null,
        synced_at: new Date().toISOString()
    };
}

async function upsertLeadsBatch(rows) {
    try {
        const { error } = await supabase.from('leads').upsert(rows, { onConflict: 'id', ignoreDuplicates: false });
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function syncLeads() {
    const runId = await logRunStart('leads');
    let page = 0;
    let processed = 0, errors = 0;
    while (true) {
        const batch = await fetchLeadsFromSprintHub(page);
        if (!batch || batch.length === 0) break;
        const mapped = batch.map(mapLeadToSupabase);
        processed += mapped.length;
        const r = await upsertLeadsBatch(mapped);
        if (!r.success) {
            errors += mapped.length;
            LEADS_DELAY_BETWEEN_PAGES = Math.min(LEADS_DELAY_BETWEEN_PAGES * 2, 8000);
        } else {
            LEADS_DELAY_BETWEEN_PAGES = Math.max(Math.floor(LEADS_DELAY_BETWEEN_PAGES / 2), 400);
        }
        page++;
        await sleep(LEADS_DELAY_BETWEEN_PAGES);
    }
    await logRunFinish(runId, {
        status: errors > 0 ? 'success_with_errors' : 'success',
        total_processed: processed,
        total_errors: errors
    });
    return { totalProcessed: processed, totalErrors: errors };
}

app.get('/leads', async (_req, res) => {
    try {
        const result = await syncLeads();
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/leads/status', async (_req, res) => {
    try {
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true });
        res.json({ success: true, data: { totalLeads: count, lastCheck: new Date().toISOString() } });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// =============== SEGMENTOS (básico) ==================
async function fetchSegments(page = 0, limit = 100) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/segments?i=${SPRINTHUB_CONFIG.instance}&page=${page}&limit=${limit}&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) return data;
        if (data?.data?.segments) return data.data.segments;
        return [];
    } catch (e) {
        console.warn('⚠️ Segments endpoint possivelmente indisponível:', e.message);
        return [];
    }
}

async function upsertSegments(rows) {
    try {
        // Tabela correta é 'segmento' (singular), não 'segmentos' (plural)
        const { error } = await supabase.from('segmento').upsert(rows, { onConflict: 'id', ignoreDuplicates: false });
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function syncSegments() {
    const runId = await logRunStart('segmentos');
    let page = 0, processed = 0, errors = 0;
    while (true) {
        const batch = await fetchSegments(page);
        if (!batch || batch.length === 0) break;
        // Mapear para campos corretos da tabela 'segmento' (sem synced_at, usa create_date)
        const mapped = batch.map((s) => ({ 
            id: s.id, 
            name: s.name || s.title || null,
            alias: s.alias || null,
            is_published: s.is_published || s.published || false,
            create_date: s.create_date || s.createDate || new Date().toISOString(),
            category_id: s.category_id || s.categoryId || null,
            category_title: s.category_title || s.categoryTitle || s.category || null,
            total_leads: s.total_leads || s.totalLeads || null,
            last_lead_update: s.last_lead_update || s.lastLeadUpdate || null
        }));
        processed += mapped.length;
        const r = await upsertSegments(mapped);
        if (!r.success) errors += mapped.length;
        page++;
        await sleep(500);
    }
    await logRunFinish(runId, { status: errors > 0 ? 'success_with_errors' : 'success', total_processed: processed, total_errors: errors });
    return { totalProcessed: processed, totalErrors: errors };
}

app.get('/segmentos', async (_req, res) => {
    try { const result = await syncSegments(); res.json({ success: true, data: result }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// =============== VENDEDORES/USUÁRIOS ==================
async function fetchUsersFromSprintHub(page = 0, limit = 100) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/users?i=${SPRINTHUB_CONFIG.instance}&page=${page}&limit=${limit}&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) return data;
        if (data?.data?.users) return data.data.users;
        return [];
    } catch (e) {
        console.error(`❌ Erro ao buscar usuários página ${page + 1}:`, e.message);
        return [];
    }
}

function mapUserToVendedor(user) {
    return {
        id_sprint: user.id,
        nome: user.fullname || user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim() || null,
        email: user.email || null,
        usuario: user.username || user.email?.split('@')[0] || null,
        id_unidade: user.unit || user.unidade || '[1]',
        tipo_de_acesso: user.role === 'admin' || user.type === 'administrador' ? 'administrador' : 'vendedor',
        status: user.status === 'active' || user.active ? 'ativo' : 'inativo',
        foto: user.avatar || user.photo || null,
        telefone: user.phone || user.telefone || null,
        created_at: user.createDate ? new Date(user.createDate).toISOString() : new Date().toISOString(),
        updated_at: user.updateDate ? new Date(user.updateDate).toISOString() : new Date().toISOString()
    };
}

async function upsertVendedores(rows) {
    try {
        // Primeiro tentar por id_sprint, se não existir constraint, usar email
        let error = null;
        try {
            const { error: err } = await supabase.from('vendedores').upsert(rows, { onConflict: 'id_sprint', ignoreDuplicates: false });
            error = err;
        } catch (e) {
            // Se não tiver constraint em id_sprint, usar email
            const { error: err } = await supabase.from('vendedores').upsert(rows, { onConflict: 'email', ignoreDuplicates: false });
            error = err;
        }
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function syncVendedores() {
    const runId = await logRunStart('vendedores');
    let page = 0, processed = 0, errors = 0;
    while (true) {
        const batch = await fetchUsersFromSprintHub(page);
        if (!batch || batch.length === 0) break;
        const mapped = batch.map(mapUserToVendedor);
        processed += mapped.length;
        const r = await upsertVendedores(mapped);
        if (!r.success) errors += mapped.length;
        page++;
        await sleep(500);
    }
    await logRunFinish(runId, { status: errors > 0 ? 'success_with_errors' : 'success', total_processed: processed, total_errors: errors });
    return { totalProcessed: processed, totalErrors: errors };
}

app.get('/vendedores', async (_req, res) => {
    try { const result = await syncVendedores(); res.json({ success: true, data: result }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Configuração dos funis
const FUNIS_CONFIG = {
    6: {
        name: '[1] COMERCIAL APUCARANA',
        stages: [130, 231, 82, 207, 83, 85, 232]
    },
    9: {
        name: '[1] LOGÍSTICA MANIPULAÇÃO',
        stages: [101, 243, 266, 244, 245, 105, 108, 267, 109, 261, 262, 263, 278, 110]
    },
    14: {
        name: '[2] RECOMPRA',
        stages: [202, 228, 229, 206, 203, 204, 230, 205, 269, 167, 148, 168, 149, 169, 150]
    }
};

const PAGE_LIMIT = 100;
let DELAY_BETWEEN_PAGES = 500; // ajustável por backoff
const DELAY_BETWEEN_STAGES = 400;
const MAX_BACKOFF_MS = 8000;
const MIN_BACKOFF_MS = 500;
const CONCURRENCY_PAGES = 1; // manter 1 por segurança inicial (Traefik + origem)

// Função para buscar oportunidades de uma etapa
async function fetchOpportunitiesFromStage(funnelId, stageId, page = 0, limit = PAGE_LIMIT) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`;
    
    try {
        // Tentar usar filtros incrementais, quando suportados pelo SprintHub
        const incrementalHints = {};
        if (globalThis.__LAST_UPDATE_PER_STAGE && globalThis.__LAST_UPDATE_PER_STAGE[`${funnelId}:${stageId}`]) {
            const since = globalThis.__LAST_UPDATE_PER_STAGE[`${funnelId}:${stageId}`];
            // Alguns backends usam nomes diferentes; enviamos todos de maneira inofensiva
            incrementalHints.updatedSince = since;
            incrementalHints.modifiedSince = since;
            incrementalHints.lastUpdate = since;
        }
        const payloadObject = { page, limit, columnId: stageId, ...incrementalHints };
        const postData = JSON.stringify(payloadObject);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json'
            },
            body: Buffer.from(postData)
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            throw new Error(`HTTP ${response.status}: ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`);
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
        gain_date: opportunity.gain_date ? new Date(opportunity.gain_date).toISOString() : null,
        lost_date: opportunity.lost_date ? new Date(opportunity.lost_date).toISOString() : null,
        synced_at: new Date().toISOString()
    };
}

// Upsert em lote (Prefer: return=minimal)
async function upsertBatch(opportunitiesBatch) {
    try {
        const { error } = await supabase
            .from('oportunidade_sprint')
            .upsert(opportunitiesBatch, { onConflict: 'id', ignoreDuplicates: false });
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Função principal de sincronização
async function syncOpportunities() {
    console.log('🚀 Iniciando sincronização de oportunidades via API...');
    const runId = await logRunStart('oportunidades');
    lastRun = { resource: 'oportunidades', start: Date.now(), end: null, status: 'running', durationMs: 0 };
    
    let totalProcessed = 0;
    let totalInserted = 0; // estimado (não retornamos linhas)
    let totalUpdated = 0;  // estimado
    let totalErrors = 0;
    
    // Carregar last_update por etapa do Supabase para tentar incremental na origem
    globalThis.__LAST_UPDATE_PER_STAGE = {};
    try {
        const { data: lastStages } = await supabase
            .from('oportunidade_sprint')
            .select('crm_column, funil_id, update_date')
            .order('update_date', { ascending: false })
            .limit(1);
        // consulta simples acima é só para aquecer a conexão; abaixo, faremos por etapa
    } catch {}

    const stageLastUpdateCache = async (funnelId, stageId) => {
        const key = `${funnelId}:${stageId}`;
        if (globalThis.__LAST_UPDATE_PER_STAGE[key]) return globalThis.__LAST_UPDATE_PER_STAGE[key];
        try {
            const { data, error } = await supabase
                .from('oportunidade_sprint')
                .select('update_date')
                .eq('funil_id', funnelId)
                .eq('crm_column', stageId)
                .order('update_date', { ascending: false })
                .limit(1);
            if (!error && data && data.length > 0 && data[0].update_date) {
                const since = new Date(data[0].update_date).toISOString();
                globalThis.__LAST_UPDATE_PER_STAGE[key] = since;
            }
        } catch {}
        return globalThis.__LAST_UPDATE_PER_STAGE[key];
    };

    // Processar cada funil
    for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
        console.log(`\n📊 Processando Funil ${funnelId}: ${funnelConfig.name}`);
        console.log(`   Etapas: ${funnelConfig.stages.length}`);
        
        // Processar cada etapa do funil
        for (const stageId of funnelConfig.stages) {
            console.log(`\n   🔄 Etapa ${stageId}...`);
            await stageLastUpdateCache(Number(funnelId), stageId);
            let page = 0;
            let hasMore = true;
            
            while (hasMore) {
                try {
                    const opportunities = await fetchOpportunitiesFromStage(funnelId, stageId, page);
                    if (!opportunities || opportunities.length === 0) {
                        hasMore = false;
                        break;
                    }
                    console.log(`     📄 Página ${page + 1}: ${opportunities.length} oportunidades`);

                    // Mapear e fazer upsert em lote
                    const mapped = opportunities.map((o) => mapOpportunityFields(o, funnelId));
                    totalProcessed += mapped.length;

                    const upsertRes = await upsertBatch(mapped);
                    if (!upsertRes.success) {
                        totalErrors += mapped.length;
                        console.error(`❌ Erro upsert em lote (página ${page + 1}, etapa ${stageId}):`, upsertRes.error);
                        // backoff simples
                        DELAY_BETWEEN_PAGES = Math.min(DELAY_BETWEEN_PAGES * 2, MAX_BACKOFF_MS);
                        await sleep(DELAY_BETWEEN_PAGES);
                    } else {
                        // ajuste heurístico: considerar tudo como atualizado
                        totalUpdated += mapped.length;
                        // reduzir delay se estava alto
                        DELAY_BETWEEN_PAGES = Math.max(Math.floor(DELAY_BETWEEN_PAGES / 2), MIN_BACKOFF_MS);
                        await sleep(DELAY_BETWEEN_PAGES);
                    }

                    page++;
                } catch (err) {
                    console.error(`❌ Falha na página ${page + 1} da etapa ${stageId}:`, err.message);
                    totalErrors += PAGE_LIMIT;
                    DELAY_BETWEEN_PAGES = Math.min(DELAY_BETWEEN_PAGES * 2, MAX_BACKOFF_MS);
                    await sleep(DELAY_BETWEEN_PAGES);
                    page++;
                }
            }
            
            console.log(`     ✅ Etapa ${stageId} concluída`);
            await sleep(DELAY_BETWEEN_STAGES);
        }
        
        console.log(`✅ Funil ${funnelId} concluído`);
    }
    
    const result = {
        totalProcessed,
        totalInserted,
        totalUpdated,
        totalErrors
    };
    await logRunFinish(runId, {
        status: totalErrors > 0 ? 'success_with_errors' : 'success',
        total_processed: totalProcessed,
        total_inserted: totalInserted,
        total_updated: totalUpdated,
        total_errors: totalErrors,
        details: { page_delay_ms: DELAY_BETWEEN_PAGES }
    });
    lastRun.end = Date.now();
    lastRun.status = totalErrors > 0 ? 'success_with_errors' : 'success';
    lastRun.durationMs = lastRun.end - lastRun.start;
    return result;
}

// Endpoint principal (compatível com Traefik StripPrefix e sem StripPrefix)
const handleSync = async (req, res) => {
    if (isSyncRunning) {
        return res.json({
            success: true,
            message: 'Execução já está em andamento',
            data: lastRun
        });
    }

    const startTime = new Date();
    console.log(`\n🕒 [${startTime.toISOString()}] Iniciando sincronização de oportunidades...`);

    isSyncRunning = true;
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
        try {
            await logRunFinish(undefined, {}); // no-op
        } catch {}
        res.status(500).json({
            success: false,
            message: 'Erro na sincronização de oportunidades',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    } finally {
        isSyncRunning = false;
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

// Métricas e lock
app.get('/oportunidades/metrics', (_req, res) => {
    res.json({ running: isSyncRunning, last: lastRun });
});
app.get('/metrics', (_req, res) => {
    res.json({ running: isSyncRunning, last: lastRun });
});

// Orquestrador sequencial com lock
app.get('/sync/all', async (_req, res) => {
    if (isSyncRunning) return res.json({ success: true, message: 'Execução já em andamento' });
    isSyncRunning = true;
    try {
        const results = {};
        results.oportunidades = await syncOpportunities();
        results.leads = await syncLeads();
        results.segmentos = await syncSegments();
        results.vendedores = await syncVendedores();
        res.json({ success: true, data: results });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    } finally {
        isSyncRunning = false;
    }
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

