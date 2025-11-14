-- ⏰ CRONJOB PARA SINCRONIZAÇÃO AUTOMÁTICA DE OPORTUNIDADES
-- Este script configura a sincronização automática a cada 30 minutos
-- das oportunidades do SprintHub para o Supabase

-- ================================================================================
-- PASSO 1: HABILITAR EXTENSÕES NECESSÁRIAS
-- ================================================================================

-- Habilitar pg_cron (para agendamento de tarefas)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Habilitar pg_net ou http (para fazer requisições HTTP)
-- No Supabase, usar pg_net que é nativo
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ================================================================================
-- PASSO 2: CRIAR FUNÇÃO PARA CHAMAR A API
-- ================================================================================

CREATE OR REPLACE FUNCTION api.sync_oportunidades_sprinthub()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  response_data jsonb;
  api_url text := 'https://sincro.oficialmed.com.br/oportunidades';
BEGIN
  -- Log de início
  RAISE NOTICE '[%] 🔄 Iniciando sincronização de oportunidades...', 
    NOW()::timestamp(0);

  -- Fazer requisição HTTP usando pg_net
  SELECT net.http_get(
    url := api_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  ) INTO request_id;

  -- Log da requisição
  RAISE NOTICE '[%] 📡 Requisição enviada - ID: %', 
    NOW()::timestamp(0), request_id;

  -- Aguardar resposta (pg_net é assíncrono, então precisamos esperar um pouco)
  -- Em produção, você pode verificar a tabela net.http_request_queue
  PERFORM pg_sleep(1);

  -- Buscar resultado da requisição
  SELECT 
    jsonb_build_object(
      'request_id', request_id,
      'timestamp', NOW(),
      'status', 'processing'
    )
  INTO response_data;

  -- Log de sucesso
  RAISE NOTICE '[%] ✅ Sincronização iniciada com sucesso', 
    NOW()::timestamp(0);

  RETURN response_data;

EXCEPTION WHEN OTHERS THEN
  -- Log de erro
  RAISE WARNING '[%] ❌ Erro na sincronização: %', 
    NOW()::timestamp(0), SQLERRM;
  
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'timestamp', NOW(),
    'status', 'error'
  );
END;
$$;

-- ================================================================================
-- PASSO 3: COMENTÁRIOS E PERMISSÕES
-- ================================================================================

COMMENT ON FUNCTION api.sync_oportunidades_sprinthub() IS 
'Função para sincronizar oportunidades do SprintHub via API externa.
Chamada automaticamente pelo cronjob a cada 30 minutos.
Endpoint: https://sincro.oficialmed.com.br/oportunidades';

-- Garantir que a função pode ser executada pelo cron
GRANT EXECUTE ON FUNCTION api.sync_oportunidades_sprinthub() TO postgres;

-- ================================================================================
-- PASSO 4: CRIAR TABELA DE LOG (OPCIONAL MAS RECOMENDADO)
-- ================================================================================

CREATE TABLE IF NOT EXISTS api.sync_oportunidades_log (
  id bigserial PRIMARY KEY,
  executed_at timestamptz NOT NULL DEFAULT NOW(),
  status text NOT NULL,
  request_id bigint,
  response jsonb,
  error_message text,
  duration_ms integer
);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_sync_oportunidades_log_executed_at 
  ON api.sync_oportunidades_log(executed_at DESC);

-- Comentário na tabela
COMMENT ON TABLE api.sync_oportunidades_log IS 
'Log de execuções do cronjob de sincronização de oportunidades';

-- ================================================================================
-- PASSO 5: FUNÇÃO COM LOG APRIMORADA
-- ================================================================================

CREATE OR REPLACE FUNCTION api.sync_oportunidades_sprinthub_with_log()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  response_data jsonb;
  api_url text := 'https://sincro.oficialmed.com.br/oportunidades';
  start_time timestamptz;
  end_time timestamptz;
  duration_ms integer;
BEGIN
  start_time := clock_timestamp();

  -- Log de início
  RAISE NOTICE '[%] 🔄 Iniciando sincronização de oportunidades...', 
    NOW()::timestamp(0);

  -- Fazer requisição HTTP
  SELECT net.http_get(
    url := api_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  ) INTO request_id;

  end_time := clock_timestamp();
  duration_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::integer;

  -- Construir resposta
  response_data := jsonb_build_object(
    'request_id', request_id,
    'timestamp', NOW(),
    'status', 'success',
    'duration_ms', duration_ms
  );

  -- Inserir log
  INSERT INTO api.sync_oportunidades_log 
    (status, request_id, response, duration_ms)
  VALUES 
    ('success', request_id, response_data, duration_ms);

  -- Log de sucesso
  RAISE NOTICE '[%] ✅ Sincronização iniciada - Duração: %ms', 
    NOW()::timestamp(0), duration_ms;

  RETURN response_data;

EXCEPTION WHEN OTHERS THEN
  end_time := clock_timestamp();
  duration_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::integer;

  -- Inserir log de erro
  INSERT INTO api.sync_oportunidades_log 
    (status, error_message, duration_ms)
  VALUES 
    ('error', SQLERRM, duration_ms);

  -- Log de erro
  RAISE WARNING '[%] ❌ Erro na sincronização: %', 
    NOW()::timestamp(0), SQLERRM;
  
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'timestamp', NOW(),
    'status', 'error',
    'duration_ms', duration_ms
  );
END;
$$;

GRANT EXECUTE ON FUNCTION api.sync_oportunidades_sprinthub_with_log() TO postgres;

-- ================================================================================
-- PASSO 6: AGENDAR EXECUÇÃO AUTOMÁTICA A CADA 30 MINUTOS
-- ================================================================================

-- Remover job anterior se existir
SELECT cron.unschedule('sync-oportunidades-sprinthub');

-- Criar novo job
SELECT cron.schedule(
  'sync-oportunidades-sprinthub',                      -- Nome do job
  '*/30 * * * *',                                       -- A cada 30 minutos
  $$SELECT api.sync_oportunidades_sprinthub_with_log();$$  -- Comando SQL
);

-- ================================================================================
-- PASSO 7: VERIFICAÇÕES
-- ================================================================================

-- Ver todos os cronjobs
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'sync-oportunidades-sprinthub';

-- Ver histórico de execuções (últimas 10)
SELECT 
  job_run_details.jobid,
  job.jobname,
  job_run_details.runid,
  job_run_details.job_pid,
  job_run_details.database,
  job_run_details.username,
  job_run_details.command,
  job_run_details.status,
  job_run_details.return_message,
  job_run_details.start_time,
  job_run_details.end_time
FROM cron.job_run_details
JOIN cron.job ON job_run_details.jobid = job.jobid
WHERE job.jobname = 'sync-oportunidades-sprinthub'
ORDER BY job_run_details.start_time DESC
LIMIT 10;

-- ================================================================================
-- PASSO 8: TESTES MANUAIS
-- ================================================================================

-- Testar função diretamente
SELECT api.sync_oportunidades_sprinthub_with_log();

-- Executar job manualmente (não espera o agendamento)
-- Nota: Isso pode não funcionar em todos os ambientes Supabase
-- SELECT cron.run_job('sync-oportunidades-sprinthub');

-- Ver logs da sincronização
SELECT 
  id,
  executed_at,
  status,
  request_id,
  duration_ms,
  error_message
FROM api.sync_oportunidades_log
ORDER BY executed_at DESC
LIMIT 20;

-- ================================================================================
-- COMANDOS ÚTEIS DE MANUTENÇÃO
-- ================================================================================

-- Pausar o cronjob (desagendar)
-- SELECT cron.unschedule('sync-oportunidades-sprinthub');

-- Mudar frequência para 1 hora
-- SELECT cron.schedule(
--   'sync-oportunidades-sprinthub',
--   '0 * * * *',  -- No minuto 0 de cada hora
--   $$SELECT api.sync_oportunidades_sprinthub_with_log();$$
-- );

-- Mudar frequência para 15 minutos
-- SELECT cron.schedule(
--   'sync-oportunidades-sprinthub',
--   '*/15 * * * *',  -- A cada 15 minutos
--   $$SELECT api.sync_oportunidades_sprinthub_with_log();$$
-- );

-- Limpar logs antigos (manter apenas últimos 30 dias)
-- DELETE FROM api.sync_oportunidades_log 
-- WHERE executed_at < NOW() - INTERVAL '30 days';

-- Ver estatísticas dos últimos 7 dias
-- SELECT 
--   DATE(executed_at) as dia,
--   COUNT(*) as total_execucoes,
--   COUNT(*) FILTER (WHERE status = 'success') as sucessos,
--   COUNT(*) FILTER (WHERE status = 'error') as erros,
--   AVG(duration_ms) as duracao_media_ms,
--   MAX(duration_ms) as duracao_maxima_ms
-- FROM api.sync_oportunidades_log
-- WHERE executed_at > NOW() - INTERVAL '7 days'
-- GROUP BY DATE(executed_at)
-- ORDER BY dia DESC;

-- ================================================================================
-- INFORMAÇÕES IMPORTANTES
-- ================================================================================

/*

📊 FUNIS SINCRONIZADOS:
- Funil 6 (COMERCIAL APUCARANA): ~13.700 oportunidades
- Funil 14 (RECOMPRA): ~3.137 oportunidades

⏱️ TEMPO DE EXECUÇÃO ESPERADO:
- Primeira execução: ~15-20 minutos (todas as oportunidades)
- Execuções subsequentes: ~2-5 minutos (apenas atualizações)

🔄 FREQUÊNCIA:
- Padrão: A cada 30 minutos
- Customizável via cron.schedule()

📊 MONITORAMENTO:
- Logs em: api.sync_oportunidades_log
- Histórico de execuções: cron.job_run_details

🐛 TROUBLESHOOTING:
1. Se o job não executar, verificar:
   - Extension pg_cron está habilitada?
   - Extension pg_net está habilitada?
   - API está respondendo em https://sincro.oficialmed.com.br/oportunidades?

2. Ver erros recentes:
   SELECT * FROM api.sync_oportunidades_log WHERE status = 'error' ORDER BY executed_at DESC LIMIT 10;

3. Testar API manualmente:
   curl https://sincro.oficialmed.com.br/oportunidades

*/

-- ================================================================================
-- FIM DO SCRIPT
-- ================================================================================

RAISE NOTICE '✅ Cronjob de sincronização de oportunidades configurado com sucesso!';
RAISE NOTICE '📊 Job agendado para executar a cada 30 minutos';
RAISE NOTICE '🔍 Monitore os logs em: SELECT * FROM api.sync_oportunidades_log ORDER BY executed_at DESC;';














