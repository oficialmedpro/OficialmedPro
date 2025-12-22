#!/bin/bash

# Script para testar conexão com o banco Typebot sem precisar instalar psql

echo "🧪 Testando conexão com o banco Typebot..."
echo ""

CONTAINER="typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv"
HOST="72.60.61.40"
PORT="5432"
USER="postgres"
DB="typebot"
PASSWORD="9acf019d669f6ab91d86"

# Teste 1: Verificar se a porta está aberta
echo "1️⃣ Testando se a porta $PORT está aberta..."
if command -v nc &> /dev/null; then
    if nc -zv $HOST $PORT 2>&1 | grep -q "succeeded"; then
        echo "✅ Porta $PORT está aberta e acessível!"
    else
        echo "❌ Porta $PORT não está acessível ou não está aberta"
        echo "💡 Verifique se você salvou a configuração no EasyPanel"
    fi
else
    echo "⚠️  'nc' (netcat) não está instalado. Pulando teste de porta."
    echo "💡 Para instalar: apt install netcat"
fi

echo ""

# Teste 2: Testar conexão usando o próprio container PostgreSQL
echo "2️⃣ Testando conexão usando o container PostgreSQL..."
if docker ps --format "{{.Names}}" | grep -q "$CONTAINER"; then
    echo "✅ Container encontrado: $CONTAINER"
    
    # Testar se consegue conectar usando psql dentro do container
    if docker exec $CONTAINER psql -U $USER -d $DB -c "SELECT version();" > /dev/null 2>&1; then
        echo "✅ PostgreSQL está funcionando dentro do container"
        
        # Tentar conectar usando hostname do servidor
        echo ""
        echo "3️⃣ Testando conexão externa (do container para o próprio servidor)..."
        if docker exec $CONTAINER psql -h $HOST -p $PORT -U $USER -d $DB -c "SELECT version();" 2>&1 | grep -q "PostgreSQL"; then
            echo "✅ Conexão externa funcionando!"
            echo ""
            echo "📊 Informações do banco:"
            docker exec $CONTAINER psql -h $HOST -p $PORT -U $USER -d $DB -c "SELECT version();" 2>&1 | head -3
        else
            echo "⚠️  Não conseguiu conectar externamente do container"
            echo "💡 Isso pode ser normal se o container não consegue acessar o IP externo"
        fi
    else
        echo "❌ Erro ao conectar ao PostgreSQL dentro do container"
    fi
else
    echo "❌ Container não encontrado: $CONTAINER"
    echo "💡 Verifique se o container está rodando: docker ps | grep typebot-db"
fi

echo ""

# Teste 3: Verificar se Node.js está disponível para usar o script de teste
echo "4️⃣ Verificando se podemos usar o script Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js encontrado!"
    if [ -f "scripts/test-typebot-connection.js" ]; then
        echo "💡 Execute: node scripts/test-typebot-connection.js"
    else
        echo "⚠️  Script test-typebot-connection.js não encontrado"
    fi
else
    echo "⚠️  Node.js não está instalado"
fi

echo ""

# Teste 4: Instalar cliente PostgreSQL (opcional)
echo "5️⃣ Para instalar o cliente PostgreSQL e testar diretamente:"
echo "   apt update && apt install -y postgresql-client"
echo "   psql -h $HOST -p $PORT -U $USER -d $DB"

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "📋 Resumo:"
echo "   - Se a porta está aberta: ✅ Pronto para conectar"
echo "   - Se o PostgreSQL está funcionando: ✅ Banco está OK"
echo "   - Configure no NocoDB com:"
echo "     Host: $HOST"
echo "     Port: $PORT"
echo "     Database: $DB"
echo "     Username: $USER"
echo "     Password: $PASSWORD"



