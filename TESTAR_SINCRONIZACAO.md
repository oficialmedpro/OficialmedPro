# 🧪 Como Testar a Sincronização

## ✅ Cronjob Criado com Sucesso!

Vejo que o cronjob foi criado:
- **Nome:** `sync-sprinthub-completo-15m`
- **Schedule:** `*/15 * * * *` (a cada 15 minutos)
- **Status:** ✅ Ativo (toggle verde)
- **Próxima execução:** 03 Nov 2025 15:30:00

---

## 🚀 Testar Manualmente (Sem Esperar 15 Minutos)

### Opção 1: Executar o Cronjob Manualmente no Supabase

Execute no **Supabase SQL Editor**:

```sql
-- Executar manualmente o cronjob
SELECT cron.run_job('sync-sprinthub-completo-15m');
```

Ou executar a função diretamente:

```sql
-- Executar a função diretamente (mesma coisa)
SELECT api.sync_sprinthub_completo();
```

---

### Opção 2: Chamar a API Diretamente via curl

Execute no terminal:

```bash
# Windows PowerShell
Invoke-WebRequest -Uri "https://sincro.oficialmed.com.br/oportunidades/sync/all" -Method GET -UseBasicParsing | Select-Object -ExpandProperty Content

# Ou via curl (se tiver instalado)
curl https://sincro.oficialmed.com.br/oportunidades/sync/all
```

---

## 📊 Verificar se Está Atualizando Corretamente

### Passo 1: Ver Contagens ANTES da Sincronização

Execute no **Supabase SQL Editor**:

```sql
-- Contagem de oportunidades
SELECT COUNT(*) as total_oportunidades 
FROM api.oportunidade_sprint;

-- Contagem de leads
SELECT COUNT(*) as total_leads 
FROM api.leads;

-- Contagem de segmentos
SELECT COUNT(*) as total_segmentos 
FROM api.segmentos;

-- Última sincronização de oportunidades
SELECT 
  MAX(synced_at) as ultima_sync_oportunidades,
  COUNT(*) as total_oportunidades
FROM api.oportunidade_sprint;

-- Última sincronização de leads
SELECT 
  MAX(synced_at) as ultima_sync_leads,
  COUNT(*) as total_leads
FROM api.leads;

-- Última sincronização de segmentos
SELECT 
  MAX(synced_at) as ultima_sync_segmentos,
  COUNT(*) as total_segmentos
FROM api.segmentos;
```

---

### Passo 2: Executar a Sincronização

Execute uma das opções acima para executar manualmente.

---

### Passo 3: Ver Contagens DEPOIS da Sincronização

Aguarde alguns segundos e execute novamente as queries do Passo 1 para comparar.

---

## 🔍 Monitorar a Execução em Tempo Real

### Ver Logs do Cronjob no Supabase

```sql
-- Ver últimas execuções do cronjob
SELECT 
  runid,
  job_pid,
  status,
  return_message,
  start_time,
  end_time,
  CASE 
    WHEN end_time IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (end_time - start_time))
    ELSE NULL 
  END as duration_seconds
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid 
  FROM cron.job 
  WHERE jobname = 'sync-sprinthub-completo-15m'
)
ORDER BY start_time DESC
LIMIT 10;
```

---

### Ver Logs do Container no Portainer

1. Acesse: **Portainer > Services > oportunidades-sync-sprinthub_oportunidades-sync-api**
2. Clique em **Logs**
3. Você verá os logs da execução em tempo real

Ou via SSH:

```bash
docker service logs -f oportunidades-sync-sprinthub_oportunidades-sync-api
```

---

### Verificar Execuções Recentes na API

```sql
-- Ver últimas execuções registradas na tabela sync_runs
SELECT 
  id,
  resource,
  status,
  total_processed,
  total_inserted,
  total_updated,
  total_errors,
  started_at,
  finished_at,
  EXTRACT(EPOCH FROM (finished_at - started_at)) as duration_seconds
FROM api.sync_runs
ORDER BY started_at DESC
LIMIT 20;
```

---

## ✅ Verificar se Dados Estão Sendo Atualizados

### Verificar Novos Registros

```sql
-- Oportunidades sincronizadas nos últimos 5 minutos
SELECT 
  COUNT(*) as novas_oportunidades,
  MAX(synced_at) as ultima_sync
FROM api.oportunidade_sprint
WHERE synced_at > NOW() - INTERVAL '5 minutes';

-- Leads sincronizados nos últimos 5 minutos
SELECT 
  COUNT(*) as novos_leads,
  MAX(synced_at) as ultima_sync
FROM api.leads
WHERE synced_at > NOW() - INTERVAL '5 minutes';

-- Segmentos sincronizados nos últimos 5 minutos
SELECT 
  COUNT(*) as novos_segmentos,
  MAX(synced_at) as ultima_sync
FROM api.segmentos
WHERE synced_at > NOW() - INTERVAL '5 minutes';
```

---

### Verificar Registros Atualizados

```sql
-- Ver oportunidades por funil (última sincronização)
SELECT 
  funil_id,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync,
  MIN(synced_at) as primeira_sync
FROM api.oportunidade_sprint
GROUP BY funil_id
ORDER BY funil_id;

-- Ver últimas 10 oportunidades sincronizadas
SELECT 
  id,
  title,
  funil_id,
  crm_column,
  value,
  synced_at
FROM api.oportunidade_sprint
ORDER BY synced_at DESC
LIMIT 10;
```

---

## 📈 Query Completa de Verificação

Execute esta query completa para ver tudo de uma vez:

```sql
-- Verificação completa de sincronização
SELECT 
  'Oportunidades' as tipo,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync,
  MIN(synced_at) as primeira_sync,
  COUNT(*) FILTER (WHERE synced_at > NOW() - INTERVAL '1 hour') as ultima_hora
FROM api.oportunidade_sprint

UNION ALL

SELECT 
  'Leads' as tipo,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync,
  MIN(synced_at) as primeira_sync,
  COUNT(*) FILTER (WHERE synced_at > NOW() - INTERVAL '1 hour') as ultima_hora
FROM api.leads

UNION ALL

SELECT 
  'Segmentos' as tipo,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync,
  MIN(synced_at) as primeira_sync,
  COUNT(*) FILTER (WHERE synced_at > NOW() - INTERVAL '1 hour') as ultima_hora
FROM api.segmentos

ORDER BY tipo;
```

---

## 🧪 Teste Passo a Passo

### 1. Antes da Execução - Anotar Valores

```sql
-- Execute e anote os valores
SELECT 
  (SELECT COUNT(*) FROM api.oportunidade_sprint) as opo_antes,
  (SELECT COUNT(*) FROM api.leads) as leads_antes,
  (SELECT COUNT(*) FROM api.segmentos) as seg_antes,
  NOW() as timestamp_antes;
```

### 2. Executar Sincronização

```sql
-- Execute manualmente
SELECT api.sync_sprinthub_completo();
```

### 3. Aguardar Execução (30-60 segundos)

### 4. Depois da Execução - Verificar Mudanças

```sql
-- Execute e compare com os valores anteriores
SELECT 
  (SELECT COUNT(*) FROM api.oportunidade_sprint) as opo_depois,
  (SELECT COUNT(*) FROM api.leads) as leads_depois,
  (SELECT COUNT(*) FROM api.segmentos) as seg_depois,
  NOW() as timestamp_depois;

-- Ver últimas sincronizações
SELECT 
  id,
  resource,
  status,
  total_processed,
  total_inserted,
  total_updated,
  total_errors,
  started_at,
  finished_at
FROM api.sync_runs
ORDER BY started_at DESC
LIMIT 3;
```

---

## ✅ Checklist de Teste

- [ ] Cronjob criado e ativo ✅
- [ ] Execução manual testada
- [ ] Contagens antes anotadas
- [ ] Sincronização executada
- [ ] Contagens depois verificadas
- [ ] Logs do cronjob verificados
- [ ] Logs do container verificados
- [ ] Tabela sync_runs verificada
- [ ] Dados atualizados corretamente ✅

---

## 🎯 Resultado Esperado

Após executar a sincronização, você deve ver:

1. **Na tabela `sync_runs`:**
   - 3 registros (um para oportunidades, um para leads, um para segmentos)
   - Status: `success`
   - Valores de `total_processed`, `total_inserted`, `total_updated`

2. **Nos logs do container:**
   - Mensagens de sucesso para cada etapa
   - Tempo de execução de cada etapa

3. **Nas contagens:**
   - Números atualizados (ou mantidos se já estava atualizado)

4. **No cronjob:**
   - Próxima execução atualizada para 15 minutos depois

---

**Pronto para testar!** 🚀






