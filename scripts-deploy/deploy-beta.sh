#!/bin/bash

# 🚀 Script de Deploy do Beta - Oficial Med
# Este script faz o build e push da imagem Docker para o Docker Hub

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     Deploy Beta - Oficial Med PWA                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Verificar se o Docker está rodando
echo -e "${YELLOW}🔍 Verificando Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando. Por favor, inicie o Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker está rodando${NC}"

# Verificar se está logado no Docker Hub
echo -e "${YELLOW}🔍 Verificando login no Docker Hub...${NC}"
if ! docker info 2>&1 | grep -q "Username"; then
    echo -e "${YELLOW}⚠️  Você precisa fazer login no Docker Hub primeiro:${NC}"
    echo -e "   ${CYAN}docker login${NC}"
    read -p "Deseja fazer login agora? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        docker login
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Falha no login. Abortando.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Login necessário. Abortando.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Logado no Docker Hub${NC}"
fi

# Nome da imagem
IMAGE_NAME="oficialmedpro/oficialmed-pwa:latest"
DOCKERFILE="docker/Dockerfile"

echo ""
echo -e "${CYAN}📦 Informações do Build:${NC}"
echo -e "   Imagem: ${CYAN}$IMAGE_NAME${NC}"
echo -e "   Dockerfile: ${CYAN}$DOCKERFILE${NC}"
echo ""

# Confirmar antes de continuar
read -p "Deseja continuar com o build e push? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}❌ Deploy cancelado${NC}"
    exit 0
fi

# Build da imagem
echo ""
echo -e "${YELLOW}🔨 Iniciando build da imagem...${NC}"
echo -e "   Isso pode levar alguns minutos..."
echo ""

docker build -f "$DOCKERFILE" -t "$IMAGE_NAME" .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build da imagem!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"

# Push para Docker Hub
echo ""
echo -e "${YELLOW}📤 Enviando imagem para Docker Hub...${NC}"
echo -e "   Isso pode levar alguns minutos..."
echo ""

docker push "$IMAGE_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no push da imagem!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Imagem enviada para Docker Hub com sucesso!${NC}"

# Instruções para atualizar a stack
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          Build e Push Concluídos!                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${CYAN}📋 Próximos passos para atualizar o Beta:${NC}"
echo ""
echo -e "${YELLOW}OPÇÃO 1: Via Portainer (Recomendado)${NC}"
echo "   1. Acesse: https://portainer.oficialmed.com.br"
echo "   2. Vá em Stacks → Procure pela stack 'beta' ou 'bi-beta-stack'"
echo "   3. Clique em 'Editor' ou 'Update the stack'"
echo -e "   4. ${GREEN}✅ Marque 'Pull latest image'${NC}"
echo "   5. Clique em 'Update the stack'"
echo ""
echo -e "${YELLOW}OPÇÃO 2: Via SSH (Linha de Comando)${NC}"
echo "   Conecte-se ao servidor e execute:"
echo -e "   ${CYAN}docker service update --image $IMAGE_NAME --force <nome-do-servico-beta>${NC}"
echo ""
echo "   Ou atualize a stack completa:"
echo -e "   ${CYAN}docker stack deploy -c stacks/stack-beta-oficialmed-correto.yml beta --with-registry-auth${NC}"
echo ""
echo -e "${CYAN}🔗 Verificar imagem no Docker Hub:${NC}"
echo "   https://hub.docker.com/r/oficialmedpro/oficialmed-pwa/tags"
echo ""
echo -e "${CYAN}🌐 URL do Beta:${NC}"
echo "   https://beta.oficialmed.com.br"
echo ""

