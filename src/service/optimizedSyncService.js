/**
 * 🚀 SERVIÇO DE SINCRONIZAÇÃO OTIMIZADO
 * 
 * Melhorias implementadas:
 * - Processamento em lotes maiores (batch size 20)
 * - Redução de delays (50ms ao invés de 100-200ms)
 * - Verificação em lote no Supabase
 * - Processamento paralelo de funis
 * - Cache de verificações
 * - Paginação maior (100 itens)
 */

const SPRINTHUB_CONFIG = {
    baseUrl: 'sprinthub-api-master.sprinthub.app',
    instance: 'oficialmed',
    apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c'
};

import { supabaseUrl, supabaseServiceKey } from '../config/supabase.js';

const SUPABASE_CONFIG = {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceKey
};

// 📋 CONFIGURAÇÃO COMPLETA DOS FUNIS E ETAPAS
const FUNIS_CONFIG = {
    6: {
        name: "[1] COMERCIAL APUCARANA",
        stages: [
            { id: 130, name: "[0] ENTRADA" },
            { id: 231, name: "[1] ACOLHIMENTO/TRIAGEM" },
            { id: 82, name: "[2] QUALIFICADO" },
            { id: 207, name: "[3] ORÇAMENTO REALIZADO" },
            { id: 83, name: "[4] NEGOCIAÇÃO" },
            { id: 85, name: "[5] FOLLOW UP" },
            { id: 232, name: "[6] CADASTRO" }
        ]
    },
    9: {
        name: "[1] LOGÍSTICA MANIPULAÇÃO",
        stages: [
            { id: 101, name: "Fila Logística" },
            { id: 243, name: "Separação" },
            { id: 266, name: "Preparação" },
            { id: 244, name: "Produção" },
            { id: 245, name: "Finalização" },
            { id: 105, name: "Faturamento" },
            { id: 108, name: "Entrega" },
            { id: 267, name: "Pendências" },
            { id: 109, name: "Conferência" },
            { id: 261, name: "Expedição" },
            { id: 262, name: "Em Transporte" },
            { id: 263, name: "Saiu para Entrega" },
            { id: 278, name: "Reentregas" },
            { id: 110, name: "Concluído" }
        ]
    },
    14: {
        name: "[2] RECOMPRA",
        stages: [
            { id: 227, name: "[X] PROMO" },
            { id: 202, name: "[0] ENTRADA" },
            { id: 228, name: "[1] ACOLHIMENTO/TRIAGEM" },
            { id: 229, name: "[2] QUALIFICAÇÃO" },
            { id: 206, name: "[3] ORÇAMENTOS" },
            { id: 203, name: "[4] NEGOCIAÇÃO" },
            { id: 204, name: "[5] FOLLOW UP" },
            { id: 230, name: "[6] CADASTRO" },
            { id: 205, name: "[X] PARCEIROS" },
            { id: 241, name: "[0] MONITORAMENTO" },
            { id: 146, name: "[1] DISPARO" },
            { id: 147, name: "[2] DIA 1 - 1º TENTATIVA" },
            { id: 167, name: "[3] DIA 1 - 2º TENTATIVA" },
            { id: 148, name: "[4] DIA 2 - 1º TENTATIVA" },
            { id: 168, name: "[5] DIA 2 - 2º TENTATIVA" },
            { id: 149, name: "[6] DIA 3 - 1º TENTATIVA" },
            { id: 169, name: "[7] DIA 3 - 2º TENTATIVA" },
            { id: 150, name: "[8] FOLLOW UP INFINITO" }
        ]
    }
};

// Configurações otimizadas
const OPTIMIZATION_CONFIG = {
    PAGE_LIMIT: 100,           // Aumentado de 50 para 100
    BATCH_SIZE: 20,            // Aumentado de 5 para 20
    DELAY_BETWEEN_PAGES: 50,   // Reduzido de 200ms para 50ms
    DELAY_BETWEEN_BATCHES: 30, // Reduzido de 100ms para 30ms
    PARALLEL_STAGES: 3,        // Processar 3 etapas em paralelo
    CACHE_DURATION: 60000,     // 1 minuto de cache
    REQUEST_RETRIES: 3,        // Tentativas por requisição SprintHub
    RETRY_DELAY_MS: 750,       // Delay incremental entre tentativas gerais
    RETRY_DELAY_AUTH_MS: 2000, // Delay específico para 401/403
    RECENT_WINDOW_HOURS: 48    // Janela de tempo para sincronização incremental
};

// Cache de verificações
const verificationCache = new Map();

// Colunas válidas na tabela api.oportunidade_sprint
const SUPABASE_ALLOWED_FIELDS = new Set([
    'id',
    'title',
    'value',
    'crm_column',
    'lead_id',
    'sequence',
    'status',
    'loss_reason',
    'gain_reason',
    'expected_close_date',
    'sale_channel',
    'campaign',
    'user_id',
    'last_column_change',
    'last_status_change',
    'gain_date',
    'lost_date',
    'reopen_date',
    'await_column_approved',
    'await_column_approved_user',
    'reject_appro',
    'reject_appro_desc',
    'conf_installment',
    'create_date',
    'update_date',
    'origem_oportunidade',
    'tipo_de_compra',
    'qualificacao',
    'primecadastro',
    'data_recompra',
    'codigo_prime_receita',
    'descricao_da_formula',
    'descricao_formula',
    'id_api_max',
    'id_transacao',
    'link_pgto',
    'numero_do_pedido',
    'requisicao1',
    'requisicao_2',
    'requisicao_3',
    'status_getnet',
    'status_orcamento',
    'status_log',
    'status_melhor_envio',
    'valorconfere',
    'pagamento',
    'forma_pagamento',
    'frete',
    'frete_cobrado',
    'frete_pago',
    'frete_height',
    'frete_length',
    'frete_weight',
    'frete_width',
    'frete_origem',
    'frete_produto',
    'valorfrete',
    'cidade_entrega',
    'codigo_de_rastreio',
    'codigo_delivery',
    'corrida',
    'coleta',
    'data_de_entrega',
    'data_de_saida',
    'data_ganho_correto',
    'delivery',
    'entregue_para',
    'filial',
    'id_correio',
    'informacoes_preenchidas',
    'ord_melhor_envio',
    'observacao_logistica',
    'rota',
    'tentativa_de_entrega',
    'tipo',
    'tipo_de_frete',
    'url_etiqueta',
    'valor_a_receber_moto',
    'etapa',
    'codigo_id_lead',
    'codigo_id_oportunidade',
    'id_oportunidade',
    'req',
    'local_da_compra',
    'utm_campaign',
    'utm_content',
    'utm_medium',
    'utm_source',
    'utm_term',
    'utm_origin',
    'utm_referer',
    'utm_date_added',
    'archived',
    'synced_at',
    'lead_firstname',
    'lead_lastname',
    'lead_cpf',
    'lead_city',
    'lead_bairro',
    'lead_rua',
    'lead_numero',
    'lead_pais',
    'lead_zipcode',
    'lead_data_nascimento',
    'lead_email',
    'lead_recebedor',
    'lead_whatsapp',
    'lead_rg',
    'lead_linkpagamento',
    'vendedor',
    'funil_id',
    'funil_nome',
    'unidade_id'
]);

const KNOWN_OPPORTUNITY_FIELD_LABELS = new Set([
    'ORIGEM OPORTUNIDADE',
    'Tipo de Compra',
    'QUALIFICACAO',
    'PRIMECADASTRO',
    'DATA RECOMPRA',
    'Codigo Prime Receita',
    'Descricao da Formula',
    'Id ApiMax',
    'Id Transacao',
    'LinkPgto',
    'Numero do pedido',
    'requisicao1',
    'Requisicao 1',
    'Requisicao 2',
    'Requisicao 3',
    'Status Getnet',
    'Status Orcamento',
    'Status Log',
    'Status Melhor Envio',
    'Valorconfere',
    'PAGAMENTO',
    'Forma Pagamento',
    'Frete',
    'FRETE COBRADO',
    'FRETE PAGO',
    'freteheight',
    'fretelength',
    'freteweight',
    'fretewidth',
    'freteorigem',
    'freteproduto',
    'Local da Compra',
    'valorfrete',
    'Codigo ID Lead',
    'Codigo ID Oportunidade',
    'idoportunidade',
    'REQ',
    'CIDADE ENTREGA',
    'CODIGO DE RASTREIO',
    'CODIGO DELIVERY',
    'CORRIDA',
    'Coleta',
    'DATA DE ENTREGA',
    'DATA DE SAIDA',
    'DATA GANHO CORRETO',
    'DELIVERY',
    'ENTREGUE PARA',
    'FILIAL',
    'ID Correio',
    'INFORMAES PREENCHIDAS',
    'ORD Melhor Envio',
    'Observao Logstica',
    'ROTA',
    'TENTATIVA DE ENTREGA',
    'TIPO',
    'Tipo de Frete',
    'URL Etiqueta',
    'VALOR A RECEBER MOTO',
    'etapa',
    'VENDEDOR'
]);

const unknownOpportunityFieldSamples = new Map();

function sanitizeSupabasePayload(data) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        if (SUPABASE_ALLOWED_FIELDS.has(key)) {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

function parseDateValue(value) {
    return parseBrazilianDate(value);
}

function parseNumberValue(value) {
    if (value === null || value === undefined || value === '') return null;
    let parsed = value;
    if (typeof value === 'string') {
        const normalized = value
            .replace(/\s+/g, '')
            .replace(/R\$/gi, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^0-9.-]/g, '');
        parsed = normalized === '' || normalized === '.' || normalized === '-' ? null : normalized;
    }
    if (parsed === null) return null;
    const num = Number(parsed);
    return Number.isFinite(num) ? num : null;
}

function parseBooleanValue(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'sim'].includes(normalized)) return true;
        if (['false', '0', 'no', 'nao', 'não', 'nao'].includes(normalized)) return false;
    }
    return null;
}

function normalizeFieldsObject(fields) {
    if (!fields || typeof fields !== 'object') return {};
    const normalized = {};
    for (const [key, value] of Object.entries(fields)) {
        if (typeof key !== 'string') continue;
        normalized[key.trim()] = value;
    }
    return normalized;
}

function pickFieldValue(fieldMap, ...keys) {
    for (const key of keys) {
        if (!key) continue;
        if (Object.prototype.hasOwnProperty.call(fieldMap, key)) {
            return fieldMap[key];
        }
    }
    return null;
}

function normalizeEmptyValue(value) {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return value;
}

function getFunilIdByColumn(crmColumn) {
    if ([130, 231, 82, 207, 83, 85, 232].includes(crmColumn)) return 6;
    if ([101, 243, 266, 244, 245, 105, 108, 267, 109, 261, 262, 263, 278, 110].includes(crmColumn)) return 9;
    if ([227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150].includes(crmColumn)) return 14;
    return null;
}

function trackUnknownOpportunityFields(fieldsMap, opportunity) {
    if (!fieldsMap) return;
    for (const [key, value] of Object.entries(fieldsMap)) {
        if (!KNOWN_OPPORTUNITY_FIELD_LABELS.has(key)) {
            const normalizedValue = normalizeEmptyValue(value);
            if (normalizedValue === null) continue;
            if (!unknownOpportunityFieldSamples.has(key)) {
                unknownOpportunityFieldSamples.set(key, {
                    value: normalizedValue,
                    opportunityId: opportunity?.id ?? null,
                    crmColumn: opportunity?.crm_column ?? null,
                    funilId: getFunilIdByColumn(opportunity?.crm_column) ?? null
                });
            }
        }
    }
}

async function reportMissingFields(resource, samplesMap) {
    if (!samplesMap || samplesMap.size === 0) return;
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.serviceRoleKey) {
        console.warn(`⚠️ Não foi possível registrar campos faltantes (${resource}): configuração Supabase incompleta.`);
        return;
    }

    const url = `${SUPABASE_CONFIG.url}/rest/v1/rpc/log_missing_field`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
        'apikey': SUPABASE_CONFIG.serviceRoleKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
    };

    for (const [fieldName, sample] of samplesMap.entries()) {
        try {
            await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    p_resource: resource,
                    p_field_name: fieldName,
                    p_sample: sample ?? null
                })
            });
        } catch (error) {
            console.warn(`⚠️ Falha ao registrar campo faltante (${resource} :: ${fieldName}): ${error.message}`);
        }
    }
}

function normalizeFields(rawFields = {}) {
    const normalized = {};
    for (const [key, value] of Object.entries(rawFields)) {
        if (!key) continue;
        normalized[key.trim()] = value;
    }
    return normalized;
}

/**
 * Delay otimizado
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parsear data brasileira (DD/MM/YYYY) ou ISO
 */
function parseBrazilianDate(dateString) {
    if (!dateString) return null;
    
    try {
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                const date = new Date(year, month - 1, day);
                return date.toISOString();
            }
        } else if (dateString.includes('T')) {
            return new Date(dateString).toISOString();
        } else {
            return new Date(dateString).toISOString();
        }
    } catch (error) {
        console.warn(`⚠️ Erro ao parsear data: ${dateString}`, error);
        return null;
    }
    
    return null;
}

/**
 * Verificar se data é das últimas 48 horas
 */
function isRecent48Hours(dateString) {
    if (!dateString) return false;
    
    try {
        let date;
        if (dateString.includes('/')) {
            const [day, month, year] = dateString.split('/');
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(dateString);
        }
        
        const hoursAgo48 = new Date();
        hoursAgo48.setHours(hoursAgo48.getHours() - 48);
        
        return date >= hoursAgo48;
    } catch (error) {
        return false;
    }
}

/**
 * Buscar oportunidades de uma etapa específica (com paginação otimizada)
 */
async function fetchOpportunitiesFromStage(funnelId, stageId, page = 0) {
    const payload = {
        page,
        limit: OPTIMIZATION_CONFIG.PAGE_LIMIT,
        columnId: stageId
    };

    const postData = JSON.stringify(payload);

    for (let attempt = 1; attempt <= OPTIMIZATION_CONFIG.REQUEST_RETRIES; attempt++) {
        try {
            const response = await fetch(
                `https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`, 
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Accept': 'application/json'
                    },
                    body: postData
                }
            );

            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data : [];
            }

            if (response.status === 400) {
                console.warn(`⚠️ SprintHub retornou 400 para funil ${funnelId}, etapa ${stageId}, página ${page}. Considerando fim da paginação.`);
                return [];
            }

            if ((response.status === 401 || response.status === 403)) {
                const retryRemaining = OPTIMIZATION_CONFIG.REQUEST_RETRIES - attempt;
                if (retryRemaining > 0) {
                    console.warn(`⚠️ SprintHub retornou ${response.status} para funil ${funnelId}, etapa ${stageId}, página ${page}. Tentativa ${attempt}/${OPTIMIZATION_CONFIG.REQUEST_RETRIES}. Aguardando ${OPTIMIZATION_CONFIG.RETRY_DELAY_AUTH_MS}ms antes de retry.`);
                    await delay(OPTIMIZATION_CONFIG.RETRY_DELAY_AUTH_MS);
                    continue;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText || 'Unauthorized'}`);
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (error) {
            if (attempt >= OPTIMIZATION_CONFIG.REQUEST_RETRIES) {
                console.error(`❌ Erro ao buscar etapa ${stageId} (funil ${funnelId}, página ${page}) após ${attempt} tentativas:`, error);
                return [];
            }

            const backoff = OPTIMIZATION_CONFIG.RETRY_DELAY_MS * attempt;
            console.warn(`⚠️ Erro na tentativa ${attempt} ao buscar etapa ${stageId} (funil ${funnelId}). Aguardando ${backoff}ms para tentar novamente. Detalhes: ${error.message}`);
            await delay(backoff);
        }
    }

    return [];
}

/**
 * Buscar TODAS as oportunidades recentes (últimas 48h) de uma etapa
 */
async function fetchRecentOpportunitiesFromStage(funnelId, stageId) {
    let allOpportunities = [];
    let page = 0;

    while (true) {
        try {
            const opportunities = await fetchOpportunitiesFromStage(funnelId, stageId, page);
            
            if (opportunities.length === 0) {
                break;
            }
            
            // Filtrar apenas últimas 48 horas
            const recentOpps = opportunities.filter(opp => isRecent48Hours(opp.updateDate));
            allOpportunities = allOpportunities.concat(recentOpps);

            // Se não encontrou nenhuma oportunidade recente in loco, assumir que as próximas páginas são ainda mais antigas
            if (recentOpps.length === 0) {
                break;
            }
            
            // Se retornou menos que o limite, significa que esta é a última página fornecida pela API
            if (opportunities.length < OPTIMIZATION_CONFIG.PAGE_LIMIT) {
                break;
            }
            
            page++;
            await delay(OPTIMIZATION_CONFIG.DELAY_BETWEEN_PAGES);
        } catch (error) {
            console.log(`   ❌ Erro na página ${page}: ${error.message}`);
            break;
        }
    }

    return allOpportunities;
}

/**
 * Verificar múltiplas oportunidades no Supabase de uma vez (BATCH)
 */
async function checkMultipleInSupabase(opportunityIds) {
    if (opportunityIds.length === 0) return {};
    
    try {
        // Verificar cache primeiro
        const cached = {};
        const uncachedIds = [];
        
        for (const id of opportunityIds) {
            const cacheKey = `verify_${id}`;
            if (verificationCache.has(cacheKey)) {
                const cacheEntry = verificationCache.get(cacheKey);
                if (Date.now() - cacheEntry.timestamp < OPTIMIZATION_CONFIG.CACHE_DURATION) {
                    cached[id] = cacheEntry.data;
                    continue;
                }
            }
            uncachedIds.push(id);
        }
        
        if (uncachedIds.length === 0) {
            return cached;
        }
        
        // Buscar em lote no Supabase
        const idsFilter = uncachedIds.map(id => `id.eq.${id}`).join(',');
        const response = await fetch(
            `${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?or=(${idsFilter})&select=id,update_date,synced_at,create_date`, 
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                    'apikey': SUPABASE_CONFIG.serviceRoleKey,
                    'Accept-Profile': 'api'
                }
            }
        );

        if (!response.ok) return cached;
        
        const data = await response.json();
        const result = { ...cached };
        
        // Mapear resultados por ID
        if (Array.isArray(data)) {
            data.forEach(record => {
                result[record.id] = record;
                // Adicionar ao cache
                verificationCache.set(`verify_${record.id}`, {
                    data: record,
                    timestamp: Date.now()
                });
            });
        }
        
        // Adicionar IDs não encontrados ao cache
        uncachedIds.forEach(id => {
            if (!result[id]) {
                result[id] = null;
                verificationCache.set(`verify_${id}`, {
                    data: null,
                    timestamp: Date.now()
                });
            }
        });
        
        return result;
        
    } catch (error) {
        console.error(`❌ Erro ao verificar IDs em lote:`, error);
        return {};
    }
}

/**
 * Mapear campos da oportunidade do SprintHub para Supabase
 */
function mapOpportunityFields(opportunity) {
    const fieldsMap = normalizeFieldsObject(opportunity.fields || {});
    const lead = opportunity.dataLead || {};
    const utmSource = Array.isArray(lead.utmTags) ? (lead.utmTags[0] || {}) : (lead.utmTags || {});
    const utmTags = utmSource || {};

    trackUnknownOpportunityFields(fieldsMap, opportunity);

    const funilId = getFunilIdByColumn(opportunity.crm_column);
    const funilNome = funilId ? (FUNIS_CONFIG[funilId]?.name || null) : null;
    const parsedValue = parseNumberValue(opportunity.value);

    const data = {
        id: opportunity.id,
        title: normalizeEmptyValue(opportunity.title),
        value: parsedValue !== null ? parsedValue : 0,
        crm_column: opportunity.crm_column ?? null,
        lead_id: opportunity.lead_id ?? null,
        sequence: parseNumberValue(opportunity.sequence),
        status: normalizeEmptyValue(opportunity.status),
        loss_reason: parseNumberValue(opportunity.loss_reason),
        gain_reason: parseNumberValue(opportunity.gain_reason),
        expected_close_date: parseDateValue(opportunity.expectedCloseDate),
        sale_channel: normalizeEmptyValue(opportunity.sale_channel),
        campaign: normalizeEmptyValue(opportunity.campaign),
        user_id: parseNumberValue(opportunity.user),
        last_column_change: parseDateValue(opportunity.last_column_change),
        last_status_change: parseDateValue(opportunity.last_status_change),
        gain_date: parseDateValue(opportunity.gain_date),
        lost_date: parseDateValue(opportunity.lost_date),
        reopen_date: parseDateValue(opportunity.reopen_date),
        create_date: parseBrazilianDate(opportunity.createDate),
        update_date: parseBrazilianDate(opportunity.updateDate),
        archived: opportunity.archived ?? 0,
        await_column_approved: parseBooleanValue(opportunity.await_column_approved),
        await_column_approved_user: parseNumberValue(opportunity.await_column_approved_user),
        reject_appro: parseBooleanValue(opportunity.reject_appro),
        reject_appro_desc: normalizeEmptyValue(opportunity.reject_appro_desc),
        conf_installment: null,
        origem_oportunidade: normalizeEmptyValue(pickFieldValue(fieldsMap, 'ORIGEM OPORTUNIDADE')),
        tipo_de_compra: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Tipo de Compra')),
        qualificacao: normalizeEmptyValue(pickFieldValue(fieldsMap, 'QUALIFICACAO')),
        primecadastro: parseNumberValue(pickFieldValue(fieldsMap, 'PRIMECADASTRO')),
        data_recompra: normalizeEmptyValue(pickFieldValue(fieldsMap, 'DATA RECOMPRA')),
        codigo_prime_receita: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Codigo Prime Receita')),
        descricao_da_formula: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Descricao da Formula')),
        descricao_formula: normalizeEmptyValue(lead.descricao_formula || pickFieldValue(fieldsMap, 'Descricao da Formula')),
        id_api_max: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Id ApiMax')),
        id_transacao: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Id Transacao')),
        link_pgto: normalizeEmptyValue(pickFieldValue(fieldsMap, 'LinkPgto')),
        numero_do_pedido: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Numero do pedido')),
        requisicao1: normalizeEmptyValue(pickFieldValue(fieldsMap, 'requisicao1', 'Requisicao 1')),
        requisicao_2: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Requisicao 2')),
        requisicao_3: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Requisicao 3')),
        status_getnet: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Status Getnet')),
        status_orcamento: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Status Orcamento')),
        status_log: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Status Log')),
        status_melhor_envio: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Status Melhor Envio')),
        valorconfere: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Valorconfere')),
        pagamento: normalizeEmptyValue(pickFieldValue(fieldsMap, 'PAGAMENTO')),
        forma_pagamento: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Forma Pagamento')),
        frete: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Frete')),
        frete_cobrado: normalizeEmptyValue(pickFieldValue(fieldsMap, 'FRETE COBRADO')),
        frete_pago: normalizeEmptyValue(pickFieldValue(fieldsMap, 'FRETE PAGO')),
        frete_height: parseNumberValue(pickFieldValue(fieldsMap, 'freteheight')),
        frete_length: parseNumberValue(pickFieldValue(fieldsMap, 'fretelength')),
        frete_weight: parseNumberValue(pickFieldValue(fieldsMap, 'freteweight')),
        frete_width: parseNumberValue(pickFieldValue(fieldsMap, 'fretewidth')),
        frete_origem: normalizeEmptyValue(pickFieldValue(fieldsMap, 'freteorigem')),
        frete_produto: normalizeEmptyValue(pickFieldValue(fieldsMap, 'freteproduto')),
        local_da_compra: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Local da Compra')),
        valorfrete: normalizeEmptyValue(pickFieldValue(fieldsMap, 'valorfrete')),
        codigo_id_lead: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Codigo ID Lead')),
        codigo_id_oportunidade: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Codigo ID Oportunidade')),
        id_oportunidade: normalizeEmptyValue(pickFieldValue(fieldsMap, 'idoportunidade')),
        req: normalizeEmptyValue(pickFieldValue(fieldsMap, 'REQ')),
        cidade_entrega: normalizeEmptyValue(pickFieldValue(fieldsMap, 'CIDADE ENTREGA')),
        codigo_de_rastreio: normalizeEmptyValue(pickFieldValue(fieldsMap, 'CODIGO DE RASTREIO')),
        codigo_delivery: normalizeEmptyValue(pickFieldValue(fieldsMap, 'CODIGO DELIVERY')),
        corrida: normalizeEmptyValue(pickFieldValue(fieldsMap, 'CORRIDA')),
        coleta: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Coleta')),
        data_de_entrega: parseDateValue(pickFieldValue(fieldsMap, 'DATA DE ENTREGA')),
        data_de_saida: parseDateValue(pickFieldValue(fieldsMap, 'DATA DE SAIDA')),
        data_ganho_correto: normalizeEmptyValue(pickFieldValue(fieldsMap, 'DATA GANHO CORRETO')),
        delivery: normalizeEmptyValue(pickFieldValue(fieldsMap, 'DELIVERY')),
        entregue_para: normalizeEmptyValue(pickFieldValue(fieldsMap, 'ENTREGUE PARA')),
        filial: normalizeEmptyValue(pickFieldValue(fieldsMap, 'FILIAL')),
        id_correio: normalizeEmptyValue(pickFieldValue(fieldsMap, 'ID Correio')),
        informacoes_preenchidas: normalizeEmptyValue(pickFieldValue(fieldsMap, 'INFORMAES PREENCHIDAS')),
        ord_melhor_envio: normalizeEmptyValue(pickFieldValue(fieldsMap, 'ORD Melhor Envio')),
        observacao_logistica: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Observao Logstica')),
        rota: normalizeEmptyValue(pickFieldValue(fieldsMap, 'ROTA')),
        tentativa_de_entrega: normalizeEmptyValue(pickFieldValue(fieldsMap, 'TENTATIVA DE ENTREGA')),
        tipo: normalizeEmptyValue(pickFieldValue(fieldsMap, 'TIPO')),
        tipo_de_frete: normalizeEmptyValue(pickFieldValue(fieldsMap, 'Tipo de Frete')),
        url_etiqueta: normalizeEmptyValue(pickFieldValue(fieldsMap, 'URL Etiqueta')),
        valor_a_receber_moto: normalizeEmptyValue(pickFieldValue(fieldsMap, 'VALOR A RECEBER MOTO')),
        etapa: normalizeEmptyValue(pickFieldValue(fieldsMap, 'etapa')),
        vendedor: normalizeEmptyValue(pickFieldValue(fieldsMap, 'VENDEDOR')),
        funil_id: funilId,
        funil_nome: funilNome,
        unidade_id: '[1]',
        utm_campaign: normalizeEmptyValue(utmTags.utmCampaign || utmTags.campaign),
        utm_content: normalizeEmptyValue(utmTags.utmContent),
        utm_medium: normalizeEmptyValue(utmTags.utmMedium),
        utm_source: normalizeEmptyValue(utmTags.utmSource || utmTags.source),
        utm_term: normalizeEmptyValue(utmTags.utmTerm),
        utm_origin: normalizeEmptyValue(utmTags.origin || utmTags.utmOrigin),
        utm_referer: normalizeEmptyValue(utmTags.referer || utmTags.utmReferer),
        utm_date_added: parseDateValue(utmTags.dateAdded || utmTags.utmDateAdded),
        lead_firstname: normalizeEmptyValue(lead.firstname),
        lead_lastname: normalizeEmptyValue(lead.lastname),
        lead_cpf: normalizeEmptyValue(lead.cpf),
        lead_city: normalizeEmptyValue(lead.city),
        lead_bairro: normalizeEmptyValue(lead.bairro),
        lead_rua: normalizeEmptyValue(lead.rua),
        lead_numero: normalizeEmptyValue(lead.numero),
        lead_pais: normalizeEmptyValue(lead.pais),
        lead_zipcode: normalizeEmptyValue(lead.zipcode),
        lead_data_nascimento: parseDateValue(lead.data_de_nascimento),
        lead_email: normalizeEmptyValue(lead.email),
        lead_recebedor: normalizeEmptyValue(lead.recebedor),
        lead_whatsapp: normalizeEmptyValue(lead.whatsapp),
        lead_rg: normalizeEmptyValue(lead.rg),
        lead_linkpagamento: normalizeEmptyValue(lead.linkpagamento),
        synced_at: new Date().toISOString()
    };

    const rawConfInstallment = opportunity.conf_installment ?? opportunity.confInstallment ?? pickFieldValue(fieldsMap, 'conf_installment');
    if (rawConfInstallment !== undefined && rawConfInstallment !== null) {
        if (typeof rawConfInstallment === 'string') {
            try {
                data.conf_installment = JSON.parse(rawConfInstallment);
            } catch {
                data.conf_installment = rawConfInstallment;
            }
        } else {
            data.conf_installment = rawConfInstallment;
        }
    }

    return data;
}

/**
 * Inserir em lote no Supabase (BULK INSERT)
 */
async function bulkInsertToSupabase(dataArray) {
    if (dataArray.length === 0) return { success: true, count: 0 };
    
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api',
                'Content-Profile': 'api',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(dataArray)
        });

        return { 
            success: response.ok, 
            status: response.status,
            count: dataArray.length 
        };
        
    } catch (error) {
        console.error('❌ Erro ao inserir em lote:', error);
        return { success: false, error: error.message, count: 0 };
    }
}

/**
 * Atualizar no Supabase
 */
async function updateInSupabase(opportunityId, data) {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api',
                'Content-Profile': 'api',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        });

        return { success: response.ok, status: response.status };
        
    } catch (error) {
        console.error('❌ Erro ao atualizar:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Processar lote de oportunidades (OTIMIZADO)
 */
async function processBatch(opportunities, existingRecords) {
    const toInsert = [];
    const toUpdate = [];
    let skipped = 0;
    
    // Separar em inserções e atualizações
    for (const opp of opportunities) {
        const existing = existingRecords[opp.id];
        const mappedData = sanitizeSupabasePayload(mapOpportunityFields(opp));
        
        if (!existing) {
            toInsert.push(mappedData);
        } else {
            // Verificar se precisa atualizar
            const sprintHubDate = new Date(opp.updateDate);
            const supabaseDate = new Date(existing.update_date);
            
            if (sprintHubDate > supabaseDate) {
                toUpdate.push({ id: opp.id, data: mappedData });
            } else {
                skipped++;
            }
        }
    }
    
    // Executar inserções em lote
    let insertedCount = 0;
    if (toInsert.length > 0) {
        const insertResult = await bulkInsertToSupabase(toInsert);
        if (insertResult.success) {
            insertedCount = insertResult.count;
            console.log(`   ➕ Inseridas ${insertedCount} oportunidades em lote`);
        }
    }
    
    // Executar atualizações em paralelo (lotes de 10)
    let updatedCount = 0;
    const UPDATE_BATCH = 10;
    for (let i = 0; i < toUpdate.length; i += UPDATE_BATCH) {
        const updateBatch = toUpdate.slice(i, i + UPDATE_BATCH);
        const updatePromises = updateBatch.map(item => 
            updateInSupabase(item.id, item.data)
        );
        
        const results = await Promise.all(updatePromises);
        updatedCount += results.filter(r => r.success).length;
    }
    
    if (updatedCount > 0) {
        console.log(`   🔄 Atualizadas ${updatedCount} oportunidades`);
    }
    
    return {
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skipped
    };
}

/**
 * Sincronizar etapa específica (OTIMIZADO)
 */
async function syncStageOptimized(funnelId, stageId, stageName = 'Etapa', options = {}) {
    const { onProgress = null } = options;
    
    console.log(`🔄 [OTIMIZADO] Sincronizando ${stageName} (ID: ${stageId}) do Funil ${funnelId}...`);
    
    let processed = 0, inserted = 0, updated = 0, skipped = 0, errors = 0;
    
    try {
        // Buscar oportunidades recentes (últimas 48h)
        const opportunities = await fetchRecentOpportunitiesFromStage(funnelId, stageId);
        console.log(`📊 Encontradas ${opportunities.length} oportunidades recentes (48h) no SprintHub`);
        
        if (opportunities.length === 0) {
            return {
                success: true,
                stageName,
                processed: 0,
                inserted: 0,
                updated: 0,
                skipped: 0,
                errors: 0,
                total: 0
            };
        }
        
        // Processar em lotes
        for (let i = 0; i < opportunities.length; i += OPTIMIZATION_CONFIG.BATCH_SIZE) {
            const batch = opportunities.slice(i, i + OPTIMIZATION_CONFIG.BATCH_SIZE);
            
            if (onProgress) {
                onProgress({
                    stage: stageName,
                    status: `Processando ${i + 1}-${Math.min(i + OPTIMIZATION_CONFIG.BATCH_SIZE, opportunities.length)}/${opportunities.length}...`,
                    progress: Math.round((i / opportunities.length) * 100)
                });
            }
            
            try {
                // Verificar quais já existem (em lote)
                const opportunityIds = batch.map(opp => opp.id);
                const existingRecords = await checkMultipleInSupabase(opportunityIds);
                
                // Processar lote
                const batchResult = await processBatch(batch, existingRecords);
                
                inserted += batchResult.inserted;
                updated += batchResult.updated;
                skipped += batchResult.skipped;
                processed += batch.length;
                
                // Delay mínimo entre lotes
                await delay(OPTIMIZATION_CONFIG.DELAY_BETWEEN_BATCHES);
                
            } catch (error) {
                errors += batch.length;
                console.error(`❌ Erro processando lote:`, error);
            }
        }
        
        const result = {
            success: true,
            stageName,
            processed,
            inserted,
            updated,
            skipped,
            errors,
            total: opportunities.length
        };
        
        console.log(`✅ ${stageName} sincronizada: ${processed} processadas | ${inserted} inseridas | ${updated} atualizadas | ${skipped} já atualizadas | ${errors} erros`);
        
        if (onProgress) {
            onProgress({
                stage: stageName,
                status: 'Concluído',
                result
            });
        }
        
        return result;
        
    } catch (error) {
        console.error(`❌ Erro geral na sincronização da ${stageName}:`, error);
        return {
            success: false,
            error: error.message,
            stageName,
            processed: 0,
            inserted: 0,
            updated: 0,
            skipped: 0,
            errors: 0
        };
    }
}

/**
 * Sincronização completa otimizada (últimas 48 horas de ambos os funis)
 */
export async function syncOptimized48Hours(options = {}) {
    console.log('🚀 SINCRONIZAÇÃO OTIMIZADA - ÚLTIMAS 48 HORAS');
    console.log('='.repeat(50));
    
    const results = {
        totalProcessed: 0,
        totalInserted: 0,
        totalUpdated: 0,
        totalSkipped: 0,
        totalErrors: 0,
        funnels: {},
        startTime: new Date(),
        endTime: null
    };
    
    try {
        // Limpar cache antigo
        verificationCache.clear();
        
        // Processar funis em paralelo
        const funnelPromises = Object.entries(FUNIS_CONFIG).map(async ([funnelId, funnelConfig]) => {
            console.log(`🎯 Processando ${funnelConfig.name}...`);
            
            const funnelResults = {
                name: funnelConfig.name,
                stages: {}
            };
            
            // Processar etapas em lotes paralelos
            for (let i = 0; i < funnelConfig.stages.length; i += OPTIMIZATION_CONFIG.PARALLEL_STAGES) {
                const stagesBatch = funnelConfig.stages.slice(i, i + OPTIMIZATION_CONFIG.PARALLEL_STAGES);
                
                const stagePromises = stagesBatch.map(stage =>
                    syncStageOptimized(
                        parseInt(funnelId),
                        stage.id,
                        stage.name,
                        options
                    )
                );
                
                const stageResults = await Promise.all(stagePromises);
                
                stageResults.forEach((stageResult, idx) => {
                    const stage = stagesBatch[idx];
                    funnelResults.stages[stage.id] = stageResult;
                    
                    results.totalProcessed += stageResult.processed || 0;
                    results.totalInserted += stageResult.inserted || 0;
                    results.totalUpdated += stageResult.updated || 0;
                    results.totalSkipped += stageResult.skipped || 0;
                    results.totalErrors += stageResult.errors || 0;
                });
            }
            
            return { funnelId, funnelResults };
        });
        
        // Aguardar todos os funis
        const allFunnelResults = await Promise.all(funnelPromises);
        
        allFunnelResults.forEach(({ funnelId, funnelResults }) => {
            results.funnels[funnelId] = funnelResults;
        });
        
        results.endTime = new Date();
        results.duration = Math.round((results.endTime - results.startTime) / 1000);
        
        // Relatório final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO FINAL - SINCRONIZAÇÃO OTIMIZADA (48h)');
        console.log('='.repeat(60));
        console.log(`⏱️ Duração: ${results.duration}s`);
        console.log(`📈 Total processadas: ${results.totalProcessed}`);
        console.log(`➕ Total inseridas: ${results.totalInserted}`);
        console.log(`🔄 Total atualizadas: ${results.totalUpdated}`);
        console.log(`⚪ Total já atualizadas: ${results.totalSkipped}`);
        console.log(`❌ Total erros: ${results.totalErrors}`);
        console.log(`🚀 Velocidade: ~${Math.round(results.totalProcessed / results.duration)} ops/s`);
        console.log('='.repeat(60));
        
        return results;
        
    } catch (error) {
        console.error('❌ Erro na sincronização otimizada:', error);
        results.error = error.message;
        results.success = false;
        return results;
    } finally {
        if (unknownOpportunityFieldSamples.size > 0) {
            const missingFields = Array.from(unknownOpportunityFieldSamples.keys());
            console.warn(`⚠️ Campos de oportunidade não mapeados detectados nesta execução: ${missingFields.join(', ')}`);
            await reportMissingFields('oportunidade', unknownOpportunityFieldSamples);
            unknownOpportunityFieldSamples.clear();
        }
    }
}

/**
 * Limpar cache manualmente
 */
export function clearCache() {
    verificationCache.clear();
    console.log('🧹 Cache de verificações limpo');
}

export { syncStageOptimized, OPTIMIZATION_CONFIG };


