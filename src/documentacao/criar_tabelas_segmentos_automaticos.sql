-- 🎯 SISTEMA DE SEGMENTOS AUTOMÁTICOS - ESTRUTURA COMPLETA
-- Este arquivo cria todas as tabelas necessárias para o sistema de segmentos automáticos

-- 1. TABELA PRINCIPAL DE SEGMENTOS AUTOMÁTICOS
CREATE TABLE api.segmento_automatico (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    segmento_key VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    
    -- Configurações de execução
    ativo BOOLEAN DEFAULT true,
    frequencia_horas INTEGER DEFAULT 2,
    
    -- Critérios do segmento (JSON para flexibilidade)
    criterios JSONB,
    
    -- Integração Callix
    enviar_callix BOOLEAN DEFAULT false,
    lista_callix_id INTEGER,
    
    -- Estatísticas
    total_leads INTEGER DEFAULT 0,
    enviados_callix INTEGER DEFAULT 0,
    
    -- Controle de tempo
    ultima_execucao TIMESTAMPTZ,
    proxima_execucao TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE LOGS DE EXECUÇÃO
CREATE TABLE api.segmento_execucao_log (
    id SERIAL PRIMARY KEY,
    segmento_id INTEGER REFERENCES api.segmento_automatico(id) ON DELETE CASCADE,
    
    -- Status da execução
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'error')),
    message TEXT,
    
    -- Estatísticas da execução
    leads_processados INTEGER DEFAULT 0,
    enviados_callix INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    
    -- Detalhes de erro
    error_message TEXT,
    error_details JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

-- 3. TABELA DE LEADS POR SEGMENTO (histórico)
CREATE TABLE api.segmento_lead (
    id SERIAL PRIMARY KEY,
    segmento_id INTEGER REFERENCES api.segmento_automatico(id) ON DELETE CASCADE,
    lead_id BIGINT REFERENCES api.leads(id) ON DELETE CASCADE,
    
    -- Status do lead no segmento
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'processado', 'enviado_callix', 'erro')),
    
    -- Dados de envio para Callix
    enviado_callix BOOLEAN DEFAULT false,
    callix_contact_id VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índice único para evitar duplicatas
    UNIQUE(segmento_id, lead_id)
);

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_segmento_automatico_ativo ON api.segmento_automatico(ativo);
CREATE INDEX idx_segmento_automatico_proxima_execucao ON api.segmento_automatico(proxima_execucao);
CREATE INDEX idx_segmento_execucao_log_segmento_id ON api.segmento_execucao_log(segmento_id);
CREATE INDEX idx_segmento_execucao_log_created_at ON api.segmento_execucao_log(created_at);
CREATE INDEX idx_segmento_execucao_log_status ON api.segmento_execucao_log(status);
CREATE INDEX idx_segmento_lead_segmento_id ON api.segmento_lead(segmento_id);
CREATE INDEX idx_segmento_lead_lead_id ON api.segmento_lead(lead_id);
CREATE INDEX idx_segmento_lead_status ON api.segmento_lead(status);

-- 5. VIEW PARA MONITORAMENTO DE SEGMENTOS
CREATE OR REPLACE VIEW api.vw_segmento_status AS
SELECT 
    s.id,
    s.nome,
    s.segmento_key,
    s.ativo,
    s.frequencia_horas,
    s.total_leads,
    s.enviados_callix,
    s.ultima_execucao,
    s.proxima_execucao,
    
    -- Status baseado na última execução
    CASE 
        WHEN s.ultima_execucao IS NULL THEN 'nunca_executado'
        WHEN s.proxima_execucao <= NOW() THEN 'pronto_para_execucao'
        ELSE 'aguardando_proxima_execucao'
    END as status_execucao,
    
    -- Estatísticas da última execução
    el.status as ultimo_status,
    el.message as ultima_mensagem,
    el.leads_processados as ultimos_leads_processados,
    el.enviados_callix as ultimos_enviados_callix,
    el.duration_seconds as ultima_duracao,
    el.created_at as ultima_execucao_detalhada
    
FROM api.segmento_automatico s
LEFT JOIN LATERAL (
    SELECT *
    FROM api.segmento_execucao_log el
    WHERE el.segmento_id = s.id
    ORDER BY el.created_at DESC
    LIMIT 1
) el ON true;

-- 6. VIEW PARA LOGS COMBINADOS (Cron Jobs + Segmentos)
CREATE OR REPLACE VIEW api.vw_logs_execucao AS
-- Logs de Cron Jobs
SELECT 
    id,
    'cron' as tipo,
    job_name as nome,
    status,
    message,
    start_time as created_at,
    end_time as finished_at,
    duration_seconds,
    error_message,
    details
FROM api.cron_job_logs

UNION ALL

-- Logs de Segmentos
SELECT 
    el.id,
    'segmento' as tipo,
    CONCAT('Segmento: ', s.nome) as nome,
    el.status,
    el.message,
    el.created_at,
    el.finished_at,
    el.duration_seconds,
    el.error_message,
    jsonb_build_object(
        'segmento_id', el.segmento_id,
        'leads_processados', el.leads_processados,
        'enviados_callix', el.enviados_callix
    ) as details
FROM api.segmento_execucao_log el
JOIN api.segmento_automatico s ON s.id = el.segmento_id

ORDER BY created_at DESC;

-- 7. FUNÇÃO PARA ATUALIZAR PRÓXIMA EXECUÇÃO
CREATE OR REPLACE FUNCTION api.atualizar_proxima_execucao_segmento()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o segmento está ativo e tem frequência definida
    IF NEW.ativo = true AND NEW.frequencia_horas > 0 THEN
        -- Calcular próxima execução baseada na última execução ou agora
        IF NEW.ultima_execucao IS NOT NULL THEN
            NEW.proxima_execucao = NEW.ultima_execucao + (NEW.frequencia_horas || ' hours')::INTERVAL;
        ELSE
            NEW.proxima_execucao = NOW();
        END IF;
    ELSE
        NEW.proxima_execucao = NULL;
    END IF;
    
    -- Atualizar timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. TRIGGER PARA ATUALIZAR PRÓXIMA EXECUÇÃO
CREATE TRIGGER trigger_atualizar_proxima_execucao_segmento
    BEFORE INSERT OR UPDATE ON api.segmento_automatico
    FOR EACH ROW
    EXECUTE FUNCTION api.atualizar_proxima_execucao_segmento();

-- 9. FUNÇÃO PARA EXECUTAR SEGMENTO (chamada via API)
CREATE OR REPLACE FUNCTION api.executar_segmento_automatico(p_segmento_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_segmento api.segmento_automatico%ROWTYPE;
    v_log_id INTEGER;
    v_start_time TIMESTAMP;
    v_leads_count INTEGER;
    v_result JSONB;
BEGIN
    v_start_time := NOW();
    
    -- Buscar segmento
    SELECT * INTO v_segmento 
    FROM api.segmento_automatico 
    WHERE id = p_segmento_id AND ativo = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Segmento não encontrado ou inativo'
        );
    END IF;
    
    -- Criar log de execução
    INSERT INTO api.segmento_execucao_log (segmento_id, status, message)
    VALUES (p_segmento_id, 'running', 'Iniciando execução do segmento')
    RETURNING id INTO v_log_id;
    
    -- Aqui você implementaria a lógica específica de busca de leads
    -- Por enquanto, vou simular
    v_leads_count := 0;
    
    -- Atualizar log com sucesso
    UPDATE api.segmento_execucao_log 
    SET 
        status = 'success',
        message = 'Execução concluída com sucesso',
        leads_processados = v_leads_count,
        finished_at = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER
    WHERE id = v_log_id;
    
    -- Atualizar estatísticas do segmento
    UPDATE api.segmento_automatico 
    SET 
        ultima_execucao = NOW(),
        total_leads = total_leads + v_leads_count,
        updated_at = NOW()
    WHERE id = p_segmento_id;
    
    -- Retornar resultado
    v_result := jsonb_build_object(
        'success', true,
        'segmento_id', p_segmento_id,
        'leads_processados', v_leads_count,
        'tempo_execucao', EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Atualizar log com erro
        UPDATE api.segmento_execucao_log 
        SET 
            status = 'error',
            message = 'Erro na execução: ' || SQLERRM,
            error_message = SQLERRM,
            finished_at = NOW(),
            duration_seconds = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER
        WHERE id = v_log_id;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- 10. PERMISSÕES
GRANT ALL ON api.segmento_automatico TO service_role;
GRANT ALL ON api.segmento_execucao_log TO service_role;
GRANT ALL ON api.segmento_lead TO service_role;
GRANT SELECT ON api.vw_segmento_status TO service_role;
GRANT SELECT ON api.vw_logs_execucao TO service_role;
GRANT EXECUTE ON FUNCTION api.executar_segmento_automatico(INTEGER) TO service_role;

-- 11. COMENTÁRIOS
COMMENT ON TABLE api.segmento_automatico IS 'Tabela principal de segmentos automáticos para execução periódica';
COMMENT ON TABLE api.segmento_execucao_log IS 'Logs de execução dos segmentos automáticos';
COMMENT ON TABLE api.segmento_lead IS 'Histórico de leads processados por segmento';
COMMENT ON VIEW api.vw_segmento_status IS 'View para monitoramento do status dos segmentos';
COMMENT ON VIEW api.vw_logs_execucao IS 'View combinada de logs de cron jobs e segmentos';

-- 12. DADOS DE EXEMPLO (opcional)
INSERT INTO api.segmento_automatico (nome, segmento_key, descricao, criterios, enviar_callix, lista_callix_id) 
VALUES 
(
    'REATIVAÇÃO 13-10',
    'reativacao_13_10',
    'Segmento de reativação de clientes inativos há mais de 13 meses',
    '{"recencia_minima": 13, "valor_minimo": 1000, "status": "hibernando"}'::jsonb,
    true,
    22
);

-- 13. ATUALIZAR PRÓXIMA EXECUÇÃO DOS SEGMENTOS EXISTENTES
UPDATE api.segmento_automatico 
SET proxima_execucao = NOW() 
WHERE ativo = true AND proxima_execucao IS NULL;

