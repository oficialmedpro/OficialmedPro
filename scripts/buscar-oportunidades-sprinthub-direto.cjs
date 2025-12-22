#!/usr/bin/env node

/**
 * Script para buscar oportunidades específicas diretamente do SprintHub
 * SEM usar a API do Easypanel
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

// Configurações
const SPRINTHUB_BASE_URL = readSecret(process.env.SPRINTHUB_BASE_URL_FILE, ['SPRINTHUB_BASE_URL', 'VITE_SPRINTHUB_BASE_URL']) || 'sprinthub-api-master.sprinthub.app';
const SPRINTHUB_INSTANCE = readSecret(process.env.SPRINTHUB_INSTANCE_FILE, ['SPRINTHUB_INSTANCE', 'VITE_SPRINTHUB_INSTANCE']) || 'oficialmed';
const SPRINTHUB_TOKEN = readSecret(process.env.SPRINTHUB_TOKEN_FILE, ['SPRINTHUB_TOKEN', 'VITE_SPRINTHUB_API_TOKEN']);

if (!SPRINTHUB_TOKEN) {
    console.error('❌ SPRINTHUB_TOKEN não configurado');
    console.log('💡 Configure a variável de ambiente SPRINTHUB_TOKEN ou VITE_SPRINTHUB_API_TOKEN');
    process.exit(1);
}

// Oportunidades específicas do Funil 33
const OPPORTUNITIES = [
    177874, 177775, 177690, 177596, 177452, 177373, 177120
];

const FUNNEL_ID = 33;
// Etapas do funil 33
const STAGES = [314, 317, 315, 316, 318, 319, 320];

async function buscarOportunidadeNoFunil(funnelId, stageId, opportunityId) {
    const url = `https://${SPRINTHUB_BASE_URL}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_TOKEN}&i=${SPRINTHUB_INSTANCE}`;
    
    try {
        const payloadObject = {
            page: 0,
            limit: 200, // Buscar mais para garantir que encontramos
            columnId: stageId
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SPRINTHUB_TOKEN}`,
                'apitoken': SPRINTHUB_TOKEN
            },
            body: JSON.stringify(payloadObject)
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const opportunities = Array.isArray(data) ? data : [];
        
        const opportunity = opportunities.find(opp => opp.id == opportunityId);
        
        if (opportunity) {
            return { opportunity, stageId };
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

function analisarCampos(opportunity, opportunityId) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 OPORTUNIDADE ID: ${opportunityId}`);
    console.log(`   Título: ${opportunity.title || 'N/A'}`);
    console.log(`   Status: ${opportunity.status || 'N/A'}`);
    console.log(`   CRM Column: ${opportunity.crm_column || 'N/A'}`);
    
    // Analisar campos diretos
    console.log(`\n📋 Campos diretos da oportunidade:`);
    const directFields = Object.keys(opportunity).filter(k => k !== 'fields' && k !== 'dataLead');
    directFields.slice(0, 10).forEach(key => {
        const value = opportunity[key];
        const valueStr = typeof value === 'object' ? JSON.stringify(value).substring(0, 80) : String(value).substring(0, 80);
        console.log(`   - ${key}: ${valueStr}`);
    });
    if (directFields.length > 10) {
        console.log(`   ... e mais ${directFields.length - 10} campos`);
    }
    
    // Analisar campos customizados (fields) - O MAIS IMPORTANTE
    if (opportunity.fields) {
        const fields = opportunity.fields;
        const allFieldNames = Object.keys(fields);
        
        console.log(`\n📋 Campos customizados (fields): ${allFieldNames.length} campos`);
        
        // Procurar campos de data/hora
        const dateTimeFields = [];
        const dateTimeFieldsWithValues = {};
        const otherFields = [];
        
        allFieldNames.forEach(key => {
            const value = fields[key];
            const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            
            // Verificar se é campo de data/hora relacionado às etapas
            const keyLower = key.toLowerCase();
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
            } else {
                otherFields.push({ key, value, valueStr });
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
        
        // Mostrar TODOS os campos com valores
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
    
    return {
        id: opportunity.id,
        title: opportunity.title,
        crm_column: opportunity.crm_column,
        allFields: opportunity.fields ? Object.keys(opportunity.fields) : [],
        dateTimeFields: dateTimeFields || [],
        dateTimeFieldsWithValues: dateTimeFieldsWithValues || {},
        fields: opportunity.fields || {}
    };
}

async function main() {
    console.log('🔍 Buscando oportunidades diretamente do SprintHub');
    console.log(`📊 Funil: ${FUNNEL_ID} (Ativação Comercial)`);
    console.log(`📋 Oportunidades a buscar: ${OPPORTUNITIES.join(', ')}\n`);
    
    const resultados = [];
    let encontradas = 0;
    
    for (const opportunityId of OPPORTUNITIES) {
        console.log(`\n🔍 Buscando oportunidade ${opportunityId}...`);
        
        let encontrada = false;
        for (const stageId of STAGES) {
            const result = await buscarOportunidadeNoFunil(FUNNEL_ID, stageId, opportunityId);
            
            if (result) {
                encontrada = true;
                encontradas++;
                console.log(`   ✅ Encontrada na etapa ${stageId}!`);
                const analise = analisarCampos(result.opportunity, opportunityId);
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
    const outputFile = `oportunidades-sprinthub-direto-analise.json`;
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



