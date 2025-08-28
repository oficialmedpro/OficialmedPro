-- ====================================================
-- APAGAR TODAS AS VIEWS (EXCETO TABELA CLIENTE)
-- ====================================================

-- Apagar views do schema API
DROP VIEW IF EXISTS api.funil_compra_apucarana_completo CASCADE;
DROP VIEW IF EXISTS api.funil_compra_arapongas_completo CASCADE;
DROP VIEW IF EXISTS api.funil_compra_balnearío_camboriu_completo CASCADE;
DROP VIEW IF EXISTS api.funil_compra_belohorizonte_completo CASCADE;
DROP VIEW IF EXISTS api.funil_compra_bomjesus_completo CASCADE;
DROP VIEW IF EXISTS api.funil_compra_completo CASCADE;
DROP VIEW IF EXISTS api.funil_compra_londrina_completo CASCADE;
DROP VIEW IF EXISTS api.funil_contato_apucarana_completo CASCADE;
DROP VIEW IF EXISTS api.funil_contato_arapongas_completo CASCADE;
DROP VIEW IF EXISTS api.funil_contato_balnearío_camboriu_completo CASCADE;
DROP VIEW IF EXISTS api.funil_contato_belohorizonte_completo CASCADE;
DROP VIEW IF EXISTS api.funil_contato_bomjesus_completo CASCADE;
DROP VIEW IF EXISTS api.funil_contato_completo CASCADE;
DROP VIEW IF EXISTS api.funil_contato_londrina_completo CASCADE;
DROP VIEW IF EXISTS api.lead_analise_apucarana CASCADE;
DROP VIEW IF EXISTS api.lead_analise_arapongas CASCADE;
DROP VIEW IF EXISTS api.lead_analise_balnearío_camboriu CASCADE;
DROP VIEW IF EXISTS api.lead_analise_belohorizonte CASCADE;
DROP VIEW IF EXISTS api.lead_analise_bomjesus CASCADE;
DROP VIEW IF EXISTS api.lead_analise_completo CASCADE;
DROP VIEW IF EXISTS api.lead_analise_londrina CASCADE;
DROP VIEW IF EXISTS api.lead_sprint CASCADE;
DROP VIEW IF EXISTS api.oportunidade_apucarana CASCADE;
DROP VIEW IF EXISTS api.oportunidade_arapongas CASCADE;
DROP VIEW IF EXISTS api.oportunidade_balnearío_camboriu CASCADE;
DROP VIEW IF EXISTS api.oportunidade_belohorizonte CASCADE;
DROP VIEW IF EXISTS api.oportunidade_bomjesus CASCADE;
DROP VIEW IF EXISTS api.oportunidade_londrina CASCADE;
DROP VIEW IF EXISTS api.produtos_sprint CASCADE;
DROP VIEW IF EXISTS api.vendas_produtos_apucarana CASCADE;
DROP VIEW IF EXISTS api.vendas_produtos_arapongas CASCADE;
DROP VIEW IF EXISTS api.vendas_produtos_balnearío_camboriu CASCADE;
DROP VIEW IF EXISTS api.vendas_produtos_belohorizonte CASCADE;
DROP VIEW IF EXISTS api.vendas_produtos_bomjesus CASCADE;
DROP VIEW IF EXISTS api.vendas_produtos_completo CASCADE;
DROP VIEW IF EXISTS api.vendas_produtos_londrina CASCADE;
DROP VIEW IF EXISTS api.vendedores_sprint CASCADE;
DROP VIEW IF EXISTS api.v_ops_enriquecidas CASCADE;

-- Verificar se restaram views (deve aparecer apenas tabelas)
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'api'
ORDER BY viewname;

-- Listar tabelas restantes (para confirmar que não apagamos tabelas)
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'api'
AND table_type = 'BASE TABLE'
ORDER BY table_name;