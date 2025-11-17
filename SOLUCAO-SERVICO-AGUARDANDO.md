# 🔧 Solução: Serviço Aguardando para Iniciar

## ⚠️ Problema Identificado

O serviço está mostrando "Waiting for service sprint-sync_sincronizacao to start..." porque **faltam variáveis de ambiente** configuradas.

A API precisa das variáveis de ambiente para iniciar, e se elas não estiverem configuradas, o serviço não consegue iniciar.

---

## ✅ Solução: Configurar Variáveis de Ambiente

### Passo 1: Acessar Configurações de Variáveis de Ambiente

No EasyPanel, procure por:
- **"Environment Variables"** ou
- **"Variáveis de Ambiente"** ou
- **"Env Vars"** ou
- Um ícone de engrenagem/configurações no serviço

### Passo 2: Adicionar as Variáveis

Adicione **TODAS** estas variáveis (são obrigatórias):

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `SUPABASE_URL` | `https://agdffspstbxeqhqtltvb.supabase.co` | URL do Supabase |
| `SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA` | Service Role Key do Supabase |
| `SPRINTHUB_BASE_URL` | `sprinthub-api-master.sprinthub.app` | URL base do SprintHub |
| `SPRINTHUB_INSTANCE` | `oficialmed` | Instância do SprintHub |
| `SPRINTHUB_TOKEN` | `9ad36c85-5858-4960-9935-e73c3698dd0c` | Token da API do SprintHub |
| `PORT` | `5001` | Porta da API (opcional, mas recomendado) |
| `NODE_ENV` | `production` | Ambiente (opcional) |

**⚠️ IMPORTANTE:**
- Verifique se os valores estão corretos
- Não deixe espaços antes ou depois dos valores
- Use exatamente os nomes das variáveis mostrados acima

---

## 🔍 Verificar Logs para Diagnosticar

### Como Acessar os Logs:

1. Na tela do serviço, procure pela seção **"Logs"**
2. Ou clique no ícone de **terminal** (📟) na barra de controle
3. Os logs devem mostrar qual variável está faltando

### Mensagens de Erro Esperadas:

Se uma variável estiver faltando, você verá algo como:
```
❌ Não foi possível ler SUPABASE_URL_FILE ou variáveis: SUPABASE_URL, VITE_SUPABASE_URL
```

Isso indica que a variável `SUPABASE_URL` não está configurada.

---

## 🚀 Após Configurar as Variáveis

### 1. Salvar as Variáveis
- Clique em **"Salvar"** ou **"Apply"** após adicionar todas as variáveis

### 2. Reiniciar o Serviço
- Clique no botão **"Implantar"** (Deploy) novamente
- Ou clique no ícone de **reiniciar** (🔄) na barra de controle

### 3. Verificar Logs
- Após reiniciar, verifique os logs
- Você deve ver mensagens como:
  ```
  🔧 Configurações carregadas:
     Supabase URL: https://agdffspstbxeqhqtltvb.supabase.co
     SprintHub: sprinthub-api-master.sprinthub.app
     Instância: oficialmed
  🚀 API de sincronização de oportunidades rodando na porta 5001
  ```

### 4. Verificar Status
- Os recursos (CPU, Memória) devem começar a ser utilizados
- O status deve mudar de "aguardando" para "rodando"

---

## ✅ Checklist de Configuração

Antes de considerar o problema resolvido, verifique:

- [ ] Todas as 7 variáveis de ambiente foram adicionadas
- [ ] Valores estão corretos (sem espaços extras)
- [ ] Variáveis foram salvas
- [ ] Serviço foi reiniciado após adicionar variáveis
- [ ] Logs mostram "API de sincronização rodando na porta 5001"
- [ ] Recursos (CPU/Memória) estão sendo utilizados
- [ ] Health check funciona: `GET /health`

---

## 🔍 Troubleshooting Adicional

### Se ainda estiver aguardando após configurar variáveis:

1. **Verificar se variáveis foram salvas:**
   - Volte nas configurações de variáveis
   - Confirme que todas estão lá

2. **Verificar logs completos:**
   - Role os logs para ver se há erros anteriores
   - Procure por mensagens de erro em vermelho

3. **Verificar se porta está configurada:**
   - Procure por configurações de porta
   - Certifique-se de que a porta 5001 está exposta

4. **Verificar build do Docker:**
   - Veja se o build do Docker foi bem-sucedido
   - Verifique se não há erros no Dockerfile

5. **Tentar rebuild:**
   - Forçar um novo build do Docker
   - Limpar cache se possível

---

## 🔄 Redeploy manual via Docker Swarm (EasyPanel / sprint-sync)

Se o botão **Deploy** do EasyPanel não trouxer a imagem mais recente, execute o redeploy manual via SSH na VPS:

```bash
ssh root@<seu-servidor>
cd /etc/easypanel/projects/sprint-sync
docker service scale sprint-sync_sincronizacao=0 && \
sleep 5 && \
docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && \
docker service scale sprint-sync_sincronizacao=1
```

**O que cada passo faz:**
1. Escala o serviço para 0 para derrubar a instância antiga.
2. Aguarda 5s para liberar recursos.
3. Atualiza o serviço usando a imagem `easypanel/sprint-sync/sincronizacao:latest` (gerada pelo EasyPanel) e força o redeploy.
4. Escala novamente para 1, subindo a instância já com o build mais recente.

> 💡 Após rodar o comando, valide com `docker service logs -f sprint-sync_sincronizacao` ou chamando `/health` para garantir que a nova versão está ativa.

---

## 📞 Se Nada Funcionar

Se após seguir todos os passos o serviço ainda não iniciar:

1. **Copie os logs completos** e verifique:
   - Mensagens de erro específicas
   - Qual variável está faltando
   - Se há problemas de conexão

2. **Verifique a configuração do Dockerfile:**
   - Certifique-se de que o Dockerfile está correto
   - Verifique se o caminho do Dockerfile está certo

3. **Verifique o repositório GitHub:**
   - Confirme que o repositório está acessível
   - Verifique se a branch está correta

---

**Última atualização:** 2025-11-06

