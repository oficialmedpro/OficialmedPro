#!/bin/bash

# Script simplificado para configurar PostgreSQL do Typebot
# Nome do container: typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv

CONTAINER_NAME="typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv"

echo "🔧 Configurando PostgreSQL do Typebot..."
echo "Container: $CONTAINER_NAME"
echo ""

# Verificar se container existe e está rodando
if ! docker ps --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
    echo "⚠️  Container não encontrado com esse nome exato."
    echo "📋 Procurando container do Typebot DB..."
    CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep -iE "typebot.*db" | head -1)
    if [ -z "$CONTAINER_NAME" ]; then
        echo "❌ Container do Typebot DB não encontrado."
        exit 1
    fi
    echo "✅ Container encontrado: $CONTAINER_NAME"
fi

echo "🔍 Procurando arquivos de configuração..."
echo ""

# Tentar encontrar postgresql.conf
PG_CONF=$(docker exec $CONTAINER_NAME find /var/lib/postgresql -name postgresql.conf 2>/dev/null | head -1)

if [ -z "$PG_CONF" ]; then
    # Tentar outros caminhos
    PG_CONF=$(docker exec $CONTAINER_NAME find /etc/postgresql -name postgresql.conf 2>/dev/null | head -1)
fi

if [ -z "$PG_CONF" ]; then
    # Verificar PGDATA
    PGDATA=$(docker exec $CONTAINER_NAME env | grep PGDATA | cut -d= -f2)
    if [ -n "$PGDATA" ]; then
        PG_CONF="$PGDATA/postgresql.conf"
        # Verificar se existe
        if ! docker exec $CONTAINER_NAME test -f "$PG_CONF"; then
            PG_CONF=""
        fi
    fi
fi

if [ -z "$PG_CONF" ]; then
    echo "❌ Não foi possível encontrar postgresql.conf automaticamente."
    echo ""
    echo "💡 Tentando método alternativo..."
    # Tentar caminho padrão do PostgreSQL 17
    PG_CONF="/var/lib/postgresql/data/postgresql.conf"
    if docker exec $CONTAINER_NAME test -f "$PG_CONF"; then
        echo "✅ Arquivo encontrado em: $PG_CONF"
    else
        echo "❌ Arquivo não encontrado. Execute manualmente:"
        echo "   docker exec -it $CONTAINER_NAME bash"
        echo "   find / -name postgresql.conf 2>/dev/null"
        exit 1
    fi
else
    echo "✅ Arquivo encontrado: $PG_CONF"
fi

# Encontrar pg_hba.conf (mesmo diretório)
PG_HBA_DIR=$(dirname "$PG_CONF")
PG_HBA="$PG_HBA_DIR/pg_hba.conf"

echo "✅ Usando pg_hba.conf: $PG_HBA"
echo ""

# Verificar configurações atuais
echo "🔍 Verificando configurações atuais..."
LISTEN_CHECK=$(docker exec $CONTAINER_NAME grep -c "^listen_addresses = '*'" "$PG_CONF" 2>/dev/null || echo "0")
HBA_CHECK=$(docker exec $CONTAINER_NAME grep -c "host.*all.*all.*0.0.0.0/0.*md5" "$PG_HBA" 2>/dev/null || echo "0")

if [ "$LISTEN_CHECK" -gt 0 ]; then
    echo "✅ listen_addresses já está configurado"
else
    echo "📝 Configurando listen_addresses..."
    # Verificar se já existe a linha (mesmo comentada)
    if docker exec $CONTAINER_NAME grep -q "listen_addresses" "$PG_CONF"; then
        # Substituir linha existente
        docker exec $CONTAINER_NAME sed -i "s/^#*listen_addresses.*/listen_addresses = '*'/" "$PG_CONF"
    else
        # Adicionar nova linha
        docker exec $CONTAINER_NAME sh -c "echo \"listen_addresses = '*'\" >> $PG_CONF"
    fi
    echo "✅ listen_addresses configurado"
fi

if [ "$HBA_CHECK" -gt 0 ]; then
    echo "✅ pg_hba.conf já permite conexões de 0.0.0.0/0"
else
    echo "📝 Configurando pg_hba.conf..."
    docker exec $CONTAINER_NAME sh -c "echo \"host    all             all             0.0.0.0/0               md5\" >> $PG_HBA"
    echo "✅ pg_hba.conf configurado"
fi

echo ""
echo "🔄 Reiniciando container para aplicar mudanças..."
docker restart $CONTAINER_NAME

echo ""
echo "⏳ Aguardando PostgreSQL iniciar (10 segundos)..."
sleep 10

# Verificar se está rodando
if docker ps --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
    echo "✅ Container reiniciado!"
    echo ""
    echo "🧪 Testando conexão PostgreSQL..."
    
    # Aguardar mais um pouco para garantir que iniciou
    sleep 3
    
    if docker exec $CONTAINER_NAME pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL está respondendo!"
    else
        echo "⚠️  PostgreSQL pode ainda estar iniciando. Aguarde alguns segundos."
        echo "💡 Verifique os logs: docker logs $CONTAINER_NAME"
    fi
else
    echo "❌ Erro ao reiniciar container."
    echo "💡 Verifique os logs: docker logs $CONTAINER_NAME"
    exit 1
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Expor a porta 5432 no EasyPanel (Typebot → typebot-db → Settings → Ports)"
echo "   2. Testar conexão externa:"
echo "      psql -h 72.60.61.40 -p 5432 -U postgres -d typebot"
echo "   3. Configurar no NocoDB:"
echo "      Host: 72.60.61.40"
echo "      Port: 5432"
echo "      Username: postgres"
echo "      Password: 9acf019d669f6ab91d86"
echo "      Database: typebot"
echo "      SSL: Desligado"


