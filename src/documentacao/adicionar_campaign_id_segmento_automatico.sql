-- ========================================
-- ADICIONAR CAMPAIGN_ID NA TABELA SEGMENTO_AUTOMATICO
-- ========================================
-- Data: 2025-10-14
-- Objetivo: Adicionar campo campaign_id para armazenar ID da lista Callix
-- ========================================

-- 1. Adicionar coluna campaign_id
ALTER TABLE api.segmento_automatico 
ADD COLUMN IF NOT EXISTS campaign_id INTEGER;

-- 2. Comentário na coluna
COMMENT ON COLUMN api.segmento_automatico.campaign_id IS 'ID da lista Callix onde os leads serão enviados';

-- 3. Atualizar registros existentes com valor padrão
UPDATE api.segmento_automatico 
SET campaign_id = 7 
WHERE campaign_id IS NULL;

-- 4. Verificar se foi adicionado corretamente
SELECT 
    id,
    segmento_id,
    nome,
    campaign_id,
    enviar_callix
FROM api.segmento_automatico
ORDER BY id;

-- 5. Mostrar estrutura da tabela atualizada
\d api.segmento_automatico;