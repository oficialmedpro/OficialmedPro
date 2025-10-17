# 🕐 Deploy - Sincronização Horária Automática (Cronjob Supabase)

## 📋 Resumo da Solução

Sistema de sincronização automática que roda **no Supabase via cronjob** às **:45 de cada hora** (00:45, 01:45, 02:45, etc), sincronizando oportunidades dos funis 6 (COMERCIAL) e 14 (RECOMPRA) do SprintHub para o Supabase.

### ✅ O que foi implementado:

1. **Edge Function** (`sync-hourly-cron`) que executa a sincronização
2. **Cronjob no Supabase** (pg_cron) que dispara a função às :45 de cada hora
3. **Tabela de controle** (`api.sync_control`) para registrar execuções
4. **View** (`api.sync_status`) para exibir última e próxima sincronização
5. **Interface atualizada** no TopMenuBar que busca dados dinamicamente do banco

---

## 🚀 Passo a Passo do Deploy

### **1️⃣ Deploy da Edge Function**

#### No terminal do seu projeto:

```bash
# Fazer login no Supabase CLI
supabase login

# Linkar com seu projeto
supabase link --project-ref SEU_PROJECT_REF

# Deploy da Edge Function
supabase functions deploy sync-hourly-cron
```

#### Verificar se o deploy foi bem-sucedido:
```bash
# Listar funções deployadas
supabase functions list
```

---

### **2️⃣ Configurar Secrets no Supabase**

As Edge Functions precisam das seguintes secrets (variáveis de ambiente):

#### Via Supabase Dashboard:
1. Acesse: **Settings** → **Edge Functions** → **Secrets**
2. Adicione as seguintes secrets:

| Secret Name | Valor | Descrição |
|------------|-------|-----------|
| `VITE_SPRINTHUB_BASE_URL` | `sprinthub-api-master.sprinthub.app` | URL base da API do SprintHub |
| `VITE_SPRINTHUB_API_TOKEN` | `9ad36c85-5858-4960-9935-e73c3698dd0c` | Token de API do SprintHub |
| `VITE_SPRINTHUB_INSTANCE` | `oficialmed` | Nome da instância |
| `SB_URL` | `https://seu-projeto.supabase.co` | URL do seu projeto Supabase |
| `SERVICE_KEY` | `sua-service-role-key` | Service Role Key do Supabase |

#### Ou via CLI:

```bash
supabase secrets set VITE_SPRINTHUB_BASE_URL=sprinthub-api-master.sprinthub.app
supabase secrets set VITE_SPRINTHUB_API_TOKEN=9ad36c85-5858-4960-9935-e73c3698dd0c
supabase secrets set VITE_SPRINTHUB_INSTANCE=oficialmed
supabase secrets set SB_URL=https://seu-projeto.supabase.co
supabase secrets set SERVICE_KEY=sua-service-role-key
```

---

### **3️⃣ Criar Tabelas e Cronjob no Supabase**

#### No SQL Editor do Supabase Dashboard:

1. Acesse: **SQL Editor** → **New Query**
2. Copie e cole o conteúdo do arquivo: `src/documentacao/setup_sync_hourly_cron.sql`
3. Execute o script completo

**⚠️ IMPORTANTE:** O script criará:
- Tabela `api.sync_control` (controle de execuções)
- View `api.sync_status` (última e próxima sincronização)
- Cronjob `sync-hourly-cron` (executa às :45 de cada hora)
- Permissões necessárias

---

### **4️⃣ Configurar Extensões Necessárias**

O cronjob usa as extensões `pg_cron` e `http`. Certifique-se de que estão habilitadas:

#### Via Dashboard:
1. Acesse: **Database** → **Extensions**
2. Habilite:
   - ✅ `pg_cron` (para agendar jobs)
   - ✅ `http` (para fazer requisições HTTP)

#### Ou via SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;
```

---

### **5️⃣ Configurar Variáveis de Ambiente no PostgreSQL**

Para o cronjob funcionar, configure as variáveis:

```sql
-- Configurar URL do Supabase
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://seu-projeto.supabase.co';

-- Configurar Service Role Key
ALTER DATABASE postgres SET app.settings.service_role_key = 'sua-service-role-key';
```

**📝 Nota:** Substitua pelos valores reais do seu projeto.

---

## 🧪 Testar a Configuração

### **1. Testar a Edge Function manualmente**

```bash
# Via curl
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/sync-hourly-cron' \
  -H 'Authorization: Bearer SUA_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

Ou via SQL Editor:

```sql
-- Chamar a função diretamente
SELECT net.http_post(
  url := 'https://seu-projeto.supabase.co/functions/v1/sync-hourly-cron',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || 'SUA_SERVICE_ROLE_KEY'
  ),
  body := '{}'::jsonb
);
```

### **2. Verificar se o cronjob foi criado**

```sql
-- Ver cronjobs ativos
SELECT * FROM cron.job WHERE jobname = 'sync-hourly-cron';
```

Resultado esperado:
```
jobid | schedule  | command | nodename | nodeport | database | username | active | jobname
------+-----------+---------+----------+----------+----------+----------+--------+------------------
   1  | 45 * * * *| ...     | ...      | ...      | postgres | ...      | t      | sync-hourly-cron
```

### **3. Ver últimas execuções do cronjob**

```sql
SELECT 
  jobname,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details 
WHERE jobname = 'sync-hourly-cron'
ORDER BY start_time DESC
LIMIT 10;
```

### **4. Ver registros de sincronização**

```sql
-- Ver últimas sincronizações
SELECT 
  started_at,
  completed_at,
  status,
  total_processed,
  total_inserted,
  total_updated,
  execution_time_seconds
FROM api.sync_control
WHERE job_name = 'sync_hourly_cron'
ORDER BY started_at DESC
LIMIT 10;
```

### **5. Ver status atual (última e próxima)**

```sql
-- Ver status atual
SELECT * FROM api.sync_status;
```

Resultado esperado:
```
ultima_sincronizacao | proxima_sincronizacao | status  | total_processed
---------------------+-----------------------+---------+----------------
2025-10-16 14:45:00  | 2025-10-16 15:45:00   | success | 125
```

---

## 📊 Monitoramento

### **Dashboard de Estatísticas (últimas 24h)**

```sql
SELECT 
  DATE_TRUNC('hour', started_at) AS hora,
  COUNT(*) AS total_execucoes,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS sucessos,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS erros,
  AVG(execution_time_seconds) AS tempo_medio_segundos,
  SUM(total_processed) AS total_processados,
  SUM(total_inserted) AS total_inseridos,
  SUM(total_updated) AS total_atualizados
FROM api.sync_control
WHERE job_name = 'sync_hourly_cron'
  AND started_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', started_at)
ORDER BY hora DESC;
```

### **Ver logs da Edge Function**

No Dashboard do Supabase:
1. Acesse: **Edge Functions** → `sync-hourly-cron`
2. Clique em **Logs**
3. Veja execuções em tempo real

---

## 🛠️ Manutenção

### **Pausar o cronjob temporariamente**

```sql
-- Desabilitar
SELECT cron.unschedule('sync-hourly-cron');
```

### **Reativar o cronjob**

```sql
-- Reabilitar (executar o SELECT cron.schedule do setup_sync_hourly_cron.sql)
SELECT cron.schedule(
  'sync-hourly-cron',
  '45 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-hourly-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### **Limpar registros antigos**

```sql
-- Manter apenas últimos 30 dias
DELETE FROM api.sync_control 
WHERE started_at < NOW() - INTERVAL '30 days'
  AND job_name = 'sync_hourly_cron';
```

---

## 🔧 Interface (Frontend)

### **O que mudou no TopMenuBar:**

✅ **Removido:**
- Alertas "Parando..." e "Executando..."
- Horários fixos (8:00, 9:50, 11:50, etc)
- Controle manual de start/stop do serviço

✅ **Adicionado:**
- Busca dinâmica da `api.sync_status` a cada 30 segundos
- Display sempre visível de "Última sincronização"
- Display sempre visível de "Próxima sincronização"
- Botão informativo "🕐 AUTO SYNC ATIVO"

### **Como funciona agora:**

1. O cronjob roda automaticamente no Supabase às :45 de cada hora
2. Quando executa, salva na tabela `api.sync_control`
3. A view `api.sync_status` calcula última e próxima execução
4. O frontend busca esses dados a cada 30 segundos
5. A interface atualiza automaticamente

---

## 📁 Arquivos Criados/Modificados

### **Novos arquivos:**
```
supabase/functions/sync-hourly-cron/index.ts     # Edge Function
src/documentacao/setup_sync_hourly_cron.sql      # SQL setup completo
src/documentacao/DEPLOY_SYNC_HOURLY_CRON.md      # Esta documentação
```

### **Modificados:**
```
src/components/TopMenuBar.jsx                     # Interface atualizada
```

---

## ⏰ Horários de Execução

O cronjob executa automaticamente às **:45 de cada hora**, 24/7:

```
00:45  ✓
01:45  ✓
02:45  ✓
...
22:45  ✓
23:45  ✓
```

**Período sincronizado:** Últimas 48 horas de ambos os funis (6 e 14)

---

## ❓ Troubleshooting

### **Problema: Cronjob não está executando**

1. Verificar se foi criado:
```sql
SELECT * FROM cron.job WHERE jobname = 'sync-hourly-cron';
```

2. Ver últimas execuções:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'sync-hourly-cron'
ORDER BY start_time DESC LIMIT 5;
```

3. Verificar logs:
- Dashboard → Edge Functions → sync-hourly-cron → Logs

### **Problema: Edge Function retorna erro 500**

1. Verificar secrets configuradas:
```bash
supabase secrets list
```

2. Testar manualmente a função
3. Ver logs detalhados no Dashboard

### **Problema: Dados não atualizam na interface**

1. Verificar se a view existe:
```sql
SELECT * FROM api.sync_status;
```

2. Verificar permissões:
```sql
-- Deve retornar linhas
SELECT * FROM pg_tables 
WHERE schemaname = 'api' AND tablename = 'sync_control';

SELECT * FROM pg_views 
WHERE schemaname = 'api' AND viewname = 'sync_status';
```

3. Limpar cache do navegador (F5 ou Ctrl+Shift+R)

---

## ✅ Checklist de Verificação Final

- [ ] Edge Function deployada (`supabase functions list`)
- [ ] Secrets configuradas (Dashboard → Settings → Edge Functions → Secrets)
- [ ] Extensões habilitadas (`pg_cron` e `http`)
- [ ] Tabela `api.sync_control` criada
- [ ] View `api.sync_status` criada
- [ ] Cronjob criado (`SELECT * FROM cron.job`)
- [ ] Variáveis PostgreSQL configuradas (`app.settings.*`)
- [ ] Teste manual da Edge Function executado
- [ ] Interface mostra "Última sincronização" e "Próxima sincronização"
- [ ] Primeira execução automática às :45 verificada

---

## 🎯 Próximos Passos (Opcional)

1. **Alertas por email/Slack** quando houver erro na sincronização
2. **Dashboard de estatísticas** em tempo real
3. **Logs mais detalhados** por funil e etapa
4. **Retry automático** em caso de falha
5. **Sincronização diferencial** (apenas registros modificados)

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verificar logs no Dashboard do Supabase
2. Consultar tabela `api.sync_control` para ver histórico
3. Executar queries de diagnóstico deste documento
4. Revisar secrets e configurações

---

**✅ Sistema pronto para uso! O cronjob rodará automaticamente 24/7.** 🚀


