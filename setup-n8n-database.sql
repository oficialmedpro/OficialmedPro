-- =====================================================
-- Script de Preparação do Banco de Dados N8N
-- Oficial Med
-- =====================================================

-- Criar o banco de dados n8n
CREATE DATABASE n8n
  WITH 
  ENCODING = 'UTF8'
  LC_COLLATE = 'pt_BR.UTF-8'
  LC_CTYPE = 'pt_BR.UTF-8'
  TEMPLATE = template0;

-- Comentário descritivo
COMMENT ON DATABASE n8n IS 'Banco de dados para n8n - Automação de Workflows';

-- Conectar ao banco n8n
\c n8n

-- Garantir que o usuário postgres tem permissões
GRANT ALL PRIVILEGES ON DATABASE n8n TO postgres;

-- Criar extensões úteis (opcional, mas recomendado)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Verificação
SELECT 
  datname as "Database",
  pg_encoding_to_char(encoding) as "Encoding",
  datcollate as "Collate",
  datctype as "Ctype"
FROM pg_database 
WHERE datname = 'n8n';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- NOTA: O n8n criará automaticamente as tabelas necessárias
-- na primeira inicialização. Não é necessário criar schemas
-- manualmente.

