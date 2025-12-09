#!/usr/bin/env node

/**
 * Script para buscar uma amostra de oportunidades do Funil 33 (Ativação Comercial)
 * usando o endpoint /debug/sample que já existe na API
 */

const API_BASE_URL = process.env.VITE_SYNC_API_URL || 'https://sincrocrm.oficialmed.com.br';
const FUNNEL_ID = 33; // Ativação Comercial

// Etapas do funil 33 (Ativação Comercial) - preciso verificar quais são
const STAGES = [314, 317, 315, 316, 318, 319, 320];

async function buscarAmostra(funnelId, stageId) {
    const url = `${API_BASE_URL}/debug/sample?funnel=${funnelId}&stage=${stageId}&limit=5`;
    
    try {
        console.log(`🔍 Buscando amostra - Funil ${funnelId}, Etapa ${stageId}...`);
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`   ⚠️ Erro HTTP ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        return null;
    }
}

function analisarEstrutura(data) {
    if (!data.success || !data.sample) {
        console.log('❌ Nenhuma amostra encontrada');
        return;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 ANÁLISE DA ESTRUTURA DOS DADOS');
    console.log('='.repeat(80));
    
    const sample = data.sample;
    console.log(`\n📋 Oportunidade ID: ${sample.id}`);
    console.log(`📋 Título: ${sample.title || 'N/A'}`);
    console.log(`📋 Status: ${sample.status || 'N/A'}`);
    console.log(`📋 CRM Column: ${sample.crm_column || 'N/A'}`);
    
    if (data.fieldsStructure) {
        console.log('\n📋 Campos diretos:', data.fieldsStructure.directFields.length);
        console.log('   ', data.fieldsStructure.directFields.join(', '));
        
        console.log('\n📋 Campos customizados (fields):', data.fieldsStructure.customFields.length);
        if (data.fieldsStructure.customFields.length > 0) {
            data.fieldsStructure.customFields.forEach(field => {
                console.log(`   - ${field}`);
            });
        }
        
        console.log('\n🎯 Campos de data/hora detectados:', data.fieldsStructure.dateTimeFields.length);
        if (data.fieldsStructure.dateTimeFields.length > 0) {
            data.fieldsStructure.dateTimeFields.forEach(field => {
                console.log(`   ✅ ${field}`);
            });
        }
    }
    
    if (data.allFieldsInFields && data.allFieldsInFields.length > 0) {
        console.log('\n📋 TODOS os campos em "fields" (' + data.allFieldsInFields.length + '):');
        data.allFieldsInFields.forEach(field => {
            console.log(`   - ${field}`);
        });
    }
    
    if (data.mappedFields) {
        console.log('\n🎯 Campos mapeados automaticamente:');
        const mapped = Object.keys(data.mappedFields).filter(k => data.mappedFields[k] !== null);
        if (mapped.length > 0) {
            mapped.forEach(field => {
                console.log(`   ✅ ${field}: ${data.mappedFields[field]}`);
            });
        } else {
            console.log('   ⚠️ Nenhum campo foi mapeado automaticamente');
        }
    }
    
    // Mostrar campos com valores
    if (sample.fields) {
        console.log('\n📋 Valores dos campos em "fields":');
        Object.keys(sample.fields).forEach(key => {
            const value = sample.fields[key];
            const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            console.log(`   - ${key}: ${valueStr.substring(0, 150)}`);
        });
    }
    
    // Salvar JSON completo
    const fs = require('fs');
    const outputFile = `funil-${FUNNEL_ID}-stage-${data.stageId}-sample.json`;
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`\n💾 Dados completos salvos em: ${outputFile}`);
}

async function main() {
    console.log('🔍 Buscando amostra de oportunidades do Funil 33 (Ativação Comercial)\n');
    
    let encontrou = false;
    
    // Tentar todas as etapas
    for (const stageId of STAGES) {
        const data = await buscarAmostra(FUNNEL_ID, stageId);
        
        if (data && data.success && data.sample) {
            encontrou = true;
            console.log(`\n✅ Amostra encontrada na etapa ${stageId}!`);
            analisarEstrutura(data);
            break;
        }
    }
    
    if (!encontrou) {
        console.log('\n❌ Não foi possível encontrar amostras no Funil 33');
        console.log('💡 Tentando funil 14 (Recompra) como alternativa...\n');
        
        const data = await buscarAmostra(14, 202);
        if (data && data.success && data.sample) {
            console.log(`\n✅ Amostra encontrada no Funil 14, Etapa 202!`);
            analisarEstrutura(data);
        } else {
            console.log('\n❌ Não foi possível encontrar amostras');
        }
    }
    
    console.log('\n✅ Análise concluída!\n');
}

main().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});


