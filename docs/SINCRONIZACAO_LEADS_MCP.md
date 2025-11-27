# 🔄 Sincronização de Leads via MCP

## Situação Atual
- **Total de leads no Supabase:** 80.961
- **Última sincronização:** 19/11/2025 16:24:58
- **Leads desatualizados (>7 dias):** 13.028

## Solução Recomendada

A API de sincronização já existe e faz tudo automaticamente:
```
GET https://sincrocrm.oficialmed.com.br/sync/leads
```

Esta API:
1. ✅ Busca todos os IDs do SprintHub
2. ✅ Sincroniza todos os leads (inserir/atualizar)
3. ✅ Remove leads que não existem mais no SprintHub
4. ✅ Garante mesma quantidade entre SprintHub e Supabase

## Execução Manual via MCP (se necessário)

### 1. Verificar quantos leads existem no SprintHub
Execute a API de sincronização e verifique os logs.

### 2. Limpar leads que não existem mais
```sql
-- Primeiro, criar tabela temporária com IDs do SprintHub
-- (Isso deve ser feito pela API de sincronização)

-- Depois, deletar leads que não estão mais no SprintHub
DELETE FROM api.leads
WHERE id NOT IN (
    -- IDs do SprintHub (preencher com dados da API)
    SELECT id FROM temp_sprinthub_lead_ids
);
```

### 3. Sincronizar todos os leads
A API `/sync/leads` já faz isso automaticamente.

## Status
✅ API de sincronização está rodando em background
⏳ Aguardando conclusão da sincronização

