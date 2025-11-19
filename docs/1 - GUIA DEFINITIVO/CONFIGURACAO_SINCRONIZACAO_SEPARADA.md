# 🔄 Configuração de Sincronização Separada

## 📋 Visão Geral

A sincronização foi separada em endpoints independentes para permitir agendamento diferenciado:

- **Oportunidades**: Rápida, pode rodar no horário padrão
- **Leads + Segmentos**: Demorada, deve rodar de madrugada

## 🚀 Endpoints Disponíveis

### 1. Sincronização Completa (Compatibilidade)
```bash
GET /sync/all
# Sincroniza: Oportunidades + Leads + Segmentos
```

### 2. Apenas Oportunidades (Horário Padrão)
```bash
GET /sync/oportunidades
# Sincroniza: Apenas Oportunidades
# Uso: Horário comercial (ex: 08:00, 12:00, 16:00)
```

### 3. Apenas Leads
```bash
GET /sync/leads
# Sincroniza: Apenas Leads
```

### 4. Apenas Segmentos
```bash
GET /sync/segmentos
# Sincroniza: Apenas Segmentos
```

### 5. Leads + Segmentos (Madrugada)
```bash
GET /sync/leads-segmentos
# Sincroniza: Leads + Segmentos
# Uso: Madrugada (ex: 02:00, 03:00)
```

## ⏰ Configuração Recomendada

### Opção 1: Supabase Cron Jobs

#### Oportunidades (Horário Padrão)
```sql
-- Executar a cada 2 horas durante horário comercial
SELECT cron.schedule(
  'sync-oportunidades',
  '0 */2 * * *',  -- A cada 2 horas
  $$
  SELECT net.http_post(
    url := 'https://sincrocrm.oficialmed.com.br/sync/oportunidades?trigger=cron_oportunidades',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);
```

#### Leads + Segmentos (Madrugada)
```sql
-- Executar de madrugada (02:00)
SELECT cron.schedule(
  'sync-leads-segmentos',
  '0 2 * * *',  -- Todo dia às 02:00
  $$
  SELECT net.http_post(
    url := 'https://sincrocrm.oficialmed.com.br/sync/leads-segmentos?trigger=cron_madrugada',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);
```

### Opção 2: EasyPanel Cron Jobs

No EasyPanel, configure dois cron jobs:

1. **Oportunidades** (Horário Padrão):
   - Schedule: `0 */2 * * *` (a cada 2 horas)
   - Command: `curl https://sincrocrm.oficialmed.com.br/sync/oportunidades?trigger=cron_oportunidades`

2. **Leads + Segmentos** (Madrugada):
   - Schedule: `0 2 * * *` (todo dia às 02:00)
   - Command: `curl https://sincrocrm.oficialmed.com.br/sync/leads-segmentos?trigger=cron_madrugada`

## 📊 Exemplo de Uso Manual

### Testar Sincronização de Oportunidades
```bash
curl https://sincrocrm.oficialmed.com.br/sync/oportunidades?trigger=teste
```

### Testar Sincronização de Leads + Segmentos
```bash
curl https://sincrocrm.oficialmed.com.br/sync/leads-segmentos?trigger=teste
```

## 🔍 Verificar Status

```bash
# Status geral
curl https://sincrocrm.oficialmed.com.br/health

# Versão da API
curl https://sincrocrm.oficialmed.com.br/version
```

## ⚙️ Parâmetros de Query (Opcional)

Todos os endpoints aceitam parâmetro `trigger` para identificação:

```bash
GET /sync/oportunidades?trigger=cron_manha
GET /sync/leads-segmentos?trigger=cron_madrugada
```

## 📝 Notas

- A sincronização completa (`/sync/all`) ainda funciona para compatibilidade
- Cada endpoint verifica se já há uma sincronização em andamento
- Os logs mostram claramente quais recursos estão sendo sincronizados
- A versão da API é 3.0.3+

## 🎯 Benefícios

1. **Performance**: Oportunidades sincronizam rapidamente no horário comercial
2. **Eficiência**: Leads e segmentos rodam de madrugada sem impactar o sistema
3. **Flexibilidade**: Pode agendar cada tipo de sincronização independentemente
4. **Monitoramento**: Logs separados facilitam identificação de problemas

