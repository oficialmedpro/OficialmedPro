#!/usr/bin/env node

/**
 * Script para testar busca de uma oportunidade específica do funil 33
 * e verificar como os campos de data/hora vêm do SprintHub
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

if (!SPRINTHUB_TOKEN) {
    console.error('❌ SPRINTHUB_TOKEN não configurado');
    process.exit(1);
}

// IDs de oportunidades para testar (baseado nas imagens que o usuário mostrou)
const OPPORTUNITY_IDS_TO_TEST = [
    177596, // Monique (já testamos antes)
    174206, // Joselia
    174087, // Marcia
    // Adicionar mais IDs conforme necessário
];

// Função para buscar uma oportunidade específica do SprintHub
async function fetchOpportunityById(funnelId, opportunityId) {
    const url = `https://${SPRINTHUB_BASE_URL}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_TOKEN}&i=${SPRINTHUB_INSTANCE}`;
    
    try {
        // Primeiro, buscar todas as oportunidades da etapa 317 (ACOLHIMENTO)
        const payloadObject = { page: 0, limit: 100, columnId: 317 };
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
            console.error(`❌ Erro HTTP ${response.status}`);
            return null;
        }

        const data = await response.json();
        const opportunities = Array.isArray(data) ? data : [];
        
        // Encontrar a oportunidade específica
        const opportunity = opportunities.find(opp => opp.id === opportunityId);
        return opportunity;
        
    } catch (error) {
        console.error(`❌ Erro ao buscar oportunidade ${opportunityId}:`, error.message);
        return null;
    }
}

// Função para analisar campos
function analisarCampos(opportunity) {
    if (!opportunity) {
        console.log('❌ Oportunidade não encontrada');
        return;
    }
    
    console.log(`\n📋 OPORTUNIDADE: ${opportunity.title} (ID: ${opportunity.id})`);
    console.log(`   Etapa: ${opportunity.crm_column}`);
    console.log(`   Status: ${opportunity.status}`);
    
    const fields = opportunity.fields || {};
    const allFieldNames = Object.keys(fields);
    
    console.log(`\n📊 Total de campos em "fields": ${allFieldNames.length}`);
    
    // Procurar campos de data/hora relacionados a Ativacao
    const ativacaoFields = allFieldNames.filter(k => {
        const kLower = k.toLowerCase();
        return kLower.includes('ativacao') || kLower.includes('ativação') ||
               kLower.includes('acolhimento') || kLower.includes('entrada') ||
               kLower.includes('qualificado') || kLower.includes('orcamento') ||
               kLower.includes('negociacao') || kLower.includes('negociação') ||
               kLower.includes('follow') || kLower.includes('cadastro');
    });
    
    console.log(`\n🎯 Campos relacionados a Ativacao (${ativacaoFields.length}):`);
    ativacaoFields.forEach(field => {
        const value = fields[field];
        if (value !== null && value !== undefined && value !== '') {
            console.log(`   ✅ ${field}: ${value} (tipo: ${typeof value})`);
        } else {
            console.log(`   ⚪ ${field}: Campo não preenchido`);
        }
    });
    
    // Mostrar TODOS os campos com valores
    console.log(`\n📋 TODOS os campos em "fields" com valores:`);
    allFieldNames.forEach(key => {
        const value = fields[key];
        if (value !== null && value !== undefined && value !== '') {
            const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            console.log(`   - ${key}: ${valueStr.substring(0, 150)}`);
        }
    });
}

// Função principal
async function main() {
    console.log('🔍 TESTANDO OPORTUNIDADES ESPECÍFICAS DO FUNIL 33');
    console.log('='.repeat(80));
    console.log(`🔧 Configuração:`);
    console.log(`   SprintHub Base URL: ${SPRINTHUB_BASE_URL}`);
    console.log(`   SprintHub Instance: ${SPRINTHUB_INSTANCE}`);
    console.log(`📊 Funil: 33 - [1] ATIVAÇÃO COMERCIAL`);
    console.log(`📋 Testando IDs: ${OPPORTUNITY_IDS_TO_TEST.join(', ')}\n`);
    
    // Buscar todas as oportunidades da etapa 317 primeiro
    const url = `https://${SPRINTHUB_BASE_URL}/crm/opportunities/33?apitoken=${SPRINTHUB_TOKEN}&i=${SPRINTHUB_INSTANCE}`;
    
    try {
        const payloadObject = { page: 0, limit: 100, columnId: 317 };
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
            console.error(`❌ Erro HTTP ${response.status}`);
            return;
        }

        const data = await response.json();
        const opportunities = Array.isArray(data) ? data : [];
        
        console.log(`\n✅ Encontradas ${opportunities.length} oportunidades na etapa 317 (ACOLHIMENTO)\n`);
        
        // Analisar todas as oportunidades que têm "Acolhimento Ativacao" preenchido
        let comAcolhimento = 0;
        opportunities.forEach(opp => {
            const fields = opp.fields || {};
            const acolhimentoValue = fields['Acolhimento Ativacao'] || 
                                   fields['Acolhimento Ativação'] ||
                                   fields['acolhimento ativacao'] ||
                                   fields['ACOLHIMENTO ATIVACAO'];
            
            if (acolhimentoValue && acolhimentoValue !== '' && acolhimentoValue !== null) {
                comAcolhimento++;
                console.log(`\n${'='.repeat(80)}`);
                analisarCampos(opp);
            }
        });
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📊 RESUMO:`);
        console.log(`   Total de oportunidades na etapa 317: ${opportunities.length}`);
        console.log(`   Oportunidades com "Acolhimento Ativacao" preenchido: ${comAcolhimento}`);
        console.log(`\n✅ Análise concluída!`);
        
    } catch (error) {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    }
}

// Executar
main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});



