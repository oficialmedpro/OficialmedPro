# 🚀 Configurar Serviço Chatwoot no EasyPanel

## ✅ Passo 1: Verificar se o código-fonte está no servidor

Execute no servidor:

```bash
cd /etc/easypanel/projects/chatwoot
ls -la chatwoot/source/
```

Se não estiver, clone:

```bash
cd /etc/easypanel/projects/chatwoot
mkdir -p chatwoot/source
cd chatwoot
git clone https://github.com/chatwoot/chatwoot.git source
cd source
git checkout main  # ou a versão mais recente
```

---

## ✅ Passo 2: Criar o arquivo docker-compose.yml no servidor

Crie o arquivo no servidor:

```bash
cd /etc/easypanel/projects/chatwoot
nano docker-compose.yml
```

Cole o conteúdo abaixo (já ajustado para o caminho do EasyPanel):

```yaml
version: "3.8"

services:
  postgres-chatwoot:
    image: postgres:14
    container_name: chatwoot-postgres
    restart: unless-stopped
    command: >
      postgres
      -c max_connections=200
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
    volumes:
      - postgres_chatwoot_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-a5895d0e44e68fc82c13e7d6a92313dd}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-chatwoot}
      TZ: ${TZ:-America/Sao_Paulo}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis-chatwoot:
    image: redis:7-alpine
    container_name: chatwoot-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-a5895d0e44e68fc82c13e7d6a92313dd}
    volumes:
      - redis_chatwoot_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  chatwoot-web:
    build:
      context: ./chatwoot/source
      dockerfile: Dockerfile
    container_name: chatwoot-web
    restart: unless-stopped
    volumes:
      - chatwoot_data:/app/storage
      - chatwoot_logs:/app/log
    environment:
      - POSTGRES_HOST=postgres-chatwoot
      - POSTGRES_PORT=5432
      - POSTGRES_DATABASE=${POSTGRES_DB:-chatwoot}
      - POSTGRES_USERNAME=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-a5895d0e44e68fc82c13e7d6a92313dd}
      - REDIS_URL=redis://:${REDIS_PASSWORD:-a5895d0e44e68fc82c13e7d6a92313dd}@redis-chatwoot:6379
      - RAILS_ENV=${RAILS_ENV:-production}
      - SECRET_KEY_BASE=${SECRET_KEY_BASE}
      - FRONTEND_URL=${FRONTEND_URL:-https://chat.oficialmed.com.br}
      - INSTALLATION_NAME=${INSTALLATION_NAME:-OficialMed Chat}
      - INSTALLATION_VERSION=${INSTALLATION_VERSION:-2.0.0}
      - MAILER_SENDER_EMAIL=${MAILER_SENDER_EMAIL:-}
      - SMTP_ADDRESS=${SMTP_ADDRESS:-smtp.gmail.com}
      - SMTP_PORT=${SMTP_PORT:-587}
      - SMTP_USERNAME=${SMTP_USERNAME:-}
      - SMTP_PASSWORD=${SMTP_PASSWORD:-}
      - SMTP_AUTHENTICATION=${SMTP_AUTHENTICATION:-login}
      - SMTP_ENABLE_STARTTLS_AUTO=${SMTP_ENABLE_STARTTLS_AUTO:-true}
      - ENABLE_ACCOUNT_SIGNUP=${ENABLE_ACCOUNT_SIGNUP:-true}
      - ENABLE_GOOGLE_OAUTH=${ENABLE_GOOGLE_OAUTH:-false}
      - ENABLE_FACEBOOK_OAUTH=${ENABLE_FACEBOOK_OAUTH:-false}
      - ENABLE_TWITTER_OAUTH=${ENABLE_TWITTER_OAUTH:-false}
      - TZ=${TZ:-America/Sao_Paulo}
    depends_on:
      postgres-chatwoot:
        condition: service_healthy
      redis-chatwoot:
        condition: service_healthy
    ports:
      - "3000:3000"
    command: >
      bash -c "
      bundle exec rails db:chatwoot_prepare &&
      bundle exec rails s -p 3000 -b 0.0.0.0
      "

  chatwoot-worker:
    build:
      context: ./chatwoot/source
      dockerfile: Dockerfile
    container_name: chatwoot-worker
    restart: unless-stopped
    volumes:
      - chatwoot_data:/app/storage
      - chatwoot_logs:/app/log
    environment:
      - POSTGRES_HOST=postgres-chatwoot
      - POSTGRES_PORT=5432
      - POSTGRES_DATABASE=${POSTGRES_DB:-chatwoot}
      - POSTGRES_USERNAME=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-a5895d0e44e68fc82c13e7d6a92313dd}
      - REDIS_URL=redis://:${REDIS_PASSWORD:-a5895d0e44e68fc82c13e7d6a92313dd}@redis-chatwoot:6379
      - RAILS_ENV=${RAILS_ENV:-production}
      - SECRET_KEY_BASE=${SECRET_KEY_BASE}
      - FRONTEND_URL=${FRONTEND_URL:-https://chat.oficialmed.com.br}
      - TZ=${TZ:-America/Sao_Paulo}
    depends_on:
      postgres-chatwoot:
        condition: service_healthy
      redis-chatwoot:
        condition: service_healthy
    command: bundle exec sidekiq -C config/sidekiq.yml

  chatwoot-cron:
    build:
      context: ./chatwoot/source
      dockerfile: Dockerfile
    container_name: chatwoot-cron
    restart: unless-stopped
    volumes:
      - chatwoot_data:/app/storage
      - chatwoot_logs:/app/log
    environment:
      - POSTGRES_HOST=postgres-chatwoot
      - POSTGRES_PORT=5432
      - POSTGRES_DATABASE=${POSTGRES_DB:-chatwoot}
      - POSTGRES_USERNAME=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-a5895d0e44e68fc82c13e7d6a92313dd}
      - REDIS_URL=redis://:${REDIS_PASSWORD:-a5895d0e44e68fc82c13e7d6a92313dd}@redis-chatwoot:6379
      - RAILS_ENV=${RAILS_ENV:-production}
      - SECRET_KEY_BASE=${SECRET_KEY_BASE}
      - FRONTEND_URL=${FRONTEND_URL:-https://chat.oficialmed.com.br}
      - TZ=${TZ:-America/Sao_Paulo}
    depends_on:
      postgres-chatwoot:
        condition: service_healthy
      redis-chatwoot:
        condition: service_healthy
    command: bundle exec sidekiq -C config/sidekiq.yml -q default -q mailers -q cron_job

volumes:
  postgres_chatwoot_data:
    driver: local
  redis_chatwoot_data:
    driver: local
  chatwoot_data:
    driver: local
  chatwoot_logs:
    driver: local
```

Salve com `Ctrl+O`, Enter, `Ctrl+X`

---

## ✅ Passo 3: No EasyPanel - Criar Serviço Compose

1. No projeto `chatwoot` no EasyPanel
2. Clique no **"+"** ao lado de "SERVIÇOS"
3. Escolha **"Compose"** (BETA)
4. Dê um nome: `chatwoot-app`
5. O EasyPanel deve detectar automaticamente o `docker-compose.yml` do diretório
6. Se não detectar, cole o conteúdo manualmente

---

## ✅ Passo 4: Configurar Variáveis de Ambiente

No EasyPanel, vá em **"Environment Variables"** do projeto e adicione:

**OBRIGATÓRIAS:**
```
POSTGRES_PASSWORD=a5895d0e44e68fc82c13e7d6a92313dd
POSTGRES_USER=postgres
POSTGRES_DB=chatwoot
REDIS_PASSWORD=a5895d0e44e68fc82c13e7d6a92313dd
SECRET_KEY_BASE=[gere com: openssl rand -hex 64]
FRONTEND_URL=https://chat.oficialmed.com.br
RAILS_ENV=production
```

**OPCIONAIS:**
```
TZ=America/Sao_Paulo
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu-email@gmail.com
SMTP_PASSWORD=sua-senha
MAILER_SENDER_EMAIL=noreply@oficialmed.com.br
```

---

## ✅ Passo 5: Deploy

1. Clique em **"Deploy"** ou **"Start"**
2. Aguarde o build (10-20 minutos na primeira vez)
3. Acompanhe os logs

---

## 🆘 Se der erro no build.context

Se o EasyPanel não encontrar o código-fonte, ajuste o caminho:

No `docker-compose.yml`, mude:
```yaml
build:
  context: ./chatwoot/source
```

Para o caminho absoluto:
```yaml
build:
  context: /etc/easypanel/projects/chatwoot/chatwoot/source
```


