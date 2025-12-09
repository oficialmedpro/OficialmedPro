# 🔍 Descobrir Nome do Container Typebot

## Problema

O nome do container pode variar dependendo de como foi criado no EasyPanel. Execute estes comandos para descobrir:

## 🚀 Comandos Rápidos

### 1. Listar todos os containers relacionados ao Typebot

```bash
docker ps | grep -i typebot
```

### 2. Listar todos os containers PostgreSQL

```bash
docker ps | grep -i postgres
```

### 3. Listar todos os containers rodando

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

### 4. Usar script de diagnóstico (se tiver os arquivos)

```bash
chmod +x scripts/diagnosticar-typebot-db.sh
./scripts/diagnosticar-typebot-db.sh
```

## 📋 Exemplos de Nomes Comuns

O nome do container pode ser algo como:
- `typebot-db`
- `typebot_typebot-db`
- `typebot-db-1`
- `typebot_postgres`
- `typebot-db-typebot`
- Ou qualquer outro nome definido no EasyPanel

## ✅ Depois de Descobrir o Nome

Use o nome encontrado nos comandos:

```bash
# Acessar container
docker exec -it NOME_DO_CONTAINER bash

# Ver informações
docker inspect NOME_DO_CONTAINER

# Ver logs
docker logs NOME_DO_CONTAINER
```

## 🔧 Próximo Passo

Depois de descobrir o nome, use o script de configuração:

```bash
chmod +x scripts/configurar-typebot-postgres.sh
./scripts/configurar-typebot-postgres.sh
```

O script vai pedir o nome do container se não encontrar automaticamente.


