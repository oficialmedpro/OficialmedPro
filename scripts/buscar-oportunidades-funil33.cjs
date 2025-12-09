#!/usr/bin/env node

/**
 * Script para buscar oportunidades específicas do Funil 33 diretamente do SprintHub
 * Usa o mesmo padrão do api-sync-opportunities.js
 */

const fs = require('fs');

// Função para ler secrets (mesma do api-sync-opportunities.js)
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

// Tentar ler de vários lugares (mesmo padrão do código existente)
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

if (!SPRINTHUB_TOKEN) {
    console.error('❌ SPRINTHUB_TOKEN não configurado');
    console.log('\n💡 Configure uma das opções:');
    console.log('   1. Variável de ambiente: SPRINTHUB_TOKEN ou VITE_SPRINTHUB_API_TOKEN');
    console.log('   2. Arquivo apontado por: SPRINTHUB_TOKEN_FILE');
    console.log('   3. Arquivo .env com: VITE_SPRINTHUB_API_TOKEN=seu_token');
    console.log('\n📋 Exemplo:');
    console.log('   export VITE_SPRINTHUB_API_TOKEN="seu_token_aqui"');
    console.log('   node scripts/buscar-oportunidades-funil33.cjs');
    process.exit(1);
}

const SPRINTHUB_CONFIG = {
    baseUrl: SPRINTHUB_BASE_URL,
    instance: SPRINTHUB_INSTANCE,
    apiToken: SPRINTHUB_TOKEN
};

// Oportunidades específicas do Funil 33
const OPPORTUNITIES = [177874, 177775, 177690, 177596, 177452, 177373, 177120];
const FUNNEL_ID = 33;
// Etapas do funil 33
const STAGES = [314, 317, 315, 316, 318, 319, 320];

// Função para buscar oportunidades (mesmo padrão do api-sync-opportunities.js)
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
            const errorBody = await response.text().catch(() => '');
            throw new Error(`HTTP ${response.status}: ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
        
    } catch (error) {
        console.error(`❌ Erro ao buscar etapa ${stageId}:`, error.message);
        return [];
    }
}

function analisarCampos(opportunity, opportunityId) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 OPORTUNIDADE ID: ${opportunityId}`);
    console.log(`   Título: ${opportunity.title || 'N/A'}`);
    console.log(`   Status: ${opportunity.status || 'N/A'}`);
    console.log(`   CRM Column: ${opportunity.crm_column || 'N/A'}`);
    
    // Analisar campos customizados (fields) - O MAIS IMPORTANTE
    const dateTimeFields = [];
    const dateTimeFieldsWithValues = {};
    
    if (opportunity.fields) {
        const fields = opportunity.fields;
        const allFieldNames = Object.keys(fields);
        
        console.log(`\n📋 Total de campos em "fields": ${allFieldNames.length}`);
        
        // Procurar campos de data/hora
        
        allFieldNames.forEach(key => {
            const value = fields[key];
            const keyLower = key.toLowerCase();
            
            // Verificar se é campo de data/hora relacionado às etapas
            const isDateTimeField = 
                keyLower.includes('entrada') || keyLower.includes('acolhimento') || 
                keyLower.includes('qualificado') || keyLower.includes('qualificacao') ||
                keyLower.includes('orcamento') || keyLower.includes('orçamento') ||
                keyLower.includes('negociacao') || keyLower.includes('negociação') ||
                keyLower.includes('follow') || keyLower.includes('followup') ||
                keyLower.includes('cadastro') || keyLower.includes('compra') ||
                keyLower.includes('recompra') || keyLower.includes('monitoramento') ||
                keyLower.includes('ativacao') || keyLower.includes('ativação') ||
                keyLower.includes('reativacao') || keyLower.includes('reativação') ||
                keyLower.includes('data') || keyLower.includes('hora') || keyLower.includes('time');
            
            if (isDateTimeField) {
                dateTimeFields.push(key);
                if (value !== null && value !== undefined && value !== '') {
                    dateTimeFieldsWithValues[key] = value;
                }
            }
        });
        
        if (dateTimeFields.length > 0) {
            console.log(`\n🎯 Campos de data/hora detectados (${dateTimeFields.length}):`);
            dateTimeFields.forEach(field => {
                console.log(`   - ${field}`);
            });
        }
        
        if (Object.keys(dateTimeFieldsWithValues).length > 0) {
            console.log(`\n✅ CAMPOS DE DATA/HORA COM VALORES (${Object.keys(dateTimeFieldsWithValues).length}):`);
            Object.keys(dateTimeFieldsWithValues).forEach(field => {
                console.log(`   ✅ ${field}: ${dateTimeFieldsWithValues[field]} (tipo: ${typeof dateTimeFieldsWithValues[field]})`);
            });
        } else {
            console.log(`\n⚠️ Nenhum campo de data/hora com valor encontrado`);
        }
        
        // Mostrar TODOS os campos com valores para análise
        console.log(`\n📋 TODOS os campos em "fields" com valores:`);
        allFieldNames.forEach(key => {
            const value = fields[key];
            if (value !== null && value !== undefined && value !== '') {
                const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
                console.log(`   - ${key}: ${valueStr.substring(0, 150)}`);
            }
        });
    } else {
        console.log(`\n⚠️ Nenhum campo "fields" encontrado na oportunidade`);
    }
    
    const result = {
        id: opportunity.id,
        title: opportunity.title,
        crm_column: opportunity.crm_column,
        allFields: opportunity.fields ? Object.keys(opportunity.fields) : [],
        dateTimeFields: dateTimeFields || [],
        dateTimeFieldsWithValues: dateTimeFieldsWithValues || {},
        fields: opportunity.fields || {}
    };
    
    return result;
}

async function main() {
    console.log('🔍 Buscando oportunidades diretamente do SprintHub');
    console.log(`📊 Funil: ${FUNNEL_ID} (Ativação Comercial)`);
    console.log(`📋 Oportunidades a buscar: ${OPPORTUNITIES.join(', ')}\n`);
    console.log(`🔧 Configuração:`);
    console.log(`   Base URL: ${SPRINTHUB_CONFIG.baseUrl}`);
    console.log(`   Instance: ${SPRINTHUB_CONFIG.instance}`);
    console.log(`   Token: ${SPRINTHUB_TOKEN.substring(0, 10)}...\n`);
    
    const resultados = [];
    let encontradas = 0;
    
    for (const opportunityId of OPPORTUNITIES) {
        console.log(`\n🔍 Buscando oportunidade ${opportunityId}...`);
        
        let encontrada = false;
        for (const stageId of STAGES) {
            const opportunities = await fetchOpportunitiesFromStage(FUNNEL_ID, stageId, 0, 100);
            const opportunity = opportunities.find(opp => opp.id === opportunityId);
            
            if (opportunity) {
                encontrada = true;
                encontradas++;
                console.log(`   ✅ Encontrada na etapa ${stageId}!`);
                const analise = analisarCampos(opportunity, opportunityId);
                resultados.push({
                    opportunityId,
                    stageId,
                    ...analise
                });
                break;
            }
        }
        
        if (!encontrada) {
            console.log(`   ❌ Não encontrada em nenhuma etapa`);
            resultados.push({
                opportunityId,
                encontrada: false
            });
        }
        
        // Pequeno delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Resumo final
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 RESUMO FINAL`);
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ Oportunidades encontradas: ${encontradas} de ${OPPORTUNITIES.length}`);
    
    // Consolidar todos os campos de data/hora encontrados
    const todosCamposDataHora = new Set();
    const todosCamposComValores = new Map();
    
    resultados.forEach(result => {
        if (result.dateTimeFields) {
            result.dateTimeFields.forEach(field => {
                todosCamposDataHora.add(field);
            });
        }
        if (result.dateTimeFieldsWithValues) {
            Object.keys(result.dateTimeFieldsWithValues).forEach(field => {
                if (!todosCamposComValores.has(field)) {
                    todosCamposComValores.set(field, result.dateTimeFieldsWithValues[field]);
                }
            });
        }
    });
    
    if (todosCamposDataHora.size > 0) {
        console.log(`\n🎯 TODOS os campos de data/hora encontrados (${todosCamposDataHora.size}):`);
        Array.from(todosCamposDataHora).sort().forEach(field => {
            console.log(`   - ${field}`);
        });
    }
    
    if (todosCamposComValores.size > 0) {
        console.log(`\n✅ Campos de data/hora COM VALORES (${todosCamposComValores.size}):`);
        Array.from(todosCamposComValores.entries()).sort().forEach(([field, value]) => {
            console.log(`   ✅ ${field}: ${value}`);
        });
    }
    
    // Salvar JSON completo
    const outputFile = `oportunidades-funil33-analise-completa.json`;
    fs.writeFileSync(outputFile, JSON.stringify({
        total: OPPORTUNITIES.length,
        encontradas: encontradas,
        resultados: resultados,
        todosCamposDataHora: Array.from(todosCamposDataHora).sort(),
        todosCamposComValores: Object.fromEntries(todosCamposComValores)
    }, null, 2));
    console.log(`\n💾 Dados completos salvos em: ${outputFile}`);
    
    console.log('\n✅ Análise concluída!\n');
}

main().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});

