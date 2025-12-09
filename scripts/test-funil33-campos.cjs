#!/usr/bin/env node

/**
 * Script para testar o endpoint de debug do Funil 33
 * e ver TODOS os campos de data/hora que vêm do SprintHub
 */

const API_BASE_URL = process.env.VITE_SYNC_API_URL || 'https://sincrocrm.oficialmed.com.br';

// Etapas do funil 33 (Ativação Comercial)
const STAGES = [314, 317, 315, 316, 318, 319, 320];

async function testarEtapa(stageId) {
    const url = `${API_BASE_URL}/debug/funil33?stage=${stageId}&limit=5`;
    
    try {
        console.log(`\n🔍 Testando etapa ${stageId}...`);
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

function analisarResultado(data) {
    if (!data.success || !data.opportunities || data.opportunities.length === 0) {
        console.log('   ⚠️ Nenhuma oportunidade encontrada');
        return;
    }
    
    console.log(`\n✅ Encontradas ${data.totalFound} oportunidades na etapa ${data.stageId}`);
    
    data.opportunities.forEach((opp, index) => {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📋 Oportunidade ${index + 1}: ID ${opp.id} - ${opp.title}`);
        console.log(`   Etapa: ${opp.crm_column}`);
        console.log(`   Status: ${opp.status}`);
        
        if (opp.possibleDateTimeFields && opp.possibleDateTimeFields.length > 0) {
            console.log(`\n🎯 Campos de data/hora detectados (${opp.possibleDateTimeFields.length}):`);
            opp.possibleDateTimeFields.forEach(field => {
                console.log(`   - ${field}`);
            });
        } else {
            console.log(`\n⚠️ Nenhum campo de data/hora detectado automaticamente`);
        }
        
        if (opp.dateTimeFieldsWithValues && Object.keys(opp.dateTimeFieldsWithValues).length > 0) {
            console.log(`\n✅ Campos de data/hora COM VALORES (${Object.keys(opp.dateTimeFieldsWithValues).length}):`);
            Object.keys(opp.dateTimeFieldsWithValues).forEach(field => {
                console.log(`   ✅ ${field}: ${opp.dateTimeFieldsWithValues[field]}`);
            });
        } else {
            console.log(`\n⚠️ Nenhum campo de data/hora com valor encontrado`);
        }
        
        if (opp.mappedFields && Object.keys(opp.mappedFields).filter(k => opp.mappedFields[k] !== null).length > 0) {
            console.log(`\n🎯 Campos mapeados automaticamente:`);
            Object.keys(opp.mappedFields).forEach(field => {
                if (opp.mappedFields[field] !== null) {
                    console.log(`   ✅ ${field}: ${opp.mappedFields[field]}`);
                }
            });
        } else {
            console.log(`\n⚠️ Nenhum campo foi mapeado automaticamente`);
        }
        
        // Mostrar TODOS os campos com valores para análise
        if (opp.allFieldsWithValues && Object.keys(opp.allFieldsWithValues).length > 0) {
            console.log(`\n📋 TODOS os campos com valores (${Object.keys(opp.allFieldsWithValues).length}):`);
            Object.keys(opp.allFieldsWithValues).slice(0, 20).forEach(field => {
                const value = opp.allFieldsWithValues[field];
                const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
                console.log(`   - ${field}: ${valueStr.substring(0, 100)}`);
            });
            if (Object.keys(opp.allFieldsWithValues).length > 20) {
                console.log(`   ... e mais ${Object.keys(opp.allFieldsWithValues).length - 20} campos`);
            }
        }
    });
    
    // Salvar JSON completo
    const fs = require('fs');
    const outputFile = `funil33-etapa-${data.stageId}-analysis.json`;
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`\n💾 Dados completos salvos em: ${outputFile}`);
}

async function main() {
    console.log('🔍 Analisando campos do Funil 33 (Ativação Comercial)');
    console.log('📡 API:', API_BASE_URL);
    console.log('📋 Etapas a testar:', STAGES.join(', '));
    
    let encontrou = false;
    
    // Testar todas as etapas
    for (const stageId of STAGES) {
        const data = await testarEtapa(stageId);
        
        if (data && data.success && data.opportunities && data.opportunities.length > 0) {
            encontrou = true;
            analisarResultado(data);
            break; // Parar na primeira etapa que tiver oportunidades
        }
    }
    
    if (!encontrou) {
        console.log('\n❌ Não foi possível encontrar oportunidades com campos preenchidos');
        console.log('💡 Verifique se:');
        console.log('   - A API está acessível');
        console.log('   - As oportunidades existem no SprintHub');
        console.log('   - Os campos estão realmente preenchidos no SprintHub');
    }
    
    console.log('\n✅ Análise concluída!\n');
}

main().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});


