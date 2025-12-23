# 🔧 Troubleshooting NocoDB - Conexão Typebot

> ⚠️ **SEGURANÇA:** Este arquivo foi atualizado para usar variáveis de ambiente.  
> Configure as credenciais no arquivo `.env` (que não é commitado no Git).  
> **NUNCA** coloque senhas diretamente neste arquivo ou em qualquer código!

## ✅ Confirmação: Banco Está Funcionando!

Teste executado com sucesso:
- ✅ Conexão estabelecida
- ✅ PostgreSQL 17.7 funcionando
- ✅ 10+ tabelas encontradas
- ✅ 11 Typebots no banco
- ✅ 5 Public Typebots

## 🔍 Problemas Comuns no NocoDB

### Problema 1: "database not supported"

**Causa:** NocoDB pode estar tentando usar um driver incompatível ou a conexão não está sendo aceita.

**Soluções:**

1. **Usar Connection URL ao invés de campos separados:**
   ```
   postgres://${TYPEBOT_DB_USER}:${TYPEBOT_DB_PASSWORD}@${TYPEBOT_DB_HOST}:${TYPEBOT_DB_PORT}/${TYPEBOT_DB_NAME}
   ```
   *Nota: Substitua as variáveis de ambiente pelos valores reais do seu arquivo `.env`*

2. **Verificar se está selecionando PostgreSQL (não outro tipo):**
   - Certifique-se de selecionar "PostgreSQL" no tipo de conexão
   - Não use "Generic" ou "Custom"

3. **Tentar sem SSL primeiro:**
   - Use SSL: **Desligado**
   - Alguns NocoDB têm problemas com SSL não configurado

### Problema 2: "Connection timeout"

**Soluções:**

1. **Adicionar parâmetros de conexão:**
   - Clique em "+ Add" em "Connection parameters"
   - Adicione: `connect_timeout` = `10`
   - Adicione: `sslmode` = `disable`

2. **Verificar firewall:**
   ```bash
   # No servidor, verificar se porta está realmente aberta
   ss -tlnp | grep 5432
   ```

### Problema 3: "Authentication failed"

**Soluções:**

1. **Verificar senha:**
   - Use a senha configurada na variável de ambiente `TYPEBOT_DB_PASSWORD`
   - Sem espaços antes ou depois

2. **Testar senha diretamente:**
   ```bash
   # No servidor
   docker exec typebot_typebot-db.1.vpvn1mqvjvla3tv9vd70w7sdu psql -U postgres -d typebot -c "SELECT 1;"
   ```

## 🎯 Configuração Recomendada no NocoDB

### Opção 1: Campos Separados

- **Connection name:** `typebot`
- **Host address:** `${TYPEBOT_DB_HOST}` (ex: 72.60.61.40)
- **Port number:** `${TYPEBOT_DB_PORT}` (ex: 5432)
- **Username:** `${TYPEBOT_DB_USER}` (ex: postgres)
- **Password:** `${TYPEBOT_DB_PASSWORD}` (obtenha do arquivo `.env`)
- **Database:** `${TYPEBOT_DB_NAME}` (ex: typebot)
- **Use SSL:** ❌ **Desligado**
- **Connection parameters:** 
  - `sslmode` = `disable`
  - `connect_timeout` = `10`

### Opção 2: Connection URL

1. Clique em "Use Connection URL"
2. Cole esta URL (substitua as variáveis pelos valores reais do seu `.env`):
   ```
   postgres://${TYPEBOT_DB_USER}:${TYPEBOT_DB_PASSWORD}@${TYPEBOT_DB_HOST}:${TYPEBOT_DB_PORT}/${TYPEBOT_DB_NAME}?sslmode=disable
   ```

## 🔍 Verificar se NocoDB Consegue Acessar

Se o NocoDB estiver no mesmo servidor, pode tentar usar o host interno:

- **Host address:** `typebot_typebot-db.1.vpvn1mqvjvla3tv9vd70w7sdu`
- **Port number:** `5432`

Ou se estiver na mesma rede Docker:
- **Host address:** `typebot-db` (nome do serviço)

## 🧪 Teste de Conexão Manual

Execute este comando no servidor onde o NocoDB está rodando:

```bash
# Se NocoDB estiver em container
docker exec nocodb_nocodb.1.vmhlovvb6dwjzomdywaw60bxr sh -c "apk add postgresql-client && psql -h \${TYPEBOT_DB_HOST} -p \${TYPEBOT_DB_PORT} -U \${TYPEBOT_DB_USER} -d \${TYPEBOT_DB_NAME} -c 'SELECT 1;'"
```

## 📋 Checklist Final

- [ ] Tipo de conexão: PostgreSQL (não Generic)
- [ ] Host: Configurado no `.env` como `TYPEBOT_DB_HOST`
- [ ] Port: Configurado no `.env` como `TYPEBOT_DB_PORT`
- [ ] Username: Configurado no `.env` como `TYPEBOT_DB_USER`
- [ ] Password: Configurado no `.env` como `TYPEBOT_DB_PASSWORD` (sem espaços)
- [ ] Database: Configurado no `.env` como `TYPEBOT_DB_NAME`
- [ ] SSL: Desligado
- [ ] Connection parameters: `sslmode=disable`
- [ ] Testou Connection URL também?

## 🆘 Se Ainda Não Funcionar

1. **Verificar logs do NocoDB:**
   ```bash
   docker logs nocodb_nocodb.1.vmhlovvb6dwjzomdywaw60bxr --tail 50
   ```

2. **Verificar versão do NocoDB:**
   - Versões antigas podem ter problemas com PostgreSQL 17
   - Considere atualizar o NocoDB

3. **Tentar criar conexão via API do NocoDB:**
   - Se o NocoDB tiver API, pode criar a conexão programaticamente

4. **Verificar se há restrições de rede:**
   - O container do NocoDB pode não conseguir acessar o IP externo
   - Tente usar o host interno do Docker

---

**Última atualização:** Agora mesmo  
**Status da conexão:** ✅ Funcionando (testado com sucesso)



