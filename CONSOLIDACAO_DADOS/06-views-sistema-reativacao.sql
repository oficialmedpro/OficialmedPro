-- ========================================
-- 📊 SISTEMA DE REATIVAÇÃO DE CLIENTES
-- ========================================
-- Data: 2025-10-27
-- Objetivo: Views para análise e reativação de clientes inativos
-- Base: clientes_mestre + prime_pedidos
-- ========================================

-- ========================================
-- 1. VIEW: VALIDAÇÃO DE INTEGRIDADE
-- ========================================
-- Verificar se todos os clientes do Prime estão no clientes_mestre

CREATE OR REPLACE VIEW api.vw_validacao_integridade AS
SELECT 
    'Clientes no Prime' as metrica,
    COUNT(*) as total
FROM api.prime_clientes
WHERE ativo = true
UNION ALL
SELECT 
    'Clientes no clientes_mestre' as metrica,
    COUNT(*) as total
FROM api.clientes_mestre
UNION ALL
SELECT 
    'Clientes Prime com id_prime em clientes_mestre' as metrica,
    COUNT(*) as total
FROM api.clientes_mestre
WHERE id_prime IS NOT NULL
UNION ALL
SELECT 
    'Clientes Prime SEM correspondente em clientes_mestre' as metrica,
    COUNT(*) as total
FROM api.prime_clientes pc
WHERE pc.ativo = true
AND NOT EXISTS (
    SELECT 1 FROM api.clientes_mestre cm
    WHERE cm.id_prime = pc.id
)
UNION ALL
SELECT 
    'Clientes com id_prime mas cliente não existe no Prime' as metrica,
    COUNT(*) as total
FROM api.clientes_mestre cm
WHERE cm.id_prime IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM api.prime_clientes pc
    WHERE pc.id = cm.id_prime AND pc.ativo = true
);

COMMENT ON VIEW api.vw_validacao_integridade IS 'Validação de integridade entre prime_clientes e clientes_mestre';

-- ========================================
-- 2. VIEW: DASHBOARD DE REATIVAÇÃO
-- ========================================
-- CORRIGIDA: Usa data_aprovacao e exclui clientes com compras recentes (últimos 90 dias)

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

COMMENT ON VIEW api.vw_dashboard_reativacao IS 'Dashboard principal do sistema de reativação';

-- ========================================
-- 3. VIEW: INATIVOS DO PRIME (Com histórico de orçamentos)
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

COMMENT ON VIEW api.vw_inativos_prime IS 'Clientes inativos do Prime com histórico de orçamentos';

-- ========================================
-- 4. VIEW: INATIVOS FORA DO PRIME
-- ========================================

CREATE OR REPLACE VIEW api.vw_inativos_fora_prime AS
SELECT 
    cm.id,
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
    EXTRACT(DAYS FROM NOW() - cm.data_primeira_captura)::INTEGER as dias_desde_cadastro
FROM api.clientes_mestre cm
WHERE cm.id_prime IS NULL
ORDER BY cm.qualidade_dados DESC, cm.data_primeira_captura DESC;

COMMENT ON VIEW api.vw_inativos_fora_prime IS 'Clientes inativos que não estão no Prime';

-- ========================================
-- 5. VIEW: INATIVOS COM HISTÓRICO DE ORÇAMENTO
-- ========================================

CREATE OR REPLACE VIEW api.vw_inativos_com_orcamento AS
SELECT * 
FROM api.vw_inativos_prime
WHERE tem_historico_orcamento = true
ORDER BY ultimo_orcamento DESC;

COMMENT ON VIEW api.vw_inativos_com_orcamento IS 'Clientes inativos com histórico de orçamentos';

-- ========================================
-- 6. VIEW: INATIVOS SEM HISTÓRICO DE ORÇAMENTO
-- ========================================

CREATE OR REPLACE VIEW api.vw_inativos_sem_orcamento AS
SELECT * 
FROM api.vw_inativos_prime
WHERE tem_historico_orcamento = false
ORDER BY qualidade_dados DESC, data_primeira_captura DESC;

COMMENT ON VIEW api.vw_inativos_sem_orcamento IS 'Clientes inativos sem histórico de orçamentos';

-- ========================================
-- 7. VIEW: CLIENTES ATIVOS
-- ========================================
-- CORRIGIDA: Usa data_aprovacao quando disponível

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

COMMENT ON VIEW api.vw_clientes_ativos IS 'Clientes ativos que já compraram pelo menos 1 vez';

-- ========================================
-- 8. VIEW: PARA REATIVAÇÃO (90+ dias)
-- ========================================
-- CORRIGIDA: Considera pedidos do Prime E oportunidades ganhas do SprintHub

CREATE OR REPLACE VIEW api.vw_para_reativacao AS
WITH pedidos_aprovados_prime AS (
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
-- Oportunidades ganhas no SprintHub (considerando lead_id via clientes_mestre)
oportunidades_ganhas_sprinthub AS (
    SELECT 
        cm.id_prime as cliente_id,
        COUNT(*) as total_oportunidades,
        MAX(os.gain_date) as ultima_compra,
        MIN(os.gain_date) as primeira_compra,
        SUM(os.value) as valor_total_compras
    FROM api.oportunidade_sprint os
    INNER JOIN api.clientes_mestre cm ON os.lead_id = cm.id_sprinthub
    WHERE os.status = 'gain'
    AND os.gain_date IS NOT NULL
    AND cm.id_prime IS NOT NULL
    GROUP BY cm.id_prime
),
-- Combinar pedidos do Prime e oportunidades do SprintHub
compras_consolidadas AS (
    SELECT 
        COALESCE(pp.cliente_id, os.cliente_id) as cliente_id,
        COALESCE(pp.total_pedidos, 0) + COALESCE(os.total_oportunidades, 0) as total_pedidos,
        GREATEST(
            COALESCE(pp.ultima_compra, '1970-01-01'::timestamp),
            COALESCE(os.ultima_compra, '1970-01-01'::timestamp)
        ) as ultima_compra,
        LEAST(
            COALESCE(pp.primeira_compra, '9999-12-31'::timestamp),
            COALESCE(os.primeira_compra, '9999-12-31'::timestamp)
        ) as primeira_compra,
        COALESCE(pp.valor_total_compras, 0) + COALESCE(os.valor_total_compras, 0) as valor_total_compras
    FROM pedidos_aprovados_prime pp
    FULL OUTER JOIN oportunidades_ganhas_sprinthub os ON pp.cliente_id = os.cliente_id
),
-- Verifica se há compras recentes (últimos 90 dias) - Prime OU SprintHub
compras_recentes AS (
    -- Pedidos do Prime recentes
    SELECT DISTINCT cliente_id
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    AND COALESCE(data_aprovacao, data_criacao) >= (NOW() - INTERVAL '90 days')
    UNION
    -- Oportunidades ganhas do SprintHub recentes
    SELECT DISTINCT cm.id_prime as cliente_id
    FROM api.oportunidade_sprint os
    INNER JOIN api.clientes_mestre cm ON os.lead_id = cm.id_sprinthub
    WHERE os.status = 'gain'
    AND os.gain_date IS NOT NULL
    AND os.gain_date >= (NOW() - INTERVAL '90 days')
    AND cm.id_prime IS NOT NULL
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
    cc.total_pedidos,
    cc.primeira_compra,
    cc.ultima_compra,
    cc.valor_total_compras,
    EXTRACT(DAYS FROM NOW() - cc.ultima_compra)::INTEGER as dias_sem_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico,
    CASE 
        WHEN cc.total_pedidos = 1 THEN '1x'
        WHEN cc.total_pedidos = 2 THEN '2x'
        WHEN cc.total_pedidos = 3 THEN '3x'
        WHEN cc.total_pedidos > 3 THEN '3+ vezes'
    END as frequencia_compra
FROM api.clientes_mestre cm
INNER JOIN compras_consolidadas cc ON cm.id_prime = cc.cliente_id
LEFT JOIN historico_orcamentos ho ON cm.id_prime = ho.cliente_id
-- EXCLUI clientes que têm compras recentes (últimos 90 dias) - Prime OU SprintHub
WHERE cm.id_prime IS NOT NULL
AND cc.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - cc.ultima_compra) > 90
AND NOT EXISTS (
    SELECT 1 FROM compras_recentes cr 
    WHERE cr.cliente_id = cm.id_prime
)
ORDER BY cc.total_pedidos DESC, cc.ultima_compra DESC;

COMMENT ON VIEW api.vw_para_reativacao IS 'Clientes para reativação (90+ dias sem comprar)';

-- ========================================
-- 9-12. VIEWS: REATIVAÇÃO POR FREQUÊNCIA
-- ========================================

CREATE OR REPLACE VIEW api.vw_reativacao_1x AS
SELECT * FROM api.vw_para_reativacao WHERE frequencia_compra = '1x'
ORDER BY dias_sem_compra DESC;

CREATE OR REPLACE VIEW api.vw_reativacao_2x AS
SELECT * FROM api.vw_para_reativacao WHERE frequencia_compra = '2x'
ORDER BY dias_sem_compra DESC;

CREATE OR REPLACE VIEW api.vw_reativacao_3x AS
SELECT * FROM api.vw_para_reativacao WHERE frequencia_compra = '3x'
ORDER BY dias_sem_compra DESC;

CREATE OR REPLACE VIEW api.vw_reativacao_3x_plus AS
SELECT * FROM api.vw_para_reativacao WHERE frequencia_compra = '3+ vezes'
ORDER BY total_pedidos DESC, dias_sem_compra DESC;

COMMENT ON VIEW api.vw_reativacao_1x IS 'Clientes para reativação que compraram 1 vez';
COMMENT ON VIEW api.vw_reativacao_2x IS 'Clientes para reativação que compraram 2 vezes';
COMMENT ON VIEW api.vw_reativacao_3x IS 'Clientes para reativação que compraram 3 vezes';
COMMENT ON VIEW api.vw_reativacao_3x_plus IS 'Clientes para reativação que compraram 3+ vezes';

-- ========================================
-- 13. VIEW: PARA MONITORAMENTO (0-90 dias)
-- ========================================
-- CORRIGIDA: Usa data_aprovacao quando disponível

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

COMMENT ON VIEW api.vw_para_monitoramento IS 'Clientes para monitoramento (compraram nos últimos 90 dias)';

-- ========================================
-- 14-16. VIEWS: MONITORAMENTO POR FAIXA
-- ========================================

CREATE OR REPLACE VIEW api.vw_monitoramento_1_29_dias AS
SELECT * FROM api.vw_para_monitoramento WHERE faixa_recencia = '1-29 dias'
ORDER BY ultima_compra DESC;

CREATE OR REPLACE VIEW api.vw_monitoramento_30_59_dias AS
SELECT * FROM api.vw_para_monitoramento WHERE faixa_recencia = '30-59 dias'
ORDER BY ultima_compra DESC;

CREATE OR REPLACE VIEW api.vw_monitoramento_60_90_dias AS
SELECT * FROM api.vw_para_monitoramento WHERE faixa_recencia = '60-90 dias'
ORDER BY ultima_compra DESC;

COMMENT ON VIEW api.vw_monitoramento_1_29_dias IS 'Clientes que compraram há 1-29 dias';
COMMENT ON VIEW api.vw_monitoramento_30_59_dias IS 'Clientes que compraram há 30-59 dias';
COMMENT ON VIEW api.vw_monitoramento_60_90_dias IS 'Clientes que compraram há 60-90 dias';

-- ========================================
-- 17. VIEW: HISTÓRICO DE PEDIDOS/ORÇAMENTOS
-- ========================================

CREATE OR REPLACE VIEW api.vw_historico_pedidos_cliente AS
SELECT 
    pp.id as pedido_id,
    pp.cliente_id,
    cm.nome_completo,
    pp.codigo_orcamento_original,
    pp.data_criacao,
    pp.valor_total,
    pp.status_aprovacao,
    pp.observacoes,
    CASE 
        WHEN pp.status_aprovacao = 'APROVADO' THEN 1
        WHEN pp.status_aprovacao = 'PENDENTE' THEN 2
        WHEN pp.status_aprovacao = 'REJEITADO' THEN 3
        ELSE 4
    END as ordem_status,
    ROW_NUMBER() OVER (PARTITION BY pp.cliente_id ORDER BY pp.data_criacao DESC) as posicao_historico
FROM api.prime_pedidos pp
INNER JOIN api.clientes_mestre cm ON pp.cliente_id = cm.id_prime
ORDER BY pp.cliente_id, pp.data_criacao DESC;

COMMENT ON VIEW api.vw_historico_pedidos_cliente IS 'Histórico completo de pedidos e orçamentos por cliente';

-- ========================================
-- PERMISSÕES
-- ========================================

-- Conceder permissões para todas as views
GRANT SELECT ON api.vw_validacao_integridade TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_dashboard_reativacao TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_inativos_prime TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_inativos_fora_prime TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_inativos_com_orcamento TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_inativos_sem_orcamento TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_clientes_ativos TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_para_reativacao TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_reativacao_1x TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_reativacao_2x TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_reativacao_3x TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_reativacao_3x_plus TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_para_monitoramento TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_1_29_dias TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_30_59_dias TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_60_90_dias TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_historico_pedidos_cliente TO anon, authenticated, service_role;

-- ========================================
-- FIM
-- ========================================
