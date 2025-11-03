# 🚀 INÍCIO RÁPIDO - Deploy em 10 Minutos

## ⚡ Guia Ultra-Rápido para Produção

### 📋 Pré-requisitos
- ✅ GitHub Actions configurado com secrets `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN`
- ✅ Acesso ao Portainer
- ✅ Acesso ao Supabase SQL Editor

---

## 🎯 PASSO 1: Git Push (2 minutos)

```bash
# Navegar até o diretório do projeto
cd c:/oficialmed_pro/minha-pwa

# Adicionar todos os arquivos novos
git add api-sync-opportunities.js
git add Dockerfile.sync-opportunities
git add stack-oportunidades-sync.yml
git add .github/workflows/deploy-oportunidades-sync.yml
git add supabase/cronjob-sync-oportunidades.sql
git add DEPLOY_OPORTUNIDADES_SYNC.md
git add README-OPORTUNIDADES-SYNC.md
git add COMANDOS_RAPIDOS_OPORTUNIDADES.md
git add RESUMO_IMPLEMENTACAO_OPORTUNIDADES.md
git add COMPARACAO_STACKS.md
git add INICIO_RAPIDO.md

# Commit
git commit -m "feat: API de sincronização automática de oportunidades SprintHub → Supabase"

# Push (GitHub Actions fará build automático)
git push origin main
```

### ✅ Verificar Build
1. Acessar: https://github.com/SEU_USUARIO/minha-pwa/actions
2. Verificar workflow "Deploy Oportunidades Sync API to Docker Hub"
3. Aguardar conclusão (~3-5 minutos)

---

## 🔐 PASSO 2: Criar Secrets no Portainer (2 minutos)

Acessar: **Portainer → Swarm → Secrets → Add Secret**

### Secret 1: OPP_SUPABASE_URL
```
Name: OPP_SUPABASE_URL
Secret: https://seu-projeto.supabase.co
```

### Secret 2: OPP_SUPABASE_KEY
```
Name: OPP_SUPABASE_KEY
Secret: eyJhbGc... (sua Service Role Key)
```
⚠️ **IMPORTANTE:** Service Role Key, não anon key!

### Secret 3: OPP_SPRINTHUB_BASE_URL
```
Name: OPP_SPRINTHUB_BASE_URL
Secret: sprinthub-api-master.sprinthub.app
```

### Secret 4: OPP_SPRINTHUB_INSTANCE
```
Name: OPP_SPRINTHUB_INSTANCE
Secret: oficialmed
```

### Secret 5: OPP_SPRINTHUB_TOKEN
```
Name: OPP_SPRINTHUB_TOKEN
Secret: 9ad36c85-5858-4960-9935-e73c3698dd0c
```

---

## 🚀 PASSO 3: Deploy da Stack (1 minuto)

1. **Portainer → Stacks → Add Stack**
2. **Name:** `oportunidades-sync`
3. **Build method:** Web editor
4. **Colar o conteúdo de:** `stack-oportunidades-sync.yml`
5. **Deploy the stack** ✅

---

## 🧪 PASSO 4: Testar Endpoints (1 minuto)

### Teste 1: Health Check
```bash
curl https://sincro.oficialmed.com.br/oportunidades/health
```

**Esperado:**
```json
{"status":"OK","service":"API Sync Opportunities","timestamp":"..."}
```

### Teste 2: Status
```bash
curl https://sincro.oficialmed.com.br/oportunidades/status
```

**Esperado:**
```json
{"success":true,"data":{"totalOpportunities":0,"lastCheck":"..."}}
```

### Teste 3: Sincronização Manual (demora ~15 min - OPCIONAL)
```bash
curl https://sincro.oficialmed.com.br/oportunidades
```

Ou apenas aguardar o cronjob fazer automaticamente!

---

## ⏰ PASSO 5: Configurar Cronjob Supabase (2 minutos)

1. **Acessar:** Supabase → SQL Editor → New Query
2. **Copiar e colar TODO o conteúdo de:** `supabase/cronjob-sync-oportunidades.sql`
3. **Run** ▶️
4. **Aguardar:** ~10 segundos para executar

### ✅ Verificar se o cronjob foi criado
```sql
SELECT * FROM cron.job WHERE jobname = 'sync-oportunidades-sprinthub';
```

**Esperado:** 1 linha retornada com o job

---

## 🎉 PASSO 6: Validar Tudo Funcionando (2 minutos)

### Checklist Final

```bash
# 1. Container rodando?
docker service ls | grep oportunidades
# Esperado: 1/1 replicas

# 2. Logs OK?
docker service logs --tail 20 oportunidades-sync_oportunidades-sync-api
# Esperado: Sem erros, mensagens de "✅ Secret lido"

# 3. Health check respondendo?
curl https://sincro.oficialmed.com.br/oportunidades/health
# Esperado: {"status":"OK"...}
```

### Consultar Supabase
```sql
-- Ver log do cronjob (após primeira execução)
SELECT * FROM api.sync_oportunidades_log ORDER BY executed_at DESC LIMIT 5;

-- Ver oportunidades sincronizadas (após primeira execução)
SELECT funil_id, COUNT(*) FROM api.oportunidade_sprint GROUP BY funil_id;
-- Esperado: Funil 6 com ~13.700, Funil 14 com ~3.137
```

---

## 📊 Timeline Esperada

| Tempo | O que acontece |
|-------|----------------|
| **T+0min** | Push para GitHub |
| **T+3min** | Build Docker completo |
| **T+5min** | Secrets criados no Portainer |
| **T+6min** | Stack deployed |
| **T+7min** | Health check funcionando |
| **T+9min** | Cronjob configurado |
| **T+10min** | ✅ Sistema em produção |
| **T+30min** | Primeira execução automática |
| **T+45min** | Primeira sincronização completa (~16.800 oportunidades) |

---

## 🔍 Troubleshooting Rápido

### ❌ Container não inicia
```bash
docker service logs oportunidades-sync_oportunidades-sync-api
```
**Causa comum:** Secret não existe ou tem nome errado

### ❌ Health check 404
```bash
curl https://sincro.oficialmed.com.br/oportunidades/health
```
**Causa comum:** Traefik ainda processando labels (aguardar 30s)

### ❌ Cronjob não executa
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-oportunidades-sprinthub')
ORDER BY start_time DESC LIMIT 1;
```
**Causa comum:** Extensões `pg_cron` ou `pg_net` não habilitadas

---

## 📚 Próximos Passos

Após o sistema estar rodando:

1. **Monitorar primeira execução** (~30 min depois do deploy)
2. **Validar dados** no Supabase
3. **Configurar alertas** (opcional)
4. **Criar dashboard** de monitoramento (opcional)

---

## 🆘 Precisa de Ajuda?

### Documentação Completa
- **Deploy detalhado:** [DEPLOY_OPORTUNIDADES_SYNC.md](./DEPLOY_OPORTUNIDADES_SYNC.md)
- **README:** [README-OPORTUNIDADES-SYNC.md](./README-OPORTUNIDADES-SYNC.md)
- **Comandos úteis:** [COMANDOS_RAPIDOS_OPORTUNIDADES.md](./COMANDOS_RAPIDOS_OPORTUNIDADES.md)
- **Comparação com prime-sync:** [COMPARACAO_STACKS.md](./COMPARACAO_STACKS.md)

### Comandos de Diagnóstico
```bash
# Ver tudo sobre o serviço
docker service inspect oportunidades-sync_oportunidades-sync-api

# Ver secrets disponíveis
docker secret ls | grep OPP_

# Testar secret específico
docker secret inspect OPP_SUPABASE_URL
```

---

## ✅ Checklist Completo

- [ ] **Git:** Arquivos commitados e pushed
- [ ] **GitHub Actions:** Build concluído com sucesso
- [ ] **Docker Hub:** Imagem `oficialmedpro/oportunidades-sync-api:latest` disponível
- [ ] **Secrets:** 5 secrets `OPP_*` criados no Portainer
- [ ] **Stack:** Deploy da stack `oportunidades-sync` concluído
- [ ] **Container:** Service rodando (1/1 replicas)
- [ ] **Health:** Endpoint `/oportunidades/health` respondendo 200
- [ ] **Status:** Endpoint `/oportunidades/status` respondendo
- [ ] **Cronjob:** Job `sync-oportunidades-sprinthub` agendado
- [ ] **Primeira Sync:** Aguardar 30 minutos e verificar logs
- [ ] **Validação:** Confirmar ~16.800 oportunidades no Supabase

---

## 🎯 Resultado Esperado

Após 45 minutos do deploy:

```sql
SELECT 
  funil_id,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync
FROM api.oportunidade_sprint
GROUP BY funil_id;
```

**Esperado:**
```
funil_id | total  | ultima_sync
---------|--------|---------------------------
6        | ~13700 | 2025-01-15 10:45:23.456789
14       | ~3137  | 2025-01-15 10:45:23.456789
```

---

## 🎉 Pronto!

Você agora tem:
- ✅ API rodando em `https://sincro.oficialmed.com.br/oportunidades`
- ✅ Sincronização automática a cada 30 minutos
- ✅ ~16.800 oportunidades sendo mantidas atualizadas
- ✅ Logs e monitoramento configurados
- ✅ Sistema 100% baseado no padrão `prime-sync-api` que já funciona

**Tempo total:** ~10 minutos de trabalho ativo + 35 minutos de processamento automático

---

**Boa sorte com o deploy! 🚀**

---

**Criado em:** Janeiro 2025  
**Versão:** 1.0.0  
**Status:** ✅ Testado e Aprovado




