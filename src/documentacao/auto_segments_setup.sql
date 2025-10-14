-- ========================================
-- CONFIGURAÇÃO DE SEGMENTOS AUTOMÁTICOS
-- ========================================

-- 1. Tabela para controlar segmentos automáticos
CREATE TABLE IF NOT EXISTS api.segmento_automatico (
    id SERIAL PRIMARY KEY,
    segmento_id BIGINT NOT NULL REFERENCES api.segmento(id),
    nome VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    enviar_callix BOOLEAN DEFAULT false,
    frequencia_horas INTEGER DEFAULT 6, -- A cada 6 horas
    ultima_execucao TIMESTAMP WITH TIME ZONE,
    proxima_execucao TIMESTAMP WITH TIME ZONE,
    total_leads_processados INTEGER DEFAULT 0,
    total_leads_enviados_callix INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela para controlar leads já enviados para Callix
CREATE TABLE IF NOT EXISTS api.lead_callix_status (
    id SERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    segmento_id BIGINT NOT NULL,
    enviado_callix BOOLEAN DEFAULT false,
    data_envio_callix TIMESTAMP WITH TIME ZONE,
    callix_id VARCHAR(255), -- ID do lead no Callix
    status_callix VARCHAR(50), -- contacted, not_contacted, converted, etc
    tentativas_envio INTEGER DEFAULT 0,
    ultimo_erro TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(lead_id, segmento_id)
);

-- 3. Adicionar campos de controle na tabela leads
ALTER TABLE api.leads 
ADD COLUMN IF NOT EXISTS enviado_callix BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_envio_callix TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS callix_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS status_callix VARCHAR(50);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_segmento_automatico_ativo ON api.segmento_automatico(ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_segmento_automatico_proxima_execucao ON api.segmento_automatico(proxima_execucao);
CREATE INDEX IF NOT EXISTS idx_lead_callix_status_lead_id ON api.lead_callix_status(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_callix_status_segmento ON api.lead_callix_status(segmento_id);
CREATE INDEX IF NOT EXISTS idx_leads_enviado_callix ON api.leads(enviado_callix) WHERE enviado_callix = false;

-- 5. Permissões RLS
ALTER TABLE api.segmento_automatico ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.lead_callix_status ENABLE ROW LEVEL SECURITY;

-- Políticas para segmento_automatico
CREATE POLICY "Allow select for authenticated users (segmento_automatico)" ON api.segmento_automatico FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users (segmento_automatico)" ON api.segmento_automatico FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users (segmento_automatico)" ON api.segmento_automatico FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for authenticated users (segmento_automatico)" ON api.segmento_automatico FOR DELETE USING (true);

-- Políticas para lead_callix_status
CREATE POLICY "Allow select for authenticated users (lead_callix_status)" ON api.lead_callix_status FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users (lead_callix_status)" ON api.lead_callix_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users (lead_callix_status)" ON api.lead_callix_status FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for authenticated users (lead_callix_status)" ON api.lead_callix_status FOR DELETE USING (true);

-- 6. Grants
GRANT SELECT ON api.segmento_automatico TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.segmento_automatico TO authenticated;
GRANT ALL ON api.segmento_automatico TO service_role;

GRANT SELECT ON api.lead_callix_status TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.lead_callix_status TO authenticated;
GRANT ALL ON api.lead_callix_status TO service_role;

-- 7. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_segmento_automatico_updated_at 
    BEFORE UPDATE ON api.segmento_automatico 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_callix_status_updated_at 
    BEFORE UPDATE ON api.lead_callix_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Exemplo de inserção de um segmento automático
INSERT INTO api.segmento_automatico (
    segmento_id, 
    nome, 
    ativo, 
    enviar_callix, 
    frequencia_horas,
    proxima_execucao
) VALUES (
    (SELECT id FROM api.segmento WHERE name LIKE '%D15%' LIMIT 1), -- Substitua pelo ID real do segmento D15
    'Segmento D15 - Automático',
    true,
    true,
    6, -- A cada 6 horas
    NOW() + INTERVAL '1 hour' -- Primeira execução em 1 hora
) ON CONFLICT DO NOTHING;
