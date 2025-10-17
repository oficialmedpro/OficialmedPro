-- ========================================
-- 🔧 CONFIGURAR PERMISSÕES VIEW LEADS CALLIX
-- ========================================
-- Data: 2025-10-14
-- Objetivo: Configurar RLS e permissões para view api.view_leads_callix
-- ========================================

-- ========================================
-- VIEW: api.view_leads_callix
-- ========================================

-- NOTA: Views não suportam RLS diretamente.
-- As permissões são herdadas das tabelas subjacentes (api.lead_callix_status, api.leads, api.segmento)
-- que já têm RLS configurado.

-- 1) GRANTs para a VIEW
-- Leitura para anon (opcional; habilite apenas se quiser expor via API pública)
GRANT SELECT ON api.view_leads_callix TO anon;

-- Leitura para autenticados (clientes logados)
GRANT SELECT ON api.view_leads_callix TO authenticated;

-- service_role (chave secreta do servidor) – tem bypass de RLS, mas manter grants por clareza
GRANT ALL ON api.view_leads_callix TO service_role;

-- ========================================
-- VERIFICAÇÕES
-- ========================================

-- Permissões (GRANTs) - view_leads_callix
SELECT
  table_schema, table_name, privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_schema = 'api' AND table_name = 'view_leads_callix'
ORDER BY grantee, privilege_type;

-- NOTA: Views não têm políticas RLS próprias.
-- As políticas são herdadas das tabelas subjacentes.

-- Verificar se a view existe
SELECT 
    table_schema, 
    table_name, 
    table_type,
    is_updatable
FROM information_schema.tables 
WHERE table_schema = 'api' 
AND table_name = 'view_leads_callix';
