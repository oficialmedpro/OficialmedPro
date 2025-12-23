# ✅ Typebot PostgreSQL - Configurado com Sucesso!

> ⚠️ **SEGURANÇA:** Este arquivo foi atualizado para usar variáveis de ambiente.  
> Configure as credenciais no arquivo `.env` (que não é commitado no Git).  
> **NUNCA** coloque senhas diretamente neste arquivo ou em qualquer código!

## 📅 Data da Configuração
2025-01-XX

## ✅ O Que Foi Feito

### 1. Configuração do PostgreSQL
- ✅ `listen_addresses = '*'` configurado
- ✅ `pg_hba.conf` configurado para aceitar conexões de `0.0.0.0/0`
- ✅ Container reiniciado com sucesso
- ✅ PostgreSQL está respondendo

### 2. Container
- **Nome:** `typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv`
- **Imagem:** `postgres:17`
- **Status:** ✅ Funcionando

## 📋 Próximos Passos

### ⚠️ IMPORTANTE: Expor Porta no EasyPanel

1. Acesse: `http://72.60.61.40/`
2. Vá em: **Typebot** → **typebot-db** → **Settings** → **Ports**
3. Adicione porta:
   - **Porta Externa:** `5432`
   - **Porta Interna:** `5432`
   - **Protocolo:** TCP

### 🧪 Testar Conexão Externa

Após expor a porta, teste:

```bash
# Teste básico (substitua as variáveis pelos valores do .env)
psql -h ${TYPEBOT_DB_HOST} -p ${TYPEBOT_DB_PORT} -U ${TYPEBOT_DB_USER} -d ${TYPEBOT_DB_NAME}

# Ou usando o script
node scripts/test-typebot-connection.js
```

### 🔌 Configurar no NocoDB

Use estas credenciais:

- **Host address:** Configure no `.env` como `TYPEBOT_DB_HOST`
- **Port number:** Configure no `.env` como `TYPEBOT_DB_PORT`
- **Username:** Configure no `.env` como `TYPEBOT_DB_USER`
- **Password:** Configure no `.env` como `TYPEBOT_DB_PASSWORD`
- **Database:** Configure no `.env` como `TYPEBOT_DB_NAME`
- **Use SSL:** Desligado

## 🔍 Verificar Status

### Verificar se container está rodando:
```bash
docker ps | grep typebot-db
```

### Verificar logs:
```bash
docker logs typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv --tail 50
```

### Testar conexão interna:
```bash
docker exec typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv pg_isready -U postgres
```

## 🔐 Segurança

⚠️ **Atenção:** O PostgreSQL está configurado para aceitar conexões de qualquer IP (`0.0.0.0/0`). 

**Recomendações:**
- Considere restringir IPs no firewall se possível
- Use SSL/TLS se expor na internet
- Mantenha senhas fortes
- Monitore logs regularmente

## 📝 Comandos Úteis

### Reiniciar container:
```bash
docker restart typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv
```

### Ver configurações:
```bash
CONTAINER="typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv"
PG_CONF=$(docker exec $CONTAINER find /var/lib/postgresql -name postgresql.conf 2>/dev/null | head -1)
docker exec $CONTAINER cat $PG_CONF | grep listen_addresses
```

### Backup do banco:
```bash
docker exec typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv pg_dump -U postgres typebot > backup_typebot_$(date +%Y%m%d).sql
```

## ✅ Checklist Final

- [x] PostgreSQL configurado para conexões externas
- [x] Container reiniciado
- [x] PostgreSQL respondendo
- [ ] Porta 5432 exposta no EasyPanel
- [ ] Conexão externa testada
- [ ] Configurado no NocoDB
- [ ] Teste de conexão no NocoDB bem-sucedido

---

**Status:** ✅ Configuração do PostgreSQL concluída. Aguardando exposição da porta no EasyPanel.



