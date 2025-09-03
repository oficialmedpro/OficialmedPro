-- Criar tabela para credenciais do Google Ads
CREATE TABLE IF NOT EXISTS google_ads_credentials (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(20) NOT NULL,           -- 123-456-7890
    developer_token TEXT NOT NULL,              -- Token aprovado
    client_id TEXT NOT NULL,                    -- OAuth2 Client ID
    client_secret TEXT NOT NULL,                -- OAuth2 Client Secret
    refresh_token TEXT NOT NULL,                -- OAuth2 Refresh Token
    is_active BOOLEAN DEFAULT true,             -- Se está ativo
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comentários para documentar a tabela
COMMENT ON TABLE google_ads_credentials IS 'Armazena as credenciais da API do Google Ads';
COMMENT ON COLUMN google_ads_credentials.customer_id IS 'ID da conta do Google Ads (formato: 123-456-7890)';
COMMENT ON COLUMN google_ads_credentials.developer_token IS 'Token de desenvolvedor aprovado pelo Google';
COMMENT ON COLUMN google_ads_credentials.client_id IS 'Client ID do OAuth2 do Google Cloud Console';
COMMENT ON COLUMN google_ads_credentials.client_secret IS 'Client Secret do OAuth2 do Google Cloud Console';
COMMENT ON COLUMN google_ads_credentials.refresh_token IS 'Refresh Token do OAuth2 para renovação automática';
COMMENT ON COLUMN google_ads_credentials.is_active IS 'Indica se esta credencial está ativa e deve ser usada';

-- Índice para busca rápida de credenciais ativas
CREATE INDEX IF NOT EXISTS idx_google_ads_credentials_active 
ON google_ads_credentials(is_active, created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_google_ads_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_google_ads_credentials_updated_at
    BEFORE UPDATE ON google_ads_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_google_ads_credentials_updated_at();
