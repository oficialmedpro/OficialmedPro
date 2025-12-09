# 🚀 Comandos Diretos para Configurar Typebot

## ✅ Container Encontrado

Nome do container: `typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv`

## 🔧 Configuração Rápida

### Opção 1: Script Automatizado (Recomendado)

```bash
# Copiar o script para o servidor e executar
chmod +x scripts/configurar-typebot-postgres-simples.sh
./scripts/configurar-typebot-postgres-simples.sh
```

### Opção 2: Comandos Manuais Diretos

Execute estes comandos no servidor:

```bash
# 1. Acessar o container
docker exec -it typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv bash

# 2. Dentro do container, encontrar os arquivos
find /var/lib/postgresql -name postgresql.conf
find /var/lib/postgresql -name pg_hba.conf

# 3. Se encontrar, editar (substitua CAMINHO pelo caminho encontrado)
# Se não encontrar, tente:
ls -la /var/lib/postgresql/data/

# 4. Configurar (assumindo que está em /var/lib/postgresql/data/)
echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf
echo "host    all             all             0.0.0.0/0               md5" >> /var/lib/postgresql/data/pg_hba.conf

# 5. Sair
exit

# 6. Reiniciar container
docker restart typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv
```

### Opção 3: Comandos em Uma Linha (Mais Rápido)

```bash
# Configurar sem entrar no container
CONTAINER="typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv"

# Encontrar caminho do postgresql.conf
PG_CONF=$(docker exec $CONTAINER find /var/lib/postgresql -name postgresql.conf 2>/dev/null | head -1)
PG_HBA_DIR=$(dirname "$PG_CONF")
PG_HBA="$PG_HBA_DIR/pg_hba.conf"

# Configurar
docker exec $CONTAINER sh -c "echo \"listen_addresses = '*'\">> $PG_CONF"
docker exec $CONTAINER sh -c "echo \"host    all             all             0.0.0.0/0               md5\" >> $PG_HBA"

# Reiniciar
docker restart $CONTAINER
```

## ⚠️ Nota sobre Docker Swarm

Como você está usando Docker Swarm, o ID do container pode mudar após reiniciar. Se isso acontecer, use:

```bash
# Encontrar o container novamente
docker ps | grep typebot-db

# Usar o nome encontrado nos comandos acima
```

## 📋 Depois de Configurar

1. **Expor porta no EasyPanel:**
   - Acesse: `http://72.60.61.40/`
   - Vá em: Typebot → typebot-db → Settings → Ports
   - Adicione: Porta Externa `5432` → Porta Interna `5432`

2. **Testar conexão:**
   ```bash
   psql -h 72.60.61.40 -p 5432 -U postgres -d typebot
   ```

3. **Configurar no NocoDB:**
   - Host: `72.60.61.40`
   - Port: `5432`
   - Username: `postgres`
   - Password: `9acf019d669f6ab91d86`
   - Database: `typebot`
   - SSL: Desligado


