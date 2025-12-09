# 🚀 Resumo Rápido: Conectar Typebot ao NocoDB

## ⚡ Solução Rápida (3 Passos)

### 1️⃣ Expor Porta no EasyPanel

1. Acesse: `http://72.60.61.40/`
2. Vá em **Typebot** → **typebot-db** → **Settings**
3. Adicione porta: **5432** (externa) → **5432** (interna)

### 2️⃣ Configurar PostgreSQL para Aceitar Conexões Externas

**Método Automático (Recomendado):**

```bash
# No servidor, execute:
chmod +x scripts/diagnosticar-typebot-db.sh
./scripts/diagnosticar-typebot-db.sh

# Depois configure:
chmod +x scripts/configurar-typebot-postgres.sh
./scripts/configurar-typebot-postgres.sh
```

**Método Manual:**

```bash
# 1. Descobrir nome do container
docker ps | grep -i typebot

# 2. Acessar container (substitua NOME pelo nome real)
docker exec -it NOME bash

# 3. Encontrar arquivos de configuração
find / -name postgresql.conf 2>/dev/null

# 4. Editar (substitua CAMINHO pelo caminho encontrado)
echo "listen_addresses = '*'" >> CAMINHO/postgresql.conf
echo "host    all             all             0.0.0.0/0               md5" >> CAMINHO/pg_hba.conf
exit

# 5. Reiniciar container
docker restart NOME
```

### 3️⃣ Configurar no NocoDB

- **Host:** `72.60.61.40`
- **Port:** `5432`
- **Username:** `postgres`
- **Password:** `9acf019d669f6ab91d86`
- **Database:** `typebot`
- **SSL:** Desligado

---

## 🧪 Testar Conexão

### Opção 1: Script Node.js

```bash
npm install pg
node scripts/test-typebot-connection.js
```

### Opção 2: Cliente PostgreSQL

```bash
# Instalar cliente (Ubuntu/Debian)
sudo apt-get install postgresql-client

# Testar conexão
psql -h 72.60.61.40 -p 5432 -U postgres -d typebot
```

### Opção 3: Verificar Porta

```bash
telnet 72.60.61.40 5432
# ou
nc -zv 72.60.61.40 5432
```

---

## ❌ Erros Comuns

### "Connection refused"
- Porta não exposta no EasyPanel
- PostgreSQL não configurado para conexões externas
- Firewall bloqueando

### "database not supported"
- Banco não está acessível
- Teste primeiro com `psql` ou o script de teste

### "Password authentication failed"
- Verificar credenciais no EasyPanel
- Verificar `pg_hba.conf`

---

## 📚 Documentação Completa

Veja o guia completo em: `docs/CONECTAR_TYPEBOT_NOCODB.md`

---

**Status:** ✅ Pronto para configurar

