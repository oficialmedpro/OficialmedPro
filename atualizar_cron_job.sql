-- ==========================================
-- ATUALIZAR CRON JOB PARA EDGE FUNCTION V2
-- ==========================================

-- 1. Desativar o cron job antigo
UPDATE cron.job 
SET active = false
WHERE jobname = 'process_auto_segments';

-- 2. Criar novo cron job com Edge Function V2
INSERT INTO cron.job (jobname, schedule, command, active)
VALUES (
    'process_auto_segments_v2',
    '*/30 * * * *',  -- A cada 30 minutos
    '
    SELECT net.http_get(
        ''https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/process_auto_segments_v2'',
        headers => ''{"Authorization": "Bearer sb_secret_alcgQVSO5zQ5hLtRunyRlg_N9GymGor"}''::jsonb
    );
    ',
    true
);

-- 3. Verificar se foi criado corretamente
SELECT 
    jobname,
    schedule,
    command,
    active
FROM cron.job 
WHERE jobname LIKE '%segment%';
