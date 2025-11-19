-- ========================================
-- 🔧 CORREÇÃO DAS VIEWS DE REATIVAÇÃO
-- ========================================
-- Data: 2025-01-XX
-- Problema: Views estavam usando data_criacao em vez de data_aprovacao
--           e não excluíam clientes com compras recentes (últimos 90 dias)
-- Solução: Atualizar todas as views para usar data_aprovacao quando disponível
--           e excluir clientes com pedidos aprovados nos últimos 90 dias
-- ========================================

-- ========================================
-- 1. CORRIGIR VIEW: DASHBOARD DE REATIVAÇÃO
-- ========================================

CREATE OR REPLACE VIEW api.vw_dashboard_reativacao AS
WITH pedidos_aprovados AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        -- Usa data_aprovacao quando disponível, senão usa data_criacao
        MAX(COALESCE(data_aprovacao, data_criacao)) as ultima_compra,
        MIN(COALESCE(data_aprovacao, data_criacao)) as primeira_compra
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
),
-- Verifica se há pedidos aprovados recentes (últimos 90 dias)
pedidos_recentes AS (
    SELECT DISTINCT cliente_id
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    AND COALESCE(data_aprovacao, data_criacao) >= (NOW() - INTERVAL '90 days')
),
clientes_com_pedidos AS (
    SELECT 
        cm.*,
        pa.total_pedidos,
        pa.ultima_compra,
        pa.primeira_compra,
        EXTRACT(DAYS FROM NOW() - pa.ultima_compra)::INTEGER as dias_sem_compra,
        -- Flag para indicar se tem compras recentes
        CASE WHEN pr.cliente_id IS NOT NULL THEN true ELSE false END as tem_compra_recente
    FROM api.clientes_mestre cm
    LEFT JOIN pedidos_aprovados pa ON cm.id_prime = pa.cliente_id
    LEFT JOIN pedidos_recentes pr ON cm.id_prime = pr.cliente_id
)
SELECT 
    -- TOTAIS GERAIS
    (SELECT COUNT(*) FROM api.clientes_mestre) as total_clientes_mestre,
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE id_prime IS NOT NULL) as total_com_id_prime,
    
    -- INATIVOS (nunca compraram)
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE id_prime IS NOT NULL AND total_pedidos IS NULL) as inativos_prime,
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE id_prime IS NULL AND total_pedidos IS NULL) as inativos_fora_prime,
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE total_pedidos IS NULL) as total_inativos,
    
    -- ATIVOS (já compraram)
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE total_pedidos >= 1) as total_ativos,
    
    -- PARA REATIVAÇÃO (90+ dias sem comprar E sem compras recentes)
    (SELECT COUNT(*) FROM clientes_com_pedidos 
     WHERE id_prime IS NOT NULL AND total_pedidos >= 1 AND dias_sem_compra > 90 AND NOT tem_compra_recente) as para_reativacao,
    (SELECT COUNT(*) FROM clientes_com_pedidos 
     WHERE id_prime IS NOT NULL AND total_pedidos = 1 AND dias_sem_compra > 90 AND NOT tem_compra_recente) as reativacao_1x,
    (SELECT COUNT(*) FROM clientes_com_pedidos 
     WHERE id_prime IS NOT NULL AND total_pedidos = 2 AND dias_sem_compra > 90 AND NOT tem_compra_recente) as reativacao_2x,
    (SELECT COUNT(*) FROM clientes_com_pedidos 
     WHERE id_prime IS NOT NULL AND total_pedidos = 3 AND dias_sem_compra > 90 AND NOT tem_compra_recente) as reativacao_3x,
    (SELECT COUNT(*) FROM clientes_com_pedidos 
     WHERE id_prime IS NOT NULL AND total_pedidos > 3 AND dias_sem_compra > 90 AND NOT tem_compra_recente) as reativacao_3x_plus,
    
    -- PARA MONITORAMENTO (0-90 dias)
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE id_prime IS NOT NULL AND total_pedidos >= 1 AND dias_sem_compra BETWEEN 1 AND 29) as monitoramento_1_29,
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE id_prime IS NOT NULL AND total_pedidos >= 1 AND dias_sem_compra BETWEEN 30 AND 59) as monitoramento_30_59,
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE id_prime IS NOT NULL AND total_pedidos >= 1 AND dias_sem_compra BETWEEN 60 AND 90) as monitoramento_60_90,
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE id_prime IS NOT NULL AND total_pedidos >= 1 AND dias_sem_compra <= 90) as total_monitoramento;

COMMENT ON VIEW api.vw_dashboard_reativacao IS 'Dashboard principal do sistema de reativação - CORRIGIDO: usa data_aprovacao e exclui compras recentes';

-- ========================================
-- 2. CORRIGIR VIEW: CLIENTES ATIVOS
-- ========================================

CREATE OR REPLACE VIEW api.vw_clientes_ativos AS
WITH pedidos_aprovados AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        -- Usa data_aprovacao quando disponível, senão usa data_criacao
        MAX(COALESCE(data_aprovacao, data_criacao)) as ultima_compra,
        MIN(COALESCE(data_aprovacao, data_criacao)) as primeira_compra,
        SUM(valor_total) as valor_total_compras
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
)
SELECT 
    cm.id,
    cm.id_prime,
    cm.nome_completo,
    cm.email,
    cm.whatsapp,
    cm.telefone,
    cm.cpf,
    cm.data_nascimento,
    cm.cidade,
    cm.estado,
    cm.qualidade_dados,
    cm.origem_marcas,
    pa.total_pedidos,
    pa.primeira_compra,
    pa.ultima_compra,
    pa.valor_total_compras,
    EXTRACT(DAYS FROM NOW() - pa.ultima_compra)::INTEGER as dias_desde_ultima_compra,
    EXTRACT(DAYS FROM pa.ultima_compra - pa.primeira_compra)::INTEGER as dias_como_cliente
FROM api.clientes_mestre cm
INNER JOIN pedidos_aprovados pa ON cm.id_prime = pa.cliente_id
WHERE cm.id_prime IS NOT NULL
AND pa.total_pedidos >= 1
ORDER BY pa.ultima_compra DESC;

COMMENT ON VIEW api.vw_clientes_ativos IS 'Clientes ativos que já compraram pelo menos 1 vez - CORRIGIDO: usa data_aprovacao';

-- ========================================
-- 3. CORRIGIR VIEW: PARA REATIVAÇÃO (90+ dias)
-- ========================================

CREATE OR REPLACE VIEW api.vw_para_reativacao AS
WITH pedidos_aprovados AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        -- Usa data_aprovacao quando disponível, senão usa data_criacao
        MAX(COALESCE(data_aprovacao, data_criacao)) as ultima_compra,
        MIN(COALESCE(data_aprovacao, data_criacao)) as primeira_compra,
        SUM(valor_total) as valor_total_compras
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
),
-- Verifica se há pedidos aprovados recentes (últimos 90 dias)
pedidos_recentes AS (
    SELECT DISTINCT cliente_id
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    AND COALESCE(data_aprovacao, data_criacao) >= (NOW() - INTERVAL '90 days')
),
historico_orcamentos AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
)
SELECT 
    cm.id,
    cm.id_prime,
    cm.nome_completo,
    cm.email,
    cm.whatsapp,
    cm.telefone,
    cm.cpf,
    cm.data_nascimento,
    cm.cidade,
    cm.estado,
    cm.qualidade_dados,
    cm.origem_marcas,
    pa.total_pedidos,
    pa.primeira_compra,
    pa.ultima_compra,
    pa.valor_total_compras,
    EXTRACT(DAYS FROM NOW() - pa.ultima_compra)::INTEGER as dias_sem_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico,
    CASE 
        WHEN pa.total_pedidos = 1 THEN '1x'
        WHEN pa.total_pedidos = 2 THEN '2x'
        WHEN pa.total_pedidos = 3 THEN '3x'
        WHEN pa.total_pedidos > 3 THEN '3+ vezes'
    END as frequencia_compra
FROM api.clientes_mestre cm
INNER JOIN pedidos_aprovados pa ON cm.id_prime = pa.cliente_id
LEFT JOIN historico_orcamentos ho ON cm.id_prime = ho.cliente_id
-- EXCLUI clientes que têm pedidos aprovados nos últimos 90 dias
WHERE cm.id_prime IS NOT NULL
AND pa.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - pa.ultima_compra) > 90
AND NOT EXISTS (
    SELECT 1 FROM pedidos_recentes pr 
    WHERE pr.cliente_id = cm.id_prime
)
ORDER BY pa.total_pedidos DESC, pa.ultima_compra DESC;

COMMENT ON VIEW api.vw_para_reativacao IS 'Clientes para reativação (90+ dias sem comprar) - CORRIGIDO: usa data_aprovacao e exclui compras recentes';

-- ========================================
-- 4. CORRIGIR VIEW: PARA MONITORAMENTO (0-90 dias)
-- ========================================

CREATE OR REPLACE VIEW api.vw_para_monitoramento AS
WITH pedidos_aprovados AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        -- Usa data_aprovacao quando disponível, senão usa data_criacao
        MAX(COALESCE(data_aprovacao, data_criacao)) as ultima_compra,
        MIN(COALESCE(data_aprovacao, data_criacao)) as primeira_compra,
        SUM(valor_total) as valor_total_compras
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
),
historico_orcamentos AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
)
SELECT 
    cm.id,
    cm.id_prime,
    cm.nome_completo,
    cm.email,
    cm.whatsapp,
    cm.telefone,
    cm.cpf,
    cm.data_nascimento,
    cm.cidade,
    cm.estado,
    cm.qualidade_dados,
    cm.origem_marcas,
    pa.total_pedidos,
    pa.primeira_compra,
    pa.ultima_compra,
    pa.valor_total_compras,
    EXTRACT(DAYS FROM NOW() - pa.ultima_compra)::INTEGER as dias_desde_ultima_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico,
    CASE 
        WHEN EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 1 AND 29 THEN '1-29 dias'
        WHEN EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 30 AND 59 THEN '30-59 dias'
        WHEN EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 60 AND 90 THEN '60-90 dias'
    END as faixa_recencia
FROM api.clientes_mestre cm
INNER JOIN pedidos_aprovados pa ON cm.id_prime = pa.cliente_id
LEFT JOIN historico_orcamentos ho ON cm.id_prime = ho.cliente_id
WHERE cm.id_prime IS NOT NULL
AND pa.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 1 AND 90
ORDER BY pa.ultima_compra DESC;

COMMENT ON VIEW api.vw_para_monitoramento IS 'Clientes para monitoramento (compraram nos últimos 90 dias) - CORRIGIDO: usa data_aprovacao';

-- ========================================
-- 5. CORRIGIR VIEW: INATIVOS DO PRIME
-- ========================================

CREATE OR REPLACE VIEW api.vw_inativos_prime AS
WITH pedidos_aprovados AS (
    SELECT cliente_id, COUNT(*) as total
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
),
historico_orcamentos AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        -- Usa data_aprovacao quando disponível, senão usa data_criacao
        MAX(CASE WHEN status_aprovacao = 'APROVADO' THEN COALESCE(data_aprovacao, data_criacao) END) as ultimo_pedido_aprovado,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
)
SELECT 
    cm.id,
    cm.id_prime,
    cm.nome_completo,
    cm.email,
    cm.whatsapp,
    cm.telefone,
    cm.cpf,
    cm.data_nascimento,
    cm.cidade,
    cm.estado,
    cm.qualidade_dados,
    cm.origem_marcas,
    cm.data_primeira_captura,
    cm.data_ultima_atualizacao,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.ultimo_pedido_aprovado,
    ho.status_historico,
    CASE 
        WHEN ho.total_orcamentos > 0 THEN true 
        ELSE false 
    END as tem_historico_orcamento,
    EXTRACT(DAYS FROM NOW() - cm.data_primeira_captura)::INTEGER as dias_desde_cadastro
FROM api.clientes_mestre cm
LEFT JOIN pedidos_aprovados pa ON cm.id_prime = pa.cliente_id
LEFT JOIN historico_orcamentos ho ON cm.id_prime = ho.cliente_id
WHERE cm.id_prime IS NOT NULL
AND (pa.total IS NULL OR pa.total = 0)
ORDER BY 
    CASE WHEN ho.total_orcamentos > 0 THEN 0 ELSE 1 END,
    ho.ultimo_orcamento DESC NULLS LAST,
    cm.qualidade_dados DESC;

COMMENT ON VIEW api.vw_inativos_prime IS 'Clientes inativos do Prime com histórico de orçamentos - CORRIGIDO: usa data_aprovacao';

-- ========================================
-- FIM DAS CORREÇÕES
-- ========================================
-- As views vw_reativacao_1x, vw_reativacao_2x, vw_reativacao_3x, vw_reativacao_3x_plus
-- são baseadas em vw_para_reativacao, então serão automaticamente corrigidas.
-- As views de monitoramento também são baseadas em vw_para_monitoramento.
-- ========================================

