# 🐛 PROBLEMA: CAMPO `data_criacao` NULL EM PRIME_PEDIDOS

## 📋 CONTEXTO

Criamos um sistema de Gestão de Clientes com 3 categorias:
- 🚀 **ATIVAÇÃO** (Nunca compraram)
- 🔄 **REATIVAÇÃO** (90+ dias sem comprar)
- 👀 **MONITORAMENTO** (0-90 dias)

O sistema usa **17 views SQL** que dependem da data dos pedidos para calcular:
- Última compra de cada cliente
- Dias desde a última compra
- Classificação (Ativação/Reativação/Monitoramento)

---

## 🚨 PROBLEMA IDENTIFICADO

### **Sintoma:**
- `data_criacao` está **NULL** em TODOS os registros de `prime_pedidos`
- `data_aprovacao` tem valores (ex: 2025-06-04 19:55:18.442)
- `data_entrega` tem valores para alguns pedidos
- `data_cancelamento` está NULL em todos

### **Evidência:**
Quando executamos uma query para verificar:
```sql
SELECT 
    cm.nome_completo,
    pa.ultima_compra,
    EXTRACT(DAYS FROM NOW() - pa.ultima_compra)::INTEGER as dias_sem_compra
FROM api.clientes_mestre cm
INNER JOIN (
    SELECT 
        cliente_id,
        MAX(data_criacao) as ultima_compra  -- ❌ NULL!
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pa ON cm.id_prime = pa.cliente_id
```

**Resultado:** Todos os valores de `ultima_compra` são NULL

---

## ✅ SOLUÇÃO TEMPORÁRIA APLICADA

Mudamos as views para usar `data_aprovacao` ao invés de `data_criacao`:

### **ANTES (Não funciona):**
```sql
MAX(data_criacao) as ultima_compra
```

### **DEPOIS (Funciona temporariamente):**
```sql
MAX(data_aprovacao) as ultima_compra
```

---

## 📁 ARQUIVOS AFETADOS

### **SQL Corrigido:**
- `CONSOLIDACAO_DADOS/06-views-sistema-reativacao.sql`

**Correções feitas:**
1. Linha ~63-64: `MAX(data_criacao)` → `MAX(data_aprovacao)`
2. Linha ~123: `THEN data_criacao END` → `THEN data_aprovacao END`
3. Linha ~122: `MAX(data_criacao)` → `MAX(created_at)` (para orçamentos)
4. Todas as outras ocorrências de `data_criacao` foram substituídas

---

## 🎯 O QUE PRECISA SER FEITO NO PROJETO `sync-api`

### **Localização do Problema:**
```
C:\Banco de Dados Prime\sync-api
```

### **Tarefas:**

1. **🔍 Verificar o mapeamento de campos no script de sincronização de pedidos**
   - Procurar arquivo que sincroniza `prime_pedidos`
   - Verificar se o campo `data_criacao` está sendo mapeado do Firebird

2. **🔍 Verificar o nome correto do campo no Firebird**
   - Pode ser `DATA_PEDIDO`, `DATA_CADASTRO`, `DT_CRIACAO` ou outro nome
   - Comparar com a estrutura da tabela no Firebird

3. **🔧 Corrigir o mapeamento**
   - Adicionar/corrigir o mapeamento do campo de data
   - Garantir que a data seja convertida corretamente

4. **🔄 Re-sincronizar os dados**
   - Executar a sincronização novamente para preencher `data_criacao`
   - Opcional: Fazer um UPDATE em lote para preencher com `created_at` se não tiver histórico

---

## 🔄 PRÓXIMOS PASSOS DEPOIS DA CORREÇÃO

### **Opção 1: Se `data_criacao` for corrigido no Supabase**
- Reverter as mudanças para usar `data_criacao` ao invés de `data_aprovacao`
- `data_criacao` é o campo ideal porque representa a data REAL de criação do pedido
- `data_aprovacao` pode ser diferente (pedido criado em uma data, aprovado em outra)

### **Opção 2: Se continuar usando `data_aprovacao`**
- Manter as views como estão agora
- Funciona, mas pode ter alguns dias de diferença entre criação e aprovação

---

## 📊 IMPACTO DO PROBLEMA

### **Se não corrigir:**
- Sistema de reativação funciona, mas usando datas de aprovação
- Pode haver diferença de dias entre criação real e aprovação
- Clientes podem ser classificados incorretamente por essa diferença

### **Se corrigir:**
- Sistema funcionará com datas precisas
- Classificação de clientes será 100% correta
- Análises de comportamento mais precisas

---

## 🧪 COMO TESTAR DEPOIS DA CORREÇÃO

Execute este SQL para verificar:

```sql
-- Verificar se data_criacao está preenchido
SELECT 
    COUNT(*) as total_pedidos,
    COUNT(data_criacao) as pedidos_com_data_criacao,
    COUNT(data_aprovacao) as pedidos_com_data_aprovacao,
    COUNT(data_entrega) as pedidos_com_data_entrega
FROM api.prime_pedidos
WHERE status_aprovacao = 'APROVADO';
```

**Esperado:**
- `pedidos_com_data_criacao` deve ser igual a `total_pedidos` (ou próximo)
- Se ainda for 0, o problema persiste

---

## 📝 COORDENAÇÃO ENTRE PROJETOS

### **No projeto `minha-pwa` (este):**
- ✅ Views SQL criadas com workaround usando `data_aprovacao`
- ⏳ Aguardando correção do `data_criacao` no sync-api
- 📋 Depois da correção: atualizar views para usar `data_criacao`

### **No projeto `sync-api`:**
- 🔧 Verificar mapeamento de campos do Firebird
- 🔧 Corrigir sincronização de `data_criacao`
- 🔄 Re-sincronizar dados

---

## 💡 INFORMAÇÕES ÚTEIS PARA O DESENVOLVEDOR

### **Estrutura Esperada:**
- Tabela de origem: Firebird (nome desconhecido, verificar)
- Campo origem: Provavelmente algo como `DATA_PEDIDO` ou `DATA_CADASTRO`
- Tabela destino: `api.prime_pedidos`
- Campo destino: `data_criacao` (tipo: timestamp)

### **Dados Observados:**
- Total de pedidos: ~16.808
- Pedidos aprovados: ~8.848
- Todos os `data_criacao` estão NULL
- `created_at` tem valores (2025-10-22...)
- `data_aprovacao` tem valores (2025-06-04...)
- `data_entrega` tem valores para alguns (2025-06-16...)

### **Prioridade:**
⚠️ **ALTA** - Afeta análise precisa de comportamento de clientes

---

**Data:** 27/10/2025  
**Status:** Workaround implementado, correção pendente  
**Responsável Correção:** Projeto `sync-api`


