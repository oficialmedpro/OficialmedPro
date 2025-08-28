-- ====================================================
-- ALTERAR TABELA E INSERIR DADOS (APÓS APAGAR VIEWS)
-- ====================================================

-- 1. Agora podemos alterar os campos da tabela unidades
ALTER TABLE api.unidades ALTER COLUMN codigo TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN nome TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN cidade TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN franqueado_nome TYPE TEXT;

-- 2. Inserir dados completos das franquias
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
('[6]', 'BALNEARIO_CAMBORIU', 'BALNEÁRIO CAMBORIÚ - FRANQUIA', 'Balneário Camboriú', 'SC', 'Thiago e Angela', 'balneariocamboriu@oficialmed.com.br', '55 43 998513939/55 12 981367887', 'ativo')
ON CONFLICT (codigo_sprint) 
DO UPDATE SET 
    nome = EXCLUDED.nome,
    cidade = EXCLUDED.cidade,
    estado = EXCLUDED.estado,
    franqueado_nome = EXCLUDED.franqueado_nome,
    email_franqueado = EXCLUDED.email_franqueado,
    telefone_franqueado = EXCLUDED.telefone_franqueado,
    status = EXCLUDED.status,
    updated_at = NOW();

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
    u.nome as unidade_nome,
    u.cidade
FROM api.oportunidade_sprint o
LEFT JOIN api.unidades u ON o.unidade_id = u.codigo_sprint
WHERE o.unidade_id IN ('[2]', '[3]', '[4]', '[5]', '[6]')
LIMIT 5;