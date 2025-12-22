#!/bin/bash

# Script para diagnosticar o container do Typebot PostgreSQL

echo "🔍 Diagnosticando containers do Typebot..."
echo ""

# Listar todos os containers relacionados ao typebot
echo "📋 Containers relacionados ao Typebot:"
docker ps -a | grep -i typebot
echo ""

# Listar todos os containers rodando
echo "📋 Todos os containers rodando:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
echo ""

# Procurar por containers PostgreSQL
echo "📋 Containers PostgreSQL:"
docker ps -a | grep -i postgres
echo ""

# Verificar volumes do typebot
echo "📋 Volumes relacionados ao Typebot:"
docker volume ls | grep -i typebot
echo ""

# Verificar redes
echo "📋 Redes Docker:"
docker network ls
echo ""

# Tentar encontrar o container do banco
echo "🔍 Procurando container do banco de dados..."
TYPEBOT_DB=$(docker ps --format "{{.Names}}" | grep -iE "(typebot.*db|db.*typebot|postgres)" | head -1)

if [ -z "$TYPEBOT_DB" ]; then
    echo "❌ Container do banco não encontrado automaticamente."
    echo ""
    echo "💡 Execute manualmente:"
    echo "   docker ps"
    echo ""
    echo "E procure pelo container do PostgreSQL do Typebot."
else
    echo "✅ Container encontrado: $TYPEBOT_DB"
    echo ""
    echo "📊 Informações do container:"
    docker inspect $TYPEBOT_DB --format "{{.Name}} - {{.Config.Image}}"
    echo ""
    echo "📁 Volumes montados:"
    docker inspect $TYPEBOT_DB --format "{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}"
    echo ""
    echo "🔧 Para acessar o container, use:"
    echo "   docker exec -it $TYPEBOT_DB bash"
    echo ""
    echo "📂 Para encontrar os arquivos de configuração, dentro do container execute:"
    echo "   find / -name postgresql.conf 2>/dev/null"
    echo "   find / -name pg_hba.conf 2>/dev/null"
fi



