-- ========================================
-- CONFIGURAÇÃO DE CRON JOB NO SUPABASE
-- ========================================

-- 1. Habilitar extensão pg_cron (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Criar tabela para controle de execução
CREATE TABLE IF NOT EXISTS public.sync_segments_control (
  id SERIAL PRIMARY KEY,
  segment_id INTEGER NOT NULL,
  last_execution TIMESTAMP WITH TIME ZONE,
  next_execution TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- active, paused, error
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserir segmentos para monitoramento (exemplo: segmento 123)
INSERT INTO public.sync_segments_control (segment_id, next_execution)
VALUES (123, NOW() + INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- 4. Função para executar sincronização via Edge Function
CREATE OR REPLACE FUNCTION sync_segment_leads_via_edge_function()
RETURNS void AS $$
DECLARE
  segment_record RECORD;
  response JSONB;
  request_body JSONB;
BEGIN
  -- Buscar segmentos que precisam ser sincronizados
  FOR segment_record IN 
    SELECT segment_id 
    FROM public.sync_segments_control 
    WHERE status = 'active' 
    AND (next_execution IS NULL OR next_execution <= NOW())
  LOOP
    RAISE NOTICE 'Iniciando sincronização do segmento %', segment_record.segment_id;
    
    -- Preparar corpo da requisição
    request_body := jsonb_build_object('segmentId', segment_record.segment_id);
    
    -- Fazer requisição para a Edge Function
    -- NOTA: Você precisa substituir 'YOUR_PROJECT_REF' pela referência real do seu projeto
    SELECT content INTO response
    FROM http((
      'POST',
      'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-segment-leads',
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
      ],
      'application/json',
      request_body::text
    ));
    
    -- Atualizar controle de execução
    UPDATE public.sync_segments_control 
    SET 
      last_execution = NOW(),
      next_execution = NOW() + INTERVAL '1 day',
      updated_at = NOW()
    WHERE segment_id = segment_record.segment_id;
    
    RAISE NOTICE 'Sincronização do segmento % concluída', segment_record.segment_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Agendar execução diária às 06:00 (ajuste conforme necessário)
-- NOTA: Você precisa substituir 'YOUR_PROJECT_REF' pela referência real do seu projeto
SELECT cron.schedule(
  'sync-segments-daily',
  '0 6 * * *', -- Todos os dias às 06:00
  'SELECT sync_segment_leads_via_edge_function();'
);

-- 6. Verificar jobs agendados
SELECT * FROM cron.job;

-- 7. Verificar execuções recentes
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- ========================================
-- COMANDOS ÚTEIS PARA GERENCIAMENTO
-- ========================================

-- Pausar um job específico
-- SELECT cron.unschedule('sync-segments-daily');

-- Remover job
-- SELECT cron.unschedule('sync-segments-daily');

-- Executar manualmente (para teste)
-- SELECT sync_segment_leads_via_edge_function();

-- Ver status dos segmentos
-- SELECT * FROM public.sync_segments_control;

-- Pausar sincronização de um segmento específico
-- UPDATE public.sync_segments_control SET status = 'paused' WHERE segment_id = 123;

-- Reativar sincronização de um segmento específico
-- UPDATE public.sync_segments_control SET status = 'active' WHERE segment_id = 123;

-- ========================================
-- CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
-- ========================================

-- Configurar service role key para uso nas funções
-- ALTER SYSTEM SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
-- SELECT pg_reload_conf();

-- ========================================
-- MONITORAMENTO E LOGS
-- ========================================

-- Criar tabela para logs de sincronização
CREATE TABLE IF NOT EXISTS public.sync_segments_logs (
  id SERIAL PRIMARY KEY,
  segment_id INTEGER NOT NULL,
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL, -- success, error
  message TEXT,
  stats JSONB, -- estatísticas da sincronização
  duration_seconds NUMERIC,
  success_rate NUMERIC
);

-- Função para logar execução
CREATE OR REPLACE FUNCTION log_sync_execution(
  p_segment_id INTEGER,
  p_status TEXT,
  p_message TEXT,
  p_stats JSONB DEFAULT NULL,
  p_duration_seconds NUMERIC DEFAULT NULL,
  p_success_rate NUMERIC DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.sync_segments_logs (
    segment_id, status, message, stats, duration_seconds, success_rate
  ) VALUES (
    p_segment_id, p_status, p_message, p_stats, p_duration_seconds, p_success_rate
  );
END;
$$ LANGUAGE plpgsql;



