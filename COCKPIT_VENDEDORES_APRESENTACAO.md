# 📊 Cockpit de Vendedores - Beta

**URL:** https://beta.oficialmed.com.br/cockpit-vendedores

---

## ✅ O que o Cockpit já está mostrando?

### 📈 Métricas Diárias (Topo do Card)
- **Entrada** - Quantidade de leads que entraram no funil
- **Orçamentos** - Quantidade de orçamentos realizados
- **Vendas** - Quantidade de vendas fechadas
- **Valor** - Valor total em R$ das vendas
- **Ticket Médio** - Valor médio por venda (R$)
- **Conversão** - Taxa de conversão Entrada → Venda (%)

### ⏰ Métricas por Ronda (Tabela no meio do Card)
Mesmas métricas acima, mas divididas por horário:
- **10h, 12h, 14h, 16h, 18h** (Segunda a Sexta)
- **10h, 12h** (Sábado)

### 📊 Taxas (Abaixo das métricas diárias)
- **Qualificação** - Taxa de qualificação (Entrada → Orçamento/Negociação)
  - Mostra quantos leads que entraram geraram orçamento ou negociação
- **Conversão** - Taxa de conversão (Orçamento → Venda)
  - Mostra quantos orçamentos viraram venda

---

## 🌡️ Controle de Temperatura (Cores)

O sistema usa **4 níveis de temperatura** baseados na porcentagem realizada em relação à meta:

### 🟢 Verde (`good`) - **100% ou acima da meta**
- **Cor:** #22c55e (Verde bem vivo)
- **Quando:** Meta atingida ou superada
- **Exemplo:** Meta de 100 entradas, realizou 100 ou mais

### 🟡 Amarelo Claro (`warning-light`) - **81% a 99% da meta**
- **Cor:** #a3e635 (Amarelo quase verde)
- **Quando:** Muito próximo da meta, mas ainda faltando um pouco
- **Exemplo:** Meta de 100 entradas, realizou 81 a 99

### 🟠 Laranja (`warning`) - **51% a 80% da meta**
- **Cor:** #f59e0b (Laranja/amarelo)
- **Quando:** Acima da metade, mas ainda abaixo do esperado
- **Exemplo:** Meta de 100 entradas, realizou 51 a 80

### 🔴 Vermelho (`bad`) - **0% a 50% da meta**
- **Cor:** #ef4444 (Vermelho)
- **Quando:** Abaixo da metade da meta
- **Exemplo:** Meta de 100 entradas, realizou 0 a 50

---

## 📋 Regra de Cálculo

```javascript
Porcentagem = (Valor Realizado / Valor da Meta) × 100

Se Porcentagem >= 100%  → Verde 🟢
Se Porcentagem >= 81%   → Amarelo Claro 🟡
Se Porcentagem >= 51%   → Laranja 🟠
Se Porcentagem < 51%    → Vermelho 🔴
```

---

## 🎯 Onde as cores aparecem?

As cores são aplicadas em:
- **Valores realizados** (números principais)
- **Porcentagens de realização** (ex: "85% (falta 15%)")
- **Variações** (diferença entre meta e realizado)

---

## 📝 Exemplo Prático

**Meta:** 100 entradas  
**Realizado:** 75 entradas

**Cálculo:**
- Porcentagem = (75 / 100) × 100 = 75%
- Como 75% está entre 51% e 80% → **Cor Laranja** 🟠

**Exibição:**
- Número "75" aparece em laranja
- Texto "75% (falta 25%)" aparece em laranja

---

## 🔧 Configuração Atual

- **Funil:** Comercial Apucarana (Funil ID: 6)
- **Vendedores configurados:** Através da tabela `cockpit_vendedores_config`
- **Metas:** Configuradas na tabela `cockpit_metas_vendedores` (metas diárias)
- **Metas por ronda:** Configuradas na tabela `cockpit_metas_rondas` (metas por horário)

---

**Status:** ✅ Em Beta - Funcionando  
**Última atualização:** 22/12/2025

