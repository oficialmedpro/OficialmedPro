#!/bin/bash

# Script de Deploy do Google Ads Proxy para VPS
# Uso: ./deploy-vps.sh

echo "🚀 Deploy do Google Ads Proxy para VPS..."

# Configurações (ajuste conforme sua VPS)
VPS_USER="root"  # ou seu usuário
VPS_HOST="SEU-IP-OU-DOMINIO"  # IP ou domínio da sua VPS
VPS_PATH="/var/www/google-ads-proxy"
DOMAIN="SEU-DOMINIO.com"  # Seu domínio

# Verificar se os arquivos existem
if [ ! -f "google-ads-proxy-server.js" ]; then
    echo "❌ Arquivo google-ads-proxy-server.js não encontrado!"
    exit 1
fi

if [ ! -f "google-ads-proxy-package.json" ]; then
    echo "❌ Arquivo google-ads-proxy-package.json não encontrado!"
    exit 1
fi

echo "📤 Enviando arquivos para VPS..."

# Criar diretório na VPS se não existir
ssh $VPS_USER@$VPS_HOST "mkdir -p $VPS_PATH"

# Enviar arquivos
scp google-ads-proxy-server.js $VPS_USER@$VPS_HOST:$VPS_PATH/server.js
scp google-ads-proxy-package.json $VPS_USER@$VPS_HOST:$VPS_PATH/package.json
scp google-ads-proxy-config.js $VPS_USER@$VPS_HOST:$VPS_PATH/config.js

echo "🔧 Configurando na VPS..."

# Executar comandos na VPS
ssh $VPS_USER@$VPS_HOST << EOF
set -e

echo "📁 Navegando para diretório..."
cd $VPS_PATH

echo "📦 Instalando dependências..."
npm install

echo "🔧 Configurando PM2..."
# Criar arquivo de configuração do PM2
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'google-ads-proxy',
    script: 'server.js',
    cwd: '$VPS_PATH',
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
PM2EOF

echo "🚀 Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js || pm2 restart google-ads-proxy
pm2 save

echo "🌐 Configurando Nginx..."
# Criar configuração do Nginx
cat > /tmp/google-ads-proxy-nginx << 'NGINXEOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

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
NGINXEOF

# Copiar configuração do Nginx
sudo cp /tmp/google-ads-proxy-nginx /etc/nginx/sites-available/google-ads-proxy
sudo ln -sf /etc/nginx/sites-available/google-ads-proxy /etc/nginx/sites-enabled/

# Testar e recarregar Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Configuração concluída!"
echo "📊 Status do PM2:"
pm2 status

echo "🌐 Status do Nginx:"
sudo systemctl status nginx --no-pager -l

EOF

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "🔍 Para verificar:"
echo "   - Backend: http://$VPS_HOST/api/google-ads/test-connection"
echo "   - Logs: ssh $VPS_USER@$VPS_HOST 'pm2 logs google-ads-proxy'"
echo "   - Status: ssh $VPS_USER@$VPS_HOST 'pm2 status'"
echo ""
echo "🔧 Próximos passos:"
echo "   1. Configure SSL com: sudo certbot --nginx -d $DOMAIN"
echo "   2. Atualize o arquivo config.js com suas credenciais do Supabase"
echo "   3. Teste o frontend com a nova URL"
echo ""
echo "📝 Lembre-se de:"
echo "   - Configurar credenciais do Supabase no config.js"
echo "   - Configurar firewall (portas 80, 443, 22)"
echo "   - Monitorar logs regularmente"
