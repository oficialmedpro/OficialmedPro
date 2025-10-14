-- ========================================
-- CONFIGURAR SEGMENTO AUTOMÁTICO
-- ========================================
-- Escolha um dos segmentos abaixo e execute a query correspondente

-- ========================================
-- OPÇÃO 1: SEGMENTO GERAL (58.788 leads)
-- ========================================
/*
INSERT INTO api.segmento_automatico (
    segmento_id, 
    nome, 
    ativo, 
    enviar_callix, 
    frequencia_horas,
    proxima_execucao
) VALUES (
    21, -- ID do segmento "Geral"
    'Segmento Geral - Automático',
    true,
    true,
    12, -- A cada 12 horas (muitos leads)
    NOW() + INTERVAL '1 hour'
) ON CONFLICT (segmento_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    ativo = EXCLUDED.ativo,
    enviar_callix = EXCLUDED.enviar_callix,
    frequencia_horas = EXCLUDED.frequencia_horas;
*/

-- ========================================
-- OPÇÃO 2: SEGMENTO [1] RECOMPRA (3.793 leads)
-- ========================================
/*
INSERT INTO api.segmento_automatico (
    segmento_id, 
    nome, 
    ativo, 
    enviar_callix, 
    frequencia_horas,
    proxima_execucao
) VALUES (
    68, -- ID do segmento "[1] Recompra"
    'Segmento [1] Recompra - Automático',
    true,
    true,
    6, -- A cada 6 horas
    NOW() + INTERVAL '1 hour'
) ON CONFLICT (segmento_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    ativo = EXCLUDED.ativo,
    enviar_callix = EXCLUDED.enviar_callix,
    frequencia_horas = EXCLUDED.frequencia_horas;
*/

-- ========================================
-- OPÇÃO 3: SEGMENTO TODOS ADS (6.619 leads)
-- ========================================
/*
INSERT INTO api.segmento_automatico (
    segmento_id, 
    nome, 
    ativo, 
    enviar_callix, 
    frequencia_horas,
    proxima_execucao
) VALUES (
    23, -- ID do segmento "todos ads"
    'Segmento Todos ADS - Automático',
    true,
    true,
    8, -- A cada 8 horas
    NOW() + INTERVAL '1 hour'
) ON CONFLICT (segmento_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    ativo = EXCLUDED.ativo,
    enviar_callix = EXCLUDED.enviar_callix,
    frequencia_horas = EXCLUDED.frequencia_horas;
*/

-- ========================================
-- OPÇÃO 4: SEGMENTO BLACKLABS (5.444 leads)
-- ========================================
/*
INSERT INTO api.segmento_automatico (
    segmento_id, 
    nome, 
    ativo, 
    enviar_callix, 
    frequencia_horas,
    proxima_execucao
) VALUES (
    46, -- ID do segmento "BLACKLABS LEADS 1.0"
    'Segmento BLACKLABS - Automático',
    true,
    true,
    6, -- A cada 6 horas
    NOW() + INTERVAL '1 hour'
) ON CONFLICT (segmento_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    ativo = EXCLUDED.ativo,
    enviar_callix = EXCLUDED.enviar_callix,
    frequencia_horas = EXCLUDED.frequencia_horas;
*/

-- ========================================
-- OPÇÃO 5: SEGMENTO PERSONALIZADO
-- ========================================
-- Substitua XXXX pelo ID do segmento que você escolher

INSERT INTO api.segmento_automatico (
    segmento_id, 
    nome, 
    ativo, 
    enviar_callix, 
    frequencia_horas,
    proxima_execucao
) VALUES (
    XXXX, -- ⚠️ SUBSTITUA PELO ID DO SEGMENTO ESCOLHIDO
    'Meu Segmento Automático', -- Mude o nome se quiser
    true,
    true,
    6, -- A cada 6 horas (ajuste conforme necessário)
    NOW() + INTERVAL '1 hour'
) ON CONFLICT (segmento_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    ativo = EXCLUDED.ativo,
    enviar_callix = EXCLUDED.enviar_callix,
    frequencia_horas = EXCLUDED.frequencia_horas;

-- ========================================
-- VERIFICAR CONFIGURAÇÃO
-- ========================================
SELECT 
    sa.id,
    sa.segmento_id,
    sa.nome,
    sa.ativo,
    sa.enviar_callix,
    sa.frequencia_horas,
    s.name as segmento_nome_real,
    s.total_leads,
    sa.proxima_execucao,
    CASE 
        WHEN sa.proxima_execucao <= NOW() THEN 'PRONTO PARA EXECUÇÃO'
        ELSE 'AGUARDANDO PRÓXIMA EXECUÇÃO'
    END as status
FROM api.segmento_automatico sa
LEFT JOIN api.segmento s ON sa.segmento_id = s.id;
