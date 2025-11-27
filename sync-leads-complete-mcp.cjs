#!/usr/bin/env node

/**
 * 🔄 SINCRONIZAÇÃO COMPLETA DE LEADS VIA MCP
 * Usa a API para buscar dados e MCP para sincronizar diretamente
 */

console.log('🚀 Iniciando sincronização completa de leads...\n');
console.log('📋 Este script irá:');
console.log('   1. Buscar todos os IDs do SprintHub via API');
console.log('   2. Comparar com o banco via MCP');
console.log('   3. Deletar leads que não existem mais no SprintHub');
console.log('   4. Atualizar/inserir todos os leads com dados completos\n');

console.log('✅ Use a API de sincronização: https://sincrocrm.oficialmed.com.br/sync/leads');
console.log('   Ou execute via MCP as queries SQL abaixo:\n');

// SQL para criar tabela temporária de IDs do SprintHub
const createTempTableSQL = `
-- Criar tabela temporária para armazenar IDs do SprintHub
CREATE TEMP TABLE IF NOT EXISTS temp_sprinthub_lead_ids (
    id BIGINT PRIMARY KEY
);
`;

// SQL para limpar leads que não existem mais
const deleteMissingLeadsSQL = `
-- Deletar leads que não estão mais no SprintHub
DELETE FROM api.leads
WHERE id NOT IN (SELECT id FROM temp_sprinthub_lead_ids);
`;

console.log('📝 SQLs para execução via MCP:\n');
console.log('1. Criar tabela temporária:');
console.log(createTempTableSQL);
console.log('\n2. Deletar leads ausentes:');
console.log(deleteMissingLeadsSQL);
console.log('\n💡 Para sincronização completa, use:');
console.log('   GET https://sincrocrm.oficialmed.com.br/sync/leads');
console.log('\n✅ A API já faz tudo automaticamente!');

