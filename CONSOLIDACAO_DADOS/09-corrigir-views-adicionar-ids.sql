-- ============================================================================
-- CORRIGIR VIEWS - ADICIONAR IDs DAS FONTES
-- ============================================================================
-- Adiciona id_prime, id_sprinthub, id_greatpage, id_blacklabs nas views
-- para exibir corretamente no tooltip da lista
-- ============================================================================

-- Dropar views para recriar com colunas adicionais
DROP VIEW IF EXISTS api.vw_inativos_prime CASCADE;
DROP VIEW IF EXISTS api.vw_inativos_fora_prime CASCADE;

-- 1. Recriar vw_inativos_prime com todos os IDs
CREATE VIEW api.vw_inativos_prime AS
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
        MAX(CASE WHEN status_aprovacao = 'APROVADO' THEN data_criacao END) as ultimo_pedido_aprovado,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
)
SELECT
    cm.id,
    cm.id_prime,
    cm.id_sprinthub,
    cm.id_greatpage,
    cm.id_blacklabs,
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
    COALESCE(pa.total, 0) as total_pedidos_aprovados,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.ultimo_pedido_aprovado,
    ho.status_historico,
    EXTRACT(DAYS FROM NOW() - cm.data_primeira_captura)::INTEGER as dias_desde_cadastro
FROM api.clientes_mestre cm
LEFT JOIN pedidos_aprovados pa ON pa.cliente_id = cm.id_prime
LEFT JOIN historico_orcamentos ho ON ho.cliente_id = cm.id_prime
WHERE cm.id_prime IS NOT NULL
  AND COALESCE(pa.total, 0) = 0
ORDER BY cm.qualidade_dados DESC, cm.data_primeira_captura DESC;

COMMENT ON VIEW api.vw_inativos_prime IS 'Clientes no Prime que nunca compraram (0 pedidos aprovados)';

-- 2. Recriar vw_inativos_fora_prime com todos os IDs
CREATE VIEW api.vw_inativos_fora_prime AS
SELECT
    cm.id,
    cm.id_prime,
    cm.id_sprinthub,
    cm.id_greatpage,
    cm.id_blacklabs,
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

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ Views atualizadas com IDs das fontes!';
  RAISE NOTICE '📋 Agora o tooltip na lista vai mostrar os IDs corretamente';
END $$;
