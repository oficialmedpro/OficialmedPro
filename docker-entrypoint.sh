#!/bin/sh

# Script de entrada para injetar variáveis de ambiente em runtime
# Este script substitui as variáveis no HTML/JS buildado

echo "🚀 Iniciando container com injeção de variáveis de ambiente..."

# Função para ler variáveis de arquivos de secret (Portainer)
read_secret() {
    if [ -f "$1" ]; then
        cat "$1"
    else
        echo "$2"
    fi
}

# Ler variáveis de ambiente ou de secrets
VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-$(read_secret "$VITE_SUPABASE_URL_FILE" "")}
VITE_SUPABASE_SERVICE_ROLE_KEY=${VITE_SUPABASE_SERVICE_ROLE_KEY:-$(read_secret "$VITE_SUPABASE_SERVICE_ROLE_KEY_FILE" "")}
VITE_SUPABASE_SCHEMA=${VITE_SUPABASE_SCHEMA:-$(read_secret "$VITE_SUPABASE_SCHEMA_FILE" "api")}

# Verificar se as variáveis estão definidas
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ VITE_SUPABASE_URL não definida"
    exit 1
fi

if [ -z "$VITE_SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ VITE_SUPABASE_SERVICE_ROLE_KEY não definida"
    exit 1
fi

if [ -z "$VITE_SUPABASE_SCHEMA" ]; then
    echo "❌ VITE_SUPABASE_SCHEMA não definida"
    exit 1
fi

echo "✅ Variáveis de ambiente encontradas:"
echo "   VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:20}..."
echo "   VITE_SUPABASE_SERVICE_ROLE_KEY: ${VITE_SUPABASE_SERVICE_ROLE_KEY:0:10}..."
echo "   VITE_SUPABASE_SCHEMA: $VITE_SUPABASE_SCHEMA"

# Injetar variáveis diretamente no HTML
echo "📝 Injetando variáveis no HTML..."

# Encontrar o arquivo index.html
INDEX_FILE="/usr/share/nginx/html/index.html"

if [ -f "$INDEX_FILE" ]; then
    # Criar script com as variáveis
    SCRIPT_TAG="<script>window.ENV = { VITE_SUPABASE_URL: '${VITE_SUPABASE_URL}', VITE_SUPABASE_SERVICE_ROLE_KEY: '${VITE_SUPABASE_SERVICE_ROLE_KEY}', VITE_SUPABASE_SCHEMA: '${VITE_SUPABASE_SCHEMA}' };</script>"
    
    # Injetar antes do fechamento do </head>
    sed -i "s|</head>|${SCRIPT_TAG}</head>|" "$INDEX_FILE"
    
    echo "✅ Variáveis injetadas no HTML com sucesso"
else
    echo "❌ Arquivo index.html não encontrado"
    exit 1
fi

# Iniciar nginx
echo "🌐 Iniciando nginx..."
exec nginx -g "daemon off;"
