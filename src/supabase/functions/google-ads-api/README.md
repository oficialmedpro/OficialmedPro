# Google Ads API Edge Function

Esta Edge Function foi criada para integrar com a API do Google Ads de forma segura, mantendo as credenciais no servidor.

## 🚀 Funcionalidades

- ✅ Buscar campanhas básicas
- ✅ Buscar campanhas com métricas/estatísticas
- ✅ Obter informações da conta
- ✅ Validar conexão com a API
- ✅ Renovação automática de tokens de acesso
- ✅ Suporte a múltiplas contas

## 📋 Configuração Necessária

### Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
# Google Ads API - Conta 1
VITE_GOOGLE_CLIENT_ID=seu_client_id_aqui
VITE_GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
VITE_GOOGLE_REFRESH_TOKEN=seu_refresh_token_aqui
VITE_GOOGLE_CUSTOMER_ID=1234567890
VITE_GOOGLE_DEVELOPER_TOKEN=seu_developer_token_aqui

# Google Ads API - Conta 2 (opcional)
VITE_GOOGLE_CLIENT_ID_2=seu_client_id_2_aqui
VITE_GOOGLE_CLIENT_SECRET_2=seu_client_secret_2_aqui
VITE_GOOGLE_REFRESH_TOKEN_2=seu_refresh_token_2_aqui
VITE_GOOGLE_CUSTOMER_ID_2=0987654321
VITE_GOOGLE_DEVELOPER_TOKEN_2=seu_developer_token_2_aqui
```

### Como Obter as Credenciais

1. **Client ID e Client Secret**:
   - Acesse: https://console.developers.google.com/
   - Crie um projeto ou use um existente
   - Ative a Google Ads API
   - Configure OAuth 2.0

2. **Refresh Token**:
   - Acesse: https://developers.google.com/oauthplayground/
   - Configure: "Use your own OAuth credentials"
   - Adicione seu CLIENT_ID e CLIENT_SECRET
   - No Step 1: adicione o scope: `https://www.googleapis.com/auth/adwords`
   - Autorize e obtenha o refresh token

3. **Customer ID**:
   - Acesse sua conta Google Ads
   - Copie o Customer ID (sem hífens)
   - Exemplo: se mostrar 123-456-7890, use 1234567890

4. **Developer Token**:
   - Acesse: https://ads.google.com/
   - Vá em Tools & Settings > Setup > API Center
   - Solicite acesso ao Developer Token
   - Aguarde aprovação (pode levar alguns dias)

## 🛠️ Deploy

Para fazer o deploy da Edge Function:

```bash
# Fazer login no Supabase CLI
supabase login

# Deploy da função
supabase functions deploy google-ads-api
```

## 📊 Uso no Frontend

A Edge Function é chamada automaticamente através do `googleAdsService.ts`. Exemplos de uso:

```typescript
import { useGoogleAds } from '../hooks/useGoogleAds';

const MyComponent = () => {
  const {
    campaigns,
    loading,
    error,
    refreshCampaignsWithMetrics,
    getGoogleAdsStats,
    validateConnection
  } = useGoogleAds();

  // Buscar campanhas com métricas
  const handleLoadCampaigns = async () => {
    await refreshCampaignsWithMetrics({
      since: '2024-01-01',
      until: '2024-01-31'
    });
  };

  // Validar conexão
  const handleValidateConnection = async () => {
    const result = await validateConnection();
    console.log('Conexão válida:', result.connected);
  };

  return (
    <div>
      {loading && <p>Carregando...</p>}
      {error && <p>Erro: {error}</p>}
      {campaigns.map(campaign => (
        <div key={campaign.id}>
          <h3>{campaign.name}</h3>
          <p>Status: {campaign.status}</p>
          <p>Impressões: {campaign.metrics?.impressions}</p>
          <p>Cliques: {campaign.metrics?.clicks}</p>
          <p>Conversões: {campaign.metrics?.conversions}</p>
        </div>
      ))}
    </div>
  );
};
```

## 🔍 Endpoints Disponíveis

### getCampaigns
Busca campanhas básicas sem métricas.

### getCampaignStats
Busca campanhas com métricas para um período específico.

### getAccountInfo
Obtém informações da conta Google Ads.

### validateConnection
Valida a conexão com a API Google Ads.

## 📈 Métricas Disponíveis

- **Impressões**: Número de vezes que os anúncios foram exibidos
- **Cliques**: Número de cliques nos anúncios
- **Custo**: Valor gasto em micros (dividir por 1.000.000 para valor real)
- **Conversões**: Número de conversões
- **CTR**: Taxa de cliques (%)
- **CPC**: Custo por clique

## 🐛 Troubleshooting

### Erro: "Invalid OAuth"
- Verifique se o refresh token está correto
- Regenere o refresh token se necessário

### Erro: "Developer token not approved"
- Aguarde a aprovação do developer token pela Google
- Use uma conta aprovada para desenvolvimento

### Erro: "Customer not found"
- Verifique se o Customer ID está correto (sem hífens)
- Confirme que o token tem acesso a essa conta

### Logs da Edge Function
Para ver os logs da função:

```bash
supabase functions logs google-ads-api
```

## 🔐 Segurança

- As credenciais são mantidas no servidor (Edge Function)
- Tokens são renovados automaticamente
- Comunicação segura via HTTPS
- CORS configurado adequadamente
