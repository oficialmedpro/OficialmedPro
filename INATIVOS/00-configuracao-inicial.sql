-- CONFIGURAÇÃO INICIAL DAS TABELAS
-- Execute estes comandos ANTES de usar o sistema

-- 1. Adicionar campos de controle de exportação
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
    EXTRACT(DAYS FROM NOW() - COALESCE(pc.ultima_compra, pc.primeira_compra, pc.created_at))::BIGINT as dias_sem_compra
FROM api.prime_clientes pc
LEFT JOIN (
    SELECT cliente_id, COUNT(*) as total_pedidos
    FROM api.prime_pedidos 
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pedidos_aprovados ON pc.id = pedidos_aprovados.cliente_id
WHERE 
    pc.ativo = true
    AND (pedidos_aprovados.total_pedidos IS NULL OR pedidos_aprovados.total_pedidos = 0);

-- 3. Verificar se as tabelas existem
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'api' 
AND table_name IN ('prime_clientes', 'prime_pedidos')
ORDER BY table_name, ordinal_position;

