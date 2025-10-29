# 🔄 API de Sincronização de Oportunidades

## 📝 Resumo Rápido

Esta API sincroniza automaticamente oportunidades do **SprintHub** (Funis 6 e 14) para o **Supabase** (tabela `oportunidade_sprint`).

**Endpoint:** `https://sincro.oficialmed.com.br/oportunidades`

---

## 🚀 Deploy em 5 Passos

### 1️⃣ Push para GitHub (Build Automático)
```bash
git add .
git commit -m "feat: API sincronização oportunidades"
git push origin main
```
✅ GitHub Actions fará build e push para DockerHub automaticamente

### 2️⃣ Criar Secrets no Portainer
Criar 5 secrets em **Swarm > Secrets**:
- `OPP_SUPABASE_URL` → URL do Supabase
- `OPP_SUPABASE_KEY` → Service Role Key
- `OPP_SPRINTHUB_BASE_URL` → `sprinthub-api-master.sprinthub.app`
- `OPP_SPRINTHUB_INSTANCE` → `oficialmed`
- `OPP_SPRINTHUB_TOKEN` → Token da API

### 3️⃣ Deploy da Stack
1. Portainer > Stacks > Add Stack
2. Nome: `oportunidades-sync`
3. Colar conteúdo de `stack-oportunidades-sync.yml`
4. Deploy!

### 4️⃣ Testar API
```bash
curl https://sincro.oficialmed.com.br/oportunidades/health
curl https://sincro.oficialmed.com.br/oportunidades
```

### 5️⃣ Configurar Cronjob no Supabase
Executar SQL do arquivo: `supabase/cronjob-sync-oportunidades.sql`

---

## 📂 Arquivos do Projeto

| Arquivo | Descrição |
|---------|-----------|
| `api-sync-opportunities.js` | API Node.js principal |
| `Dockerfile.sync-opportunities` | Configuração Docker |
| `stack-oportunidades-sync.yml` | Stack do Portainer |
| `package-sync-apis.json` | Dependências NPM |
| `.github/workflows/deploy-oportunidades-sync.yml` | CI/CD automático |
| `supabase/cronjob-sync-oportunidades.sql` | Cronjob Supabase |
| `DEPLOY_OPORTUNIDADES_SYNC.md` | Documentação completa |

---

## 🎯 Endpoints Disponíveis

### Health Check
```bash
GET https://sincro.oficialmed.com.br/oportunidades/health
```
Resposta:
```json
{
  "status": "OK",
  "service": "API Sync Opportunities",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Sincronização Manual
```bash
GET https://sincro.oficialmed.com.br/oportunidades
```
Resposta:
```json
{
  "success": true,
  "message": "Sincronização de oportunidades concluída com sucesso",
  "data": {
    "totalProcessed": 16837,
    "totalInserted": 245,
    "totalUpdated": 1523,
    "totalErrors": 0,
    "duration": "342.50s",
    "timestamp": "2025-01-15T10:45:00.000Z"
  }
}
```

### Status
```bash
GET https://sincro.oficialmed.com.br/oportunidades/status
```
Resposta:
```json
{
  "success": true,
  "data": {
    "totalOpportunities": 16837,
    "lastCheck": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## ⏰ Execução Automática

**Frequência:** A cada 30 minutos  
**Método:** Cronjob do Supabase (pg_cron)  
**Primeira execução:** ~15-20 minutos  
**Execuções seguintes:** ~2-5 minutos

---

## 📊 Funis Sincronizados

### Funil 6 - COMERCIAL APUCARANA
- **Etapas:** 130, 231, 82, 207, 83, 85, 232
- **Volume:** ~13.700 oportunidades

### Funil 14 - RECOMPRA
- **Etapas:** 227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150
- **Volume:** ~3.137 oportunidades

---

## 🔍 Monitoramento

### Ver Logs
```bash
docker service logs -f oportunidades-sync_oportunidades-sync-api
```

### Verificar Status do Container
```bash
docker service ps oportunidades-sync_oportunidades-sync-api
```

### Consultar Dados Sincronizados
```sql
SELECT 
  funil_id,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync
FROM api.oportunidade_sprint
GROUP BY funil_id;
```

### Ver Log do Cronjob
```sql
SELECT * 
FROM api.sync_oportunidades_log 
ORDER BY executed_at DESC 
LIMIT 10;
```

---

## 🛠️ Atualizar a API

1. Editar `api-sync-opportunities.js`
2. Commit e push
3. GitHub Actions faz build automático
4. Atualizar stack no Portainer:
```bash
docker service update --force --image oficialmedpro/oportunidades-sync-api:latest \
  oportunidades-sync_oportunidades-sync-api
```

---

## 🐛 Troubleshooting

### Container reiniciando?
```bash
docker service logs oportunidades-sync_oportunidades-sync-api
```

### Secrets não encontrados?
Verificar no Portainer > Swarm > Secrets se os 5 secrets existem

### Cronjob não executa?
```sql
SELECT * FROM cron.job WHERE jobname = 'sync-oportunidades-sprinthub';
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

---

## 📚 Documentação Completa

Para instruções detalhadas, consultar: **[DEPLOY_OPORTUNIDADES_SYNC.md](./DEPLOY_OPORTUNIDADES_SYNC.md)**

---

## ✅ Checklist de Deploy

- [ ] Push para GitHub (build automático)
- [ ] Criar 5 secrets no Portainer
- [ ] Deploy da stack
- [ ] Testar health check
- [ ] Testar sincronização manual
- [ ] Configurar cronjob no Supabase
- [ ] Verificar primeira execução automática
- [ ] Monitorar logs por 24h

---

**Versão:** 1.0.0  
**Data:** Janeiro 2025  
**Stack Base:** Segue padrão da `prime-sync-api` ✅

