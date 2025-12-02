#!/usr/bin/env node

/**
 * Script para analisar campos do SprintHub que não existem na tabela
 */

const fs = require('fs');

// Ler o JSON com as oportunidades analisadas
const jsonFile = 'oportunidades-funil33-analise-completa.json';
if (!fs.existsSync(jsonFile)) {
    console.error(`❌ Arquivo ${jsonFile} não encontrado`);
    console.log('💡 Execute primeiro: node scripts/buscar-oportunidades-funil33.cjs');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

// Coletar TODOS os campos únicos encontrados
const todosCampos = new Set();

data.resultados.forEach(result => {
    if (result.allFields) {
        result.allFields.forEach(field => {
            todosCampos.add(field.trim());
        });
    }
});

// Campos que já existem na tabela (da estrutura que vi)
const camposExistentes = new Set([
    'origem_oportunidade', // ORIGEM OPORTUNIDADE
    'qualificacao', // QUALIFICACAO
    'status_orcamento', // Status Orcamento
    'primecadastro', // PRIMECADASTRO
    'codigo_prime_receita', // Codigo Prime Receita
    'descricao_da_formula', // Descricao da Formula
    'etapa', // etapa
    'forma_pagamento', // Forma de Pagamento
    'numero_do_pedido', // Numero do pedido
    'status_getnet', // Status Getnet
    'valorconfere', // Valorconfere
    'codigo_id_lead', // Codigo ID Lead
    'codigo_id_oportunidade', // Codigo ID Oportunidade
    'id_oportunidade', // idoportunidade
    'valorfrete', // valorfrete
    'valorprodutos', // valorprodutos
    // Campos de data/hora já criados
    'entrada_compra', 'acolhimento_compra', 'qualificado_compra', 'orcamento_compra',
    'negociacao_compra', 'follow_up_compra', 'cadastro_compra',
    'entrada_recompra', 'acolhimento_recompra', 'qualificado_recompra', 'orcamento_recompra',
    'negociacao_recompra', 'follow_up_recompra', 'cadastro_recompra',
    'entrada_monitoramento', 'acolhimento_monitoramento', 'qualificado_monitoramento', 'orcamento_monitoramento',
    'negociacao_monitoramento', 'follow_up_monitoramento', 'cadastro_monitoramento',
    'entrada_ativacao', 'acolhimento_ativacao', 'qualificado_ativacao', 'orcamento_ativacao',
    'negociacao_ativacao', 'follow_up_ativacao', 'cadastro_ativacao',
    'entrada_reativacao', 'acolhimento_reativacao', 'qualificado_reativacao', 'orcamento_reativacao',
    'negociacao_reativacao', 'follow_up_reativacao', 'cadastro_reativacao'
]);

// Normalizar nome do campo (converter para formato do banco)
function normalizarNomeCampo(nome) {
    return nome.trim()
        .toLowerCase()
        .replace(/[áàâã]/g, 'a')
        .replace(/[éèê]/g, 'e')
        .replace(/[íìî]/g, 'i')
        .replace(/[óòôõ]/g, 'o')
        .replace(/[úùû]/g, 'u')
        .replace(/ç/g, 'c')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
}

// Analisar campos
const camposFaltantes = [];
const camposComValores = new Map();

Array.from(todosCampos).forEach(campoSprint => {
    const campoNormalizado = normalizarNomeCampo(campoSprint);
    
    // Verificar se existe na tabela
    if (!camposExistentes.has(campoNormalizado)) {
        // Verificar se tem valor em alguma oportunidade
        let temValor = false;
        let valorExemplo = null;
        
        data.resultados.forEach(result => {
            if (result.fields && result.fields[campoSprint]) {
                const valor = result.fields[campoSprint];
                if (valor !== null && valor !== undefined && valor !== '') {
                    temValor = true;
                    if (!valorExemplo) {
                        valorExemplo = valor;
                    }
                }
            }
        });
        
        camposFaltantes.push({
            nome_sprinthub: campoSprint,
            nome_normalizado: campoNormalizado,
            tem_valor: temValor,
            valor_exemplo: valorExemplo
        });
        
        if (temValor) {
            camposComValores.set(campoNormalizado, {
                nome_sprinthub: campoSprint,
                valor_exemplo: valorExemplo
            });
        }
    }
});

console.log('📊 ANÁLISE DE CAMPOS DO SPRINTHUB\n');
console.log(`Total de campos únicos encontrados: ${todosCampos.size}`);
console.log(`Campos que já existem na tabela: ${camposExistentes.size}`);
console.log(`Campos que NÃO existem na tabela: ${camposFaltantes.length}\n`);

if (camposFaltantes.length > 0) {
    console.log('📋 CAMPOS FALTANTES NA TABELA:\n');
    
    const comValores = camposFaltantes.filter(c => c.tem_valor);
    const semValores = camposFaltantes.filter(c => !c.tem_valor);
    
    if (comValores.length > 0) {
        console.log(`✅ Campos COM VALORES (${comValores.length}):`);
        comValores.forEach(campo => {
            console.log(`   - "${campo.nome_sprinthub}" -> ${campo.nome_normalizado}`);
            console.log(`     Exemplo: ${String(campo.valor_exemplo).substring(0, 80)}`);
        });
    }
    
    if (semValores.length > 0) {
        console.log(`\n⚠️ Campos SEM VALORES (${semValores.length}):`);
        semValores.forEach(campo => {
            console.log(`   - "${campo.nome_sprinthub}" -> ${campo.nome_normalizado}`);
        });
    }
    
    // Salvar relatório
    const relatorio = {
        total_campos: todosCampos.size,
        campos_existentes: camposExistentes.size,
        campos_faltantes: camposFaltantes.length,
        campos_com_valores: comValores.length,
        campos_sem_valores: semValores.length,
        campos_faltantes_detalhes: camposFaltantes
    };
    
    fs.writeFileSync('campos-faltantes-analise.json', JSON.stringify(relatorio, null, 2));
    console.log(`\n💾 Relatório salvo em: campos-faltantes-analise.json`);
} else {
    console.log('✅ Todos os campos já existem na tabela!');
}

console.log('\n✅ Análise concluída!\n');

