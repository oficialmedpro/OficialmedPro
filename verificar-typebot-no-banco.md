# 🔍 Verificar Typebot no Banco de Dados

## Como verificar se o bot está realmente salvo no banco:

### Via SQL direto no PostgreSQL:

```sql
-- Conectar ao banco typebot
-- Usar as credenciais do DATABASE_URL

-- Verificar se existe o Public Typebot
SELECT id, "typebotId", name, "publicId", published 
FROM "PublicTypebot" 
WHERE "publicId" = 'clonazepan-3pom0x5';

-- Ver todos os typebots publicados
SELECT id, "typebotId", name, "publicId", published, "createdAt" 
FROM "PublicTypebot" 
WHERE published = true 
ORDER BY "createdAt" DESC;

-- Verificar o Typebot original
SELECT id, name, "publicId", published, "isArchived", "workspaceId"
FROM "Typebot" 
WHERE "publicId" LIKE '%clonazepan%' OR name LIKE '%clonazepan%';
```

### Via Easypanel (se tiver acesso ao banco):

1. Acesse o serviço `typebot-db`
2. Use um cliente PostgreSQL ou terminal
3. Execute as queries acima para verificar se o bot existe e está publicado




