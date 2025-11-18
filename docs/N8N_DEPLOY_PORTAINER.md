# Deploy N8N via Portainer - Passo a Passo 🚀

## Guia Completo para Deploy do N8N usando Interface do Portainer

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de que você tem:
- ✅ Portainer instalado e acessível
- ✅ Docker Swarm ativo
- ✅ PostgreSQL rodando (mesma stack do Typebot)
- ✅ Traefik configurado
- ✅ Rede `OficialMed` criada
- ✅ DNS configurado para:
  - `workflows.oficialmed.com.br`
  - `webhook.oficialmed.com.br`

---

## 🗄️ PASSO 1: Criar o Banco de Dados N8N

### 1.1 - Acessar o Container do PostgreSQL

1. Acesse o **Portainer**
2. No menu lateral, clique em **"Containers"**
3. Localize o container do **PostgreSQL** (geralmente `postgres` ou similar)
4. Clique no nome do container

### 1.2 - Abrir Console do PostgreSQL

1. Na página do container, clique em **"Console"** (ícone de terminal >_)
2. Selecione **"/bin/bash"** ou **"/bin/sh"** no dropdown
3. Clique em **"Connect"**

### 1.3 - Criar o Banco de Dados

No terminal que abriu, digite os seguintes comandos:

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar o banco de dados n8n
CREATE DATABASE n8n WITH ENCODING = 'UTF8';

# Verificar se foi criado
\l

# Sair do psql
\q

# Sair do bash
exit
```

**✅ Pronto!** O banco de dados `n8n` foi criado.

---

## 🐳 PASSO 2: Adicionar a Stack do N8N no Portainer

### 2.1 - Acessar Stacks

1. No menu lateral do Portainer, clique em **"Stacks"**
2. Clique no botão **"+ Add stack"**

### 2.2 - Configurar a Stack

1. **Name**: Digite `n8n` (ou `n8n-oficialmed`)

2. **Build method**: Selecione **"Web editor"**

3. **Web editor**: Cole o conteúdo abaixo:

```yaml
version: "3.7"
services:

## --------------------------- N8N --------------------------- ##

  n8n:
    image: n8nio/n8n:latest
    
    networks:
      - OficialMed
    
    environment:
    ## 🗄️ Dados do Postgres
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=postgres
      - DB_POSTGRESDB_PASSWORD=a5895d0e44e68fc82c13e7d6a92313dd
    
    ## 🔐 Encryption key (NUNCA altere após primeiro deploy!)
      - N8N_ENCRYPTION_KEY=83d8442f4011a5908b9bc882520d3352a1b2c3d4e5f6g7h8
    
    ## 🌐 URLs do n8n
      - N8N_HOST=workflows.oficialmed.com.br
      - N8N_PROTOCOL=https
      - N8N_PORT=5678
      - WEBHOOK_URL=https://webhook.oficialmed.com.br/
    
    ## 👤 Credenciais do Admin (ALTERE a senha!)
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=OfiCialMed2025!
    
    ## 📧 Dados do SMTP
      - N8N_EMAIL_MODE=smtp
      - N8N_SMTP_HOST=smtp.gmail.com
      - N8N_SMTP_PORT=465
      - N8N_SMTP_USER=mkt.oficialmed@gmail.com
      - N8N_SMTP_PASS=Joao1633@@
      - N8N_SMTP_SENDER=mkt.oficialmed@gmail.com
      - N8N_SMTP_SSL=true
    
    ## 🗃️ Configurações gerais
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_PERSONALIZATION_ENABLED=true
      - N8N_VERSION_NOTIFICATIONS_ENABLED=true
      - N8N_TEMPLATES_ENABLED=true
      - N8N_LOG_LEVEL=info
      - N8N_LOG_OUTPUT=console
    
    ## 📂 Configurações de execução
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
      - EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS=true
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=336
    
    ## ⏱️ Timezone
      - GENERIC_TIMEZONE=America/Sao_Paulo
      - TZ=America/Sao_Paulo
    
    volumes:
      - n8n_data:/home/node/.n8n
    
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          cpus: "2"
          memory: 2048M
      labels:
        - io.portainer.accesscontrol.users=admin
        
        ## workflows.oficialmed.com.br (interface principal)
        - traefik.enable=true
        - traefik.http.routers.n8n_editor.rule=Host(`workflows.oficialmed.com.br`)
        - traefik.http.routers.n8n_editor.entrypoints=websecure
        - traefik.http.routers.n8n_editor.tls.certresolver=letsencryptresolver
        - traefik.http.services.n8n_editor.loadbalancer.server.port=5678
        - traefik.http.services.n8n_editor.loadbalancer.passHostHeader=true
        - traefik.http.routers.n8n_editor.service=n8n_editor
        
        ## webhook.oficialmed.com.br (webhooks)
        - traefik.http.routers.n8n_webhook.rule=Host(`webhook.oficialmed.com.br`)
        - traefik.http.routers.n8n_webhook.entrypoints=websecure
        - traefik.http.routers.n8n_webhook.tls.certresolver=letsencryptresolver
        - traefik.http.routers.n8n_webhook.service=n8n_webhook
        - traefik.http.services.n8n_webhook.loadbalancer.server.port=5678

## --------------------------- VOLUMES --------------------------- ##

volumes:
  n8n_data:
    driver: local

## --------------------------- NETWORKS --------------------------- ##

networks:
  OficialMed:
    external: true
    name: OficialMed
```

### 2.3 - Deploy da Stack

1. **Não marque** nenhuma opção adicional (a menos que você saiba o que está fazendo)
2. Role até o final da página
3. Clique no botão **"Deploy the stack"**

### 2.4 - Aguardar Deploy

- O Portainer vai mostrar uma mensagem de sucesso
- Você será redirecionado para a lista de stacks
- Aguarde **2-3 minutos** para o N8N inicializar completamente

---

## 🔍 PASSO 3: Verificar se está Funcionando

### 3.1 - Verificar a Stack

1. Em **"Stacks"**, você deve ver a stack **"n8n"** com status **"active"**
2. Clique no nome da stack **"n8n"**
3. Você verá o serviço **"n8n_n8n"** listado

### 3.2 - Verificar o Serviço

1. Clique em **"Services"** no menu lateral
2. Localize **"n8n_n8n"**
3. Verifique se está **"1/1"** (significa que 1 réplica de 1 está rodando)
4. Clique no serviço para ver mais detalhes

### 3.3 - Ver os Logs

1. Na página do serviço, clique em **"Service logs"**
2. Você deve ver logs como:
   ```
   n8n ready on 0.0.0.0, port 5678
   Version: X.XX.X
   Editor is now accessible via:
   http://localhost:5678/
   ```

3. Se houver erros, leia os logs para identificar o problema

---

## 🌐 PASSO 4: Acessar o N8N

### 4.1 - Primeiro Acesso

1. Abra o navegador
2. Acesse: **https://workflows.oficialmed.com.br**
3. Você verá uma tela de login (autenticação básica)

### 4.2 - Fazer Login

```
Usuário: admin
Senha: OfiCialMed2025!
```

### 4.3 - ⚠️ IMPORTANTE: Alterar a Senha

1. Após fazer login, vá em **Settings** (ícone de engrenagem)
2. Clique em **"Users"**
3. Clique no seu usuário
4. Altere a senha padrão para uma senha forte

---

## ✅ PASSO 5: Testar Funcionalidades

### 5.1 - Criar Workflow de Teste

1. Na interface do N8N, clique em **"+ New"** ou **"Create Workflow"**
2. Adicione um nó **"Schedule Trigger"** (arrastar da barra lateral)
3. Adicione um nó **"Set"** ou **"Code"**
4. Conecte os nós
5. Clique em **"Execute Workflow"**
6. Verifique se funcionou ✅

### 5.2 - Testar Webhook

1. Crie um novo workflow
2. Adicione um nó **"Webhook"**
3. Configure:
   - HTTP Method: **POST**
   - Path: **test**
4. Clique em **"Listen for Test Event"**
5. A URL do webhook será algo como:
   ```
   https://webhook.oficialmed.com.br/webhook-test/test
   ```
6. Teste com curl (em outro terminal):
   ```bash
   curl -X POST https://webhook.oficialmed.com.br/webhook-test/test \
     -H "Content-Type: application/json" \
     -d '{"teste": "funcionou"}'
   ```

---

## 🔧 PASSO 6: Configurações Adicionais (Opcional)

### 6.1 - Ajustar Recursos

Se precisar de mais recursos:

1. Vá em **"Stacks"** → **"n8n"**
2. Clique em **"Editor"**
3. Modifique as linhas:
   ```yaml
   resources:
     limits:
       cpus: "4"        # Aumentar CPUs
       memory: 4096M    # Aumentar memória
   ```
4. Clique em **"Update the stack"**

### 6.2 - Desabilitar Autenticação Básica (após configurar OAuth)

1. Edite a stack
2. Comente ou remova estas linhas:
   ```yaml
   # - N8N_BASIC_AUTH_ACTIVE=true
   # - N8N_BASIC_AUTH_USER=admin
   # - N8N_BASIC_AUTH_PASSWORD=OfiCialMed2025!
   ```
3. Atualize a stack

---

## 🛠️ Troubleshooting pelo Portainer

### Problema: Stack não inicia

1. **Verificar logs**:
   - Stacks → n8n → Service logs
   - Procure por mensagens de erro em vermelho

2. **Verificar o banco de dados**:
   - Containers → postgres → Console
   - Execute: `psql -U postgres -l | grep n8n`
   - Deve mostrar o banco `n8n`

3. **Verificar a rede**:
   - Networks → Procure `OficialMed`
   - Deve estar listada e ativa

### Problema: Não consigo acessar a URL

1. **Verificar DNS**:
   - Abra o terminal do seu computador
   - Execute: `nslookup workflows.oficialmed.com.br`
   - Deve retornar o IP do seu servidor

2. **Verificar Traefik**:
   - Services → traefik → Service logs
   - Procure por menções ao domínio

3. **Verificar certificado SSL**:
   - Aguarde 2-3 minutos para o Let's Encrypt emitir
   - Acesse: `http://workflows.oficialmed.com.br` (sem HTTPS)
   - Deve redirecionar para HTTPS

### Problema: Erro de conexão com banco

1. **Verificar senha**:
   - A senha no YAML deve ser exatamente a mesma do PostgreSQL
   - Verifique em: Stacks → (stack do Typebot) → Editor
   - Compare a senha do PostgreSQL

2. **Testar conexão**:
   - Containers → n8n → Console → Connect
   - Execute: `ping postgres`
   - Deve responder (Ctrl+C para parar)

---

## 📊 Monitoramento pelo Portainer

### Verificar Status em Tempo Real

1. **Dashboard**:
   - Home → Mostra visão geral do cluster

2. **Service Details**:
   - Services → n8n_n8n → Mostra réplicas, tarefas, logs

3. **Resources**:
   - Services → n8n_n8n → Aba "Stats"
   - Mostra uso de CPU e memória em tempo real

### Logs

1. **Service Logs**:
   - Services → n8n_n8n → Service logs
   - Marque **"Auto-refresh logs"** para atualização automática

2. **Filtrar Logs**:
   - Use a busca (Ctrl+F) para procurar erros
   - Procure por: `ERROR`, `WARN`, `Failed`

---

## 💾 Backup pelo Portainer

### Backup do Volume

1. **Via Console**:
   - Containers → postgres → Console → Connect
   - Execute:
     ```bash
     pg_dump -U postgres n8n > /tmp/n8n-backup.sql
     ```

2. **Baixar o arquivo**:
   - Você pode usar SCP ou SFTP para baixar de `/tmp/n8n-backup.sql`

### Backup da Stack (configuração)

1. Stacks → n8n → **"Editor"**
2. Copie **TODO o conteúdo** do YAML
3. Cole em um arquivo de texto no seu computador
4. Salve como: `n8n-stack-backup-YYYYMMDD.yml`

---

## 📝 Checklist Final

Após completar todos os passos, verifique:

- [ ] Stack "n8n" está com status "active" no Portainer
- [ ] Serviço "n8n_n8n" está com réplicas "1/1"
- [ ] Logs não mostram erros críticos
- [ ] Acesso a https://workflows.oficialmed.com.br funciona
- [ ] Login com credenciais padrão funciona
- [ ] Senha foi alterada
- [ ] Workflow de teste foi criado e executado com sucesso
- [ ] Webhook foi testado e funciona
- [ ] Backup da configuração foi salvo

---

## 🎯 Próximos Passos

1. **Criar seus workflows**:
   - Explore os templates do N8N
   - Crie workflows personalizados

2. **Integrar com Typebot**:
   - Use webhooks do N8N no Typebot
   - Automatize processos

3. **Configurar backup automático**:
   - Agende backups regulares
   - Teste o restore

4. **Documentar workflows**:
   - Adicione descrições nos workflows
   - Documente integrações

---

## 📚 Links Úteis

- 📖 [Documentação N8N](https://docs.n8n.io/)
- 💬 [Comunidade N8N](https://community.n8n.io/)
- 🎨 [Templates](https://n8n.io/workflows/)
- 📖 [Documentação Portainer](https://docs.portainer.io/)

---

## 🆘 Suporte

Se tiver problemas:

1. **Verifique os logs** no Portainer
2. **Consulte** este guia e os outros arquivos de documentação
3. **Procure** na comunidade N8N
4. **Revise** as configurações passo a passo

---

**Guia criado para Oficial Med** | Outubro 2025  
**Versão**: 1.0  

✅ **Deploy via Portainer - 100% Interface Gráfica**

