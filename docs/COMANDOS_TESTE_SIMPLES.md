# 🧪 Comandos Simples para Testar Typebot

> ⚠️ **SEGURANÇA:** Este arquivo foi atualizado para usar variáveis de ambiente.  
> Configure as credenciais no arquivo `.env` (que não é commitado no Git).  
> **NUNCA** coloque senhas diretamente neste arquivo ou em qualquer código!

Execute estes comandos **um por vez** no servidor:

## Teste 1: Verificar Container

```bash
docker ps | grep typebot-db
```

## Teste 2: Verificar PostgreSQL

```bash
docker exec typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv pg_isready -U postgres
```

## Teste 3: Verificar Versão do PostgreSQL

```bash
docker exec typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv psql -U postgres -d typebot -c "SELECT version();"
```

## Teste 4: Verificar se Porta Está Escutando

```bash
ss -tlnp | grep 5432
```

Ou:

```bash
netstat -tlnp | grep 5432
```

## Teste 5: Verificar Tabelas do Banco

```bash
docker exec typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv psql -U postgres -d typebot -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

## Teste 6: Listar Algumas Tabelas

```bash
docker exec typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv psql -U postgres -d typebot -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 10;"
```

## ✅ Se Todos os Testes Passarem

Configure no NocoDB (obtenha os valores do arquivo `.env`):
- Host: `${TYPEBOT_DB_HOST}`
- Port: `${TYPEBOT_DB_PORT}`
- Database: `${TYPEBOT_DB_NAME}`
- Username: `${TYPEBOT_DB_USER}`
- Password: `${TYPEBOT_DB_PASSWORD}` (configure no `.env`)
- SSL: Desligado



