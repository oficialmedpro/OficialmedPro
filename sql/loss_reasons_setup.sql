-- =====================================================
-- SCRIPT PARA CRIAR TABELA DE MOTIVOS DE PERDA
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Este script cria a tabela loss_reasons com os IDs exatos
-- que se relacionam com a tabela oportunidade_sprint

-- Criar tabela de motivos de perda
CREATE TABLE loss_reasons (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    funil_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados dos motivos de perda
-- Funil 0
INSERT INTO loss_reasons (id, name, funil_id, description) VALUES
(42, 'AINDA TEM MANIPULADO', 0, 'Cliente ainda possui produto manipulado em estoque'),
(12, 'FALTA ATIVO', 0, 'Falta de ativo para compra'),
(1, 'NÃO TEM INTERESSE', 0, 'Cliente não demonstrou interesse no produto'),
(13, 'NÃO TRABALHAMOS', 0, 'Não trabalhamos com este tipo de cliente/produto'),
(14, 'PRODUTO INDUSTRIALIZADO', 0, 'Cliente busca produto industrializado'),
(9, 'TELEFONE INCORRETO', 0, 'Número de telefone incorreto ou inválido');

-- Funil 1
INSERT INTO loss_reasons (id, name, funil_id, description) VALUES
(50, 'AINDA TEM MANIPULADO', 1, 'Cliente ainda possui produto manipulado em estoque'),
(49, 'FALTA ATIVO', 1, 'Falta de ativo para compra'),
(11, 'LOGÍSTICA', 1, 'Problemas relacionados à logística de entrega'),
(51, 'SEM RECEITA', 1, 'Cliente não possui receita suficiente'),
(15, 'SEM RETORNO', 1, 'Cliente não retornou contato');

-- Funil 2
INSERT INTO loss_reasons (id, name, funil_id, description) VALUES
(16, 'FALTA ATIVO', 2, 'Falta de ativo para compra'),
(46, 'NÃO TEM RECEITA', 2, 'Cliente não possui receita suficiente'),
(31, 'NÃO TRABALHAMOS', 2, 'Não trabalhamos com este tipo de cliente/produto'),
(37, 'PRODUTO INDUSTRIALIZADO', 2, 'Cliente busca produto industrializado');

-- Funil 4
INSERT INTO loss_reasons (id, name, funil_id, description) VALUES
(44, 'AINDA TEM MANIPULADO', 4, 'Cliente ainda possui produto manipulado em estoque'),
(55, 'COMPROU COM CONCORRENTE LOGISTICA/FRETE', 4, 'Cliente comprou com concorrente por questões de logística/frete'),
(54, 'COMPROU COM CONCORRENTE PREÇO', 4, 'Cliente comprou com concorrente por questões de preço'),
(52, 'COMPROU COM CONCORRENTE TEMPO RESPOSTA', 4, 'Cliente comprou com concorrente por tempo de resposta'),
(53, 'CONDIÇÃO/FORMA DE PAGAMENTO ($$$)', 4, 'Problemas com condições ou forma de pagamento'),
(23, 'LOGÍSTICA', 4, 'Problemas relacionados à logística de entrega'),
(27, 'NÃO TEM INTERESSE', 4, 'Cliente não demonstrou interesse no produto'),
(29, 'SEM RETORNO', 4, 'Cliente não retornou contato'),
(20, 'VALOR/PREÇO', 4, 'Problemas relacionados ao valor/preço do produto');

-- Funil 5
INSERT INTO loss_reasons (id, name, funil_id, description) VALUES
(56, 'COMPROU COM CONCORRENTE LOGISTICA/FRETE', 5, 'Cliente comprou com concorrente por questões de logística/frete'),
(57, 'COMPROU COM CONCORRENTE PREÇO', 5, 'Cliente comprou com concorrente por questões de preço'),
(58, 'COMPROU COM CONCORRENTE TEMPO RESPOSTA', 5, 'Cliente comprou com concorrente por tempo de resposta'),
(59, 'CONDIÇÃO/FORMA DE PAGAMENTO ($$$)', 5, 'Problemas com condições ou forma de pagamento'),
(24, 'LOGÍSTICA', 5, 'Problemas relacionados à logística de entrega'),
(26, 'NÃO TEM INTERESSE', 5, 'Cliente não demonstrou interesse no produto'),
(30, 'SEM RETORNO', 5, 'Cliente não retornou contato'),
(21, 'VALOR/PREÇO', 5, 'Problemas relacionados ao valor/preço do produto');

-- Criar índices para melhor performance
CREATE INDEX idx_loss_reasons_funil_id ON loss_reasons(funil_id);
CREATE INDEX idx_loss_reasons_name ON loss_reasons(name);

-- Verificar se os dados foram inseridos corretamente
SELECT 
    funil_id,
    COUNT(*) as total_motivos,
    STRING_AGG(name, ', ' ORDER BY name) as motivos
FROM loss_reasons 
GROUP BY funil_id 
ORDER BY funil_id;
