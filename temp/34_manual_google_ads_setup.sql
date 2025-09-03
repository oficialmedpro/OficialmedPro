-- =====================================================
-- SCRIPT PARA EXECUTAR MANUALMENTE NO SUPABASE DASHBOARD
-- =====================================================
-- 
-- INSTRUÇÕES:
-- 1. Copie este script completo
-- 2. Vá para o Supabase Dashboard > SQL Editor
-- 3. Cole o script e execute
-- 4. Isso configurará a sincronização automática
--
-- =====================================================

-- PASSO 1: Configurar Customer IDs específicos para cada unidade
-- ===============================================================

-- OficialMed Apucarana (ID=1) - Manter como Manager
UPDATE api.unidades 
SET 
    google_customer_id = '739-617-8858',  -- Conta Manager
    google_ads_active = true
WHERE id = 1;

-- Bom Jesus (ID=3)
UPDATE api.unidades 
SET 
    google_customer_id = '5979656533',  -- OficialMed Bom Jesus
    google_ads_active = true
WHERE id = 3;

-- Belo Horizonte (ID=4)
UPDATE api.unidades 
SET 
    google_customer_id = '9877997617',  -- OficialMed Belo Horizonte
    google_ads_active = true
WHERE id = 4;

-- Londrina (ID=5)
UPDATE api.unidades 
SET 
    google_customer_id = '9385784147',  -- OficialMed Londrina
    google_ads_active = true
WHERE id = 5;

-- Arapongas (ID=6)
UPDATE api.unidades 
SET 
    google_customer_id = '3283035994',  -- OficialMed Arapongas
    google_ads_active = true
WHERE id = 6;

-- Balneário Camboriú (ID=7)
UPDATE api.unidades 
SET 
    google_customer_id = '8619286323',  -- OficialMed Balneário Camboriú
    google_ads_active = true
WHERE id = 7;

-- PASSO 2: Sincronizar credenciais principais da Apucarana para todas as unidades
-- ===============================================================================

UPDATE api.unidades 
SET 
    google_developer_token = (SELECT google_developer_token FROM api.unidades WHERE id = 1),
    google_client_id = (SELECT google_client_id FROM api.unidades WHERE id = 1),
    google_client_secret = (SELECT google_client_secret FROM api.unidades WHERE id = 1),
    google_refresh_token = (SELECT google_refresh_token FROM api.unidades WHERE id = 1)
WHERE id != 1 
AND google_ads_active = true;

-- PASSO 3: Criar função de sincronização automática
-- ==================================================

CREATE OR REPLACE FUNCTION sync_google_ads_credentials()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a unidade Apucarana (ID=1) foi atualizada
    IF NEW.id = 1 AND (
        OLD.google_developer_token IS DISTINCT FROM NEW.google_developer_token OR
        OLD.google_client_id IS DISTINCT FROM NEW.google_client_id OR
        OLD.google_client_secret IS DISTINCT FROM NEW.google_client_secret OR
        OLD.google_refresh_token IS DISTINCT FROM NEW.google_refresh_token
    ) THEN
        -- Atualizar todas as outras unidades com as credenciais principais
        UPDATE api.unidades 
        SET 
            google_developer_token = NEW.google_developer_token,
            google_client_id = NEW.google_client_id,
            google_client_secret = NEW.google_client_secret,
            google_refresh_token = NEW.google_refresh_token
        WHERE id != 1 
        AND google_ads_active = true;  -- Só atualizar unidades ativas
        
        -- Log da sincronização
        RAISE NOTICE 'Credenciais Google Ads sincronizadas para todas as unidades ativas';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 4: Criar o trigger
-- =========================

DROP TRIGGER IF EXISTS trigger_sync_google_ads ON api.unidades;
CREATE TRIGGER trigger_sync_google_ads
    AFTER UPDATE ON api.unidades
    FOR EACH ROW
    EXECUTE FUNCTION sync_google_ads_credentials();

-- PASSO 5: Verificar resultado
-- ============================

SELECT 
    id,
    nome,
    google_customer_id,
    CASE 
        WHEN google_developer_token IS NOT NULL THEN '✅ Sincronizado'
        ELSE '❌ Não configurado'
    END as credenciais_status,
    google_ads_active
FROM api.unidades 
ORDER BY id;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- 
-- ID | NOME                    | CUSTOMER_ID    | CREDENCIAIS | ATIVO
-- ---|------------------------|----------------|-------------|-------
-- 1  | APUCARANA - FRANQUEADORA| 739-617-8858   | ✅ Sincronizado | true
-- 3  | BOM JESUS              | 5979656533     | ✅ Sincronizado | true  
-- 4  | BELO HORIZONTE         | 9877997617     | ✅ Sincronizado | true
-- 5  | LONDRINA               | 9385784147     | ✅ Sincronizado | true
-- 6  | ARAPONGAS              | 3283035994     | ✅ Sincronizado | true
-- 7  | BALNEÁRIO CAMBORIÚ     | 8619286323     | ✅ Sincronizado | true
--
-- =====================================================
