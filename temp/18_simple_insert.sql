-- ====================================================
-- INSERIR DADOS SEM ON CONFLICT (VERSÃO SIMPLES)
-- ====================================================

-- 1. Primeiro, verificar se já existem dados
SELECT id, codigo_sprint, nome FROM api.unidades 
WHERE codigo_sprint IN ('[2]', '[3]', '[4]', '[5]', '[6]');

-- 2. Inserir dados das franquias (SEM ON CONFLICT)
INSERT INTO api.unidades (
    codigo_sprint, 
    codigo, 
    nome, 
    cidade, 
    estado, 
    franqueado_nome, 
    email_franqueado, 
    telefone_franqueado, 
    status
) VALUES 
('[2]', 'BOM_JESUS', 'BOM JESUS - FRANQUIA', 'Bom Jesus dos Perdões', 'SP', 'Flávio e Carlos', 'bomjesus@oficialmed.com.br', '55 11 973548754/55 11 957672011', 'ativo'),
('[3]', 'BELO_HORIZONTE', 'BELO HORIZONTE - FRANQUIA', 'Belo Horizonte', 'MG', 'Matheus Matta', 'belohorizonte@oficialmed.com.br', '55 31 998007873', 'inativo'),
('[4]', 'LONDRINA', 'LONDRINA - FRANQUIA', 'Londrina', 'PR', 'Paulo e Víctor', 'londrina1@oficialmed.com.br', '55 43 984252297/55 43 999957333', 'ativo'),
('[5]', 'ARAPONGAS', 'ARAPONGAS - FRANQUIA', 'Arapongas', 'PR', 'Franciele e Gabriel', 'arapongas@oficialmed.com.br', '55 43 999039438/55 11 947913232', 'ativo'),
('[6]', 'BALNEARIO_CAMBORIU', 'BALNEÁRIO CAMBORIÚ - FRANQUIA', 'Balneário Camboriú', 'SC', 'Thiago e Angela', 'balneariocamboriu@oficialmed.com.br', '55 43 998513939/55 12 981367887', 'ativo');

-- 3. Verificar dados inseridos
SELECT id, codigo_sprint, codigo, nome, cidade, estado, status
FROM api.unidades 
WHERE codigo_sprint IN ('[2]', '[3]', '[4]', '[5]', '[6]')
ORDER BY codigo_sprint;

-- 4. Testar relação com oportunidade_sprint
SELECT 
    o.id,
    o.title,
    o.unidade_id,
    u.nome as unidade_nome
FROM api.oportunidade_sprint o
LEFT JOIN api.unidades u ON o.unidade_id = u.codigo_sprint
WHERE o.unidade_id IN ('[2]', '[3]', '[4]', '[5]', '[6]')
LIMIT 5;