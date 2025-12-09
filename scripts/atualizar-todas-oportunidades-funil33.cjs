#!/usr/bin/env node

/**
 * Script para atualizar TODAS as oportunidades do Funil 33 (Ativação Comercial)
 * independente da data de criação/atualização
 * 
 * Este script busca todas as oportunidades do funil 33 diretamente do SprintHub
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

// Etapas do Funil 33 (Ativação Comercial)
const FUNIL33_STAGES = [314, 317, 315, 316, 318, 319, 320];
const FUNIL_ID = 33;

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

// Função para mapear campos de data/hora das etapas
function mapStageDateTimeFields(fields) {
    if (!fields || typeof fields !== 'object') return {};
    
    const stageFieldMap = {
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
        'Cadastro Ativação': 'cadastro_ativacao'
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
            console.error(`   ❌ Erro HTTP ${response.status} ao buscar etapa ${stageId}, página ${page + 1}`);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
        
    } catch (error) {
        console.error(`   ❌ Erro ao buscar etapa ${stageId}, página ${page + 1}:`, error.message);
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
    console.log('🚀 ATUALIZANDO TODAS AS OPORTUNIDADES DO FUNIL 33 (ATIVAÇÃO COMERCIAL)');
    console.log('='.repeat(80));
    console.log(`🔧 Configuração:`);
    console.log(`   SprintHub Base URL: ${SPRINTHUB_BASE_URL}`);
    console.log(`   SprintHub Instance: ${SPRINTHUB_INSTANCE}`);
    console.log(`   Supabase URL: ${SUPABASE_URL}`);
    console.log(`📊 Funil: 33 - [1] ATIVAÇÃO COMERCIAL`);
    console.log(`📋 Etapas: ${FUNIL33_STAGES.join(', ')}\n`);
    
    let totalProcessadas = 0;
    let totalAtualizadas = 0;
    let totalComCampos = 0;
    let totalErros = 0;
    let totalSemCampos = 0;
    
    const oportunidadesProcessadas = new Set();
    
    // Processar cada etapa
    for (const stageId of FUNIL33_STAGES) {
        console.log(`\n📊 Processando Etapa ${stageId}...`);
        
        let etapaProcessadas = 0;
        let etapaAtualizadas = 0;
        let etapaComCampos = 0;
        let etapaErros = 0;
        
        let page = 0;
        let hasMore = true;
        
        while (hasMore) {
            const opportunities = await fetchOpportunitiesFromStage(FUNIL_ID, stageId, page, 100);
            
            if (opportunities.length === 0) {
                hasMore = false;
                break;
            }
            
            console.log(`   📄 Página ${page + 1}: ${opportunities.length} oportunidades encontradas`);
            
            for (const opportunity of opportunities) {
                // Evitar processar a mesma oportunidade duas vezes
                if (oportunidadesProcessadas.has(opportunity.id)) {
                    continue;
                }
                oportunidadesProcessadas.add(opportunity.id);
                
                totalProcessadas++;
                etapaProcessadas++;
                
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
                    etapaComCampos++;
                    
                    try {
                        const result = await atualizarCamposDataHora(opportunity.id, dateTimeFields);
                        
                        if (result.success && result.action === 'update') {
                            totalAtualizadas++;
                            etapaAtualizadas++;
                        } else if (!result.success) {
                            console.error(`   ❌ Erro ao atualizar oportunidade ${opportunity.id}:`, result.reason || result.error);
                            totalErros++;
                            etapaErros++;
                        }
                    } catch (error) {
                        console.error(`   ❌ Erro ao processar oportunidade ${opportunity.id}:`, error.message);
                        totalErros++;
                        etapaErros++;
                    }
                } else {
                    totalSemCampos++;
                }
            }
            
            page++;
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay entre páginas
        }
        
        console.log(`   ✅ Etapa ${stageId} - Processadas: ${etapaProcessadas}, Atualizadas: ${etapaAtualizadas}, Com campos: ${etapaComCampos}, Erros: ${etapaErros}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO FINAL DA ATUALIZAÇÃO - FUNIL 33');
    console.log('='.repeat(80));
    console.log(`✅ Total de oportunidades processadas: ${totalProcessadas}`);
    console.log(`✅ Total de oportunidades com campos de data/hora: ${totalComCampos}`);
    console.log(`✅ Total de oportunidades atualizadas no Supabase: ${totalAtualizadas}`);
    console.log(`⚠️ Total de oportunidades sem campos de data/hora: ${totalSemCampos}`);
    console.log(`❌ Total de erros: ${totalErros}`);
    console.log('\n✅ Atualização concluída!');
}

// Executar
main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});


