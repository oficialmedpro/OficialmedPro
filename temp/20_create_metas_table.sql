-- ========================================
-- 📊 CRIAÇÃO DA TABELA METAS
-- ========================================
-- Data: 2025-01-21
-- Objetivo: Tabela para gerenciar metas de vendas
-- Schema: api
-- ========================================

-- ========================================
-- 1️⃣ CRIAÇÃO DA TABELA METAS
-- ========================================

CREATE TABLE IF NOT EXISTS api.metas (
    id SERIAL PRIMARY KEY,
    nome_meta VARCHAR(100) NOT NULL,
    valor_da_meta DECIMAL(15,2) NOT NULL,
    unidade VARCHAR(50) NOT NULL,
    tipo_meta VARCHAR(20) NOT NULL CHECK (tipo_meta IN ('diaria', 'sabado', 'mensal', 'vendedor_diaria', 'vendedor_sabado', 'vendedor_mensal')),
    vendedor_id INTEGER NULL, -- FK para tabela de vendedores (id)
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observacoes TEXT NULL,
    
    -- Foreign Key para vendedores (assumindo que a tabela se chama 'vendedores' ou similar)
    CONSTRAINT fk_metas_vendedor FOREIGN KEY (vendedor_id) REFERENCES api.vendedores(id) ON DELETE SET NULL
);

-- ========================================
-- 2️⃣ ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_metas_tipo_meta ON api.metas(tipo_meta);
CREATE INDEX IF NOT EXISTS idx_metas_vendedor_id ON api.metas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_metas_ativo ON api.metas(ativo);
CREATE INDEX IF NOT EXISTS idx_metas_unidade ON api.metas(unidade);

-- ========================================
-- 3️⃣ TRIGGER PARA ATUALIZAR data_atualizacao
-- ========================================

CREATE OR REPLACE FUNCTION update_metas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_metas_updated_at
    BEFORE UPDATE ON api.metas
    FOR EACH ROW
    EXECUTE FUNCTION update_metas_updated_at();

-- ========================================
-- 4️⃣ INSERÇÃO DOS DADOS INICIAIS
-- ========================================

-- Metas Gerais (não específicas de vendedor)
INSERT INTO api.metas (nome_meta, valor_da_meta, unidade, tipo_meta, observacoes) VALUES
-- Meta Diária Geral
('Meta Diária Geral', 5000.00, 'R$', 'diaria', 'Meta de vendas para todos os dias úteis'),
-- Meta Sábado Geral  
('Meta Sábado Geral', 3000.00, 'R$', 'sabado', 'Meta de vendas específica para sábados'),
-- Meta Mensal Geral
('Meta Mensal Geral', 120000.00, 'R$', 'mensal', 'Meta de vendas para o mês completo');

-- Metas por Vendedor (exemplo com alguns vendedores)
INSERT INTO api.metas (nome_meta, valor_da_meta, unidade, tipo_meta, vendedor_id, observacoes) VALUES
-- Vendedor 1 - Metas Diárias
('Meta Diária - Vendedor 1', 800.00, 'R$', 'vendedor_diaria', '1', 'Meta diária individual para vendedor 1'),
('Meta Sábado - Vendedor 1', 500.00, 'R$', 'vendedor_sabado', '1', 'Meta de sábado individual para vendedor 1'),
('Meta Mensal - Vendedor 1', 20000.00, 'R$', 'vendedor_mensal', '1', 'Meta mensal individual para vendedor 1'),

-- Vendedor 2 - Metas Diárias
('Meta Diária - Vendedor 2', 750.00, 'R$', 'vendedor_diaria', '2', 'Meta diária individual para vendedor 2'),
('Meta Sábado - Vendedor 2', 450.00, 'R$', 'vendedor_sabado', '2', 'Meta de sábado individual para vendedor 2'),
('Meta Mensal - Vendedor 2', 18000.00, 'R$', 'vendedor_mensal', '2', 'Meta mensal individual para vendedor 2'),

-- Vendedor 3 - Metas Diárias
('Meta Diária - Vendedor 3', 900.00, 'R$', 'vendedor_diaria', '3', 'Meta diária individual para vendedor 3'),
('Meta Sábado - Vendedor 3', 600.00, 'R$', 'vendedor_sabado', '3', 'Meta de sábado individual para vendedor 3'),
('Meta Mensal - Vendedor 3', 22000.00, 'R$', 'vendedor_mensal', '3', 'Meta mensal individual para vendedor 3');

-- ========================================
-- 5️⃣ COMENTÁRIOS NA TABELA E COLUNAS
-- ========================================

COMMENT ON TABLE api.metas IS 'Tabela para gerenciar metas de vendas por período e vendedor';
COMMENT ON COLUMN api.metas.id IS 'Identificador único da meta';
COMMENT ON COLUMN api.metas.nome_meta IS 'Nome descritivo da meta';
COMMENT ON COLUMN api.metas.valor_da_meta IS 'Valor da meta em reais';
COMMENT ON COLUMN api.metas.unidade IS 'Unidade da meta (R$, %, etc.)';
COMMENT ON COLUMN api.metas.tipo_meta IS 'Tipo da meta: diaria, sabado, mensal, vendedor_diaria, vendedor_sabado, vendedor_mensal';
COMMENT ON COLUMN api.metas.vendedor_id IS 'ID do vendedor (NULL para metas gerais)';
COMMENT ON COLUMN api.metas.ativo IS 'Se a meta está ativa ou não';
COMMENT ON COLUMN api.metas.data_criacao IS 'Data de criação do registro';
COMMENT ON COLUMN api.metas.data_atualizacao IS 'Data da última atualização';
COMMENT ON COLUMN api.metas.observacoes IS 'Observações adicionais sobre a meta';

-- ========================================
-- 6️⃣ VIEW PARA CONSULTAS FACILITADAS
-- ========================================

CREATE OR REPLACE VIEW api.v_metas_resumo AS
SELECT 
    tipo_meta,
    CASE 
        WHEN tipo_meta = 'diaria' THEN 'Meta Diária'
        WHEN tipo_meta = 'sabado' THEN 'Meta Sábado'
        WHEN tipo_meta = 'mensal' THEN 'Meta Mensal'
        WHEN tipo_meta = 'vendedor_diaria' THEN 'Meta Diária por Vendedor'
        WHEN tipo_meta = 'vendedor_sabado' THEN 'Meta Sábado por Vendedor'
        WHEN tipo_meta = 'vendedor_mensal' THEN 'Meta Mensal por Vendedor'
    END as tipo_meta_descricao,
    COUNT(*) as total_metas,
    SUM(CASE WHEN ativo = TRUE THEN 1 ELSE 0 END) as metas_ativas,
    SUM(CASE WHEN ativo = TRUE THEN valor_da_meta ELSE 0 END) as valor_total_metas_ativas,
    AVG(CASE WHEN ativo = TRUE THEN valor_da_meta ELSE NULL END) as valor_medio_metas_ativas
FROM api.metas
GROUP BY tipo_meta
ORDER BY 
    CASE tipo_meta
        WHEN 'diaria' THEN 1
        WHEN 'sabado' THEN 2
        WHEN 'mensal' THEN 3
        WHEN 'vendedor_diaria' THEN 4
        WHEN 'vendedor_sabado' THEN 5
        WHEN 'vendedor_mensal' THEN 6
    END;

-- ========================================
-- 7️⃣ VIEW PARA METAS POR VENDEDOR
-- ========================================

CREATE OR REPLACE VIEW api.v_metas_por_vendedor AS
SELECT 
    vendedor_id,
    nome_meta,
    valor_da_meta,
    unidade,
    tipo_meta,
    CASE 
        WHEN tipo_meta = 'vendedor_diaria' THEN 'Diária'
        WHEN tipo_meta = 'vendedor_sabado' THEN 'Sábado'
        WHEN tipo_meta = 'vendedor_mensal' THEN 'Mensal'
    END as periodo_meta,
    ativo,
    data_criacao,
    observacoes
FROM api.metas
WHERE vendedor_id IS NOT NULL
  AND ativo = TRUE
ORDER BY vendedor_id, tipo_meta;

-- ========================================
-- 8️⃣ FUNÇÕES ÚTEIS
-- ========================================

-- Função para buscar meta por vendedor e tipo
CREATE OR REPLACE FUNCTION get_meta_vendedor(
    p_vendedor_id VARCHAR(50),
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

-- Função para buscar meta geral por tipo
CREATE OR REPLACE FUNCTION get_meta_geral(
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
    WHERE m.vendedor_id IS NULL
      AND m.tipo_meta = p_tipo_meta
      AND m.ativo = TRUE
    ORDER BY m.data_criacao DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 9️⃣ EXEMPLOS DE CONSULTAS
-- ========================================

/*
-- Exemplo 1: Buscar todas as metas ativas
SELECT * FROM api.metas WHERE ativo = TRUE ORDER BY tipo_meta, vendedor_id;

-- Exemplo 2: Buscar meta diária de um vendedor específico
SELECT * FROM get_meta_vendedor('1', 'vendedor_diaria');

-- Exemplo 3: Buscar meta mensal geral
SELECT * FROM get_meta_geral('mensal');

-- Exemplo 4: Resumo de todas as metas
SELECT * FROM api.v_metas_resumo;

-- Exemplo 5: Metas por vendedor
SELECT * FROM api.v_metas_por_vendedor WHERE vendedor_id = '1';

-- Exemplo 6: Atualizar valor de uma meta
UPDATE api.metas 
SET valor_da_meta = 1000.00, observacoes = 'Meta atualizada em ' || NOW()
WHERE id = 1;

-- Exemplo 7: Desativar uma meta
UPDATE api.metas 
SET ativo = FALSE, observacoes = 'Meta desativada em ' || NOW()
WHERE id = 1;
*/

-- ========================================
-- ✅ SCRIPT CONCLUÍDO
-- ========================================

-- Para executar este script:
-- 1. Conecte ao seu banco Supabase
-- 2. Execute este arquivo SQL completo
-- 3. Verifique se as tabelas foram criadas com: \dt api.metas
-- 4. Verifique os dados com: SELECT * FROM api.metas;
