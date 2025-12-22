# 📋 Como Ver e Copiar Logs da Sincronização

## Opção 1: Salvar Logs em Arquivo (Recomendado)

Execute no servidor:

```bash
bash verificar-logs-sincronizacao.sh
```

Isso vai:
- ✅ Salvar os logs em `./logs-sync/sync_logs_TIMESTAMP.txt`
- ✅ Mostrar as últimas 50 linhas na tela
- ✅ Você pode copiar o arquivo ou ver seu conteúdo depois

## Opção 2: Ver Últimas Linhas (Sem Scroll Infinito)

Execute no servidor:

```bash
bash verificar-logs-sincronizacao-rapido.sh
```

Ou diretamente:

```bash
docker service logs --tail 100 sprint-sync_sincronizacao 2>&1 | tail -100
```

## Opção 3: Comandos Úteis para Análise

### Ver apenas erros:
```bash
docker service logs sprint-sync_sincronizacao 2>&1 | grep -i error | tail -50
```

### Ver apenas informações sobre oportunidades:
```bash
docker service logs sprint-sync_sincronizacao 2>&1 | grep -E "Página|oportunidades|handleSyncOportunidades" | tail -50
```

### Verificar se há menção a segmentos (não deve aparecer nada):
```bash
docker service logs sprint-sync_sincronizacao 2>&1 | grep -i segmento
```

### Salvar logs em arquivo manualmente:
```bash
docker service logs --tail 500 sprint-sync_sincronizacao > /tmp/sync_logs.txt 2>&1
cat /tmp/sync_logs.txt
```

### Ver logs desde um tempo específico:
```bash
docker service logs --since 10m sprint-sync_sincronizacao 2>&1 | tail -100
```

## Opção 4: Ver Logs em Tempo Real (Mas Parar Depois)

Execute no servidor e pressione `Ctrl+C` quando quiser parar:

```bash
timeout 30 docker service logs -f sprint-sync_sincronizacao
```

Isso vai mostrar logs por 30 segundos e depois parar automaticamente.

## Opção 5: Ver Logs de Uma Execução Específica

Se você souber aproximadamente quando começou a sincronização:

```bash
# Ver logs das últimas 5 minutos
docker service logs --since 5m sprint-sync_sincronizacao 2>&1 | tail -200 > /tmp/sync_recente.txt
cat /tmp/sync_recente.txt
```


