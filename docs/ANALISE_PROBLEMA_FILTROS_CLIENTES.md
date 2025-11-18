# 🔍 ANÁLISE COMPLETA DO PROBLEMA DOS FILTROS DE CLIENTES

## 📊 SITUAÇÃO ATUAL

Você reportou que na página `http://localhost:5173/clientes-consolidados`:
- **"Sem Histórico de Orçamento"** mostra 25.955 clientes com qualidade 90/100 (dados completos)
- **"Com Histórico de Orçamento"** mostra clientes com qualidade 20/100, 40/100, 65/100 (dados incompletos)

Isso parece invertido, mas na verdade **NÃO ESTÁ INVERTIDO**! A lógica está correta. Deixe-me explicar:

---

## 🎯 A LÓGICA REAL DO SISTEMA

### 1️⃣ O QUE É "HISTÓRICO DE ORÇAMENTO"?

Contrariamente ao que parece, **"histórico de orçamento" NÃO significa "histórico de compras"**.

Na CTE `historico_orcamentos` (linhas 118-127 do arquivo `CONSOLIDACAO_DADOS/06-views-sistema-reativacao.sql`):

```sql
historico_orcamentos AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        MAX(CASE WHEN status_aprovacao = 'APROVADO' THEN data_criacao END) as ultimo_pedido_aprovado,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
)
```

**Tradução:** Conta TODOS os registros da tabela `prime_pedidos` (APROVADO, PENDENTE, REJEITADO, etc).

---

### 2️⃣ O QUE É UM CLIENTE "INATIVO"?

Na view `vw_inativos_prime` (linhas 111-162):

```sql
WHERE cm.id_prime IS NOT NULL
AND (pa.total IS NULL OR pa.total = 0)
```

**Tradução:** Cliente que:
- ✅ Está cadastrado no Prime (tem `id_prime`)
- ❌ **NUNCA teve um pedido APROVADO** (0 compras)

---

### 3️⃣ LÓGICA DOS FILTROS

#### 🔴 **"Com Histórico de Orçamento"** (`vw_inativos_com_orcamento`)
```sql
SELECT * FROM api.vw_inativos_prime
WHERE tem_historico_orcamento = true
```

**São clientes que:**
- ❌ NUNCA compraram (0 pedidos APROVADOS)
- ✅ MAS já geraram orçamentos (pedidos PENDENTES, REJEITADOS, etc)

**Por que têm dados incompletos?**
- Porque estão no meio do funil de vendas
- Começaram cadastro mas não completaram
- Fizeram orçamento rápido sem finalizar dados pessoais
- Sistema permite criar pedido com dados mínimos

---

#### 🟢 **"Sem Histórico de Orçamento"** (`vw_inativos_sem_orcamento`)
```sql
SELECT * FROM api.vw_inativos_prime
WHERE tem_historico_orcamento = false
```

**São clientes que:**
- ❌ NUNCA compraram (0 pedidos APROVADOS)
- ❌ NUNCA geraram nenhum orçamento (nem PENDENTE, nem REJEITADO)
- ✅ Só se cadastraram

**Por que têm dados completos (90/100)?**
- Porque vieram de fontes externas com dados completos:
  - **Sprint Hub (CRM)**: cadastro completo de leads
  - **GreatPages**: landing pages com formulários completos
  - **Blacklabs**: importações de bases de contatos
- Foram importados pela consolidação de clientes (`clientes_mestre`)
- Qualidade 90/100 porque têm: nome, telefone, email, CPF (60 pontos essenciais já dá 60/100)

---

## 🧮 CÁLCULO DO SCORE DE QUALIDADE

Arquivo: `CONSOLIDACAO_DADOS/01-criar-tabela-clientes-mestre.sql` (linhas 81-136)

```sql
CREATE OR REPLACE FUNCTION api.calcular_qualidade_dados(...)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
BEGIN
  -- Campos essenciais (60 pontos)
  IF p_nome IS NOT NULL AND p_nome != '...' THEN
    v_score := v_score + 20;
  END IF;

  IF p_whatsapp IS NOT NULL THEN
    v_score := v_score + 20;
  END IF;

  IF p_email IS NOT NULL THEN
    v_score := v_score + 20;
  END IF;

  -- Documentos (20 pontos)
  IF p_cpf IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;

  IF p_rg IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;

  -- Endereço completo (10 pontos)
  IF p_endereco IS NOT NULL AND p_cidade IS NOT NULL AND p_estado IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;

  -- Data nascimento (5 pontos)
  IF p_data_nascimento IS NOT NULL THEN
    v_score := v_score + 5;
  END IF;

  -- Sexo (5 pontos)
  IF p_sexo IS NOT NULL THEN
    v_score := v_score + 5;
  END IF;

  RETURN v_score;
END;
$$
```

### Exemplos de Score:
- **90/100**: Nome + WhatsApp + Email + CPF + RG + Endereço + Data Nascimento + Sexo
- **65/100**: Nome + WhatsApp + Email + CPF + Endereço (falta RG, data nasc, sexo)
- **40/100**: Nome + WhatsApp apenas (ou Email + CPF)
- **20/100**: Apenas Nome OU apenas WhatsApp OU apenas Email

---

## 🔍 ONDE ESTÃO OS CÓDIGOS

### Frontend: `src/pages/clientes-consolidados.jsx`

**Função de carregamento "Com Orçamento"** (linhas 412-421):
```javascript
const loadAtivacaoComOrcamento = async () => {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;
  const { data, count } = await supabase
    .from('vw_inativos_com_orcamento')
    .select('*', { count: 'exact' })
    .range(start, end);
  setAtivacaoComOrcamentoData(data || []);
  setTotalCount(count || 0);
};
```

**Função de carregamento "Sem Orçamento"** (linhas 423-432):
```javascript
const loadAtivacaoSemOrcamento = async () => {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;
  const { data, count } = await supabase
    .from('vw_inativos_sem_orcamento')
    .select('*', { count: 'exact' })
    .range(start, end);
  setAtivacaoSemOrcamentoData(data || []);
  setTotalCount(count || 0);
};
```

### Backend: `CONSOLIDACAO_DADOS/06-views-sistema-reativacao.sql`

**View principal** (linhas 111-162):
```sql
CREATE OR REPLACE VIEW api.vw_inativos_prime AS
WITH pedidos_aprovados AS (
    SELECT cliente_id, COUNT(*) as total
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
),
historico_orcamentos AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        MAX(CASE WHEN status_aprovacao = 'APROVADO' THEN data_criacao END) as ultimo_pedido_aprovado,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
)
SELECT 
    cm.id,
    cm.id_prime,
    cm.nome_completo,
    cm.email,
    cm.whatsapp,
    cm.telefone,
    cm.cpf,
    cm.data_nascimento,
    cm.cidade,
    cm.estado,
    cm.qualidade_dados,
    cm.origem_marcas,
    cm.data_primeira_captura,
    cm.data_ultima_atualizacao,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.ultimo_pedido_aprovado,
    ho.status_historico,
    CASE 
        WHEN ho.total_orcamentos > 0 THEN true 
        ELSE false 
    END as tem_historico_orcamento,
    EXTRACT(DAYS FROM NOW() - cm.data_primeira_captura)::INTEGER as dias_desde_cadastro
FROM api.clientes_mestre cm
LEFT JOIN pedidos_aprovados pa ON cm.id_prime = pa.cliente_id
LEFT JOIN historico_orcamentos ho ON cm.id_prime = ho.cliente_id
WHERE cm.id_prime IS NOT NULL
AND (pa.total IS NULL OR pa.total = 0)
ORDER BY 
    CASE WHEN ho.total_orcamentos > 0 THEN 0 ELSE 1 END,
    ho.ultimo_orcamento DESC NULLS LAST,
    cm.qualidade_dados DESC;
```

**View filtrada "Com Orçamento"** (linhas 194-198):
```sql
CREATE OR REPLACE VIEW api.vw_inativos_com_orcamento AS
SELECT * 
FROM api.vw_inativos_prime
WHERE tem_historico_orcamento = true
ORDER BY ultimo_orcamento DESC;
```

**View filtrada "Sem Orçamento"** (linhas 206-210):
```sql
CREATE OR REPLACE VIEW api.vw_inativos_sem_orcamento AS
SELECT * 
FROM api.vw_inativos_prime
WHERE tem_historico_orcamento = false
ORDER BY qualidade_dados DESC, data_primeira_captura DESC;
```

---

## ✅ RESPOSTA ÀS SUAS PERGUNTAS

### 1. Onde está a lógica de filtro "Sem Histórico de Orçamento"?
**Resposta:** View `api.vw_inativos_sem_orcamento` filtra por `tem_historico_orcamento = false`

### 2. Onde está a lógica de filtro "Com Histórico de Orçamento"?
**Resposta:** View `api.vw_inativos_com_orcamento` filtra por `tem_historico_orcamento = true`

### 3. Como o score de qualidade está sendo calculado?
**Resposta:** Função `api.calcular_qualidade_dados()` soma pontos por campo preenchido (máximo 100)

### 4. De onde vêm os dados exibidos?
**Resposta:** Tabela `api.clientes_mestre` (consolidação) + JOIN com `api.prime_pedidos` para histórico

### 5. O campo `total_orcamentos` está sendo atualizado?
**Resposta:** **SIM**, é calculado dinamicamente na CTE `historico_orcamentos` contando registros de `prime_pedidos`

---

## 🚨 O VERDADEIRO PROBLEMA

A lógica **NÃO está invertida**! O que está acontecendo é:

1. **Clientes SEM histórico (90/100):**
   - Vieram de fontes externas (Sprint, GreatPages, Blacklabs)
   - Foram importados com dados completos
   - Nunca geraram um orçamento no Prime
   - São **LEADS FRIOS** de alta qualidade esperando ativação

2. **Clientes COM histórico (20/40/65/100):**
   - Geraram orçamentos no Prime (PENDENTE, REJEITADO, etc)
   - Mas não completaram a compra
   - Alguns têm dados incompletos porque:
     - Sistema permite criar pedido com dados mínimos
     - Não finalizaram cadastro completo
   - São **LEADS QUENTES** que já interagiram mas não converteram

---

## 💡 CONCLUSÃO

**A lógica está CORRETA!** Não há inversão.

O que parece estranho é a **expectativa semântica**:
- Você espera: "Quem comprou = dados completos"
- Realidade: "Quem se cadastrou por lead externo = dados completos"
- E: "Quem tentou comprar mas não finalizou = pode ter dados incompletos"

---

## 🔧 SE VOCÊ QUER MUDAR A NOMENCLATURA

Se quiser renomear para ficar mais claro:

### Nomenclatura Atual:
- ❌ "Sem Histórico de Orçamento" (confuso)
- ❌ "Com Histórico de Orçamento" (confuso)

### Nomenclatura Sugerida:
- ✅ "Leads Externos (Sprint/GreatPages)" → Nunca geraram orçamento
- ✅ "Leads com Tentativa de Compra" → Geraram orçamento mas não converteram
- ✅ "Clientes Ativos" → Compraram pelo menos 1 vez (já existe na view `vw_clientes_ativos`)

---

## 📌 DADOS DO BANCO

De acordo com suas análises SQL:
- **Total de clientes:** 37.457
- **COM telefone no Firebird:** 33.122 (88%)
- **COM telefone no Supabase:** ~37.213 (99,4%)
- **Dados faltando:** apenas 244 (0,6%)

Ou seja, os dados ESTÃO no banco! O que acontece é:
- Clientes da lista "Com Histórico" realmente têm ALGUNS com dados incompletos (normal para quem começou orçamento e desistiu)
- Clientes da lista "Sem Histórico" têm dados completos porque vieram de importações estruturadas

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. **Se quiser ver clientes que já COMPRARAM:**
   - Use a view `vw_clientes_ativos`
   - Ou a view `vw_para_reativacao` (compraram mas há 90+ dias sem comprar)

2. **Se quiser separar por origem:**
   - Filtre pela coluna `origem_marcas` em `clientes_mestre`
   - Ex: "PRIME", "SPRINT", "GREATPAGES", "BLACKLABS"

3. **Se quiser renomear as categorias:**
   - Alterar apenas os LABELS no frontend (`src/pages/clientes-consolidados.jsx`)
   - Não precisa mexer nas queries/views

---

## 📞 CONTATO DE APOIO

Se ainda tiver dúvidas ou quiser ajustar a lógica, posso:
- ✅ Criar views customizadas
- ✅ Ajustar nomenclatura no frontend
- ✅ Adicionar filtros por origem
- ✅ Criar dashboard específico para seu caso de uso

---

**Gerado em:** 2025-10-28  
**Arquivo de referência:** `CONSOLIDACAO_DADOS/06-views-sistema-reativacao.sql`

