#!/bin/bash
# 🔄 COMANDO PARA ATUALIZAR API PARA ÚLTIMA VERSÃO DO GITHUB
# Este comando força rebuild completo garantindo que é a última versão

set -e  # Para em caso de erro

echo "🔄 Iniciando atualização da API para última versão..."
echo ""

# 1. Remover diretório antigo para garantir código fresco (sair primeiro se estiver dentro)
echo "📂 Limpando diretório de build anterior..."
cd /tmp 2>/dev/null || true
rm -rf /tmp/sprint-sync-build

# 2. Clonar repositório do zero (garante código mais recente)
echo "📥 Clonando última versão do GitHub..."
git clone https://github.com/oficialmedpro/OficialmedPro.git /tmp/sprint-sync-build

# 3. Entrar no diretório
cd /tmp/sprint-sync-build

# 4. Verificar commit atual
echo "🔍 Verificando versão atual..."
git log -1 --oneline

# 5. Parar serviço
echo "⏸️ Parando serviço..."
docker service scale sprint-sync_sincronizacao=0

# 6. Aguardar serviço parar completamente
echo "⏳ Aguardando serviço parar..."
sleep 5

# 7. Remover imagem antiga (opcional, mas garante rebuild)
echo "🗑️ Removendo imagem antiga..."
docker rmi easypanel/sprint-sync/sincronizacao:latest 2>/dev/null || echo "Imagem não encontrada (ok)"

# 8. Build FORÇADO sem cache (garante rebuild completo)
echo "🔨 Fazendo build FORÇADO (sem cache)..."
docker build --no-cache -f Dockerfile.sync-opportunities-easypanel -t easypanel/sprint-sync/sincronizacao:latest .

# 9. Atualizar serviço com nova imagem
echo "🔄 Atualizando serviço..."
docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force

# 10. Iniciar serviço
echo "▶️ Iniciando serviço..."
docker service scale sprint-sync_sincronizacao=1

# 11. Aguardar serviço iniciar
echo "⏳ Aguardando serviço iniciar..."
sleep 5

# 12. Verificar status
echo "✅ Verificando status do serviço..."
docker service ps sprint-sync_sincronizacao

echo ""
echo "✅ Deploy concluído!"
echo "📊 Para ver logs: docker service logs --tail 50 sprint-sync_sincronizacao"
echo "🔍 Para testar: curl https://sincro.oficialmed.com.br/version"

