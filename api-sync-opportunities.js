#!/usr/bin/env node

/**
 * 🌐 API DE SINCRONIZAÇÃO DE OPORTUNIDADES
 * Endpoint: https://sincro.oficialmed.com.br/oportunidades
 * Executa automaticamente via cronjob do Supabase
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const cors = require('cors');

// =============== VERSIONAMENTO ===============
function getVersion() {
    try {
        // Tentar ler do package.json (copiado como package.json no Docker)
        const packagePath = path.join(__dirname, 'package.json');
        if (fs.existsSync(packagePath)) {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            if (packageJson.version) {
                return packageJson.version;
            }
        }
    } catch (e) {
        // Ignorar erro
    }
    
    // Fallback: tentar package-sync-apis.json (para desenvolvimento local)
    try {
        const packagePath = path.join(__dirname, 'package-sync-apis.json');
        if (fs.existsSync(packagePath)) {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            if (packageJson.version) {
                return packageJson.version;
            }
        }
    } catch (e) {
        // Ignorar erro
    }
    
    // Fallback: tentar obter do git (pode não funcionar no Docker sem .git)
    try {
        const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: __dirname, stdio: 'pipe' }).trim();
        return `3.0.0-dev.${gitHash}`;
    } catch (e) {
        // Se não conseguir do git, usar versão do package.json ou fallback
        return '3.0.3';
    }
}

function getBuildInfo() {
    try {
        const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: __dirname, stdio: 'pipe' }).trim();
        const gitDate = execSync('git log -1 --format=%ci', { encoding: 'utf8', cwd: __dirname, stdio: 'pipe' }).trim();
        const gitMessage = execSync('git log -1 --format=%s', { encoding: 'utf8', cwd: __dirname, stdio: 'pipe' }).trim();
        return {
            hash: gitHash,
            date: gitDate,
            message: gitMessage
        };
    } catch (e) {
        // Se não conseguir do git (comum no Docker), usar informações de build
        return {
            hash: process.env.GIT_SHA || process.env.GIT_COMMIT || 'unknown',
            date: new Date().toISOString(),
            message: process.env.GIT_MESSAGE || 'Built from Docker image'
        };
    }
}

const API_VERSION = getVersion();
const BUILD_INFO = getBuildInfo();

// Log de inicialização com versão
console.log('\n' + '='.repeat(80));
console.log('🚀 API DE SINCRONIZAÇÃO DE OPORTUNIDADES - OFICIALMED');
console.log('='.repeat(80));
console.log(`📦 Versão: ${API_VERSION}`);
console.log(`🔖 Commit: ${BUILD_INFO.hash}`);
console.log(`📅 Data: ${BUILD_INFO.date}`);
console.log(`💬 Mensagem: ${BUILD_INFO.message}`);
console.log('='.repeat(80) + '\n');

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

    // Helper para converter JSON
    const toJson = (value) => {
        if (!value) return null;
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    };

    // Helper para extrair fullname
    const fullname = firstname && lastname 
        ? `${firstname} ${lastname}`.trim() 
        : (getField('fullname', ['fullName', 'full_name', 'name', 'nome']) || null);

    return {
        id: toBigIntField(lead.id),
        firstname: firstname ? String(firstname).trim() : null,
        lastname: lastname ? String(lastname).trim() : null,
        fullname: fullname,
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        mobile: mobile ? String(mobile).trim() : null,
        whatsapp: whatsapp ? String(whatsapp).trim() : null,
        photo_url: lead.photoUrl ?? lead.photo_url ?? null,
        address: lead.address ?? null,
        city: lead.city ?? null,
        state: lead.state ?? null,
        zipcode: lead.zipcode ?? null,
        country: lead.country ?? null,
        timezone: lead.timezone ?? null,
        bairro: lead.bairro ?? null,
        complemento: lead.complemento ?? null,
        numero_entrega: lead.numero_entrega ?? lead.numero ?? null,
        rua_entrega: lead.rua_entrega ?? lead.rua ?? null,
        company: lead.company ?? null,
        points: toInteger(lead.points) ?? 0,
        owner: toBigIntField(lead.owner),
        stage: lead.stage ?? null,
        preferred_locale: lead.preferred_locale ?? null,
        user_access: toJson(lead.userAccess ?? lead.user_access),
        department_access: toJson(lead.departmentAccess ?? lead.department_access),
        ignore_sub_departments: Boolean(lead.ignoreSubDepartments ?? lead.ignore_sub_departments),
        create_date: parseDateTime(lead.createDate ?? lead.create_date),
        updated_date: parseDateTime(lead.updatedDate ?? lead.updated_date),
        last_active: parseDateTime(lead.lastActive ?? lead.last_active),
        created_by: toBigIntField(lead.createdBy ?? lead.created_by),
        created_by_name: lead.createdByName ?? lead.created_by_name ?? null,
        created_by_type: lead.createdByType ?? lead.created_by_type ?? null,
        updated_by: toBigIntField(lead.updatedBy ?? lead.updated_by),
        updated_by_name: lead.updatedByName ?? lead.updated_by_name ?? null,
        synced_at: new Date().toISOString(),
        archived: Boolean(lead.archived),
        third_party_data: toJson(lead.thirdPartyData ?? lead.third_party_data),
        categoria: lead.categoria ?? lead.category ?? null,
        origem: lead.origem ?? lead.origin ?? null,
        observacao: lead.observacao ?? lead.observation ?? null,
        produto: lead.produto ?? lead.product ?? null,
        segmento: lead.segmento ?? lead.segment ?? null,
        data_de_nascimento: parseDateOnly(lead.data_de_nascimento ?? lead.data_de_nascimento_yampi),
        data_do_contato: parseDateOnly(lead.data_do_contato),
        // Campos adicionais do SprintHub
        cpf: lead.cpf ?? null,
        rg: lead.rg ?? null,
        sexo: lead.sexo ?? null,
        empresa: lead.empresa ?? null,
        capital_de_investimento: lead.capital_de_investimento ?? null,
        tipo_de_compra: lead.tipo_de_compra ?? null,
        pedidos_shopify: lead.pedidos_shopify ?? null,
        classificacao_google: lead.classificacao_google ?? null,
        grau_de_interesse: lead.grau_de_interesse ?? null,
        star_score: lead.star_score ?? null,
        avaliacao_atendente: lead.avaliacao_atendente ?? null,
        avaliacao_atendimento: lead.avaliacao_atendimento ?? null,
        qualificacao_callix: lead.qualificacao_callix ?? null,
        origem_manipulacao: lead.origem_manipulacao ?? null,
        lista_de_origem: lead.lista_de_origem ?? null,
        criativo: lead.criativo ?? null,
        plataforma: lead.plataforma ?? null,
        redes_sociais: lead.redes_sociais ?? null,
        site: lead.site ?? null,
        atendente: lead.atendente ?? null,
        atendente_atual: lead.atendente_atual ?? null,
        feedback: lead.feedback ?? null,
        observacoes_do_lead: lead.observacoes_do_lead ?? null,
        comportamento_da_ia: lead.comportamento_da_ia ?? null,
        retorno: lead.retorno ?? null,
        prescritor: lead.prescritor ?? null,
        drograria: lead.drograria ?? null,
        data_recompra: parseDateOnly(lead.data_recompra),
        mes_que_entrou: lead.mes_que_entrou ?? null,
        arquivo_receita: lead.arquivo_receita ?? null,
        id_t56: lead.id_t56 ?? null,
        objetivos_do_cliente: lead.objetivos_do_cliente ?? null,
        perfil_do_cliente: lead.perfil_do_cliente ?? null,
        recebedor: lead.recebedor ?? null,
        whatsapp_remote_lid: lead.whatsapp_remote_lid ?? null,
        status: lead.status ?? null,
        sh_status: lead.sh_status ?? null,
        channel_restrictions: toJson(lead.channelRestrictions ?? lead.channel_restrictions),
        ips: toJson(lead.ips),
        utm_tags: toJson(lead.utmTags ?? lead.utm_tags),
        // Campos de endereço completo
        numero: lead.numero ?? null,
        rua: lead.rua ?? null,
        pais: lead.pais ?? null,
        endereco_completo: lead.endereco_completo ?? null,
        // Campos de entrega
        referencia_entrega: lead.referencia_entrega ?? null,
        recebedor_qjl: lead.recebedor_qjl ?? null,
        // Campos de pagamento
        forma_de_entrega: lead.forma_de_entrega ?? null,
        forma_pagamento: lead.forma_pagamento ?? null,
        parcelas: lead.parcelas ?? null,
        valor_do_frete: lead.valor_do_frete ?? null,
        valor_parcela: lead.valor_parcela ?? null,
        descontos: lead.descontos ?? null,
        // Campos de integração
        id_apomax: lead.id_apomax ?? null,
        id_cliente_yampi: lead.id_cliente_yampi ?? lead.id_cliente_yampi_xpc ?? null,
        id_cliente_yampi_xpc: lead.id_cliente_yampi_xpc ?? null,
        id_transacao: lead.id_transacao ?? null,
        id_correio: lead.id_correio ?? null,
        codigo_de_rastreio: lead.codigo_de_rastreio ?? null,
        status_getnet: lead.status_getnet ?? null,
        status_pagamento: lead.status_pagamento ?? null,
        status_stapa: lead.status_stapa ?? null,
        status_melhor_envio: lead.status_melhor_envio ?? null,
        ultimo_tipo_de_frete: lead.ultimo_tipo_de_frete ?? null,
        url_etiqueta: lead.url_etiqueta ?? null,
        link_pagamento: lead.linkpagamento ?? lead.link_pagamento ?? null,
        numero_do_pedido: lead.numero_do_pedido ?? null,
        titulo_pedido: lead.titulo_pedido ?? null,
        total: lead.total ?? null,
        ord: lead.ord ?? null,
        req: lead.req ?? null,
        skugetnet: lead.skugetnet ?? null,
        cotar_frete_sedex: lead.cotar_frete_sedex ?? null,
        created_by_utm: lead.createdByUtm ?? lead.created_by_utm ?? null,
        data_de_nascimento_yampi: lead.data_de_nascimento_yampi ?? null,
        descricao_formula: lead.descricao_formula ?? null,
        data_ultima_compra: lead.data_ultima_compra ?? lead.ultimopedido ?? null
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

// Função otimizada para buscar todos os IDs do SprintHub (usando MCP/cache)
async function getAllSprintHubLeadIds() {
    console.log('🔍 Buscando todos os IDs de leads do SprintHub...');
    const allIds = new Set();
    let page = 0;
    let totalFetched = 0;

    while (true) {
        try {
            const batch = await fetchLeadsFromSprintHub(page);
            if (!batch || batch.length === 0) {
                break;
            }

            batch.forEach(lead => {
                if (lead.id) {
                    allIds.add(lead.id);
                }
            });

            totalFetched += batch.length;
            console.log(`📄 Página ${page + 1}: ${batch.length} leads (Total IDs únicos: ${allIds.size})`);
            
            page++;
            await sleep(300); // Delay menor para busca de IDs
        } catch (error) {
            console.error(`❌ Erro ao buscar página ${page + 1} de IDs:`, error.message);
            break;
        }
    }

    console.log(`✅ Total de IDs únicos encontrados no SprintHub: ${allIds.size}`);
    return Array.from(allIds);
}

// Função para remover leads que não existem mais no SprintHub
async function cleanupDeletedLeads(sprintHubIds) {
    console.log('\n🧹 Limpando leads que não existem mais no SprintHub...');
    
    try {
        // Buscar todos os IDs do banco
        const { data: dbLeads, error } = await supabase
            .from('leads')
            .select('id')
            .order('id', { ascending: true });

        if (error) {
            console.error('❌ Erro ao buscar leads do banco:', error.message);
            return { deleted: 0, error: error.message };
        }

        const dbIds = new Set(dbLeads.map(l => l.id));
        const sprintHubIdsSet = new Set(sprintHubIds.map(id => BigInt(id)));
        
        // Encontrar IDs que estão no banco mas não no SprintHub
        const idsToDelete = [];
        dbIds.forEach(id => {
            if (!sprintHubIdsSet.has(BigInt(id))) {
                idsToDelete.push(id);
            }
        });

        if (idsToDelete.length === 0) {
            console.log('✅ Nenhum lead para remover - banco está sincronizado');
            return { deleted: 0 };
        }

        console.log(`🗑️  Removendo ${idsToDelete.length} leads que não existem mais no SprintHub...`);

        // Deletar em lotes de 1000
        let deleted = 0;
        for (let i = 0; i < idsToDelete.length; i += 1000) {
            const batch = idsToDelete.slice(i, i + 1000);
            const { error: deleteError } = await supabase
                .from('leads')
                .delete()
                .in('id', batch);

            if (deleteError) {
                console.error(`❌ Erro ao deletar lote ${i / 1000 + 1}:`, deleteError.message);
            } else {
                deleted += batch.length;
                console.log(`✅ Removidos ${deleted} de ${idsToDelete.length} leads...`);
            }
        }

        console.log(`✅ Limpeza concluída: ${deleted} leads removidos`);
        return { deleted };
    } catch (error) {
        console.error('❌ Erro na limpeza:', error.message);
        return { deleted: 0, error: error.message };
    }
}

async function syncLeads() {
    console.log('\n📊 Iniciando sincronização OTIMIZADA de LEADS...\n');
    const runId = await logRunStart('leads');
    let page = 0;
    let processed = 0, errors = 0;
    const missingFieldCounts = {};
    const missingFieldEvents = [];
    let allSprintHubIds = null;

    // FASE 1: Buscar todos os IDs do SprintHub (para limpeza posterior)
    try {
        allSprintHubIds = await getAllSprintHubLeadIds();
        console.log(`\n📊 SprintHub tem ${allSprintHubIds.length} leads únicos\n`);
    } catch (error) {
        console.warn('⚠️ Não foi possível buscar todos os IDs, continuando sem limpeza:', error.message);
    }

    // FASE 2: Sincronizar todos os leads
    page = 0; // Resetar página
    while (true) {
        const batch = await fetchLeadsFromSprintHub(page);
        if (!batch || batch.length === 0) {
            console.log('✅ Sincronização de leads concluída');
            break;
        }

        // Primeiro mapear todos os leads com mapeamento COMPLETO
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

        // Buscar detalhes individuais APENAS para leads sem campos críticos
        const leadsWithoutFields = mapped.filter(lead => 
            !lead.firstname && !lead.lastname && !lead.whatsapp && !lead.email
        );

        if (leadsWithoutFields.length > 0) {
            console.log(`🔍 Buscando detalhes individuais de ${leadsWithoutFields.length} leads sem campos críticos (página ${page + 1})...`);
            let updated = 0;
            for (const lead of leadsWithoutFields) {
                try {
                    const details = await fetchLeadDetails(lead.id);
                    if (details) {
                        const leadData = details.lead || details.data?.lead || details;
                        const remapped = mapLeadToSupabase(leadData, () => {});
                        const index = mapped.findIndex(l => l.id === lead.id);
                        if (index >= 0) {
                            mapped[index] = { ...mapped[index], ...remapped };
                            updated++;
                        }
                    }
                } catch (err) {
                    // Silenciar erros de leads individuais para não poluir logs
                }
                await sleep(50); // Delay reduzido
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

    // FASE 3: Limpar leads que não existem mais no SprintHub
    let cleanupResult = { deleted: 0 };
    if (allSprintHubIds && allSprintHubIds.length > 0) {
        cleanupResult = await cleanupDeletedLeads(allSprintHubIds);
    }

    await logMissingFieldEvents('lead', missingFieldEvents);

    await logRunFinish(runId, {
        status: errors > 0 ? 'success_with_errors' : 'success',
        total_processed: processed,
        total_errors: errors,
        total_deleted: cleanupResult.deleted || 0,
        details: { 
            missingFields: missingFieldCounts,
            sprintHubTotal: allSprintHubIds?.length || null
        }
    });

    return { 
        totalProcessed: processed, 
        totalErrors: errors, 
        totalDeleted: cleanupResult.deleted || 0,
        sprintHubTotal: allSprintHubIds?.length || null,
        missingFields: missingFieldCounts 
    };
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
    // Log de stack trace para identificar quem está chamando esta função
    const stack = new Error().stack;
    console.log('\n📊 Iniciando sincronização de SEGMENTOS...\n');
    console.log('🔍 Stack trace (quem chamou syncSegments):');
    console.log(stack);
    console.log('⚠️ ATENÇÃO: syncSegments foi chamado! Isso não deveria acontecer em /sync/oportunidades');
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
        stages: [244, 245, 105, 267, 368, 108, 109, 261, 262, 263, 278, 110]
    },
    14: {
        name: '[2] RECOMPRA',
        stages: [202, 228, 229, 206, 203, 204, 230, 205, 269, 167, 148, 168, 149, 169, 150]
    },
    32: {
        name: '[1] MONITORAMENTO MARKETING',
        stages: [280, 281, 282, 283, 284, 285, 346, 347, 348, 349]
    },
    33: {
        name: '[1] ATIVAÇÃO COMERCIAL',
        stages: [314, 317, 315, 316, 318, 319, 320]
    },
    34: {
        name: '[1] REATIVAÇÃO MARKETING',
        stages: [286, 287, 288, 289, 369, 370, 371, 372, 373, 374, 296]
    },
    35: {
        name: '[1] ATIVAÇÃO MARKETING',
        stages: [298, 299, 300, 301, 375, 376, 377, 378, 379, 380, 307, 340, 341, 342, 343, 381, 382, 383, 384, 385, 386, 344]
    },
    36: {
        name: '[1] LABORATÓRIO',
        stages: [302, 367, 306, 305, 308]
    },
    38: {
        name: '[1] REATIVAÇÃO COMERCIAL',
        stages: [333, 334, 335, 336, 337, 338, 339]
    },
    41: {
        name: '[1] MONITORAMENTO COMERCIAL',
        stages: [353, 354, 355, 356, 357, 358, 359]
    }
};

const PAGE_LIMIT = 100;
let DELAY_BETWEEN_PAGES = 150; // Reduzido de 500ms para 150ms (otimização)
const DELAY_BETWEEN_STAGES = 100; // Reduzido de 400ms para 100ms
const MAX_BACKOFF_MS = 8000;
const MIN_BACKOFF_MS = 100; // Reduzido de 500ms para 100ms
const CONCURRENCY_STAGES = 8; // Processar até 8 etapas simultaneamente (otimização)
const UPSERT_BATCH_SIZE = 500; // Aumentado de 100 para 500 (otimização)

// =============== RATE LIMITER (Token Bucket) ===============
// Limite de 100 requisições por minuto
class RateLimiter {
    constructor(maxTokens = 100, refillIntervalMs = 60000) {
        this.maxTokens = maxTokens;
        this.tokens = maxTokens;
        this.refillIntervalMs = refillIntervalMs;
        this.lastRefill = Date.now();
        this.queue = [];
        this.processing = false;
    }

    async acquire() {
        return new Promise((resolve) => {
            this.queue.push(resolve);
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;

        while (this.queue.length > 0) {
            // Refill tokens
            const now = Date.now();
            const elapsed = now - this.lastRefill;
            if (elapsed >= this.refillIntervalMs) {
                this.tokens = this.maxTokens;
                this.lastRefill = now;
            }

            if (this.tokens > 0) {
                this.tokens--;
                const resolve = this.queue.shift();
                resolve();
            } else {
                // Esperar até ter tokens disponíveis
                const waitTime = this.refillIntervalMs - elapsed;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                this.tokens = this.maxTokens;
                this.lastRefill = Date.now();
            }
        }

        this.processing = false;
    }
}

// Instância global do rate limiter (100 req/min = ~1.67 req/seg)
const rateLimiter = new RateLimiter(100, 60000);

// Função para buscar oportunidades de uma etapa (com rate limiting)
async function fetchOpportunitiesFromStage(funnelId, stageId, page = 0, limit = PAGE_LIMIT) {
    // Aguardar token do rate limiter
    await rateLimiter.acquire();
    
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`;
    
    try {
        const payloadObject = { page, limit, columnId: stageId };
        // Sempre tentar usar incremental se disponível (otimização)
        if (globalThis.__LAST_UPDATE_PER_STAGE && globalThis.__LAST_UPDATE_PER_STAGE[`${funnelId}:${stageId}`]) {
            const since = globalThis.__LAST_UPDATE_PER_STAGE[`${funnelId}:${stageId}`];
            payloadObject.modifiedSince = since;
        }
        const postData = JSON.stringify(payloadObject);
        
        // Debug para funis 34 e 38
        if (funnelId === 34 || funnelId === 38) {
            console.log(`     🔍 DEBUG Funil ${funnelId} Etapa ${stageId}: URL=${url}`);
            console.log(`     🔍 DEBUG Payload:`, JSON.stringify(payloadObject));
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            },
            body: Buffer.from(postData)
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            const errorMsg = `HTTP ${response.status}: ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`;
            if (funnelId === 34 || funnelId === 38) {
                console.error(`     ❌ DEBUG Funil ${funnelId} Etapa ${stageId} - Erro HTTP:`, errorMsg);
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        const result = Array.isArray(data) ? data : [];
        
        // Debug para funis 34 e 38
        if ((funnelId === 34 || funnelId === 38) && page === 0) {
            console.log(`     🔍 DEBUG Funil ${funnelId} Etapa ${stageId}: Recebidas ${result.length} oportunidades`);
            if (result.length > 0) {
                console.log(`     🔍 DEBUG Primeira oportunidade:`, JSON.stringify(result[0], null, 2));
            }
        }
        
        return result;
        
    } catch (error) {
        console.error(`❌ Erro ao buscar etapa ${stageId} do funil ${funnelId}:`, error.message);
        if (funnelId === 34 || funnelId === 38) {
            console.error(`   Stack:`, error.stack);
        }
        return [];
    }
}

// Função helper para converter data/hora de campos customizados
function parseDateTimeField(value) {
    if (!value) return null;
    if (typeof value === 'string') {
        // Formato brasileiro: "DD/MM/YYYY HH:mm" ou "DD/MM/YYYY"
        const brFormat = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/;
        const match = value.trim().match(brFormat);
        if (match) {
            const [, day, month, year, hour = '00', minute = '00'] = match;
            const dateStr = `${year}-${month}-${day}T${hour}:${minute}:00`;
            const date = new Date(dateStr);
            if (!Number.isNaN(date.getTime())) {
                return date.toISOString();
            }
        }
        
        // Tentar parsear como ISO string ou formato comum
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            return date.toISOString();
        }
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    return null;
}

// Função helper para mapear campos de data/hora das etapas
function mapStageDateTimeFields(fields) {
    if (!fields || typeof fields !== 'object') return {};
    
    // Log para debug - mostrar TODOS os campos recebidos (apenas no funil 33)
    const allFieldNames = Object.keys(fields);
    if (allFieldNames.length > 0) {
        // Procurar campos que podem ser de data/hora
        const possibleDateTimeFields = allFieldNames.filter(k => {
            const kLower = k.toLowerCase();
            return kLower.includes('entrada') || kLower.includes('acolhimento') || 
                   kLower.includes('qualificado') || kLower.includes('qualificacao') ||
                   kLower.includes('orcamento') || kLower.includes('orçamento') ||
                   kLower.includes('negociacao') || kLower.includes('negociação') ||
                   kLower.includes('follow') || kLower.includes('followup') ||
                   kLower.includes('cadastro') || kLower.includes('compra') ||
                   kLower.includes('recompra') || kLower.includes('monitoramento') ||
                   kLower.includes('ativacao') || kLower.includes('ativação') ||
                   kLower.includes('reativacao') || kLower.includes('reativação') ||
                   kLower.includes('data') || kLower.includes('hora') || kLower.includes('time');
        });
        
        if (possibleDateTimeFields.length > 0) {
            console.log(`🔍 DEBUG: Campos de data/hora detectados (${possibleDateTimeFields.length}):`, possibleDateTimeFields);
            possibleDateTimeFields.forEach(field => {
                const value = fields[field];
                if (value !== null && value !== undefined && value !== '') {
                    console.log(`   ✅ ${field}: ${value} (tipo: ${typeof value})`);
                }
            });
        }
    }
    
    // Mapeamento de nomes do SprintHub para nomes da tabela
    // Formato esperado: "Entrada Compra", "Acolhimento Compra", etc.
    // Inclui variações possíveis de nomes
    const stageFieldMap = {
        // Compra - variações possíveis
        'Entrada Compra': 'entrada_compra',
        'ENTRADA COMPRA': 'entrada_compra',
        'entrada compra': 'entrada_compra',
        'Acolhimento Compra': 'acolhimento_compra',
        'ACOLHIMENTO COMPRA': 'acolhimento_compra',
        'acolhimento compra': 'acolhimento_compra',
        'Qualificado Compra': 'qualificado_compra',
        'QUALIFICADO COMPRA': 'qualificado_compra',
        'qualificado compra': 'qualificado_compra',
        'Orcamento Compra': 'orcamento_compra',
        'ORCAMENTO COMPRA': 'orcamento_compra',
        'orcamento compra': 'orcamento_compra',
        'Orçamento Compra': 'orcamento_compra',
        'Negociacao Compra': 'negociacao_compra',
        'NEGOCIACAO COMPRA': 'negociacao_compra',
        'negociacao compra': 'negociacao_compra',
        'Negociação Compra': 'negociacao_compra',
        'Follow Up Compra': 'follow_up_compra',
        'FOLLOW UP COMPRA': 'follow_up_compra',
        'follow up compra': 'follow_up_compra',
        'Cadastro Compra': 'cadastro_compra',
        'CADASTRO COMPRA': 'cadastro_compra',
        'cadastro compra': 'cadastro_compra',
        // Recompra - variações possíveis
        'Entrada Recompra': 'entrada_recompra',
        'ENTRADA RECOMPRA': 'entrada_recompra',
        'entrada recompra': 'entrada_recompra',
        'Acolhimento Recompra': 'acolhimento_recompra',
        'ACOLHIMENTO RECOMPRA': 'acolhimento_recompra',
        'acolhimento recompra': 'acolhimento_recompra',
        'Qualificado Recompra': 'qualificado_recompra',
        'QUALIFICADO RECOMPRA': 'qualificado_recompra',
        'qualificado recompra': 'qualificado_recompra',
        'Orcamento Recompra': 'orcamento_recompra',
        'ORCAMENTO RECOMPRA': 'orcamento_recompra',
        'orcamento recompra': 'orcamento_recompra',
        'Orçamento Recompra': 'orcamento_recompra',
        'Negociacao Recompra': 'negociacao_recompra',
        'NEGOCIACAO RECOMPRA': 'negociacao_recompra',
        'negociacao recompra': 'negociacao_recompra',
        'Negociação Recompra': 'negociacao_recompra',
        'Follow Up Recompra': 'follow_up_recompra',
        'FOLLOW UP RECOMPRA': 'follow_up_recompra',
        'follow up recompra': 'follow_up_recompra',
        'Cadastro Recompra': 'cadastro_recompra',
        'CADASTRO RECOMPRA': 'cadastro_recompra',
        'cadastro recompra': 'cadastro_recompra',
        // Monitoramento - variações possíveis
        'Entrada Monitoramento': 'entrada_monitoramento',
        'ENTRADA MONITORAMENTO': 'entrada_monitoramento',
        'entrada monitoramento': 'entrada_monitoramento',
        'Acolhimento Monitoramento': 'acolhimento_monitoramento',
        'ACOLHIMENTO MONITORAMENTO': 'acolhimento_monitoramento',
        'acolhimento monitoramento': 'acolhimento_monitoramento',
        'Qualificado Monitoramento': 'qualificado_monitoramento',
        'QUALIFICADO MONITORAMENTO': 'qualificado_monitoramento',
        'qualificado monitoramento': 'qualificado_monitoramento',
        'Orcamento Monitoramento': 'orcamento_monitoramento',
        'ORCAMENTO MONITORAMENTO': 'orcamento_monitoramento',
        'orcamento monitoramento': 'orcamento_monitoramento',
        'Orçamento Monitoramento': 'orcamento_monitoramento',
        'Negociacao Monitoramento': 'negociacao_monitoramento',
        'NEGOCIACAO MONITORAMENTO': 'negociacao_monitoramento',
        'negociacao monitoramento': 'negociacao_monitoramento',
        'Negociação Monitoramento': 'negociacao_monitoramento',
        'Follow Up Monitoramento': 'follow_up_monitoramento',
        'FOLLOW UP MONITORAMENTO': 'follow_up_monitoramento',
        'follow up monitoramento': 'follow_up_monitoramento',
        'Cadastro Monitoramento': 'cadastro_monitoramento',
        'CADASTRO MONITORAMENTO': 'cadastro_monitoramento',
        'cadastro monitoramento': 'cadastro_monitoramento',
        // Ativacao - variações possíveis
        'Entrada Ativacao': 'entrada_ativacao',
        'ENTRADA ATIVACAO': 'entrada_ativacao',
        'entrada ativacao': 'entrada_ativacao',
        'Entrada Ativação': 'entrada_ativacao',
        'Acolhimento Ativacao': 'acolhimento_ativacao',
        'ACOLHIMENTO ATIVACAO': 'acolhimento_ativacao',
        'acolhimento ativacao': 'acolhimento_ativacao',
        'Acolhimento Ativação': 'acolhimento_ativacao',
        'Qualificado Ativacao': 'qualificado_ativacao',
        'QUALIFICADO ATIVACAO': 'qualificado_ativacao',
        'qualificado ativacao': 'qualificado_ativacao',
        'Qualificado Ativação': 'qualificado_ativacao',
        'Orcamento Ativacao': 'orcamento_ativacao',
        'ORCAMENTO ATIVACAO': 'orcamento_ativacao',
        'orcamento ativacao': 'orcamento_ativacao',
        'Orçamento Ativação': 'orcamento_ativacao',
        'Negociacao Ativacao': 'negociacao_ativacao',
        'NEGOCIACAO ATIVACAO': 'negociacao_ativacao',
        'negociacao ativacao': 'negociacao_ativacao',
        'Negociação Ativação': 'negociacao_ativacao',
        'Follow Up Ativacao': 'follow_up_ativacao',
        'FOLLOW UP ATIVACAO': 'follow_up_ativacao',
        'follow up ativacao': 'follow_up_ativacao',
        'Follow Up Ativação': 'follow_up_ativacao',
        'Cadastro Ativacao': 'cadastro_ativacao',
        'CADASTRO ATIVACAO': 'cadastro_ativacao',
        'cadastro ativacao': 'cadastro_ativacao',
        'Cadastro Ativação': 'cadastro_ativacao',
        // Reativacao - variações possíveis
        'Entrada Reativacao': 'entrada_reativacao',
        'ENTRADA REATIVACAO': 'entrada_reativacao',
        'entrada reativacao': 'entrada_reativacao',
        'Entrada Reativação': 'entrada_reativacao',
        'Acolhimento Reativacao': 'acolhimento_reativacao',
        'ACOLHIMENTO REATIVACAO': 'acolhimento_reativacao',
        'acolhimento reativacao': 'acolhimento_reativacao',
        'Acolhimento Reativação': 'acolhimento_reativacao',
        'Qualificado Reativacao': 'qualificado_reativacao',
        'QUALIFICADO REATIVACAO': 'qualificado_reativacao',
        'qualificado reativacao': 'qualificado_reativacao',
        'Qualificado Reativação': 'qualificado_reativacao',
        'Orcamento Reativacao': 'orcamento_reativacao',
        'ORCAMENTO REATIVACAO': 'orcamento_reativacao',
        'orcamento reativacao': 'orcamento_reativacao',
        'Orçamento Reativação': 'orcamento_reativacao',
        'Negociacao Reativacao': 'negociacao_reativacao',
        'NEGOCIACAO REATIVACAO': 'negociacao_reativacao',
        'negociacao reativacao': 'negociacao_reativacao',
        'Negociação Reativação': 'negociacao_reativacao',
        'Follow Up Reativacao': 'follow_up_reativacao',
        'FOLLOW UP REATIVACAO': 'follow_up_reativacao',
        'follow up reativacao': 'follow_up_reativacao',
        'Follow Up Reativação': 'follow_up_reativacao',
        'Cadastro Reativacao': 'cadastro_reativacao',
        'CADASTRO REATIVACAO': 'cadastro_reativacao',
        'cadastro reativacao': 'cadastro_reativacao',
        'Cadastro Reativação': 'cadastro_reativacao'
    };
    
    const mappedFields = {};
    
    // Mapear campos conhecidos (busca exata)
    Object.keys(stageFieldMap).forEach(sprintHubField => {
        const dbField = stageFieldMap[sprintHubField];
        if (fields[sprintHubField] !== undefined) {
            const parsedValue = parseDateTimeField(fields[sprintHubField]);
            if (parsedValue) {
                mappedFields[dbField] = parsedValue;
                console.log(`✅ Mapeado (exato): "${sprintHubField}" -> ${dbField} = ${parsedValue}`);
            }
        }
    });
    
    // Também tentar mapear variações (sem acentos, lowercase, etc)
    Object.keys(fields).forEach(fieldName => {
        // Pular se já foi mapeado exatamente
        if (stageFieldMap[fieldName]) return;
        
        const fieldNameLower = fieldName.toLowerCase().trim();
        const fieldNameNormalized = fieldNameLower
            .replace(/[áàâã]/g, 'a')
            .replace(/[éèê]/g, 'e')
            .replace(/[íìî]/g, 'i')
            .replace(/[óòôõ]/g, 'o')
            .replace(/[úùû]/g, 'u')
            .replace(/ç/g, 'c')
            .replace(/\s+/g, ' ') // Normalizar espaços
            .trim();
        
        // Tentar encontrar correspondência
        Object.keys(stageFieldMap).forEach(sprintHubField => {
            const sprintHubFieldNormalized = sprintHubField.toLowerCase()
                .replace(/[áàâã]/g, 'a')
                .replace(/[éèê]/g, 'e')
                .replace(/[íìî]/g, 'i')
                .replace(/[óòôõ]/g, 'o')
                .replace(/[úùû]/g, 'u')
                .replace(/ç/g, 'c')
                .replace(/\s+/g, ' ') // Normalizar espaços
                .trim();
            
            if (fieldNameNormalized === sprintHubFieldNormalized) {
                const dbField = stageFieldMap[sprintHubField];
                if (!mappedFields[dbField]) { // Só mapear se ainda não foi mapeado
                    const parsedValue = parseDateTimeField(fields[fieldName]);
                    if (parsedValue) {
                        mappedFields[dbField] = parsedValue;
                        console.log(`✅ Mapeado (normalizado): "${fieldName}" -> ${dbField} = ${parsedValue}`);
                    }
                }
            }
        });
    });
    
    // Log final dos campos mapeados
    const mappedCount = Object.keys(mappedFields).filter(k => mappedFields[k] !== null).length;
    if (mappedCount > 0) {
        console.log(`✅ Total de campos de data/hora mapeados: ${mappedCount}`);
    }
    
    return mappedFields;
}

// Função para mapear campos da oportunidade
function mapOpportunityFields(opportunity, funnelId) {
    const fields = opportunity.fields || {};
    const lead = opportunity.dataLead || {};
    const utmTags = (lead.utmTags && lead.utmTags[0]) || {};
    
    // Mapear campos de data/hora das etapas
    const stageDateTimeFields = mapStageDateTimeFields(fields);

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
        tipo_de_compra: fields['Tipo de Compra'] || null,
        primecadastro: fields['PRIMECADASTRO'] ? parseInt(fields['PRIMECADASTRO']) || null : null,
        codigo_prime_receita: fields['Codigo Prime Receita'] || null,
        descricao_da_formula: fields['Descricao da Formula'] || null,
        numero_do_pedido: fields['Numero do pedido'] || null,
        status_getnet: fields['Status Getnet'] || null,
        valorconfere: fields['Valorconfere'] || null,
        valorfrete: fields['valorfrete'] || null,
        valorprodutos: fields['valorprodutos'] || null,
        codigo_id_lead: fields[' Codigo ID Lead'] || null,
        codigo_id_oportunidade: fields[' Codigo ID Oportunidade'] || null,
        id_oportunidade: fields['idoportunidade'] || null,
        etapa: fields['etapa'] || null,
        forma_pagamento: fields['Forma de Pagamento'] || null,
        forma_de_entrega: fields['Forma de entrega'] || null,
        frete_onibus_e_motoboy: fields['Frete Onibus e Motoboy'] || null,
        parcelamento: fields['parcelamento'] || null,
        posologia: fields['Posologia'] || null,
        status_da_etapa: fields['Status da Etapa'] || null,
        total_pedido: fields['Total Pedido'] || null,
        valor_parcela: fields['Valor Parcela'] || null,
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
        last_column_change: opportunity.last_column_change ? new Date(opportunity.last_column_change).toISOString() : null,
        last_status_change: opportunity.last_status_change ? new Date(opportunity.last_status_change).toISOString() : null,
        reopen_date: opportunity.reopen_date ? new Date(opportunity.reopen_date).toISOString() : null,
        expected_close_date: opportunity.expected_close_date ? new Date(opportunity.expected_close_date).toISOString() : null,
        archived: opportunity.archived ?? 0,
        unidade_id: '[1]',
        synced_at: new Date().toISOString(),
        // Campos de data/hora das etapas
        ...stageDateTimeFields
    };
}

// Upsert em lote otimizado (batches maiores)
async function upsertBatch(opportunitiesBatch) {
    try {
        // Dividir em chunks de UPSERT_BATCH_SIZE se necessário
        const chunks = [];
        for (let i = 0; i < opportunitiesBatch.length; i += UPSERT_BATCH_SIZE) {
            chunks.push(opportunitiesBatch.slice(i, i + UPSERT_BATCH_SIZE));
        }

        // Processar chunks em paralelo (otimização)
        const results = await Promise.all(
            chunks.map(chunk => 
                supabase
                    .from('oportunidade_sprint')
                    .upsert(chunk, { onConflict: 'id', ignoreDuplicates: false })
                    .then(({ error }) => ({ success: !error, error: error?.message }))
                    .catch(error => ({ success: false, error: error.message }))
            )
        );

        // Verificar se algum chunk falhou
        const failed = results.find(r => !r.success);
        if (failed) {
            return { success: false, error: failed.error };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Função auxiliar para processar uma etapa completa
async function processStage(funnelId, stageId, stageLastUpdateCache, stats) {
    console.log(`\n   🔄 Etapa ${stageId} do Funil ${funnelId}...`);
    const etapaStats = { processed: 0, errors: 0 };
    
    try {
        await stageLastUpdateCache(Number(funnelId), stageId);
        let page = 0;
        let hasMore = true;
        const mappedBatch = []; // Acumular para batch maior
        
        while (hasMore) {
            try {
                const opportunities = await fetchOpportunitiesFromStage(funnelId, stageId, page);
                if (!opportunities || opportunities.length === 0) {
                    if (page === 0) {
                        console.log(`     ℹ️ Etapa ${stageId}: Nenhuma oportunidade encontrada (pode estar vazia)`);
                    }
                    hasMore = false;
                    break;
                }
                console.log(`     📄 Página ${page + 1}: ${opportunities.length} oportunidades`);

                // Mapear e acumular para batch maior
                const mapped = opportunities.map((o) => mapOpportunityFields(o, funnelId));
                mappedBatch.push(...mapped);
                etapaStats.processed += mapped.length;

                // Se acumulou suficiente ou é a última página, fazer upsert
                if (mappedBatch.length >= UPSERT_BATCH_SIZE || opportunities.length < PAGE_LIMIT) {
                    const batchToUpsert = mappedBatch.splice(0, UPSERT_BATCH_SIZE);
                    const upsertRes = await upsertBatch(batchToUpsert);
                    if (!upsertRes.success) {
                        etapaStats.errors += batchToUpsert.length;
                        console.error(`❌ Erro upsert em lote (página ${page + 1}, etapa ${stageId}, funil ${funnelId}):`, upsertRes.error);
                    }
                    
                    // Delay menor (otimizado)
                    if (mappedBatch.length > 0) {
                        await sleep(100); // Delay reduzido
                    }
                }

                // Verificar se há mais páginas
                if (opportunities.length < PAGE_LIMIT) {
                    hasMore = false;
                }
                
                page++;
                
                // Delay reduzido entre páginas
                if (hasMore) {
                    await sleep(150); // Reduzido de 500ms para 150ms
                }
            } catch (err) {
                console.error(`❌ Falha na página ${page + 1} da etapa ${stageId} do funil ${funnelId}:`, err.message);
                etapaStats.errors += PAGE_LIMIT;
                page++;
                await sleep(500); // Delay maior em caso de erro
            }
        }
        
        // Processar batch restante
        if (mappedBatch.length > 0) {
            const upsertRes = await upsertBatch(mappedBatch);
            if (!upsertRes.success) {
                etapaStats.errors += mappedBatch.length;
            }
        }
        
        if (etapaStats.processed === 0) {
            console.log(`     ℹ️ Etapa ${stageId} do Funil ${funnelId} concluída (sem oportunidades)`);
        } else {
            console.log(`     ✅ Etapa ${stageId} do Funil ${funnelId} concluída: ${etapaStats.processed} oportunidades${etapaStats.errors > 0 ? `, ${etapaStats.errors} erros` : ''}`);
        }
        
        return etapaStats;
    } catch (err) {
        console.error(`❌ Erro ao processar etapa ${stageId} do Funil ${funnelId}:`, err.message);
        return { processed: 0, errors: 1 };
    }
}

// Função principal de sincronização (otimizada com paralelismo)
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
    console.log(`📋 Funis configurados: ${JSON.stringify(FUNIS_CONFIG, null, 2)}`);
    
    for (const funnelId of funisIds) {
        const funnelConfig = FUNIS_CONFIG[funnelId];
        if (!funnelConfig) {
            console.warn(`⚠️ Configuração não encontrada para Funil ${funnelId}, pulando...`);
            continue;
        }
        
        console.log(`\n📊 ========================================`);
        console.log(`📊 Processando Funil ${funnelId}: ${funnelConfig.name}`);
        console.log(`📊 Etapas: ${funnelConfig.stages.length} (${funnelConfig.stages.join(', ')})`);
        console.log(`📊 ========================================`);
        
        let funilProcessed = 0;
        let funilErrors = 0;
        
        // Processar etapas em paralelo (otimização)
        const stages = funnelConfig.stages;
        for (let i = 0; i < stages.length; i += CONCURRENCY_STAGES) {
            const stageBatch = stages.slice(i, i + CONCURRENCY_STAGES);
            
            // Processar batch de etapas em paralelo
            const stageResults = await Promise.all(
                stageBatch.map(stageId => 
                    processStage(funnelId, stageId, stageLastUpdateCache, {
                        totalProcessed,
                        totalErrors
                    })
                )
            );
            
            // Agregar resultados
            stageResults.forEach(result => {
                funilProcessed += result.processed;
                funilErrors += result.errors;
                totalProcessed += result.processed;
                totalUpdated += result.processed; // Estimado como atualizados
                totalErrors += result.errors;
            });
            
            // Pequeno delay entre batches de etapas
            if (i + CONCURRENCY_STAGES < stages.length) {
                await sleep(100);
            }
        }
        
        console.log(`\n✅ ========================================`);
        console.log(`✅ Funil ${funnelId} (${funnelConfig.name}) concluído:`);
        console.log(`   📊 Processadas: ${funilProcessed}`);
        console.log(`   ❌ Erros: ${funilErrors}`);
        console.log(`✅ ========================================\n`);
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
        status: 'ok',
        version: API_VERSION,
        build: {
            hash: BUILD_INFO.hash,
            date: BUILD_INFO.date,
            message: BUILD_INFO.message
        },
        timestamp: new Date().toISOString(),
        isSyncRunning,
        lastRun
    });
});

// Version info
app.get('/version', (req, res) => {
    res.json({
        version: API_VERSION,
        build: BUILD_INFO,
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

// Endpoint de debug para analisar estrutura dos dados do SprintHub
app.get('/debug/sample', async (req, res) => {
    try {
        const funnelId = parseInt(req.query.funnel || '14');
        const stageId = parseInt(req.query.stage || '202');
        const limit = parseInt(req.query.limit || '1');
        
        console.log(`🔍 Debug: Buscando amostra - Funil ${funnelId}, Etapa ${stageId}`);
        
        const opportunities = await fetchOpportunitiesFromStage(funnelId, stageId, 0, limit);
        
        if (!opportunities || opportunities.length === 0) {
            return res.json({
                success: true,
                message: 'Nenhuma oportunidade encontrada',
                funnelId,
                stageId,
                sample: null,
                fieldsStructure: {}
            });
        }
        
        const sample = opportunities[0];
        const fields = sample.fields || {};
        const lead = sample.dataLead || {};
        
        // Analisar estrutura
        const fieldsStructure = {
            directFields: Object.keys(sample).filter(k => k !== 'fields' && k !== 'dataLead'),
            customFields: Object.keys(fields),
            leadFields: Object.keys(lead),
            // Procurar campos de data/hora
            dateTimeFields: Object.keys(fields).filter(k => {
                const kLower = k.toLowerCase();
                return kLower.includes('entrada') || kLower.includes('acolhimento') || 
                       kLower.includes('qualificado') || kLower.includes('orcamento') ||
                       kLower.includes('negociacao') || kLower.includes('follow') ||
                       kLower.includes('cadastro') || kLower.includes('compra') ||
                       kLower.includes('recompra') || kLower.includes('monitoramento') ||
                       kLower.includes('ativacao') || kLower.includes('reativacao');
            })
        };
        
        res.json({
            success: true,
            message: 'Amostra de dados do SprintHub',
            funnelId,
            stageId,
            sample: {
                id: sample.id,
                title: sample.title,
                status: sample.status,
                crm_column: sample.crm_column,
                fields: fields,
                dataLead: {
                    firstname: lead.firstname,
                    lastname: lead.lastname,
                    email: lead.email,
                    whatsapp: lead.whatsapp
                }
            },
            fieldsStructure,
            allFieldsInFields: Object.keys(fields).sort(),
            mappedFields: mapStageDateTimeFields(fields)
        });
        
    } catch (error) {
        console.error('❌ Erro no endpoint de debug:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint para buscar oportunidade específica por ID e funil
app.get('/debug/opportunity', async (req, res) => {
    try {
        const funnelId = parseInt(req.query.funnelID || req.query.funnelId || '33');
        const opportunityId = parseInt(req.query.opportunityID || req.query.opportunityId);
        
        if (!opportunityId) {
            return res.status(400).json({
                success: false,
                error: 'opportunityID é obrigatório'
            });
        }
        
        console.log(`🔍 Debug: Buscando oportunidade ${opportunityId} no Funil ${funnelId}`);
        
        // Buscar em todas as etapas do funil
        const funnelConfig = FUNIS_CONFIG[funnelId];
        if (!funnelConfig) {
            return res.status(400).json({
                success: false,
                error: `Funil ${funnelId} não encontrado na configuração`
            });
        }
        
        let opportunity = null;
        let foundInStage = null;
        
        // Buscar em todas as etapas
        for (const stageId of funnelConfig.stages) {
            const opportunities = await fetchOpportunitiesFromStage(funnelId, stageId, 0, 200);
            const found = opportunities.find(opp => opp.id === opportunityId);
            if (found) {
                opportunity = found;
                foundInStage = stageId;
                break;
            }
        }
        
        if (!opportunity) {
            return res.json({
                success: true,
                message: `Oportunidade ${opportunityId} não encontrada no Funil ${funnelId}`,
                funnelId,
                opportunityId,
                opportunity: null
            });
        }
        
        const fields = opportunity.fields || {};
        const allFieldNames = Object.keys(fields).sort();
        
        // Procurar TODOS os campos que podem ser de data/hora
        const possibleDateTimeFields = allFieldNames.filter(k => {
            const kLower = k.toLowerCase();
            return kLower.includes('entrada') || kLower.includes('acolhimento') || 
                   kLower.includes('qualificado') || kLower.includes('qualificacao') ||
                   kLower.includes('orcamento') || kLower.includes('orçamento') ||
                   kLower.includes('negociacao') || kLower.includes('negociação') ||
                   kLower.includes('follow') || kLower.includes('followup') ||
                   kLower.includes('cadastro') || kLower.includes('compra') ||
                   kLower.includes('recompra') || kLower.includes('monitoramento') ||
                   kLower.includes('ativacao') || kLower.includes('ativação') ||
                   kLower.includes('reativacao') || kLower.includes('reativação') ||
                   kLower.includes('data') || kLower.includes('hora') || kLower.includes('time');
        });
        
        // Verificar valores dos campos de data/hora
        const dateTimeFieldsWithValues = {};
        possibleDateTimeFields.forEach(fieldName => {
            const value = fields[fieldName];
            if (value !== null && value !== undefined && value !== '') {
                dateTimeFieldsWithValues[fieldName] = value;
            }
        });
        
        const analyzed = {
            id: opportunity.id,
            title: opportunity.title,
            crm_column: opportunity.crm_column,
            status: opportunity.status,
            foundInStage: foundInStage,
            allFields: allFieldNames,
            possibleDateTimeFields: possibleDateTimeFields,
            dateTimeFieldsWithValues: dateTimeFieldsWithValues,
            mappedFields: mapStageDateTimeFields(fields),
            // Incluir TODOS os campos com valores para análise
            allFieldsWithValues: Object.keys(fields).reduce((acc, key) => {
                if (fields[key] !== null && fields[key] !== undefined && fields[key] !== '') {
                    acc[key] = fields[key];
                }
                return acc;
            }, {}),
            // Incluir objeto fields completo para análise detalhada
            fields: fields
        };
        
        res.json({
            success: true,
            message: `Oportunidade ${opportunityId} encontrada no Funil ${funnelId}`,
            funnelId,
            opportunityId,
            opportunity: analyzed
        });
        
    } catch (error) {
        console.error('❌ Erro no endpoint de debug opportunity:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Endpoint para buscar oportunidade específica do funil 33 e ver TODOS os campos
app.get('/debug/funil33', async (req, res) => {
    try {
        const funnelId = 33; // Ativação Comercial
        const stageId = parseInt(req.query.stage || '317'); // Etapa padrão: Acolhimento
        const limit = parseInt(req.query.limit || '5');
        
        console.log(`🔍 Debug Funil 33: Buscando amostra - Etapa ${stageId}`);
        
        const opportunities = await fetchOpportunitiesFromStage(funnelId, stageId, 0, limit);
        
        if (!opportunities || opportunities.length === 0) {
            return res.json({
                success: true,
                message: 'Nenhuma oportunidade encontrada no Funil 33',
                funnelId,
                stageId,
                opportunities: []
            });
        }
        
        // Analisar TODAS as oportunidades retornadas
        const analyzed = opportunities.map(opp => {
            const fields = opp.fields || {};
            const allFieldNames = Object.keys(fields).sort();
            
            // Procurar TODOS os campos que podem ser de data/hora
            const possibleDateTimeFields = allFieldNames.filter(k => {
                const kLower = k.toLowerCase();
                return kLower.includes('entrada') || kLower.includes('acolhimento') || 
                       kLower.includes('qualificado') || kLower.includes('qualificacao') ||
                       kLower.includes('orcamento') || kLower.includes('orçamento') ||
                       kLower.includes('negociacao') || kLower.includes('negociação') ||
                       kLower.includes('follow') || kLower.includes('followup') ||
                       kLower.includes('cadastro') || kLower.includes('compra') ||
                       kLower.includes('recompra') || kLower.includes('monitoramento') ||
                       kLower.includes('ativacao') || kLower.includes('ativação') ||
                       kLower.includes('reativacao') || kLower.includes('reativação') ||
                       kLower.includes('data') || kLower.includes('hora') || kLower.includes('time');
            });
            
            // Verificar valores dos campos de data/hora
            const dateTimeFieldsWithValues = {};
            possibleDateTimeFields.forEach(fieldName => {
                const value = fields[fieldName];
                if (value !== null && value !== undefined && value !== '') {
                    dateTimeFieldsWithValues[fieldName] = value;
                }
            });
            
            return {
                id: opp.id,
                title: opp.title,
                crm_column: opp.crm_column,
                status: opp.status,
                allFields: allFieldNames,
                possibleDateTimeFields: possibleDateTimeFields,
                dateTimeFieldsWithValues: dateTimeFieldsWithValues,
                mappedFields: mapStageDateTimeFields(fields),
                // Incluir TODOS os campos com valores para análise
                allFieldsWithValues: Object.keys(fields).reduce((acc, key) => {
                    if (fields[key] !== null && fields[key] !== undefined && fields[key] !== '') {
                        acc[key] = fields[key];
                    }
                    return acc;
                }, {})
            };
        });
        
        res.json({
            success: true,
            message: `Encontradas ${opportunities.length} oportunidades no Funil 33`,
            funnelId,
            stageId,
            totalFound: opportunities.length,
            opportunities: analyzed
        });
        
    } catch (error) {
        console.error('❌ Erro no endpoint de debug Funil 33:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Orquestrador sequencial com lock - permite sincronização seletiva
async function runFullSync(trigger = 'manual_api', options = {}) {
    // Opções: { syncOportunidades: true/false, syncLeads: true/false, syncSegmentos: true/false }
    // Por padrão, sincroniza tudo se nenhuma opção for especificada
    const {
        syncOportunidades = true,
        syncLeads = true,
        syncSegmentos = true
    } = options;

    // Se nenhuma opção foi especificada, sincroniza tudo (comportamento padrão)
    const syncAll = !options.hasOwnProperty('syncOportunidades') && 
                    !options.hasOwnProperty('syncLeads') && 
                    !options.hasOwnProperty('syncSegmentos');

    if (isSyncRunning) {
        console.log('⚠️ Sincronização já está em andamento');
        return {
            alreadyRunning: true,
            lastRun
        };
    }

    const syncTypes = [];
    if (syncAll || syncOportunidades) syncTypes.push('OPORTUNIDADES');
    if (syncAll || syncLeads) syncTypes.push('LEADS');
    // SEGMENTOS: só adicionar se explicitamente solicitado
    const shouldSyncSegmentos = syncSegmentos === true && options.hasOwnProperty('syncSegmentos') && !syncAll;
    if (shouldSyncSegmentos) syncTypes.push('SEGMENTOS');

    console.log('\n🚀 ============================================================');
    console.log(`🚀 INICIANDO SINCRONIZAÇÃO ${syncAll ? 'COMPLETA' : 'SELETIVA'}`);
    console.log('🚀 ============================================================');
    console.log(`📦 Versão da API: ${API_VERSION}`);
    console.log(`🔖 Commit: ${BUILD_INFO.hash}`);
    console.log(`📅 Trigger: ${trigger}`);
    console.log(`📋 Recursos: ${syncTypes.join(', ')}`);
    console.log(`⏰ Início: ${new Date().toISOString()}\n`);

    isSyncRunning = true;
    const startedAt = new Date();
    const summary = {};

    try {
        if (syncAll || syncOportunidades) {
            console.log('\n🔄 Sincronizando OPORTUNIDADES...');
            summary.oportunidades = await syncOpportunities();
            console.log(`✅ Oportunidades: ${summary.oportunidades?.totalProcessed || 0} processadas`);
        } else {
            summary.oportunidades = { totalProcessed: 0, totalErrors: 0, message: 'Pulado' };
        }
        
        if (syncAll || syncLeads) {
            console.log('\n🔄 Sincronizando LEADS...');
            summary.leads = await syncLeads();
            console.log(`✅ Leads: ${summary.leads?.totalProcessed || 0} processados`);
        } else {
            summary.leads = { totalProcessed: 0, totalErrors: 0, message: 'Pulado' };
        }
        
        // SEGMENTOS: SÓ SINCRONIZAR SE EXPLICITAMENTE SOLICITADO
        // REGRA RIGOROSA: syncSegmentos DEVE ser true E estar explicitamente nas opções
        const shouldSyncSegmentos = options.hasOwnProperty('syncSegmentos') && syncSegmentos === true && !syncAll;
        
        console.log('\n' + '='.repeat(80));
        console.log('🔍 DEBUG SEGMENTOS - VERIFICAÇÃO RIGOROSA');
        console.log('='.repeat(80));
        console.log(`   syncAll: ${syncAll}`);
        console.log(`   syncSegmentos (valor): ${syncSegmentos}`);
        console.log(`   hasOwnProperty('syncSegmentos'): ${options.hasOwnProperty('syncSegmentos')}`);
        console.log(`   shouldSyncSegmentos: ${shouldSyncSegmentos}`);
        console.log('='.repeat(80));
        
        if (shouldSyncSegmentos) {
            console.log('\n⚠️ ATENÇÃO: Sincronizando SEGMENTOS (explicitamente solicitado)...');
            try {
                summary.segmentos = await syncSegments();
                console.log(`✅ Segmentos: ${summary.segmentos?.totalProcessed || 0} processados`);
            } catch (segmentError) {
                console.error(`❌ Erro ao sincronizar segmentos (continuando...):`, segmentError.message);
                summary.segmentos = { totalProcessed: 0, totalErrors: 1, error: segmentError.message };
            }
        } else {
            console.log('✅ SEGMENTOS PULADOS - NÃO será sincronizado (não solicitado)');
            summary.segmentos = { totalProcessed: 0, totalErrors: 0, message: 'Pulado - não solicitado' };
        }
        console.log('='.repeat(80) + '\n');
        
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
        console.log(`✅ SINCRONIZAÇÃO ${syncAll ? 'COMPLETA' : 'SELETIVA'} FINALIZADA`);
        console.log('✅ ============================================================');
        console.log(`📊 Resumo:`);
        console.log(`   Oportunidades: ${summary.oportunidades?.totalProcessed || 0} processadas ${summary.oportunidades?.message ? `(${summary.oportunidades.message})` : ''}`);
        console.log(`   Leads: ${summary.leads?.totalProcessed || 0} processados ${summary.leads?.message ? `(${summary.leads.message})` : ''}`);
        console.log(`   Segmentos: ${summary.segmentos?.totalProcessed || 0} processados ${summary.segmentos?.message ? `(${summary.segmentos.message})` : ''}`);
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
        
        // Permitir sincronização seletiva via query params ou body
        const options = {
            syncOportunidades: req.query?.oportunidades !== 'false' && req.body?.oportunidades !== false,
            syncLeads: req.query?.leads !== 'false' && req.body?.leads !== false,
            syncSegmentos: req.query?.segmentos !== 'false' && req.body?.segmentos !== false
        };
        
        const result = await runFullSync(trigger, options);
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

// Handler para sincronização apenas de oportunidades
const handleSyncOportunidades = async (req, res) => {
    try {
        const trigger = (req.method === 'GET' ? req.query?.trigger : req.body?.trigger) || 'manual_oportunidades';
        console.log('🚀 handleSyncOportunidades chamado - GARANTINDO que syncSegmentos=false');
        // FORÇAR syncSegmentos=false explicitamente para garantir que nunca sincronize segmentos
        const options = { 
            syncOportunidades: true, 
            syncLeads: false, 
            syncSegmentos: false  // EXPLICITAMENTE false
        };
        console.log('🔍 Opções passadas para runFullSync:', JSON.stringify(options));
        const result = await runFullSync(trigger, options);
        if (result.alreadyRunning) {
            return res.json({
                success: true,
                message: 'Execução já em andamento',
                data: result.lastRun
            });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('❌ Erro na sincronização de oportunidades:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Handler para sincronização apenas de leads
const handleSyncLeads = async (req, res) => {
    try {
        const trigger = (req.method === 'GET' ? req.query?.trigger : req.body?.trigger) || 'manual_leads';
        const result = await runFullSync(trigger, { syncOportunidades: false, syncLeads: true, syncSegmentos: false });
        if (result.alreadyRunning) {
            return res.json({
                success: true,
                message: 'Execução já em andamento',
                data: result.lastRun
            });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('❌ Erro na sincronização de leads:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Handler para sincronização apenas de segmentos
const handleSyncSegmentos = async (req, res) => {
    try {
        const trigger = (req.method === 'GET' ? req.query?.trigger : req.body?.trigger) || 'manual_segmentos';
        const result = await runFullSync(trigger, { syncOportunidades: false, syncLeads: false, syncSegmentos: true });
        if (result.alreadyRunning) {
            return res.json({
                success: true,
                message: 'Execução já em andamento',
                data: result.lastRun
            });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('❌ Erro na sincronização de segmentos:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Handler para sincronização de leads + segmentos (para madrugada)
const handleSyncLeadsSegmentos = async (req, res) => {
    try {
        const trigger = (req.method === 'GET' ? req.query?.trigger : req.body?.trigger) || 'manual_leads_segmentos';
        const result = await runFullSync(trigger, { syncOportunidades: false, syncLeads: true, syncSegmentos: true });
        if (result.alreadyRunning) {
            return res.json({
                success: true,
                message: 'Execução já em andamento',
                data: result.lastRun
            });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('❌ Erro na sincronização de leads e segmentos:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Endpoints principais
app.post('/sync/all', handleFullSync);
app.get(['/sync/all', '/sync', '/oportunidades/sync', '/oportunidades/sync/all'], handleFullSync);

// Endpoint /api/sync-now (compatível com TopMenuBar)
app.post('/api/sync-now', handleFullSync);
app.get('/api/sync-now', handleFullSync);

// Endpoints específicos para sincronização seletiva
app.get('/sync/oportunidades', handleSyncOportunidades);
app.post('/sync/oportunidades', handleSyncOportunidades);

app.get('/sync/leads', handleSyncLeads);
app.post('/sync/leads', handleSyncLeads);

app.get('/sync/segmentos', handleSyncSegmentos);
app.post('/sync/segmentos', handleSyncSegmentos);

app.get('/sync/leads-segmentos', handleSyncLeadsSegmentos);
app.post('/sync/leads-segmentos', handleSyncLeadsSegmentos);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 API de sincronização de oportunidades rodando na porta ${PORT}`);
    console.log(`📡 Endpoints disponíveis:`);
    console.log(`   GET /oportunidades  | /  - Sincronizar oportunidades`);
    console.log(`   GET /oportunidades/status  | /status - Status das oportunidades`);
    console.log(`   GET /health - Health check`);
    console.log(`   GET /version - Versão da API`);
    console.log(`\n📡 Endpoints de sincronização:`);
    console.log(`   GET /sync/all - Sincronizar tudo (oportunidades + leads + segmentos)`);
    console.log(`   GET /sync/oportunidades - Sincronizar apenas oportunidades`);
    console.log(`   GET /sync/leads - Sincronizar apenas leads`);
    console.log(`   GET /sync/segmentos - Sincronizar apenas segmentos`);
    console.log(`   GET /sync/leads-segmentos - Sincronizar leads + segmentos (para madrugada)`);
    console.log(`\n💡 Dica: Use /sync/oportunidades no horário padrão e /sync/leads-segmentos de madrugada`);
});

module.exports = app;

