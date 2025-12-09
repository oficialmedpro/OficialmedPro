#!/bin/bash

# Script para configurar PostgreSQL do Typebot para conexões externas

echo "🔧 Configurando PostgreSQL do Typebot para conexões externas..."
echo ""

# Tentar encontrar o container (funciona com Docker Swarm também)
TYPEBOT_DB=$(docker ps --format "{{.Names}}" | grep -iE "typebot.*db" | head -1)

if [ -z "$TYPEBOT_DB" ]; then
    echo "❌ Container do banco não encontrado."
    echo ""
    echo "📋 Containers disponíveis:"
    docker ps --format "table {{.Names}}\t{{.Image}}"
    echo ""
    read -p "Digite o nome do container do PostgreSQL: " TYPEBOT_DB
fi

if [ -z "$TYPEBOT_DB" ]; then
    echo "❌ Nome do container não fornecido. Abortando."
    exit 1
fi

echo "✅ Usando container: $TYPEBOT_DB"
echo ""

# Verificar se o container está rodando
if ! docker ps --format "{{.Names}}" | grep -q "^${TYPEBOT_DB}$"; then
    echo "❌ Container $TYPEBOT_DB não está rodando."
    echo "💡 Tentando iniciar..."
    docker start $TYPEBOT_DB
    sleep 2
fi

echo "🔍 Procurando arquivos de configuração..."
echo ""

# Tentar encontrar postgresql.conf dentro do container
PG_CONF=$(docker exec $TYPEBOT_DB find /var/lib/postgresql -name postgresql.conf 2>/dev/null | head -1)

if [ -z "$PG_CONF" ]; then
    # Tentar outros caminhos comuns
    PG_CONF=$(docker exec $TYPEBOT_DB find /etc/postgresql -name postgresql.conf 2>/dev/null | head -1)
fi

if [ -z "$PG_CONF" ]; then
    # Tentar encontrar pelo PGDATA
    PGDATA=$(docker exec $TYPEBOT_DB env | grep PGDATA | cut -d= -f2)
    if [ -n "$PGDATA" ]; then
        PG_CONF="$PGDATA/postgresql.conf"
    fi
fi

if [ -z "$PG_CONF" ]; then
    echo "❌ Não foi possível encontrar postgresql.conf automaticamente."
    echo ""
    echo "💡 Execute manualmente dentro do container:"
    echo "   docker exec -it $TYPEBOT_DB bash"
    echo "   find / -name postgresql.conf 2>/dev/null"
    echo ""
    read -p "Digite o caminho completo do postgresql.conf: " PG_CONF
fi

if [ -z "$PG_CONF" ]; then
    echo "❌ Caminho do postgresql.conf não fornecido. Abortando."
    exit 1
fi

echo "✅ Arquivo postgresql.conf encontrado: $PG_CONF"

# Encontrar pg_hba.conf (geralmente no mesmo diretório)
PG_HBA_DIR=$(dirname "$PG_CONF")
PG_HBA="$PG_HBA_DIR/pg_hba.conf"

echo "✅ Usando pg_hba.conf: $PG_HBA"
echo ""

# Verificar se já está configurado
echo "🔍 Verificando configuração atual..."
LISTEN_CHECK=$(docker exec $TYPEBOT_DB grep -c "listen_addresses = '*'" "$PG_CONF" 2>/dev/null || echo "0")
HBA_CHECK=$(docker exec $TYPEBOT_DB grep -c "host.*all.*all.*0.0.0.0/0.*md5" "$PG_HBA" 2>/dev/null || echo "0")

if [ "$LISTEN_CHECK" -gt 0 ]; then
    echo "⚠️  listen_addresses já está configurado como '*'"
else
    echo "📝 Configurando listen_addresses..."
    docker exec $TYPEBOT_DB sh -c "echo \"listen_addresses = '*'\" >> $PG_CONF"
    echo "✅ listen_addresses configurado"
fi

if [ "$HBA_CHECK" -gt 0 ]; then
    echo "⚠️  pg_hba.conf já permite conexões de 0.0.0.0/0"
else
    echo "📝 Configurando pg_hba.conf..."
    docker exec $TYPEBOT_DB sh -c "echo \"host    all             all             0.0.0.0/0               md5\" >> $PG_HBA"
    echo "✅ pg_hba.conf configurado"
fi

echo ""
echo "🔄 Reiniciando container para aplicar mudanças..."
docker restart $TYPEBOT_DB

echo ""
echo "⏳ Aguardando PostgreSQL iniciar..."
sleep 5

# Verificar se está rodando
if docker ps --format "{{.Names}}" | grep -q "^${TYPEBOT_DB}$"; then
    echo "✅ Container reiniciado com sucesso!"
    echo ""
    echo "🧪 Testando conexão..."
    sleep 2
    
    # Tentar conectar
    if docker exec $TYPEBOT_DB pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL está respondendo!"
    else
        echo "⚠️  PostgreSQL pode ainda estar iniciando. Aguarde alguns segundos."
    fi
else
    echo "❌ Erro ao reiniciar container. Verifique os logs:"
    echo "   docker logs $TYPEBOT_DB"
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Expor a porta 5432 no EasyPanel"
echo "   2. Testar conexão externa:"
echo "      psql -h 72.60.61.40 -p 5432 -U postgres -d typebot"
echo "   3. Configurar no NocoDB com:"
echo "      Host: 72.60.61.40"
echo "      Port: 5432"
echo "      Database: typebot"

