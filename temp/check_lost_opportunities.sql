-- 🔍 VERIFICAR OPORTUNIDADES PERDIDAS DO FOLLOW UP
-- Buscar pelos números de WhatsApp fornecidos

SELECT 
    id,
    title,
    lead_whatsapp,
    status,
    loss_reason,
    lost_date,
    create_date,
    update_date,
    crm_column,
    synced_at
FROM oportunidade_sprint 
WHERE lead_whatsapp IN (
    '554484613022',
    '5541920037598', 
    '554388604004',
    '558398833870',
    '554184614400',
    '554399820728',
    '554396909575',
    '5511911736320',
    '554184781920',
    '554384222620',
    '554792905800',
    '554498765190',
    '5511982590697',
    '554391033346',
    '554199736648',
    '554396087910',
    '554791853028',
    '5511968959293',
    '555180570501',
    '554384118360',
    '554699789739'
)
AND crm_column = 85  -- Follow Up stage
ORDER BY update_date DESC;

-- Verificar quantas temos por status
SELECT 
    status,
    loss_reason,
    COUNT(*) as quantidade
FROM oportunidade_sprint 
WHERE lead_whatsapp IN (
    '554484613022', '5541920037598', '554388604004', '558398833870',
    '554184614400', '554399820728', '554396909575', '5511911736320',
    '554184781920', '554384222620', '554792905800', '554498765190',
    '5511982590697', '554391033346', '554199736648', '554396087910',
    '554791853028', '5511968959293', '555180570501', '554384118360',
    '554699789739'
)
AND crm_column = 85
GROUP BY status, loss_reason
ORDER BY quantidade DESC;

-- Verificar se algum não está no banco
SELECT 'Números não encontrados no Supabase:' as info;
WITH numeros_procurados AS (
    SELECT unnest(ARRAY[
        '554484613022', '5541920037598', '554388604004', '558398833870',
        '554184614400', '554399820728', '554396909575', '5511911736320',
        '554184781920', '554384222620', '554792905800', '554498765190',
        '5511982590697', '554391033346', '554199736648', '554396087910',
        '554791853028', '5511968959293', '555180570501', '554384118360',
        '554699789739'
    ]) as numero
)
SELECT np.numero as numero_ausente
FROM numeros_procurados np
LEFT JOIN oportunidade_sprint os ON os.lead_whatsapp = np.numero AND os.crm_column = 85
WHERE os.lead_whatsapp IS NULL;