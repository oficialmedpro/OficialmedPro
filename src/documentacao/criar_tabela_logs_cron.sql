-- =====================================================
-- CRIAÇÃO DA TABELA DE LOGS DOS CRON JOBS
-- =====================================================

-- 1. Tabela para registrar execuções dos cron jobs
CREATE TABLE IF NOT EXISTS api.cron_job_logs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'error')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    message TEXT,
    details JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_name ON api.cron_job_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_start_time ON api.cron_job_logs(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_status ON api.cron_job_logs(status);

-- 3. Comentários
COMMENT ON TABLE api.cron_job_logs IS 'Logs de execução dos cron jobs para monitoramento';
COMMENT ON COLUMN api.cron_job_logs.job_name IS 'Nome do job (ex: process_auto_segments, sync_tags_segments)';
COMMENT ON COLUMN api.cron_job_logs.status IS 'Status da execução: running, success, error';
COMMENT ON COLUMN api.cron_job_logs.duration_seconds IS 'Duração da execução em segundos';
COMMENT ON COLUMN api.cron_job_logs.details IS 'Detalhes da execução em formato JSON';

-- 4. RLS (Row Level Security)
ALTER TABLE api.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
CREATE POLICY "Todos podem ver logs de cron jobs" ON api.cron_job_logs
    FOR SELECT USING (true);

CREATE POLICY "Apenas service_role pode inserir logs" ON api.cron_job_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Apenas service_role pode atualizar logs" ON api.cron_job_logs
    FOR UPDATE USING (auth.role() = 'service_role');

-- 6. Permissões
GRANT ALL ON api.cron_job_logs TO service_role;
GRANT SELECT ON api.cron_job_logs TO authenticated;
GRANT SELECT ON api.cron_job_logs TO anon;

-- 7. Permissões para sequência
GRANT USAGE, SELECT ON SEQUENCE api.cron_job_logs_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE api.cron_job_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE api.cron_job_logs_id_seq TO anon;

-- 8. Inserir alguns logs de exemplo (opcional)
-- INSERT INTO api.cron_job_logs (job_name, status, start_time, end_time, duration_seconds, message) VALUES
-- ('process_auto_segments', 'success', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour' + INTERVAL '30 seconds', 30, 'Processados 2 segmentos automáticos'),
-- ('sync_tags_segments', 'success', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '15 seconds', 15, 'Sincronizados 5 tags e 12 segmentos'),
-- ('process_auto_segments', 'error', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes' + INTERVAL '5 seconds', 5, 'Erro na conexão com SprintHub');

-- =====================================================
-- VIEW PARA MONITORAMENTO FÁCIL
-- =====================================================

CREATE OR REPLACE VIEW api.vw_cron_job_status AS
SELECT 
    job_name,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_executions,
    COUNT(CASE WHEN status = 'running' THEN 1 END) as running_executions,
    ROUND(
        (COUNT(CASE WHEN status = 'success' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    ) as success_rate_percent,
    MAX(start_time) as last_execution,
    AVG(duration_seconds) as avg_duration_seconds,
    MAX(CASE WHEN status = 'error' THEN error_message END) as last_error
FROM api.cron_job_logs
WHERE start_time >= NOW() - INTERVAL '7 days' -- Últimos 7 dias
GROUP BY job_name
ORDER BY job_name;

-- Permissões para a view
GRANT SELECT ON api.vw_cron_job_status TO service_role;
GRANT SELECT ON api.vw_cron_job_status TO authenticated;
GRANT SELECT ON api.vw_cron_job_status TO anon;

COMMENT ON VIEW api.vw_cron_job_status IS 'View para monitoramento rápido do status dos cron jobs';

-- =====================================================
-- FUNÇÃO PARA REGISTRAR INÍCIO DE JOB
-- =====================================================

CREATE OR REPLACE FUNCTION api.log_cron_job_start(
    p_job_name VARCHAR(100),
    p_message TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_log_id INTEGER;
BEGIN
    INSERT INTO api.cron_job_logs (job_name, status, start_time, message)
    VALUES (p_job_name, 'running', NOW(), p_message)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA REGISTRAR FIM DE JOB (SUCESSO)
-- =====================================================

CREATE OR REPLACE FUNCTION api.log_cron_job_success(
    p_log_id INTEGER,
    p_message TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_duration INTEGER;
BEGIN
    UPDATE api.cron_job_logs 
    SET 
        status = 'success',
        end_time = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER,
        message = COALESCE(p_message, message),
        details = p_details
    WHERE id = p_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA REGISTRAR FIM DE JOB (ERRO)
-- =====================================================

CREATE OR REPLACE FUNCTION api.log_cron_job_error(
    p_log_id INTEGER,
    p_error_message TEXT,
    p_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_duration INTEGER;
BEGIN
    UPDATE api.cron_job_logs 
    SET 
        status = 'error',
        end_time = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER,
        error_message = p_error_message,
        details = p_details
    WHERE id = p_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões para as funções
GRANT EXECUTE ON FUNCTION api.log_cron_job_start TO service_role;
GRANT EXECUTE ON FUNCTION api.log_cron_job_success TO service_role;
GRANT EXECUTE ON FUNCTION api.log_cron_job_error TO service_role;


















