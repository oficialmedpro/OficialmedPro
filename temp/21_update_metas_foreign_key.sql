-- ========================================
-- 🔄 ATUALIZAÇÃO DA TABELA METAS
-- ========================================
-- Data: 2025-01-21
-- Objetivo: Adicionar foreign key para vendedores na tabela metas existente
-- Schema: api
-- ========================================

-- ========================================
-- 1️⃣ VERIFICAR ESTRUTURA ATUAL
-- ========================================

-- Verificar se a tabela metas existe e sua estrutura atual
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'api' 
  AND table_name = 'metas'
ORDER BY ordinal_position;

-- ========================================
-- 2️⃣ ALTERAR TIPO DO CAMPO vendedor_id
-- ========================================

-- Alterar o tipo de VARCHAR(50) para INTEGER para corresponder à tabela de vendedores
ALTER TABLE api.metas 
ALTER COLUMN vendedor_id TYPE INTEGER 
USING CASE 
    WHEN vendedor_id ~ '^[0-9]+$' THEN vendedor_id::INTEGER 
    ELSE NULL 
END;

-- ========================================
-- 3️⃣ ADICIONAR FOREIGN KEY CONSTRAINT
-- ========================================

-- Adicionar constraint de foreign key (assumindo que a tabela de vendedores se chama 'vendedores')
-- Se o nome da tabela for diferente, ajuste conforme necessário
ALTER TABLE api.metas 
ADD CONSTRAINT fk_metas_vendedor 
FOREIGN KEY (vendedor_id) 
REFERENCES api.vendedores(id) 
ON DELETE SET NULL;

-- ========================================
-- 4️⃣ ATUALIZAR DADOS EXISTENTES (se necessário)
-- ========================================

-- Se você tinha dados de exemplo com vendedor_id como string ('1', '2', '3')
-- e agora precisa corresponder aos IDs reais da tabela vendedores, use:

-- Exemplo: Atualizar vendedor_id '1' para o ID real do vendedor
-- UPDATE api.metas 
-- SET vendedor_id = (SELECT id FROM api.vendedores WHERE nome = 'Rosana Guarnieri')
-- WHERE vendedor_id = 1 AND tipo_meta LIKE 'vendedor_%';

-- Exemplo: Atualizar vendedor_id '2' para o ID real do vendedor
-- UPDATE api.metas 
-- SET vendedor_id = (SELECT id FROM api.vendedores WHERE nome = 'Thalia Passos')
-- WHERE vendedor_id = 2 AND tipo_meta LIKE 'vendedor_%';

-- Exemplo: Atualizar vendedor_id '3' para o ID real do vendedor
-- UPDATE api.metas 
-- SET vendedor_id = (SELECT id FROM api.vendedores WHERE nome = 'Thiago Venturini')
-- WHERE vendedor_id = 3 AND tipo_meta LIKE 'vendedor_%';

-- ========================================
-- 5️⃣ ATUALIZAR FUNÇÕES COM NOVO TIPO
-- ========================================

-- Atualizar função get_meta_vendedor para usar INTEGER
CREATE OR REPLACE FUNCTION get_meta_vendedor(
    p_vendedor_id INTEGER,
    p_tipo_meta VARCHAR(20)
)
RETURNS TABLE (
    meta_id INTEGER,
    nome_meta VARCHAR(100),
    valor_meta DECIMAL(15,2),
    unidade VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.nome_meta,
        m.valor_da_meta,
        m.unidade
    FROM api.metas m
    WHERE m.vendedor_id = p_vendedor_id
      AND m.tipo_meta = p_tipo_meta
      AND m.ativo = TRUE
    ORDER BY m.data_criacao DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6️⃣ CRIAR VIEW COM JOIN PARA VENDEDORES
-- ========================================

-- View que une metas com dados dos vendedores
CREATE OR REPLACE VIEW api.v_metas_com_vendedores AS
SELECT 
    m.id as meta_id,
    m.nome_meta,
    m.valor_da_meta,
    m.unidade,
    m.tipo_meta,
    m.vendedor_id,
    v.nome as vendedor_nome,
    v.email as vendedor_email,
    v.id_unidade,
    m.ativo,
    m.data_criacao,
    m.data_atualizacao,
    m.observacoes
FROM api.metas m
LEFT JOIN api.vendedores v ON m.vendedor_id = v.id
ORDER BY m.tipo_meta, v.nome;

-- ========================================
-- 7️⃣ VERIFICAR RESULTADO
-- ========================================

-- Verificar se a foreign key foi criada corretamente
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'metas'
    AND tc.table_schema = 'api';

-- ========================================
-- 8️⃣ EXEMPLOS DE CONSULTAS ATUALIZADAS
-- ========================================

/*
-- Exemplo 1: Buscar metas com dados dos vendedores
SELECT * FROM api.v_metas_com_vendedores;

-- Exemplo 2: Buscar meta de um vendedor específico por ID
SELECT * FROM get_meta_vendedor(1, 'vendedor_diaria');

-- Exemplo 3: Buscar metas de um vendedor específico por nome
SELECT m.*, v.nome as vendedor_nome
FROM api.metas m
JOIN api.vendedores v ON m.vendedor_id = v.id
WHERE v.nome = 'Rosana Guarnieri'
  AND m.ativo = TRUE;

-- Exemplo 4: Inserir nova meta para um vendedor existente
INSERT INTO api.metas (nome_meta, valor_da_meta, unidade, tipo_meta, vendedor_id, observacoes)
VALUES (
    'Meta Diária - Rosana', 
    1000.00, 
    'R$', 
    'vendedor_diaria', 
    (SELECT id FROM api.vendedores WHERE nome = 'Rosana Guarnieri'),
    'Meta personalizada para Rosana'
);

-- Exemplo 5: Atualizar meta de um vendedor
UPDATE api.metas 
SET valor_da_meta = 1200.00, observacoes = 'Meta atualizada em ' || NOW()
WHERE vendedor_id = (SELECT id FROM api.vendedores WHERE nome = 'Rosana Guarnieri')
  AND tipo_meta = 'vendedor_diaria';
*/

-- ========================================
-- ✅ SCRIPT DE ATUALIZAÇÃO CONCLUÍDO
-- ========================================

-- Para executar este script:
-- 1. Execute cada seção em ordem
-- 2. Verifique se não há erros
-- 3. Teste as consultas de exemplo
-- 4. Ajuste os nomes das tabelas se necessário



