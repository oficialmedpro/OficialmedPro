#!/bin/bash

# =====================================================
# Script de Restore N8N - Oficial Med
# =====================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para logging
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Banner
echo -e "${RED}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║          Restore N8N - Oficial Med                ║"
echo "║                   ⚠ CUIDADO ⚠                     ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar argumentos
if [ $# -eq 0 ]; then
    log_error "Nenhum arquivo de backup especificado!"
    echo ""
    echo "Uso: $0 <arquivo-backup.tar.gz>"
    echo ""
    echo "Exemplos:"
    echo "  $0 backups/n8n/n8n-backup-completo-20251017-120000.tar.gz"
    echo "  $0 n8n-backup-completo-20251017-120000.tar.gz"
    echo ""
    echo "Backups disponíveis:"
    ls -lht backups/n8n/*.tar.gz 2>/dev/null | head -5 || echo "  Nenhum backup encontrado em backups/n8n/"
    exit 1
fi

BACKUP_FILE="$1"

# Verificar se o arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Arquivo não encontrado: $BACKUP_FILE"
    exit 1
fi

log_info "Arquivo de backup: $BACKUP_FILE"
log_info "Tamanho: $(du -h "$BACKUP_FILE" | cut -f1)"

# Confirmação do usuário
echo ""
echo -e "${RED}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                   ⚠ ATENÇÃO ⚠                     ║${NC}"
echo -e "${RED}║                                                   ║${NC}"
echo -e "${RED}║  Este processo irá SOBRESCREVER todos os dados   ║${NC}"
echo -e "${RED}║  atuais do N8N com o backup selecionado!         ║${NC}"
echo -e "${RED}║                                                   ║${NC}"
echo -e "${RED}║  Certifique-se de ter um backup dos dados        ║${NC}"
echo -e "${RED}║  atuais antes de continuar!                      ║${NC}"
echo -e "${RED}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

read -p "$(echo -e ${YELLOW}Deseja continuar com o restore? Digite 'SIM' para confirmar:${NC} )" -r
echo
if [[ ! $REPLY == "SIM" ]]; then
    log_info "Restore cancelado pelo usuário"
    exit 0
fi

# Criar diretório temporário
TEMP_DIR=$(mktemp -d)
log_info "Diretório temporário: $TEMP_DIR"

# Extrair backup
log_info "Extraindo backup..."
tar xzf "$BACKUP_FILE" -C "$TEMP_DIR"
log_success "Backup extraído"

# Listar arquivos extraídos
log_info "Arquivos no backup:"
ls -lh "$TEMP_DIR"

# Identificar arquivos
DB_BACKUP=$(find "$TEMP_DIR" -name "n8n-db-*.sql" | head -1)
VOLUME_BACKUP=$(find "$TEMP_DIR" -name "n8n-data-*.tar.gz" | head -1)

if [ -z "$DB_BACKUP" ]; then
    log_error "Backup do banco de dados não encontrado!"
    rm -rf "$TEMP_DIR"
    exit 1
fi

log_success "Backup do banco encontrado: $(basename $DB_BACKUP)"
if [ -n "$VOLUME_BACKUP" ]; then
    log_success "Backup do volume encontrado: $(basename $VOLUME_BACKUP)"
else
    log_warning "Backup do volume não encontrado (pode não existir)"
fi

# Verificar PostgreSQL
log_info "Verificando PostgreSQL..."
POSTGRES_CONTAINER=$(docker ps -q -f name=postgres)
if [ -z "$POSTGRES_CONTAINER" ]; then
    log_error "PostgreSQL não está rodando!"
    rm -rf "$TEMP_DIR"
    exit 1
fi
log_success "PostgreSQL encontrado: $POSTGRES_CONTAINER"

# Parar o serviço N8N
log_info "Parando serviço N8N..."
if docker service ls 2>/dev/null | grep -q "n8n_n8n"; then
    docker service scale n8n_n8n=0
    log_success "Serviço N8N parado"
    sleep 5
else
    log_warning "Serviço N8N não encontrado em modo swarm"
    # Tentar parar container direto
    if docker ps | grep -q "n8n"; then
        docker stop $(docker ps -q -f name=n8n) || true
        log_success "Container N8N parado"
    fi
fi

# Backup de segurança dos dados atuais
log_info "Criando backup de segurança dos dados atuais..."
SAFETY_BACKUP_DIR="./backups/n8n/safety-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$SAFETY_BACKUP_DIR"

# Backup atual do banco
docker exec -t $POSTGRES_CONTAINER pg_dump -U postgres n8n > "$SAFETY_BACKUP_DIR/current-n8n-db.sql" 2>/dev/null || log_warning "Não foi possível fazer backup atual do banco"

# Backup atual do volume
if docker volume ls | grep -q "n8n_n8n_data"; then
    docker run --rm \
        -v n8n_n8n_data:/data:ro \
        -v "$(pwd)/$SAFETY_BACKUP_DIR":/backup \
        ubuntu \
        tar czf /backup/current-n8n-data.tar.gz -C /data . 2>/dev/null || log_warning "Não foi possível fazer backup atual do volume"
fi

log_success "Backup de segurança criado em: $SAFETY_BACKUP_DIR"

# Restaurar banco de dados
log_info "Restaurando banco de dados..."

# Dropar e recriar banco
docker exec -i $POSTGRES_CONTAINER psql -U postgres << EOF
DROP DATABASE IF EXISTS n8n;
CREATE DATABASE n8n WITH ENCODING = 'UTF8';
EOF

# Restaurar dados
cat "$DB_BACKUP" | docker exec -i $POSTGRES_CONTAINER psql -U postgres -d n8n

if [ $? -eq 0 ]; then
    log_success "Banco de dados restaurado com sucesso"
else
    log_error "Erro ao restaurar banco de dados!"
    log_info "Você pode tentar restaurar manualmente de: $SAFETY_BACKUP_DIR"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Restaurar volume de dados
if [ -n "$VOLUME_BACKUP" ] && [ -f "$VOLUME_BACKUP" ]; then
    log_info "Restaurando volume de dados..."
    
    # Verificar se volume existe, se não, criar
    if ! docker volume ls | grep -q "n8n_n8n_data"; then
        log_info "Criando volume n8n_n8n_data..."
        docker volume create n8n_n8n_data
    fi
    
    # Limpar volume atual
    docker run --rm \
        -v n8n_n8n_data:/data \
        ubuntu \
        sh -c "rm -rf /data/*"
    
    # Restaurar dados
    docker run --rm \
        -v n8n_n8n_data:/data \
        -v "$TEMP_DIR":/backup \
        ubuntu \
        tar xzf "/backup/$(basename $VOLUME_BACKUP)" -C /data
    
    if [ $? -eq 0 ]; then
        log_success "Volume de dados restaurado com sucesso"
    else
        log_error "Erro ao restaurar volume de dados!"
        log_info "O banco foi restaurado, mas o volume falhou"
        log_info "Você pode tentar restaurar manualmente de: $SAFETY_BACKUP_DIR"
    fi
else
    log_warning "Pulando restore do volume (não encontrado no backup)"
fi

# Reiniciar serviço N8N
log_info "Reiniciando serviço N8N..."
if docker service ls 2>/dev/null | grep -q "n8n_n8n"; then
    docker service scale n8n_n8n=1
    log_success "Serviço N8N reiniciado"
else
    log_warning "Execute manualmente: docker stack deploy -c stack-n8n-oficialmed.yml n8n"
fi

# Limpar diretório temporário
log_info "Limpando arquivos temporários..."
rm -rf "$TEMP_DIR"
log_success "Limpeza concluída"

# Aguardar inicialização
log_info "Aguardando inicialização do N8N (30 segundos)..."
sleep 30

# Verificar se está rodando
log_info "Verificando status do serviço..."
if docker service ps n8n_n8n 2>/dev/null | grep -q "Running"; then
    log_success "N8N está rodando!"
elif docker ps | grep -q "n8n"; then
    log_success "N8N está rodando!"
else
    log_warning "N8N pode não estar rodando corretamente"
    log_info "Verifique os logs: docker service logs n8n_n8n -f"
fi

# Resumo
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║          Restore Concluído com Sucesso!          ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BLUE}📋 Resumo do Restore:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "✅ Banco de dados restaurado"
if [ -n "$VOLUME_BACKUP" ]; then
    echo -e "✅ Volume de dados restaurado"
else
    echo -e "⚠️  Volume de dados não estava no backup"
fi
echo -e "✅ Serviço reiniciado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}🔗 Acesso:${NC}"
echo "  Interface: https://workflows.oficialmed.com.br"
echo "  Webhooks:  https://webhook.oficialmed.com.br"
echo ""
echo -e "${BLUE}💾 Backup de Segurança:${NC}"
echo "  Os dados anteriores foram salvos em:"
echo "  $SAFETY_BACKUP_DIR"
echo ""
echo -e "${YELLOW}⚠  Próximos passos:${NC}"
echo "  1. Verifique se o N8N está acessível"
echo "  2. Teste login e workflows"
echo "  3. Verifique os logs se houver problemas:"
echo "     docker service logs n8n_n8n -f"
echo ""

log_success "Restore finalizado!"

