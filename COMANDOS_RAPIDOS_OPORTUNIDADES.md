# ⚡ COMANDOS RÁPIDOS - API Oportunidades Sync

## 🚀 Deploy Inicial

```bash
# 1. Commit e push (build automático via GitHub Actions)
git add api-sync-opportunities.js Dockerfile.sync-opportunities stack-oportunidades-sync.yml
git commit -m "feat: API sincronização oportunidades"
git push origin main

# 2. Verificar build no GitHub
# Acessar: https://github.com/SEU_USUARIO/minha-pwa/actions

# 3. Deploy no Portainer
# Portainer > Stacks > Add Stack > Nome: oportunidades-sync
# Colar conteúdo de: stack-oportunidades-sync.yml
```

---

## 🔐 Secrets do Portainer

```bash
# Criar em: Portainer > Swarm > Secrets

OPP_SUPABASE_URL
→ https://seu-projeto.supabase.co

OPP_SUPABASE_KEY
→ eyJ... (Service Role Key)

OPP_SPRINTHUB_BASE_URL
→ sprinthub-api-master.sprinthub.app

OPP_SPRINTHUB_INSTANCE
→ oficialmed

OPP_SPRINTHUB_TOKEN
→ 9ad36c85-5858-4960-9935-e73c3698dd0c
```

---

## 🧪 Testes

```bash
# Health check
curl https://sincro.oficialmed.com.br/oportunidades/health

# Status (quantas oportunidades existem)
curl https://sincro.oficialmed.com.br/oportunidades/status

# Sincronização manual (teste completo - demora ~15 min)
curl https://sincro.oficialmed.com.br/oportunidades
```

---

## 📊 Cronjob Supabase

```sql
-- Executar no Supabase SQL Editor
-- (Copiar conteúdo de: supabase/cronjob-sync-oportunidades.sql)

-- Ou comandos rápidos:

-- Verificar job
SELECT * FROM cron.job WHERE jobname = 'sync-oportunidades-sprinthub';

-- Ver últimas 10 execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-oportunidades-sprinthub')
ORDER BY start_time DESC LIMIT 10;

-- Executar manualmente
SELECT api.sync_oportunidades_sprinthub_with_log();

-- Desabilitar temporariamente
SELECT cron.unschedule('sync-oportunidades-sprinthub');

-- Reabilitar
SELECT cron.schedule(
  'sync-oportunidades-sprinthub',
  '*/30 * * * *',
  $$SELECT api.sync_oportunidades_sprinthub_with_log();$$
);
```

---

## 🔍 Monitoramento

```bash
# Ver logs em tempo real
docker service logs -f oportunidades-sync_oportunidades-sync-api

# Status do serviço
docker service ps oportunidades-sync_oportunidades-sync-api

# Últimas 100 linhas de log
docker service logs --tail 100 oportunidades-sync_oportunidades-sync-api

# Filtrar erros
docker service logs oportunidades-sync_oportunidades-sync-api 2>&1 | grep "❌"
```

---

## 📊 Consultas Supabase

```sql
-- Contar oportunidades por funil
SELECT 
  funil_id,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync
FROM api.oportunidade_sprint
GROUP BY funil_id;

-- Últimas 10 oportunidades sincronizadas
SELECT id, title, funil_id, status, value, synced_at
FROM api.oportunidade_sprint
ORDER BY synced_at DESC
LIMIT 10;

-- Ver log do cronjob (últimas 20 execuções)
SELECT id, executed_at, status, duration_ms, error_message
FROM api.sync_oportunidades_log
ORDER BY executed_at DESC
LIMIT 20;

-- Estatísticas últimos 7 dias
SELECT 
  DATE(executed_at) as dia,
  COUNT(*) as total_execucoes,
  COUNT(*) FILTER (WHERE status = 'success') as sucessos,
  COUNT(*) FILTER (WHERE status = 'error') as erros,
  AVG(duration_ms) as duracao_media_ms
FROM api.sync_oportunidades_log
WHERE executed_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(executed_at)
ORDER BY dia DESC;
```

---

## 🔄 Atualizar API

```bash
# 1. Editar código
# vim api-sync-opportunities.js

# 2. Commit e push (build automático)
git add api-sync-opportunities.js
git commit -m "fix: ajuste na sincronização"
git push origin main

# 3. Aguardar build no GitHub Actions (~3-5 min)

# 4. Atualizar container
docker service update --force \
  --image oficialmedpro/oportunidades-sync-api:latest \
  oportunidades-sync_oportunidades-sync-api

# Ou pelo Portainer:
# Stacks > oportunidades-sync > Update > Pull latest image > Update
```

---

## 🐛 Troubleshooting

```bash
# Container reiniciando?
docker service logs --tail 50 oportunidades-sync_oportunidades-sync-api

# Inspecionar serviço
docker service inspect oportunidades-sync_oportunidades-sync-api

# Verificar secrets
docker secret ls | grep OPP_

# Restart forçado
docker service update --force oportunidades-sync_oportunidades-sync-api

# Remover e recriar stack (CUIDADO!)
# Portainer > Stacks > oportunidades-sync > Delete
# Depois criar nova stack
```

---

## 🔄 Ajustar Frequência do Cronjob

```sql
-- A cada 15 minutos
SELECT cron.unschedule('sync-oportunidades-sprinthub');
SELECT cron.schedule(
  'sync-oportunidades-sprinthub',
  '*/15 * * * *',
  $$SELECT api.sync_oportunidades_sprinthub_with_log();$$
);

-- A cada 1 hora
SELECT cron.unschedule('sync-oportunidades-sprinthub');
SELECT cron.schedule(
  'sync-oportunidades-sprinthub',
  '0 * * * *',
  $$SELECT api.sync_oportunidades_sprinthub_with_log();$$
);

-- A cada 30 minutos (padrão)
SELECT cron.unschedule('sync-oportunidades-sprinthub');
SELECT cron.schedule(
  'sync-oportunidades-sprinthub',
  '*/30 * * * *',
  $$SELECT api.sync_oportunidades_sprinthub_with_log();$$
);
```

---

## 📦 Build Manual (caso necessário)

```bash
# Build local
docker build -f Dockerfile.sync-opportunities \
  -t oficialmedpro/oportunidades-sync-api:latest .

# Login Docker Hub
docker login -u oficialmedpro

# Push manual
docker push oficialmedpro/oportunidades-sync-api:latest
```

---

## ✅ Verificação Completa do Sistema

```bash
# 1. Container rodando?
docker service ls | grep oportunidades

# 2. API respondendo?
curl https://sincro.oficialmed.com.br/oportunidades/health

# 3. Dados no Supabase?
# Executar SQL:
SELECT COUNT(*) FROM api.oportunidade_sprint;

# 4. Cronjob agendado?
# Executar SQL:
SELECT * FROM cron.job WHERE jobname = 'sync-oportunidades-sprinthub';

# 5. Últimas execuções OK?
# Executar SQL:
SELECT * FROM api.sync_oportunidades_log ORDER BY executed_at DESC LIMIT 5;
```

---

## 🎯 Endpoints Completos

| Endpoint | Método | Descrição | Tempo |
|----------|--------|-----------|-------|
| `/oportunidades/health` | GET | Health check | ~10ms |
| `/oportunidades/status` | GET | Conta oportunidades | ~50ms |
| `/oportunidades` | GET | Sincronização completa | ~15-20min |

---

## 📞 Suporte Rápido

**Container não inicia?**
→ Verificar secrets no Portainer

**API não responde?**
→ Ver logs: `docker service logs oportunidades-sync_oportunidades-sync-api`

**Cronjob não executa?**
→ Testar manualmente: `SELECT api.sync_oportunidades_sprinthub_with_log();`

**Timeout na sincronização?**
→ Aumentar delays no `api-sync-opportunities.js`

---

## 📚 Documentação Completa

- **README:** [README-OPORTUNIDADES-SYNC.md](./README-OPORTUNIDADES-SYNC.md)
- **Deploy Detalhado:** [DEPLOY_OPORTUNIDADES_SYNC.md](./DEPLOY_OPORTUNIDADES_SYNC.md)
- **SQL Cronjob:** [supabase/cronjob-sync-oportunidades.sql](./supabase/cronjob-sync-oportunidades.sql)

---

**Última atualização:** Janeiro 2025










