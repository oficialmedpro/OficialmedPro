#!/bin/bash

# =====================================================
# Script de Deploy N8N - Oficial Med
# =====================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
echo "║          Deploy N8N - Oficial Med                 ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se está no diretório correto
if [ ! -f "stack-n8n-oficialmed.yml" ]; then
    log_error "Arquivo stack-n8n-oficialmed.yml não encontrado!"
    log_info "Execute este script no diretório correto."
    exit 1
fi

# Verificar se Docker Swarm está ativo
log_info "Verificando Docker Swarm..."
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    log_error "Docker Swarm não está ativo!"
    log_info "Inicialize o swarm com: docker swarm init"
    exit 1
fi
log_success "Docker Swarm está ativo"

# Verificar se a rede OficialMed existe
log_info "Verificando rede OficialMed..."
if ! docker network ls | grep -q "OficialMed"; then
    log_warning "Rede OficialMed não encontrada. Criando..."
    docker network create --driver overlay OficialMed
    log_success "Rede OficialMed criada"
else
    log_success "Rede OficialMed já existe"
fi

# Verificar se PostgreSQL está rodando
log_info "Verificando PostgreSQL..."
if docker ps | grep -q postgres; then
    log_success "PostgreSQL está rodando"
    
    # Perguntar se deseja criar o banco de dados
    read -p "$(echo -e ${YELLOW}Deseja criar o banco de dados n8n agora? [s/N]:${NC} )" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        log_info "Criando banco de dados n8n..."
        
        # Tentar criar o banco (ignorar erro se já existir)
        docker exec -i $(docker ps -q -f name=postgres) psql -U postgres <<-EOSQL 2>/dev/null || log_warning "Banco já pode existir"
            CREATE DATABASE n8n WITH ENCODING = 'UTF8' LC_COLLATE = 'pt_BR.UTF-8' LC_CTYPE = 'pt_BR.UTF-8' TEMPLATE = template0;
            \c n8n
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOSQL
        
        # Verificar se o banco foi criado
        if docker exec -i $(docker ps -q -f name=postgres) psql -U postgres -lqt | cut -d \| -f 1 | grep -qw n8n; then
            log_success "Banco de dados n8n criado com sucesso"
        else
            log_warning "Não foi possível verificar se o banco foi criado"
        fi
    fi
else
    log_error "PostgreSQL não está rodando!"
    log_info "Certifique-se de que o PostgreSQL está ativo antes de continuar."
    exit 1
fi

# Verificar se Traefik está rodando
log_info "Verificando Traefik..."
if docker service ls | grep -q traefik || docker ps | grep -q traefik; then
    log_success "Traefik está rodando"
else
    log_warning "Traefik não encontrado!"
    log_warning "Certifique-se de que o Traefik está configurado para SSL/TLS funcionar"
fi

# Verificar DNS
log_info "Verificando configuração DNS..."
echo -e "${YELLOW}Certifique-se de que os seguintes domínios estão configurados:${NC}"
echo "  - workflows.oficialmed.com.br"
echo "  - webhook.oficialmed.com.br"
echo ""
read -p "$(echo -e ${YELLOW}DNS configurado corretamente? [s/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    log_warning "Configure o DNS antes de continuar para evitar problemas com SSL"
    read -p "$(echo -e ${YELLOW}Deseja continuar mesmo assim? [s/N]:${NC} )" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_info "Deploy cancelado"
        exit 0
    fi
fi

# Deploy da stack
echo ""
log_info "Iniciando deploy da stack N8N..."
docker stack deploy -c stack-n8n-oficialmed.yml n8n

log_success "Stack N8N deployada com sucesso!"

# Aguardar alguns segundos
sleep 5

# Verificar status
echo ""
log_info "Verificando status do serviço..."
docker service ls | grep n8n

# Mostrar logs
echo ""
log_info "Primeiras linhas dos logs (Ctrl+C para sair):"
echo -e "${YELLOW}Aguarde alguns minutos para a inicialização completa...${NC}"
echo ""
sleep 2
docker service logs n8n_n8n -f --tail 50 &
LOGS_PID=$!

# Aguardar 30 segundos e então parar os logs
sleep 30
kill $LOGS_PID 2>/dev/null || true

# Resumo final
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║              Deploy Concluído!                    ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BLUE}📋 Informações de Acesso:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "🌐 Interface:   ${GREEN}https://workflows.oficialmed.com.br${NC}"
echo -e "🔗 Webhooks:    ${GREEN}https://webhook.oficialmed.com.br${NC}"
echo -e "👤 Usuário:     ${GREEN}admin${NC}"
echo -e "🔑 Senha:       ${GREEN}OfiCialMed2025!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠  IMPORTANTE:${NC}"
echo "  1. Altere a senha no primeiro acesso"
echo "  2. Configure backup regular do banco de dados"
echo "  3. Aguarde alguns minutos para a inicialização completa"
echo ""
echo -e "${BLUE}📊 Comandos úteis:${NC}"
echo "  Ver logs:      docker service logs n8n_n8n -f"
echo "  Ver status:    docker service ps n8n_n8n"
echo "  Reiniciar:     docker service update --force n8n_n8n"
echo "  Remover:       docker stack rm n8n"
echo ""
echo -e "${BLUE}📚 Documentação completa em: N8N_SETUP.md${NC}"
echo ""

log_success "Deploy finalizado com sucesso!"

