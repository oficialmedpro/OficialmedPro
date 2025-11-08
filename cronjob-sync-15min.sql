-- ⏰ CRONJOB SUPABASE - Sincronização Completa a cada 15 minutos
-- Executa: Oportunidades → Leads → Segmentos

-- ============================================================
-- PASSO 1: Habilitar Extensão pg_cron
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- PASSO 2: Criar Função para Chamar a API
-- ============================================================
CREATE OR REPLACE FUNCTION api.sync_sprinthub_completo()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status INTEGER;
  response_body TEXT;
  response_content JSONB;
BEGIN
  -- Chamar API de sincronização completa (/sync/all)
  -- Este endpoint executa: oportunidades → leads → segmentos
  SELECT 
    status, 
    content INTO response_status, response_body
  FROM http_get('https://sincro.oficialmed.com.br/oportunidades/sync/all');
  
  -- Tentar parsear como JSON para verificar mensagem
  BEGIN
    response_content := response_body::jsonb;
  EXCEPTION WHEN OTHERS THEN
    response_content := NULL;
  END;
  
  -- Log do resultado
  IF response_status = 200 THEN
    -- Verificar se está em execução ou completou
    IF response_content->>'message' = 'Execução já em andamento' THEN
      -- Se ainda está rodando, apenas loga (não é erro)
      RAISE NOTICE '[%] Sincronização já em execução, ignorando nova chamada', 
        NOW()::timestamp;
    ELSE
      -- Execução iniciada ou completada com sucesso
      RAISE NOTICE '[%] Sincronização executada com sucesso - Status: %, Response: %', 
        NOW()::timestamp, response_status, 
        SUBSTRING(response_body, 1, 500); -- Limitar tamanho do log
    END IF;
  ELSE
    -- Erro HTTP
    RAISE WARNING '[%] Erro na sincronização - Status: %, Response: %', 
      NOW()::timestamp, response_status, 
      SUBSTRING(response_body, 1, 500);
  END IF;
END;
$$;

-- ============================================================
-- PASSO 3: Remover Job Anterior se Existir
-- ============================================================
DO $$
BEGIN
  -- Tentar remover job anterior (se existir)
  BEGIN
    PERFORM cron.unschedule('sync-sprinthub-completo-15min');
  EXCEPTION WHEN OTHERS THEN
    -- Job não existe, continuar normalmente
    NULL;
  END;
END $$;

-- ============================================================
-- PASSO 4: Agendar Execução a Cada 15 Minutos
-- ============================================================
-- Cronograma: */15 * * * * = 0, 15, 30, 45 de cada hora
SELECT cron.schedule(
  'sync-sprinthub-completo-15min',           -- nome do job
  '*/15 * * * *',                             -- a cada 15 minutos
  'SELECT api.sync_sprinthub_completo();'     -- função a executar
);

-- ============================================================
-- PASSO 5: Verificar se o Job Foi Criado
-- ============================================================
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname || ' - ' || 
  CASE WHEN active THEN 'ATIVO ✅' ELSE 'INATIVO ❌' END as status_descricao
FROM cron.job 
WHERE jobname = 'sync-sprinthub-completo-15min';

-- ============================================================
-- INSTRUÇÕES DE USO
-- ============================================================
-- 
-- 1. ✅ Este script cria o cronjob que executa a cada 15 minutos
-- 2. ✅ A API tem proteção: se ainda estiver rodando, retorna "Execução já em andamento"
-- 3. ✅ Nenhuma execução simultânea será iniciada
-- 
-- COMANDOS ÚTEIS:
-- 
-- Testar execução manual:
--   SELECT api.sync_sprinthub_completo();
-- 
-- Ver histórico de execuções:
--   SELECT * FROM cron.job_run_details 
--   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-sprinthub-completo-15min')
--   ORDER BY start_time DESC LIMIT 10;
-- 
-- Desabilitar temporariamente:
--   UPDATE cron.job SET active = false WHERE jobname = 'sync-sprinthub-completo-15min';
-- 
-- Reabilitar:
--   UPDATE cron.job SET active = true WHERE jobname = 'sync-sprinthub-completo-15min';
-- 
-- Remover completamente:
--   SELECT cron.unschedule('sync-sprinthub-completo-15min');
--






