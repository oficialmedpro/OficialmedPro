-- ========================================
-- 🔐 CORRIGIR PERMISSÕES SUPABASE
-- ========================================
-- Este script corrige as permissões das tabelas que estão dando erro 401
-- Execute este código no SQL Editor do Supabase

-- ========================================
-- 1. PERMISSÕES PARA TABELA sync_status (VIEW)
-- ========================================

-- Habilitar RLS na view sync_status
ALTER TABLE api.sync_status ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso com service_role
CREATE POLICY "Allow service_role access to sync_status" ON api.sync_status
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Política para permitir acesso com anon (se necessário)
CREATE POLICY "Allow anon access to sync_status" ON api.sync_status
FOR SELECT 
TO anon
USING (true);

-- ========================================
-- 2. PERMISSÕES PARA TABELA view_leads_callix (VIEW)
-- ========================================

-- Habilitar RLS na view view_leads_callix
ALTER TABLE api.view_leads_callix ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso com service_role
CREATE POLICY "Allow service_role access to view_leads_callix" ON api.view_leads_callix
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Política para permitir acesso com anon (se necessário)
CREATE POLICY "Allow anon access to view_leads_callix" ON api.view_leads_callix
FOR SELECT 
TO anon
USING (true);

-- ========================================
-- 3. PERMISSÕES PARA TABELA vw_cron_job_status (VIEW)
-- ========================================

-- Habilitar RLS na view vw_cron_job_status
ALTER TABLE api.vw_cron_job_status ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso com service_role
CREATE POLICY "Allow service_role access to vw_cron_job_status" ON api.vw_cron_job_status
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Política para permitir acesso com anon (se necessário)
CREATE POLICY "Allow anon access to vw_cron_job_status" ON api.vw_cron_job_status
FOR SELECT 
TO anon
USING (true);

-- ========================================
-- 4. PERMISSÕES PARA TABELA cron_job_logs (se existir)
-- ========================================

-- Habilitar RLS na tabela cron_job_logs
ALTER TABLE api.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso com service_role
CREATE POLICY "Allow service_role access to cron_job_logs" ON api.cron_job_logs
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Política para permitir acesso com anon (se necessário)
CREATE POLICY "Allow anon access to cron_job_logs" ON api.cron_job_logs
FOR SELECT 
TO anon
USING (true);

-- ========================================
-- 5. PERMISSÕES PARA TABELAS DO CRON (SCHEMA CRON)
-- ========================================

-- Habilitar RLS nas tabelas do schema cron
ALTER TABLE cron.job ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron.job_run_details ENABLE ROW LEVEL SECURITY;

-- Políticas para cron.job
CREATE POLICY "Allow service_role access to cron.job" ON cron.job
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon access to cron.job" ON cron.job
FOR SELECT 
TO anon
USING (true);

-- Políticas para cron.job_run_details
CREATE POLICY "Allow service_role access to cron.job_run_details" ON cron.job_run_details
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon access to cron.job_run_details" ON cron.job_run_details
FOR SELECT 
TO anon
USING (true);

-- ========================================
-- 6. VERIFICAR PERMISSÕES APLICADAS
-- ========================================

-- Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname IN ('api', 'cron')
    AND tablename IN ('sync_status', 'view_leads_callix', 'vw_cron_job_status', 'cron_job_logs', 'job', 'job_run_details')
ORDER BY schemaname, tablename, policyname;

-- ========================================
-- 7. ALTERNATIVA: DESABILITAR RLS (SE NECESSÁRIO)
-- ========================================
-- Se as políticas não funcionarem, você pode desabilitar RLS temporariamente:

-- DESABILITAR RLS (use apenas se as políticas não funcionarem)
-- ALTER TABLE api.sync_status DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE api.view_leads_callix DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE api.vw_cron_job_status DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE api.cron_job_logs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE cron.job DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE cron.job_run_details DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 8. VERIFICAR STATUS DAS TABELAS
-- ========================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname IN ('api', 'cron')
    AND tablename IN ('sync_status', 'view_leads_callix', 'vw_cron_job_status', 'cron_job_logs', 'job', 'job_run_details')
ORDER BY schemaname, tablename;

-- ========================================
-- INSTRUÇÕES DE USO:
-- ========================================
-- 1. Copie este código
-- 2. Cole no SQL Editor do Supabase
-- 3. Execute seção por seção
-- 4. Verifique os resultados das consultas de verificação
-- 5. Se ainda der erro 401, use a seção 7 para desabilitar RLS
-- ========================================























