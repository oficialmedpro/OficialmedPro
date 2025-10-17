-- ========================================
-- ATUALIZAR CRON JOB PARA CHAMAR FRONTEND
-- ========================================

-- 1. Deletar cron jobs antigos
SELECT cron.unschedule('process-auto-segments');
SELECT cron.unschedule('process_auto_segments_v2');
SELECT cron.unschedule('process_auto_segments_v3');
SELECT cron.unschedule('process_auto_segments_v4');

-- 2. Criar novo cron job que chama o endpoint do frontend
-- Este endpoint processa 100 leads por vez com delay de 60s entre segmentos
SELECT cron.schedule(
  'process-segmentos-lote', -- Nome do job
  '0 8,10,12,14,16,18,20 * * *', -- Executa às 8h, 10h, 12h, 14h, 16h, 18h, 20h
  $$
  SELECT net.http_post(
    'https://bi.oficialmed.com.br/api/processar-segmentos-lote',
    headers => '{"Content-Type": "application/json"}'::jsonb,
    body => '{}'::jsonb
  );
  $$
);

-- 3. Verificar cron jobs ativos
SELECT 
  jobname,
  schedule,
  command,
  active,
  last_run,
  next_run
FROM cron.job 
WHERE jobname LIKE '%segment%'
ORDER BY jobname;
