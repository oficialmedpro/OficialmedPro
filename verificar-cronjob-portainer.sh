#!/bin/bash

# ========================================
# 🔍 VERIFICAR CRONJOB prime-sync-api-cron NO PORTAINER
# ========================================
# Objetivo: Verificar se o cronjob está rodando e atualizando dados
# ========================================

echo "🔍 VERIFICANDO CRONJOB prime-sync-api-cron..."
echo ""

# 1) Verificar se o container está rodando
echo "1️⃣ Verificando se o container está rodando..."
docker ps | grep "prime-sync-api-cron" || echo "❌ Container não encontrado em execução!"
echo ""

# 2) Verificar logs do container
echo "2️⃣ Verificando logs do container (últimas 50 linhas)..."
docker logs prime-sync-api-cron --tail 50 || echo "❌ Erro ao buscar logs!"
echo ""

# 3) Verificar logs do container (últimas execuções com timestamps)
echo "3️⃣ Verificando logs com timestamps (últimas 20 linhas)..."
docker logs prime-sync-api-cron --tail 20 --timestamps || echo "❌ Erro ao buscar logs!"
echo ""

# 4) Verificar status do container
echo "4️⃣ Verificando status detalhado do container..."
docker inspect prime-sync-api-cron | grep -A 10 "Status\|State\|RestartCount" || echo "❌ Container não encontrado!"
echo ""

# 5) Verificar variáveis de ambiente do container
echo "5️⃣ Verificando variáveis de ambiente..."
docker inspect prime-sync-api-cron | grep -A 20 "Env" || echo "❌ Erro ao buscar variáveis!"
echo ""

# 6) Verificar todos os containers relacionados a sync
echo "6️⃣ Verificando todos os containers relacionados a sync..."
docker ps -a | grep "sync" || echo "❌ Nenhum container de sync encontrado!"
echo ""

# 7) Verificar stacks no Portainer (se docker swarm estiver ativo)
echo "7️⃣ Verificando serviços no Docker Swarm..."
docker service ls | grep "prime-sync" || echo "❌ Nenhum serviço encontrado (talvez não seja Swarm)!"
echo ""

# 8) Verificar logs do serviço (se for Swarm)
echo "8️⃣ Verificando logs do serviço (se Swarm)..."
docker service logs prime-sync-api-cron --tail 20 2>/dev/null || echo "ℹ️ Não é um serviço Swarm ou serviço não encontrado"
echo ""

# 9) Verificar cron jobs dentro do container (se estiver rodando)
echo "9️⃣ Verificando cron jobs dentro do container..."
docker exec prime-sync-api-cron crontab -l 2>/dev/null || echo "❌ Não foi possível acessar o container ou crontab não encontrado!"
echo ""

# 10) Verificar se o script de sincronização existe
echo "🔟 Verificando arquivos de sincronização no container..."
docker exec prime-sync-api-cron ls -la /app 2>/dev/null || echo "❌ Não foi possível acessar o container!"
echo ""

echo "✅ VERIFICAÇÃO CONCLUÍDA!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Se o container NÃO está rodando → reinicie o container/serviço"
echo "2. Se os logs mostram erros → verifique as credenciais e configurações"
echo "3. Se não há logs recentes → o cronjob pode não estar configurado corretamente"
echo "4. Verifique no Supabase SQL Editor: verificar-cronjob-prime-sync.sql"
echo ""

