#!/bin/sh
# Script para verificar assets no container

echo "🔍 Verificando conteúdo da pasta assets..."
ls -la /usr/share/nginx/html/assets/

echo ""
echo "🔍 Contando arquivos na pasta assets..."
find /usr/share/nginx/html/assets/ -type f | wc -l

echo ""
echo "🔍 Verificando se index-CfC5iJsp.js existe..."
ls -lh /usr/share/nginx/html/assets/index-*.js 2>/dev/null || echo "❌ Arquivos JS não encontrados"

echo ""
echo "🔍 Verificando se index-DUn9cAPZ.css existe..."
ls -lh /usr/share/nginx/html/assets/index-*.css 2>/dev/null || echo "❌ Arquivos CSS não encontrados"

echo ""
echo "🔍 Listando primeiros 10 arquivos em assets..."
ls -lh /usr/share/nginx/html/assets/ | head -15




