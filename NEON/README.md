# 🗄️ PROJETO SPRINTHUB SYNC - DOCUMENTAÇÃO COMPLETA

## 📊 **TABELA: `api.oportunidade_sprint`**

**🎯 Objetivo:** Sincronizar oportunidades do SprintHUB para Supabase  
**📅 Criado:** 18/08/2025  
**🔄 Versão:** 1.0

---

## 🔑 **GRUPO 1: CAMPOS PRINCIPAIS (7 campos)**

```
id                    - ID único da oportunidade (BIGINT, PK)
title                 - Título/nome da oportunidade (TEXT)
value                 - Valor da oportunidade (DECIMAL)
crm_column           - ID da etapa/coluna do funil (INTEGER)
lead_id              - ID do lead associado (BIGINT)
sequence             - Sequência na etapa (INTEGER)
status               - Status: won/lost/open (TEXT)
```

---

## 📊 **GRUPO 2: CAMPOS DE CONTROLE (6 campos)**

```
loss_reason          - ID do motivo de perda (INTEGER)
gain_reason          - ID do motivo de ganho (INTEGER)
expected_close_date  - Data prevista de fechamento (DATE)
sale_channel         - Canal de venda (TEXT)
campaign             - Campanha (TEXT)
user_id              - ID do usuário responsável (INTEGER)
```

---

## 📅 **GRUPO 3: CAMPOS DE DATA (7 campos)**

```
last_column_change   - Última mudança de etapa (TIMESTAMPTZ)
last_status_change   - Última mudança de status (TIMESTAMPTZ)
gain_date            - Data de ganho (TIMESTAMPTZ)
lost_date            - Data de perda (TIMESTAMPTZ)
reopen_date          - Data de reabertura (TIMESTAMPTZ)
create_date          - Data de criação (TIMESTAMPTZ)
update_date          - Data de atualização (TIMESTAMPTZ)
```

---

## 🏷️ **GRUPO 4: CAMPOS CUSTOMIZADOS PRINCIPAIS (5 campos)**

```
origem_oportunidade  - Origem da oportunidade (TEXT)
tipo_de_compra       - Tipo de compra (TEXT)
qualificacao         - Qualificação do lead (TEXT)
primecadastro        - Indicador primeiro cadastro (INTEGER)
data_recompra        - Data de recompra (TEXT)
```

---

## 🏷️ **GRUPO 5: CAMPOS CUSTOMIZADOS ADICIONAIS (18 campos)**

```
codigo_prime_receita    - Código prime receita (TEXT)
descricao_da_formula    - Descrição da fórmula (TEXT)
id_api_max              - ID ApiMax (TEXT)
id_transacao            - ID da transação (TEXT)
link_pgto               - Link de pagamento (TEXT)
numero_do_pedido        - Número do pedido (TEXT)
requisicao1             - Requisição 1 (TEXT)
status_getnet           - Status Getnet (TEXT)
status_orcamento        - Status orçamento (TEXT)
valorconfere            - Valor confere (TEXT)
forma_pagamento         - Forma de pagamento (TEXT)
frete                   - Frete (TEXT)
local_da_compra         - Local da compra (TEXT)
valorfrete              - Valor do frete (TEXT)
codigo_id_lead          - Código ID Lead (TEXT)
codigo_id_oportunidade  - Código ID Oportunidade (TEXT)
id_oportunidade         - ID oportunidade (TEXT)
req                     - REQ (TEXT)
```

---

## 🎯 **GRUPO 6: CAMPOS UTM (8 campos)**

```
utm_campaign         - UTM Campaign (TEXT)
utm_content          - UTM Content (TEXT)
utm_medium           - UTM Medium (TEXT)
utm_source           - UTM Source (TEXT)
utm_term             - UTM Term (TEXT)
utm_origin           - Origem UTM (TEXT)
utm_referer          - Referer UTM (TEXT)
utm_date_added       - Data adição UTM (TIMESTAMPTZ)
```

---

## 📋 **GRUPO 7: CAMPOS DE CONTROLE (2 campos)**

```
archived             - Status arquivado 0/1 (INTEGER)
synced_at            - Timestamp sincronização (TIMESTAMPTZ)
```

---

## 📊 **RESUMO TOTAL:**

- **🔑 Principais:** 7 campos
- **📊 Controle:** 6 campos  
- **📅 Datas:** 7 campos
- **🏷️ Customizados Principais:** 5 campos
- **🏷️ Customizados Adicionais:** 18 campos
- **🎯 UTM:** 8 campos
- **📋 Controle Interno:** 2 campos

### **🎯 TOTAL: 53 CAMPOS**

---

## 📁 **ARQUIVOS DO PROJETO:**

```
📁 NEON/
├── 📄 README.md                           - Esta documentação
├── 📄 test-sprinthub-api.js              - PASSO 1: Teste básico API
├── 📄 count-opportunities.js             - PASSO 2: Contagem/paginação
├── 📄 create-oportunidade-sprint-table.sql - PASSO 3A: Criação tabela
├── 📄 DOCUMENTACAO-CAMPOS-OPORTUNIDADE.md - Documentação detalhada
└── 🚀 [próximos arquivos de sincronização]
```

---

## 🚀 **PRÓXIMOS PASSOS:**

1. ✅ **PASSO 1:** Teste API - CONCLUÍDO
2. ✅ **PASSO 2:** Mapeamento campos - CONCLUÍDO  
3. ✅ **PASSO 3A:** Criação tabela - CONCLUÍDO
4. 🔄 **PASSO 3B:** Teste sincronização básica - PRÓXIMO
5. ➕ **PASSO 4:** Sincronização completa - FUTURO

---

**📝 Este README será atualizado a cada passo concluído!**
