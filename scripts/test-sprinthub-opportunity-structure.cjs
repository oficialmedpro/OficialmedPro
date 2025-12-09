#!/usr/bin/env node

/**
 * Script para testar a API do SprintHub e verificar a estrutura dos dados
 * de oportunidades, especialmente os campos de data/hora das etapas
 */

const fs = require('fs');
const path = require('path');

// Função para ler secrets (compatível com Portainer e EasyPanel)
function readSecret(envVarFile, fallbackEnvVars) {
    try {
        if (envVarFile && fs.existsSync(envVarFile)) {
            const content = fs.readFileSync(envVarFile, 'utf8').trim();
            return content;
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
    
    throw new Error(`❌ Não foi possível ler ${envVarFile} ou variáveis: ${fallbacks.join(', ')}`);
}

// Configurações
let SPRINTHUB_BASE_URL, SPRINTHUB_INSTANCE, SPRINTHUB_TOKEN;

try {
    SPRINTHUB_BASE_URL = readSecret(process.env.SPRINTHUB_BASE_URL_FILE, ['SPRINTHUB_BASE_URL', 'VITE_SPRINTHUB_BASE_URL']) || 'sprinthub-api-master.sprinthub.app';
    SPRINTHUB_INSTANCE = readSecret(process.env.SPRINTHUB_INSTANCE_FILE, ['SPRINTHUB_INSTANCE', 'VITE_SPRINTHUB_INSTANCE']) || 'oficialmed';
    SPRINTHUB_TOKEN = readSecret(process.env.SPRINTHUB_TOKEN_FILE, ['SPRINTHUB_TOKEN', 'VITE_SPRINTHUB_API_TOKEN']);
} catch (error) {
    // Se não conseguir ler, tentar valores padrão ou do .env
    SPRINTHUB_BASE_URL = process.env.SPRINTHUB_BASE_URL || process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app';
    SPRINTHUB_INSTANCE = process.env.SPRINTHUB_INSTANCE || process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed';
    SPRINTHUB_TOKEN = process.env.SPRINTHUB_TOKEN || process.env.VITE_SPRINTHUB_API_TOKEN;
}

if (!SPRINTHUB_TOKEN) {
    console.error('❌ SPRINTHUB_TOKEN não configurado');
    process.exit(1);
}

const SPRINTHUB_CONFIG = {
    baseUrl: SPRINTHUB_BASE_URL,
    instance: SPRINTHUB_INSTANCE,
    apiToken: SPRINTHUB_TOKEN
};

// Funis e etapas para testar (mesmos da API)
const FUNIS_CONFIG = {
    6: {
        name: '[1] COMERCIAL APUCARANA',
        stages: [130, 231, 82, 207, 83, 85, 232]
    },
    14: {
        name: '[2] RECOMPRA',
        stages: [202, 228, 229, 206, 203, 204, 230, 205, 269, 167, 148, 168, 149, 169, 150]
    }
};

async function fetchOpportunitySample(funnelId, stageId) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`;
    
    try {
        const payloadObject = {
            page: 0,
            limit: 5, // Apenas 5 para análise
            columnId: stageId
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            },
            body: JSON.stringify(payloadObject)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`❌ Erro ao buscar Funil ${funnelId} Etapa ${stageId}:`, error.message);
        return [];
    }
}

function analyzeOpportunityStructure(opportunities) {
    if (!opportunities || opportunities.length === 0) {
        return { fields: {}, fieldsInFields: {}, dataLead: {} };
    }
    
    const allFields = new Set();
    const fieldsInFields = new Set();
    const dataLeadFields = new Set();
    const customFields = new Set();
    
    opportunities.forEach(opp => {
        // Campos diretos da oportunidade
        Object.keys(opp).forEach(key => {
            if (key !== 'fields' && key !== 'dataLead') {
                allFields.add(key);
            }
        });
        
        // Campos dentro de 'fields'
        if (opp.fields && typeof opp.fields === 'object') {
            Object.keys(opp.fields).forEach(key => {
                fieldsInFields.add(key);
                // Verificar se é um campo de data/hora relacionado às etapas
                const keyLower = key.toLowerCase();
                if (keyLower.includes('entrada') || keyLower.includes('acolhimento') || 
                    keyLower.includes('qualificado') || keyLower.includes('orcamento') ||
                    keyLower.includes('negociacao') || keyLower.includes('follow') ||
                    keyLower.includes('cadastro') || keyLower.includes('compra') ||
                    keyLower.includes('recompra') || keyLower.includes('monitoramento') ||
                    keyLower.includes('ativacao') || keyLower.includes('reativacao')) {
                    customFields.add(key);
                }
            });
        }
        
        // Campos dentro de 'dataLead'
        if (opp.dataLead && typeof opp.dataLead === 'object') {
            Object.keys(opp.dataLead).forEach(key => {
                dataLeadFields.add(key);
            });
        }
    });
    
    return {
        fields: Array.from(allFields).sort(),
        fieldsInFields: Array.from(fieldsInFields).sort(),
        dataLead: Array.from(dataLeadFields).sort(),
        customFields: Array.from(customFields).sort()
    };
}

async function main() {
    console.log('🔍 Analisando estrutura de dados do SprintHub...\n');
    console.log('📋 Configuração:');
    console.log(`   Base URL: ${SPRINTHUB_CONFIG.baseUrl}`);
    console.log(`   Instance: ${SPRINTHUB_CONFIG.instance}`);
    console.log(`   Token: ${SPRINTHUB_TOKEN.substring(0, 10)}...\n`);
    
    const results = {
        funis: {},
        allFields: new Set(),
        allFieldsInFields: new Set(),
        allDataLeadFields: new Set(),
        allCustomFields: new Set(),
        sampleOpportunity: null
    };
    
    // Testar alguns funis e etapas
    for (const [funnelId, config] of Object.entries(FUNIS_CONFIG)) {
        console.log(`\n📊 Testando Funil ${funnelId}: ${config.name}`);
        console.log(`   Etapas: ${config.stages.slice(0, 3).join(', ')}... (testando primeiras 3)`);
        
        const funnelResults = {
            name: config.name,
            stages: {}
        };
        
        // Testar apenas as primeiras 3 etapas para não demorar muito
        for (const stageId of config.stages.slice(0, 3)) {
            console.log(`   🔄 Etapa ${stageId}...`);
            const opportunities = await fetchOpportunitySample(Number(funnelId), stageId);
            
            if (opportunities.length > 0) {
                const analysis = analyzeOpportunityStructure(opportunities);
                funnelResults.stages[stageId] = analysis;
                
                // Acumular campos
                analysis.fields.forEach(f => results.allFields.add(f));
                analysis.fieldsInFields.forEach(f => results.allFieldsInFields.add(f));
                analysis.dataLead.forEach(f => results.allDataLeadFields.add(f));
                analysis.customFields.forEach(f => results.allCustomFields.add(f));
                
                // Guardar primeira oportunidade como exemplo
                if (!results.sampleOpportunity) {
                    results.sampleOpportunity = opportunities[0];
                }
                
                console.log(`      ✅ ${opportunities.length} oportunidades encontradas`);
                console.log(`      📋 Campos em 'fields': ${analysis.fieldsInFields.length}`);
                console.log(`      🎯 Campos customizados (data/hora): ${analysis.customFields.length}`);
                if (analysis.customFields.length > 0) {
                    console.log(`      📅 Campos: ${analysis.customFields.join(', ')}`);
                }
            } else {
                console.log(`      ⚪ Nenhuma oportunidade nesta etapa`);
            }
            
            // Delay para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        results.funis[funnelId] = funnelResults;
    }
    
    // Relatório final
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(80));
    console.log(`\n📋 Campos diretos da oportunidade (${results.allFields.size}):`);
    console.log(Array.from(results.allFields).sort().join(', '));
    
    console.log(`\n📋 Campos dentro de 'fields' (${results.allFieldsInFields.size}):`);
    console.log(Array.from(results.allFieldsInFields).sort().join(', '));
    
    console.log(`\n📋 Campos dentro de 'dataLead' (${results.allDataLeadFields.size}):`);
    console.log(Array.from(results.allDataLeadFields).sort().join(', '));
    
    console.log(`\n🎯 Campos customizados (data/hora etapas) encontrados (${results.allCustomFields.size}):`);
    if (results.allCustomFields.size > 0) {
        console.log(Array.from(results.allCustomFields).sort().join(', '));
    } else {
        console.log('   ⚠️ Nenhum campo de data/hora de etapa encontrado nos dados');
        console.log('   💡 Os campos podem estar em outro lugar ou ainda não foram criados no SprintHub');
    }
    
    // Salvar exemplo completo
    if (results.sampleOpportunity) {
        const outputFile = path.join(__dirname, 'sprinthub-opportunity-sample.json');
        fs.writeFileSync(outputFile, JSON.stringify(results.sampleOpportunity, null, 2));
        console.log(`\n💾 Exemplo completo salvo em: ${outputFile}`);
    }
    
    // Salvar relatório
    const reportFile = path.join(__dirname, 'sprinthub-fields-analysis.json');
    fs.writeFileSync(reportFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        allFields: Array.from(results.allFields).sort(),
        allFieldsInFields: Array.from(results.allFieldsInFields).sort(),
        allDataLeadFields: Array.from(results.allDataLeadFields).sort(),
        allCustomFields: Array.from(results.allCustomFields).sort(),
        funis: results.funis
    }, null, 2));
    console.log(`📄 Relatório completo salvo em: ${reportFile}`);
    
    console.log('\n✅ Análise concluída!\n');
}

main().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});

