#!/bin/bash

# =============================================================================
# SCRIPT DE CONFIGURAÇÃO - Chatwoot
# =============================================================================

echo "🚀 Iniciando configuração do Chatwoot..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root"
   exit 1
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado. Instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
    exit 1
fi

log "Verificando dependências..."

# Criar diretórios necessários
log "Criando diretórios..."
mkdir -p ./certs
mkdir -p ./logs/chatwoot
mkdir -p ./data/postgres-chatwoot
mkdir -p ./data/redis-chatwoot
mkdir -p ./data/chatwoot

# Definir permissões
chmod 755 ./certs
chmod 755 ./logs
chmod 755 ./data

log "Configurando variáveis de ambiente..."

# Gerar chaves secretas
CHATWOOT_SECRET_KEY=$(openssl rand -hex 64)

# Criar arquivo .env para Chatwoot
cat > .env-chatwoot << EOF
# =============================================================================
# CONFIGURAÇÕES Chatwoot
# =============================================================================

# Database
POSTGRES_PASSWORD=a5895d0e44e68fc82c13e7d6a92313dd
POSTGRES_USER=postgres
POSTGRES_DB=chatwoot

# Redis
REDIS_PASSWORD=a5895d0e44e68fc82c13e7d6a92313dd

# Chatwoot
CHATWOOT_SECRET_KEY=${CHATWOOT_SECRET_KEY}
CHATWOOT_FRONTEND_URL=https://chat.oficialmed.com.br

# Timezone
TZ=America/Sao_Paulo

# Mail (configure conforme necessário)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
EOF

log "Arquivo .env-chatwoot criado com sucesso!"

# Verificar se a rede OficialMed existe
log "Verificando rede Docker..."
if ! docker network ls | grep -q "OficialMed"; then
    warning "Rede OficialMed não encontrada. Criando..."
    docker network create OficialMed
    log "Rede OficialMed criada com sucesso!"
else
    log "Rede OficialMed já existe."
fi

# Verificar se os certificados SSL existem
log "Verificando certificados SSL..."

if [ ! -f "./certs/chat.oficialmed.com.br.crt" ] || [ ! -f "./certs/chat.oficialmed.com.br.key" ]; then
    warning "Certificados SSL para chat.oficialmed.com.br não encontrados!"
    info "Execute o seguinte comando para gerar certificados com Let's Encrypt:"
    echo ""
    echo "sudo certbot certonly --standalone -d chat.oficialmed.com.br"
    echo "sudo cp /etc/letsencrypt/live/chat.oficialmed.com.br/fullchain.pem ./certs/chat.oficialmed.com.br.crt"
    echo "sudo cp /etc/letsencrypt/live/chat.oficialmed.com.br/privkey.pem ./certs/chat.oficialmed.com.br.key"
    echo "sudo chown \$USER:\$USER ./certs/chat.oficialmed.com.br.*"
    echo ""
fi

# Mostrar próximos passos
echo ""
log "✅ Configuração inicial do Chatwoot concluída!"
echo ""
info "Próximos passos:"
echo ""
echo "1. 📋 Configure os certificados SSL:"
echo "   - Execute os comandos certbot mostrados acima"
echo "   - Ou copie seus certificados existentes para ./certs/"
echo ""
echo "2. 📧 Configure o email (opcional):"
echo "   - Edite o arquivo .env-chatwoot"
echo "   - Adicione suas credenciais SMTP"
echo ""
echo "3. 🚀 Inicie o Chatwoot:"
echo "   docker-compose -f stack-chatwoot.yml up -d"
echo ""
echo "4. 🔧 Configure o Chatwoot:"
echo "   - Acesse https://chat.oficialmed.com.br"
echo "   - Crie sua conta de administrador"
echo "   - Configure sua primeira conta/workspace"
echo ""
echo "5. 📊 Monitore os logs:"
echo "   docker-compose -f stack-chatwoot.yml logs -f"
echo ""

warning "IMPORTANTE:"
echo "- Certifique-se de que o domínio chat.oficialmed.com.br"
echo "  aponta para o IP do seu servidor"
echo "- Configure o firewall para permitir as portas 80 e 443"
echo "- Faça backup regular dos volumes Docker"

log "Configuração do Chatwoot concluída! 🎉"
