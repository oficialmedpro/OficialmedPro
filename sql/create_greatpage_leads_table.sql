-- Criar tabela greatpage_leads no schema api
CREATE TABLE IF NOT EXISTS api.greatpage_leads (
    id BIGSERIAL PRIMARY KEY,
    
    -- Dados pessoais
    nome_completo TEXT,
    email TEXT NOT NULL,
    telefone TEXT,
    
    -- Dados de privacidade (quando disponível)
    politicas_privacidade BOOLEAN DEFAULT FALSE,
    
    -- Dados de origem e tracking
    referral_source TEXT,
    dispositivo TEXT,
    url TEXT,
    ip_usuario TEXT,
    data_conversao TIMESTAMP WITH TIME ZONE,
    id_formulario TEXT,
    
    -- Dados geográficos
    pais_usuario TEXT DEFAULT 'BR',
    regiao_usuario TEXT,
    cidade_usuario TEXT,
    
    -- Tags para identificar origem da planilha
    planilha_tag TEXT NOT NULL, -- Ex: oms_maringa, oms_ponta_grossa, facebook, etc.
    arquivo_origem TEXT NOT NULL, -- Nome do arquivo CSV original
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_greatpage_leads_email ON api.greatpage_leads(email);
CREATE INDEX IF NOT EXISTS idx_greatpage_leads_planilha_tag ON api.greatpage_leads(planilha_tag);
CREATE INDEX IF NOT EXISTS idx_greatpage_leads_data_conversao ON api.greatpage_leads(data_conversao);
CREATE INDEX IF NOT EXISTS idx_greatpage_leads_cidade ON api.greatpage_leads(cidade_usuario);
CREATE INDEX IF NOT EXISTS idx_greatpage_leads_referral_source ON api.greatpage_leads(referral_source);

-- Criar índice composto para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_greatpage_leads_planilha_data ON api.greatpage_leads(planilha_tag, data_conversao);

-- Adicionar constraint para garantir que email seja único por planilha
CREATE UNIQUE INDEX IF NOT EXISTS idx_greatpage_leads_email_planilha 
ON api.greatpage_leads(email, planilha_tag) 
WHERE email IS NOT NULL AND email != '';

-- Comentários para documentação
COMMENT ON TABLE api.greatpage_leads IS 'Tabela para armazenar leads capturados via Greatpages';
COMMENT ON COLUMN api.greatpage_leads.planilha_tag IS 'Tag identificando a origem da planilha (ex: oms_maringa, facebook, etc.)';
COMMENT ON COLUMN api.greatpage_leads.arquivo_origem IS 'Nome do arquivo CSV original de onde veio o lead';
COMMENT ON COLUMN api.greatpage_leads.politicas_privacidade IS 'Indica se o usuário aceitou as políticas de privacidade (quando disponível)';
COMMENT ON COLUMN api.greatpage_leads.referral_source IS 'Fonte de tráfego (Google, Facebook, Instagram, etc.)';
COMMENT ON COLUMN api.greatpage_leads.dispositivo IS 'Tipo de dispositivo (Mobile, Desktop)';
COMMENT ON COLUMN api.greatpage_leads.id_formulario IS 'ID único do formulário no Greatpages';


