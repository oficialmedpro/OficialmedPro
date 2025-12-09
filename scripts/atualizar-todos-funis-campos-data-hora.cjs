#!/usr/bin/env node

/**
 * Script para atualizar TODAS as oportunidades de TODOS os funis
 * independente da data de criação/atualização
 * 
 * Este script busca todas as oportunidades de todos os funis diretamente do SprintHub
 * e atualiza os campos de data/hora no Supabase
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

// TODOS os funis e etapas (mesmos da API)
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

// Função para parsear campo de data/hora
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

// Função para mapear campos de data/hora das etapas (TODOS os funis)
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
    const url = `https://${SPRINTHUB_BASE_URL}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_TOKEN}&i=${SPRINTHUB_INSTANCE}`;
    
    try {
        const payloadObject = { page, limit, columnId: stageId };
        const postData = JSON.stringify(payloadObject);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SPRINTHUB_TOKEN}`,
                'apitoken': SPRINTHUB_TOKEN
            },
            body: Buffer.from(postData)
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
        
    } catch (error) {
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
        return false;
    }
}

// Função para atualizar apenas campos de data/hora
async function atualizarCamposDataHora(opportunityId, dateTimeFields) {
    try {
        if (Object.keys(dateTimeFields).length === 0) {
            return { success: true, action: 'skip', reason: 'Nenhum campo para atualizar' };
        }
        
        const updateData = {
            ...dateTimeFields,
            synced_at: new Date().toISOString()
        };
        
        const url = `${SUPABASE_URL}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`;
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
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Função principal
async function main() {
    console.log('🚀 ATUALIZANDO TODAS AS OPORTUNIDADES DE TODOS OS FUNIS');
    console.log('='.repeat(80));
    console.log(`🔧 Configuração:`);
    console.log(`   SprintHub Base URL: ${SPRINTHUB_BASE_URL}`);
    console.log(`   SprintHub Instance: ${SPRINTHUB_INSTANCE}`);
    console.log(`   Supabase URL: ${SUPABASE_URL}`);
    console.log(`📊 Total de funis: ${Object.keys(FUNIS_CONFIG).length}\n`);
    
    let totalProcessadas = 0;
    let totalAtualizadas = 0;
    let totalComCampos = 0;
    let totalErros = 0;
    let totalSemCampos = 0;
    
    const oportunidadesProcessadas = new Set();
    const resumoPorFunil = {};
    
    // Processar cada funil
    for (const [funnelId, config] of Object.entries(FUNIS_CONFIG)) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📊 Processando Funil ${funnelId}: ${config.name}`);
        console.log(`   Etapas: ${config.stages.length} (${config.stages.join(', ')})`);
        console.log('='.repeat(80));
        
        let funilProcessadas = 0;
        let funilAtualizadas = 0;
        let funilComCampos = 0;
        let funilErros = 0;
        
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
                    // Evitar processar a mesma oportunidade duas vezes
                    if (oportunidadesProcessadas.has(opportunity.id)) {
                        continue;
                    }
                    oportunidadesProcessadas.add(opportunity.id);
                    
                    totalProcessadas++;
                    funilProcessadas++;
                    
                    // Verificar se existe no banco
                    const existe = await verificarOportunidadeExiste(opportunity.id);
                    
                    if (!existe) {
                        // Se não existe, pular (não vamos inserir aqui, só atualizar)
                        continue;
                    }
                    
                    // Mapear campos de data/hora
                    const fields = opportunity.fields || {};
                    const dateTimeFields = mapStageDateTimeFields(fields);
                    
                    if (Object.keys(dateTimeFields).length > 0) {
                        totalComCampos++;
                        funilComCampos++;
                        
                        try {
                            const result = await atualizarCamposDataHora(opportunity.id, dateTimeFields);
                            
                            if (result.success && result.action === 'update') {
                                totalAtualizadas++;
                                funilAtualizadas++;
                                
                                if (totalAtualizadas % 50 === 0) {
                                    console.log(`   ✅ ${totalAtualizadas} oportunidades atualizadas...`);
                                }
                            } else if (!result.success) {
                                totalErros++;
                                funilErros++;
                            }
                        } catch (error) {
                            totalErros++;
                            funilErros++;
                        }
                    } else {
                        totalSemCampos++;
                    }
                }
                
                page++;
                await new Promise(resolve => setTimeout(resolve, 300)); // Delay entre páginas
            }
        }
        
        resumoPorFunil[funnelId] = {
            name: config.name,
            processadas: funilProcessadas,
            atualizadas: funilAtualizadas,
            comCampos: funilComCampos,
            erros: funilErros
        };
        
        console.log(`\n✅ Funil ${funnelId} (${config.name}) concluído:`);
        console.log(`   Processadas: ${funilProcessadas}, Atualizadas: ${funilAtualizadas}, Com campos: ${funilComCampos}, Erros: ${funilErros}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO FINAL DA ATUALIZAÇÃO - TODOS OS FUNIS');
    console.log('='.repeat(80));
    console.log(`✅ Total de oportunidades processadas: ${totalProcessadas}`);
    console.log(`✅ Total de oportunidades com campos de data/hora: ${totalComCampos}`);
    console.log(`✅ Total de oportunidades atualizadas no Supabase: ${totalAtualizadas}`);
    console.log(`⚠️ Total de oportunidades sem campos de data/hora: ${totalSemCampos}`);
    console.log(`❌ Total de erros: ${totalErros}`);
    
    console.log('\n📋 RESUMO POR FUNIL:');
    Object.keys(resumoPorFunil).forEach(funilId => {
        const resumo = resumoPorFunil[funilId];
        console.log(`   Funil ${funilId} (${resumo.name}): ${resumo.processadas} processadas, ${resumo.atualizadas} atualizadas, ${resumo.comCampos} com campos`);
    });
    
    console.log('\n✅ Atualização concluída!');
}

// Executar
main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});


