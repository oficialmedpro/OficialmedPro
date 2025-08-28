-- ====================================================
-- APAGAR VIEWS CORRETAS DO SCHEMA PUBLIC
-- ====================================================

-- Apagar apenas as VIEWS (não foreign tables)
DROP VIEW IF EXISTS public.funil_compra_apucarana_completo CASCADE;
DROP VIEW IF EXISTS public.oportunidade_sprint_view CASCADE;
DROP VIEW IF EXISTS public.v_funil_etapas CASCADE;
DROP VIEW IF EXISTS public.v_leads_agg CASCADE;
DROP VIEW IF EXISTS public.v_opps_enriquecidas CASCADE;
DROP VIEW IF EXISTS public.v_origens CASCADE;
DROP VIEW IF EXISTS public.v_vendas_ultimas_2h CASCADE;
DROP VIEW IF EXISTS public.v_vendedor_periodo CASCADE;

-- Se quiser também apagar a foreign table (opcional):
-- DROP FOREIGN TABLE IF EXISTS public.oportunidadesbig CASCADE;

-- Verificar se restaram views no schema public
SELECT 
    schemaname,
    viewname
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Listar tabelas restantes no schema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;