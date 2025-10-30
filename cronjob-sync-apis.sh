#!/bin/bash

# ===========================================
# CRONJOB PARA SINCRONIZAÇÃO AUTOMÁTICA
# ===========================================
# Executa a cada 30 minutos
# 0,30 * * * * /path/to/cronjob-sync-apis.sh

# Configurações
API_BASE_URL="https://sincro.oficialmed.com.br"
LEADS_API_TOKEN="sync-leads-2025-aB3cD7eF9gH2jK5mN8pQ1rS4tU7vW0xY"
OPPORTUNITIES_API_TOKEN="sync-opportunities-2025-bC4dE8fG0hI3jL6nO9qR2sT5uV8wX1yZ"

# Log file
LOG_FILE="/var/log/sync-apis.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Função para log
log() {
    echo "[$DATE] $1" | tee -a "$LOG_FILE"
}

# Função para chamar API
call_api() {
    local endpoint=$1
    local token=$2
    local name=$3
    
    log "🔄 Iniciando sincronização de $name..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -X POST \
        "$API_BASE_URL$endpoint/sync")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ]; then
        log "✅ $name sincronizado com sucesso"
        log "📊 Resposta: $body"
    else
        log "❌ Erro na sincronização de $name (HTTP $http_code)"
        log "📊 Resposta: $body"
    fi
}

# Executar sincronizações
log "🚀 Iniciando sincronizações automáticas..."

# Sincronizar leads
call_api "/leads" "$LEADS_API_TOKEN" "LEADS"

# Aguardar 30 segundos entre as sincronizações
sleep 30

# Sincronizar oportunidades
call_api "/oportunidades" "$OPPORTUNITIES_API_TOKEN" "OPORTUNIDADES"

log "🏁 Sincronizações concluídas"

