#!/bin/bash

# Script rápido para ver logs sem salvar arquivo
# Uso: bash verificar-logs-sincronizacao-rapido.sh

echo "📋 Últimas 100 linhas dos logs (sem scroll infinito):"
echo "=========================================="
docker service logs --tail 100 sprint-sync_sincronizacao 2>&1 | tail -100
echo "=========================================="
echo ""
echo "💡 Para salvar em arquivo, use: bash verificar-logs-sincronizacao.sh"


