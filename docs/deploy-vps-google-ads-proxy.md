# Deploy do Backend Proxy Google Ads na VPS

## 🎯 Sim, vai funcionar na VPS!

O backend proxy foi projetado para funcionar tanto localmente quanto na VPS. Aqui está o guia completo de deploy.

## 🚀 Deploy na VPS

### 1. Preparar Arquivos na VPS

```bash
# Na VPS, criar diretório para o backend
mkdir -p /var/www/google-ads-proxy
cd /var/www/google-ads-proxy

# Copiar arquivos do projeto principal
# (Você pode fazer upload via SCP, Git, ou copiar manualmente)
```

### 2. Configurar Credenciais do Supabase

Criar arquivo `config.js` na VPS:

```javascript
module.exports = {
  supabase: {
    url: 'https://SEU-PROJETO.supabase.co', // Sua URL real do Supabase
    anonKey: 'SUA-CHAVE-ANONIMA-REAL' // Sua chave anônima real
  },
  server: {
    port: process.env.PORT || 3001,
    cors: {
      origin: [
        'http://localhost:5173', // Desenvolvimento local
        'http://localhost:3000', // Desenvolvimento local
        'https://SEU-DOMINIO.com', // Seu domínio da VPS
        'https://www.SEU-DOMINIO.com' // Seu domínio com www
      ],
      credentials: true
    }
  }
};
```

### 3. Instalar Dependências

```bash
# Na VPS
cd /var/www/google-ads-proxy
npm install
```

### 4. Configurar PM2 (Gerenciador de Processos)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Criar arquivo de configuração do PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'google-ads-proxy',
    script: 'server.js',
    cwd: '/var/www/google-ads-proxy',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/google-ads-proxy-error.log',
    out_file: '/var/log/pm2/google-ads-proxy-out.log',
    log_file: '/var/log/pm2/google-ads-proxy.log'
  }]
};
EOF

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar automaticamente
pm2 startup
```

### 5. Configurar Nginx (Proxy Reverso)

```bash
# Criar configuração do Nginx
sudo cat > /etc/nginx/sites-available/google-ads-proxy << EOF
server {
    listen 80;
    server_name SEU-DOMINIO.com www.SEU-DOMINIO.com;

    location /api/google-ads/ {
        proxy_pass http://localhost:3001/api/google-ads/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar site
sudo ln -s /etc/nginx/sites-available/google-ads-proxy /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 6. Configurar SSL (Opcional mas Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d SEU-DOMINIO.com -d www.SEU-DOMINIO.com

# Configuração automática será aplicada
```

## 🔧 Atualizar Frontend para VPS

### 1. Atualizar URL do Backend

No arquivo `src/service/googleAdsApiProxy.js`:

```javascript
class GoogleAdsApiProxy {
  constructor() {
    // Detectar ambiente
    const isProduction = window.location.hostname !== 'localhost';
    
    this.baseUrl = isProduction 
      ? 'https://SEU-DOMINIO.com/api/google-ads' // URL da VPS
      : 'http://localhost:3001/api/google-ads'; // URL local
    
    this.customerId = null;
    this.unidadeId = 1;
    
    console.log('🔧 GoogleAdsApiProxy inicializado - usando:', this.baseUrl);
  }
  // ... resto do código
}
```

### 2. Configurar Variáveis de Ambiente (Opcional)

Criar arquivo `.env` no frontend:

```bash
# .env
VITE_GOOGLE_ADS_API_URL=https://SEU-DOMINIO.com/api/google-ads
```

E atualizar o serviço:

```javascript
const baseUrl = import.meta.env.VITE_GOOGLE_ADS_API_URL || 'http://localhost:3001/api/google-ads';
```

## 📋 Script de Deploy Automático

Criar script `deploy-vps.sh`:

```bash
#!/bin/bash

echo "🚀 Deploy do Google Ads Proxy na VPS..."

# Variáveis
VPS_USER="seu-usuario"
VPS_HOST="seu-ip-ou-dominio"
VPS_PATH="/var/www/google-ads-proxy"

# Fazer upload dos arquivos
echo "📤 Enviando arquivos para VPS..."
scp google-ads-proxy-server.js $VPS_USER@$VPS_HOST:$VPS_PATH/server.js
scp google-ads-proxy-package.json $VPS_USER@$VPS_HOST:$VPS_PATH/package.json

# Executar comandos na VPS
echo "🔧 Configurando na VPS..."
ssh $VPS_USER@$VPS_HOST << EOF
cd $VPS_PATH
npm install
pm2 restart google-ads-proxy
pm2 save
EOF

echo "✅ Deploy concluído!"
```

## 🔍 Verificação do Deploy

### 1. Testar Backend

```bash
# Testar se o backend está rodando
curl -X POST https://SEU-DOMINIO.com/api/google-ads/test-connection \
  -H "Content-Type: application/json" \
  -d '{"unidadeId": 1, "customerId": "test"}'
```

### 2. Verificar Logs

```bash
# Ver logs do PM2
pm2 logs google-ads-proxy

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. Monitorar Status

```bash
# Status do PM2
pm2 status

# Status do Nginx
sudo systemctl status nginx
```

## 🛡️ Segurança na VPS

### 1. Firewall

```bash
# Configurar UFW
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. Variáveis de Ambiente

```bash
# Criar arquivo .env na VPS
cat > /var/www/google-ads-proxy/.env << EOF
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=SUA-CHAVE-ANONIMA
EOF
```

## 📊 Monitoramento

### 1. PM2 Monitoring

```bash
# Interface web do PM2
pm2 install pm2-server-monit
```

### 2. Logs Centralizados

```bash
# Configurar logrotate
sudo cat > /etc/logrotate.d/google-ads-proxy << EOF
/var/log/pm2/google-ads-proxy*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
```

## ✅ Checklist de Deploy

- [ ] Backend proxy configurado na VPS
- [ ] Credenciais do Supabase configuradas
- [ ] PM2 configurado e rodando
- [ ] Nginx configurado como proxy reverso
- [ ] SSL configurado (opcional)
- [ ] Frontend atualizado para usar URL da VPS
- [ ] Firewall configurado
- [ ] Logs configurados
- [ ] Teste de conectividade realizado

## 🎯 Resultado Final

Após o deploy, o frontend funcionará assim:

1. **Local**: `http://localhost:3001/api/google-ads/*`
2. **VPS**: `https://SEU-DOMINIO.com/api/google-ads/*`

O sistema detectará automaticamente o ambiente e usará a URL correta!
