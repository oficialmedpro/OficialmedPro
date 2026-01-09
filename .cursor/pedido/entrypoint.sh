#!/bin/sh
# Script para injetar variáveis de ambiente no HTML

# Ler variáveis de ambiente e criar script de configuração
cat > /usr/share/nginx/html/env-config.js <<EOF
// Configuração injetada via variáveis de ambiente
window.ENV_CONFIG = {
    VITE_SUPABASE_URL: "${VITE_SUPABASE_URL:-}",
    VITE_SUPABASE_KEY: "${VITE_SUPABASE_KEY:-}",
    VITE_SUPABASE_SCHEMA: "${VITE_SUPABASE_SCHEMA:-}",
    VITE_API_URL: "${VITE_API_URL:-}",
    VITE_N8N_WEBHOOK_URL: "${VITE_N8N_WEBHOOK_URL:-}",
    VITE_CHECKOUT_API_URL: "${VITE_CHECKOUT_API_URL:-}",
    VITE_CHECKOUT_API_KEY: "${VITE_CHECKOUT_API_KEY:-}",
    VITE_GA4_MEASUREMENT_ID: "${VITE_GA4_MEASUREMENT_ID:-}",
    VITE_FACEBOOK_PIXEL_ID: "${VITE_FACEBOOK_PIXEL_ID:-}"
};
EOF

# Executar o entrypoint padrão do nginx
exec /docker-entrypoint.sh nginx -g 'daemon off;'
