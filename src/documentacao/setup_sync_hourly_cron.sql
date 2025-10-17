-- ============================================================================
-- CONFIGURAÇÃO DE SINCRONIZAÇÃO HORÁRIA AUTOMÁTICA
-- ============================================================================
-- Este arquivo cria a infraestrutura necessária para sincronização automática
-- via cronjob no Supabase, executando às :45 de cada hora (00:45, 01:45, etc)
-- ============================================================================

-- 1. CRIAR TABELA DE CONTROLE DE SINCRONIZAÇÃO (schema api)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api.sync_control (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
  total_processed INTEGER DEFAULT 0,
  total_inserted INTEGER DEFAULT 0,
  total_updated INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  execution_time_seconds NUMERIC(10,2),
  error_message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sync_control_job_name ON api.sync_control(job_name);
CREATE INDEX IF NOT EXISTS idx_sync_control_started_at ON api.sync_control(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_control_status ON api.sync_control(status);

-- Comentários
COMMENT ON TABLE api.sync_control IS 'Controle de execuções de sincronização automática';
COMMENT ON COLUMN api.sync_control.job_name IS 'Nome do job (ex: sync_hourly_cron)';
COMMENT ON COLUMN api.sync_control.started_at IS 'Timestamp de início da execução';
COMMENT ON COLUMN api.sync_control.completed_at IS 'Timestamp de conclusão da execução';
COMMENT ON COLUMN api.sync_control.status IS 'Status da execução: running, success, error';
COMMENT ON COLUMN api.sync_control.total_processed IS 'Total de registros processados';
COMMENT ON COLUMN api.sync_control.total_inserted IS 'Total de registros inseridos';
COMMENT ON COLUMN api.sync_control.total_updated IS 'Total de registros atualizados';
COMMENT ON COLUMN api.sync_control.total_errors IS 'Total de erros durante execução';
COMMENT ON COLUMN api.sync_control.execution_time_seconds IS 'Tempo de execução em segundos';
COMMENT ON COLUMN api.sync_control.error_message IS 'Mensagem de erro (se houver)';
COMMENT ON COLUMN api.sync_control.details IS 'Detalhes adicionais em JSON';

-- ============================================================================
-- 2. CRIAR VIEW PARA ÚLTIMA SINCRONIZAÇÃO E PRÓXIMA EXECUÇÃO
-- ============================================================================

CREATE OR REPLACE VIEW api.sync_status AS
SELECT 
  sc.started_at AS ultima_sincronizacao,
  sc.completed_at AS finalizada_em,
  sc.status,
  sc.total_processed,
  sc.total_inserted,
  sc.total_updated,
  sc.total_errors,
  sc.execution_time_seconds,
  -- Calcular próxima execução (sempre 1 hora após a última, ajustado para :45)
  CASE 
    WHEN sc.completed_at IS NOT NULL THEN
      -- Pegar a hora seguinte e ajustar para :45
      DATE_TRUNC('hour', sc.completed_at + INTERVAL '1 hour') + INTERVAL '45 minutes'
    ELSE
      -- Se ainda está rodando, calcular baseado no started_at
      DATE_TRUNC('hour', sc.started_at + INTERVAL '1 hour') + INTERVAL '45 minutes'
  END AS proxima_sincronizacao,
  sc.details,
  sc.created_at
FROM api.sync_control sc
WHERE sc.job_name = 'sync_hourly_cron'
ORDER BY sc.started_at DESC
LIMIT 1;

COMMENT ON VIEW api.sync_status IS 'Status da última sincronização e cálculo da próxima execução';

-- ============================================================================
-- 3. CRIAR FUNÇÃO PARA INVOCAR A EDGE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION api.invoke_sync_hourly()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Invocar a Edge Function
  SELECT content::json INTO result
  FROM http((
    'POST',
    current_setting('app.settings.supabase_url') || '/functions/v1/sync-hourly-cron',
    ARRAY[
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  )::http_request);
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

COMMENT ON FUNCTION api.invoke_sync_hourly() IS 'Invoca a Edge Function de sincronização horária';

-- ============================================================================
-- 4. CRIAR CRONJOB NO SUPABASE (via pg_cron)
-- ============================================================================
-- NOTA: Este comando deve ser executado por um superuser ou via painel do Supabase
-- Execute manualmente ou via SQL Editor do Supabase com privilégios adequados

-- Remover job existente se houver
SELECT cron.unschedule('sync-hourly-cron');

-- Criar novo job que executa às :45 de cada hora
-- Formato cron: minuto hora dia mês dia_da_semana
-- 45 * * * * = às 45 minutos de cada hora (00:45, 01:45, 02:45, etc)
SELECT cron.schedule(
  'sync-hourly-cron',                    -- nome do job
  '45 * * * *',                          -- executar às :45 de cada hora
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

-- ============================================================================
-- 5. CONFIGURAR VARIÁVEIS DE AMBIENTE (via Dashboard do Supabase)
-- ============================================================================
-- Execute estes comandos para configurar as variáveis necessárias:

-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://seu-projeto.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'sua-service-role-key';

-- OU configure via Dashboard:
-- Settings > API > URL e Service Role Key

-- ============================================================================
-- 6. PERMISSÕES
-- ============================================================================

-- Garantir que a tabela seja acessível via REST API
GRANT SELECT, INSERT, UPDATE ON api.sync_control TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE api.sync_control_id_seq TO anon, authenticated;

-- View de status também deve ser acessível
GRANT SELECT ON api.sync_status TO anon, authenticated;

-- ============================================================================
-- 7. VERIFICAÇÕES E TESTES
-- ============================================================================

-- Verificar se o cronjob foi criado
SELECT * FROM cron.job WHERE jobname = 'sync-hourly-cron';

-- Ver últimas execuções do cronjob
SELECT 
  job_id,
  jobname,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details 
WHERE jobname = 'sync-hourly-cron'
ORDER BY start_time DESC
LIMIT 10;

-- Ver últimas sincronizações registradas
SELECT 
  job_name,
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

-- Ver status atual (última sincronização e próxima)
SELECT * FROM api.sync_status;

-- ============================================================================
-- 8. TESTAR MANUALMENTE A EDGE FUNCTION
-- ============================================================================
-- Você pode testar a Edge Function manualmente:

/*
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/sync-hourly-cron' \
  -H 'Authorization: Bearer SUA_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
*/

-- Ou via SQL:
-- SELECT api.invoke_sync_hourly();

-- ============================================================================
-- 9. MONITORAMENTO E MANUTENÇÃO
-- ============================================================================

-- Query para ver estatísticas das últimas 24 horas
SELECT 
  DATE_TRUNC('hour', started_at) AS hora,
  COUNT(*) AS total_execucoes,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS sucessos,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS erros,
  AVG(execution_time_seconds) AS tempo_medio_segundos,
  SUM(total_processed) AS total_registros_processados,
  SUM(total_inserted) AS total_registros_inseridos,
  SUM(total_updated) AS total_registros_atualizados
FROM api.sync_control
WHERE job_name = 'sync_hourly_cron'
  AND started_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', started_at)
ORDER BY hora DESC;

-- Limpar registros antigos (manter últimos 30 dias)
-- DELETE FROM api.sync_control 
-- WHERE started_at < NOW() - INTERVAL '30 days'
--   AND job_name = 'sync_hourly_cron';

-- ============================================================================
-- 10. DESABILITAR/HABILITAR O CRONJOB
-- ============================================================================

-- Para desabilitar temporariamente:
-- SELECT cron.unschedule('sync-hourly-cron');

-- Para reabilitar (executar o SELECT cron.schedule acima novamente)

-- ============================================================================
-- FIM DA CONFIGURAÇÃO
-- ============================================================================



