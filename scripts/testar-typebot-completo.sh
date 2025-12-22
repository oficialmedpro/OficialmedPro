#!/bin/bash

# Script completo para testar conexão do Typebot PostgreSQL
# Execute no servidor: bash scripts/testar-typebot-completo.sh

echo "🧪 TESTE COMPLETO - Conexão Typebot PostgreSQL"
echo "================================================"
echo ""

HOST="72.60.61.40"
PORT="5432"
CONTAINER="typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv"

# Teste 1: Verificar se container está rodando
echo "1️⃣ Verificando container..."
if docker ps --format "{{.Names}}" | grep -q "$CONTAINER"; then
    echo "✅ Container encontrado e rodando: $CONTAINER"
else
    # Tentar encontrar o container
    CONTAINER=$(docker ps --format "{{.Names}}" | grep -iE "typebot.*db" | head -1)
    if [ -z "$CONTAINER" ]; then
        echo "❌ Container do Typebot DB não encontrado!"
        exit 1
    fi
    echo "✅ Container encontrado: $CONTAINER"
fi
echo ""

# Teste 2: Verificar PostgreSQL dentro do container
echo "2️⃣ Testando PostgreSQL dentro do container..."
if docker exec $CONTAINER pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL está respondendo!"
    
    # Mostrar versão
    VERSION=$(docker exec $CONTAINER psql -U postgres -t -c "SELECT version();" 2>/dev/null | head -1 | xargs)
    echo "   Versão: $VERSION"
else
    echo "❌ PostgreSQL não está respondendo!"
    exit 1
fi
echo ""

# Teste 3: Verificar se a porta está escutando no servidor
echo "3️⃣ Verificando se a porta $PORT está escutando..."
if ss -tlnp 2>/dev/null | grep -q ":$PORT "; then
    echo "✅ Porta $PORT está escutando no servidor!"
elif netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
    echo "✅ Porta $PORT está escutando no servidor!"
else
    echo "⚠️  Porta $PORT não está escutando no servidor"
    echo "💡 Verifique se você salvou a configuração no EasyPanel"
fi
echo ""

# Teste 4: Testar conexão externa (se nc estiver disponível)
echo "4️⃣ Testando conexão externa na porta $PORT..."
if command -v nc &> /dev/null; then
    if timeout 3 nc -zv $HOST $PORT 2>&1 | grep -qE "(succeeded|open)"; then
        echo "✅ Porta $PORT está acessível externamente!"
    else
        echo "⚠️  Porta $PORT não está acessível externamente"
        echo "💡 Isso pode ser normal se o firewall estiver bloqueando"
    fi
else
    echo "⚠️  'nc' (netcat) não está instalado. Pulando teste."
    echo "💡 Para instalar: apt install netcat"
fi
echo ""

# Teste 5: Testar conexão do container para o host
echo "5️⃣ Testando conexão do container para o host..."
if docker exec $CONTAINER psql -h $HOST -p $PORT -U postgres -d typebot -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Container consegue conectar ao host $HOST:$PORT!"
else
    echo "⚠️  Container não conseguiu conectar ao host"
    echo "💡 Isso pode ser normal - o importante é que funcione externamente"
fi
echo ""

# Teste 6: Listar algumas tabelas do Typebot
echo "6️⃣ Verificando tabelas do Typebot..."
TABLES=$(docker exec $CONTAINER psql -U postgres -d typebot -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
if [ -n "$TABLES" ] && [ "$TABLES" != "0" ]; then
    echo "✅ Banco de dados tem $TABLES tabelas"
    
    # Listar algumas tabelas principais
    echo "   Tabelas principais encontradas:"
    docker exec $CONTAINER psql -U postgres -d typebot -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%Typebot%' OR table_name LIKE '%typebot%') LIMIT 5;" 2>/dev/null | sed 's/^/   - /'
else
    echo "⚠️  Nenhuma tabela encontrada ou erro ao consultar"
fi
echo ""

# Resumo final
echo "================================================"
echo "📋 RESUMO DOS TESTES"
echo "================================================"
echo ""
echo "✅ Container PostgreSQL: Funcionando"
echo "✅ Banco de dados: typebot"
echo "✅ Usuário: postgres"
echo ""
echo "🔌 Configuração para NocoDB:"
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   Database: typebot"
echo "   Username: postgres"
echo "   Password: 9acf019d669f6ab91d86"
echo "   SSL: Desligado"
echo ""
echo "💡 Se a porta não estiver acessível externamente:"
echo "   1. Verifique se salvou no EasyPanel"
echo "   2. Verifique firewall do servidor"
echo "   3. Tente configurar no NocoDB mesmo assim - pode funcionar"
echo ""
echo "✅ Teste concluído!"



