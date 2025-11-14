# 🕐 Sincronização Automática via Supabase Cron

## 🎯 Visão Geral

Sistema de sincronização automática de leads por segmento usando **Supabase Edge Functions** + **pg_cron**, eliminando a dependência do Portainer e simplificando a infraestrutura.

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   pg_cron       │───▶│  Edge Function   │───▶│  SprintHub API  │
│ (Agendamento)   │    │ (Lógica Sync)    │    │ (Dados Leads)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         └─────────────▶│   Supabase DB    │◀────────────┘
                        │ (Leads + Logs)   │
                        └──────────────────┘
```

## 🚀 Vantagens

### ✅ **Simplicidade**
- Tudo centralizado no Supabase
- Sem dependência de infraestrutura externa
- Configuração em SQL simples

### ✅ **Confiabilidade**
- Execução garantida pelo PostgreSQL
- Retry automático em caso de falha
- Logs integrados

### ✅ **Economia**
- Sem custos de servidor adicional
- Usa recursos já disponíveis do Supabase
- Escalabilidade automática

### ✅ **Monitoramento**
- Logs detalhados de execução
- Métricas de performance
- Alertas de erro integrados

## 📁 Arquivos do Sistema

```
src/sincronizacao/segmento/
├── supabase-edge-function-sync.js    # Edge Function (lógica de sync)
├── setup-cron-sync.sql              # Configuração do pg_cron
├── README-supabase-cron.md          # Esta documentação
└── sync-and-enrich-segment.js       # Script local (backup)
```

## 🔧 Configuração Passo a Passo

### 1. **Deploy da Edge Function**

```bash
# No diretório do projeto Supabase
supabase functions deploy sync-segment-leads
```

**Arquivo:** `supabase/functions/sync-segment-leads/index.ts`

```typescript
// Copie o conteúdo de supabase-edge-function-sync.js para este arquivo
```

### 2. **Configurar Variáveis de Ambiente**

No dashboard do Supabase → Settings → Edge Functions:

```
VITE_SPRINTHUB_BASE_URL=sprinthub-api-master.sprinthub.app
VITE_SPRINTHUB_API_TOKEN=seu_token_aqui
VITE_SPRINTHUB_INSTANCE=oficialmed
```

### 3. **Executar SQL de Configuração**

No SQL Editor do Supabase, execute:

```sql
-- Execute o conteúdo do arquivo setup-cron-sync.sql
```

### 4. **Configurar Service Role Key**

```sql
-- Substitua YOUR_SERVICE_ROLE_KEY pela chave real
ALTER SYSTEM SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
SELECT pg_reload_conf();
```

### 5. **Atualizar URL da Edge Function**

No arquivo `setup-cron-sync.sql`, substitua:

```sql
-- Substitua YOUR_PROJECT_REF pela referência real do seu projeto
'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-segment-leads'
```

## ⏰ Agendamento

### **Execução Diária**
```sql
-- Todos os dias às 06:00
'0 6 * * *'
```

### **Execução Personalizada**
```sql
-- A cada 6 horas
'0 */6 * * *'

-- Segunda a sexta às 08:00
'0 8 * * 1-5'

-- Apenas nos fins de semana às 10:00
'0 10 * * 0,6'
```

## 📊 Monitoramento

### **Ver Jobs Ativos**
```sql
SELECT * FROM cron.job;
```

### **Ver Execuções Recentes**
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### **Ver Logs de Sincronização**
```sql
SELECT * FROM public.sync_segments_logs
ORDER BY execution_time DESC
LIMIT 20;
```

### **Status dos Segmentos**
```sql
SELECT * FROM public.sync_segments_control;
```

## 🎛️ Controle de Segmentos

### **Adicionar Novo Segmento**
```sql
INSERT INTO public.sync_segments_control (segment_id, next_execution)
VALUES (456, NOW() + INTERVAL '1 day');
```

### **Pausar Segmento**
```sql
UPDATE public.sync_segments_control 
SET status = 'paused' 
WHERE segment_id = 123;
```

### **Reativar Segmento**
```sql
UPDATE public.sync_segments_control 
SET status = 'active' 
WHERE segment_id = 123;
```

### **Executar Manualmente**
```sql
-- Executar agora (para teste)
SELECT sync_segment_leads_via_edge_function();
```

## 🔍 Troubleshooting

### **Edge Function não responde**
1. Verificar se a função foi deployada
2. Verificar variáveis de ambiente
3. Verificar logs da Edge Function no dashboard

### **pg_cron não executa**
1. Verificar se a extensão está habilitada
2. Verificar se o job está agendado
3. Verificar logs do pg_cron

### **Erro de autenticação**
1. Verificar se a service role key está configurada
2. Verificar permissões da chave
3. Verificar URL da Edge Function

### **Rate limit da API**
1. Ajustar delay entre requisições na Edge Function
2. Reduzir frequência de execução
3. Implementar retry com backoff

## 📈 Métricas e Alertas

### **Métricas Importantes**
- Taxa de sucesso da sincronização
- Tempo de execução
- Número de leads processados
- Frequência de erros

### **Alertas Recomendados**
- Falha na execução do cron
- Taxa de sucesso < 95%
- Tempo de execução > 10 minutos
- Mais de 5 erros consecutivos

## 🔄 Backup e Recuperação

### **Script Local de Backup**
O arquivo `sync-and-enrich-segment.js` serve como backup caso a Edge Function falhe:

```bash
# Execução manual de emergência
node src/sincronizacao/segmento/sync-and-enrich-segment.js 123
```

### **Exportar Configuração**
```sql
-- Backup da configuração de cron
SELECT * FROM cron.job WHERE jobname = 'sync-segments-daily';

-- Backup da configuração de segmentos
SELECT * FROM public.sync_segments_control;
```

## 🚀 Próximos Passos

1. **Monitoramento Avançado**: Implementar dashboard de métricas
2. **Alertas Inteligentes**: Integração com Slack/Email
3. **Sincronização Incremental**: Apenas leads modificados
4. **Múltiplos Segmentos**: Suporte a vários segmentos simultâneos
5. **Webhook**: Notificação em tempo real de novos leads

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs do Supabase
2. Consultar documentação do pg_cron
3. Verificar status da Edge Function
4. Testar com execução manual

---

**🎯 Sistema completo, confiável e independente do Portainer!** 🚀


























