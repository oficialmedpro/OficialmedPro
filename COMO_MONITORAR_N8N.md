# 📊 Como Monitorar n8n Autohospedado

## 🎯 Onde Ver Execuções e Métricas no n8n

### 1️⃣ **Menu Principal - Executions (Execuções)**

No menu lateral esquerdo do n8n, procure por:
- **"Executions"** (ou "Execuções" em PT-BR)
- Este é o local principal para ver todas as execuções

Na página de Executions você verá:
- ✅ Execuções bem-sucedidas (verde)
- ❌ Execuções com erro (vermelho)
- ⏸️ Execuções em progresso
- 📊 Tempo de execução
- 📅 Data/hora de cada execução
- 🔍 Filtros por status, data, workflow, etc.

### 2️⃣ **No Workflow Específico**

Quando você abrir um workflow:
- Clique no workflow
- Na parte inferior, há uma aba **"Executions"** ou **"Execuções"**
- Mostra as últimas execuções daquele workflow específico

### 3️⃣ **Via Terminal/Logs (Mais Detalhado)**

Para ver logs em tempo real do n8n:

```bash
# Se estiver usando Docker
docker logs -f n8n

# Ou se tiver o nome do container diferente
docker ps  # para ver o nome
docker logs -f [nome-do-container]

# Se estiver usando npm/node diretamente
# Os logs aparecem no terminal onde você iniciou o n8n
```

### 4️⃣ **Monitoramento do Servidor (Recursos)**

Para verificar CPU, Memória, etc:

```bash
# CPU e Memória
htop
# ou
top

# Memória específica
free -h

# Uso de disco
df -h

# Processos do n8n
ps aux | grep n8n
```

### 5️⃣ **Configurações de Métricas (Se Disponível)**

Algumas versões do n8n têm métricas habilitadas por padrão:
- Vá em **Settings → Metrics** (pode não existir em todas as versões)
- Ou verifique se há opção de habilitar métricas no Settings

## 📈 O Que Verificar

### Indicadores Importantes:

1. **Taxa de Sucesso:**
   - Quantas execuções estão dando certo vs erro?
   - Se muitas falhando, pode ser problema de recurso ou configuração

2. **Tempo de Execução:**
   - Workflows muito lentos podem indicar sobrecarga
   - Normal: alguns segundos a poucos minutos
   - Problema: execuções demorando muito (5min+)

3. **Fila de Execuções:**
   - Se muitas execuções ficarem "pending" (pendentes)
   - Isso indica que o servidor está sobrecarregado

4. **Erros Comuns:**
   - Timeout: servidor não consegue processar a tempo
   - Memory errors: falta de RAM
   - Connection errors: problemas de rede/conexão

## 🔍 Como Verificar se Está Tudo OK

### Teste Rápido:

1. **Acesse n8n** → Menu lateral → **"Executions"**
2. **Filtre por "Today" (Hoje)**
3. **Verifique:**
   - ✅ Maioria das execuções em verde (sucesso)?
   - ⏱️ Tempo de execução razoável?
   - ❌ Muitas falhas? (se sim, veja os erros)

### Se Ver Muitos Erros:

- Clique em uma execução com erro
- Veja a mensagem de erro específica
- Erros comuns:
  - `ECONNREFUSED`: problema de conexão
  - `ETIMEDOUT`: timeout
  - `Out of memory`: falta de RAM
  - `Rate limit`: se estiver usando API externa com limite

## 💡 Dicas

- O n8n autohospedado não tem limite de requisições por si só
- O limite é a capacidade do seu servidor (CPU/RAM)
- Se estiver processando muitos webhooks do SprintHub sem problemas, está tudo OK
- Preocupe-se apenas se começar a ver muitos erros ou execuções muito lentas

