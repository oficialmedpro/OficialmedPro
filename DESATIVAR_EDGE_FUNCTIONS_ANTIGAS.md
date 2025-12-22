# 🚨 Desativar Edge Functions Antigas - URGENTE

## ⚠️ Problema
Você está excedendo o limite de **2,000,000 invocações** de Edge Functions e já usou **6,722,890** (336% do limite)!

## 📋 Edge Functions Antigas que DEVEM ser Desativadas

### 1️⃣ Edge Functions do SprintHub (ANTIGAS - Não usar mais)

Estas são **versões antigas** que foram substituídas por `webhook-oportunidade-sprint`. **DESATIVE TODAS:**

1. ✅ `sprinthub-webhook` (version 68) - **DESATIVAR**
2. ✅ `sprinthub-webhook-v2` (version 43) - **DESATIVAR**
3. ✅ `sprinthub-webhook-update` (version 36) - **DESATIVAR**

**MOTIVO:** Elas podem estar sendo chamadas por webhooks antigos do SprintHub ou n8n que não foram atualizados.

### 2️⃣ Edge Functions de Segmentos Automáticos (ANTIGAS - Não usar mais)

Estas são **versões antigas** que foram substituídas. **DESATIVE TODAS:**

1. ✅ `sync_tags_segments` (version 45) - **DESATIVAR**
2. ✅ `process-auto-segments` (version 41) - **DESATIVAR**
3. ✅ `process_auto_segments` (version 34) - **DESATIVAR**
4. ✅ `process_auto_segments_v2` (version 30) - **DESATIVAR**
5. ✅ `process_auto_segments_cron` (version 27) - **DESATIVAR**
6. ✅ `process_auto_segments_v3` (version 27) - **DESATIVAR**
7. ✅ `process_auto_segments_v4` (version 27) - **DESATIVAR**

**MOTIVO:** Essas são versões antigas que podem estar sendo chamadas por cron jobs ou webhooks antigos.

### 3️⃣ Edge Functions que DEVEM PERMANECER ATIVAS

✅ **NÃO DESATIVE estas:**

- `webhook-oportunidade-sprint` (version 16) - **ATIVA** (sistema atual)
- `google-ads-api` (version 88) - **ATIVA** (sistema atual)
- `sync-hourly-cron` (version 29) - **ATIVA** (sistema atual)
- `get-melhor-envio-token` (version 10) - **ATIVA**
- `refresh-melhor-envio-token` (version 10) - **ATIVA**
- `get-sprinthub-token` (version 9) - **ATIVA**

## 🔧 Como Desativar Edge Functions no Supabase

1. Acesse: https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb/edge-functions
2. Para cada Edge Function listada acima:
   - Clique no nome da função
   - Vá em "Settings" ou use o menu de 3 pontos
   - Clique em "Delete" ou "Deactivate" (se disponível)
   - Confirme a exclusão/desativação

## ⚠️ IMPORTANTE - Verificar Webhooks do SprintHub e n8n

Antes de desativar, verifique se não há webhooks configurados no SprintHub ou n8n apontando para essas Edge Functions antigas:

### No SprintHub:
1. Verifique todos os webhooks configurados
2. Certifique-se de que TODOS apontam para `webhook-oportunidade-sprint` (não para as versões antigas)
3. Remova ou atualize webhooks que apontam para funções antigas

### No n8n:
1. Verifique todos os workflows que usam Edge Functions
2. Certifique-se de que TODOS usam `webhook-oportunidade-sprint`
3. Remova ou atualize workflows que usam funções antigas

## 🔍 Investigar: Por que `webhook-oportunidade-sprint` está sendo chamada tanto?

A Edge Function `webhook-oportunidade-sprint` está sendo chamada **centenas de vezes em sequência**. Isso pode ser porque:

1. **Webhook do Supabase está disparando para cada UPDATE** na tabela `oportunidade_sprint`
2. **Múltiplos webhooks do SprintHub/n8n** estão enviando atualizações
3. **Sincronizações em massa** estão atualizando muitas oportunidades de uma vez

### Solução Temporária:
Se a Edge Function `webhook-oportunidade-sprint` não está fazendo nada crítico (apenas logging), considere:

1. **Desabilitar o webhook do Supabase** temporariamente:
   - Dashboard → Database → Webhooks
   - Encontre o webhook para `oportunidade_sprint`
   - Desative temporariamente até resolver o problema

2. **Ou mover a lógica para o n8n** (se possível) para reduzir invocações

## 📊 Estatísticas Atuais

- **Limite:** 2,000,000 invocações
- **Uso Atual:** 6,722,890 invocações (336%)
- **Grace Period:** Até 26 Dez, 2025
- **Após grace period:** Requisições retornarão 402 status code

## ✅ Checklist de Ações

- [ ] Desativar `sprinthub-webhook`
- [ ] Desativar `sprinthub-webhook-v2`
- [ ] Desativar `sprinthub-webhook-update`
- [ ] Desativar `sync_tags_segments`
- [ ] Desativar `process-auto-segments`
- [ ] Desativar `process_auto_segments`
- [ ] Desativar `process_auto_segments_v2`
- [ ] Desativar `process_auto_segments_cron`
- [ ] Desativar `process_auto_segments_v3`
- [ ] Desativar `process_auto_segments_v4`
- [ ] Verificar webhooks do SprintHub
- [ ] Verificar workflows do n8n
- [ ] Investigar uso excessivo de `webhook-oportunidade-sprint`

