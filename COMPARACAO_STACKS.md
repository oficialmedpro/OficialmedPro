# 🔄 COMPARAÇÃO: prime-sync-api vs oportunidades-sync-api

## 📊 Visão Geral

| Aspecto | prime-sync-api | oportunidades-sync-api |
|---------|----------------|------------------------|
| **Origem** | Firebird (banco local) | SprintHub API |
| **Destino** | Supabase | Supabase |
| **Tabela** | (não especificada) | `api.oportunidade_sprint` |
| **Porta** | 5000 | 5001 |
| **Endpoint** | `sincro.oficialmed.com.br` | `sincro.oficialmed.com.br/oportunidades` |
| **Imagem Docker** | `oficialmedpro/prime-sync-api` | `oficialmedpro/oportunidades-sync-api` |

---

## 🔐 Secrets Lado a Lado

### prime-sync-api
```yaml
secrets:
  - PRIME_FIREBIRD_HOST
  - PRIME_FIREBIRD_DB
  - PRIME_FIREBIRD_USER
  - PRIME_FIREBIRD_PASS
  - PRIME_SUPABASE_URL
  - PRIME_SUPABASE_KEY
```

### oportunidades-sync-api
```yaml
secrets:
  - OPP_SUPABASE_URL
  - OPP_SUPABASE_KEY
  - OPP_SPRINTHUB_BASE_URL
  - OPP_SPRINTHUB_INSTANCE
  - OPP_SPRINTHUB_TOKEN
```

---

## 🐳 Docker Stack Comparação

### Service Name
```yaml
# prime-sync-api
services:
  prime-sync-api:

# oportunidades-sync-api
services:
  oportunidades-sync-api:
```

### Environment Variables
```yaml
# prime-sync-api
environment:
  - NODE_ENV=production
  - PORT=5000
  - FIREBIRD_HOST_FILE=/run/secrets/PRIME_FIREBIRD_HOST
  - FIREBIRD_DB_FILE=/run/secrets/PRIME_FIREBIRD_DB
  - FIREBIRD_USER_FILE=/run/secrets/PRIME_FIREBIRD_USER
  - FIREBIRD_PASS_FILE=/run/secrets/PRIME_FIREBIRD_PASS
  - SUPABASE_URL_FILE=/run/secrets/PRIME_SUPABASE_URL
  - SUPABASE_KEY_FILE=/run/secrets/PRIME_SUPABASE_KEY
  - API_TOKEN=prime-sync-2025-xY9kL2mP4nQ8wR5t

# oportunidades-sync-api
environment:
  - NODE_ENV=production
  - PORT=5001
  - SUPABASE_URL_FILE=/run/secrets/OPP_SUPABASE_URL
  - SUPABASE_KEY_FILE=/run/secrets/OPP_SUPABASE_KEY
  - SPRINTHUB_BASE_URL_FILE=/run/secrets/OPP_SPRINTHUB_BASE_URL
  - SPRINTHUB_INSTANCE_FILE=/run/secrets/OPP_SPRINTHUB_INSTANCE
  - SPRINTHUB_TOKEN_FILE=/run/secrets/OPP_SPRINTHUB_TOKEN
  - API_TOKEN=oportunidades-sync-2025-mN7pQ2rS5tU9wV3xY6zA0bC4dE8fG1hI
```

### Traefik Labels (Rotas)
```yaml
# prime-sync-api
- traefik.http.routers.prime-sync.rule=Host(`sincro.oficialmed.com.br`)
- traefik.http.services.prime-sync.loadbalancer.server.port=5000

# oportunidades-sync-api
- traefik.http.routers.oportunidades-sync.rule=Host(`sincro.oficialmed.com.br`) && PathPrefix(`/oportunidades`)
- traefik.http.services.oportunidades-sync.loadbalancer.server.port=5001
- traefik.http.middlewares.opp-stripprefix.stripprefix.prefixes=/oportunidades
```

### Resources (Idênticas)
```yaml
resources:
  limits:
    cpus: '1.0'
    memory: 1024M
  reservations:
    cpus: '0.5'
    memory: 512M
```

---

## 📝 Código - Leitura de Secrets

### Ambas usam a MESMA função
```javascript
function readSecret(envVarFile, fallbackEnvVar) {
    try {
        if (envVarFile && fs.existsSync(envVarFile)) {
            const content = fs.readFileSync(envVarFile, 'utf8').trim();
            console.log(`✅ Secret lido de: ${envVarFile}`);
            return content;
        }
    } catch (error) {
        console.warn(`⚠️ Erro ao ler secret ${envVarFile}:`, error.message);
    }
    
    const fallbackValue = process.env[fallbackEnvVar];
    if (fallbackValue) {
        console.log(`✅ Usando variável de ambiente: ${fallbackEnvVar}`);
        return fallbackValue;
    }
    
    throw new Error(`❌ Não foi possível ler ${envVarFile} ou ${fallbackEnvVar}`);
}
```

### prime-sync-api (exemplo hipotético)
```javascript
const FIREBIRD_HOST = readSecret(process.env.FIREBIRD_HOST_FILE, 'FIREBIRD_HOST');
const SUPABASE_URL = readSecret(process.env.SUPABASE_URL_FILE, 'SUPABASE_URL');
```

### oportunidades-sync-api
```javascript
const SUPABASE_URL = readSecret(process.env.SUPABASE_URL_FILE, 'VITE_SUPABASE_URL');
const SPRINTHUB_TOKEN = readSecret(process.env.SPRINTHUB_TOKEN_FILE, 'VITE_SPRINTHUB_API_TOKEN');
```

---

## 🚀 Endpoints

### prime-sync-api
```bash
# Raiz do domínio
GET https://sincro.oficialmed.com.br/
GET https://sincro.oficialmed.com.br/health
```

### oportunidades-sync-api
```bash
# Subpath /oportunidades
GET https://sincro.oficialmed.com.br/oportunidades
GET https://sincro.oficialmed.com.br/oportunidades/health
GET https://sincro.oficialmed.com.br/oportunidades/status
```

---

## ⏰ Execução Automática

### prime-sync-api
Não especificado (provavelmente manual ou outro cronjob)

### oportunidades-sync-api
```sql
-- Cronjob Supabase a cada 30 minutos
SELECT cron.schedule(
  'sync-oportunidades-sprinthub',
  '*/30 * * * *',
  $$SELECT api.sync_oportunidades_sprinthub_with_log();$$
);
```

---

## 📦 Dockerfile Comparação

### Semelhanças
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY package-sync-apis.json package.json
RUN npm install --production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs
```

### Diferenças
```dockerfile
# prime-sync-api
EXPOSE 5000
HEALTHCHECK CMD curl -f http://localhost:5000/health || exit 1

# oportunidades-sync-api
EXPOSE 5001
HEALTHCHECK CMD curl -f http://localhost:5001/health || exit 1
```

---

## 🔄 GitHub Actions

### prime-sync-api
Não encontrado (pode não ter workflow específico)

### oportunidades-sync-api
```yaml
name: Deploy Oportunidades Sync API to Docker Hub
on:
  push:
    branches: [ main ]
    paths:
      - 'api-sync-opportunities.js'
      - 'Dockerfile.sync-opportunities'
      - 'package-sync-apis.json'
      - '.github/workflows/deploy-oportunidades-sync.yml'
  workflow_dispatch:
```

---

## 🎯 Use Cases

### prime-sync-api
**Sincronização:** Banco Firebird local → Supabase  
**Frequência:** Sob demanda ou agendamento externo  
**Volume:** Dados de clientes, pedidos, etc.  
**Complexidade:** Conexão com banco local via rede

### oportunidades-sync-api
**Sincronização:** SprintHub API → Supabase  
**Frequência:** A cada 30 minutos (cronjob Supabase)  
**Volume:** ~16.837 oportunidades (2 funis)  
**Complexidade:** Múltiplos funis, múltiplas etapas, paginação

---

## ✅ Vantagens de Seguir o Mesmo Padrão

| Vantagem | Descrição |
|----------|-----------|
| **Consistência** | Mesma estrutura de código facilita manutenção |
| **Secrets** | Padrão de leitura de secrets testado e aprovado |
| **Docker** | Mesma configuração base, recursos idênticos |
| **Traefik** | Mesmo padrão de labels, SSL automático |
| **Monitoramento** | Logs e health checks no mesmo formato |
| **Deploy** | Equipe já conhece o processo |

---

## 🔧 Comandos Paralelos

### Verificar ambos os serviços
```bash
# Listar todos os serviços de sincronização
docker service ls | grep sync

# Ver logs de ambos
docker service logs -f prime-sync_prime-sync-api
docker service logs -f oportunidades-sync_oportunidades-sync-api

# Health check de ambos
curl https://sincro.oficialmed.com.br/health
curl https://sincro.oficialmed.com.br/oportunidades/health
```

### Atualizar ambos
```bash
# Atualizar prime-sync
docker service update --force --image oficialmedpro/prime-sync-api:latest \
  prime-sync_prime-sync-api

# Atualizar oportunidades-sync
docker service update --force --image oficialmedpro/oportunidades-sync-api:latest \
  oportunidades-sync_oportunidades-sync-api
```

---

## 📊 Recursos Utilizados (Total)

### CPU
- prime-sync: 0.5-1.0 CPUs
- oportunidades-sync: 0.5-1.0 CPUs
- **Total:** 1.0-2.0 CPUs

### Memória
- prime-sync: 512MB-1GB
- oportunidades-sync: 512MB-1GB
- **Total:** 1GB-2GB

### Secrets
- prime-sync: 6 secrets
- oportunidades-sync: 5 secrets
- **Total:** 11 secrets

### Portas
- prime-sync: 5000
- oportunidades-sync: 5001
- **Conflito:** ❌ Nenhum (portas diferentes)

---

## 🌐 Arquitetura Completa

```
┌─────────────────────────────────────────────────────────────┐
│                    sincro.oficialmed.com.br                 │
│                          (Traefik)                          │
└─────────────────────────────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
         ┌──────▼──────┐    ┌──────▼──────────────┐
         │   / (root)  │    │   /oportunidades    │
         │  Port 5000  │    │     Port 5001       │
         └──────┬──────┘    └──────┬──────────────┘
                │                   │
    ┌───────────▼────────┐  ┌──────▼───────────────┐
    │  prime-sync-api    │  │ oportunidades-sync   │
    │  (Firebird)        │  │ (SprintHub API)      │
    └───────────┬────────┘  └──────┬───────────────┘
                │                   │
                └──────────┬────────┘
                           │
                    ┌──────▼──────┐
                    │   Supabase  │
                    │  (PostgreSQL)│
                    └─────────────┘
```

---

## 🎯 Recomendações

### ✅ Manter
1. Padrão de secrets com prefixos (`PRIME_*`, `OPP_*`)
2. Portas diferentes para evitar conflitos
3. Mesma estrutura de Dockerfile
4. Resources limits idênticos
5. Restart policies consistentes

### 🚀 Melhorias Futuras
1. Criar dashboard unificado de monitoramento
2. Alertas quando sync falhar
3. Métricas de performance (Prometheus/Grafana)
4. Logs centralizados (Loki)
5. Scripts de deploy automatizados

---

## 📝 Lições Aprendidas

1. **Reusar padrões existentes economiza tempo e reduz erros**
2. **Prefixos em secrets evitam conflitos em stacks múltiplas**
3. **Portas diferentes permitem rodar serviços em paralelo**
4. **PathPrefix no Traefik permite múltiplos serviços no mesmo domínio**
5. **GitHub Actions com paths específicos evita builds desnecessários**

---

## ✅ Status Final

| Serviço | Status | Endpoint | Automação |
|---------|--------|----------|-----------|
| **prime-sync-api** | ✅ Produção | `sincro.oficialmed.com.br` | Manual/Externa |
| **oportunidades-sync-api** | 🚀 Pronto | `sincro.oficialmed.com.br/oportunidades` | Cronjob 30min |

**Ambos seguem o mesmo padrão arquitetural! 🎉**

---

**Data:** Janeiro 2025  
**Versão:** 1.0.0







