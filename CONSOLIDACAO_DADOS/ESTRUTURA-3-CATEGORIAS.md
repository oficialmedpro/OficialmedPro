# 🎯 SISTEMA DE GESTÃO DE CLIENTES - 3 CATEGORIAS

## 📋 ESTRUTURA COMPLETA:

```
👥 GESTÃO DE CLIENTES
├── 📊 Dashboard Gestão (visão geral de todas as categorias)
└── ✅ Validação Integridade (Prime vs Clientes Mestre)

🚀 ATIVAÇÃO (Nunca Compraram)
├── 📊 Dashboard Ativação
├── 🏢 Ativação - No Prime
├── 🚫 Ativação - Fora do Prime
├── 📋 Com Histórico de Orçamento
└── 📭 Sem Histórico de Orçamento

🔄 REATIVAÇÃO (90+ dias sem comprar)
├── 📊 Dashboard Reativação
├── 1️⃣ Compraram 1x
├── 2️⃣ Compraram 2x
├── 3️⃣ Compraram 3x
└── 🔥 Compraram 3+ vezes

👀 MONITORAMENTO (Últimos 90 dias)
├── 📊 Dashboard Monitoramento
├── 🟢 1-29 dias (compra muito recente)
├── 🟡 30-59 dias (compra recente)
└── 🟠 60-90 dias (precisa monitorar)
```

---

## 🎨 DEFINIÇÕES DAS CATEGORIAS:

### 🚀 **ATIVAÇÃO** (Nunca Compraram)
**Objetivo:** Converter clientes que nunca fizeram uma compra aprovada.

**Critério:** 
- Clientes em `clientes_mestre`
- **NÃO** possuem pedidos com `status_aprovacao = 'APROVADO'` em `prime_pedidos`

**Subdivisões:**
1. **No Prime**: Tem `id_prime`, mas nunca compraram
2. **Fora do Prime**: Não tem `id_prime` (estão apenas em outras origens)
3. **Com Histórico de Orçamento**: Têm pedidos com status diferente de 'APROVADO'
4. **Sem Histórico de Orçamento**: Nunca fizeram nem orçamento

---

### 🔄 **REATIVAÇÃO** (90+ dias sem comprar)
**Objetivo:** Recuperar clientes que já compraram mas estão inativos há 90+ dias.

**Critério:**
- Clientes em `clientes_mestre` com `id_prime`
- Possuem pelo menos 1 pedido com `status_aprovacao = 'APROVADO'`
- Última compra aprovada foi há **mais de 90 dias**

**Subdivisões por frequência de compra:**
1. **Compraram 1x**: Frequência mais baixa
2. **Compraram 2x**: Frequência baixa
3. **Compraram 3x**: Frequência média
4. **Compraram 3+ vezes**: Clientes recorrentes que pararam (ALTA PRIORIDADE!)

---

### 👀 **MONITORAMENTO** (Últimos 90 dias)
**Objetivo:** Manter engajamento com clientes ativos recentes.

**Critério:**
- Clientes em `clientes_mestre` com `id_prime`
- Possuem pelo menos 1 pedido com `status_aprovacao = 'APROVADO'`
- Última compra aprovada foi nos **últimos 90 dias**

**Subdivisões por recência:**
1. **🟢 1-29 dias**: Compra muito recente, feedback/satisfação
2. **🟡 30-59 dias**: Compra recente, ofertas complementares
3. **🟠 60-90 dias**: Atenção! Próximo de virar reativação

---

## 📊 DASHBOARD GESTÃO (Principal)

Mostra métricas consolidadas:

```sql
SELECT
    -- Total Geral
    (SELECT COUNT(*) FROM api.clientes_mestre) AS total_clientes_mestre,
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE id_prime IS NOT NULL) AS total_com_id_prime,
    
    -- ATIVAÇÃO (Nunca Compraram)
    (SELECT COUNT(*) FROM api.clientes_mestre cm 
     WHERE NOT EXISTS (
       SELECT 1 FROM api.prime_pedidos pp 
       WHERE pp.cliente_id = cm.id_prime 
       AND pp.status_aprovacao = 'APROVADO'
     )) AS total_ativacao,
    
    (SELECT COUNT(*) FROM api.clientes_mestre cm 
     WHERE id_prime IS NOT NULL 
     AND NOT EXISTS (
       SELECT 1 FROM api.prime_pedidos pp 
       WHERE pp.cliente_id = cm.id_prime 
       AND pp.status_aprovacao = 'APROVADO'
     )) AS ativacao_no_prime,
    
    (SELECT COUNT(*) FROM api.clientes_mestre cm 
     WHERE id_prime IS NULL) AS ativacao_fora_prime,
    
    -- REATIVAÇÃO (90+ dias)
    (SELECT COUNT(*) FROM api.clientes_mestre cm
     WHERE cm.id_prime IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM api.prime_pedidos pp
       WHERE pp.cliente_id = cm.id_prime
       AND pp.status_aprovacao = 'APROVADO'
     )
     AND (NOW() - (
       SELECT MAX(pp.data_pedido)
       FROM api.prime_pedidos pp
       WHERE pp.cliente_id = cm.id_prime
       AND pp.status_aprovacao = 'APROVADO'
     )) > INTERVAL '90 days') AS total_reativacao,
    
    -- MONITORAMENTO (0-90 dias)
    (SELECT COUNT(*) FROM api.clientes_mestre cm
     WHERE cm.id_prime IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM api.prime_pedidos pp
       WHERE pp.cliente_id = cm.id_prime
       AND pp.status_aprovacao = 'APROVADO'
     )
     AND (NOW() - (
       SELECT MAX(pp.data_pedido)
       FROM api.prime_pedidos pp
       WHERE pp.cliente_id = cm.id_prime
       AND pp.status_aprovacao = 'APROVADO'
     )) <= INTERVAL '90 days') AS total_monitoramento;
```

---

## 🔍 VIEWS SQL NECESSÁRIAS:

### 1. **Dashboard Gestão**
- `vw_dashboard_reativacao` ✅ (já existe, serve para o dashboard geral)

### 2. **Ativação (Nunca Compraram)**
- `vw_inativos_prime` ✅ (renomear logicamente para "ativacao_prime")
- `vw_inativos_fora_prime` ✅ (renomear logicamente para "ativacao_fora_prime")
- `vw_inativos_com_orcamento` ✅ (renomear logicamente para "ativacao_com_orcamento")
- `vw_inativos_sem_orcamento` ✅ (renomear logicamente para "ativacao_sem_orcamento")

### 3. **Reativação (90+ dias)**
- `vw_para_reativacao` ✅ (todos)
- `vw_reativacao_1x` ✅
- `vw_reativacao_2x` ✅
- `vw_reativacao_3x` ✅
- `vw_reativacao_3x_plus` ✅

### 4. **Monitoramento (0-90 dias)**
- `vw_para_monitoramento` ✅ (todos)
- `vw_monitoramento_1_29_dias` ✅
- `vw_monitoramento_30_59_dias` ✅
- `vw_monitoramento_60_90_dias` ✅

### 5. **Validação**
- `vw_validacao_integridade` ✅

### 6. **Histórico**
- `vw_historico_pedidos_cliente` ✅

---

## ✅ STATUS DA IMPLEMENTAÇÃO:

### BACKEND (SQL) ✅
- [x] 17 Views criadas
- [x] Permissões configuradas
- [x] Todas as queries otimizadas

### FRONTEND (React) ⚠️ **70% Completo**
- [x] Menu reorganizado com 3 categorias
- [x] Estados criados
- [x] Funções de carregamento criadas
- [x] Switch cases adicionados
- [ ] **FALTAM**: Funções de renderização completas
- [ ] **FALTAM**: Cases no renderTabContent()
- [ ] **FALTAM**: Sistema de exportação com marcação de ações

---

## 📝 NOMENCLATURA:

| Termo Antigo | Termo Correto | Categoria |
|--------------|---------------|-----------|
| "Inativos" | **Ativação** | Nunca compraram |
| "Ativos" | **Monitoramento** | Compraram recentemente |
| "Para Reativação" | **Reativação** | Compraram há 90+ dias |

---

## 🎯 PRIORIDADES DE AÇÃO:

### 🔴 ALTA PRIORIDADE:
1. **Reativação 3+ vezes**: Clientes recorrentes que pararam
2. **Ativação com Orçamento**: Quase converteram
3. **Monitoramento 60-90 dias**: Perto de virar reativação

### 🟡 MÉDIA PRIORIDADE:
4. **Reativação 2-3x**: Clientes com histórico
5. **Ativação no Prime**: Já cadastrados
6. **Monitoramento 30-59 dias**: Engajamento contínuo

### 🟢 BAIXA PRIORIDADE:
7. **Reativação 1x**: Só compraram uma vez
8. **Ativação fora do Prime**: Sem histórico
9. **Monitoramento 1-29 dias**: Muito recente

---

**Data:** 27/10/2025  
**Versão:** 2.0 (Reorganização com 3 Categorias)  
**Status:** Backend 100% | Frontend 70%

