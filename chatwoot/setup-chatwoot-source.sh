#!/bin/bash

# =============================================================================
# SCRIPT DE SETUP - Chatwoot Source Code
# =============================================================================

echo "🚀 Configurando código-fonte do Chatwoot..."

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

# Verificar se Git está instalado
if ! command -v git &> /dev/null; then
    error "Git não está instalado. Instale o Git primeiro."
    exit 1
fi

# Criar estrutura de diretórios
log "Criando estrutura de diretórios..."
mkdir -p chatwoot/source
mkdir -p chatwoot/customizations
mkdir -p chatwoot/integrations/api
mkdir -p chatwoot/integrations/webhooks
mkdir -p chatwoot/integrations/sync

# Verificar se o repositório já foi clonado
if [ -d "chatwoot/source/.git" ]; then
    warning "Repositório do Chatwoot já existe."
    read -p "Deseja atualizar? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        log "Atualizando repositório..."
        cd chatwoot/source
        git fetch origin
        git pull origin main
        cd ../..
    else
        info "Pulando atualização."
    fi
else
    log "Clonando repositório do Chatwoot..."
    cd chatwoot
    git clone https://github.com/chatwoot/chatwoot.git source
    
    if [ $? -eq 0 ]; then
        log "Repositório clonado com sucesso!"
        cd source
        
        # Verificar versão mais recente
        info "Verificando versões disponíveis..."
        git fetch --tags
        
        # Listar últimas 5 versões
        echo ""
        info "Últimas versões disponíveis:"
        git tag --sort=-v:refname | head -5
        
        echo ""
        read -p "Digite a versão desejada (ou pressione Enter para usar 'main'): " VERSION
        
        if [ -z "$VERSION" ]; then
            VERSION="main"
        else
            git checkout "v${VERSION}" 2>/dev/null || git checkout "$VERSION" 2>/dev/null || {
                warning "Versão não encontrada, usando 'main'"
                VERSION="main"
            }
        fi
        
        log "Usando versão: $VERSION"
        cd ../..
    else
        error "Falha ao clonar repositório."
        exit 1
    fi
fi

# Criar arquivo .gitignore para customizações
log "Criando .gitignore..."
cat > chatwoot/customizations/.gitignore << EOF
# Ignorar tudo exceto arquivos de configuração
*
!.gitignore
!README.md
EOF

# Criar README para customizações
log "Criando documentação..."
cat > chatwoot/customizations/README.md << 'EOF'
# Customizações do Chatwoot

Este diretório contém todas as modificações personalizadas do Chatwoot.

## Estrutura Recomendada

```
customizations/
├── app/              # Modificações de aplicação Rails
├── frontend/         # Modificações do frontend React
├── config/           # Arquivos de configuração customizados
└── patches/          # Patches para aplicar no código-fonte
```

## Como Aplicar Modificações

1. **Patches**: Use patches Git para aplicar modificações no código-fonte
2. **Overrides**: Sobrescreva arquivos específicos
3. **Plugins**: Crie plugins/extensões quando possível

## Manutenção

Ao atualizar o Chatwoot, verifique se suas customizações ainda são compatíveis.
EOF

# Criar README para integrações
cat > chatwoot/integrations/README.md << 'EOF'
# Integrações com CRM

Este diretório contém código para integrar o Chatwoot com o CRM.

## Estrutura

- `api/` - Endpoints de API customizados
- `webhooks/` - Handlers de webhooks do Chatwoot
- `sync/` - Scripts de sincronização de dados

## Exemplos de Integração

### Webhook Handler

Quando uma conversa é criada no Chatwoot, podemos criar um lead no CRM:

```ruby
# integrations/webhooks/conversation_created.rb
class ConversationCreatedHandler
  def self.handle(conversation)
    # Criar lead no CRM
    CRM::Lead.create_from_chatwoot(conversation)
  end
end
```

### API Endpoint

Expor dados do CRM no Chatwoot:

```ruby
# integrations/api/crm_controller.rb
class CrmController < ApplicationController
  def show_lead
    lead = CRM::Lead.find(params[:id])
    render json: lead.to_chatwoot_format
  end
end
```
EOF

# Criar arquivo de exemplo de integração
log "Criando exemplo de integração..."
cat > chatwoot/integrations/sync/example.rb << 'EOF'
# Exemplo de sincronização entre Chatwoot e CRM
# Este arquivo é apenas um exemplo - adapte conforme necessário

module ChatwootCRMIntegration
  class Sync
    def self.sync_conversation_to_crm(conversation)
      # Implementar lógica de sincronização
      # Exemplo:
      # 1. Buscar dados da conversa
      # 2. Criar/atualizar lead no CRM
      # 3. Associar conversa ao lead
    end
    
    def self.sync_contact_to_crm(contact)
      # Implementar lógica de sincronização de contato
    end
  end
end
EOF

log "✅ Configuração do código-fonte concluída!"
echo ""
info "Próximos passos:"
echo ""
echo "1. 📝 Revise o código-fonte em: chatwoot/source/"
echo "2. 🔧 Configure as variáveis de ambiente"
echo "3. 🚀 Configure no EasyPanel usando o docker-compose.yml"
echo "4. 🔗 Implemente as integrações em: chatwoot/integrations/"
echo ""
warning "IMPORTANTE:"
echo "- Faça backup antes de modificar o código-fonte"
echo "- Use branches Git para suas modificações"
echo "- Documente todas as customizações"
echo ""


