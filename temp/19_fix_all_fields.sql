-- ====================================================
-- EXPANDIR TODOS OS CAMPOS ANTES DE INSERIR
-- ====================================================

-- 1. Alterar TODOS os campos VARCHAR para TEXT
ALTER TABLE api.unidades ALTER COLUMN codigo TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN nome TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN cidade TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN estado TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN franqueado_nome TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN email_franqueado TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN telefone_franqueado TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN status TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN codigo_sprint TYPE TEXT;

-- 2. Verificar estrutura (todos devem estar como 'text')
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'api' 
AND table_name = 'unidades'
AND data_type LIKE '%char%'
ORDER BY column_name;

-- 3. AGORA inserir dados (deve funcionar)
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

-- 4. Verificar dados inseridos
SELECT id, codigo_sprint, codigo, nome, cidade, estado, status
FROM api.unidades 
WHERE codigo_sprint IN ('[2]', '[3]', '[4]', '[5]', '[6]')
ORDER BY codigo_sprint;