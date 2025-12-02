#!/usr/bin/env node

/**
 * Script para atualizar campos de data/hora de todas as oportunidades
 * dos últimos 10 dias diretamente do SprintHub para o Supabase
 * 
 * Este script busca oportunidades do SprintHub e atualiza apenas os campos
 * de data/hora no Supabase, sem depender das APIs
 */

const fs = require('fs');

// Função para ler secrets
function readSecret(envVarFile, fallbackEnvVars) {
    try {
        if (envVarFile && fs.existsSync(envVarFile)) {
            return fs.readFileSync(envVarFile, 'utf8').trim();
        }
    } catch (error) {
        // Ignorar
    }
    
    const fallbacks = Array.isArray(fallbackEnvVars) ? fallbackEnvVars : [fallbackEnvVars];
    for (const fallbackEnvVar of fallbacks) {
        const fallbackValue = process.env[fallbackEnvVar];
        if (fallbackValue) {
            return fallbackValue;
        }
    }
    
    return null;
}

// Configurações SprintHub
let SPRINTHUB_BASE_URL = readSecret(process.env.SPRINTHUB_BASE_URL_FILE, ['SPRINTHUB_BASE_URL', 'VITE_SPRINTHUB_BASE_URL']);
if (!SPRINTHUB_BASE_URL) {
    SPRINTHUB_BASE_URL = 'sprinthub-api-master.sprinthub.app';
}

let SPRINTHUB_INSTANCE = readSecret(process.env.SPRINTHUB_INSTANCE_FILE, ['SPRINTHUB_INSTANCE', 'VITE_SPRINTHUB_INSTANCE']);
if (!SPRINTHUB_INSTANCE) {
    SPRINTHUB_INSTANCE = 'oficialmed';
}

let SPRINTHUB_TOKEN = readSecret(process.env.SPRINTHUB_TOKEN_FILE, ['SPRINTHUB_TOKEN', 'VITE_SPRINTHUB_API_TOKEN']);

// Se ainda não encontrou, tentar ler de arquivo .env se existir
if (!SPRINTHUB_TOKEN) {
    try {
        const envFile = '.env';
        if (fs.existsSync(envFile)) {
            const envContent = fs.readFileSync(envFile, 'utf8');
            const tokenMatch = envContent.match(/VITE_SPRINTHUB_API_TOKEN=(.+)/);
            if (tokenMatch) {
                SPRINTHUB_TOKEN = tokenMatch[1].trim().replace(/^["']|["']$/g, '');
            }
        }
    } catch (error) {
        // Ignorar
    }
}

// Configurações Supabase
let SUPABASE_URL = readSecret(process.env.SUPABASE_URL_FILE, ['SUPABASE_URL', 'VITE_SUPABASE_URL']);
let SUPABASE_KEY = readSecret(process.env.SUPABASE_KEY_FILE, ['SUPABASE_KEY', 'VITE_SUPABASE_SERVICE_ROLE_KEY']);

// Se ainda não encontrou, tentar ler de arquivo .env
if (!SUPABASE_URL || !SUPABASE_KEY) {
    try {
        const envFile = '.env';
        if (fs.existsSync(envFile)) {
            const envContent = fs.readFileSync(envFile, 'utf8');
            if (!SUPABASE_URL) {
                const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
                if (urlMatch) {
                    SUPABASE_URL = urlMatch[1].trim().replace(/^["']|["']$/g, '');
                }
            }
            if (!SUPABASE_KEY) {
                const keyMatch = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/);
                if (keyMatch) {
                    SUPABASE_KEY = keyMatch[1].trim().replace(/^["']|["']$/g, '');
                }
            }
        }
    } catch (error) {
        // Ignorar
    }
}

if (!SPRINTHUB_TOKEN) {
    console.error('❌ SPRINTHUB_TOKEN não configurado');
    process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ SUPABASE_URL ou SUPABASE_KEY não configurados');
    process.exit(1);
}

const SPRINTHUB_CONFIG = {
    baseUrl: SPRINTHUB_BASE_URL,
    instance: SPRINTHUB_INSTANCE,
    apiToken: SPRINTHUB_TOKEN
};

// Funis e etapas (mesmos da API)
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

// Função para parsear data/hora (mesma da API)
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

// Função para mapear campos de data/hora (mesma da API)
function mapStageDateTimeFields(fields) {
    if (!fields || typeof fields !== 'object') return {};
    
    const stageFieldMap = {
        // Compra
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
        // Recompra
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
        // Monitoramento
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
        // Ativacao
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
        // Reativacao
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
            }
        }
    });
    
    // Também tentar mapear variações (sem acentos, lowercase, etc)
    Object.keys(fields).forEach(fieldName => {
        if (stageFieldMap[fieldName]) return; // Já mapeado
        
        const fieldNameLower = fieldName.toLowerCase().trim();
        const fieldNameNormalized = fieldNameLower
            .replace(/[áàâã]/g, 'a')
            .replace(/[éèê]/g, 'e')
            .replace(/[íìî]/g, 'i')
            .replace(/[óòôõ]/g, 'o')
            .replace(/[úùû]/g, 'u')
            .replace(/ç/g, 'c')
            .replace(/\s+/g, ' ')
            .trim();
        
        Object.keys(stageFieldMap).forEach(sprintHubField => {
            const sprintHubFieldNormalized = sprintHubField.toLowerCase()
                .replace(/[áàâã]/g, 'a')
                .replace(/[éèê]/g, 'e')
                .replace(/[íìî]/g, 'i')
                .replace(/[óòôõ]/g, 'o')
                .replace(/[úùû]/g, 'u')
                .replace(/ç/g, 'c')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (fieldNameNormalized === sprintHubFieldNormalized) {
                const dbField = stageFieldMap[sprintHubField];
                if (!mappedFields[dbField]) {
                    const parsedValue = parseDateTimeField(fields[fieldName]);
                    if (parsedValue) {
                        mappedFields[dbField] = parsedValue;
                    }
                }
            }
        });
    });
    
    return mappedFields;
}

// Função para buscar oportunidades do SprintHub
async function fetchOpportunitiesFromStage(funnelId, stageId, page = 0, limit = 100) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`;
    
    try {
        const payloadObject = { page, limit, columnId: stageId };
        const postData = JSON.stringify(payloadObject);
        
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
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
        
    } catch (error) {
        console.error(`   ❌ Erro ao buscar etapa ${stageId}:`, error.message);
        return [];
    }
}

// Função para verificar se oportunidade existe no Supabase
async function verificarOportunidadeExiste(opportunityId) {
    try {
        const url = `${SUPABASE_URL}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}&select=id`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        if (!response.ok) {
            return false;
        }
        
        const result = await response.json();
        return result && result.length > 0;
        
    } catch (error) {
        console.error(`   ⚠️ Erro ao verificar oportunidade ${opportunityId}:`, error.message);
        return false;
    }
}

// Função para mapear TODA a oportunidade (igual ao api-sync-opportunities.js)
function mapOpportunityFields(opportunity, funnelId) {
    const fields = opportunity.fields || {};
    const lead = opportunity.dataLead || {};
    const utmTags = (lead.utmTags && lead.utmTags[0]) || {};
    
    // Mapear campos de data/hora das etapas
    const stageDateTimeFields = mapStageDateTimeFields(fields);
    
    // Normalizar campos customizados
    const normalizeField = (fieldName) => {
        if (!fieldName) return null;
        const normalized = fieldName.trim()
            .toLowerCase()
            .replace(/[áàâã]/g, 'a')
            .replace(/[éèê]/g, 'e')
            .replace(/[íìî]/g, 'i')
            .replace(/[óòôõ]/g, 'o')
            .replace(/[úùû]/g, 'u')
            .replace(/ç/g, 'c')
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
        return normalized || null;
    };
    
    // Mapear campos customizados conhecidos
    const customFields = {};
    Object.keys(fields).forEach(fieldName => {
        const normalized = normalizeField(fieldName);
        if (normalized) {
            // Mapear campos conhecidos
            const fieldMap = {
                'origem_oportunidade': fields['ORIGEM OPORTUNIDADE'] || fields['origem oportunidade'] || null,
                'qualificacao': fields['QUALIFICACAO'] || fields['qualificacao'] || null,
                'status_orcamento': fields['Status Orcamento'] || fields['status orcamento'] || null,
                'tipo_de_compra': fields['Tipo de Compra'] || fields['tipo de compra'] || null,
                'primecadastro': fields['PRIMECADASTRO'] ? parseInt(fields['PRIMECADASTRO']) || null : null,
                'codigo_prime_receita': fields['Codigo Prime Receita'] || fields['codigo prime receita'] || null,
                'descricao_da_formula': fields['Descricao da Formula'] || fields['descricao da formula'] || null,
                'numero_do_pedido': fields['Numero do pedido'] || fields['numero do pedido'] || null,
                'status_getnet': fields['Status Getnet'] || fields['status getnet'] || null,
                'valorconfere': fields['Valorconfere'] || fields['valorconfere'] || null,
                'valorfrete': fields['valorfrete'] || null,
                'valorprodutos': fields['valorprodutos'] || null,
                'codigo_id_lead': fields[' Codigo ID Lead'] || fields['codigo id lead'] || null,
                'codigo_id_oportunidade': fields[' Codigo ID Oportunidade'] || fields['codigo id oportunidade'] || null,
                'id_oportunidade': fields['idoportunidade'] || null,
                'etapa': fields['etapa'] || null,
                'forma_pagamento': fields['Forma de Pagamento'] || fields['forma de pagamento'] || null,
                'forma_de_entrega': fields['Forma de entrega'] || fields['forma de entrega'] || null,
                'tipo_de_frete': fields['Tipo de Frete'] || fields['tipo de frete'] || null,
                'parcelamento': fields['parcelamento'] || null,
                'posologia': fields['Posologia'] || fields['posologia'] || null,
                'total_pedido': fields['Total Pedido'] || fields['total pedido'] || null,
                'valor_parcela': fields['Valor Parcela'] || fields['valor parcela'] || null,
                'status_da_etapa': fields['Status da Etapa'] || fields['status da etapa'] || null,
                'frete_onibus_e_motoboy': fields['Frete Onibus e Motoboy'] || fields['frete onibus e motoboy'] || null
            };
            
            if (fieldMap[normalized]) {
                customFields[normalized] = fieldMap[normalized];
            }
        }
    });
    
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
        // Campos customizados
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
        // Campos de data/hora das etapas
        ...stageDateTimeFields
    };
}

// Função para inserir ou atualizar oportunidade no Supabase
async function inserirOuAtualizarOportunidade(opportunity, funnelId, dateTimeFields) {
    try {
        const existe = await verificarOportunidadeExiste(opportunity.id);
        
        if (!existe) {
            // Se não existe, inserir TODA a oportunidade
            const fullOpportunity = mapOpportunityFields(opportunity, funnelId);
            
            const url = `${SUPABASE_URL}/rest/v1/oportunidade_sprint`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(fullOpportunity)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                return { 
                    success: false, 
                    action: 'insert',
                    reason: `HTTP ${response.status}: ${errorText.substring(0, 200)}` 
                };
            }
            
            return { success: true, action: 'insert' };
        } else {
            // Se existe, atualizar apenas os campos de data/hora
            if (Object.keys(dateTimeFields).length === 0) {
                return { success: true, action: 'skip', reason: 'Nenhum campo para atualizar' };
            }
            
            const updateData = {
                ...dateTimeFields,
                synced_at: new Date().toISOString()
            };
            
            const url = `${SUPABASE_URL}/rest/v1/oportunidade_sprint?id=eq.${opportunity.id}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                return { 
                    success: false, 
                    action: 'update',
                    reason: `HTTP ${response.status}: ${errorText.substring(0, 200)}` 
                };
            }
            
            return { success: true, action: 'update' };
        }
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Função principal
async function main() {
    console.log('🔄 Atualizando campos de data/hora dos últimos 10 dias\n');
    console.log(`📅 Período: ${new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')} até hoje\n`);
    
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 10);
    
    let totalProcessadas = 0;
    let totalAtualizadas = 0;
    let totalComCampos = 0;
    let totalErros = 0;
    
    const oportunidadesProcessadas = new Set(); // Evitar processar a mesma oportunidade duas vezes
    
    // Processar cada funil
    for (const [funnelId, config] of Object.entries(FUNIS_CONFIG)) {
        console.log(`\n📊 Processando Funil ${funnelId}: ${config.name}`);
        console.log(`   Etapas: ${config.stages.length}`);
        
        let funilProcessadas = 0;
        let funilAtualizadas = 0;
        let funilComCampos = 0;
        
        // Processar cada etapa
        for (const stageId of config.stages) {
            let page = 0;
            let hasMore = true;
            
            while (hasMore) {
                const opportunities = await fetchOpportunitiesFromStage(Number(funnelId), stageId, page, 100);
                
                if (opportunities.length === 0) {
                    hasMore = false;
                    break;
                }
                
                for (const opportunity of opportunities) {
                    // Verificar se foi atualizada nos últimos 10 dias
                    const updateDate = opportunity.updateDate ? new Date(opportunity.updateDate) : null;
                    const createDate = opportunity.createDate ? new Date(opportunity.createDate) : null;
                    
                    // Verificar se foi criada ou atualizada nos últimos 10 dias
                    const isRecent = (updateDate && updateDate >= dataLimite) || 
                                    (createDate && createDate >= dataLimite);
                    
                    if (!isRecent) {
                        continue; // Pular oportunidades muito antigas
                    }
                    
                    // Evitar processar a mesma oportunidade duas vezes
                    if (oportunidadesProcessadas.has(opportunity.id)) {
                        continue;
                    }
                    oportunidadesProcessadas.add(opportunity.id);
                    
                    totalProcessadas++;
                    funilProcessadas++;
                    
                    // Mapear campos de data/hora
                    const fields = opportunity.fields || {};
                    const dateTimeFields = mapStageDateTimeFields(fields);
                    
                    if (Object.keys(dateTimeFields).length > 0) {
                        totalComCampos++;
                        funilComCampos++;
                        
                        // Atualizar no Supabase
                        const result = await atualizarOportunidadeNoSupabase(opportunity.id, dateTimeFields);
                        
                        if (result.updated) {
                            totalAtualizadas++;
                            funilAtualizadas++;
                            if (totalAtualizadas % 10 === 0) {
                                console.log(`   ✅ ${totalAtualizadas} oportunidades atualizadas...`);
                            }
                        } else {
                            totalErros++;
                            if (result.reason && !result.reason.includes('não encontrada')) {
                                console.log(`   ⚠️ ${opportunity.id}: ${result.reason.substring(0, 100)}`);
                            }
                        }
                    }
                }
                
                // Se retornou menos que o limite, não há mais páginas
                if (opportunities.length < 100) {
                    hasMore = false;
                } else {
                    page++;
                }
                
                // Pequeno delay para não sobrecarregar
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        
        if (funilProcessadas > 0) {
            console.log(`   📊 Funil ${funnelId}: ${funilProcessadas} processadas, ${funilComCampos} com campos, ${funilAtualizadas} atualizadas`);
        }
    }
    
    // Resumo final
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 RESUMO FINAL`);
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ Oportunidades processadas: ${totalProcessadas}`);
    console.log(`📅 Oportunidades com campos de data/hora: ${totalComCampos}`);
    console.log(`🔄 Oportunidades atualizadas: ${totalAtualizadas}`);
    console.log(`❌ Erros: ${totalErros}`);
    console.log(`\n✅ Atualização concluída!\n`);
}

main().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});

