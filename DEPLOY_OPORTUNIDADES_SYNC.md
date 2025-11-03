# 🚀 DEPLOY - API DE SINCRONIZAÇÃO DE OPORTUNIDADES

## 📋 Visão Geral

Este documento contém todas as instruções para fazer o deploy da API de sincronização de oportunidades do SprintHub para o Supabase.

**Endpoint Final:** `https://sincro.oficialmed.com.br/oportunidades`

---

## 🎯 Arquitetura

```
SprintHub (Funis 6 e 14) 
    ↓
API Node.js (Docker Container)
    ↓
Supabase (tabela oportunidade_sprint)
    ↓
Cronjob Supabase (execução automática a cada 30 min)
```

---

## 📦 Arquivos Necessários

- ✅ `api-sync-opportunities.js` - API Node.js
- ✅ `Dockerfile.sync-opportunities` - Configuração Docker
- ✅ `stack-oportunidades-sync.yml` - Stack do Portainer
- ✅ `package-sync-apis.json` - Dependências NPM
- ✅ `.github/workflows/deploy-oportunidades-sync.yml` - CI/CD automático

---

## 🔨 PASSO 1: BUILD E PUSH NO DOCKERHUB

### Opção A: Automático via GitHub Actions (RECOMENDADO)

1. **Fazer commit e push dos arquivos:**
```bash
git add api-sync-opportunities.js Dockerfile.sync-opportunities stack-oportunidades-sync.yml .github/workflows/deploy-oportunidades-sync.yml
git commit -m "feat: API de sincronização de oportunidades SprintHub → Supabase"
git push origin main
```

2. **O GitHub Actions irá:**
   - Detectar mudanças nos arquivos
   - Fazer build da imagem Docker
   - Fazer push para `oficialmedpro/oportunidades-sync-api:latest`

3. **Acompanhar o build:**
   - Acessar: https://github.com/SEU_USUARIO/minha-pwa/actions
   - Verificar se o workflow "Deploy Oportunidades Sync API to Docker Hub" foi executado com sucesso

### Opção B: Manual via Docker CLI

```bash
# Build da imagem
docker build -f Dockerfile.sync-opportunities -t oficialmedpro/oportunidades-sync-api:latest .

# Login no Docker Hub
docker login -u oficialmedpro

# Push da imagem
docker push oficialmedpro/oportunidades-sync-api:latest
```

---

## 🔐 PASSO 2: CONFIGURAR SECRETS NO PORTAINER

Acesse o Portainer e crie os seguintes secrets em **Swarm > Secrets**:

### 1️⃣ OPP_SUPABASE_URL
```
Valor: https://seu-projeto.supabase.co
```

### 2️⃣ OPP_SUPABASE_KEY
```
Valor: sua_service_role_key_aqui
```
> ⚠️ **IMPORTANTE:** Usar a **Service Role Key**, não a anon key!

### 3️⃣ OPP_SPRINTHUB_BASE_URL
```
Valor: sprinthub-api-master.sprinthub.app
```

### 4️⃣ OPP_SPRINTHUB_INSTANCE
```
Valor: oficialmed
```

### 5️⃣ OPP_SPRINTHUB_TOKEN
```
Valor: 9ad36c85-5858-4960-9935-e73c3698dd0c
```

---

## 🚀 PASSO 3: DEPLOY DA STACK NO PORTAINER

### 3.1 Criar a Stack

1. Acessar: **Portainer > Stacks > Add Stack**
2. Nome: `oportunidades-sync`
3. Colar o conteúdo do arquivo `stack-oportunidades-sync.yml`
4. Clicar em **Deploy the stack**

### 3.2 Verificar se o Container está Rodando

```bash
# SSH no servidor
ssh usuario@seu-servidor.com

# Verificar containers
docker service ls | grep oportunidades

# Ver logs
docker service logs -f oportunidades-sync_oportunidades-sync-api
```

### 3.3 Testar os Endpoints

```bash
# Health check
curl https://sincro.oficialmed.com.br/oportunidades/health

# Status (conta quantas oportunidades existem)
curl https://sincro.oficialmed.com.br/oportunidades/status

# Sincronização manual (teste inicial)
curl https://sincro.oficialmed.com.br/oportunidades
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

## ⏰ PASSO 4: CONFIGURAR CRONJOB NO SUPABASE

### 4.1 Criar a função pg_cron

Execute no **Supabase SQL Editor**:

```sql
-- 1. Habilitar extensão pg_cron (se ainda não habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Criar função para chamar a API
CREATE OR REPLACE FUNCTION api.sync_oportunidades_sprinthub()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status INTEGER;
  response_body TEXT;
BEGIN
  -- Chamar API de sincronização
  SELECT status, content INTO response_status, response_body
  FROM http_get('https://sincro.oficialmed.com.br/oportunidades');
  
  -- Log do resultado
  RAISE NOTICE 'Sincronização de oportunidades executada - Status: %, Response: %', 
    response_status, response_body;
    
  -- Se erro HTTP, registrar
  IF response_status != 200 THEN
    RAISE WARNING 'Erro na sincronização: Status %, Body: %', 
      response_status, response_body;
  END IF;
END;
$$;

-- 3. Agendar execução a cada 30 minutos
SELECT cron.schedule(
  'sync-oportunidades-sprinthub',           -- nome do job
  '*/30 * * * *',                            -- a cada 30 minutos
  'SELECT api.sync_oportunidades_sprinthub();'
);

-- 4. Verificar se o job foi criado
SELECT * FROM cron.job WHERE jobname = 'sync-oportunidades-sprinthub';

-- 5. (Opcional) Testar execução manual
SELECT api.sync_oportunidades_sprinthub();
```

### 4.2 Verificar execução do cronjob

```sql
-- Ver histórico de execuções
SELECT * 
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid 
  FROM cron.job 
  WHERE jobname = 'sync-oportunidades-sprinthub'
)
ORDER BY start_time DESC
LIMIT 10;
```

### 4.3 Comandos úteis para gerenciar o cronjob

```sql
-- Desabilitar job temporariamente
SELECT cron.unschedule('sync-oportunidades-sprinthub');

-- Recriar job (mudar frequência, por exemplo)
SELECT cron.schedule(
  'sync-oportunidades-sprinthub',
  '0 * * * *',  -- A cada hora no minuto 0
  'SELECT api.sync_oportunidades_sprinthub();'
);

-- Executar manualmente
SELECT cron.run_job('sync-oportunidades-sprinthub');
```

---

## 🔍 PASSO 5: MONITORAMENTO E TROUBLESHOOTING

### Verificar Logs da API

```bash
# Logs em tempo real
docker service logs -f oportunidades-sync_oportunidades-sync-api

# Últimas 100 linhas
docker service logs --tail 100 oportunidades-sync_oportunidades-sync-api

# Filtrar por erros
docker service logs oportunidades-sync_oportunidades-sync-api 2>&1 | grep "❌"
```

### Verificar Saúde do Container

```bash
# Status do serviço
docker service ps oportunidades-sync_oportunidades-sync-api

# Inspecionar serviço
docker service inspect oportunidades-sync_oportunidades-sync-api
```

### Verificar dados no Supabase

```sql
-- Contar oportunidades sincronizadas
SELECT 
  funil_id,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync
FROM api.oportunidade_sprint
GROUP BY funil_id;

-- Ver últimas oportunidades sincronizadas
SELECT 
  id,
  title,
  funil_id,
  status,
  value,
  synced_at
FROM api.oportunidade_sprint
ORDER BY synced_at DESC
LIMIT 10;
```

---

## 🐛 PROBLEMAS COMUNS

### Problema 1: Container não inicia

**Sintoma:** Container reinicia constantemente

**Solução:**
```bash
# Ver logs de erro
docker service logs oportunidades-sync_oportunidades-sync-api

# Verificar secrets
docker secret ls | grep OPP_

# Verificar se secrets existem
docker secret inspect OPP_SUPABASE_URL
```

### Problema 2: Erro "Cannot read secret"

**Causa:** Secrets não foram criados corretamente

**Solução:**
1. Ir em Portainer > Swarm > Secrets
2. Verificar se todos os 5 secrets existem: `OPP_SUPABASE_URL`, `OPP_SUPABASE_KEY`, `OPP_SPRINTHUB_BASE_URL`, `OPP_SPRINTHUB_INSTANCE`, `OPP_SPRINTHUB_TOKEN`
3. Recriar os secrets faltantes

### Problema 3: Cronjob não executa

**Solução:**
```sql
-- Verificar se o job existe
SELECT * FROM cron.job WHERE jobname = 'sync-oportunidades-sprinthub';

-- Verificar erros na última execução
SELECT * 
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-oportunidades-sprinthub')
ORDER BY start_time DESC 
LIMIT 1;

-- Testar função diretamente
SELECT api.sync_oportunidades_sprinthub();
```

### Problema 4: Timeout na sincronização

**Causa:** Muitas oportunidades para processar

**Solução:** Ajustar delays no arquivo `api-sync-opportunities.js`:
```javascript
const DELAY_BETWEEN_PAGES = 2000; // Aumentar para 3000 ou 5000
const DELAY_BETWEEN_STAGES = 1000; // Aumentar para 2000
```

---

## 📊 FUNIS CONFIGURADOS

### Funil 6 - COMERCIAL APUCARANA
- **Etapas:** 130, 231, 82, 207, 83, 85, 232
- **Estimativa:** ~13.700 oportunidades

### Funil 14 - RECOMPRA
- **Etapas:** 227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150
- **Estimativa:** ~3.137 oportunidades

---

## 🔄 ATUALIZAR A API

Quando precisar fazer mudanças na API:

1. **Editar arquivos:**
   - `api-sync-opportunities.js`

2. **Commit e push:**
```bash
git add api-sync-opportunities.js
git commit -m "fix: ajuste na sincronização de oportunidades"
git push origin main
```

3. **O GitHub Actions fará build automático**

4. **Atualizar stack no Portainer:**
```bash
# Forçar pull da nova imagem
docker service update --force --image oficialmedpro/oportunidades-sync-api:latest \
  oportunidades-sync_oportunidades-sync-api
```

Ou pelo Portainer:
- Ir em **Stacks > oportunidades-sync**
- Clicar em **Update the stack**
- Marcar **Pull latest image**
- Clicar em **Update**

---

## ✅ CHECKLIST DE DEPLOY

- [ ] Build da imagem no DockerHub (`oficialmedpro/oportunidades-sync-api:latest`)
- [ ] Criar 5 secrets no Portainer (OPP_*)
- [ ] Deploy da stack `oportunidades-sync`
- [ ] Testar health check: `https://sincro.oficialmed.com.br/oportunidades/health`
- [ ] Testar sincronização manual: `https://sincro.oficialmed.com.br/oportunidades`
- [ ] Criar cronjob no Supabase
- [ ] Verificar primeira execução automática
- [ ] Monitorar logs por 24h

---

## 📞 SUPORTE

Em caso de dúvidas:
1. Verificar logs do container
2. Testar endpoints manualmente
3. Verificar se secrets estão corretos
4. Comparar com a stack `prime-sync-api` que está funcionando

---

**Data de criação:** Janeiro 2025  
**Versão:** 1.0.0  
**Autor:** OficialMed Tech Team







