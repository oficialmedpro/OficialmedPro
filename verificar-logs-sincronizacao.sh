#!/bin/bash

# Script para verificar logs da sincronização e salvar em arquivo
# Uso: bash verificar-logs-sincronizacao.sh

echo "📋 Coletando logs da sincronização..."
echo ""

# Criar diretório de logs se não existir
LOG_DIR="./logs-sync"
mkdir -p "$LOG_DIR"

# Nome do arquivo com timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/sync_logs_${TIMESTAMP}.txt"

echo "💾 Salvando logs em: $LOG_FILE"
echo ""

# Coletar últimas 500 linhas dos logs
docker service logs --tail 500 sprint-sync_sincronizacao > "$LOG_FILE" 2>&1

echo "✅ Logs salvos!"
echo ""
echo "📊 Estatísticas do arquivo:"
echo "   - Linhas totais: $(wc -l < "$LOG_FILE")"
echo "   - Tamanho: $(du -h "$LOG_FILE" | cut -f1)"
echo ""

# Mostrar últimas 50 linhas na tela
echo "📄 Últimas 50 linhas:"
echo "=========================================="
tail -50 "$LOG_FILE"
echo "=========================================="
echo ""
echo "💡 Para ver o arquivo completo:"
echo "   cat $LOG_FILE"
echo ""
echo "💡 Para procurar por erros:"
echo "   grep -i error $LOG_FILE"
echo ""
echo "💡 Para procurar por segmentos (não deve aparecer nada):"
echo "   grep -i segmento $LOG_FILE"
echo ""
echo "💡 Para ver apenas oportunidades processadas:"
echo "   grep 'Página\|oportunidades processadas\|handleSyncOportunidades' $LOG_FILE"


