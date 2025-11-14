-- ============================================================
-- VERIFICAÇÃO DA SINCRONIZAÇÃO - EXECUTAR APÓS 30 MINUTOS
-- ============================================================
-- Execute este script no Supabase SQL Editor após 30 minutos
-- para verificar se a sincronização funcionou corretamente

-- ============================================================
-- 1. VERIFICAR LOGS DE SINCRONIZAÇÃO
-- ============================================================
SELECT 
  id,
  resource,
  status,
  started_at,
  finished_at,
  total_processed,
  total_inserted,
  total_updated,
  total_errors,
  EXTRACT(EPOCH FROM (finished_at - started_at))::int as duration_seconds,
  notes,
  details
FROM api.sync_runs
ORDER BY started_at DESC
LIMIT 10;

-- ============================================================
-- 2. VERIFICAR CONTAGENS ATUALIZADAS
-- ============================================================
SELECT 
  'Oportunidades' as tipo,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync,
  COUNT(*) FILTER (WHERE synced_at > NOW() - INTERVAL '1 hour') as atualizadas_ultima_hora
FROM api.oportunidade_sprint
UNION ALL
SELECT 
  'Leads',
  COUNT(*),
  MAX(synced_at),
  COUNT(*) FILTER (WHERE synced_at > NOW() - INTERVAL '1 hour')
FROM api.leads
UNION ALL
SELECT 
  'Segmentos',
  COUNT(*),
  MAX(create_date),
  COUNT(*) FILTER (WHERE create_date > NOW() - INTERVAL '1 hour')
FROM api.segmento
ORDER BY tipo;

-- ============================================================
-- 3. VERIFICAR ÚLTIMAS SINCRONIZAÇÕES POR TIPO
-- ============================================================
SELECT 
  resource,
  status,
  COUNT(*) as total_execucoes,
  MAX(started_at) as ultima_execucao,
  SUM(total_processed) as total_processado,
  SUM(total_inserted) as total_inserido,
  SUM(total_updated) as total_atualizado,
  SUM(total_errors) as total_erros
FROM api.sync_runs
WHERE started_at > NOW() - INTERVAL '1 hour'
GROUP BY resource, status
ORDER BY ultima_execucao DESC;

-- ============================================================
-- 4. VERIFICAR SE HOUVE ERROS RECENTES
-- ============================================================
SELECT 
  id,
  resource,
  status,
  started_at,
  total_errors,
  notes,
  details
FROM api.sync_runs
WHERE started_at > NOW() - INTERVAL '1 hour'
  AND (status = 'error' OR total_errors > 0)
ORDER BY started_at DESC;

-- ============================================================
-- 5. VERIFICAR STATUS DO CRONJOB
-- ============================================================
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active,
  jobname || ' - ' || 
  CASE WHEN active THEN 'ATIVO ✅' ELSE 'INATIVO ❌' END as status_descricao
FROM cron.job 
WHERE jobname = 'sync-sprinthub-completo-15min';

-- ============================================================
-- 6. VERIFICAR ÚLTIMAS EXECUÇÕES DO CRONJOB
-- ============================================================
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-sprinthub-completo-15min')
ORDER BY start_time DESC
LIMIT 5;

-- ============================================================
-- RESUMO DO QUE VERIFICAR:
-- ============================================================
-- ✅ 1. Deve haver logs de sincronização recentes (última hora)
-- ✅ 2. Contagens devem ter aumentado ou ter novos registros
-- ✅ 3. Última sync deve ser recente (últimos 30-60 minutos)
-- ✅ 4. Não deve haver erros (status = 'error' ou total_errors > 0)
-- ✅ 5. Cronjob deve estar ativo (active = true)
-- ✅ 6. Últimas execuções do cronjob devem estar com status 'succeeded'











