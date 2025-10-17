# ⚡ Comandos Rápidos - Sincronização Automática

## 🚀 Deploy

```bash
# 1. Deploy da Edge Function
supabase functions deploy sync-hourly-cron

# 2. Listar funções
supabase functions list

# 3. Ver logs em tempo real
supabase functions logs sync-hourly-cron --follow
```

## 🔑 Configurar Secrets (via CLI)

```bash
supabase secrets set VITE_SPRINTHUB_BASE_URL=sprinthub-api-master.sprinthub.app
supabase secrets set VITE_SPRINTHUB_API_TOKEN=9ad36c85-5858-4960-9935-e73c3698dd0c
supabase secrets set VITE_SPRINTHUB_INSTANCE=oficialmed
supabase secrets set SB_URL=https://seu-projeto.supabase.co
supabase secrets set SERVICE_KEY=sua-service-role-key

# Listar secrets
supabase secrets list
```

## 📊 SQL - Monitoramento

### Ver status atual
```sql
SELECT * FROM api.sync_status;
```

### Ver últimas 10 sincronizações
```sql
SELECT 
  started_at,
  completed_at,
  status,
  total_processed,
  total_inserted,
  total_updated,
  total_errors,
  execution_time_seconds
FROM api.sync_control
WHERE job_name = 'sync_hourly_cron'
ORDER BY started_at DESC
LIMIT 10;
```

### Ver cronjob
```sql
SELECT * FROM cron.job WHERE jobname = 'sync-hourly-cron';
```

### Ver últimas execuções do cronjob
```sql
SELECT 
  jobname,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details 
WHERE jobname = 'sync-hourly-cron'
ORDER BY start_time DESC
LIMIT 10;
```

### Estatísticas das últimas 24h
```sql
SELECT 
  DATE_TRUNC('hour', started_at) AS hora,
  COUNT(*) AS total_execucoes,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS sucessos,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS erros,
  AVG(execution_time_seconds)::numeric(10,2) AS tempo_medio_seg,
  SUM(total_processed) AS total_processados,
  SUM(total_inserted) AS total_inseridos,
  SUM(total_updated) AS total_atualizados
FROM api.sync_control
WHERE job_name = 'sync_hourly_cron'
  AND started_at >= NOW() - INTERVAL '24 hours'
GROUP BY hora
ORDER BY hora DESC;
```

## 🛑 Pausar/Reativar

### Pausar cronjob
```sql
SELECT cron.unschedule('sync-hourly-cron');
```

### Reativar cronjob
```sql
SELECT cron.schedule(
  'sync-hourly-cron',
  '45 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-hourly-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## 🧪 Testar Manualmente

### Via curl
```bash
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/sync-hourly-cron' \
  -H 'Authorization: Bearer SUA_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

### Via SQL
```sql
SELECT net.http_post(
  url := 'https://seu-projeto.supabase.co/functions/v1/sync-hourly-cron',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || 'SUA_SERVICE_ROLE_KEY'
  ),
  body := '{}'::jsonb
);
```

## 🧹 Manutenção

### Limpar registros antigos (manter 30 dias)
```sql
DELETE FROM api.sync_control 
WHERE started_at < NOW() - INTERVAL '30 days'
  AND job_name = 'sync_hourly_cron';
```

### Ver tamanho da tabela
```sql
SELECT 
  pg_size_pretty(pg_total_relation_size('api.sync_control')) AS tamanho_total,
  COUNT(*) AS total_registros
FROM api.sync_control;
```

## 🔍 Diagnóstico

### Verificar extensões
```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'http');
```

### Verificar variáveis configuradas
```sql
SHOW app.settings.supabase_url;
SHOW app.settings.service_role_key;
```

### Ver permissões da tabela
```sql
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'api' 
  AND table_name = 'sync_control';
```

### Ver permissões da view
```sql
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'api' 
  AND table_name = 'sync_status';
```

## 📈 Relatórios

### Taxa de sucesso (últimos 7 dias)
```sql
SELECT 
  DATE(started_at) AS dia,
  COUNT(*) AS total_execucoes,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS sucessos,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS erros,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 
    2
  ) AS taxa_sucesso_pct
FROM api.sync_control
WHERE job_name = 'sync_hourly_cron'
  AND started_at >= NOW() - INTERVAL '7 days'
GROUP BY dia
ORDER BY dia DESC;
```

### Média de registros processados por dia
```sql
SELECT 
  DATE(started_at) AS dia,
  COUNT(*) AS execucoes,
  AVG(total_processed)::integer AS media_processados,
  SUM(total_processed) AS total_processados,
  AVG(execution_time_seconds)::numeric(10,2) AS tempo_medio_seg
FROM api.sync_control
WHERE job_name = 'sync_hourly_cron'
  AND started_at >= NOW() - INTERVAL '7 days'
GROUP BY dia
ORDER BY dia DESC;
```

### Ver erros recentes
```sql
SELECT 
  started_at,
  error_message,
  details
FROM api.sync_control
WHERE job_name = 'sync_hourly_cron'
  AND status = 'error'
ORDER BY started_at DESC
LIMIT 10;
```

## 🔄 Forçar Sincronização Manual

### Via frontend
Clique no botão **⚡ SYNC AGORA** no TopMenuBar

### Via API (curl)
```bash
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/sync-hourly-cron' \
  -H 'Authorization: Bearer SUA_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

### Via SQL
```sql
SELECT net.http_post(
  url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-hourly-cron',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
  ),
  body := '{}'::jsonb
);
```

## 📋 Checklist Rápido

- [ ] Edge Function deployada
- [ ] Secrets configuradas (5 secrets)
- [ ] Extensões habilitadas (pg_cron, http)
- [ ] SQL setup executado
- [ ] Variáveis PostgreSQL configuradas
- [ ] Cronjob criado
- [ ] Teste manual executado com sucesso
- [ ] Interface mostra última/próxima sync

## 🆘 Em caso de problemas

1. **Ver logs:** Dashboard → Edge Functions → sync-hourly-cron → Logs
2. **Ver execuções cronjob:** `SELECT * FROM cron.job_run_details`
3. **Ver sincronizações:** `SELECT * FROM api.sync_control`
4. **Testar manualmente:** curl ou SQL acima
5. **Verificar secrets:** `supabase secrets list`

---

**💡 Dica:** Salve este arquivo como favorito para consulta rápida!


