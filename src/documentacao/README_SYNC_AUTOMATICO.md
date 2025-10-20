# 🕐 Sistema de Sincronização Automática - Resumo

## 📌 O que é?

Sistema de sincronização automática que roda **no Supabase** via cronjob, sincronizando oportunidades dos funis 6 (COMERCIAL) e 14 (RECOMPRA) do SprintHub a cada hora.

## ⏰ Quando executa?

**Às :45 de cada hora** (00:45, 01:45, 02:45, 03:45... 23:45)

## 🎯 O que sincroniza?

- **Funil 6** (COMERCIAL) - Últimas 48 horas
- **Funil 14** (RECOMPRA) - Últimas 48 horas
- Insere novas oportunidades
- Atualiza oportunidades existentes

## 📂 Arquivos Principais

### **1. Edge Function**
```
supabase/functions/sync-hourly-cron/index.ts
```
A função que executa a sincronização.

### **2. Setup SQL**
```
src/documentacao/setup_sync_hourly_cron.sql
```
Cria tabelas, views, cronjob e permissões.

### **3. Documentação Completa**
```
src/documentacao/DEPLOY_SYNC_HOURLY_CRON.md
```
Guia completo de deploy e configuração.

### **4. Interface**
```
src/components/TopMenuBar.jsx
```
Interface que mostra última e próxima sincronização.

## 🗄️ Estrutura do Banco

### **Tabela de Controle**
```sql
api.sync_control
```
Registra cada execução com estatísticas:
- `started_at` - Quando iniciou
- `completed_at` - Quando terminou
- `status` - success | error
- `total_processed` - Total processado
- `total_inserted` - Total inserido
- `total_updated` - Total atualizado
- `total_errors` - Total de erros
- `execution_time_seconds` - Tempo de execução

### **View de Status**
```sql
api.sync_status
```
Mostra última execução e calcula próxima:
- `ultima_sincronizacao` - Timestamp da última sync
- `proxima_sincronizacao` - Timestamp da próxima sync
- `status` - Status da última execução
- `total_processed` - Registros processados
- `details` - JSON com detalhes

## 🚀 Deploy Rápido

### 1. Deploy da Edge Function
```bash
supabase functions deploy sync-hourly-cron
```

### 2. Configurar Secrets
No Dashboard: **Settings → Edge Functions → Secrets**

Adicionar:
- `VITE_SPRINTHUB_BASE_URL`
- `VITE_SPRINTHUB_API_TOKEN`
- `VITE_SPRINTHUB_INSTANCE`
- `SB_URL`
- `SERVICE_KEY`

### 3. Executar SQL Setup
No **SQL Editor**, executar:
```
src/documentacao/setup_sync_hourly_cron.sql
```

### 4. Configurar Variáveis PostgreSQL
```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://seu-projeto.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'sua-service-role-key';
```

## ✅ Verificar se está funcionando

### Ver cronjob
```sql
SELECT * FROM cron.job WHERE jobname = 'sync-hourly-cron';
```

### Ver últimas execuções
```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'sync-hourly-cron'
ORDER BY start_time DESC LIMIT 5;
```

### Ver sincronizações registradas
```sql
SELECT * FROM api.sync_control
WHERE job_name = 'sync_hourly_cron'
ORDER BY started_at DESC LIMIT 10;
```

### Ver status atual
```sql
SELECT * FROM api.sync_status;
```

## 🖥️ Interface

No **TopMenuBar**, você verá:
- ✅ **Última sincronização:** 16/10 às 14:45
- ✅ **Próxima sincronização:** 16/10 às 15:45
- ✅ Botão **🕐 AUTO SYNC ATIVO** (informativo)
- ✅ Botão **⚡ SYNC AGORA** (força sincronização manual)

Os dados atualizam automaticamente a cada 30 segundos.

## 📊 Monitoramento

### Ver últimas 24 horas
```sql
SELECT 
  DATE_TRUNC('hour', started_at) AS hora,
  COUNT(*) AS execucoes,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS sucessos,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS erros,
  AVG(execution_time_seconds) AS tempo_medio,
  SUM(total_processed) AS total_processados
FROM api.sync_control
WHERE job_name = 'sync_hourly_cron'
  AND started_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', started_at)
ORDER BY hora DESC;
```

## 🛑 Pausar/Reativar

### Pausar
```sql
SELECT cron.unschedule('sync-hourly-cron');
```

### Reativar
Execute o bloco `SELECT cron.schedule(...)` do arquivo `setup_sync_hourly_cron.sql`

## 🔧 Troubleshooting

### Cronjob não executa?
1. Verificar extensões habilitadas: `pg_cron` e `http`
2. Verificar variáveis configuradas
3. Ver logs em: Dashboard → Edge Functions → Logs

### Edge Function retorna erro?
1. Verificar secrets configuradas
2. Testar manualmente: `curl -X POST ...`
3. Ver logs detalhados

### Interface não atualiza?
1. Verificar se view `api.sync_status` existe
2. Verificar permissões
3. Limpar cache (Ctrl+Shift+R)

## 📝 Logs

### Ver logs da Edge Function
Dashboard → **Edge Functions** → `sync-hourly-cron` → **Logs**

### Ver logs do cronjob
```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'sync-hourly-cron'
ORDER BY start_time DESC;
```

## 🎯 Características

✅ **Automático** - Roda sozinho no Supabase  
✅ **Confiável** - Registra cada execução  
✅ **Monitorável** - Logs e estatísticas completas  
✅ **Escalável** - Processa em batch  
✅ **Resiliente** - Continua mesmo com erros parciais  
✅ **Transparente** - Interface mostra status em tempo real  

## 📞 Documentação Completa

Consulte: `src/documentacao/DEPLOY_SYNC_HOURLY_CRON.md`

---

**🚀 Sistema pronto! O cronjob está rodando 24/7 automaticamente no Supabase.**




