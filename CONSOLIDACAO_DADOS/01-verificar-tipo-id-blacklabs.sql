-- Verificar tipo de ID da tabela blacklabs
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'api' 
  AND column_name = 'id' 
  AND table_name = 'blacklabs';

-- Verificar também os tipos de todas as FKs em clientes_mestre
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_schema = 'api' 
  AND table_name = 'clientes_mestre'
  AND column_name IN ('id_sprinthub', 'id_greatpage', 'id_blacklabs', 'id_prime')
ORDER BY column_name;



