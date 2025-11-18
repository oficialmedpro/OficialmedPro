# 🚨 PROBLEMA: Leads Sem Campos Críticos

## 📊 Situação Atual

**Total de Leads:** 80.945  
**Com firstname:** 51 (0.06%)  
**Com lastname:** 23 (0.03%)  
**Com whatsapp:** 51 (0.06%)  
**Com nome OU sobrenome:** 51 (0.06%)

**99.94% dos leads NÃO têm campos críticos!**

---

## 🔍 Análise do Problema

### Dados Observados:

1. **Leads com dados:** Sincronizados em **25/10/2025** (antigos)
2. **Leads sem dados:** Sincronizados em **18/11/2025** (recentes)

Isso indica que:
- A sincronização mais recente **NÃO está pegando os campos corretamente**
- O problema começou após outubro
- Pode ser mudança na API do SprintHub ou no código

---

## 🔎 Possíveis Causas

### 1. API SprintHub não retorna campos mesmo com `allFields=1`
- O parâmetro `allFields=1` pode não estar funcionando
- A API pode ter mudado a estrutura de resposta
- Os campos podem estar em locais diferentes

### 2. Problema no Mapeamento
- Os campos podem ter nomes diferentes no SprintHub
- A função `getField` pode não estar encontrando os campos
- Pode haver campos aninhados ou em objetos

### 3. Dados realmente não existem no SprintHub
- Os leads podem não ter esses dados cadastrados
- Pode ser que apenas leads antigos tenham dados

---

## 🧪 Como Investigar

### 1. Verificar Estrutura Real dos Dados do SprintHub

```bash
# Ver logs da sincronização para ver estrutura do primeiro lead
docker service logs sprint-sync_sincronizacao 2>&1 | grep "DEBUG - Estrutura do primeiro lead"
```

Isso mostrará a estrutura real que está vindo da API.

### 2. Testar API Diretamente

```bash
# Fazer requisição manual para ver estrutura
curl "https://sprinthub-api-master.sprinthub.app/leads?i=oficialmed&page=0&limit=1&allFields=1&apitoken=SEU_TOKEN" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 3. Verificar Campos Alternativos

Os leads podem ter dados em campos diferentes:
- `name` ao invés de `firstname`
- `fullName` ao invés de `firstname` + `lastname`
- `contacts` (array) com telefones
- Campos aninhados em objetos

---

## 🔧 Soluções Possíveis

### Solução 1: Verificar Estrutura Real e Ajustar Mapeamento

1. Ver logs da sincronização para ver estrutura real
2. Ajustar `mapLeadToSupabase` para mapear campos corretos
3. Adicionar mais variações de nomes de campos

### Solução 2: Buscar Dados Individuais

Se a API em lote não retorna todos os campos:
- Buscar detalhes individuais de leads sem campos críticos
- Usar endpoint `/leads/{id}` com `allFields=1`

### Solução 3: Verificar se Dados Existem no SprintHub

- Verificar diretamente no SprintHub se os leads têm esses dados
- Pode ser que os dados realmente não existam

---

## 📋 Próximos Passos

1. ✅ Verificar logs da sincronização para ver estrutura real
2. ✅ Testar API do SprintHub diretamente
3. ✅ Verificar se `allFields=1` está funcionando
4. ✅ Ajustar mapeamento se necessário
5. ✅ Re-sincronizar leads após correção

---

**Status:** 🔴 PROBLEMA CRÍTICO - 99.94% dos leads sem campos críticos  
**Prioridade:** ALTA  
**Última atualização:** 18/11/2025

