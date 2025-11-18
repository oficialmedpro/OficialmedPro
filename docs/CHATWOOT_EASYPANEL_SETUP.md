# 🚀 Guia de Instalação do Chatwoot no EasyPanel

Este guia explica como instalar o Chatwoot no EasyPanel com o código-fonte disponível para modificações e integração com o CRM.

## 📋 Pré-requisitos

1. EasyPanel instalado e configurado
2. Acesso SSH ao servidor
3. Git instalado
4. Docker e Docker Compose instalados

## 🔧 Passo 1: Preparar o Código-Fonte

### 1.1 Clonar o Repositório do Chatwoot

Execute o script de setup:

```bash
cd /caminho/do/seu/projeto
chmod +x chatwoot/setup-chatwoot-source.sh
./chatwoot/setup-chatwoot-source.sh
```

Isso irá:
- Criar a estrutura de diretórios
- Clonar o código-fonte do Chatwoot
- Criar diretórios para customizações e integrações

### 1.2 Verificar Estrutura

Após a execução, você deve ter:

```
chatwoot/
├── source/              # Código-fonte do Chatwoot
├── customizations/     # Suas modificações
├── integrations/       # Código de integração
├── docker-compose.yml  # Configuração Docker
└── .env.example        # Exemplo de variáveis
```

## 🚀 Passo 2: Configurar no EasyPanel

### 2.1 Criar Novo Projeto

1. Acesse o EasyPanel
2. Clique em **"New Project"**
3. Nome: `chatwoot`
4. Clique em **"Create"**

### 2.2 Configurar Variáveis de Ambiente

1. No projeto `chatwoot`, vá em **"Environment Variables"**
2. Adicione as seguintes variáveis (copie do `.env.example`):

**Obrigatórias:**
- `POSTGRES_PASSWORD` - Senha do PostgreSQL
- `POSTGRES_USER` - Usuário do PostgreSQL (padrão: `postgres`)
- `POSTGRES_DB` - Nome do banco (padrão: `chatwoot`)
- `REDIS_PASSWORD` - Senha do Redis
- `SECRET_KEY_BASE` - **Gere uma nova chave**: `openssl rand -hex 64`
- `FRONTEND_URL` - URL pública (ex: `https://chat.oficialmed.com.br`)

**Opcionais (mas recomendadas):**
- `SMTP_ADDRESS` - Servidor SMTP
- `SMTP_USERNAME` - Usuário SMTP
- `SMTP_PASSWORD` - Senha SMTP
- `MAILER_SENDER_EMAIL` - Email remetente

**Integração CRM:**
- `CRM_API_URL` - URL da API do seu CRM
- `CRM_API_KEY` - Chave de API do CRM
- `CRM_WEBHOOK_SECRET` - Secret para webhooks

### 2.3 Configurar Docker Compose

1. No EasyPanel, vá em **"Services"** ou **"Docker Compose"**
2. Clique em **"Add Service"** ou **"Edit Compose"**
3. Cole o conteúdo do arquivo `chatwoot/docker-compose.yml`

**Importante para EasyPanel:**
- O EasyPanel pode usar um caminho diferente para o código-fonte
- Ajuste o `build.context` se necessário
- Ou use uma imagem pré-construída se preferir

### 2.4 Alternativa: Usar Imagem Docker

Se preferir não fazer build local, você pode usar a imagem oficial:

```yaml
chatwoot-web:
  image: chatwoot/chatwoot:latest
  # ... resto da configuração
```

Mas para ter o código-fonte modificável, use o build local.

## 🔗 Passo 3: Integração com CRM

### 3.1 Estrutura de Integração

O diretório `chatwoot/integrations/` contém:

- `api/` - Endpoints de API customizados
- `webhooks/` - Handlers de webhooks
- `sync/` - Scripts de sincronização

### 3.2 Exemplo: Webhook para Criar Lead no CRM

Crie o arquivo `chatwoot/integrations/webhooks/crm_sync.rb`:

```ruby
# app/services/crm_sync_service.rb
class CrmSyncService
  def self.sync_conversation(conversation)
    # Buscar dados da conversa
    contact = conversation.contact
    account = conversation.account
    
    # Criar/atualizar lead no CRM
    crm_client = CrmClient.new(
      api_url: ENV['CRM_API_URL'],
      api_key: ENV['CRM_API_KEY']
    )
    
    lead_data = {
      name: contact.name,
      email: contact.email,
      phone: contact.phone_number,
      source: 'chatwoot',
      conversation_id: conversation.id,
      account_id: account.id
    }
    
    crm_client.create_or_update_lead(lead_data)
  end
end
```

### 3.3 Registrar Webhook no Chatwoot

No código-fonte do Chatwoot, adicione um callback:

```ruby
# app/models/conversation.rb (modificação)
class Conversation < ApplicationRecord
  after_create :sync_to_crm, if: :should_sync_to_crm?
  
  private
  
  def sync_to_crm
    CrmSyncService.sync_conversation(self)
  end
  
  def should_sync_to_crm?
    ENV['CRM_API_URL'].present?
  end
end
```

### 3.4 API Endpoint para Buscar Dados do CRM

Crie um controller customizado:

```ruby
# app/controllers/api/v1/crm_controller.rb
module Api
  module V1
    class CrmController < ApplicationController
      before_action :authenticate_user!
      
      def show_lead
        crm_client = CrmClient.new(
          api_url: ENV['CRM_API_URL'],
          api_key: ENV['CRM_API_KEY']
        )
        
        lead = crm_client.get_lead(params[:id])
        render json: lead
      end
    end
  end
end
```

## 🔄 Passo 4: Deploy e Inicialização

### 4.1 Build e Deploy

1. No EasyPanel, clique em **"Deploy"** ou **"Start"**
2. Aguarde o build das imagens (pode demorar alguns minutos)
3. Verifique os logs para garantir que tudo está funcionando

### 4.2 Inicializar Banco de Dados

O Chatwoot precisa inicializar o banco de dados na primeira execução:

```bash
# Via EasyPanel terminal ou SSH
docker exec -it chatwoot-web bundle exec rails db:chatwoot_prepare
```

Ou o docker-compose já faz isso automaticamente no primeiro start.

### 4.3 Criar Conta de Administrador

1. Acesse `https://chat.oficialmed.com.br`
2. Clique em **"Create Account"**
3. Preencha os dados do administrador
4. Configure sua primeira conta/workspace

## 📝 Passo 5: Manutenção e Atualizações

### 5.1 Atualizar Código-Fonte

```bash
cd chatwoot/source
git fetch origin
git checkout v2.0.0  # ou versão desejada
cd ../..
```

### 5.2 Rebuild no EasyPanel

1. No EasyPanel, vá em **"Services"**
2. Selecione o serviço `chatwoot-web`
3. Clique em **"Rebuild"** ou **"Redeploy"**

### 5.3 Backup

Faça backup regular dos volumes:

```bash
# Backup PostgreSQL
docker exec postgres-chatwoot pg_dump -U postgres chatwoot > backup_chatwoot_$(date +%Y%m%d).sql

# Backup volumes
docker run --rm -v chatwoot_chatwoot_data:/data -v $(pwd):/backup alpine tar czf /backup/chatwoot_data_$(date +%Y%m%d).tar.gz /data
```

## 🔍 Troubleshooting

### Problema: Container não inicia

**Solução:**
- Verifique os logs: `docker logs chatwoot-web`
- Verifique as variáveis de ambiente
- Verifique se PostgreSQL e Redis estão rodando

### Problema: Erro de conexão com banco

**Solução:**
- Verifique se `POSTGRES_HOST` está correto
- Verifique se a senha está correta
- Verifique se o banco foi criado

### Problema: Build falha

**Solução:**
- Verifique se o código-fonte foi clonado corretamente
- Verifique se o Dockerfile existe em `chatwoot/source/`
- Verifique os logs de build no EasyPanel

## 📚 Recursos Adicionais

- [Documentação Oficial do Chatwoot](https://www.chatwoot.com/docs)
- [API do Chatwoot](https://www.chatwoot.com/developers/api)
- [GitHub do Chatwoot](https://github.com/chatwoot/chatwoot)
- [Guia de Desenvolvimento](https://github.com/chatwoot/chatwoot/blob/develop/CONTRIBUTING.md)

## 🎯 Próximos Passos

1. ✅ Configurar integração com seu CRM
2. ✅ Personalizar interface conforme necessário
3. ✅ Configurar canais de comunicação (WhatsApp, Facebook, etc.)
4. ✅ Treinar equipe de atendimento
5. ✅ Configurar automações e chatbots

---

**Dúvidas?** Consulte a documentação do Chatwoot ou abra uma issue no repositório.



