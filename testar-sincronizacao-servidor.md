# 🧪 Como Testar a Sincronização no Servidor

## Opção 1: Testar via Frontend (Recomendado)

1. Acesse o beta: https://beta.oficialmed.com.br (ou sua URL)
2. Clique no botão **"SYNC AGORA"** no TopMenuBar
3. Observe a resposta e verifique se:
   - ✅ Mostra apenas oportunidades sincronizadas
   - ✅ Não menciona segmentos
   - ✅ Tempo de execução razoável

## Opção 2: Testar via cURL no Servidor

Execute no servidor:

```bash
curl -X GET "https://sincro.oficialmed.com.br/sync/oportunidades" \
  -H "Content-Type: application/json" \
  --max-time 300 | jq .
```

## Opção 3: Monitorar Logs em Tempo Real

Execute no servidor para ver os logs em tempo real:

```bash
# Ver logs em tempo real
docker service logs -f sprint-sync_sincronizacao
```

Depois, em outro terminal ou pelo frontend, acione a sincronização e observe os logs.

### O que procurar nos logs:

✅ **Bom sinal:**
- `🚀 handleSyncOportunidades chamado - GARANTINDO que syncSegmentos=false`
- `🔍 Opções passadas para runFullSync: {"syncOportunidades":true,"syncLeads":false,"syncSegmentos":false}`
- `✅ Oportunidades: X processadas`
- `✅ Sincronização de oportunidades concluída`

❌ **Problema:**
- Qualquer menção a "segmentos" sendo sincronizados
- `✅ Página X de segmentos`
- `syncSegments` sendo chamado

## Opção 4: Verificar Versão da API

```bash
docker service logs --tail 50 sprint-sync_sincronizacao | grep -E "Commit:|Versão:"
```

Deve mostrar commit `d31fdc3` ou mais recente.

## Opção 5: Teste Completo com Script

Copie o conteúdo de `testar-sincronizacao-servidor.sh` para o servidor e execute:

```bash
bash testar-sincronizacao-servidor.sh
```


