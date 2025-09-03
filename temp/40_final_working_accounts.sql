-- =====================================================
-- CONFIGURAÇÃO FINAL - CONTAS COM CAMPANHAS ATIVAS
-- =====================================================
-- 
-- EXECUTE ESTE SCRIPT NO SUPABASE DASHBOARD > SQL EDITOR
-- 
-- Baseado no dashboard do Google Ads, configurando as contas que realmente
-- têm campanhas ativas e estão gerando dados.
--
-- =====================================================

-- PASSO 1: Configurar Customer IDs para as contas que funcionam e têm campanhas ativas
-- ================================================================================

-- Apucarana (ID=1) - Conta Manager Principal (pode acessar todas)
UPDATE api.unidades 
SET 
    google_customer_id = '739-617-8858',  -- MATRIZ OficialMed (Manager)
    google_ads_active = true
WHERE id = 1;

-- Bom Jesus (ID=3) - TEM CAMPANHAS ATIVAS (7 cliques, 117 impressões, R$ 95.38)
UPDATE api.unidades 
SET 
    google_customer_id = '597-965-6533',  -- OficialMed Bom Jesus
    google_ads_active = true
WHERE id = 3;

-- Londrina (ID=5) - TEM CAMPANHAS ATIVAS (18 cliques, 145 impressões, R$ 83.72)
UPDATE api.unidades 
SET 
    google_customer_id = '938-578-4147',  -- OficialMed Londrina
    google_ads_active = true
WHERE id = 5;

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
        AND google_ads_active = true;
        
        RAISE NOTICE 'Credenciais Google Ads sincronizadas para todas as unidades ativas';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 4: Criar trigger
-- =======================

DROP TRIGGER IF EXISTS trigger_sync_google_ads ON api.unidades;
CREATE TRIGGER trigger_sync_google_ads
    AFTER UPDATE ON api.unidades
    FOR EACH ROW
    EXECUTE FUNCTION sync_google_ads_credentials();

-- PASSO 5: Verificar configuração final
-- =====================================

SELECT 
    id,
    nome,
    google_customer_id,
    CASE 
        WHEN google_developer_token IS NOT NULL THEN '✅ Configurado'
        ELSE '❌ Não configurado'
    END as credenciais_status,
    google_ads_active
FROM api.unidades 
WHERE google_ads_active = true
ORDER BY id;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- 
-- ID | NOME                    | CUSTOMER_ID    | CREDENCIAIS | ATIVO
-- ---|------------------------|----------------|-------------|-------
-- 1  | APUCARANA - FRANQUEADORA| 739-617-8858   | ✅ Configurado | true
-- 3  | BOM JESUS              | 597-965-6533   | ✅ Configurado | true  
-- 5  | LONDRINA               | 938-578-4147   | ✅ Configurado | true
--
-- =====================================================
-- 
-- CONTAS CONFIGURADAS (COM CAMPANHAS ATIVAS):
-- ============================================
-- 
-- 1. APUCARANA - FRANQUEADORA (ID=1)
--    - Customer ID: 739-617-8858 (MATRIZ OficialMed)
--    - Tipo: Conta Manager (pode acessar todas as outras)
--    - Campanhas: 0 (conta de gerenciamento)
-- 
-- 2. BOM JESUS (ID=3) 
--    - Customer ID: 597-965-6533 (OficialMed Bom Jesus)
--    - Tipo: Conta de anúncios
--    - Dados ativos: 7 cliques, 117 impressões, R$ 95.38
--    - Conversões: 3.00
--    - CTR: 5.98%
-- 
-- 3. LONDRINA (ID=5)
--    - Customer ID: 938-578-4147 (OficialMed Londrina)
--    - Tipo: Conta de anúncios  
--    - Dados ativos: 18 cliques, 145 impressões, R$ 83.72
--    - Conversões: 7.00
--    - CTR: 12.41%
--
-- =====================================================
-- 
-- COMO USAR NO DASHBOARD:
-- =======================
-- 
-- 1. Usuário seleciona unidade na interface
-- 2. Sistema carrega credenciais da unidade selecionada
-- 3. Se precisar trocar credenciais principais:
--    - Atualize apenas na unidade Apucarana (ID=1)
--    - Trigger sincroniza automaticamente para todas
-- 
-- 4. Para usar contas específicas:
--    - Atualize apenas o google_customer_id da unidade
--    - Mantenha as credenciais principais (OAuth2, Developer Token)
-- 
-- 5. Contas disponíveis para uso (COM DADOS REAIS):
--    - Manager: 739-617-8858 (acessa todas as contas)
--    - Bom Jesus: 597-965-6533 (7 cliques, R$ 95.38)
--    - Londrina: 938-578-4147 (18 cliques, R$ 83.72)
--
-- =====================================================
