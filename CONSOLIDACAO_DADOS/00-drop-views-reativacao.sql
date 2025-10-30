-- ========================================
-- 🗑️ DROPAR VIEWS DE REATIVAÇÃO
-- ========================================
-- Execute este arquivo ANTES de executar o 06-views-sistema-reativacao.sql
-- ========================================

DROP VIEW IF EXISTS api.vw_historico_pedidos_cliente;
DROP VIEW IF EXISTS api.vw_monitoramento_60_90_dias;
DROP VIEW IF EXISTS api.vw_monitoramento_30_59_dias;
DROP VIEW IF EXISTS api.vw_monitoramento_1_29_dias;
DROP VIEW IF EXISTS api.vw_para_monitoramento;
DROP VIEW IF EXISTS api.vw_reativacao_3x_plus;
DROP VIEW IF EXISTS api.vw_reativacao_3x;
DROP VIEW IF EXISTS api.vw_reativacao_2x;
DROP VIEW IF EXISTS api.vw_reativacao_1x;
DROP VIEW IF EXISTS api.vw_para_reativacao;
DROP VIEW IF EXISTS api.vw_clientes_ativos;
DROP VIEW IF EXISTS api.vw_inativos_sem_orcamento;
DROP VIEW IF EXISTS api.vw_inativos_com_orcamento;
DROP VIEW IF EXISTS api.vw_inativos_fora_prime;
DROP VIEW IF EXISTS api.vw_inativos_prime;
DROP VIEW IF EXISTS api.vw_dashboard_reativacao;
DROP VIEW IF EXISTS api.vw_validacao_integridade;

-- ========================================
-- ✅ VIEWS DROPADAS COM SUCESSO!
-- ========================================
-- Agora execute o arquivo 06-views-sistema-reativacao.sql
-- ========================================


