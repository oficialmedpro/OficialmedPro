# Backend Proxy Google Ads API

## 🎯 Objetivo
Este backend proxy resolve o problema de compatibilidade da biblioteca `google-ads-api` com o navegador, permitindo que o frontend React acesse dados reais do Google Ads API.

## 🚀 Instalação Rápida

### 1. Executar Script de Configuração
```bash
chmod +x setup-google-ads-proxy.sh
./setup-google-ads-proxy.sh
```

### 2. Configurar Credenciais do Supabase
Edite o arquivo `google-ads-proxy/config.js`:

```javascript
module.exports = {
  supabase: {
    url: 'https://SEU-PROJETO.supabase.co', // Sua URL do Supabase
    anonKey: 'SUA-CHAVE-ANONIMA' // Sua chave anônima do Supabase
  },
  // ... resto da configuração
};
```

### 3. Executar o Servidor
```bash
cd google-ads-proxy
npm start
```

## 📋 Instalação Manual

### 1. Criar Diretório
```bash
mkdir google-ads-proxy
cd google-ads-proxy
```

### 2. Inicializar Projeto
```bash
npm init -y
```

### 3. Instalar Dependências
```bash
npm install express cors google-ads-api @supabase/supabase-js
npm install --save-dev nodemon
```

### 4. Copiar Arquivos
```bash
# Copiar os arquivos do projeto principal
cp ../google-ads-proxy-server.js server.js
cp ../google-ads-proxy-package.json package.json
cp ../google-ads-proxy-config.js config.js
```

### 5. Configurar Credenciais
Edite `config.js` com suas credenciais do Supabase.

### 6. Executar
```bash
npm start
```

## 🔧 Configuração

### Arquivo config.js
```javascript
module.exports = {
  supabase: {
    url: 'https://seu-projeto.supabase.co',
    anonKey: 'sua-chave-anonima'
  },
  server: {
    port: 3001,
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true
    }
  }
};
```

### Variáveis de Ambiente (Opcional)
```bash
export SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_ANON_KEY="sua-chave-anonima"
export PORT=3001
```

## 📡 Endpoints Disponíveis

- `POST /api/google-ads/test-connection` - Teste de conexão
- `POST /api/google-ads/customer-info` - Informações da conta
- `POST /api/google-ads/campaigns` - Listar campanhas
- `POST /api/google-ads/campaigns-with-metrics` - Campanhas com métricas
- `POST /api/google-ads/stats` - Estatísticas
- `POST /api/google-ads/ad-groups` - Grupos de anúncios
- `POST /api/google-ads/ads` - Anúncios

## 🔍 Como Funciona

1. **Frontend** faz requisição para `http://localhost:3001/api/google-ads/*`
2. **Backend** recebe a requisição e busca credenciais no Supabase
3. **Backend** conecta com Google Ads API usando as credenciais
4. **Backend** processa os dados e retorna via JSON
5. **Frontend** recebe os dados reais do Google Ads

## 🗄️ Estrutura do Banco de Dados

O backend busca credenciais na tabela `unidades`:

```sql
SELECT 
  id,
  nome,
  google_customer_id,
  google_developer_token,
  google_client_id,
  google_client_secret,
  google_refresh_token,
  google_ads_active
FROM unidades
WHERE id = ? AND google_ads_active = true
```

## 🐛 Troubleshooting

### Erro: "Nenhuma credencial ativa encontrada"
- Verifique se a unidade existe na tabela `unidades`
- Verifique se `google_ads_active = true`
- Verifique se as credenciais estão preenchidas

### Erro: "Erro ao buscar credenciais"
- Verifique a URL e chave do Supabase no `config.js`
- Verifique se o Supabase está acessível
- Verifique as permissões da chave anônima

### Erro: "HTTP error! status: 500"
- Verifique os logs do servidor
- Verifique se as credenciais do Google Ads são válidas
- Verifique se o developer token está ativo

## 📊 Logs

O servidor exibe logs detalhados:
- 🔍 Busca de credenciais
- ✅ Conexões bem-sucedidas
- ❌ Erros e falhas
- 📡 Requisições recebidas

## 🔄 Desenvolvimento

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

## 🚀 Deploy

Para deploy em produção:
1. Configure variáveis de ambiente
2. Use PM2 ou similar para gerenciar o processo
3. Configure proxy reverso (nginx)
4. Configure SSL/HTTPS

## 📝 Notas Importantes

- O backend deve estar rodando na porta 3001
- O frontend deve estar configurado para fazer requisições para `localhost:3001`
- As credenciais do Google Ads ficam seguras no backend
- O banco de dados Supabase deve estar acessível
