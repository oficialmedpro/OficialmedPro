-- 🧪 SCRIPT DE TESTE - Sincronização Completa
-- Execute este script no Supabase SQL Editor para testar a sincronização

-- ============================================================
-- PASSO 1: Verificar Contagens ANTES da Sincronização
-- ============================================================
SELECT 
  'ANTES DA SINCRONIZAÇÃO' as etapa,
  NOW() as timestamp;

-- Contagens atuais
SELECT 
  'Oportunidades' as tipo,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync
FROM api.oportunidade_sprint

UNION ALL

SELECT 
  'Leads' as tipo,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync
FROM api.leads

UNION ALL

SELECT 
  'Segmentos' as tipo,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync
FROM api.segmentos

ORDER BY tipo;

-- Última execução do cronjob (se houver)
SELECT 
  'Última execução do cronjob' as info,
  runid,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid 
  FROM cron.job 
  WHERE jobname = 'sync-sprinthub-completo-15m'
)
ORDER BY start_time DESC
LIMIT 1;

-- ============================================================
-- PASSO 2: Executar Sincronização Manual
-- ============================================================
SELECT 
  'EXECUTANDO SINCRONIZAÇÃO...' as etapa,
  NOW() as timestamp_inicio;

-- Executar a função (esta linha pode demorar alguns minutos)
SELECT api.sync_sprinthub_completo();

-- ============================================================
-- PASSO 3: Verificar Execução do Cronjob
-- ============================================================
SELECT 
  'Verificando execução do cronjob' as etapa,
  runid,
  status,
  start_time,
  end_time,
  return_message,
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
LIMIT 1;

-- ============================================================
-- PASSO 4: Verificar Registros na Tabela sync_runs
-- ============================================================
SELECT 
  'Últimas execuções registradas' as info,
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
LIMIT 5;

-- ============================================================
-- PASSO 5: Verificar Contagens DEPOIS da Sincronização
-- ============================================================
SELECT 
  'DEPOIS DA SINCRONIZAÇÃO' as etapa,
  NOW() as timestamp;

-- Contagens atualizadas
SELECT 
  'Oportunidades' as tipo,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync
FROM api.oportunidade_sprint

UNION ALL

SELECT 
  'Leads' as tipo,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync
FROM api.leads

UNION ALL

SELECT 
  'Segmentos' as tipo,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync
FROM api.segmentos

ORDER BY tipo;

-- ============================================================
-- PASSO 6: Verificar Dados Sincronizados Recentemente
-- ============================================================
SELECT 
  'Dados sincronizados nos últimos 5 minutos' as info,
  'Oportunidades' as tipo,
  COUNT(*) as total
FROM api.oportunidade_sprint
WHERE synced_at > NOW() - INTERVAL '5 minutes'

UNION ALL

SELECT 
  '',
  'Leads',
  COUNT(*)
FROM api.leads
WHERE synced_at > NOW() - INTERVAL '5 minutes'

UNION ALL

SELECT 
  '',
  'Segmentos',
  COUNT(*)
FROM api.segmentos
WHERE synced_at > NOW() - INTERVAL '5 minutes';

-- ============================================================
-- PASSO 7: Resumo Completo
-- ============================================================
SELECT 
  'RESUMO COMPLETO' as info;

-- Resumo de cada tipo
SELECT 
  'Oportunidades' as tipo,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync,
  MIN(synced_at) as primeira_sync,
  COUNT(*) FILTER (WHERE synced_at > NOW() - INTERVAL '1 hour') as ultima_hora
FROM api.oportunidade_sprint

UNION ALL

SELECT 
  'Leads',
  COUNT(*),
  MAX(synced_at),
  MIN(synced_at),
  COUNT(*) FILTER (WHERE synced_at > NOW() - INTERVAL '1 hour')
FROM api.leads

UNION ALL

SELECT 
  'Segmentos',
  COUNT(*),
  MAX(synced_at),
  MIN(synced_at),
  COUNT(*) FILTER (WHERE synced_at > NOW() - INTERVAL '1 hour')
FROM api.segmentos

ORDER BY tipo;

-- ============================================================
-- INSTRUÇÕES:
-- ============================================================
-- 1. Execute este script completo no Supabase SQL Editor
-- 2. Observe os resultados de cada passo
-- 3. Compare as contagens ANTES e DEPOIS
-- 4. Verifique os logs do cronjob
-- 5. Verifique os registros na tabela sync_runs
-- 
-- Se tudo estiver correto, você verá:
-- ✅ Contagens atualizadas
-- ✅ Timestamps de synced_at atualizados
-- ✅ Registros na tabela sync_runs
-- ✅ Logs do cronjob com status 'success'














