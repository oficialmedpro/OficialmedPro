#!/bin/bash

# =====================================================
# Script de Backup N8N - Oficial Med
# =====================================================

set -e  # Parar em caso de erro

# Configurações
BACKUP_DIR="./backups/n8n"
RETENTION_DAYS=30  # Manter backups dos últimos 30 dias
DATE=$(date +%Y%m%d-%H%M%S)

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
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║          Backup N8N - Oficial Med                 ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Criar diretório de backup
log_info "Criando diretório de backup..."
mkdir -p "$BACKUP_DIR"
log_success "Diretório: $BACKUP_DIR"

# Verificar se o serviço está rodando
log_info "Verificando se N8N está rodando..."
if ! docker service ls 2>/dev/null | grep -q "n8n_n8n"; then
    if ! docker ps | grep -q "n8n"; then
        log_error "N8N não está rodando!"
        exit 1
    fi
fi
log_success "N8N está rodando"

# Verificar se PostgreSQL está rodando
log_info "Verificando PostgreSQL..."
POSTGRES_CONTAINER=$(docker ps -q -f name=postgres)
if [ -z "$POSTGRES_CONTAINER" ]; then
    log_error "PostgreSQL não está rodando!"
    exit 1
fi
log_success "PostgreSQL encontrado: $POSTGRES_CONTAINER"

# Backup do banco de dados
log_info "Iniciando backup do banco de dados..."
DB_BACKUP_FILE="$BACKUP_DIR/n8n-db-$DATE.sql"
docker exec -t $POSTGRES_CONTAINER pg_dump -U postgres n8n > "$DB_BACKUP_FILE"

if [ -f "$DB_BACKUP_FILE" ] && [ -s "$DB_BACKUP_FILE" ]; then
    DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    log_success "Backup do banco criado: $DB_SIZE"
else
    log_error "Falha ao criar backup do banco!"
    exit 1
fi

# Backup do volume de dados
log_info "Iniciando backup do volume de dados..."
VOLUME_BACKUP_FILE="$BACKUP_DIR/n8n-data-$DATE.tar.gz"

# Verificar se o volume existe
if docker volume ls | grep -q "n8n_n8n_data"; then
    docker run --rm \
        -v n8n_n8n_data:/data:ro \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        ubuntu \
        tar czf "/backup/n8n-data-$DATE.tar.gz" -C /data .
    
    if [ -f "$VOLUME_BACKUP_FILE" ] && [ -s "$VOLUME_BACKUP_FILE" ]; then
        VOLUME_SIZE=$(du -h "$VOLUME_BACKUP_FILE" | cut -f1)
        log_success "Backup do volume criado: $VOLUME_SIZE"
    else
        log_error "Falha ao criar backup do volume!"
        exit 1
    fi
else
    log_warning "Volume n8n_n8n_data não encontrado, pulando..."
fi

# Compactar tudo em um arquivo único
log_info "Criando backup consolidado..."
CONSOLIDATED_BACKUP="$BACKUP_DIR/n8n-backup-completo-$DATE.tar.gz"
cd "$BACKUP_DIR"
tar czf "n8n-backup-completo-$DATE.tar.gz" "n8n-db-$DATE.sql" "n8n-data-$DATE.tar.gz" 2>/dev/null || true
cd - > /dev/null

if [ -f "$CONSOLIDATED_BACKUP" ]; then
    CONSOLIDATED_SIZE=$(du -h "$CONSOLIDATED_BACKUP" | cut -f1)
    log_success "Backup consolidado criado: $CONSOLIDATED_SIZE"
    
    # Remover arquivos individuais para economizar espaço
    rm -f "$DB_BACKUP_FILE" "$VOLUME_BACKUP_FILE"
    log_info "Arquivos individuais removidos (consolidados)"
else
    log_warning "Não foi possível criar backup consolidado, mantendo arquivos individuais"
fi

# Criar arquivo de metadados
log_info "Criando metadados do backup..."
METADATA_FILE="$BACKUP_DIR/n8n-backup-$DATE.info"
cat > "$METADATA_FILE" << EOF
Backup N8N - Oficial Med
========================

Data/Hora: $(date '+%Y-%m-%d %H:%M:%S')
Servidor: $(hostname)
Usuario: $(whoami)

Componentes:
- Banco de dados PostgreSQL (n8n)
- Volume de dados n8n_n8n_data

Arquivos criados:
EOF

ls -lh "$BACKUP_DIR" | grep "$DATE" >> "$METADATA_FILE"

echo "" >> "$METADATA_FILE"
echo "Versão N8N:" >> "$METADATA_FILE"
docker service inspect n8n_n8n --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null >> "$METADATA_FILE" || echo "Não disponível" >> "$METADATA_FILE"

log_success "Metadados salvos"

# Limpar backups antigos
log_info "Limpando backups antigos (>${RETENTION_DAYS} dias)..."
DELETED_COUNT=0
find "$BACKUP_DIR" -name "n8n-backup-completo-*.tar.gz" -mtime +$RETENTION_DAYS -type f | while read file; do
    rm -f "$file"
    DELETED_COUNT=$((DELETED_COUNT + 1))
    log_info "Removido: $(basename $file)"
done

if [ $DELETED_COUNT -eq 0 ]; then
    log_info "Nenhum backup antigo para remover"
else
    log_success "Removidos $DELETED_COUNT backup(s) antigo(s)"
fi

# Verificar integridade do backup
log_info "Verificando integridade do backup..."
if [ -f "$CONSOLIDATED_BACKUP" ]; then
    if tar tzf "$CONSOLIDATED_BACKUP" > /dev/null 2>&1; then
        log_success "Backup está íntegro e pode ser restaurado"
    else
        log_error "Backup pode estar corrompido!"
        exit 1
    fi
fi

# Resumo
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║            Backup Concluído com Sucesso!          ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BLUE}📦 Resumo do Backup:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "📁 Diretório:    ${GREEN}$BACKUP_DIR${NC}"
echo -e "📅 Data/Hora:    ${GREEN}$(date '+%Y-%m-%d %H:%M:%S')${NC}"

if [ -f "$CONSOLIDATED_BACKUP" ]; then
    echo -e "📦 Arquivo:      ${GREEN}n8n-backup-completo-$DATE.tar.gz${NC}"
    echo -e "💾 Tamanho:      ${GREEN}$CONSOLIDATED_SIZE${NC}"
else
    echo -e "📦 Arquivos:"
    [ -f "$DB_BACKUP_FILE" ] && echo -e "   - ${GREEN}n8n-db-$DATE.sql ($DB_SIZE)${NC}"
    [ -f "$VOLUME_BACKUP_FILE" ] && echo -e "   - ${GREEN}n8n-data-$DATE.tar.gz ($VOLUME_SIZE)${NC}"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📋 Para restaurar este backup:${NC}"
if [ -f "$CONSOLIDATED_BACKUP" ]; then
    echo "  1. Extrair: tar xzf n8n-backup-completo-$DATE.tar.gz"
    echo "  2. Restaurar DB: cat n8n-db-$DATE.sql | docker exec -i \$(docker ps -q -f name=postgres) psql -U postgres -d n8n"
    echo "  3. Restaurar volume: docker run --rm -v n8n_n8n_data:/data -v \$(pwd):/backup ubuntu tar xzf /backup/n8n-data-$DATE.tar.gz -C /data"
else
    echo "  1. Restaurar DB: cat $DB_BACKUP_FILE | docker exec -i \$(docker ps -q -f name=postgres) psql -U postgres -d n8n"
    [ -f "$VOLUME_BACKUP_FILE" ] && echo "  2. Restaurar volume: docker run --rm -v n8n_n8n_data:/data -v \$(pwd):/backup ubuntu tar xzf /backup/n8n-data-$DATE.tar.gz -C /data"
fi
echo ""
echo -e "${YELLOW}⚠  Lembre-se de parar o serviço antes de restaurar!${NC}"
echo "   docker service scale n8n_n8n=0"
echo ""

# Listar backups existentes
echo -e "${BLUE}📚 Backups existentes:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lht "$BACKUP_DIR" | grep "n8n-backup-completo" | head -10 || echo "Nenhum backup encontrado"
echo ""

log_success "Backup finalizado com sucesso!"

