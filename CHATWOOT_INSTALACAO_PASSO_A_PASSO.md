# 🚀 Instalação do Chatwoot via Código-Fonte - Passo a Passo

## 📋 Visão Geral

Este guia vai te levar passo a passo para instalar o Chatwoot no EasyPanel usando o código-fonte, permitindo modificações e integração com seu CRM.

---

## ✅ PASSO 1: Preparar o Código-Fonte no Servidor

### 1.1 - Conectar no Servidor

Conecte-se via SSH no servidor onde está o EasyPanel:

```bash
ssh usuario@seu-servidor
```

### 1.2 - Navegar para o Diretório do Projeto

```bash
cd /caminho/do/seu/projeto/minha-pwa
# ou onde você tem o projeto
```

### 1.3 - Executar o Script de Setup

```bash
# Dar permissão de execução
chmod +x chatwoot/setup-chatwoot-source.sh

# Executar o script
./chatwoot/setup-chatwoot-source.sh
```

**O que o script faz:**
- Cria a estrutura de pastas
- Clona o código-fonte do Chatwoot do GitHub
- Prepara tudo para modificações

**Tempo estimado:** 5-10 minutos (depende da velocidade da internet)

### 1.4 - Verificar se Funcionou

```bash
ls -la chatwoot/
```

Você deve ver:
- `source/` (com o código-fonte)
- `customizations/`
- `integrations/`
- `docker-compose.yml`

---

## ✅ PASSO 2: Configurar no EasyPanel - Criar Projeto

### 2.1 - Acessar EasyPanel

1. Abra o navegador
2. Acesse o EasyPanel (geralmente `http://seu-servidor:3000` ou domínio configurado)

### 2.2 - Criar Novo Projeto

1. Clique em **"+ Serviço"** (botão no canto superior direito)
2. Ou vá em **"Personalizado"** (aba no topo)
3. Escolha a opção **"Compose"** (com tag BETA)
4. Nome do projeto: `chatwoot`
5. Clique em **"Criar"** ou **"Next"**

---

## ✅ PASSO 3: Configurar Docker Compose no EasyPanel

### 3.1 - Abrir Editor de Compose

No projeto `chatwoot` que você criou, você verá um editor de texto para o `docker-compose.yml`.

### 3.2 - Copiar o Conteúdo

Abra o arquivo `chatwoot/docker-compose.yml` do seu projeto e copie TODO o conteúdo.

### 3.3 - Colar no EasyPanel

Cole o conteúdo no editor do EasyPanel.

### 3.4 - Ajustar Caminhos (IMPORTANTE)

No EasyPanel, você precisa ajustar o caminho do `build.context`. 

**Procure por esta linha:**
```yaml
build:
  context: ./source
```

**E altere para o caminho ABSOLUTO onde está o código-fonte:**
```yaml
build:
  context: /caminho/completo/para/seu/projeto/minha-pwa/chatwoot/source
```

**Exemplo:**
```yaml
build:
  context: /root/minha-pwa/chatwoot/source
```

**OU** se o EasyPanel monta volumes, você pode usar:
```yaml
build:
  context: ./chatwoot/source
```

---

## ✅ PASSO 4: Configurar Variáveis de Ambiente

### 4.1 - Gerar SECRET_KEY_BASE

No servidor, execute:

```bash
openssl rand -hex 64
```

**Copie o resultado** - você vai precisar!

### 4.2 - Adicionar Variáveis no EasyPanel

No projeto `chatwoot` no EasyPanel:

1. Procure por **"Environment Variables"** ou **"Variáveis de Ambiente"**
2. Clique em **"Add Variable"** ou **"+ Adicionar"**
3. Adicione uma por uma:

**Variáveis OBRIGATÓRIAS:**

```
POSTGRES_PASSWORD = a5895d0e44e68fc82c13e7d6a92313dd
POSTGRES_USER = postgres
POSTGRES_DB = chatwoot
REDIS_PASSWORD = a5895d0e44e68fc82c13e7d6a92313dd
SECRET_KEY_BASE = [cole o resultado do openssl rand -hex 64]
FRONTEND_URL = https://chat.oficialmed.com.br
RAILS_ENV = production
```

**Variáveis OPCIONAIS (mas recomendadas):**

```
SMTP_ADDRESS = smtp.gmail.com
SMTP_PORT = 587
SMTP_USERNAME = seu-email@gmail.com
SMTP_PASSWORD = sua-senha-app
MAILER_SENDER_EMAIL = noreply@oficialmed.com.br
TZ = America/Sao_Paulo
```

**Variáveis para INTEGRAÇÃO CRM (adicione depois):**

```
CRM_API_URL = https://api.oficialmed.com.br
CRM_API_KEY = sua-chave-api
CRM_WEBHOOK_SECRET = seu-secret
```

---

## ✅ PASSO 5: Configurar Domínio e Rede

### 5.1 - Configurar Domínio (se aplicável)

Se o EasyPanel gerencia domínios:

1. Vá em **"Domains"** ou **"Domínios"**
2. Adicione: `chat.oficialmed.com.br`
3. Configure SSL (Let's Encrypt geralmente é automático)

### 5.2 - Verificar Rede

O docker-compose já está configurado para usar a rede `OficialMed`. Se essa rede não existir, o EasyPanel pode criar automaticamente ou você precisa criar antes.

---

## ✅ PASSO 6: Fazer Deploy

### 6.1 - Revisar Configuração

Antes de fazer deploy, verifique:
- ✅ Docker Compose está correto
- ✅ Variáveis de ambiente estão todas preenchidas
- ✅ Caminho do build.context está correto
- ✅ Domínio está configurado (se necessário)

### 6.2 - Iniciar Deploy

1. Clique em **"Deploy"** ou **"Start"** ou **"Save & Deploy"**
2. Aguarde o build (pode demorar 10-20 minutos na primeira vez)
3. Acompanhe os logs

### 6.3 - Verificar Logs

No EasyPanel, procure por **"Logs"** ou **"Console"** e acompanhe:

- Build da imagem Docker
- Inicialização do PostgreSQL
- Inicialização do Redis
- Setup do Chatwoot

---

## ✅ PASSO 7: Inicializar Banco de Dados

### 7.1 - Aguardar Containers Subirem

Aguarde todos os containers estarem com status "Running" ou "Healthy".

### 7.2 - Executar Setup do Banco

No EasyPanel, encontre o container `chatwoot-web` e:

1. Clique em **"Terminal"** ou **"Console"**
2. Execute:

```bash
bundle exec rails db:chatwoot_prepare
```

**OU** se o EasyPanel não tiver terminal, via SSH no servidor:

```bash
docker exec -it chatwoot-web bundle exec rails db:chatwoot_prepare
```

Isso vai:
- Criar as tabelas
- Popular dados iniciais
- Configurar o banco

---

## ✅ PASSO 8: Acessar e Configurar

### 8.1 - Acessar o Chatwoot

1. Abra o navegador
2. Acesse: `https://chat.oficialmed.com.br` (ou o domínio que configurou)

### 8.2 - Criar Conta de Administrador

1. Na primeira tela, clique em **"Create Account"**
2. Preencha:
   - Nome
   - Email
   - Senha
3. Clique em **"Create"**

### 8.3 - Criar Workspace

1. Após criar a conta, você será solicitado a criar um **Workspace**
2. Dê um nome (ex: "OficialMed")
3. Clique em **"Create"**

### 8.4 - Configurar Primeira Conta

1. Dentro do workspace, você pode criar **"Accounts"** (contas de atendimento)
2. Cada account pode ter múltiplos canais (WhatsApp, Facebook, etc.)

---

## ✅ PASSO 9: Verificar se Está Funcionando

### 9.1 - Verificar Containers

No EasyPanel, verifique se todos os serviços estão rodando:
- ✅ `postgres-chatwoot` - Status: Running
- ✅ `redis-chatwoot` - Status: Running  
- ✅ `chatwoot-web` - Status: Running
- ✅ `chatwoot-worker` - Status: Running
- ✅ `chatwoot-cron` - Status: Running

### 9.2 - Testar Interface

1. Acesse o Chatwoot
2. Faça login
3. Navegue pela interface
4. Tudo deve estar funcionando!

---

## ✅ PASSO 10: Preparar para Integração com CRM

### 10.1 - Estrutura de Integração

Agora que está funcionando, você pode começar a integrar com seu CRM:

```bash
# No servidor
cd /caminho/do/projeto/minha-pwa/chatwoot/integrations
```

### 10.2 - Próximos Passos de Integração

1. Criar webhooks para sincronizar conversas
2. Criar endpoints de API para buscar dados do CRM
3. Sincronizar contatos entre sistemas

---

## 🆘 Troubleshooting

### Problema: Build falha

**Solução:**
- Verifique se o caminho do `build.context` está correto
- Verifique se o código-fonte foi clonado (`ls chatwoot/source/`)
- Veja os logs de build no EasyPanel

### Problema: Container não inicia

**Solução:**
- Verifique as variáveis de ambiente
- Verifique se PostgreSQL e Redis estão rodando
- Veja os logs do container

### Problema: Erro de conexão com banco

**Solução:**
- Verifique `POSTGRES_HOST` (deve ser `postgres-chatwoot`)
- Verifique `POSTGRES_PASSWORD`
- Verifique se o container do PostgreSQL está rodando

### Problema: Domínio não funciona

**Solução:**
- Verifique DNS apontando para o servidor
- Verifique configuração de SSL no EasyPanel
- Verifique firewall (portas 80 e 443)

---

## 📝 Checklist Final

Antes de considerar concluído, verifique:

- [ ] Código-fonte clonado em `chatwoot/source/`
- [ ] Projeto criado no EasyPanel
- [ ] Docker Compose configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Banco de dados inicializado
- [ ] Acesso ao Chatwoot funcionando
- [ ] Conta de administrador criada
- [ ] Workspace criado

---

## 🎯 Próximos Passos

Agora que o Chatwoot está instalado:

1. **Configurar canais** (WhatsApp, Facebook, etc.)
2. **Criar automações** e chatbots
3. **Integrar com seu CRM** (usando a pasta `integrations/`)
4. **Personalizar interface** (usando a pasta `customizations/`)

---

**Precisa de ajuda em algum passo específico?** Me avise qual passo você está e eu te ajudo detalhadamente! 🚀



