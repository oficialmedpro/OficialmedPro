-- ====================================================
-- INSERÇÃO SIMPLES - VERIFICANDO CAMPOS UM POR VEZ
-- ====================================================

-- 1. Primeiro, vamos ver a estrutura atual da tabela
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_schema = 'api' AND table_name = 'unidades'
ORDER BY ordinal_position;

-- 2. Alterar campos que podem estar pequenos
ALTER TABLE api.unidades 
ALTER COLUMN telefone_franqueado TYPE VARCHAR(100);

ALTER TABLE api.unidades 
ALTER COLUMN email_franqueado TYPE VARCHAR(100);

ALTER TABLE api.unidades 
ALTER COLUMN codigo TYPE VARCHAR(50);

ALTER TABLE api.unidades 
ALTER COLUMN nome TYPE VARCHAR(255);

ALTER TABLE api.unidades 
ALTER COLUMN cidade TYPE VARCHAR(100);

-- 3. Adicionar o campo codigo_sprint
ALTER TABLE api.unidades 
ADD COLUMN IF NOT EXISTS codigo_sprint VARCHAR(5);

-- 4. Tentar inserir apenas uma franquia primeiro para testar
INSERT INTO api.unidades (
    codigo_sprint, 
    codigo, 
    nome, 
    cidade, 
    estado, 
    status
) VALUES 
('[2]', 'BOM_JESUS', 'BOM JESUS - FRANQUIA', 'Bom Jesus dos Perdões', 'SP', 'ativo')
ON CONFLICT (codigo_sprint) 
DO UPDATE SET 
    nome = EXCLUDED.nome,
    cidade = EXCLUDED.cidade,
    status = EXCLUDED.status;

-- 5. Verificar se inseriu
SELECT * FROM api.unidades WHERE codigo_sprint = '[2]';

-- 6. Se funcionou, inserir o restante
INSERT INTO api.unidades (
    codigo_sprint, 
    codigo, 
    nome, 
    cidade, 
    estado, 
    status
) VALUES 
('[3]', 'BELO_HORIZONTE', 'BELO HORIZONTE', 'Belo Horizonte', 'MG', 'inativo'),
('[4]', 'LONDRINA', 'LONDRINA', 'Londrina', 'PR', 'ativo'),
('[5]', 'ARAPONGAS', 'ARAPONGAS', 'Arapongas', 'PR', 'ativo'),
('[6]', 'BALNEARIO', 'BALNEÁRIO CAMBORIÚ', 'Balneário Camboriú', 'SC', 'ativo')
ON CONFLICT (codigo_sprint) 
DO UPDATE SET 
    nome = EXCLUDED.nome,
    cidade = EXCLUDED.cidade,
    status = EXCLUDED.status;

-- 7. Ver todos os dados inseridos
SELECT id, codigo_sprint, codigo, nome, cidade, estado, status 
FROM api.unidades 
WHERE codigo_sprint IN ('[2]', '[3]', '[4]', '[5]', '[6]')
ORDER BY codigo_sprint;