-- ========================================
-- 🔧 CORREÇÃO DO ERRO DE TRIGGER
-- ========================================
-- Data: 2025-01-21
-- Objetivo: Corrigir erro de trigger já existente
-- Schema: api
-- ========================================

-- ========================================
-- 1️⃣ VERIFICAR TRIGGERS EXISTENTES
-- ========================================

-- Verificar se o trigger já existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'api' 
  AND event_object_table = 'metas';

-- ========================================
-- 2️⃣ REMOVER TRIGGER EXISTENTE (se necessário)
-- ========================================

-- Remover o trigger existente se ele estiver causando problemas
DROP TRIGGER IF EXISTS trigger_update_metas_updated_at ON api.metas;

-- ========================================
-- 3️⃣ RECRIAR O TRIGGER
-- ========================================

-- Recriar o trigger
CREATE TRIGGER trigger_update_metas_updated_at
    BEFORE UPDATE ON api.metas
    FOR EACH ROW
    EXECUTE FUNCTION update_metas_updated_at();

-- ========================================
-- 4️⃣ VERIFICAR SE O TRIGGER FOI CRIADO
-- ========================================

-- Verificar se o trigger foi criado corretamente
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'api' 
  AND event_object_table = 'metas'
  AND trigger_name = 'trigger_update_metas_updated_at';

-- ========================================
-- 5️⃣ TESTAR O TRIGGER
-- ========================================

-- Testar se o trigger está funcionando
-- (Descomente para testar)
/*
UPDATE api.metas 
SET observacoes = 'Teste do trigger em ' || NOW()
WHERE id = 1;

-- Verificar se data_atualizacao foi atualizada
SELECT id, observacoes, data_atualizacao 
FROM api.metas 
WHERE id = 1;
*/

-- ========================================
-- ✅ SCRIPT DE CORREÇÃO CONCLUÍDO
-- ========================================

-- Se ainda houver problemas, execute:
-- 1. DROP TRIGGER IF EXISTS trigger_update_metas_updated_at ON api.metas;
-- 2. DROP FUNCTION IF EXISTS update_metas_updated_at();
-- 3. Execute novamente o script original



