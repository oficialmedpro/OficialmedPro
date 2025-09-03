-- Exemplo de inserção de credenciais do Google Ads
-- IMPORTANTE: Substitua os valores pelos seus dados reais

INSERT INTO google_ads_credentials (
    customer_id,
    developer_token,
    client_id,
    client_secret,
    refresh_token,
    is_active
) VALUES (
    '123-456-7890',  -- Substitua pelo seu Customer ID
    'seu_developer_token_aqui',  -- Substitua pelo seu Developer Token
    'seu_client_id_aqui',  -- Substitua pelo seu Client ID
    'seu_client_secret_aqui',  -- Substitua pelo seu Client Secret
    'seu_refresh_token_aqui',  -- Substitua pelo seu Refresh Token
    true
);

-- Verificar se foi inserido corretamente
SELECT 
    id,
    customer_id,
    CASE 
        WHEN developer_token IS NOT NULL THEN 'Configurado'
        ELSE 'Não configurado'
    END as developer_token_status,
    CASE 
        WHEN client_id IS NOT NULL THEN 'Configurado'
        ELSE 'Não configurado'
    END as client_id_status,
    CASE 
        WHEN client_secret IS NOT NULL THEN 'Configurado'
        ELSE 'Não configurado'
    END as client_secret_status,
    CASE 
        WHEN refresh_token IS NOT NULL THEN 'Configurado'
        ELSE 'Não configurado'
    END as refresh_token_status,
    is_active,
    created_at
FROM google_ads_credentials
ORDER BY created_at DESC;
