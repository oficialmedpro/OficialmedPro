-- =====================================================
-- SCRIPT PARA ALTERAR SCHEMA DA TABELA LOSS_REASONS
-- =====================================================
-- Este script move a tabela loss_reasons do schema public para o schema api
-- Execute este script no Supabase SQL Editor

-- 1. Criar a tabela no schema api
CREATE TABLE IF NOT EXISTS api.loss_reasons (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    funil_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inserir dados dos motivos de perda no schema api
-- Funil 0
INSERT INTO api.loss_reasons (id, name, funil_id, description) VALUES
(42, '[0] AINDA TEM MANIPULADO', 0, 'Cliente ainda possui produto manipulado em estoque'),
(12, '[0] FALTA ATIVO', 0, 'Falta de ativo para compra'),
(1, '[0] NÃO TEM INTERESSE', 0, 'Cliente não demonstrou interesse no produto'),
(13, '[0] NÃO TRABALHAMOS', 0, 'Não trabalhamos com este tipo de cliente/produto'),
(14, '[0] PRODUTO INDUSTRIALIZADO', 0, 'Cliente busca produto industrializado'),
(9, '[0] TELEFONE INCORRETO', 0, 'Número de telefone incorreto ou inválido');

-- Funil 1
INSERT INTO api.loss_reasons (id, name, funil_id, description) VALUES
(50, '[1] AINDA TEM MANIPULADO', 1, 'Cliente ainda possui produto manipulado em estoque'),
(49, '[1] FALTA ATIVO', 1, 'Falta de ativo para compra'),
(11, '[1] LOGÍSTICA', 1, 'Problemas relacionados à logística de entrega'),
(51, '[1] SEM RECEITA', 1, 'Cliente não possui receita suficiente'),
(15, '[1] SEM RETORNO', 1, 'Cliente não retornou contato');

-- Funil 2
INSERT INTO api.loss_reasons (id, name, funil_id, description) VALUES
(16, '[2] FALTA ATIVO', 2, 'Falta de ativo para compra'),
(46, '[2] NÃO TEM RECEITA', 2, 'Cliente não possui receita suficiente'),
(31, '[2] NÃO TRABALHAMOS', 2, 'Não trabalhamos com este tipo de cliente/produto'),
(37, '[2] PRODUTO INDUSTRIALIZADO', 2, 'Cliente busca produto industrializado');

-- Funil 4
INSERT INTO api.loss_reasons (id, name, funil_id, description) VALUES
(44, '[4] AINDA TEM MANIPULADO', 4, 'Cliente ainda possui produto manipulado em estoque'),
(55, '[4] COMPROU COM CONCORRENTE LOGISTICA/FRETE', 4, 'Cliente comprou com concorrente por questões de logística/frete'),
(54, '[4] COMPROU COM CONCORRENTE PREÇO', 4, 'Cliente comprou com concorrente por questões de preço'),
(52, '[4] COMPROU COM CONCORRENTE TEMPO RESPOSTA', 4, 'Cliente comprou com concorrente por tempo de resposta'),
(53, '[4] CONDIÇÃO/FORMA DE PAGAMENTO ($$$)', 4, 'Problemas com condições ou forma de pagamento'),
(23, '[4] LOGÍSTICA', 4, 'Problemas relacionados à logística de entrega'),
(27, '[4] NÃO TEM INTERESSE', 4, 'Cliente não demonstrou interesse no produto'),
(29, '[4] SEM RETORNO', 4, 'Cliente não retornou contato'),
(20, '[4] VALOR/PREÇO', 4, 'Problemas relacionados ao valor/preço do produto');

-- Funil 5
INSERT INTO api.loss_reasons (id, name, funil_id, description) VALUES
(56, '[5] COMPROU COM CONCORRENTE LOGISTICA/FRETE', 5, 'Cliente comprou com concorrente por questões de logística/frete'),
(57, '[5] COMPROU COM CONCORRENTE PREÇO', 5, 'Cliente comprou com concorrente por questões de preço'),
(58, '[5] COMPROU COM CONCORRENTE TEMPO RESPOSTA', 5, 'Cliente comprou com concorrente por tempo de resposta'),
(59, '[5] CONDIÇÃO/FORMA DE PAGAMENTO ($$$)', 5, 'Problemas com condições ou forma de pagamento'),
(24, '[5] LOGÍSTICA', 5, 'Problemas relacionados à logística de entrega'),
(26, '[5] NÃO TEM INTERESSE', 5, 'Cliente não demonstrou interesse no produto'),
(30, '[5] SEM RETORNO', 5, 'Cliente não retornou contato'),
(21, '[5] VALOR/PREÇO', 5, 'Problemas relacionados ao valor/preço do produto');

-- 3. Criar índices no schema api
CREATE INDEX IF NOT EXISTS idx_loss_reasons_funil_id ON api.loss_reasons(funil_id);
CREATE INDEX IF NOT EXISTS idx_loss_reasons_name ON api.loss_reasons(name);

-- 4. Remover a tabela do schema public se existir
DROP TABLE IF EXISTS public.loss_reasons;

-- 5. Verificar se a tabela foi criada corretamente no schema api
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'loss_reasons';

-- 6. Verificar os dados inseridos
SELECT 
    funil_id,
    COUNT(*) as total_motivos,
    STRING_AGG(name, ', ' ORDER BY name) as motivos
FROM api.loss_reasons 
GROUP BY funil_id 
ORDER BY funil_id;

-- 7. Mostrar todos os motivos inseridos
SELECT 
    id,
    name,
    funil_id,
    description
FROM api.loss_reasons 
ORDER BY funil_id, name;
