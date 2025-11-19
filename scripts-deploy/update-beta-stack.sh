#!/bin/bash

# 🚀 Script para Atualizar a Stack Beta no Servidor
# Execute este script no servidor manager do Docker Swarm

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     Atualizar Stack Beta - Oficial Med               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Verificar se está no manager node
echo -e "${YELLOW}🔍 Verificando se está no manager node...${NC}"
if ! docker info | grep -q "Is Manager: true"; then
    echo -e "${RED}❌ Este script deve ser executado no manager node do Docker Swarm${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Manager node detectado${NC}"

# Verificar se a stack existe
STACK_NAME="beta"
echo -e "${YELLOW}🔍 Verificando se a stack '$STACK_NAME' existe...${NC}"

if ! docker stack ls | grep -q "$STACK_NAME"; then
    echo -e "${YELLOW}⚠️  Stack '$STACK_NAME' não encontrada.${NC}"
    echo -e "${YELLOW}   Tentando encontrar stacks relacionadas ao beta...${NC}"
    docker stack ls | grep -i beta || echo "   Nenhuma stack beta encontrada"
    echo ""
    read -p "Deseja criar uma nova stack? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        STACK_FILE="stacks/stack-beta-oficialmed-correto.yml"
        if [ ! -f "$STACK_FILE" ]; then
            echo -e "${RED}❌ Arquivo $STACK_FILE não encontrado!${NC}"
            exit 1
        fi
        echo -e "${YELLOW}📦 Criando nova stack '$STACK_NAME'...${NC}"
        docker stack deploy -c "$STACK_FILE" "$STACK_NAME" --with-registry-auth
        echo -e "${GREEN}✅ Stack criada com sucesso!${NC}"
        exit 0
    else
        echo -e "${YELLOW}❌ Operação cancelada${NC}"
        exit 0
    fi
fi

echo -e "${GREEN}✅ Stack '$STACK_NAME' encontrada${NC}"

# Nome da imagem
IMAGE_NAME="oficialmedpro/oficialmed-pwa:latest"

echo ""
echo -e "${CYAN}📦 Informações da Atualização:${NC}"
echo -e "   Stack: ${CYAN}$STACK_NAME${NC}"
echo -e "   Imagem: ${CYAN}$IMAGE_NAME${NC}"
echo ""

# Confirmar antes de continuar
read -p "Deseja continuar com a atualização? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}❌ Atualização cancelada${NC}"
    exit 0
fi

# Fazer pull da nova imagem
echo ""
echo -e "${YELLOW}📥 Fazendo pull da nova imagem...${NC}"
docker pull "$IMAGE_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao fazer pull da imagem!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Imagem atualizada localmente${NC}"

# Atualizar o serviço
echo ""
echo -e "${YELLOW}🔄 Atualizando serviços da stack...${NC}"

# Encontrar o nome do serviço beta
SERVICE_NAME=$(docker service ls --filter "label=com.docker.stack.namespace=$STACK_NAME" --format "{{.Name}}" | grep -i beta | head -n 1)

if [ -z "$SERVICE_NAME" ]; then
    echo -e "${YELLOW}⚠️  Serviço beta não encontrado. Tentando atualizar a stack completa...${NC}"
    STACK_FILE="stacks/stack-beta-oficialmed-correto.yml"
    if [ -f "$STACK_FILE" ]; then
        docker stack deploy -c "$STACK_FILE" "$STACK_NAME" --with-registry-auth
        echo -e "${GREEN}✅ Stack atualizada com sucesso!${NC}"
    else
        echo -e "${RED}❌ Arquivo $STACK_FILE não encontrado!${NC}"
        exit 1
    fi
else
    echo -e "${CYAN}   Serviço encontrado: $SERVICE_NAME${NC}"
    docker service update --image "$IMAGE_NAME" --force "$SERVICE_NAME"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao atualizar o serviço!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Serviço atualizado com sucesso!${NC}"
fi

# Aguardar alguns segundos
echo ""
echo -e "${YELLOW}⏳ Aguardando estabilização...${NC}"
sleep 5

# Verificar status
echo ""
echo -e "${CYAN}📊 Status dos serviços:${NC}"
docker service ls --filter "label=com.docker.stack.namespace=$STACK_NAME"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          Atualização Concluída!                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Stack Beta atualizada com sucesso!${NC}"
echo ""
echo -e "${CYAN}🌐 URL do Beta:${NC}"
echo "   https://beta.oficialmed.com.br"
echo ""
echo -e "${CYAN}📋 Para verificar os logs:${NC}"
echo "   docker service logs -f $SERVICE_NAME"
echo ""

