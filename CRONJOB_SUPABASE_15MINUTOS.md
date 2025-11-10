# ⏰ Cronjob Supabase - Sincronização a cada 15 minutos

## ✅ Proteção Contra Execuções Simultâneas

**Boa notícia!** O código já tem proteção implementada. Se o cronjob acionar enquanto uma execução ainda está rodando, a API retornará uma mensagem informando que já está em execução.

### Como Funciona:

1. **Lock (Trava):**
   ```javascript
   let isSyncRunning = false;  // Variável de controle
   ```

2. **Verificação no Endpoint `/sync/all`:**
   ```javascript
   if (isSyncRunning) return res.json({ success: true, message: 'Execução já em andamento' });
   ```

3. **Liberação do Lock:**
   ```javascript
   finally {
       isSyncRunning = false;  // Sempre libera, mesmo em caso de erro
   }
   ```

### O Que Acontece se o Cronjob Acionar Durante Execução:

✅ **Cenário 1: Execução ainda rodando (dentro dos 15 minutos)**
- O cronjob chama a API
- A API detecta que `isSyncRunning = true`
- Retorna: `{ "success": true, "message": "Execução já em andamento" }`
- **Nenhuma nova execução é iniciada**
- **A execução atual continua normalmente**

✅ **Cenário 2: Execução terminou (fora dos 15 minutos)**
- O cronjob chama a API
- A API detecta que `isSyncRunning = false`
- Inicia nova execução normalmente
- Executa: oportunidades → leads → segmentos

---

## 🚀 Configurar Cronjob no Supabase

### Passo 1: Habilitar Extensão pg_cron

Execute no **Supabase SQL Editor**:

```sql
-- Habilitar extensão pg_cron (se ainda não habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

---

### Passo 2: Criar Função para Chamar a API

```sql
-- Função para chamar o orquestrador completo
CREATE OR REPLACE FUNCTION api.sync_sprinthub_completo()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status INTEGER;
  response_body TEXT;
  response_content JSONB;
BEGIN
  -- Chamar API de sincronização completa (/sync/all)
  SELECT 
    status, 
    content INTO response_status, response_body
  FROM http_get('https://sincro.oficialmed.com.br/oportunidades/sync/all');
  
  -- Tentar parsear como JSON
  BEGIN
    response_content := response_body::jsonb;
  EXCEPTION WHEN OTHERS THEN
    response_content := NULL;
  END;
  
  -- Log do resultado
  IF response_status = 200 THEN
    -- Verificar se está em execução ou completou
    IF response_content->>'message' = 'Execução já em andamento' THEN
      RAISE NOTICE '[%] Sincronização já em execução, ignorando nova chamada', 
        NOW()::timestamp;
    ELSE
      RAISE NOTICE '[%] Sincronização executada com sucesso - Status: %, Response: %', 
        NOW()::timestamp, response_status, response_body;
    END IF;
  ELSE
    RAISE WARNING '[%] Erro na sincronização - Status: %, Response: %', 
      NOW()::timestamp, response_status, response_body;
  END IF;
END;
$$;
```

---

### Passo 3: Agendar Execução a Cada 15 Minutos

```sql
-- Remover job anterior se existir (para recriar)
SELECT cron.unschedule('sync-sprinthub-completo-15min')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-sprinthub-completo-15min'
);

-- Agendar execução a cada 15 minutos
SELECT cron.schedule(
  'sync-sprinthub-completo-15min',           -- nome do job
  '*/15 * * * *',                             -- a cada 15 minutos (0, 15, 30, 45)
  'SELECT api.sync_sprinthub_completo();'     -- função a executar
);
```

---

### Passo 4: Verificar se o Job Foi Criado

```sql
-- Verificar se o job foi criado
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job 
WHERE jobname = 'sync-sprinthub-completo-15min';
```

**Resultado esperado:**
```
jobid: 12345
jobname: sync-sprinthub-completo-15min
schedule: */15 * * * *
command: SELECT api.sync_sprinthub_completo();
active: true
```

---

### Passo 5: (Opcional) Testar Execução Manual

```sql
-- Testar execução manual da função
SELECT api.sync_sprinthub_completo();
```

---

## 📊 Monitorar Execuções do Cronjob

### Ver Histórico de Execuções

```sql
-- Ver últimas 20 execuções do cronjob
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time,
  CASE 
    WHEN end_time IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (end_time - start_time))
    ELSE NULL 
  END as duration_seconds
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid 
  FROM cron.job 
  WHERE jobname = 'sync-sprinthub-completo-15min'
)
ORDER BY start_time DESC
LIMIT 20;
```

### Ver Execuções com Sucesso/Erro

```sql
-- Ver apenas execuções com erro
SELECT 
  start_time,
  status,
  return_message,
  command
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'sync-sprinthub-completo-15min'
)
AND status = 'failed'
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🔧 Gerenciar o Cronjob

### Desabilitar Temporariamente

```sql
-- Desabilitar job (mantém configurado, só não executa)
UPDATE cron.job 
SET active = false 
WHERE jobname = 'sync-sprinthub-completo-15min';

-- Verificar status
SELECT jobname, active FROM cron.job WHERE jobname = 'sync-sprinthub-completo-15min';
```

### Reabilitar

```sql
-- Reabilitar job
UPDATE cron.job 
SET active = true 
WHERE jobname = 'sync-sprinthub-completo-15min';
```

### Remover Job

```sql
-- Remover job completamente
SELECT cron.unschedule('sync-sprinthub-completo-15min');
```

### Alterar Frequência (Ex: A cada 30 minutos)

```sql
-- Remover job antigo
SELECT cron.unschedule('sync-sprinthub-completo-15min');

-- Recriar com nova frequência
SELECT cron.schedule(
  'sync-sprinthub-completo-15min',
  '*/30 * * * *',  -- a cada 30 minutos
  'SELECT api.sync_sprinthub_completo();'
);
```

### Executar Manualmente

```sql
-- Executar o job manualmente (fora do schedule)
SELECT cron.run_job('sync-sprinthub-completo-15min');
```

---

## 📋 Cronograma de Execução

Com `*/15 * * * *` (a cada 15 minutos), o cronjob executará:

- **00:00** - Primeira execução do dia
- **00:15** - Segunda execução
- **00:30** - Terceira execução
- **00:45** - Quarta execução
- **01:00** - E assim por diante...

**Total:** 96 execuções por dia (4 execuções por hora × 24 horas)

---

## ⚠️ Observações Importantes

### 1. Proteção Contra Execuções Simultâneas

✅ **Está protegido!** Se uma execução ainda estiver rodando quando o cronjob acionar:
- A API retorna: `{ "success": true, "message": "Execução já em andamento" }`
- Nenhuma nova execução é iniciada
- A execução atual continua normalmente

### 2. Tempo de Execução

⚠️ **Atenção:** O endpoint `/sync/all` pode demorar vários minutos dependendo da quantidade de dados:
- Oportunidades: ~4-10 segundos (já vimos 4.25 segundos)
- Leads: pode demorar mais (depende da quantidade)
- Segmentos: normalmente rápido

**Total estimado:** 5-15 minutos dependendo do volume

### 3. Se Execução Demorar Mais de 15 Minutos

- O cronjob tentará executar novamente
- A API detectará que ainda está rodando
- Retornará "Execução já em andamento"
- **Nenhuma nova execução será iniciada até a atual terminar**

### 4. Logs

- Os logs da execução ficam no Supabase (tabela `cron.job_run_details`)
- Também pode verificar logs do container no Portainer

---

## ✅ Checklist de Configuração

- [ ] Extensão `pg_cron` habilitada
- [ ] Função `api.sync_sprinthub_completo()` criada
- [ ] Cronjob `sync-sprinthub-completo-15min` agendado
- [ ] Job verificado como ativo
- [ ] Teste manual executado
- [ ] Primeira execução automática verificada (aguardar 15 minutos)
- [ ] Logs de execução verificados

---

## 🧪 Testar Antes de Configurar

### 1. Testar a API Manualmente

```bash
# Testar o endpoint do orquestrador
curl https://sincro.oficialmed.com.br/oportunidades/sync/all
```

### 2. Testar a Função SQL

```sql
-- Testar a função antes de agendar
SELECT api.sync_sprinthub_completo();
```

### 3. Verificar Logs

Depois de alguns minutos, verificar se está funcionando:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-sprinthub-completo-15min')
ORDER BY start_time DESC
LIMIT 5;
```

---

**Data:** Novembro 2025  
**Versão:** 1.0.0  
**Autor:** OficialMed Tech Team







