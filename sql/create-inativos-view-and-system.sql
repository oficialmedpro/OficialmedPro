-- 1. Adicionar campo para marcar clientes exportados para reativação
ALTER TABLE api.prime_clientes 
ADD COLUMN IF NOT EXISTS exportado_reativacao BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_exportacao_reativacao TIMESTAMP WITH TIME ZONE;

-- 2. Criar view para clientes inativos (sem pedidos aprovados)
CREATE OR REPLACE VIEW api.inativos AS
SELECT 
    pc.id,
    pc.nome,
    pc.email,
    pc.telefone,
    pc.celular,
    pc.whatsapp,
    pc.cpf,
    pc.data_cadastro,
    pc.ultima_compra,
    pc.status,
    pc.exportado_reativacao,
    pc.data_exportacao_reativacao,
    -- Contar pedidos aprovados
    COALESCE(pedidos_aprovados.total_pedidos, 0) as total_pedidos_aprovados,
    -- Calcular dias desde última compra
    CASE 
        WHEN pc.ultima_compra IS NOT NULL THEN 
            EXTRACT(DAYS FROM NOW() - pc.ultima_compra)
        ELSE 
            EXTRACT(DAYS FROM NOW() - pc.data_cadastro)
    END as dias_sem_compra
FROM api.prime_clientes pc
LEFT JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos
    FROM api.prime_pedidos 
    WHERE status = 'aprovado'
    GROUP BY cliente_id
) pedidos_aprovados ON pc.id = pedidos_aprovados.cliente_id
WHERE 
    -- Cliente ativo
    pc.status = 'ativo'
    -- Sem pedidos aprovados
    AND (pedidos_aprovados.total_pedidos IS NULL OR pedidos_aprovados.total_pedidos = 0)
    -- Não foi exportado para reativação ainda
    AND (pc.exportado_reativacao IS NULL OR pc.exportado_reativacao = FALSE)
ORDER BY 
    -- Ordenar pelos mais antigos primeiro
    CASE 
        WHEN pc.ultima_compra IS NOT NULL THEN pc.ultima_compra
        ELSE pc.data_cadastro
    END ASC;

-- 3. Criar função para exportar clientes inativos
CREATE OR REPLACE FUNCTION api.exportar_clientes_inativos(
    quantidade INTEGER DEFAULT 100
)
RETURNS TABLE (
    id BIGINT,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    celular TEXT,
    whatsapp TEXT,
    cpf TEXT,
    data_cadastro TIMESTAMP WITH TIME ZONE,
    ultima_compra TIMESTAMP WITH TIME ZONE,
    dias_sem_compra BIGINT
) AS $$
BEGIN
    -- Marcar clientes como exportados e retornar os dados
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
            WHERE status = 'aprovado'
            GROUP BY cliente_id
        ) pedidos_aprovados ON pc.id = pedidos_aprovados.cliente_id
        WHERE 
            pc.status = 'ativo'
            AND (pedidos_aprovados.total_pedidos IS NULL OR pedidos_aprovados.total_pedidos = 0)
            AND (pc.exportado_reativacao IS NULL OR pc.exportado_reativacao = FALSE)
        ORDER BY 
            CASE 
                WHEN pc.ultima_compra IS NOT NULL THEN pc.ultima_compra
                ELSE pc.data_cadastro
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
        pc.celular,
        pc.whatsapp,
        pc.cpf,
        pc.data_cadastro,
        pc.ultima_compra,
        CASE 
            WHEN pc.ultima_compra IS NOT NULL THEN 
                EXTRACT(DAYS FROM NOW() - pc.ultima_compra)
            ELSE 
                EXTRACT(DAYS FROM NOW() - pc.data_cadastro)
        END as dias_sem_compra
    FROM api.prime_clientes pc
    WHERE 
        pc.exportado_reativacao = TRUE
        AND pc.data_exportacao_reativacao >= NOW() - INTERVAL '1 minute'
    ORDER BY pc.data_exportacao_reativacao DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar função para resetar exportação (caso precise)
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

-- 5. Criar função para ver estatísticas
CREATE OR REPLACE FUNCTION api.estatisticas_reativacao()
RETURNS TABLE (
    total_clientes_inativos BIGINT,
    clientes_exportados BIGINT,
    clientes_nao_exportados BIGINT,
    proximos_para_exportar BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM api.inativos) as total_clientes_inativos,
        (SELECT COUNT(*) FROM api.prime_clientes WHERE exportado_reativacao = TRUE) as clientes_exportados,
        (SELECT COUNT(*) FROM api.prime_clientes 
         WHERE status = 'ativo' 
         AND exportado_reativacao IS NULL OR exportado_reativacao = FALSE
         AND id NOT IN (
             SELECT cliente_id FROM api.prime_pedidos WHERE status = 'aprovado'
         )) as clientes_nao_exportados,
        (SELECT COUNT(*) FROM api.inativos LIMIT 100) as proximos_para_exportar;
END;
$$ LANGUAGE plpgsql;

-- 6. Comentários para documentação
COMMENT ON VIEW api.inativos IS 'View com clientes ativos que nunca fizeram pedidos aprovados, ordenados pelos mais antigos primeiro';
COMMENT ON FUNCTION api.exportar_clientes_inativos(INTEGER) IS 'Exporta uma quantidade específica de clientes inativos e os marca como exportados';
COMMENT ON FUNCTION api.resetar_exportacao_reativacao() IS 'Reseta todos os clientes marcados como exportados para reativação';
COMMENT ON FUNCTION api.estatisticas_reativacao() IS 'Retorna estatísticas sobre clientes inativos e exportações';

