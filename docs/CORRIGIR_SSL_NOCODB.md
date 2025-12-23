# 🔧 Corrigir Erro SSL no NocoDB

## ❌ Erro: "The server does not support SSL connections"

## ✅ Solução: Desabilitar SSL

### Método 1: Connection URL com sslmode=disable

Use esta URL completa (com `sslmode=disable` - substitua as variáveis pelos valores do `.env`):

```
postgres://${TYPEBOT_DB_USER}:${TYPEBOT_DB_PASSWORD}@${TYPEBOT_DB_HOST}:${TYPEBOT_DB_PORT}/${TYPEBOT_DB_NAME}?sslmode=disable
```

### Método 2: Campos Separados + Connection Parameters

1. **Preencha os campos (obtenha os valores do arquivo `.env`):**
   - Host: `${TYPEBOT_DB_HOST}`
   - Port: `${TYPEBOT_DB_PORT}`
   - Username: `${TYPEBOT_DB_USER}`
   - Password: `${TYPEBOT_DB_PASSWORD}`
   - Database: `${TYPEBOT_DB_NAME}`

2. **IMPORTANTE: Use SSL deve estar DESLIGADO** ❌

3. **Adicione Connection Parameters:**
   - Clique em **"+ Add"** em "Connection parameters"
   - Adicione:
     - **Nome:** `sslmode`
     - **Valor:** `disable`

4. **Ou adicione múltiplos parâmetros:**
   - `sslmode` = `disable`
   - `sslcert` = (deixe vazio ou não adicione)
   - `sslkey` = (deixe vazio ou não adicione)
   - `sslrootcert` = (deixe vazio ou não adicione)

### Método 3: Verificar Configuração do PostgreSQL

Se ainda não funcionar, podemos configurar o PostgreSQL para aceitar conexões sem SSL explicitamente:

```bash
# No servidor
CONTAINER="typebot_typebot-db.1.vpvn1mqvjvla3tv9vd70w7sdu"
PG_CONF=$(docker exec $CONTAINER find /var/lib/postgresql -name postgresql.conf 2>/dev/null | head -1)

# Adicionar configuração para aceitar conexões sem SSL
docker exec $CONTAINER sh -c "echo \"ssl = off\" >> $PG_CONF"

# Reiniciar
docker restart $CONTAINER
```

## 🎯 Configuração Recomendada (Garantida)

**Connection URL:**
```
postgres://${TYPEBOT_DB_USER}:${TYPEBOT_DB_PASSWORD}@${TYPEBOT_DB_HOST}:${TYPEBOT_DB_PORT}/${TYPEBOT_DB_NAME}?sslmode=disable&ssl=false
```

**Ou campos separados:**
- Use SSL: ❌ **DESLIGADO**
- Connection parameters:
  - `sslmode` = `disable`
  - `ssl` = `false`

## 🔍 Verificar se Funcionou

Após configurar, teste a conexão. Se ainda der erro SSL, tente:

1. **Limpar cache do navegador**
2. **Tentar em aba anônima**
3. **Verificar se salvou os parâmetros de conexão**

---

**Status:** Erro SSL identificado - use `sslmode=disable` na URL ou nos parâmetros



