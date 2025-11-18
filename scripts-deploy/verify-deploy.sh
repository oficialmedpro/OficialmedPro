#!/bin/bash

# Script para verificar se o deploy foi bem-sucedido
# Uso: ./verify-deploy.sh [DOMAIN]

DOMAIN=${1:-"localhost:3001"}
PROTOCOL="http"

# Se não for localhost, usar HTTPS
if [[ $DOMAIN != "localhost"* ]]; then
    PROTOCOL="https"
fi

BASE_URL="$PROTOCOL://$DOMAIN"

echo "🔍 Verificando deploy do Google Ads Proxy..."
echo "🌐 URL: $BASE_URL"
echo ""

# Função para testar endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo "🧪 Testando: $description"
    echo "   Endpoint: $endpoint"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d '{"unidadeId": 1, "customerId": "test"}' \
        --connect-timeout 10)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ]; then
        echo "   ✅ Status: $http_code (OK)"
        echo "   📄 Response: $(echo "$body" | head -c 100)..."
    elif [ "$http_code" -eq 500 ]; then
        echo "   ⚠️  Status: $http_code (Erro interno - provavelmente credenciais)"
        echo "   📄 Response: $(echo "$body" | head -c 100)..."
    else
        echo "   ❌ Status: $http_code (Erro)"
        echo "   📄 Response: $(echo "$body" | head -c 100)..."
    fi
    echo ""
}

# Testar conectividade básica
echo "🌐 Testando conectividade básica..."
if curl -s --connect-timeout 5 "$BASE_URL" > /dev/null; then
    echo "✅ Servidor respondendo"
else
    echo "❌ Servidor não está respondendo"
    echo "   Verifique se:"
    echo "   - O servidor está rodando"
    echo "   - A porta está aberta"
    echo "   - O domínio está correto"
    exit 1
fi
echo ""

# Testar endpoints
test_endpoint "/api/google-ads/test-connection" "Teste de Conexão"
test_endpoint "/api/google-ads/customer-info" "Informações da Conta"
test_endpoint "/api/google-ads/campaigns" "Listar Campanhas"

echo "📊 Resumo da Verificação:"
echo "   - Se todos os endpoints retornaram 200: ✅ Deploy perfeito!"
echo "   - Se retornaram 500: ⚠️  Configure as credenciais do Supabase"
echo "   - Se retornaram outros códigos: ❌ Verifique a configuração"
echo ""

echo "🔧 Próximos passos se houver problemas:"
echo "   1. Verificar logs: pm2 logs google-ads-proxy"
echo "   2. Verificar Nginx: sudo nginx -t && sudo systemctl status nginx"
echo "   3. Verificar credenciais no config.js"
echo "   4. Verificar firewall: sudo ufw status"
echo ""

echo "📝 Para monitorar em tempo real:"
echo "   pm2 logs google-ads-proxy --lines 50"
