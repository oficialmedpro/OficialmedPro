# Sync Opportunities API

API para sincronização automática de oportunidades do SprintHub com Supabase.

## 🚀 Funcionalidades

- Sincronização automática de oportunidades do SprintHub
- Endpoint REST para execução manual
- Health check para monitoramento
- Autenticação via token
- Rate limiting automático
- Logs detalhados

## 📋 Endpoints

- `GET /health` - Health check
- `POST /sync` - Executar sincronização (requer autenticação)

## 🔧 Configuração

### Variáveis de Ambiente

- `SUPABASE_URL` - URL do Supabase
- `SUPABASE_KEY` - Service Role Key do Supabase
- `SPRINTHUB_BASE_URL` - URL base da API do SprintHub
- `SPRINTHUB_INSTANCE` - Instância do SprintHub
- `SPRINTHUB_TOKEN` - Token da API do SprintHub
- `API_TOKEN` - Token de autenticação da API
- `PORT` - Porta do servidor (padrão: 3002)

### Secrets (Docker)

- `SYNC_SUPABASE_URL` - URL do Supabase
- `SYNC_SUPABASE_KEY` - Service Role Key do Supabase
- `SYNC_SPRINTHUB_BASE_URL` - URL base da API do SprintHub
- `SYNC_SPRINTHUB_INSTANCE` - Instância do SprintHub
- `SYNC_SPRINTHUB_TOKEN` - Token da API do SprintHub

## 🐳 Docker

```bash
# Build
docker build -t oficialmedpro/sync-opportunities-api:latest .

# Run
docker run -p 3002:3002 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_KEY=your_key \
  -e SPRINTHUB_BASE_URL=your_base_url \
  -e SPRINTHUB_INSTANCE=your_instance \
  -e SPRINTHUB_TOKEN=your_token \
  -e API_TOKEN=your_api_token \
  oficialmedpro/sync-opportunities-api:latest
```

## 📊 Uso

### Health Check
```bash
curl http://localhost:3002/health
```

### Sincronização Manual
```bash
curl -X POST http://localhost:3002/sync \
  -H "Authorization: Bearer your_api_token" \
  -H "Content-Type: application/json"
```

## 🔄 Cronjob

Para execução automática a cada 30 minutos:

```bash
0,30 * * * * curl -X POST https://sincro.oficialmed.com.br/oportunidades/sync \
  -H "Authorization: Bearer sync-opportunities-2025-bC4dE8fG0hI3jL6nO9qR2sT5uV8wX1yZ"
```

