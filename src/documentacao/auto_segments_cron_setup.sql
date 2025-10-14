-- ========================================
-- CONFIGURAÇÃO DO CRON JOB PARA SEGMENTOS AUTOMÁTICOS
-- ========================================

-- Executa a função edge para processar segmentos automáticos a cada 30 minutos
SELECT cron.schedule(
    'process_auto_segments',
    '*/30 * * * *', -- A cada 30 minutos
    $$ 
    SELECT net.http_get(
        'https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/process-auto-segments',
        headers => '{"Authorization": "Bearer sb_secret_alcgQVSO5zQ5hLtRunyRlg_N9GymGor"}'::jsonb
    );
    $$
);

-- Verificar se o cron job foi criado
SELECT * FROM cron.job WHERE jobname = 'process_auto_segments';

-- Para remover o cron job (se necessário)
-- SELECT cron.unschedule('process_auto_segments');

-- ========================================
-- EXEMPLO DE CONFIGURAÇÃO DE SEGMENTO AUTOMÁTICO
-- ========================================

-- Inserir o segmento D15 como automático
-- (Substitua o ID real do segmento D15)
INSERT INTO api.segmento_automatico (
    segmento_id, 
    nome, 
    ativo, 
    enviar_callix, 
    frequencia_horas,
    proxima_execucao
) VALUES (
    (SELECT id FROM api.segmento WHERE name ILIKE '%D15%' LIMIT 1), -- Busca o segmento D15
    'Segmento D15 - Automático',
    true,
    true,
    6, -- A cada 6 horas
    NOW() + INTERVAL '1 hour' -- Primeira execução em 1 hora
) ON CONFLICT DO NOTHING;

-- ========================================
-- QUERIES ÚTEIS PARA MONITORAMENTO
-- ========================================

-- Ver todos os segmentos automáticos
SELECT 
    sa.*,
    s.name as segmento_nome,
    s.total_leads,
    CASE 
        WHEN sa.proxima_execucao <= NOW() THEN 'Pronto para execução'
        ELSE 'Aguardando próxima execução'
    END as status_execucao
FROM api.segmento_automatico sa
JOIN api.segmento s ON sa.segmento_id = s.id
ORDER BY sa.proxima_execucao;

-- Ver estatísticas dos segmentos automáticos
SELECT 
    COUNT(*) as total_segmentos,
    COUNT(*) FILTER (WHERE ativo = true) as segmentos_ativos,
    SUM(total_leads_processados) as total_leads_processados,
    SUM(total_leads_enviados_callix) as total_leads_enviados_callix
FROM api.segmento_automatico;

-- Ver leads enviados para Callix hoje
SELECT 
    COUNT(*) as leads_enviados_hoje
FROM api.lead_callix_status 
WHERE DATE(data_envio_callix) = CURRENT_DATE;

-- Ver próximas execuções
SELECT 
    nome,
    proxima_execucao,
    frequencia_horas,
    CASE 
        WHEN proxima_execucao <= NOW() THEN 'PRONTO'
        ELSE 'AGUARDANDO'
    END as status
FROM api.segmento_automatico 
WHERE ativo = true
ORDER BY proxima_execucao;

-- ========================================
-- MANUTENÇÃO E LIMPEZA
-- ========================================

-- Limpar histórico antigo de lead_callix_status (manter apenas últimos 90 dias)
DELETE FROM api.lead_callix_status 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Atualizar estatísticas de um segmento específico
UPDATE api.segmento_automatico 
SET 
    total_leads_processados = (
        SELECT COUNT(*) 
        FROM api.leads 
        WHERE segmento = segmento_automatico.segmento_id
    ),
    total_leads_enviados_callix = (
        SELECT COUNT(*) 
        FROM api.leads 
        WHERE segmento = segmento_automatico.segmento_id 
        AND enviado_callix = true
    )
WHERE id = 1; -- Substitua pelo ID do segmento

-- ========================================
-- TESTE MANUAL DA FUNÇÃO
-- ========================================

-- Para testar manualmente (executar apenas um segmento)
-- SELECT net.http_get(
--     'https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/process-auto-segments',
--     headers => '{"Authorization": "Bearer sb_secret_alcgQVSO5zQ5hLtRunyRlg_N9GymGor"}'::jsonb
-- );
