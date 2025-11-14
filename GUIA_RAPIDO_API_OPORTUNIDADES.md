# 🚀 GUIA RÁPIDO - API de Sincronização de Oportunidades

## ✅ O que você precisa fazer:

### 📋 **1. Build da Imagem Docker**

A imagem precisa estar no Docker Hub: `oficialmedpro/oportunidades-sync-api:latest`

**Opção Automática (GitHub Actions):**
- Fazer commit e push dos arquivos
- O GitHub Actions fará o build automaticamente

**Opção Manual:**
```bash
docker build -f Dockerfile.sync-opportunities -t oficialmedpro/oportunidades-sync-api:latest .
docker login -u oficialmedpro
docker push oficialmedpro/oportunidades-sync-api:latest
```

---

### 🔐 **2. Criar Secrets no Portainer**

Acesse: **Portainer > Swarm > Secrets**

Criar os seguintes 5 secrets (com os nomes EXATOS):

| Secret | Valor |
|--------|-------|
| `OPP_SUPABASE_URL` | `https://seu-projeto.supabase.co` |
| `OPP_SUPABASE_KEY` | Sua **Service Role Key** do Supabase |
| `OPP_SPRINTHUB_BASE_URL` | `sprinthub-api-master.sprinthub.app` |
| `OPP_SPRINTHUB_INSTANCE` | `oficialmed` |
| `OPP_SPRINTHUB_TOKEN` | Seu token da API do SprintHub |

⚠️ **IMPORTANTE:** Use a **Service Role Key** do Supabase, não a anon key!

---

### 🚀 **3. Deploy da Stack no Portainer**

1. Acesse: **Portainer > Stacks > Add Stack**
2. **Nome:** `oportunidades-sync`
3. **Editor:** Cole o conteúdo do arquivo `stack-oportunidades-sync.yml`
4. Clique em **Deploy the stack**

---

### 🧪 **4. Testar os Endpoints**

Após o deploy, teste se está funcionando:

```bash
# Health Check
curl https://sincro.oficialmed.com.br/oportunidades/health

# Métricas
curl https://sincro.oficialmed.com.br/oportunidades/metrics

# Orquestrador Completo (os 3 juntos)
curl https://sincro.oficialmed.com.br/oportunidades/sync/all

# Leads apenas
curl https://sincro.oficialmed.com.br/oportunidades/leads

# Segmentos apenas
curl https://sincro.oficialmed.com.br/oportunidades/segmentos
```

**Resposta esperada do health check:**
```json
{
  "status": "OK",
  "service": "API Sync Opportunities",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### ⏰ **5. (Opcional) Configurar Cronjob no Supabase**

Para execução automática a cada 30 minutos, execute no **Supabase SQL Editor**:

```sql
-- Habilitar extensão
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar função
CREATE OR REPLACE FUNCTION api.sync_oportunidades_sprinthub()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status INTEGER;
  response_body TEXT;
BEGIN
  SELECT status, content INTO response_status, response_body
  FROM http_get('https://sincro.oficialmed.com.br/oportunidades/sync/all');
  
  IF response_status != 200 THEN
    RAISE WARNING 'Erro na sincronização: Status %, Body: %', 
      response_status, response_body;
  END IF;
END;
$$;

-- Agendar execução a cada 30 minutos
SELECT cron.schedule(
  'sync-oportunidades-sprinthub',
  '*/30 * * * *',
  'SELECT api.sync_oportunidades_sprinthub();'
);
```

---

## 🔍 **Verificar se Está Funcionando**

### Ver Logs do Container:
```bash
docker service logs -f oportunidades-sync_oportunidades-sync-api
```

### Verificar se o Container Está Rodando:
```bash
docker service ls | grep oportunidades
```

### Testar Manualmente:
```bash
# Sincronização completa (oportunidades + leads + segmentos)
curl https://sincro.oficialmed.com.br/oportunidades/sync/all
```

---

## 🐛 **Problemas Comuns**

### Container não inicia:
- Verificar se todos os 5 secrets foram criados
- Verificar logs: `docker service logs oportunidades-sync_oportunidades-sync-api`

### Erro ao ler secrets:
- Verificar se os nomes dos secrets estão EXATOS (com `OPP_` no início)
- Verificar se os valores estão corretos

### API não responde:
- Verificar se o Traefik está configurado corretamente
- Verificar se a rede `OficialMed` existe no Swarm

---

## 📊 **Endpoints Disponíveis**

| Endpoint | Descrição |
|----------|-----------|
| `GET /health` | Health check |
| `GET /metrics` | Métricas e status |
| `GET /sync/all` | **Orquestrador completo** (oportunidades → leads → segmentos) |
| `GET /leads` | Sincronizar apenas leads |
| `GET /segmentos` | Sincronizar apenas segmentos |

---

## ✅ **Checklist Final**

- [ ] Imagem `oficialmedpro/oportunidades-sync-api:latest` no Docker Hub
- [ ] 5 secrets criados no Portainer (OPP_*)
- [ ] Stack `oportunidades-sync` criada e rodando
- [ ] Health check retorna `200 OK`
- [ ] Endpoint `/sync/all` funciona corretamente
- [ ] (Opcional) Cronjob configurado no Supabase

---

**Arquivos Importantes:**
- `api-sync-opportunities.js` - Código da API
- `Dockerfile.sync-opportunities` - Build da imagem
- `stack-oportunidades-sync.yml` - Stack do Portainer











