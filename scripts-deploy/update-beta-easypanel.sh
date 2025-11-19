#!/bin/bash

# Script para Atualizar o Beta no EasyPanel
# Este script atualiza o serviço beta usando a imagem do Docker Hub

set -e

echo "============================================================"
echo "     Atualizar Beta - EasyPanel                           "
echo "============================================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Verificar se está no servidor correto
echo -e "${YELLOW}[*] Verificando ambiente...${NC}"

# Verificar se o diretório do EasyPanel existe
if [ -d "/etc/easypanel/projects/bi-oficialmed" ]; then
    PROJECT_NAME="bi-oficialmed"
    SERVICE_NAME="bi-oficialmed_app"
    IMAGE_NAME="oficialmedpro/oficialmed-pwa:latest"
    echo -e "${GREEN}[OK] Projeto encontrado: bi-oficialmed${NC}"
elif [ -d "/etc/easypanel/projects/beta-oficialpro" ]; then
    PROJECT_NAME="beta-oficialpro"
    SERVICE_NAME="beta-oficialpro_app"
    IMAGE_NAME="oficialmedpro/oficialmed-pwa:latest"
    echo -e "${GREEN}[OK] Projeto encontrado: beta-oficialpro${NC}"
else
    echo -e "${RED}[ERRO] Nenhum projeto beta encontrado em /etc/easypanel/projects/${NC}"
    echo -e "${YELLOW}Projetos disponíveis:${NC}"
    ls -la /etc/easypanel/projects/ 2>/dev/null || echo "   (não foi possível listar)"
    exit 1
fi

echo ""
echo -e "${CYAN}[*] Informações do Deploy:${NC}"
echo -e "   Projeto: ${CYAN}$PROJECT_NAME${NC}"
echo -e "   Serviço: ${CYAN}$SERVICE_NAME${NC}"
echo -e "   Imagem: ${CYAN}$IMAGE_NAME${NC}"
echo ""

# Verificar se o serviço existe
echo -e "${YELLOW}[*] Verificando se o serviço existe...${NC}"
if ! docker service ls | grep -q "$SERVICE_NAME"; then
    echo -e "${RED}[ERRO] Serviço $SERVICE_NAME não encontrado!${NC}"
    echo -e "${YELLOW}Serviços disponíveis:${NC}"
    docker service ls
    exit 1
fi
echo -e "${GREEN}[OK] Serviço encontrado${NC}"

# Confirmar antes de continuar
echo ""
read -p "Deseja continuar com a atualização? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}[CANCELADO] Atualização cancelada${NC}"
    exit 0
fi

# Navegar para o diretório do projeto
cd /etc/easypanel/projects/$PROJECT_NAME

# Parar o serviço
echo ""
echo -e "${YELLOW}[*] Parando o serviço...${NC}"
docker service scale ${SERVICE_NAME}=0

# Aguardar alguns segundos
echo -e "${YELLOW}[*] Aguardando 5 segundos...${NC}"
sleep 5

# Fazer pull da nova imagem do Docker Hub
echo ""
echo -e "${YELLOW}[*] Fazendo pull da nova imagem do Docker Hub...${NC}"
docker pull $IMAGE_NAME

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERRO] Erro ao fazer pull da imagem!${NC}"
    echo -e "${YELLOW}[*] Reiniciando o serviço com a imagem anterior...${NC}"
    docker service scale ${SERVICE_NAME}=1
    exit 1
fi

echo -e "${GREEN}[OK] Imagem atualizada${NC}"

# Atualizar o serviço com a nova imagem
echo ""
echo -e "${YELLOW}[*] Atualizando o serviço com a nova imagem...${NC}"
docker service update --image $IMAGE_NAME --force $SERVICE_NAME

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERRO] Erro ao atualizar o serviço!${NC}"
    exit 1
fi

# Reiniciar o serviço
echo ""
echo -e "${YELLOW}[*] Reiniciando o serviço...${NC}"
docker service scale ${SERVICE_NAME}=1

# Aguardar alguns segundos
echo -e "${YELLOW}[*] Aguardando estabilização...${NC}"
sleep 5

# Verificar status
echo ""
echo -e "${CYAN}[*] Status do serviço:${NC}"
docker service ps $SERVICE_NAME

echo ""
echo "============================================================"
echo "          Atualização Concluída!                           "
echo "============================================================"
echo ""
echo -e "${GREEN}[OK] Beta atualizado com sucesso!${NC}"
echo ""
echo -e "${CYAN}[*] URL do Beta:${NC}"
echo "   https://beta.oficialmed.com.br"
echo ""
echo -e "${CYAN}[*] Para verificar os logs:${NC}"
echo "   docker service logs -f $SERVICE_NAME"
echo ""
echo -e "${CYAN}[*] Para verificar o status:${NC}"
echo "   docker service ps $SERVICE_NAME"
echo ""

