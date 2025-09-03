-- =====================================================
-- ESTRATÉGIA DE SINCRONIZAÇÃO GOOGLE ADS
-- =====================================================
-- 
-- CONCEITO:
-- 1. Unidade Apucarana (ID=1) = FONTE das credenciais principais
-- 2. Todas as outras unidades = Herdam credenciais principais
-- 3. Cada unidade = Tem seu próprio Customer ID específico
-- 4. Trigger = Sincroniza automaticamente quando Apucarana é atualizada
--
-- =====================================================

-- 1. PRIMEIRO: Limpar dados existentes para recomeçar
UPDATE api.unidades 
SET 
    google_customer_id = NULL,
    google_developer_token = NULL,
    google_client_id = NULL,
    google_client_secret = NULL,
    google_refresh_token = NULL,
    google_ads_active = false
WHERE id != 1;

-- 2. CONFIGURAR APUCARANA COMO FONTE PRINCIPAL
UPDATE api.unidades 
SET 
    google_customer_id = '739-617-8858',  -- Conta Manager (pode acessar todas)
    google_developer_token = 'xw46jmZN-n_wf7uCsC8daA',
    google_client_id = '415018341135-v3hjpjgqek6688r5eio8tl48229qbrrd.apps.googleusercontent.com',
    google_client_secret = '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',
    google_refresh_token = '1//04FuT2ZSozaiCCgYIARAAGAQSNwF-L9IrAWfJ05xcGt1wgsEd8OuqiDQLgiAVfLgT5_LEYd10jSOtifOTugN_gqb0BBDyNU1Q0f0',
    google_ads_active = true
WHERE id = 1;

-- 3. CONFIGURAR CUSTOMER IDs ESPECÍFICOS PARA CADA UNIDADE
-- (Baseado na lista que obtivemos)

-- OficialMed Apucarana
UPDATE api.unidades 
SET 
    google_customer_id = '8802039556',  -- OficialMed Apucarana
    google_ads_active = true
WHERE nome LIKE '%Apucarana%' AND id != 1;

-- OficialMed Arapongas  
UPDATE api.unidades 
SET 
    google_customer_id = '3283035994',  -- OficialMed Arapongas
    google_ads_active = true
WHERE nome LIKE '%Arapongas%';

-- OficialMed Balneário Camboriú
UPDATE api.unidades 
SET 
    google_customer_id = '8619286323',  -- OficialMed Balneário Camboriú
    google_ads_active = true
WHERE nome LIKE '%Balneário%' OR nome LIKE '%Camboriú%';

-- OficialMed Belo Horizonte
UPDATE api.unidades 
SET 
    google_customer_id = '9877997617',  -- OficialMed Belo Horizonte
    google_ads_active = true
WHERE nome LIKE '%Belo Horizonte%';

-- OficialMed Bom Jesus
UPDATE api.unidades 
SET 
    google_customer_id = '5979656533',  -- OficialMed Bom Jesus
    google_ads_active = true
WHERE nome LIKE '%Bom Jesus%';

-- OficialMed Londrina
UPDATE api.unidades 
SET 
    google_customer_id = '9385784147',  -- OficialMed Londrina
    google_ads_active = true
WHERE nome LIKE '%Londrina%';

-- Franchising - Oficial Med
UPDATE api.unidades 
SET 
    google_customer_id = '7939953031',  -- Franchising - Oficial Med
    google_ads_active = true
WHERE nome LIKE '%Franchising%';

-- OficialMed - Matriz Apucarana
UPDATE api.unidades 
SET 
    google_customer_id = '3018439482',  -- OficialMed - Matriz Apucarana
    google_ads_active = true
WHERE nome LIKE '%Matriz%' AND id != 1;

-- 4. CRIAR TRIGGER PARA SINCRONIZAÇÃO AUTOMÁTICA
-- ================================================

-- Função que será executada pelo trigger
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
            google_refresh_token = NEW.google_refresh_token,
            google_ads_active = NEW.google_ads_active
        WHERE id != 1 
        AND google_ads_active = true;  -- Só atualizar unidades ativas
        
        -- Log da sincronização
        RAISE NOTICE 'Credenciais Google Ads sincronizadas para todas as unidades ativas';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_sync_google_ads ON api.unidades;
CREATE TRIGGER trigger_sync_google_ads
    AFTER UPDATE ON api.unidades
    FOR EACH ROW
    EXECUTE FUNCTION sync_google_ads_credentials();

-- 5. EXECUTAR SINCRONIZAÇÃO INICIAL
-- ==================================
-- Aplicar as credenciais principais da Apucarana para todas as unidades ativas
UPDATE api.unidades 
SET 
    google_developer_token = (SELECT google_developer_token FROM api.unidades WHERE id = 1),
    google_client_id = (SELECT google_client_id FROM api.unidades WHERE id = 1),
    google_client_secret = (SELECT google_client_secret FROM api.unidades WHERE id = 1),
    google_refresh_token = (SELECT google_refresh_token FROM api.unidades WHERE id = 1)
WHERE id != 1 
AND google_ads_active = true;

-- 6. VERIFICAR RESULTADO
-- ======================
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
