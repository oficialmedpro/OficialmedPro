# 📊 DOCUMENTAÇÃO: CAMPOS DA TABELA OPORTUNIDADE_SPRINT

**📅 Data:** 18/08/2025  
**🎯 Objetivo:** Mapear todos os campos da API SprintHUB para a tabela `api.oportunidade_sprint`  
**🔄 Versão:** 1.0 (Estrutura inicial completa)

---

## 🗄️ **ESTRUTURA DA TABELA: `api.oportunidade_sprint`**

### 🔑 **GRUPO 1: CAMPOS PRINCIPAIS DA OPORTUNIDADE**
| Campo API | Campo Supabase | Tipo | Obrigatório | Descrição |
|-----------|----------------|------|-------------|-----------|
| `id` | `id` | BIGINT | ✅ | ID único da oportunidade (PK) |
| `title` | `title` | TEXT | ✅ | Título/nome da oportunidade |
| `value` | `value` | DECIMAL(15,2) | ✅ | Valor da oportunidade |
| `crm_column` | `crm_column` | INTEGER | ✅ | ID da etapa/coluna do funil |
| `lead_id` | `lead_id` | BIGINT | ✅ | ID do lead associado |
| `sequence` | `sequence` | INTEGER | ❌ | Sequência na etapa |
| `status` | `status` | TEXT | ✅ | Status: won/lost/open |

### 📊 **GRUPO 2: CAMPOS DE CONTROLE**
| Campo API | Campo Supabase | Tipo | Obrigatório | Descrição |
|-----------|----------------|------|-------------|-----------|
| `loss_reason` | `loss_reason` | INTEGER | ❌ | ID do motivo de perda |
| `gain_reason` | `gain_reason` | INTEGER | ❌ | ID do motivo de ganho |
| `expectedCloseDate` | `expected_close_date` | DATE | ❌ | Data prevista de fechamento |
| `sale_channel` | `sale_channel` | TEXT | ❌ | Canal de venda |
| `campaign` | `campaign` | TEXT | ❌ | Campanha |
| `user` | `user_id` | INTEGER | ❌ | ID do usuário responsável |

### 📅 **GRUPO 3: CAMPOS DE DATA**
| Campo API | Campo Supabase | Tipo | Obrigatório | Descrição |
|-----------|----------------|------|-------------|-----------|
| `last_column_change` | `last_column_change` | TIMESTAMPTZ | ❌ | Última mudança de etapa |
| `last_status_change` | `last_status_change` | TIMESTAMPTZ | ❌ | Última mudança de status |
| `gain_date` | `gain_date` | TIMESTAMPTZ | ❌ | Data de ganho |
| `lost_date` | `lost_date` | TIMESTAMPTZ | ❌ | Data de perda |
| `reopen_date` | `reopen_date` | TIMESTAMPTZ | ❌ | Data de reabertura |
| `createDate` | `create_date` | TIMESTAMPTZ | ✅ | Data de criação |
| `updateDate` | `update_date` | TIMESTAMPTZ | ✅ | Data de atualização |

### 🏷️ **GRUPO 4: CAMPOS CUSTOMIZADOS PRINCIPAIS**
| Campo API | Campo Supabase | Tipo | Obrigatório | Descrição |
|-----------|----------------|------|-------------|-----------|
| `"ORIGEM OPORTUNIDADE"` | `origem_oportunidade` | TEXT | ❌ | Origem da oportunidade |
| `"Tipo de Compra"` | `tipo_de_compra` | TEXT | ❌ | Tipo de compra |
| `"QUALIFICACAO"` | `qualificacao` | TEXT | ❌ | Qualificação do lead |
| `"PRIMECADASTRO"` | `primecadastro` | INTEGER | ❌ | Indicador primeiro cadastro |
| `"DATA RECOMPRA"` | `data_recompra` | TEXT | ❌ | Data de recompra |

### 🏷️ **GRUPO 5: CAMPOS CUSTOMIZADOS ADICIONAIS**
| Campo API | Campo Supabase | Tipo | Obrigatório | Descrição |
|-----------|----------------|------|-------------|-----------|
| `"Codigo Prime Receita"` | `codigo_prime_receita` | TEXT | ❌ | Código prime receita |
| `"Descricao da Formula"` | `descricao_da_formula` | TEXT | ❌ | Descrição da fórmula |
| `"Id ApiMax"` | `id_api_max` | TEXT | ❌ | ID ApiMax |
| `"Id Transacao"` | `id_transacao` | TEXT | ❌ | ID da transação |
| `"LinkPgto"` | `link_pgto` | TEXT | ❌ | Link de pagamento |
| `"Numero do pedido"` | `numero_do_pedido` | TEXT | ❌ | Número do pedido |
| `"requisicao1"` | `requisicao1` | TEXT | ❌ | Requisição 1 |
| `"Status Getnet"` | `status_getnet` | TEXT | ❌ | Status Getnet |
| `"Status Orcamento"` | `status_orcamento` | TEXT | ❌ | Status orçamento |
| `"Valorconfere"` | `valorconfere` | TEXT | ❌ | Valor confere |
| `"Forma Pagamento"` | `forma_pagamento` | TEXT | ❌ | Forma de pagamento |
| `"Frete"` | `frete` | TEXT | ❌ | Frete |
| `"Local da Compra"` | `local_da_compra` | TEXT | ❌ | Local da compra |
| `"valorfrete"` | `valorfrete` | TEXT | ❌ | Valor do frete |
| `" Codigo ID Lead"` | `codigo_id_lead` | TEXT | ❌ | Código ID Lead |
| `" Codigo ID Oportunidade"` | `codigo_id_oportunidade` | TEXT | ❌ | Código ID Oportunidade |
| `"idoportunidade"` | `id_oportunidade` | TEXT | ❌ | ID oportunidade |
| `"REQ"` | `req` | TEXT | ❌ | REQ |

### 🎯 **GRUPO 6: CAMPOS UTM**
| Campo API | Campo Supabase | Tipo | Obrigatório | Descrição |
|-----------|----------------|------|-------------|-----------|
| `utmCampaign` | `utm_campaign` | TEXT | ❌ | UTM Campaign |
| `utmContent` | `utm_content` | TEXT | ❌ | UTM Content |
| `utmMedium` | `utm_medium` | TEXT | ❌ | UTM Medium |
| `utmSource` | `utm_source` | TEXT | ❌ | UTM Source |
| `utmTerm` | `utm_term` | TEXT | ❌ | UTM Term |
| `origin` | `utm_origin` | TEXT | ❌ | Origem UTM |
| `referer` | `utm_referer` | TEXT | ❌ | Referer UTM |
| `dateAdded` | `utm_date_added` | TIMESTAMPTZ | ❌ | Data adição UTM |

### 👤 **GRUPO 7: CAMPOS DO LEAD**
| Campo API | Campo Supabase | Tipo | Obrigatório | Descrição |
|-----------|----------------|------|-------------|-----------|
| `dataLead.firstname` | `lead_firstname` | TEXT | ❌ | Nome do lead |
| `dataLead.lastname` | `lead_lastname` | TEXT | ❌ | Sobrenome do lead |
| `dataLead.cpf` | `lead_cpf` | TEXT | ❌ | CPF do lead |
| `dataLead.city` | `lead_city` | TEXT | ❌ | Cidade do lead |
| `dataLead.bairro` | `lead_bairro` | TEXT | ❌ | Bairro do lead |
| `dataLead.rua` | `lead_rua` | TEXT | ❌ | Rua do lead |
| `dataLead.numero` | `lead_numero` | TEXT | ❌ | Número do endereço |
| `dataLead.pais` | `lead_pais` | TEXT | ❌ | País do lead |
| `dataLead.zipcode` | `lead_zipcode` | TEXT | ❌ | CEP do lead |
| `dataLead.data_de_nascimento` | `lead_data_nascimento` | TIMESTAMPTZ | ❌ | Data nascimento |
| `dataLead.email` | `lead_email` | TEXT | ❌ | Email do lead |
| `dataLead.recebedor` | `lead_recebedor` | TEXT | ❌ | Recebedor |
| `dataLead.whatsapp` | `lead_whatsapp` | TEXT | ❌ | WhatsApp do lead |
| `dataLead.rg` | `lead_rg` | TEXT | ❌ | RG do lead |
| `dataLead.linkpagamento` | `lead_linkpagamento` | TEXT | ❌ | Link de pagamento |

### 📋 **GRUPO 8: CAMPOS DE CONTROLE**
| Campo API | Campo Supabase | Tipo | Obrigatório | Descrição |
|-----------|----------------|------|-------------|-----------|
| `archived` | `archived` | INTEGER | ❌ | Status arquivado (0/1) |
| - | `synced_at` | TIMESTAMPTZ | ✅ | Controle sincronização |

---

## 📊 **RESUMO ESTATÍSTICO:**
- **🎯 Total de campos:** 48 campos originais + 15 campos lead + 2 controle = **65 campos**
- **✅ Obrigatórios:** 7 campos
- **❌ Opcionais:** 43 campos
- **🔍 Índices:** 9 índices para performance

---

## 🔄 **COMO ADICIONAR NOVOS CAMPOS:**

### **PASSO 1: Identificar novo campo na API**
```javascript
// Exemplo: novo campo "Status Financeiro"
"Status Financeiro": "aprovado"
```

### **PASSO 2: Padronizar nome**
```sql
-- "Status Financeiro" → status_financeiro
```

### **PASSO 3: Adicionar na tabela**
```sql
ALTER TABLE api.oportunidade_sprint 
ADD COLUMN status_financeiro TEXT;
```

### **PASSO 4: Atualizar código de sincronização**
```javascript
// Adicionar no mapeamento:
status_financeiro: opportunity.fields["Status Financeiro"] || null
```

### **PASSO 5: Atualizar esta documentação**
- Adicionar linha na tabela do grupo correspondente
- Atualizar contadores no resumo

---

## 🎯 **PRÓXIMOS PASSOS:**
1. ✅ **Tabela criada** - CONCLUÍDO
2. 🔄 **Testar sincronização básica** - PRÓXIMO
3. ➕ **Adicionar campos conforme necessário** - FUTURO

---

**📝 Mantenha esta documentação atualizada sempre que adicionar novos campos!**
