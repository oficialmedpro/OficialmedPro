#!/bin/bash

echo "🔍 DIAGNÓSTICO - Dashboard de Vendas"
echo "===================================="
echo ""

# 1. Verificar se o serviço está rodando
echo "1️⃣ Verificando se o serviço vendas-pwa está rodando..."
docker service ps vendas-oficialmed_vendas-pwa --no-trunc 2>/dev/null || docker service ps $(docker service ls --filter name=vendas-pwa --format "{{.ID}}") --no-trunc

echo ""
echo "---"
echo ""

# 2. Verificar logs do serviço
echo "2️⃣ Últimos logs do serviço vendas-pwa..."
docker service logs vendas-oficialmed_vendas-pwa --tail 100 2>/dev/null || docker service logs $(docker service ls --filter name=vendas-pwa --format "{{.ID}}") --tail 100

echo ""
echo "---"
echo ""

# 3. Verificar secrets
echo "3️⃣ Verificando Docker Swarm Secrets..."
docker secret ls | grep VITE_SUPABASE

echo ""
echo "---"
echo ""

# 4. Entrar no container e verificar variáveis de ambiente
echo "4️⃣ Verificando variáveis de ambiente no container..."
CONTAINER_ID=$(docker ps --filter "name=vendas" --format "{{.ID}}" | head -n 1)

if [ -n "$CONTAINER_ID" ]; then
  echo "Container ID: $CONTAINER_ID"
  echo ""
  echo "📋 Secrets montados em /run/secrets/:"
  docker exec $CONTAINER_ID ls -la /run/secrets/ 2>/dev/null || echo "❌ Não foi possível acessar /run/secrets/"

  echo ""
  echo "📋 Conteúdo de window.ENV no index.html:"
  docker exec $CONTAINER_ID grep -o "window.ENV[^<]*" /usr/share/nginx/html/index.html | head -n 1 || echo "❌ window.ENV não encontrado no index.html"

  echo ""
  echo "📋 Verificando se index.html existe e tem conteúdo:"
  docker exec $CONTAINER_ID sh -c "ls -lh /usr/share/nginx/html/index.html && wc -l /usr/share/nginx/html/index.html"

  echo ""
  echo "📋 Verificando arquivos dist/assets:"
  docker exec $CONTAINER_ID ls -lh /usr/share/nginx/html/assets/ | head -n 10
else
  echo "❌ Container vendas não encontrado"
  echo "Containers disponíveis:"
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
fi

echo ""
echo "---"
echo ""

# 5. Verificar configuração do Traefik
echo "5️⃣ Verificando labels do Traefik..."
docker service inspect vendas-oficialmed_vendas-pwa --format='{{json .Spec.Labels}}' 2>/dev/null | python3 -m json.tool 2>/dev/null || docker service inspect vendas-oficialmed_vendas-pwa --format='{{json .Spec.Labels}}' 2>/dev/null

echo ""
echo "---"
echo ""

# 6. Testar conectividade com Supabase
echo "6️⃣ Testando conectividade com Supabase..."
if [ -n "$CONTAINER_ID" ]; then
  echo "Testando DNS e conectividade:"
  docker exec $CONTAINER_ID sh -c "ping -c 2 agdffspstbxeqhqtltvb.supabase.co 2>&1 || echo 'Ping não disponível'" | head -n 5

  echo ""
  echo "Testando acesso HTTP:"
  docker exec $CONTAINER_ID sh -c "wget -qO- --timeout=5 https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/ 2>&1 | head -n 5"
fi

echo ""
echo "---"
echo ""

# 7. Verificar nginx.conf
echo "7️⃣ Verificando configuração do Nginx..."
if [ -n "$CONTAINER_ID" ]; then
  docker exec $CONTAINER_ID cat /etc/nginx/nginx.conf | grep -A 5 "location /"
fi

echo ""
echo "===================================="
echo "✅ Diagnóstico completo!"
echo ""
echo "📋 RESUMO DAS VERIFICAÇÕES:"
echo "1. Status do serviço Docker"
echo "2. Logs recentes (últimos 100)"
echo "3. Secrets do Docker Swarm"
echo "4. Variáveis de ambiente no container"
echo "5. Labels do Traefik"
echo "6. Conectividade com Supabase"
echo "7. Configuração do Nginx"
echo ""
echo "💡 Use este output para identificar problemas!"
