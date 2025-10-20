#!/bin/sh

echo "🔧 Carregando secrets do Docker Swarm para API..."

# Carregar secrets do Docker Swarm
if [ -f "/run/secrets/VITE_SUPABASE_URL_CORRETO" ]; then
    export VITE_SUPABASE_URL=$(cat /run/secrets/VITE_SUPABASE_URL_CORRETO)
    echo "✅ VITE_SUPABASE_URL carregada do secret VITE_SUPABASE_URL_CORRETO"
elif [ -f "/run/secrets/VITE_SUPABASE_URL" ]; then
    export VITE_SUPABASE_URL=$(cat /run/secrets/VITE_SUPABASE_URL)
    echo "✅ VITE_SUPABASE_URL carregada do secret VITE_SUPABASE_URL"
else
    echo "⚠️ Secret VITE_SUPABASE_URL não encontrado"
fi

if [ -f "/run/secrets/VITE_SUPABASE_SERVICE_ROLE_KEY" ]; then
    export VITE_SUPABASE_SERVICE_ROLE_KEY=$(cat /run/secrets/VITE_SUPABASE_SERVICE_ROLE_KEY)
    echo "✅ VITE_SUPABASE_SERVICE_ROLE_KEY carregada do secret"
else
    echo "⚠️ Secret VITE_SUPABASE_SERVICE_ROLE_KEY não encontrado"
fi

if [ -f "/run/secrets/VITE_SUPABASE_SCHEMA" ]; then
    export VITE_SUPABASE_SCHEMA=$(cat /run/secrets/VITE_SUPABASE_SCHEMA)
    echo "✅ VITE_SUPABASE_SCHEMA carregada do secret"
else
    echo "⚠️ Secret VITE_SUPABASE_SCHEMA não encontrado"
fi

echo "🔍 Variáveis carregadas:"
echo "  VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:30}..."
echo "  VITE_SUPABASE_SERVICE_ROLE_KEY: ${VITE_SUPABASE_SERVICE_ROLE_KEY:0:30}..."
echo "  VITE_SUPABASE_SCHEMA: $VITE_SUPABASE_SCHEMA"

echo "🚀 Iniciando servidor API..."
exec "$@"
