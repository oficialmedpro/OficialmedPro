# 📋 INSTRUÇÕES PARA CLAUDE CODE - PROJETO SYNC-API

## 🎯 OBJETIVO

Corrigir a sincronização do campo `data_criacao` na tabela `prime_pedidos` que está vindo NULL do Firebird.

---

## 📁 ARQUIVO DE DOCUMENTAÇÃO COMPLETA

**Envie este arquivo para o Claude Code:**
```
CONSOLIDACAO_DADOS/PROBLEMA-DATA-CRIACAO-CONTEXTO.md
```

Este arquivo contém TUDO o que o Claude Code precisa saber sobre o problema.

---

## 🔍 RESUMO DO PROBLEMA

### **Situação Atual:**
- Campo `data_criacao` está **NULL** em todos os pedidos no Supabase
- Campo `data_aprovacao` tem valores (2025-06-04...)
- Campo `created_at` tem valores (2025-10-22...)
- Campo `data_entrega` tem valores para alguns

### **Estrutura no Supabase:**
- Tabela: `api.prime_pedidos`
- Campo problemático: `data_criacao` (timestamp, está NULL)

### **Origem dos Dados:**
- Firebird (Banco Prime)
- Projeto de sincronização: `C:\Banco de Dados Prime\sync-api`
- Cronjob que importa dados para Supabase

---

## ✅ O QUE PRECISA SER FEITO

### **No projeto `sync-api`:**
1. Verificar o arquivo que sincroniza a tabela `prime_pedidos`
2. Verificar o mapeamento do campo de data
3. Corrigir para mapear o campo correto do Firebird
4. Re-executar a sincronização

### **Qual campo do Firebird usar?**
Provavelmente algum destes:
- `DATA_PEDIDO`
- `DATA_CADASTRO`  
- `DT_CRIACAO`
- `DATA_CREACAO`

---

## 🧪 COMO TESTAR APÓS A CORREÇÃO

Execute este SQL no Supabase para verificar:

```sql
SELECT 
    COUNT(*) as total_pedidos,
    COUNT(data_criacao) as pedidos_com_data_criacao,
    MIN(data_criacao) as data_mais_antiga,
    MAX(data_criacao) as data_mais_recente
FROM api.prime_pedidos
WHERE status_aprovacao = 'APROVADO';
```

**Resultado esperado:**
- `pedidos_com_data_criacao` deve ser igual a `total_pedidos`
- `data_mais_antiga` e `data_mais_recente` devem ter valores (não NULL)

---

## 📊 DADOS ATUAIS NO SUPABASE

- Total de pedidos: **16.808**
- Pedidos aprovados: **8.848**
- Pedidos com `data_criacao` preenchido: **0** ❌
- Pedidos com `data_aprovacao` preenchido: **8.848** ✅
- Pedidos com `created_at` preenchido: **16.808** ✅

---

## 🎯 PRIORIDADE

⚠️ **ALTA** - Este campo é essencial para:
- Sistema de reativação de clientes
- Análise de comportamento de compra
- Classificação de clientes (Ativos/Reativar/Monitorar)

---

## 💡 INFORMAÇÕES ÚTEIS

### **Tabelas Relacionadas:**
- `api.prime_pedidos` - Tabela com problema
- `api.prime_clientes` - Tabela de clientes (sem problema)
- `api.clientes_mestre` - Tabela de consolidação

### **Dependências:**
- Views SQL criadas estão prontas e aguardando os dados
- Após correção, executar `06-views-sistema-reativacao.sql`
- Sistema de dashboard React aguardando dados corretos

---

## 📝 CONTATO

Após corrigir, avisar para:
1. Re-executar as views SQL
2. Validar os dados retornados
3. Testar o sistema de gestão de clientes

---

**Boa sorte na correção!** 🚀


