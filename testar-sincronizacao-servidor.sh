#!/bin/bash

# Script para testar a sincronização diretamente no servidor
# Execute: bash testar-sincronizacao-servidor.sh

echo "🧪 Testando API de sincronização no servidor..."
echo ""

# 1. Verificar versão atual da API
echo "📦 Verificando versão da API..."
docker service logs --tail 10 sprint-sync_sincronizacao | grep -E "Commit:|Versão:|Mensagem:" | tail -3
echo ""

# 2. Fazer uma requisição de teste
echo "🚀 Chamando endpoint /sync/oportunidades..."
echo "⏳ Aguardando resposta (pode demorar alguns minutos)..."
echo ""

# Usar curl dentro de um container temporário ou diretamente no servidor
RESPONSE=$(curl -s -X GET "https://sincro.oficialmed.com.br/sync/oportunidades" \
  -H "Content-Type: application/json" \
  --max-time 300 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Resposta recebida!"
    echo ""
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    # Verificar se há menção a segmentos
    if echo "$RESPONSE" | grep -qi "segmento"; then
        echo "❌ PROBLEMA: Resposta contém menção a 'segmento'!"
    else
        echo "✅ OK: Nenhuma menção a segmentos na resposta"
    fi
else
    echo "❌ Erro ao chamar a API"
    echo "$RESPONSE"
fi

echo ""
echo "📋 Verificando logs em tempo real (últimas 30 linhas)..."
echo "Pressione Ctrl+C para parar"
echo ""
docker service logs --tail 30 -f sprint-sync_sincronizacao


