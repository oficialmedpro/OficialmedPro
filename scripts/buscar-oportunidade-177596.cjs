#!/usr/bin/env node

/**
 * Script para buscar a oportunidade 177596 do SprintHub via API Easypanel
 * e analisar a estrutura dos campos de data/hora
 */

const API_BASE_URL = process.env.VITE_SYNC_API_URL || 'https://sincrocrm.oficialmed.com.br';
const FUNNEL_ID = 33; // Ativação Comercial
const OPPORTUNITY_ID = 177596;

// Etapas do funil 33 (Ativação Comercial)
const STAGES = [314, 317, 315, 316, 318, 319, 320];

async function buscarOportunidadeNoFunil(funnelId, stageId, opportunityId) {
    const url = `${API_BASE_URL}/debug-sprinthub-opportunity?funnelId=${funnelId}&stageId=${stageId}&page=0&limit=100`;
    
    try {
        console.log(`🔍 Buscando na etapa ${stageId}...`);
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`   ⚠️ Erro HTTP ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
            // Se retornou array, buscar a oportunidade específica
            const opportunities = Array.isArray(data.data) ? data.data : [data.data];
            const opportunity = opportunities.find(opp => opp.id == opportunityId);
            
            if (opportunity) {
                console.log(`   ✅ Oportunidade ${opportunityId} encontrada!`);
                return opportunity;
            }
        }
        
        return null;
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        return null;
    }
}

function analisarCampos(opportunity) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ANÁLISE DETALHADA DA OPORTUNIDADE');
    console.log('='.repeat(80));
    console.log(`\nID: ${opportunity.id}`);
    console.log(`Título: ${opportunity.title || 'N/A'}`);
    console.log(`Status: ${opportunity.status || 'N/A'}`);
    console.log(`CRM Column: ${opportunity.crm_column || 'N/A'}`);
    
    // Analisar campos diretos
    console.log('\n📋 Campos diretos da oportunidade:');
    const directFields = Object.keys(opportunity).filter(k => k !== 'fields' && k !== 'dataLead');
    directFields.forEach(key => {
        const value = opportunity[key];
        const valueStr = typeof value === 'object' ? JSON.stringify(value).substring(0, 80) : String(value).substring(0, 80);
        console.log(`   - ${key}: ${valueStr}`);
    });
    
    // Analisar campos customizados (fields) - O MAIS IMPORTANTE
    if (opportunity.fields) {
        console.log('\n📋 Campos customizados (fields) - ESTRUTURA COMPLETA:');
        console.log('   Total de campos:', Object.keys(opportunity.fields).length);
        
        const fields = opportunity.fields;
        const dateTimeFields = [];
        const otherFields = [];
        
        Object.keys(fields).forEach(key => {
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
                keyLower.includes('reativacao') || keyLower.includes('reativação');
            
            if (isDateTimeField) {
                dateTimeFields.push({ key, value, valueStr });
            } else {
                otherFields.push({ key, value, valueStr });
            }
        });
        
        if (dateTimeFields.length > 0) {
            console.log('\n🎯 CAMPOS DE DATA/HORA ENCONTRADOS:');
            dateTimeFields.forEach(({ key, value, valueStr }) => {
                console.log(`   ✅ ${key}: ${valueStr.substring(0, 100)}`);
            });
        } else {
            console.log('\n⚠️ Nenhum campo de data/hora detectado automaticamente');
        }
        
        console.log('\n📋 Todos os campos em "fields":');
        Object.keys(fields).forEach(key => {
            const value = fields[key];
            const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            console.log(`   - ${key}: ${valueStr.substring(0, 150)}`);
        });
        
        // Verificar campos que podem estar em outros formatos
        console.log('\n🔍 Verificando padrões alternativos...');
        Object.keys(fields).forEach(key => {
            if (typeof fields[key] === 'string' && fields[key].match(/\d{4}-\d{2}-\d{2}/)) {
                console.log(`   📅 Possível data encontrada em "${key}": ${fields[key]}`);
            }
        });
    } else {
        console.log('\n⚠️ Nenhum campo "fields" encontrado na oportunidade');
    }
    
    // Analisar dataLead
    if (opportunity.dataLead) {
        console.log('\n📋 Campos do lead (dataLead):');
        const leadFields = Object.keys(opportunity.dataLead);
        console.log(`   Total: ${leadFields.length} campos`);
        leadFields.slice(0, 10).forEach(key => {
            console.log(`   - ${key}`);
        });
        if (leadFields.length > 10) {
            console.log(`   ... e mais ${leadFields.length - 10} campos`);
        }
    }
    
    // Salvar JSON completo
    const fs = require('fs');
    const outputFile = `opportunity-${opportunity.id}-complete.json`;
    fs.writeFileSync(outputFile, JSON.stringify(opportunity, null, 2));
    console.log(`\n💾 Dados completos salvos em: ${outputFile}`);
}

async function main() {
    console.log('🔍 Buscando oportunidade 177596 do SprintHub\n');
    console.log(`📊 Funil: ${FUNNEL_ID} (Ativação Comercial)`);
    console.log(`📋 ID: ${OPPORTUNITY_ID}\n`);
    
    let opportunity = null;
    
    // Buscar em todas as etapas do funil 33
    for (const stageId of STAGES) {
        opportunity = await buscarOportunidadeNoFunil(FUNNEL_ID, stageId, OPPORTUNITY_ID);
        if (opportunity) {
            break;
        }
    }
    
    if (!opportunity) {
        console.log('\n❌ Oportunidade não encontrada no Funil 33');
        console.log('💡 Tentando buscar via endpoint de debug direto...\n');
        
        // Tentar buscar uma amostra para ver a estrutura
        try {
            const sampleUrl = `${API_BASE_URL}/debug-sprinthub-opportunity?funnelId=${FUNNEL_ID}&stageId=${STAGES[0]}&page=0&limit=10`;
            const response = await fetch(sampleUrl);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    const opportunities = Array.isArray(data.data) ? data.data : [data.data];
                    if (opportunities.length > 0) {
                        console.log(`📊 Encontradas ${opportunities.length} oportunidades na etapa ${STAGES[0]}`);
                        console.log(`💡 Analisando primeira oportunidade como exemplo...\n`);
                        opportunity = opportunities[0];
                    }
                }
            }
        } catch (error) {
            console.log(`❌ Erro ao buscar amostra: ${error.message}`);
        }
    }
    
    if (opportunity) {
        await analisarCampos(opportunity);
        console.log('\n✅ Análise concluída!\n');
    } else {
        console.log('\n❌ Não foi possível encontrar a oportunidade');
        console.log('💡 Verifique se:');
        console.log('   - O ID está correto');
        console.log('   - A oportunidade existe no SprintHub');
        console.log('   - A API está acessível');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});



