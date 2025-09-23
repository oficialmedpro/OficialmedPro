-- Script para atualizar o refresh token do Google Ads
-- Execute este comando no Supabase SQL Editor ou via psql

-- Primeiro, vamos ver todas as unidades e suas configurações atuais
SELECT 
    id,
    unidade,
    codigo_sprint,
    google_customer_id,
    google_ads_active,
    CASE 
        WHEN google_developer_token IS NOT NULL THEN '✅ Presente'
        ELSE '❌ Ausente'
    END as developer_token_status,
    CASE 
        WHEN google_client_id IS NOT NULL THEN '✅ Presente'
        ELSE '❌ Ausente'
    END as client_id_status,
    CASE 
        WHEN google_client_secret IS NOT NULL THEN '✅ Presente'
        ELSE '❌ Ausente'
    END as client_secret_status,
    CASE 
        WHEN google_refresh_token IS NOT NULL THEN '✅ Presente (pode estar expirado)'
        ELSE '❌ Ausente'
    END as refresh_token_status
FROM api.unidades 
WHERE google_ads_active = true 
   OR google_customer_id IS NOT NULL
ORDER BY unidade;

-- ========================================
-- DEPOIS DE VERIFICAR QUAL UNIDADE ATUALIZAR, 
-- DESCOMENTE E EXECUTE O COMANDO ABAIXO:
-- ========================================

-- ATUALIZAR O REFRESH TOKEN DA UNIDADE APUCARANA
UPDATE api.unidades 
SET google_refresh_token = '1//04nHcHKOeHaq4CgYIARAAGAQSNwF-L9IrV-LGJvuj8k6i6sav-tck58gjx-uukRjTh3E92lluUJn-GOBaVvQgJdMvazRBaHs9M'
WHERE unidade ILIKE '%apucarana%' 
   OR google_customer_id = '880-203-9556';

-- ========================================
-- VERIFICAR APÓS A ATUALIZAÇÃO:
-- ========================================

-- SELECT 
--     unidade,
--     google_customer_id,
--     google_ads_active,
--     'Token atualizado em ' || NOW()::timestamp as status
-- FROM api.unidades 
-- WHERE google_refresh_token = '1//04nHcHKOeHaq4CgYIARAAGAQSNwF-L9IrV-LGJvuj8k6i6sav-tck58gjx-uukRjTh3E92lluUJn-GOBaVvQgJdMvazRBaHs9M';
