#!/usr/bin/env node

/**
 * Script para buscar uma oportunidade específica do SprintHub
 * e ver a estrutura completa dos campos, especialmente os de data/hora
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
    console.log('💡 Configure as variáveis de ambiente ou use a API do Easypanel');
    process.exit(1);
}

const OPPORTUNITY_ID = process.argv[2] || '177596';
const FUNNEL_ID = process.argv[3] || '33'; // Funil 33 = Ativação Comercial

async function fetchOpportunityById(funnelId, opportunityId) {
    // Tentar buscar via endpoint de oportunidades do funil
    const url = `https://${SPRINTHUB_BASE_URL}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_TOKEN}&i=${SPRINTHUB_INSTANCE}`;
    
    console.log(`🔍 Buscando oportunidade ID ${opportunityId} no Funil ${funnelId}...\n`);
    
    // Buscar em todas as etapas do funil 33
    const stages = [314, 317, 315, 316, 318, 319, 320];
    
    for (const stageId of stages) {
        try {
            const payloadObject = {
                page: 0,
                limit: 100,
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
                continue; // Tentar próxima etapa
            }

            const data = await response.json();
            const opportunities = Array.isArray(data) ? data : [];
            
            const opportunity = opportunities.find(opp => opp.id == opportunityId);
            
            if (opportunity) {
                console.log(`✅ Oportunidade encontrada na etapa ${stageId}!\n`);
                return { opportunity, stageId, funnelId };
            }
        } catch (error) {
            // Continuar tentando
        }
    }
    
    return null;
}

async function analyzeOpportunity(opportunity) {
    console.log('='.repeat(80));
    console.log('📊 ANÁLISE DA OPORTUNIDADE');
    console.log('='.repeat(80));
    console.log(`\nID: ${opportunity.id}`);
    console.log(`Título: ${opportunity.title}`);
    console.log(`Status: ${opportunity.status}`);
    console.log(`CRM Column: ${opportunity.crm_column}`);
    
    // Analisar campos diretos
    console.log('\n📋 Campos diretos da oportunidade:');
    Object.keys(opportunity).filter(k => k !== 'fields' && k !== 'dataLead').forEach(key => {
        console.log(`   - ${key}: ${JSON.stringify(opportunity[key]).substring(0, 50)}`);
    });
    
    // Analisar campos customizados (fields)
    if (opportunity.fields) {
        console.log('\n📋 Campos customizados (fields):');
        const fields = opportunity.fields;
        Object.keys(fields).forEach(key => {
            const value = fields[key];
            const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
            console.log(`   - ${key}: ${valueStr.substring(0, 100)}`);
            
            // Verificar se é campo de data/hora relacionado às etapas
            const keyLower = key.toLowerCase();
            if (keyLower.includes('entrada') || keyLower.includes('acolhimento') || 
                keyLower.includes('qualificado') || keyLower.includes('orcamento') ||
                keyLower.includes('negociacao') || keyLower.includes('follow') ||
                keyLower.includes('cadastro') || keyLower.includes('compra') ||
                keyLower.includes('recompra') || keyLower.includes('monitoramento') ||
                keyLower.includes('ativacao') || keyLower.includes('reativacao')) {
                console.log(`     ⭐ CAMPO DE DATA/HORA DETECTADO!`);
            }
        });
        
        // Listar campos de data/hora encontrados
        const dateTimeFields = Object.keys(fields).filter(k => {
            const kLower = k.toLowerCase();
            return kLower.includes('entrada') || kLower.includes('acolhimento') || 
                   kLower.includes('qualificado') || kLower.includes('orcamento') ||
                   kLower.includes('negociacao') || kLower.includes('follow') ||
                   kLower.includes('cadastro');
        });
        
        if (dateTimeFields.length > 0) {
            console.log('\n🎯 Campos de data/hora encontrados:');
            dateTimeFields.forEach(field => {
                console.log(`   - ${field}: ${fields[field]}`);
            });
        }
    }
    
    // Analisar dataLead
    if (opportunity.dataLead) {
        console.log('\n📋 Campos do lead (dataLead):');
        Object.keys(opportunity.dataLead).slice(0, 10).forEach(key => {
            console.log(`   - ${key}`);
        });
        if (Object.keys(opportunity.dataLead).length > 10) {
            console.log(`   ... e mais ${Object.keys(opportunity.dataLead).length - 10} campos`);
        }
    }
    
    // Salvar JSON completo
    const outputFile = `opportunity-${opportunity.id}-analysis.json`;
    fs.writeFileSync(outputFile, JSON.stringify(opportunity, null, 2));
    console.log(`\n💾 Dados completos salvos em: ${outputFile}`);
}

async function main() {
    console.log('🔍 Buscando oportunidade específica do SprintHub\n');
    console.log(`📋 ID: ${OPPORTUNITY_ID}`);
    console.log(`📊 Funil: ${FUNNEL_ID} (Ativação Comercial)\n`);
    
    const result = await fetchOpportunityById(FUNNEL_ID, OPPORTUNITY_ID);
    
    if (!result) {
        console.log('❌ Oportunidade não encontrada no Funil 33');
        console.log('💡 Tentando outros funis...\n');
        
        // Tentar outros funis comuns
        const otherFunnels = [6, 14, 32, 34, 35, 36, 38, 41];
        for (const funnelId of otherFunnels) {
            const result2 = await fetchOpportunityById(funnelId, OPPORTUNITY_ID);
            if (result2) {
                await analyzeOpportunity(result2.opportunity);
                return;
            }
        }
        
        console.log('❌ Oportunidade não encontrada em nenhum funil testado');
        console.log('💡 Verifique se o ID está correto ou se a oportunidade existe');
        process.exit(1);
    }
    
    await analyzeOpportunity(result.opportunity);
    
    console.log('\n✅ Análise concluída!\n');
}

main().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});



