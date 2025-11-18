# 📚 Documentação Completa - Chatwoot no EasyPanel

## ✅ Status Atual

**Data da Instalação:** 17/11/2025  
**Status:** ✅ **FUNCIONANDO**  
**URL:** https://chat.oficialmed.com.br  
**Ambiente:** EasyPanel (Docker Compose)

---

## 🎯 O Que Foi Feito

### 1. Instalação Básica
- ✅ Chatwoot instalado no EasyPanel usando Docker Compose
- ✅ Domínio `chat.oficialmed.com.br` configurado e funcionando
- ✅ SSL/HTTPS configurado automaticamente pelo EasyPanel
- ✅ Todos os serviços rodando (Web, Worker, Cron, PostgreSQL, Redis)

### 2. Configuração de Rede
- ✅ Serviço `chatwoot-web` conectado à rede `easypanel` (para Traefik acessar)
- ✅ Serviço `chatwoot-web` também na rede `default` (para comunicação interna)

### 3. Banco de Dados
- ✅ PostgreSQL 14 com extensão `pgvector` (necessária para funcionalidades de IA)
- ✅ Redis para cache e filas
- ✅ Banco inicializado e pronto para uso

---

## 📁 Arquivos Importantes

### Arquivo Principal do Docker Compose
**Localização:** `chatwoot/docker-compose-easypanel-funcionando.yml`

Este é o arquivo que está sendo usado no EasyPanel. Contém:
- PostgreSQL com pgvector
- Redis
- Chatwoot Web (imagem oficial)
- Chatwoot Worker
- Chatwoot Cron
- Configuração de rede `easypanel`

### Variáveis de Ambiente
**Localização:** `chatwoot/VARIAVEIS_AMBIENTE_EASYPANEL.txt`

Variáveis que devem estar configuradas no EasyPanel:
- `POSTGRES_PASSWORD`
- `POSTGRES_USER`
- `POSTGRES_DB`
- `REDIS_PASSWORD`
- `SECRET_KEY_BASE` (já gerado)
- `FRONTEND_URL`
- `INSTALLATION_NAME`
- E outras configurações opcionais

---

## 🔧 Configuração Atual

### Imagem Docker
Atualmente usando: `chatwoot/chatwoot:latest` (imagem oficial)

### Serviços em Execução
1. **chatwoot-web**: Servidor web (porta 3000)
2. **chatwoot-worker**: Processamento de jobs em background
3. **chatwoot-cron**: Jobs agendados
4. **postgres-chatwoot**: Banco de dados PostgreSQL
5. **redis-chatwoot**: Cache e filas

### Rede Docker
- **Rede `easypanel`**: Externa, compartilhada com Traefik
- **Rede `default`**: Interna do projeto, para comunicação entre serviços

---

## 📋 Próximos Passos

### 1. Instalar Código-Fonte do Chatwoot

#### Objetivo
Ter o código-fonte local para fazer modificações (logo, personalizações, integrações com CRM).

#### Passo a Passo

**1.1. Clonar o Repositório do Chatwoot**

No servidor (via SSH), execute:

```bash
# Navegar para a pasta do projeto no servidor
cd /etc/easypanel/projects/chatwoot

# Clonar o repositório do Chatwoot
git clone https://github.com/chatwoot/chatwoot.git source

# Ou se preferir uma versão específica:
cd source
git checkout v2.0.0  # Substitua pela versão desejada
```

**1.2. Modificar o Docker Compose para Usar Build**

Editar o arquivo `chatwoot/docker-compose-easypanel-funcionando.yml`:

```yaml
chatwoot-web:
  # Comentar a linha da imagem:
  # image: chatwoot/chatwoot:latest
  
  # Descomentar e ajustar o build:
  build:
    context: ./source
    dockerfile: Dockerfile
  # ... resto da configuração ...
```

**1.3. Ajustar o Caminho do Build Context**

O EasyPanel pode ter um caminho diferente. Verificar o caminho correto:
- No EasyPanel, o código geralmente fica em: `/etc/easypanel/projects/{nome-projeto}/code/`
- Ajustar o `context` no docker-compose conforme necessário

**1.4. Fazer Deploy**

1. Atualizar o docker-compose no EasyPanel
2. Fazer deploy
3. Aguardar o build da imagem (pode demorar alguns minutos)

---

### 2. Personalizar Logo e Branding

#### 2.1. Localizar Arquivos de Logo

No código-fonte do Chatwoot, os logos geralmente ficam em:
- `app/javascript/dashboard/assets/images/logo/`
- `app/javascript/widget/assets/images/logo/`
- `public/brand-assets/`

#### 2.2. Substituir Logos

1. **Logo do Dashboard (painel admin):**
   - Localizar: `app/javascript/dashboard/assets/images/logo/chatwoot-logo.svg`
   - Substituir pelo logo da OficialMed

2. **Logo do Widget (chat para clientes):**
   - Localizar: `app/javascript/widget/assets/images/logo/chatwoot-logo.svg`
   - Substituir pelo logo da OficialMed

3. **Favicon:**
   - Localizar: `public/favicon.ico`
   - Substituir pelo favicon da OficialMed

#### 2.3. Ajustar Cores e Estilos

1. **Cores principais:**
   - Localizar arquivos de tema: `app/javascript/dashboard/theme/`
   - Ajustar cores para as cores da OficialMed

2. **CSS customizado:**
   - Criar arquivo: `app/javascript/dashboard/assets/styles/custom.css`
   - Adicionar estilos personalizados

#### 2.4. Rebuild e Deploy

Após fazer as alterações:
1. Fazer commit das alterações (se usar Git)
2. Fazer deploy no EasyPanel
3. O Docker vai fazer rebuild da imagem com as alterações

---

### 3. Integração com CRM

#### 3.1. Criar API de Integração

1. **Criar webhook no Chatwoot:**
   - Configurar webhooks para eventos (novas conversas, mensagens, etc.)
   - URL do webhook: `https://api.oficialmed.com.br/webhooks/chatwoot`

2. **Criar endpoint no CRM:**
   - Receber dados do Chatwoot
   - Sincronizar com o banco do CRM

#### 3.2. Usar API do Chatwoot

O Chatwoot tem uma API REST completa:
- Documentação: https://www.chatwoot.com/developers/api/
- Endpoint base: `https://chat.oficialmed.com.br/api/v1/`

**Exemplo de integração:**
```javascript
// Buscar conversas
fetch('https://chat.oficialmed.com.br/api/v1/accounts/1/conversations', {
  headers: {
    'api_access_token': 'SEU_TOKEN_AQUI'
  }
})
```

#### 3.3. Variáveis de Ambiente para Integração

Adicionar no EasyPanel:
```
CRM_API_URL=https://api.oficialmed.com.br
CRM_API_KEY=sua-chave-api
CRM_WEBHOOK_SECRET=seu-secret
```

---

## 🛠️ Comandos Úteis

### Acessar Container do Chatwoot

```bash
# Acessar o container web
docker exec -it chatwoot_chatwoot-chatwoot-web-1 bash

# Acessar o container worker
docker exec -it chatwoot_chatwoot-chatwoot-worker-1 bash
```

### Ver Logs

```bash
# Logs do web
docker logs chatwoot_chatwoot-chatwoot-web-1 --tail 100 -f

# Logs do worker
docker logs chatwoot_chatwoot-chatwoot-worker-1 --tail 100 -f

# Logs de todos os serviços
docker-compose -f /etc/easypanel/projects/chatwoot/code/docker-compose.yml logs -f
```

### Comandos Rails (dentro do container)

```bash
# Acessar console Rails
docker exec -it chatwoot_chatwoot-chatwoot-web-1 bundle exec rails console

# Executar migrações
docker exec -it chatwoot_chatwoot-chatwoot-web-1 bundle exec rails db:migrate

# Verificar status
docker exec -it chatwoot_chatwoot-chatwoot-web-1 bundle exec rails db:chatwoot_prepare
```

### Backup do Banco de Dados

```bash
# Backup
docker exec chatwoot_chatwoot-postgres-chatwoot-1 pg_dump -U postgres chatwoot > backup_chatwoot_$(date +%Y%m%d).sql

# Restore
docker exec -i chatwoot_chatwoot-postgres-chatwoot-1 psql -U postgres chatwoot < backup_chatwoot_20251117.sql
```

---

## 🔐 Segurança

### Tokens e Chaves Importantes

1. **SECRET_KEY_BASE**: Já gerado e configurado
2. **API Access Token**: Gerar no painel do Chatwoot (Settings > API)
3. **Webhook Secret**: Configurar para validar webhooks

### Boas Práticas

- ✅ Nunca commitar tokens no Git
- ✅ Usar variáveis de ambiente para todas as configurações sensíveis
- ✅ Fazer backups regulares do banco de dados
- ✅ Manter o Chatwoot atualizado

---

## 📝 Estrutura de Arquivos do Projeto

```
chatwoot/
├── docker-compose-easypanel-funcionando.yml  # Arquivo principal (usado no EasyPanel)
├── docker-compose-final.yml                  # Versão alternativa
├── docker-compose-easypanel-simples.yml      # Versão simplificada
├── VARIAVEIS_AMBIENTE_EASYPANEL.txt          # Variáveis de ambiente
├── CONFIGURAR_DOMINIO_EASYPANEL.md           # Guia de configuração de domínio
├── TROUBLESHOOTING_EASYPANEL.md              # Guia de troubleshooting
├── DIAGNOSTICO_SSH.md                        # Comandos de diagnóstico
├── COMANDOS_DIAGNOSTICO.txt                   # Comandos úteis
└── DOCUMENTACAO_COMPLETA.md                  # Este arquivo
```

---

## 🐛 Troubleshooting

### Problema: Erro 502 Bad Gateway

**Solução:**
1. Verificar se o container está na rede `easypanel`:
   ```bash
   docker inspect chatwoot_chatwoot-chatwoot-web-1 | grep -A 20 '"Networks"'
   ```
2. Verificar se o serviço está rodando:
   ```bash
   docker ps | grep chatwoot-web
   ```
3. Verificar logs:
   ```bash
   docker logs chatwoot_chatwoot-chatwoot-web-1 --tail 50
   ```

### Problema: Build do Código-Fonte Falha

**Solução:**
1. Verificar se o caminho do `context` está correto
2. Verificar se o repositório foi clonado corretamente
3. Verificar permissões dos arquivos
4. Ver logs do build no EasyPanel

### Problema: Extensão Vector não Encontrada

**Solução:**
- Já resolvido usando `pgvector/pgvector:pg14` ao invés de `postgres:14`

---

## 🔄 Atualizações Futuras

### Como Atualizar o Chatwoot

1. **Se usando imagem oficial:**
   - Atualizar tag da imagem no docker-compose
   - Fazer deploy

2. **Se usando código-fonte:**
   - Fazer pull do repositório: `git pull`
   - Fazer deploy (vai rebuildar)

### Backup Antes de Atualizar

Sempre fazer backup do banco de dados antes de atualizar!

---

## 📞 Suporte e Recursos

- **Documentação Oficial:** https://www.chatwoot.com/docs/
- **API Documentation:** https://www.chatwoot.com/developers/api/
- **GitHub:** https://github.com/chatwoot/chatwoot
- **Community:** https://www.chatwoot.com/community

---

## ✅ Checklist de Próximos Passos

- [ ] Clonar código-fonte do Chatwoot
- [ ] Modificar docker-compose para usar build local
- [ ] Fazer deploy com código-fonte
- [ ] Substituir logos (dashboard e widget)
- [ ] Ajustar cores e branding
- [ ] Configurar integração com CRM
- [ ] Criar webhooks para sincronização
- [ ] Testar todas as funcionalidades
- [ ] Documentar integrações específicas

---

**Última Atualização:** 17/11/2025  
**Versão do Chatwoot:** 2.0.0 (imagem oficial)  
**Status:** ✅ Funcionando e pronto para personalização


