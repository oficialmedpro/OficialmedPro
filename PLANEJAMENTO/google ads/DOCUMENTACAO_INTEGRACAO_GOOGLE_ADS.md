# 📊 Documentação Completa - Integração Google Ads API

## 🎯 Visão Geral

Esta documentação descreve o funcionamento completo da integração com a Google Ads API através do Supabase Edge Functions, incluindo todos os arquivos relacionados, configurações e fluxos de dados.

## 📁 Arquivos da Integração

### 🔧 Edge Function (Supabase)
**Arquivo Principal:** `supabase/functions/google-ads-api/index.ts`
- **Status:** ✅ Deployada e funcionando
- **URL:** `https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api`
- **Função:** Proxy para Google Ads API com autenticação e processamento de dados

### 🎨 Frontend
**Arquivo Principal:** `src/service/googlePatrocinadoService.js`
- **Função:** Serviço frontend que consome a Edge Function
- **Status:** ✅ Configurado e testado

### ⚙️ Configurações
**Arquivo:** `.env` (raiz do projeto)
- **Função:** Credenciais e configurações do Supabase e Google Ads

## 🔑 Credenciais Configuradas

### Supabase
```env
VITE_SUPABASE_URL=https://agdffspstbxeqhqtltvb.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SCHEMA=api
```

### Google Ads (Secrets do Supabase)
```env
VITE_GOOGLE_CUSTOMER_ID=8802039556
VITE_GOOGLE_LOGIN_CUSTOMER_ID=7396178858
VITE_GOOGLE_DEVELOPER_TOKEN=xw46jmZN-n_wf7uCsC8daA
VITE_GOOGLE_CLIENT_ID=415018341135-v3hjpjgqek6688r5eio8tl48229qbrrd.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=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
VITE_GOOGLE_REFRESH_TOKEN=1//04nNcHk0eHaq4CgYIARAAGAQSNwF-L9IrV-LGJvWjk8165av-tcK5Bgjx-u0KRJfh3E9Z11uU0jn-GOBAMWQgjdMMvazRBaHs90M
```

## 🚀 Endpoints Disponíveis

### 1. Teste de Conexão
```
GET /functions/v1/google-ads-api/test-connection
```
**Função:** Testa a conexão com a Google Ads API
**Resposta:** Informações da conta e status da conexão

### 2. Buscar Campanhas
```
GET /functions/v1/google-ads-api/campaigns?status=all&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```
**Parâmetros:**
- `status`: `active`, `all`, `paused`
- `startDate`: Data inicial (formato: YYYY-MM-DD)
- `endDate`: Data final (formato: YYYY-MM-DD)

### 3. Métricas de Campanha
```
GET /functions/v1/google-ads-api/campaign-metrics?campaign_id=ID&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

### 4. Estatísticas Gerais
```
GET /functions/v1/google-ads-api/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

### 5. Saldo da Conta
```
GET /functions/v1/google-ads-api/account-balance
```

### 6. Debug das Unidades
```
GET /functions/v1/google-ads-api/debug-unidades
```

## 📊 Fluxo de Dados

### 1. Frontend → Edge Function
```javascript
// Exemplo de chamada no frontend
const response = await fetch(
  'https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/campaigns?status=all&startDate=2025-09-24&endDate=2025-09-24',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${VITE_SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  }
);
```

### 2. Edge Function → Google Ads API
```typescript
// A Edge Function:
// 1. Busca credenciais dos Secrets do Supabase
// 2. Obtém access token do Google OAuth2
// 3. Faz query na Google Ads API
// 4. Processa e retorna os dados
```

### 3. Processamento de Dados
```typescript
// Mapeamento de status
const statusMap = {
  2: 'ENABLED',
  3: 'PAUSED', 
  4: 'REMOVED'
};

// Conversão de métricas
const metrics = {
  impressions: parseInt(row.metrics.impressions) || 0,
  clicks: parseInt(row.metrics.clicks) || 0,
  ctr: parseFloat(row.metrics.ctr) || 0,
  average_cpc: parseFloat(row.metrics.average_cpc) || 0,
  cost_micros: parseInt(row.metrics.cost_micros) || 0,
  conversions: parseFloat(row.metrics.conversions) || 0,
  conversions_value: parseFloat(row.metrics.conversions_value) || 0
};
```

## 🧪 Testes Realizados

### ✅ Teste de Conexão
```bash
# Comando de teste
curl -X GET "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/test-connection" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"
```
**Resultado:** ✅ Sucesso - Conta Apucarana conectada

### ✅ Teste de Campanhas (24/09/2025)
```bash
# Comando de teste
curl -X GET "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/campaigns?status=all&startDate=2025-09-24&endDate=2025-09-24" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"
```
**Resultado:** ✅ Sucesso - 25 campanhas retornadas

## 📈 Dados Retornados

### Estrutura de Resposta das Campanhas
```json
{
  "success": true,
  "data": [
    {
      "id": "20705713601",
      "name": "[Leads OMS - Ponta Grossa] - [26/03]",
      "status": "PAUSED",
      "type": "SEARCH",
      "metrics": {
        "impressions": 0,
        "clicks": 0,
        "ctr": 0,
        "average_cpc": 0,
        "cost_micros": 0,
        "conversions": 0,
        "conversions_value": 0
      }
    }
  ],
  "count": 25
}
```

### Campanhas Ativas Identificadas
1. **`[Leads Manipulação] - [Oficial] - [18/01/2024]`**
   - Status: `ENABLED`
   - Impressões: 1.914
   - Cliques: 115
   - CTR: 6.01%
   - Conversões: 9.5

## 🔧 Configurações Técnicas

### Google Ads API
- **Versão:** v21
- **Endpoint:** `googleAds:search`
- **Autenticação:** OAuth2 + Developer Token
- **Conta Gerenciadora:** 7396178858 (MCC)
- **Conta Cliente:** 8802039556 (Apucarana)

### Supabase Edge Function
- **Runtime:** Deno
- **Timeout:** Padrão (60s)
- **Região:** Padrão
- **Cache:** 5 minutos para credenciais

### Fuso Horário
- **Padrão:** America/Sao_Paulo (GMT-3)
- **Conversão:** Automática nas consultas

## 🚀 Como Fazer Deploy

### 1. Preparar o Código
```bash
# Verificar se há apenas o arquivo index.ts correto
ls supabase/functions/google-ads-api/
# Deve mostrar apenas: index.ts
```

### 2. Fazer Deploy
```bash
cd supabase
npx supabase functions deploy google-ads-api --project-ref agdffspstbxeqhqtltvb
```

### 3. Verificar Deploy
```bash
# Listar functions deployadas
npx supabase functions list --project-ref agdffspstbxeqhqtltvb
```

## 🔍 Troubleshooting

### Erro 401 - Invalid JWT
- **Causa:** Service Role Key incorreto ou expirado
- **Solução:** Verificar `.env` e secrets do Supabase

### Erro 404 - Function not found
- **Causa:** Deploy não realizado ou nome incorreto
- **Solução:** Fazer deploy da function

### Erro 500 - Internal Server Error
- **Causa:** Credenciais Google Ads incorretas
- **Solução:** Verificar secrets do Supabase

### Sem dados retornados
- **Causa:** Período sem atividade ou campanhas pausadas
- **Solução:** Verificar datas e status das campanhas

## 📝 Logs e Monitoramento

### Logs da Edge Function
- **Local:** Supabase Dashboard > Functions > google-ads-api > Logs
- **URL:** https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb/functions

### Logs do Frontend
- **Local:** Console do navegador
- **Arquivo:** `src/service/googlePatrocinadoService.js`

## 🔄 Próximos Passos

1. **Implementar cache no frontend** para otimizar performance
2. **Adicionar tratamento de erro** mais robusto
3. **Implementar métricas em tempo real** com WebSockets
4. **Adicionar suporte a múltiplas contas** Google Ads
5. **Implementar dashboard** de performance em tempo real

## 📞 Suporte

- **Documentação Google Ads API:** https://developers.google.com/google-ads/api
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Logs da Function:** https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb/functions

---

**Última Atualização:** 24/09/2025  
**Status:** ✅ Funcionando  
**Versão:** 1.0.0
