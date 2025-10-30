
-- ========================================
-- SISTEMA DE CLIENTES INATIVOS - REATIVAÇÃO
-- ========================================

-- 1. Adicionar campos de controle na tabela prime_clientes
ALTER TABLE api.prime_clientes 
ADD COLUMN IF NOT EXISTS exportado_reativacao BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_exportacao_reativacao TIMESTAMP WITH TIME ZONE;

-- 2. Criar view de clientes inativos
CREATE OR REPLACE VIEW api.inativos AS
SELECT 
    pc.id,
    pc.nome,
    pc.email,
    pc.telefone,
    pc.cpf_cnpj,
    pc.data_nascimento,
    pc.primeira_compra,
    pc.ultima_compra,
    pc.created_at,
    pc.exportado_reativacao,
    pc.data_exportacao_reativacao,
    -- Calcular dias desde última compra
    CASE 
        WHEN pc.ultima_compra IS NOT NULL THEN 
            EXTRACT(DAYS FROM NOW() - pc.ultima_compra)
        WHEN pc.primeira_compra IS NOT NULL THEN 
            EXTRACT(DAYS FROM NOW() - pc.primeira_compra)
        ELSE 
            EXTRACT(DAYS FROM NOW() - pc.created_at)
    END as dias_sem_compra
FROM api.prime_clientes pc
LEFT JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos
    FROM api.prime_pedidos 
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pedidos_aprovados ON pc.id = pedidos_aprovados.cliente_id
WHERE 
    -- Cliente ativo
    pc.ativo = true
    -- Sem pedidos aprovados
    AND (pedidos_aprovados.total_pedidos IS NULL OR pedidos_aprovados.total_pedidos = 0)
    -- Não foi exportado para reativação ainda
    AND (pc.exportado_reativacao IS NULL OR pc.exportado_reativacao = FALSE)
ORDER BY 
    -- Ordenar pelos mais antigos primeiro
    CASE 
        WHEN pc.ultima_compra IS NOT NULL THEN pc.ultima_compra
        WHEN pc.primeira_compra IS NOT NULL THEN pc.primeira_compra
        ELSE pc.created_at
    END ASC;

-- 3. Função para exportar clientes inativos
CREATE OR REPLACE FUNCTION api.exportar_clientes_inativos(
    quantidade INTEGER DEFAULT 100
)
RETURNS TABLE (
    id BIGINT,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    cpf_cnpj TEXT,
    data_nascimento DATE,
    primeira_compra TIMESTAMP WITH TIME ZONE,
    ultima_compra TIMESTAMP WITH TIME ZONE,
    dias_sem_compra BIGINT
) AS $$
BEGIN
    -- Marcar clientes como exportados
    UPDATE api.prime_clientes 
    SET 
        exportado_reativacao = TRUE,
        data_exportacao_reativacao = NOW()
    WHERE id IN (
        SELECT pc.id 
        FROM api.prime_clientes pc
        LEFT JOIN (
            SELECT 
                cliente_id,
                COUNT(*) as total_pedidos
            FROM api.prime_pedidos 
            WHERE status_aprovacao = 'APROVADO'
            GROUP BY cliente_id
        ) pedidos_aprovados ON pc.id = pedidos_aprovados.cliente_id
        WHERE 
            pc.ativo = true
            AND (pedidos_aprovados.total_pedidos IS NULL OR pedidos_aprovados.total_pedidos = 0)
            AND (pc.exportado_reativacao IS NULL OR pc.exportado_reativacao = FALSE)
        ORDER BY 
            CASE 
                WHEN pc.ultima_compra IS NOT NULL THEN pc.ultima_compra
                WHEN pc.primeira_compra IS NOT NULL THEN pc.primeira_compra
                ELSE pc.created_at
            END ASC
        LIMIT quantidade
    );
    
    -- Retornar os clientes exportados
    RETURN QUERY
    SELECT 
        pc.id,
        pc.nome,
        pc.email,
        pc.telefone,
        pc.cpf_cnpj,
        pc.data_nascimento,
        pc.primeira_compra,
        pc.ultima_compra,
        CASE 
            WHEN pc.ultima_compra IS NOT NULL THEN 
                EXTRACT(DAYS FROM NOW() - pc.ultima_compra)
            WHEN pc.primeira_compra IS NOT NULL THEN 
                EXTRACT(DAYS FROM NOW() - pc.primeira_compra)
            ELSE 
                EXTRACT(DAYS FROM NOW() - pc.created_at)
        END as dias_sem_compra
    FROM api.prime_clientes pc
    WHERE 
        pc.exportado_reativacao = TRUE
        AND pc.data_exportacao_reativacao >= NOW() - INTERVAL '1 minute'
    ORDER BY pc.data_exportacao_reativacao DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Função para resetar exportação (caso precise)
CREATE OR REPLACE FUNCTION api.resetar_exportacao_reativacao()
RETURNS INTEGER AS $$
DECLARE
    clientes_resetados INTEGER;
BEGIN
    UPDATE api.prime_clientes 
    SET 
        exportado_reativacao = FALSE,
        data_exportacao_reativacao = NULL
    WHERE exportado_reativacao = TRUE;
    
    GET DIAGNOSTICS clientes_resetados = ROW_COUNT;
    RETURN clientes_resetados;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para ver estatísticas
CREATE OR REPLACE FUNCTION api.estatisticas_reativacao()
RETURNS TABLE (
    total_clientes_inativos BIGINT,
    clientes_exportados BIGINT,
    clientes_nao_exportados BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM api.inativos) as total_clientes_inativos,
        (SELECT COUNT(*) FROM api.prime_clientes WHERE exportado_reativacao = TRUE) as clientes_exportados,
        (SELECT COUNT(*) FROM api.prime_clientes 
         WHERE ativo = true 
         AND (exportado_reativacao IS NULL OR exportado_reativacao = FALSE)
         AND id NOT IN (
             SELECT cliente_id FROM api.prime_pedidos WHERE status_aprovacao = 'APROVADO'
         )) as clientes_nao_exportados;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMO USAR O SISTEMA:
-- ========================================

-- 1. Ver todos os clientes inativos:
-- SELECT * FROM api.inativos LIMIT 100;

-- 2. Exportar 200 clientes inativos:
-- SELECT * FROM api.exportar_clientes_inativos(200);

-- 3. Ver estatísticas:
-- SELECT * FROM api.estatisticas_reativacao();

-- 4. Resetar exportação (se necessário):
-- SELECT api.resetar_exportacao_reativacao();

-- 5. Ver clientes já exportados:
-- SELECT * FROM api.prime_clientes WHERE exportado_reativacao = TRUE;
        