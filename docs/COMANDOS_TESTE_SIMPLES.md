# 🧪 Comandos Simples para Testar Typebot

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

Configure no NocoDB:
- Host: `72.60.61.40`
- Port: `5432`
- Database: `typebot`
- Username: `postgres`
- Password: `9acf019d669f6ab91d86`
- SSL: Desligado


