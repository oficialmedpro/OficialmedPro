# Configuração do Backend Proxy para Google Ads API

## Problema
A biblioteca `google-ads-api` não é compatível com o ambiente do navegador (browser) porque usa módulos Node.js como `stream` que não estão disponíveis no browser.

## Solução
Criar um backend proxy em Node.js que processa as requisições da API do Google Ads e expõe endpoints HTTP que o frontend pode consumir via fetch.

## Estrutura do Backend Proxy

### 1. Servidor Express (porta 3001)
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const { GoogleAdsApi } = require('google-ads-api');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoints da API
app.post('/api/google-ads/test-connection', async (req, res) => {
  // Implementar teste de conexão
});

app.post('/api/google-ads/customer-info', async (req, res) => {
  // Implementar busca de informações da conta
});

app.post('/api/google-ads/campaigns', async (req, res) => {
  // Implementar busca de campanhas
});

app.post('/api/google-ads/campaigns-with-metrics', async (req, res) => {
  // Implementar busca de campanhas com métricas
});

app.post('/api/google-ads/stats', async (req, res) => {
  // Implementar cálculo de estatísticas
});

app.post('/api/google-ads/ad-groups', async (req, res) => {
  // Implementar busca de grupos de anúncios
});

app.post('/api/google-ads/ads', async (req, res) => {
  // Implementar busca de anúncios
});

app.listen(3001, () => {
  console.log('Backend proxy rodando na porta 3001');
});
```

### 2. Endpoints Necessários

#### POST /api/google-ads/test-connection
- **Body**: `{ unidadeId, customerId }`
- **Response**: `{ success: true, data: { customerName, customerId, campaignsCount } }`

#### POST /api/google-ads/customer-info
- **Body**: `{ unidadeId, customerId }`
- **Response**: `{ success: true, data: { id, name, currency, timezone, isManager, isTestAccount } }`

#### POST /api/google-ads/campaigns
- **Body**: `{ unidadeId, customerId }`
- **Response**: `{ success: true, data: [campaigns] }`

#### POST /api/google-ads/campaigns-with-metrics
- **Body**: `{ unidadeId, customerId, dateRange }`
- **Response**: `{ success: true, data: [campaignsWithMetrics] }`

#### POST /api/google-ads/stats
- **Body**: `{ unidadeId, customerId, dateRange, searchTerm }`
- **Response**: `{ success: true, data: { totalLeads, gastoTotal, totalImpressions, totalClicks, ctr, ... } }`

#### POST /api/google-ads/ad-groups
- **Body**: `{ unidadeId, customerId, campaignId }`
- **Response**: `{ success: true, data: [adGroups] }`

#### POST /api/google-ads/ads
- **Body**: `{ unidadeId, customerId, adGroupId }`
- **Response**: `{ success: true, data: [ads] }`

### 3. Configuração do Frontend
O frontend já está configurado para usar o proxy via `googleAdsApiProxy.js` que faz requisições para `http://localhost:3001/api/google-ads/*`.

### 4. Instalação e Execução

#### Backend (Node.js)
```bash
# Criar diretório do backend
mkdir google-ads-proxy
cd google-ads-proxy

# Inicializar projeto
npm init -y

# Instalar dependências
npm install express cors google-ads-api

# Criar server.js com o código acima
# Executar servidor
node server.js
```

#### Frontend (já configurado)
- O frontend já está configurado para usar o proxy
- Apenas iniciar o servidor de desenvolvimento do React

### 5. Vantagens da Solução
- ✅ Compatibilidade total com o browser
- ✅ Segurança: credenciais ficam no backend
- ✅ Performance: processamento no servidor
- ✅ Flexibilidade: fácil de manter e atualizar
- ✅ Escalabilidade: pode ser deployado separadamente

### 6. Próximos Passos
1. Implementar o backend proxy
2. Testar a integração
3. Configurar variáveis de ambiente
4. Deploy do backend em produção
