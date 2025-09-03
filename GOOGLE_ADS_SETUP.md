# Configuração da API do Google Ads

Este guia te ajudará a configurar a integração com a API do Google Ads no seu projeto.

## 📋 Pré-requisitos

1. **Conta do Google Ads** ativa
2. **Google Cloud Console** com projeto configurado
3. **Developer Token** do Google Ads aprovado

## 🔧 Passo a Passo

### 1. Configurar o Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Ads API**:
   - Vá em "APIs & Services" > "Library"
   - Procure por "Google Ads API"
   - Clique em "Enable"

### 2. Criar Credenciais OAuth2

1. No Google Cloud Console, vá em "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth client ID"
3. Selecione "Web application"
4. Adicione as URIs de redirecionamento:
   - `http://localhost:3000` (para desenvolvimento)
   - `https://oauth2.googleapis.com/oauth2/v4/token` (para refresh token)
5. Salve o **Client ID** e **Client Secret**

### 3. Obter o Developer Token

1. Acesse [Google Ads](https://ads.google.com/)
2. Vá em "Tools & Settings" > "API Center"
3. Solicite um **Developer Token**
4. Aguarde a aprovação (pode levar alguns dias)

### 4. Gerar o Refresh Token

1. Acesse o [OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Clique no ícone de engrenagem (Settings)
3. Marque "Use your own OAuth credentials"
4. Insira seu **Client ID** e **Client Secret**
5. No lado esquerdo, encontre "Google Ads API v14"
6. Selecione `https://www.googleapis.com/auth/adwords`
7. Clique em "Authorize APIs"
8. Faça login com sua conta Google
9. Clique em "Exchange authorization code for tokens"
10. Copie o **Refresh Token**

### 5. Encontrar o Customer ID

1. No Google Ads, vá em "Tools & Settings" > "Setup" > "Account settings"
2. Copie o **Customer ID** (formato: 123-456-7890)

### 6. Configurar as Variáveis de Ambiente

1. Copie o arquivo `env.example` para `.env`
2. Preencha as seguintes variáveis:

```env
# Google Ads API Configuration
VITE_GOOGLE_ADS_CUSTOMER_ID=123-456-7890
VITE_GOOGLE_ADS_DEVELOPER_TOKEN=seu_developer_token_aqui
VITE_GOOGLE_ADS_CLIENT_ID=seu_client_id_aqui
VITE_GOOGLE_ADS_CLIENT_SECRET=seu_client_secret_aqui
VITE_GOOGLE_ADS_REFRESH_TOKEN=seu_refresh_token_aqui
```

## 🧪 Testando a Conexão

Após configurar todas as credenciais, você pode testar a conexão:

```javascript
import { googleAdsService } from './src/service/googleAdsService.js';

// Testar conexão
const testResult = await googleAdsService.testConnection();
console.log(testResult);

// Buscar campanhas
const campaigns = await googleAdsService.getCampaigns();
console.log(campaigns);
```

## 📊 Funcionalidades Disponíveis

O serviço `GoogleAdsService` oferece as seguintes funcionalidades:

### Métodos Principais

- `testConnection()` - Testa a conexão com a API
- `getCustomerInfo()` - Obtém informações da conta
- `getCampaigns()` - Lista todas as campanhas
- `getCampaignsWithMetrics(dateRange)` - Campanhas com métricas
- `getGoogleAdsStats(dateRange, searchTerm)` - Estatísticas gerais
- `getGoogleAdsStatsForUnit(unidadeNome)` - Stats por unidade
- `getAdGroups(campaignId)` - Grupos de anúncios de uma campanha
- `getAds(adGroupId)` - Anúncios de um grupo

### Exemplo de Uso

```javascript
// Buscar campanhas do mês atual
const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

const dateRange = {
  startDate: firstDay.toISOString().split('T')[0],
  endDate: lastDay.toISOString().split('T')[0]
};

const campaignsWithMetrics = await googleAdsService.getCampaignsWithMetrics(dateRange);
console.log('Campanhas com métricas:', campaignsWithMetrics);

// Buscar stats para uma unidade específica
const stats = await googleAdsService.getGoogleAdsStatsForUnit('Londrina');
console.log('Stats da unidade:', stats);
```

## ⚠️ Limitações e Considerações

1. **Quota Limits**: A API do Google Ads tem limites de requisições por dia
2. **Developer Token**: Precisa ser aprovado pelo Google
3. **Test Account**: Use uma conta de teste durante o desenvolvimento
4. **Rate Limiting**: O serviço implementa retry automático para limites de taxa

## 🔍 Troubleshooting

### Erro de Autenticação
- Verifique se o Client ID e Client Secret estão corretos
- Confirme se o Refresh Token é válido
- Verifique se a API está habilitada no Google Cloud Console

### Erro de Permissão
- Confirme se o Developer Token está aprovado
- Verifique se a conta tem acesso às campanhas
- Teste com uma conta de teste primeiro

### Erro de Customer ID
- Verifique se o formato está correto (123-456-7890)
- Confirme se a conta está ativa
- Teste com diferentes formatos (com e sem hífens)

## 📚 Recursos Adicionais

- [Documentação Oficial da Google Ads API](https://developers.google.com/google-ads/api)
- [Google Ads API Reference](https://developers.google.com/google-ads/api/reference)
- [OAuth2 Playground](https://developers.google.com/oauthplayground/)
- [Google Cloud Console](https://console.cloud.google.com/)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no console do navegador
2. Confirme se todas as credenciais estão corretas
3. Teste com uma conta de teste primeiro
4. Consulte a documentação oficial da API
