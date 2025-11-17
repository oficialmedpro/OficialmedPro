# 🔄 GUIA DE RECONSOLIDAÇÃO INCREMENTAL

## ⚠️ Problema do Timeout

O script original `reconsolidar-todos-dados.sql` estava dando timeout porque tentava processar TODAS as tabelas de uma vez. 

## ✅ Solução: Execução em Etapas

Execute os scripts **UM POR VEZ**, na ordem:

---

## 📝 ORDEM DE EXECUÇÃO

### ETAPA 1: Prime Clientes
```
CONSOLIDACAO_DADOS/reconsolidar-todos-dados-otimizado.sql
```
- Reconsolida todos os clientes do Prime (sistema prioritário)
- Processa 500 registros por vez
- Mostra progresso em tempo real

**⏱️ Tempo estimado:** 2-5 minutos (depende do volume)

---

### ETAPA 2: SprintHub Leads
```
CONSOLIDACAO_DADOS/reconsolidar-etapa-2-sprint.sql
```
- Reconsolida todos os leads do SprintHub
- Processa 500 registros por vez

**⏱️ Tempo estimado:** 3-10 minutos (depende do volume)

---

### ETAPA 3: GreatPage Leads
```
CONSOLIDACAO_DADOS/reconsolidar-etapa-3-greatpage.sql
```
- Reconsolida todos os leads do GreatPage
- Enriquece dados existentes

**⏱️ Tempo estimado:** 2-5 minutos

---

### ETAPA 4: BlackLabs
```
CONSOLIDACAO_DADOS/reconsolidar-etapa-4-blacklabs.sql
```
- Reconsolida registros do BlackLabs
- Complementa informações

**⏱️ Tempo estimado:** 1-3 minutos

---

### ETAPA 5: Estatísticas Finais
```
CONSOLIDACAO_DADOS/reconsolidar-etapa-5-estatisticas.sql
```
- Mostra resultado final da reconsolidação
- Estatísticas por fonte
- Percentuais de completude

**⏱️ Tempo estimado:** < 1 minuto

---

## 🎯 COMO EXECUTAR NO SUPABASE

1. Abra o **SQL Editor** no Supabase
2. Cole o conteúdo do script da **Etapa 1**
3. Clique em **Run**
4. Aguarde a conclusão (veja o progresso no output)
5. Repita para as etapas 2, 3, 4 e 5

---

## ⚙️ SE AINDA DER TIMEOUT

Caso alguma etapa específica ainda dê timeout, você pode:

1. **Reduzir o tamanho do lote**: Alterar `v_batch_size` de 500 para 250 ou 100
2. **Conectar diretamente ao banco**: Usar psql ou DBeaver com timeout maior
3. **Executar via API**: Usar o endpoint REST do Supabase

### Exemplo de redução do lote:

```sql
DECLARE
  v_batch_size INTEGER := 250; -- Era 500, agora 250
```

---

## 📊 O QUE CADA ETAPA FAZ

Cada script:
- ✅ Processa registros em lotes pequenos (500 por vez)
- ✅ Faz COMMIT incremental após cada lote
- ✅ Mostra progresso em tempo real
- ✅ Dispara os triggers de consolidação automaticamente
- ✅ Atualiza a tabela `clientes_mestre` com a nova lógica de prioridade

---

## 🔍 VERIFICAÇÃO

Após executar TODAS as etapas (1 a 5), a **Etapa 5** mostrará:

- Total de clientes consolidados
- % com email
- % com whatsapp
- % com CPF
- Distribuição por fonte (Prime, Sprint, GreatPage, BlackLabs)

---

## ⚡ VANTAGENS DESTA ABORDAGEM

✅ Evita timeout do Supabase  
✅ Permite pausar e continuar depois  
✅ Mostra progresso detalhado  
✅ Commit incremental (mais seguro)  
✅ Pode ser interrompido sem perder todo o trabalho  

---

## 🚨 IMPORTANTE

- Execute as etapas **NA ORDEM** (1 → 2 → 3 → 4 → 5)
- **Aguarde cada etapa terminar** antes de iniciar a próxima
- A ordem garante a **prioridade correta** dos dados
- Não execute o script original (`reconsolidar-todos-dados.sql`) mais

















