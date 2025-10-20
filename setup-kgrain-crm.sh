#!/bin/bash

# =============================================================================
# SCRIPT DE CONFIGURAÇÃO - KGRain CRM
# =============================================================================

echo "🚀 Iniciando configuração do KGRain CRM..."

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
mkdir -p ./logs/kgrain
mkdir -p ./data/postgres-kgrain
mkdir -p ./data/redis-kgrain
mkdir -p ./data/kgrain-crm

# Definir permissões
chmod 755 ./certs
chmod 755 ./logs
chmod 755 ./data

log "Configurando variáveis de ambiente..."

# Gerar chaves secretas
KGRAIN_APP_KEY=$(openssl rand -base64 32)

# Criar arquivo .env para KGRain
cat > .env-kgrain << EOF
# =============================================================================
# CONFIGURAÇÕES KGRain CRM
# =============================================================================

# Database
POSTGRES_PASSWORD=a5895d0e44e68fc82c13e7d6a92313dd
POSTGRES_USER=postgres
POSTGRES_DB=kgrain_crm

# Redis
REDIS_PASSWORD=a5895d0e44e68fc82c13e7d6a92313dd

# KGRain CRM
KGRAIN_APP_KEY=${KGRAIN_APP_KEY}
KGRAIN_APP_URL=https://crm.oficialmed.com.br

# Timezone
TZ=America/Sao_Paulo

# Mail (configure conforme necessário)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
EOF

log "Arquivo .env-kgrain criado com sucesso!"

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

if [ ! -f "./certs/crm.oficialmed.com.br.crt" ] || [ ! -f "./certs/crm.oficialmed.com.br.key" ]; then
    warning "Certificados SSL para crm.oficialmed.com.br não encontrados!"
    info "Execute o seguinte comando para gerar certificados com Let's Encrypt:"
    echo ""
    echo "sudo certbot certonly --standalone -d crm.oficialmed.com.br"
    echo "sudo cp /etc/letsencrypt/live/crm.oficialmed.com.br/fullchain.pem ./certs/crm.oficialmed.com.br.crt"
    echo "sudo cp /etc/letsencrypt/live/crm.oficialmed.com.br/privkey.pem ./certs/crm.oficialmed.com.br.key"
    echo "sudo chown \$USER:\$USER ./certs/crm.oficialmed.com.br.*"
    echo ""
fi

# Mostrar próximos passos
echo ""
log "✅ Configuração inicial do KGRain CRM concluída!"
echo ""
info "Próximos passos:"
echo ""
echo "1. 📋 Configure os certificados SSL:"
echo "   - Execute os comandos certbot mostrados acima"
echo "   - Ou copie seus certificados existentes para ./certs/"
echo ""
echo "2. 📧 Configure o email (opcional):"
echo "   - Edite o arquivo .env-kgrain"
echo "   - Adicione suas credenciais SMTP"
echo ""
echo "3. 🚀 Inicie o KGRain CRM:"
echo "   docker-compose -f stack-kgrain-crm.yml up -d"
echo ""
echo "4. 🔧 Configure o KGRain CRM:"
echo "   - Acesse https://crm.oficialmed.com.br"
echo "   - Siga o assistente de configuração inicial"
echo ""
echo "5. 📊 Monitore os logs:"
echo "   docker-compose -f stack-kgrain-crm.yml logs -f"
echo ""

warning "IMPORTANTE:"
echo "- Certifique-se de que o domínio crm.oficialmed.com.br"
echo "  aponta para o IP do seu servidor"
echo "- Configure o firewall para permitir as portas 80 e 443"
echo "- Faça backup regular dos volumes Docker"

log "Configuração do KGRain CRM concluída! 🎉"
