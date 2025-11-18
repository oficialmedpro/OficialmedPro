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
// Body parser apenas para POST/PUT/PATCH, ignorar erros de JSON inválido
app.use((req, res, next) => {
    // Sempre inicializar req.body
    req.body = {};
    
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        // Verificar se há Content-Type JSON
        const contentType = req.get('Content-Type') || '';
        if (!contentType.includes('application/json')) {
            return next();
        }
        
        // Tentar fazer parse do JSON, mas não quebrar se falhar
        express.json({ 
            strict: false,
            limit: '10mb'
        })(req, res, (err) => {
            if (err) {
                console.warn(`⚠️ Erro ao fazer parse do JSON (${req.method} ${req.path}):`, err.message);
                req.body = {}; // Garantir que req.body está vazio em caso de erro
            }
            next();
        });
    } else {
        next();
    }
});

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

const parseDateTime = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const parseDateOnly = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
};

const toInteger = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^-?\d+$/.test(trimmed)) {
            const parsed = parseInt(trimmed, 10);
            return Number.isNaN(parsed) ? null : parsed;
        }
    }
    return null;
};

const toBigIntField = (value) => {
    const parsed = toInteger(value);
    return parsed === null ? null : parsed;
};

async function logMissingFieldEvents(entityType, events = []) {
    if (!events.length) return;
    const payload = events.map((event) => ({
        entity_type: entityType,
        entity_id: String(event.entityId ?? 'unknown'),
        action: 'missing_field',
        status: 'warning',
        payload: {
            field: event.field,
            sample: event.sample ?? null
        },
        metadata: {
            resource: entityType,
            field: event.field,
            sample: event.sample ?? null
        }
    }));

    try {
        for (let i = 0; i < payload.length; i += 100) {
            const chunk = payload.slice(i, i + 100);
            await supabase.from('sprinthub_sync_logs').insert(chunk);
        }
    } catch (error) {
        console.warn('⚠️ Falha ao registrar campos ausentes:', error.message);
    }
}
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

async function registerSyncControl({
    startedAt,
    completedAt,
    totals = {},
    trigger = 'manual_api',
    status = 'success',
    errorMessage = null
}) {
    if (!startedAt) return;

    const safeTotals = {
        totalProcessed: totals.totalProcessed ?? 0,
        totalInserted: totals.totalInserted ?? 0,
        totalUpdated: totals.totalUpdated ?? 0,
        totalErrors: totals.totalErrors ?? 0
    };

    const executionSeconds = completedAt
        ? parseFloat(((completedAt - startedAt) / 1000).toFixed(2))
        : null;

    try {
        await supabase
            .from('sync_control')
            .insert({
                job_name: 'sync_hourly_cron',
                started_at: startedAt.toISOString(),
                completed_at: completedAt ? completedAt.toISOString() : null,
                status: status === 'success_with_errors' ? 'success' : status,
                total_processed: safeTotals.totalProcessed,
                total_inserted: safeTotals.totalInserted,
                total_updated: safeTotals.totalUpdated,
                total_errors: safeTotals.totalErrors,
                execution_time_seconds: executionSeconds,
                error_message: errorMessage || null,
                details: {
                    trigger,
                    source: 'api-sync-opportunities',
                    totals: safeTotals,
                    reportedStatus: status
                }
            });
    } catch (error) {
        console.error('⚠️ Erro ao registrar sync_control:', error.message);
    }

    if (status === 'success' || status === 'success_with_errors') {
        try {
            const description = `Sync manual via API: ${safeTotals.totalProcessed} processadas | ${safeTotals.totalInserted} inseridas | ${safeTotals.totalUpdated} atualizadas | Erros: ${safeTotals.totalErrors}`;
            const timestamp = (completedAt || new Date()).toISOString();
            await supabase
                .from('sincronizacao')
                .insert({
                    created_at: timestamp,
                    data: timestamp,
                    descricao: description
                });
        } catch (error) {
            console.error('⚠️ Erro ao registrar sincronizacao:', error.message);
        }
    }
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
const CRITICAL_LEAD_FIELDS = ['firstname', 'lastname', 'whatsapp'];

async function fetchLeadsFromSprintHub(page = 0, limit = LEADS_PAGE_LIMIT) {
    const params = new URLSearchParams({
        i: SPRINTHUB_CONFIG.instance,
        page: String(page),
        limit: String(limit),
        allFields: '1',
        apitoken: SPRINTHUB_CONFIG.apiToken
    });
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?${params.toString()}`;
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        let leads = [];
        if (Array.isArray(data)) {
            leads = data;
        } else if (data?.data?.leads) {
            leads = data.data.leads;
        } else if (data?.leads) {
            leads = data.leads;
        }
        
        // Debug: log primeiro lead da primeira página para ver estrutura
        if (page === 0 && leads.length > 0) {
            console.log('🔍 DEBUG - Estrutura do primeiro lead recebido:', JSON.stringify(leads[0], null, 2));
            console.log('🔍 DEBUG - Campos disponíveis:', Object.keys(leads[0]).join(', '));
            console.log('🔍 DEBUG - Tem fullname?', !!leads[0].fullname);
            console.log('🔍 DEBUG - Tem contacts?', !!leads[0].contacts);
            if (leads[0].contacts) {
                console.log('🔍 DEBUG - Tipo de contacts:', typeof leads[0].contacts, Array.isArray(leads[0].contacts) ? '(array)' : '(object)');
            }
        }
        
        return leads;
    } catch (e) {
        console.error(`❌ Erro ao buscar leads página ${page + 1}:`, e.message);
        return [];
    }
}

function mapLeadToSupabase(lead, onMissingField = () => {}) {
    // Função helper para buscar campo com variações de nome
    const getField = (field, variations = []) => {
        const allVariations = [field, ...variations];
        for (const variant of allVariations) {
            const value = lead[variant];
            if (value !== null && value !== undefined && value !== '') {
                return value;
            }
        }
        return null;
    };

    // Tentar extrair de fullname se firstname/lastname não existirem
    let firstname = getField('firstname', ['firstName', 'first_name']);
    let lastname = getField('lastname', ['lastName', 'last_name', 'surname', 'sobrenome']);
    
    // Se não tem firstname/lastname, tentar separar fullname
    if (!firstname && !lastname) {
        const fullname = getField('fullname', ['fullName', 'full_name', 'name', 'nome']);
        if (fullname && typeof fullname === 'string' && fullname.trim()) {
            const parts = fullname.trim().split(/\s+/).filter(p => p);
            if (parts.length > 0) {
                firstname = parts[0];
                if (parts.length > 1) {
                    lastname = parts.slice(1).join(' ');
                }
            }
        }
    }
    
    // Se ainda não tem, tentar extrair do email (último recurso)
    if (!firstname && !lastname) {
        const email = getField('email', ['e_mail', 'e-mail']);
        if (email && typeof email === 'string' && email.includes('@')) {
            const emailName = email.split('@')[0];
            const parts = emailName.replace(/[._-]/g, ' ').split(/\s+/).filter(p => p);
            if (parts.length > 0) {
                firstname = parts[0];
                if (parts.length > 1) {
                    lastname = parts.slice(1).join(' ');
                }
            }
        }
    }

    // Buscar telefones - verificar se está em objeto contacts
    let whatsapp = getField('whatsapp', ['whatsApp', 'whats_app']);
    let phone = getField('phone', ['telephone', 'tel']);
    let mobile = getField('mobile', ['cellphone', 'cell']);
    
    // Se não encontrou, tentar em contacts (array ou objeto)
    if (!whatsapp && !phone && !mobile && lead.contacts) {
        if (Array.isArray(lead.contacts)) {
            // Se contacts é array, buscar o primeiro com tipo whatsapp
            const whatsappContact = lead.contacts.find(c => c.type === 'whatsapp' || c.type === 'WhatsApp');
            const phoneContact = lead.contacts.find(c => c.type === 'phone' || c.type === 'Phone');
            const mobileContact = lead.contacts.find(c => c.type === 'mobile' || c.type === 'Mobile');
            
            whatsapp = whatsappContact?.value || whatsappContact?.phone || whatsappContact?.number || null;
            phone = phoneContact?.value || phoneContact?.phone || phoneContact?.number || null;
            mobile = mobileContact?.value || mobileContact?.phone || mobileContact?.number || null;
        } else if (typeof lead.contacts === 'object') {
            // Se contacts é objeto
            whatsapp = lead.contacts.whatsapp || lead.contacts.whatsApp || null;
            phone = lead.contacts.phone || null;
            mobile = lead.contacts.mobile || null;
        }
    }
    
    // Se ainda não encontrou whatsapp, tentar mobile ou phone como fallback
    if (!whatsapp) {
        whatsapp = mobile || phone || null;
    }

    const email = getField('email', ['e_mail', 'e-mail']);

    // Verificar campos críticos
    CRITICAL_LEAD_FIELDS.forEach((field) => {
        let value = null;
        if (field === 'firstname') value = firstname;
        else if (field === 'lastname') value = lastname;
        else if (field === 'whatsapp') value = whatsapp;
        
        if (!value || (typeof value === 'string' && !value.trim())) {
            onMissingField(field, {
                id: lead.id,
                email: email || null,
                whatsapp: whatsapp || null
            });
        }
    });

    return {
        id: toBigIntField(lead.id),
        firstname: firstname ? String(firstname).trim() : null,
        lastname: lastname ? String(lastname).trim() : null,
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        mobile: mobile ? String(mobile).trim() : null,
        whatsapp: whatsapp ? String(whatsapp).trim() : null,
        photo_url: lead.photoUrl ?? null,
        address: lead.address ?? null,
        city: lead.city ?? null,
        state: lead.state ?? null,
        zipcode: lead.zipcode ?? null,
        country: lead.country ?? null,
        timezone: lead.timezone ?? null,
        bairro: lead.bairro ?? null,
        complemento: lead.complemento ?? null,
        numero_entrega: lead.numero_entrega ?? null,
        rua_entrega: lead.rua_entrega ?? null,
        company: lead.company ?? null,
        points: toInteger(lead.points) ?? 0,
        owner: toBigIntField(lead.owner),
        stage: lead.stage ?? null,
        preferred_locale: lead.preferred_locale ?? null,
        user_access: lead.userAccess ?? null,
        department_access: lead.departmentAccess ?? null,
        ignore_sub_departments: Boolean(lead.ignoreSubDepartments),
        create_date: parseDateTime(lead.createDate),
        updated_date: parseDateTime(lead.updatedDate),
        last_active: parseDateTime(lead.lastActive),
        created_by: toBigIntField(lead.createdBy),
        created_by_name: lead.createdByName ?? null,
        created_by_type: lead.createdByType ?? null,
        updated_by: toBigIntField(lead.updatedBy),
        updated_by_name: lead.updatedByName ?? null,
        synced_at: new Date().toISOString(),
        archived: Boolean(lead.archived),
        third_party_data: lead.thirdPartyData ?? null,
        categoria: lead.categoria ?? lead.category ?? null,
        origem: lead.origem ?? lead.origin ?? null,
        observacao: lead.observacao ?? lead.observation ?? null,
        produto: lead.produto ?? lead.product ?? null,
        segmento: lead.segmento ?? lead.segment ?? null,
        data_de_nascimento: parseDateOnly(lead.data_de_nascimento),
        data_do_contato: parseDateOnly(lead.data_do_contato)
    };
}

// Função para buscar detalhes completos de um lead individual
async function fetchLeadDetails(leadId) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads/${leadId}?i=${SPRINTHUB_CONFIG.instance}&allFields=1&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            }
        });
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        // A resposta pode vir em diferentes estruturas
        return data?.data?.lead || data?.data || data?.lead || data || null;
    } catch (e) {
        console.warn(`⚠️ Erro ao buscar detalhes do lead ${leadId}:`, e.message);
        return null;
    }
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
    console.log('\n📊 Iniciando sincronização de LEADS...\n');
    const runId = await logRunStart('leads');
    let page = 0;
    let processed = 0, errors = 0;
    const missingFieldCounts = {};
    const missingFieldEvents = [];

    while (true) {
        const batch = await fetchLeadsFromSprintHub(page);
        if (!batch || batch.length === 0) {
            console.log('✅ Sincronização de leads concluída');
            break;
        }

        // Primeiro mapear todos os leads
        const mapped = batch.map((lead) =>
            mapLeadToSupabase(lead, (field, sample) => {
                missingFieldCounts[field] = (missingFieldCounts[field] || 0) + 1;
                missingFieldEvents.push({
                    entityId: lead.id,
                    field,
                    sample
                });
            })
        );

        // Buscar detalhes individuais para TODOS os leads sem campos críticos
        const leadsWithoutFields = mapped.filter(lead => 
            !lead.firstname && !lead.lastname && !lead.whatsapp
        );

        if (leadsWithoutFields.length > 0) {
            console.log(`🔍 Buscando detalhes individuais de ${leadsWithoutFields.length} leads sem campos críticos (página ${page + 1})...`);
            let updated = 0;
            for (const lead of leadsWithoutFields) {
                try {
                    const details = await fetchLeadDetails(lead.id);
                    if (details) {
                        // A resposta pode vir em data.lead ou diretamente
                        const leadData = details.lead || details.data?.lead || details;
                        // Tentar mapear novamente com os detalhes completos
                        const remapped = mapLeadToSupabase(leadData, () => {});
                        // Atualizar o lead no array mapped
                        const index = mapped.findIndex(l => l.id === lead.id);
                        if (index >= 0) {
                            mapped[index] = { ...mapped[index], ...remapped };
                            updated++;
                            if (updated <= 3) { // Log apenas os primeiros 3 para não poluir
                                console.log(`✅ Lead ${lead.id} atualizado: firstname=${remapped.firstname || 'null'}, lastname=${remapped.lastname || 'null'}, whatsapp=${remapped.whatsapp || 'null'}`);
                            }
                        }
                    }
                } catch (err) {
                    console.warn(`⚠️ Erro ao buscar detalhes do lead ${lead.id}:`, err.message);
                }
                await sleep(100); // Delay reduzido entre buscas individuais
            }
            if (updated > 0) {
                console.log(`✅ ${updated} de ${leadsWithoutFields.length} leads atualizados com detalhes individuais`);
            }
        }

        processed += mapped.length;
        const r = await upsertLeadsBatch(mapped);
        if (!r.success) {
            errors += mapped.length;
            console.error(`❌ Erro na página ${page + 1} de leads: ${r.error}`);
            LEADS_DELAY_BETWEEN_PAGES = Math.min(LEADS_DELAY_BETWEEN_PAGES * 2, 8000);
        } else {
            console.log(`✅ Página ${page + 1} de leads: ${mapped.length} processados (Total: ${processed})`);
            LEADS_DELAY_BETWEEN_PAGES = Math.max(Math.floor(LEADS_DELAY_BETWEEN_PAGES / 2), 400);
        }
        page++;
        await sleep(LEADS_DELAY_BETWEEN_PAGES);
    }

    await logMissingFieldEvents('lead', missingFieldEvents);

    await logRunFinish(runId, {
        status: errors > 0 ? 'success_with_errors' : 'success',
        total_processed: processed,
        total_errors: errors,
        details: { missingFields: missingFieldCounts }
    });
    return { totalProcessed: processed, totalErrors: errors, missingFields: missingFieldCounts };
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
        const response = await fetch(url, { 
            headers: { 
                'Accept': 'application/json',
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            }
        });
        if (!response.ok) {
            if (response.status === 502 || response.status === 503) {
                console.warn(`⚠️ Segments endpoint temporariamente indisponível (HTTP ${response.status}), tentando novamente...`);
                await sleep(2000); // Aguardar 2 segundos antes de retry
                // Retry uma vez
                const retryResponse = await fetch(url, { 
                    headers: { 
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                        'apitoken': SPRINTHUB_CONFIG.apiToken
                    }
                });
                if (!retryResponse.ok) {
                    throw new Error(`HTTP ${retryResponse.status} (após retry)`);
                }
                const retryData = await retryResponse.json();
                if (Array.isArray(retryData)) return retryData;
                if (retryData?.data?.segments) return retryData.data.segments;
                return [];
            }
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) return data;
        if (data?.data?.segments) return data.data.segments;
        return [];
    } catch (e) {
        console.warn(`⚠️ Erro ao buscar segmentos página ${page + 1}:`, e.message);
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
    console.log('\n📊 Iniciando sincronização de SEGMENTOS...\n');
    const runId = await logRunStart('segmentos');
    let page = 0, processed = 0, errors = 0;
    while (true) {
        const batch = await fetchSegments(page);
        if (!batch || batch.length === 0) {
            console.log('✅ Sincronização de segmentos concluída');
            break;
        }
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
        if (!r.success) {
            errors += mapped.length;
            console.error(`❌ Erro na página ${page + 1} de segmentos: ${r.error}`);
        } else {
            console.log(`✅ Página ${page + 1} de segmentos: ${mapped.length} processados (Total: ${processed})`);
        }
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
    // NOTA: O endpoint /users não existe na API do SprintHub
    // Esta função é mantida apenas para compatibilidade, mas sempre retorna vazio
    console.warn(`⚠️ Endpoint /users não disponível na API SprintHub (página ${page + 1})`);
    return [];
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
    console.log('\n📊 Iniciando sincronização de VENDEDORES...\n');
    const runId = await logRunStart('vendedores');
    let page = 0, processed = 0, errors = 0;
    while (true) {
        const batch = await fetchUsersFromSprintHub(page);
        if (!batch || batch.length === 0) {
            console.log('✅ Sincronização de vendedores concluída');
            break;
        }
        const mapped = batch.map(mapUserToVendedor);
        processed += mapped.length;
        const r = await upsertVendedores(mapped);
        if (!r.success) {
            errors += mapped.length;
            console.error(`❌ Erro na página ${page + 1} de vendedores: ${r.error}`);
        } else {
            console.log(`✅ Página ${page + 1} de vendedores: ${mapped.length} processados (Total: ${processed})`);
        }
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
    },
    34: {
        name: '[1] REATIVAÇÃO COMERCIAL',
        stages: [286, 287, 288, 289, 296]
    },
    38: {
        name: '[1] REATIVAÇÃO COMERCIAL',
        stages: [333, 334, 335, 336, 337, 338, 339, 352]
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
        const payloadObject = { page, limit, columnId: stageId };
        if (process.env.SPRINTHUB_SUPPORTS_INCREMENTAL === 'true'
            && globalThis.__LAST_UPDATE_PER_STAGE
            && globalThis.__LAST_UPDATE_PER_STAGE[`${funnelId}:${stageId}`]) {
            const since = globalThis.__LAST_UPDATE_PER_STAGE[`${funnelId}:${stageId}`];
            payloadObject.modifiedSince = since;
        }
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
        user_id: opportunity.user || null,
        funil_id: funnelId,
        status: opportunity.status || null,
        loss_reason: opportunity.loss_reason || null,
        gain_reason: opportunity.gain_reason || null,
        origem_oportunidade: fields['ORIGEM OPORTUNIDADE'] || null,
        qualificacao: fields['QUALIFICACAO'] || null,
        status_orcamento: fields['Status Orcamento'] || null,
        lead_firstname: lead.firstname || null,
        lead_lastname: lead.lastname || null,
        lead_email: lead.email || null,
        lead_whatsapp: lead.whatsapp || null,
        lead_city: lead.city || null,
        utm_source: utmTags.utmSource || utmTags.source || null,
        utm_medium: utmTags.utmMedium || utmTags.medium || null,
        utm_campaign: utmTags.utmCampaign || utmTags.campaign || null,
        create_date: opportunity.createDate ? new Date(opportunity.createDate).toISOString() : null,
        update_date: opportunity.updateDate ? new Date(opportunity.updateDate).toISOString() : null,
        gain_date: opportunity.gain_date ? new Date(opportunity.gain_date).toISOString() : null,
        lost_date: opportunity.lost_date ? new Date(opportunity.lost_date).toISOString() : null,
        archived: opportunity.archived ?? 0,
        unidade_id: '[1]',
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
    const funisIds = Object.keys(FUNIS_CONFIG).map(Number).sort((a, b) => a - b);
    console.log(`\n📋 Total de funis a processar: ${funisIds.length} (${funisIds.join(', ')})`);
    
    for (const funnelId of funisIds) {
        const funnelConfig = FUNIS_CONFIG[funnelId];
        if (!funnelConfig) {
            console.warn(`⚠️ Configuração não encontrada para Funil ${funnelId}, pulando...`);
            continue;
        }
        
        console.log(`\n📊 Processando Funil ${funnelId}: ${funnelConfig.name}`);
        console.log(`   Etapas: ${funnelConfig.stages.length} (${funnelConfig.stages.join(', ')})`);
        
        let funilProcessed = 0;
        let funilErrors = 0;
        
        // Processar cada etapa do funil
        for (const stageId of funnelConfig.stages) {
            console.log(`\n   🔄 Etapa ${stageId}...`);
            try {
                await stageLastUpdateCache(Number(funnelId), stageId);
                let page = 0;
                let hasMore = true;
                let etapaProcessed = 0;
                
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
                        etapaProcessed += mapped.length;
                        funilProcessed += mapped.length;

                        const upsertRes = await upsertBatch(mapped);
                        if (!upsertRes.success) {
                            totalErrors += mapped.length;
                            funilErrors += mapped.length;
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
                        funilErrors += PAGE_LIMIT;
                        DELAY_BETWEEN_PAGES = Math.min(DELAY_BETWEEN_PAGES * 2, MAX_BACKOFF_MS);
                        await sleep(DELAY_BETWEEN_PAGES);
                        page++;
                    }
                }
                
                if (etapaProcessed === 0) {
                    console.log(`     ℹ️ Etapa ${stageId} concluída (sem oportunidades)`);
                } else {
                    console.log(`     ✅ Etapa ${stageId} concluída (${etapaProcessed} oportunidades)`);
                }
                await sleep(DELAY_BETWEEN_STAGES);
            } catch (err) {
                console.error(`❌ Erro ao processar etapa ${stageId} do Funil ${funnelId}:`, err.message);
                funilErrors++;
            }
        }
        
        console.log(`✅ Funil ${funnelId} concluído (${funilProcessed} processadas, ${funilErrors} erros)`);
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

        const status =
            result.totalErrors > 0 ? 'success_with_errors' : 'success';

        await registerSyncControl({
            startedAt: startTime,
            completedAt: endTime,
            totals: result,
            trigger: 'manual_api',
            status
        });
        
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

        try {
            await registerSyncControl({
                startedAt: startTime,
                completedAt: new Date(),
                totals: { totalProcessed: 0, totalInserted: 0, totalUpdated: 0, totalErrors: 0 },
                trigger: 'manual_api',
                status: 'error',
                errorMessage: error.message
            });
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
async function runFullSync(trigger = 'manual_api') {
    if (isSyncRunning) {
        console.log('⚠️ Sincronização já está em andamento');
        return {
            alreadyRunning: true,
            lastRun
        };
    }

    console.log('\n🚀 ============================================================');
    console.log('🚀 INICIANDO SINCRONIZAÇÃO COMPLETA');
    console.log('🚀 ============================================================');
    console.log(`📅 Trigger: ${trigger}`);
    console.log(`⏰ Início: ${new Date().toISOString()}\n`);

    isSyncRunning = true;
    const startedAt = new Date();
    const summary = {};

    try {
        console.log('\n🔄 Fase 1/3: Sincronizando OPORTUNIDADES...');
        summary.oportunidades = await syncOpportunities();
        console.log(`✅ Oportunidades: ${summary.oportunidades?.totalProcessed || 0} processadas`);
        
        console.log('\n🔄 Fase 2/3: Sincronizando LEADS...');
        summary.leads = await syncLeads();
        console.log(`✅ Leads: ${summary.leads?.totalProcessed || 0} processados`);
        
        console.log('\n🔄 Fase 3/3: Sincronizando SEGMENTOS...');
        try {
            summary.segmentos = await syncSegments();
            console.log(`✅ Segmentos: ${summary.segmentos?.totalProcessed || 0} processados`);
        } catch (segmentError) {
            console.error(`❌ Erro ao sincronizar segmentos (continuando...):`, segmentError.message);
            summary.segmentos = { totalProcessed: 0, totalErrors: 1, error: segmentError.message };
        }
        
        // Vendedores: não há endpoint /users na API do SprintHub
        // Os vendedores são gerenciados diretamente no Supabase
        summary.vendedores = { totalProcessed: 0, totalErrors: 0, message: 'Vendedores não sincronizados - não há endpoint na API SprintHub' };

        const totals = Object.values(summary).reduce((acc, curr = {}) => {
            acc.totalProcessed += curr.totalProcessed || 0;
            acc.totalInserted += curr.totalInserted || 0;
            acc.totalUpdated += curr.totalUpdated || 0;
            acc.totalErrors += curr.totalErrors || 0;
            return acc;
        }, { totalProcessed: 0, totalInserted: 0, totalUpdated: 0, totalErrors: 0 });

        const completedAt = new Date();
        const durationSeconds = (completedAt - startedAt) / 1000;
        
        console.log('\n✅ ============================================================');
        console.log('✅ SINCRONIZAÇÃO COMPLETA FINALIZADA');
        console.log('✅ ============================================================');
        console.log(`📊 Resumo:`);
        console.log(`   Oportunidades: ${summary.oportunidades?.totalProcessed || 0} processadas`);
        console.log(`   Leads: ${summary.leads?.totalProcessed || 0} processados`);
        console.log(`   Segmentos: ${summary.segmentos?.totalProcessed || 0} processados`);
        console.log(`   Vendedores: ${summary.vendedores?.message || 'N/A'}`);
        console.log(`   Total: ${totals.totalProcessed} processados`);
        console.log(`   Erros: ${totals.totalErrors}`);
        console.log(`⏰ Duração: ${Math.round(durationSeconds)}s`);
        console.log(`📅 Fim: ${completedAt.toISOString()}\n`);

        await registerSyncControl({
            startedAt,
            completedAt,
            totals,
            trigger,
            status: totals.totalErrors > 0 ? 'success_with_errors' : 'success'
        });

        return {
            startedAt: startedAt.toISOString(),
            completedAt: completedAt.toISOString(),
            durationSeconds: (completedAt - startedAt) / 1000,
            summary
        };
    } catch (error) {
        const completedAt = new Date();
        await registerSyncControl({
            startedAt,
            completedAt,
            totals: { totalProcessed: 0, totalInserted: 0, totalUpdated: 0, totalErrors: 1 },
            trigger,
            status: 'error',
            errorMessage: error.message
        });
        throw error;
    } finally {
        isSyncRunning = false;
    }
}

const handleFullSync = async (req, res) => {
    try {
        // Para GET, não há body, então usar query params ou default
        const trigger = (req.method === 'GET' ? req.query?.trigger : req.body?.trigger) || 'manual_api';
        const result = await runFullSync(trigger);
        if (result.alreadyRunning) {
            return res.json({
                success: true,
                message: 'Execução já em andamento',
                data: result.lastRun
            });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('❌ Erro na sincronização completa:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

app.post('/sync/all', handleFullSync);
app.get(['/sync/all', '/sync', '/oportunidades/sync', '/oportunidades/sync/all'], handleFullSync);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 API de sincronização de oportunidades rodando na porta ${PORT}`);
    console.log(`📡 Endpoints disponíveis:`);
    console.log(`   GET /oportunidades  | /  - Sincronizar oportunidades`);
    console.log(`   GET /oportunidades/status  | /status - Status das oportunidades`);
    console.log(`   GET /health - Health check`);
});

module.exports = app;

