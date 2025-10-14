-- ========================================
-- PASSO A PASSO: CONFIGURAÇÃO COMPLETA
-- Execute na ordem exata descrita abaixo
-- ========================================

-- ========================================
-- PASSO 1: CRIAR AS TABELAS
-- ========================================

-- 1.1 Tabela para controlar segmentos automáticos
CREATE TABLE IF NOT EXISTS api.segmento_automatico (
    id SERIAL PRIMARY KEY,
    segmento_id BIGINT NOT NULL UNIQUE, -- Adicionado UNIQUE para evitar duplicatas
    nome VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    enviar_callix BOOLEAN DEFAULT false,
    frequencia_horas INTEGER DEFAULT 6,
    ultima_execucao TIMESTAMP WITH TIME ZONE,
    proxima_execucao TIMESTAMP WITH TIME ZONE,
    total_leads_processados INTEGER DEFAULT 0,
    total_leads_enviados_callix INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 Tabela para controlar leads já enviados para Callix
CREATE TABLE IF NOT EXISTS api.lead_callix_status (
    id SERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    segmento_id BIGINT NOT NULL,
    enviado_callix BOOLEAN DEFAULT false,
    data_envio_callix TIMESTAMP WITH TIME ZONE,
    callix_id VARCHAR(255),
    status_callix VARCHAR(50),
    tentativas_envio INTEGER DEFAULT 0,
    ultimo_erro TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lead_id, segmento_id)
);

-- 1.3 Adicionar campos de controle na tabela leads
ALTER TABLE api.leads 
ADD COLUMN IF NOT EXISTS enviado_callix BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_envio_callix TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS callix_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS status_callix VARCHAR(50);

-- ========================================
-- PASSO 2: CRIAR ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_segmento_automatico_ativo 
    ON api.segmento_automatico(ativo) WHERE ativo = true;
    
CREATE INDEX IF NOT EXISTS idx_segmento_automatico_proxima_execucao 
    ON api.segmento_automatico(proxima_execucao);
    
CREATE INDEX IF NOT EXISTS idx_lead_callix_status_lead_id 
    ON api.lead_callix_status(lead_id);
    
CREATE INDEX IF NOT EXISTS idx_lead_callix_status_segmento 
    ON api.lead_callix_status(segmento_id);
    
CREATE INDEX IF NOT EXISTS idx_leads_enviado_callix 
    ON api.leads(enviado_callix) WHERE enviado_callix = false;

-- ========================================
-- PASSO 3: CONFIGURAR PERMISSÕES RLS
-- ========================================

-- 3.1 Habilitar RLS
ALTER TABLE api.segmento_automatico ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.lead_callix_status ENABLE ROW LEVEL SECURITY;

-- 3.2 Políticas para segmento_automatico
DROP POLICY IF EXISTS "Allow select for authenticated users (segmento_automatico)" ON api.segmento_automatico;
DROP POLICY IF EXISTS "Allow insert for authenticated users (segmento_automatico)" ON api.segmento_automatico;
DROP POLICY IF EXISTS "Allow update for authenticated users (segmento_automatico)" ON api.segmento_automatico;
DROP POLICY IF EXISTS "Allow delete for authenticated users (segmento_automatico)" ON api.segmento_automatico;

CREATE POLICY "Allow select for authenticated users (segmento_automatico)" 
    ON api.segmento_automatico FOR SELECT USING (true);
    
CREATE POLICY "Allow insert for authenticated users (segmento_automatico)" 
    ON api.segmento_automatico FOR INSERT WITH CHECK (true);
    
CREATE POLICY "Allow update for authenticated users (segmento_automatico)" 
    ON api.segmento_automatico FOR UPDATE USING (true) WITH CHECK (true);
    
CREATE POLICY "Allow delete for authenticated users (segmento_automatico)" 
    ON api.segmento_automatico FOR DELETE USING (true);

-- 3.3 Políticas para lead_callix_status
DROP POLICY IF EXISTS "Allow select for authenticated users (lead_callix_status)" ON api.lead_callix_status;
DROP POLICY IF EXISTS "Allow insert for authenticated users (lead_callix_status)" ON api.lead_callix_status;
DROP POLICY IF EXISTS "Allow update for authenticated users (lead_callix_status)" ON api.lead_callix_status;
DROP POLICY IF EXISTS "Allow delete for authenticated users (lead_callix_status)" ON api.lead_callix_status;

CREATE POLICY "Allow select for authenticated users (lead_callix_status)" 
    ON api.lead_callix_status FOR SELECT USING (true);
    
CREATE POLICY "Allow insert for authenticated users (lead_callix_status)" 
    ON api.lead_callix_status FOR INSERT WITH CHECK (true);
    
CREATE POLICY "Allow update for authenticated users (lead_callix_status)" 
    ON api.lead_callix_status FOR UPDATE USING (true) WITH CHECK (true);
    
CREATE POLICY "Allow delete for authenticated users (lead_callix_status)" 
    ON api.lead_callix_status FOR DELETE USING (true);

-- ========================================
-- PASSO 4: CONFIGURAR GRANTS
-- ========================================

GRANT SELECT ON api.segmento_automatico TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.segmento_automatico TO authenticated;
GRANT ALL ON api.segmento_automatico TO service_role;

GRANT SELECT ON api.lead_callix_status TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.lead_callix_status TO authenticated;
GRANT ALL ON api.lead_callix_status TO service_role;

-- Grant para sequences
GRANT USAGE, SELECT ON SEQUENCE api.segmento_automatico_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE api.lead_callix_status_id_seq TO authenticated;

-- ========================================
-- PASSO 5: CRIAR FUNÇÃO E TRIGGERS
-- ========================================

-- 5.1 Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5.2 Triggers para updated_at
DROP TRIGGER IF EXISTS update_segmento_automatico_updated_at ON api.segmento_automatico;
CREATE TRIGGER update_segmento_automatico_updated_at 
    BEFORE UPDATE ON api.segmento_automatico 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_callix_status_updated_at ON api.lead_callix_status;
CREATE TRIGGER update_lead_callix_status_updated_at 
    BEFORE UPDATE ON api.lead_callix_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ✅ VERIFICAÇÃO: Confirmar que tudo foi criado
-- ========================================

SELECT 'Tabelas criadas:' as tipo, table_name 
FROM information_schema.tables 
WHERE table_schema = 'api' 
AND table_name IN ('segmento_automatico', 'lead_callix_status')

UNION ALL

SELECT 'Políticas criadas:' as tipo, policyname 
FROM pg_policies 
WHERE schemaname = 'api' 
AND tablename IN ('segmento_automatico', 'lead_callix_status')

UNION ALL

SELECT 'Índices criados:' as tipo, indexname 
FROM pg_indexes 
WHERE schemaname = 'api' 
AND tablename IN ('segmento_automatico', 'lead_callix_status');

-- ========================================
-- PRÓXIMOS PASSOS MANUAIS:
-- ========================================
-- 1. Execute: src/documentacao/debug_segmentos.sql
--    Para verificar quais segmentos existem
--
-- 2. Configure o cron job:
--    src/documentacao/auto_segments_cron_setup.sql
--
-- 3. Use a interface web para adicionar segmentos automáticos
--    ou execute manualmente o INSERT abaixo com o ID correto
-- ========================================
