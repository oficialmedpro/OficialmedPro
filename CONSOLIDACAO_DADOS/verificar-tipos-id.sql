-- Verificar tipos de ID de cada tabela
SELECT 
  table_name, 
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_schema = 'api' 
  AND column_name = 'id' 
  AND table_name IN ('leads', 'greatpage_leads', 'blacklabs', 'prime_clientes')
ORDER BY table_name;



















