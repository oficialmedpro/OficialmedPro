#!/bin/bash

# Script para configurar e executar o backend proxy do Google Ads

echo "🚀 Configurando Backend Proxy Google Ads..."

# Criar diretório do backend se não existir
if [ ! -d "google-ads-proxy" ]; then
    echo "📁 Criando diretório google-ads-proxy..."
    mkdir google-ads-proxy
fi

cd google-ads-proxy

# Copiar arquivos necessários
echo "📋 Copiando arquivos..."
cp ../google-ads-proxy-server.js server.js
cp ../google-ads-proxy-package.json package.json
cp ../google-ads-proxy-config.js config.js

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se o arquivo config.js existe
if [ ! -f "config.js" ]; then
    echo "⚠️ Arquivo config.js não encontrado!"
    echo "📝 Criando config.js a partir do template..."
    cp google-ads-proxy-config.js config.js
    echo "✏️ Por favor, edite o arquivo config.js com suas credenciais do Supabase"
    echo "   - URL do Supabase"
    echo "   - Chave anônima do Supabase"
    exit 1
fi

echo "✅ Configuração concluída!"
echo "🔧 Para executar o servidor:"
echo "   cd google-ads-proxy"
echo "   npm start"
echo ""
echo "📝 Certifique-se de que o arquivo config.js está configurado com suas credenciais do Supabase"
