#!/bin/bash

# Script de Build para Módulo de Reativação
# Este script faz o build do projeto para deploy no Render

echo "🔨 Iniciando build do módulo de reativação..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js primeiro."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale npm primeiro."
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar variáveis de ambiente
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "⚠️  Aviso: VITE_SUPABASE_URL não está definida"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Aviso: VITE_SUPABASE_ANON_KEY não está definida"
fi

if [ -z "$VITE_SYNC_API_URL" ]; then
    echo "⚠️  Aviso: VITE_SYNC_API_URL não está definida (necessária para acionar a API de sincronização)"
fi

# Fazer build
echo "🔨 Fazendo build do projeto..."
npm run build

# Verificar se o build foi criado
if [ -d "dist" ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Pasta dist/ criada com os arquivos estáticos"
    echo ""
    echo "📊 Tamanho do build:"
    du -sh dist/
    echo ""
    echo "🚀 Pronto para deploy no Render!"
    echo ""
    echo "Próximos passos:"
    echo "1. Faça commit do build (opcional): git add dist/"
    echo "2. No Render, configure o deploy com:"
    echo "   - Build Command: npm install && npm run build"
    echo "   - Publish Directory: dist"
    echo "   - Variáveis de ambiente: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SYNC_API_URL"
else
    echo "❌ Erro: Build não foi criado. Verifique os logs acima."
    exit 1
fi



