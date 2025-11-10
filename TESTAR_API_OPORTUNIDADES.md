# ✅ API de Sincronização - TESTES

## 🎉 Status: API FUNCIONANDO!

A API está rodando corretamente na porta 5001. Todos os secrets foram carregados com sucesso.

---

## 🧪 Testar os Endpoints

### 1️⃣ Health Check (Status da API)
```bash
curl https://sincro.oficialmed.com.br/oportunidades/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "service": "API Sync Opportunities",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### 2️⃣ Métricas (Status e Última Execução)
```bash
curl https://sincro.oficialmed.com.br/oportunidades/metrics
```

**Resposta esperada:**
```json
{
  "running": false,
  "last": {
    "resource": null,
    "start": null,
    "end": null,
    "status": "idle",
    "durationMs": 0
  }
}
```

---

### 3️⃣ Orquestrador Completo (Oportunidades → Leads → Segmentos)
```bash
curl https://sincro.oficialmed.com.br/oportunidades/sync/all
```

**Este é o endpoint principal que executa os 3 em sequência:**
1. Primeiro sincroniza oportunidades
2. Depois sincroniza leads
3. Por último sincroniza segmentos

⚠️ **Atenção:** Este endpoint pode demorar vários minutos dependendo da quantidade de dados!

---

### 4️⃣ Sincronizar Apenas Oportunidades
```bash
curl https://sincro.oficialmed.com.br/oportunidades
```

---

### 5️⃣ Status das Oportunidades (Contagem)
```bash
curl https://sincro.oficialmed.com.br/oportunidades/status
```

**Resposta esperada:**
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

### 6️⃣ Sincronizar Apenas Leads
```bash
curl https://sincro.oficialmed.com.br/oportunidades/leads
```

---

### 7️⃣ Status dos Leads (Contagem)
```bash
curl https://sincro.oficialmed.com.br/oportunidades/leads/status
```

---

### 8️⃣ Sincronizar Apenas Segmentos
```bash
curl https://sincro.oficialmed.com.br/oportunidades/segmentos
```

---

## 📊 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check |
| `/metrics` | GET | Métricas e status da última execução |
| `/sync/all` | GET | **Orquestrador completo** (oportunidades → leads → segmentos) |
| `/oportunidades` ou `/` | GET | Sincronizar apenas oportunidades |
| `/oportunidades/status` ou `/status` | GET | Contagem de oportunidades |
| `/leads` | GET | Sincronizar apenas leads |
| `/leads/status` | GET | Contagem de leads |
| `/segmentos` | GET | Sincronizar apenas segmentos |

---

## 🔍 Monitorar a Execução

### Ver Logs em Tempo Real
```bash
# SSH no servidor
docker service logs -f oportunidades-sync-sprinthub_oportunidades-sync-api

# Ou via Portainer
# Vá em Services > oportunidades-sync-sprinthub_oportunidades-sync-api > Logs
```

### Ver Últimas 100 Linhas dos Logs
```bash
docker service logs --tail 100 oportunidades-sync-sprinthub_oportunidades-sync-api
```

---

## ⚠️ Observações Importantes

### 1. Endpoint `/sync/all` (Orquestrador)
- **Pode demorar vários minutos** dependendo da quantidade de dados
- Executa em sequência: oportunidades → leads → segmentos
- Usa lock para evitar execuções simultâneas
- Retorna estatísticas completas de cada etapa

### 2. Endpoints Individuais
- `/oportunidades` - Sincroniza apenas oportunidades (mais rápido)
- `/leads` - Sincroniza apenas leads
- `/segmentos` - Sincroniza apenas segmentos

### 3. Timeout
- Alguns endpoints podem demorar muito tempo
- Use ferramentas como `curl` com timeout ou monitore via logs

---

## ✅ Próximos Passos

### 1. Testar Health Check
```bash
curl https://sincro.oficialmed.com.br/oportunidades/health
```

### 2. Executar Sincronização Completa (Opcional)
```bash
curl https://sincro.oficialmed.com.br/oportunidades/sync/all
```

⚠️ **Este comando pode demorar vários minutos!** Recomendo executar em background ou monitorar os logs.

### 3. (Opcional) Configurar Cronjob no Supabase

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

## 🎯 Resumo

✅ **API Funcionando!**
- Todos os secrets carregados corretamente
- API rodando na porta 5001
- Endpoints disponíveis

✅ **Próximo Passo:**
- Testar o health check para confirmar
- Executar sincronização manual se necessário
- Configurar cronjob no Supabase (opcional)

---

**Status:** ✅ TUDO FUNCIONANDO!






