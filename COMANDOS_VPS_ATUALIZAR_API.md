# Comandos para Atualizar API na VPS

## ✅ Código está pronto para subir!

O código foi commitado e enviado para o repositório. Você pode atualizar na VPS.

## 📋 Comando Completo para VPS (Copiar e Colar):

```bash
git clone https://github.com/oficialmedpro/OficialmedPro.git /tmp/sprint-sync-build 2>/dev/null || (cd /tmp/sprint-sync-build && git pull) && \
cd /tmp/sprint-sync-build && \
docker service scale sprint-sync_sincronizacao=0 && \
sleep 5 && \
docker build -f Dockerfile.sync-opportunities-easypanel -t easypanel/sprint-sync/sincronizacao:latest . && \
docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && \
docker service scale sprint-sync_sincronizacao=1 && \
echo "✅ Deploy concluído!"
```

## 📋 Comando em Uma Linha (para copiar/colar direto):

```bash
git clone https://github.com/oficialmedpro/OficialmedPro.git /tmp/sprint-sync-build 2>/dev/null || (cd /tmp/sprint-sync-build && git pull) && cd /tmp/sprint-sync-build && docker service scale sprint-sync_sincronizacao=0 && sleep 5 && docker build -f Dockerfile.sync-opportunities-easypanel -t easypanel/sprint-sync/sincronizacao:latest . && docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && docker service scale sprint-sync_sincronizacao=1 && echo "✅ Deploy concluído!"
```

## 📝 O Que o Comando Faz

1. **Clona ou atualiza o repositório** em `/tmp/sprint-sync-build`
2. **Entra no diretório** do repositório
3. **Para o serviço** (`sprint-sync_sincronizacao`)
4. **Aguarda 5 segundos** para garantir que o serviço parou
5. **Faz build da imagem Docker** usando `Dockerfile.sync-opportunities-easypanel`
6. **Atualiza o serviço** com a nova imagem
7. **Inicia o serviço** novamente

## 🔍 Verificação Após Deploy

```bash
# Verificar status do serviço
docker service ps sprint-sync_sincronizacao

# Ver logs (últimas 50 linhas)
docker service logs --tail 50 sprint-sync_sincronizacao

# Testar health check
curl https://sincrocrm.oficialmed.com.br/health

# Testar versão (deve mostrar commit 0b51717)
curl https://sincrocrm.oficialmed.com.br/version

# Testar o novo endpoint
curl -X POST https://sincrocrm.oficialmed.com.br/api/sync-now
```

## 📝 O que foi atualizado:

1. ✅ Endpoint `/api/sync-now` adicionado (compatível com TopMenuBar)
2. ✅ Mapeamento de 35 campos de data/hora das etapas
3. ✅ Mapeamento de 7 novos campos customizados
4. ✅ Função `mapOpportunityFields` atualizada com todos os campos
5. ✅ Campos criados no banco via migration

## ⚠️ Importante:

- O script `atualizar-todos-funis-campos-data-hora.cjs` está rodando em segundo plano localmente
- Após atualizar a API na VPS, ela já vai sincronizar todos os campos automaticamente
- O botão "SYNC AGORA" no TopMenuBar vai funcionar corretamente

## 🧹 Limpeza (Opcional)

Após confirmar que está funcionando, pode limpar o diretório temporário:

```bash
rm -rf /tmp/sprint-sync-build
```
