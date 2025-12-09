#!/usr/bin/env node

/**
 * Script para analisar oportunidades específicas do Funil 33
 * que têm campos de data/hora preenchidos
 */

const API_BASE_URL = process.env.VITE_SYNC_API_URL || 'https://sincrocrm.oficialmed.com.br';

// Oportunidades específicas fornecidas pelo usuário
const OPPORTUNITIES = [
    { funnelID: 33, opportunityID: 177874 },
    { funnelID: 33, opportunityID: 177775 },
    { funnelID: 33, opportunityID: 177690 },
    { funnelID: 33, opportunityID: 177596 },
    { funnelID: 33, opportunityID: 177452 },
    { funnelID: 33, opportunityID: 177373 },
    { funnelID: 33, opportunityID: 177120 }
];

async function analisarOportunidade(funnelId, opportunityId) {
    const url = `${API_BASE_URL}/debug/opportunity?funnelID=${funnelId}&opportunityID=${opportunityId}`;
    
    try {
        console.log(`\n🔍 Analisando oportunidade ${opportunityId}...`);
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`   ⚠️ Erro HTTP ${response.status}`);
            const text = await response.text();
            console.log(`   Resposta: ${text.substring(0, 200)}`);
            return null;
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        return null;
    }
}

function exibirResultado(data, index) {
    if (!data.success || !data.opportunity) {
        console.log(`\n❌ Oportunidade ${data.opportunityId} não encontrada ou sem dados`);
        return;
    }
    
    const opp = data.opportunity;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 OPORTUNIDADE ${index + 1}: ID ${opp.id} - ${opp.title}`);
    console.log(`   Funil: ${data.funnelId} | Etapa: ${opp.foundInStage} (${opp.crm_column})`);
    console.log(`   Status: ${opp.status}`);
    
    if (opp.allFields && opp.allFields.length > 0) {
        console.log(`\n📋 Total de campos em "fields": ${opp.allFields.length}`);
    }
    
    if (opp.possibleDateTimeFields && opp.possibleDateTimeFields.length > 0) {
        console.log(`\n🎯 Campos de data/hora detectados (${opp.possibleDateTimeFields.length}):`);
        opp.possibleDateTimeFields.forEach(field => {
            console.log(`   - ${field}`);
        });
    } else {
        console.log(`\n⚠️ Nenhum campo de data/hora detectado automaticamente`);
    }
    
    if (opp.dateTimeFieldsWithValues && Object.keys(opp.dateTimeFieldsWithValues).length > 0) {
        console.log(`\n✅ CAMPOS DE DATA/HORA COM VALORES (${Object.keys(opp.dateTimeFieldsWithValues).length}):`);
        Object.keys(opp.dateTimeFieldsWithValues).forEach(field => {
            const value = opp.dateTimeFieldsWithValues[field];
            console.log(`   ✅ ${field}: ${value} (tipo: ${typeof value})`);
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
    
    // Mostrar TODOS os campos com valores
    if (opp.allFieldsWithValues && Object.keys(opp.allFieldsWithValues).length > 0) {
        console.log(`\n📋 TODOS os campos com valores (${Object.keys(opp.allFieldsWithValues).length}):`);
        Object.keys(opp.allFieldsWithValues).forEach(field => {
            const value = opp.allFieldsWithValues[field];
            const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            console.log(`   - ${field}: ${valueStr.substring(0, 150)}`);
        });
    }
}

async function main() {
    console.log('🔍 Analisando oportunidades específicas do Funil 33');
    console.log('📡 API:', API_BASE_URL);
    console.log(`📋 Total de oportunidades a analisar: ${OPPORTUNITIES.length}\n`);
    
    const resultados = [];
    let encontradas = 0;
    
    for (let i = 0; i < OPPORTUNITIES.length; i++) {
        const { funnelID, opportunityID } = OPPORTUNITIES[i];
        const data = await analisarOportunidade(funnelID, opportunityID);
        
        if (data && data.success && data.opportunity) {
            encontradas++;
            exibirResultado(data, i);
            resultados.push(data);
        } else {
            console.log(`\n❌ Oportunidade ${opportunityID} não encontrada ou sem dados`);
        }
        
        // Pequeno delay entre requisições
        if (i < OPPORTUNITIES.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // Resumo final
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 RESUMO FINAL`);
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ Oportunidades encontradas: ${encontradas} de ${OPPORTUNITIES.length}`);
    
    // Consolidar todos os campos de data/hora encontrados
    const todosCamposDataHora = new Set();
    const todosCamposComValores = new Map();
    
    resultados.forEach(data => {
        if (data.opportunity) {
            if (data.opportunity.possibleDateTimeFields) {
                data.opportunity.possibleDateTimeFields.forEach(field => {
                    todosCamposDataHora.add(field);
                });
            }
            if (data.opportunity.dateTimeFieldsWithValues) {
                Object.keys(data.opportunity.dateTimeFieldsWithValues).forEach(field => {
                    if (!todosCamposComValores.has(field)) {
                        todosCamposComValores.set(field, data.opportunity.dateTimeFieldsWithValues[field]);
                    }
                });
            }
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
    const fs = require('fs');
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


