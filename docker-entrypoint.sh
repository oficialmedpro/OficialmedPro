#!/bin/sh

# Script para ler secrets do Docker Swarm e definir variáveis de ambiente
echo "🔧 Carregando secrets do Docker Swarm..."

# Debug: listar todos os secrets disponíveis
echo "📋 Secrets disponíveis:"
ls -la /run/secrets/ 2>/dev/null || echo "❌ Diretório /run/secrets não encontrado"

# Ler secrets e definir variáveis de ambiente
# Priorizar VITE_SUPABASE_URL_CORRETO que tem a URL correta do Supabase
if [ -f "/run/secrets/VITE_SUPABASE_URL_CORRETO" ]; then
    export VITE_SUPABASE_URL=$(cat /run/secrets/VITE_SUPABASE_URL_CORRETO)
    echo "✅ VITE_SUPABASE_URL carregada do secret VITE_SUPABASE_URL_CORRETO"
elif [ -f "/run/secrets/VITE_SUPABASE_URL" ]; then
    export VITE_SUPABASE_URL=$(cat /run/secrets/VITE_SUPABASE_URL)
    echo "✅ VITE_SUPABASE_URL carregada do secret VITE_SUPABASE_URL"
else
    echo "⚠️ Secret VITE_SUPABASE_URL não encontrado"
    echo "🔍 Tentando usar variável de ambiente VITE_SUPABASE_URL_FILE..."
    if [ -n "$VITE_SUPABASE_URL_FILE" ] && [ -f "$VITE_SUPABASE_URL_FILE" ]; then
        export VITE_SUPABASE_URL=$(cat "$VITE_SUPABASE_URL_FILE")
        echo "✅ VITE_SUPABASE_URL carregada de $VITE_SUPABASE_URL_FILE"
    fi
fi

if [ -f "/run/secrets/VITE_SUPABASE_SERVICE_ROLE_KEY" ]; then
    export VITE_SUPABASE_SERVICE_ROLE_KEY=$(cat /run/secrets/VITE_SUPABASE_SERVICE_ROLE_KEY)
    echo "✅ VITE_SUPABASE_SERVICE_ROLE_KEY carregada do secret"
else
    echo "⚠️ Secret VITE_SUPABASE_SERVICE_ROLE_KEY não encontrado"
    echo "🔍 Tentando usar variável de ambiente VITE_SUPABASE_SERVICE_ROLE_KEY_FILE..."
    if [ -n "$VITE_SUPABASE_SERVICE_ROLE_KEY_FILE" ] && [ -f "$VITE_SUPABASE_SERVICE_ROLE_KEY_FILE" ]; then
        export VITE_SUPABASE_SERVICE_ROLE_KEY=$(cat "$VITE_SUPABASE_SERVICE_ROLE_KEY_FILE")
        echo "✅ VITE_SUPABASE_SERVICE_ROLE_KEY carregada de $VITE_SUPABASE_SERVICE_ROLE_KEY_FILE"
    fi
fi

if [ -f "/run/secrets/VITE_SUPABASE_SCHEMA" ]; then
    export VITE_SUPABASE_SCHEMA=$(cat /run/secrets/VITE_SUPABASE_SCHEMA)
    echo "✅ VITE_SUPABASE_SCHEMA carregada do secret"
else
    echo "⚠️ Secret VITE_SUPABASE_SCHEMA não encontrado"
    echo "🔍 Tentando usar variável de ambiente VITE_SUPABASE_SCHEMA_FILE..."
    if [ -n "$VITE_SUPABASE_SCHEMA_FILE" ] && [ -f "$VITE_SUPABASE_SCHEMA_FILE" ]; then
        export VITE_SUPABASE_SCHEMA=$(cat "$VITE_SUPABASE_SCHEMA_FILE")
        echo "✅ VITE_SUPABASE_SCHEMA carregada de $VITE_SUPABASE_SCHEMA_FILE"
    fi
fi

# Log das variáveis (sem mostrar valores sensíveis)
echo "🔍 Variáveis carregadas:"
echo "  VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:30}..."
echo "  VITE_SUPABASE_SERVICE_ROLE_KEY: ${VITE_SUPABASE_SERVICE_ROLE_KEY:0:20}..."
echo "  VITE_SUPABASE_SCHEMA: $VITE_SUPABASE_SCHEMA"

# Injetar variáveis no HTML para o frontend acessar
echo "🔧 Injetando variáveis no HTML..."
echo "📄 Verificando arquivo HTML antes da modificação..."
ls -la /usr/share/nginx/html/index.html

# Backup do arquivo original
cp /usr/share/nginx/html/index.html /usr/share/nginx/html/index.html.backup

# Verificar se as variáveis têm valores válidos
if [ -z "$VITE_SUPABASE_URL" ] || [ "$VITE_SUPABASE_URL" = "..." ] || [ "$VITE_SUPABASE_URL" = "undefined" ] || [ "$VITE_SUPABASE_URL" = "null" ]; then
    echo "❌ VITE_SUPABASE_URL está vazia ou inválida"
    echo "🔧 Usando fallback embutido na imagem"
    # Não injetar variáveis, deixar usar os fallbacks
else
    echo "✅ VITE_SUPABASE_URL válida: ${VITE_SUPABASE_URL:0:30}..."
    
    # Escapar caracteres especiais para o sed
    ESCAPED_URL=$(echo "$VITE_SUPABASE_URL" | sed 's/[[\.*^$()+?{|]/\\&/g')
    ESCAPED_KEY=$(echo "$VITE_SUPABASE_SERVICE_ROLE_KEY" | sed 's/[[\.*^$()+?{|]/\\&/g')
    ESCAPED_SCHEMA=$(echo "$VITE_SUPABASE_SCHEMA" | sed 's/[[\.*^$()+?{|]/\\&/g')
    
    # Injetar as variáveis
    sed -i "s|</head>|<script>window.ENV = { VITE_SUPABASE_URL: '${ESCAPED_URL}', VITE_SUPABASE_SERVICE_ROLE_KEY: '${ESCAPED_KEY}', VITE_SUPABASE_SCHEMA: '${ESCAPED_SCHEMA}' };</script></head>|" /usr/share/nginx/html/index.html
    
    echo "📄 Verificando se a modificação foi aplicada..."
    grep -o "window.ENV" /usr/share/nginx/html/index.html && echo "✅ window.ENV encontrado no HTML" || echo "❌ window.ENV NÃO encontrado no HTML"
fi

# Verificar se index.html existe e tem conteúdo
echo "🔍 Verificando index.html final..."
if [ -f "/usr/share/nginx/html/index.html" ]; then
    FILE_SIZE=$(wc -c < /usr/share/nginx/html/index.html)
    echo "✅ index.html existe - Tamanho: ${FILE_SIZE} bytes"
    if [ "$FILE_SIZE" -lt 100 ]; then
        echo "⚠️ AVISO: index.html muito pequeno (${FILE_SIZE} bytes) - pode estar incorreto!"
    fi
else
    echo "❌ ERRO: index.html não existe em /usr/share/nginx/html/"
    echo "📁 Listando conteúdo do diretório:"
    ls -la /usr/share/nginx/html/ || echo "❌ Diretório não existe!"
fi

# Executar o comando original
echo "🚀 Iniciando aplicação nginx..."
exec "$@"