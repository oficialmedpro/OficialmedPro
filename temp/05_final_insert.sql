-- ====================================================
-- ADICIONAR CAMPO codigo_sprint NA TABELA api.unidades
-- ====================================================

-- 1. Adicionar o campo codigo_sprint
ALTER TABLE api.unidades 
ADD COLUMN IF NOT EXISTS codigo_sprint VARCHAR(10);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_unidades_codigo_sprint 
ON api.unidades (codigo_sprint);

-- 3. Verificar se foi criado
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'api' 
AND table_name = 'unidades' 
AND column_name = 'codigo_sprint';

-- 4. Inserir dados das franquias
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

-- 5. Verificar dados inseridos
SELECT id, codigo_sprint, nome, cidade, estado, status 
FROM api.unidades 
WHERE codigo_sprint IN ('[2]', '[3]', '[4]', '[5]', '[6]')
ORDER BY codigo_sprint;