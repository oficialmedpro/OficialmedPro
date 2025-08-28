# 🔧 PROCESSO: ADICIONAR NOVOS CAMPOS NO CRM

**📅 Data:** 18/08/2025  
**🎯 Objetivo:** Documentar o processo completo para adicionar novos campos do SprintHub na sincronização  
**🔄 Versão:** 1.0

---

## 📋 **VISÃO GERAL**

Sempre que um **novo campo customizado** for adicionado no SprintHub CRM, você deve seguir este processo para incluí-lo na sincronização automática com o Supabase.

---

## 🔄 **PROCESSO COMPLETO (4 PASSOS)**

### **1️⃣ IDENTIFICAR O NOVO CAMPO NO CRM**

**Exemplo:**
```javascript
// Novo campo que aparece na API do SprintHub:
"Desconto Aplicado": "15%"
"Status Financeiro": "aprovado"
"Data de Entrega": "2025-09-15"
```

**📝 Anote:**
- ✅ **Nome exato** do campo (com espaços e maiúsculas)
- ✅ **Tipo de dados** (texto, número, data, etc.)
- ✅ **Valores de exemplo**

---

### **2️⃣ ADICIONAR CAMPO NO BANCO DE DADOS**

**🔧 No SQL Editor do Supabase Dashboard:**

```sql
-- Adicionar o novo campo na tabela
ALTER TABLE api.oportunidade_sprint 
ADD COLUMN desconto_aplicado TEXT;

-- Dar permissões (SEMPRE necessário)
GRANT ALL PRIVILEGES ON TABLE api.oportunidade_sprint 
TO service_role, anon, authenticated;
```

**📝 Regras para nomes de campos:**
- ✅ **Snake_case**: `desconto_aplicado`
- ✅ **Minúsculas**: `status_financeiro`
- ✅ **Sem espaços**: `data_entrega`
- ✅ **Sem acentos**: `data_entrega` (não `data_entrégá`)

**📝 Tipos de dados recomendados:**
- **Texto**: `TEXT`
- **Número**: `NUMERIC` ou `INTEGER`
- **Data**: `TIMESTAMPTZ`
- **Booleano**: `BOOLEAN`

---

### **3️⃣ ATUALIZAR O SCRIPT DE SINCRONIZAÇÃO**

**📁 Arquivo:** `/opt/sprinthub-sync/sync-incremental.js`

**🔧 Localizar a função `mapAll65Fields()` e adicionar:**

```javascript
function mapAll65Fields(opportunity) {
    const fields = opportunity.fields || {};
    const lead = opportunity.dataLead || {};
    const utmTags = (lead.utmTags && lead.utmTags[0]) || {};

    return {
        // ... campos existentes ...
        
        // 🆕 NOVO CAMPO ADICIONADO
        desconto_aplicado: fields["Desconto Aplicado"] || null,
        status_financeiro: fields["Status Financeiro"] || null,
        data_entrega: fields["Data de Entrega"] || null,
        
        // ... resto dos campos ...
    };
}
```

**⚠️ ATENÇÃO:**
- ✅ **Nome da API**: `fields["Desconto Aplicado"]` (exato como vem do SprintHub)
- ✅ **Nome do banco**: `desconto_aplicado` (snake_case)
- ✅ **Fallback**: `|| null` (sempre incluir)

---

### **4️⃣ ATUALIZAR A DOCUMENTAÇÃO**

**📁 Arquivo:** `DOCUMENTACAO-CAMPOS-OPORTUNIDADE.md`

**🔧 Adicionar linha na tabela correspondente:**

```markdown
| `"Desconto Aplicado"` | `desconto_aplicado` | TEXT | ❌ | Desconto aplicado na oportunidade |
| `"Status Financeiro"` | `status_financeiro` | TEXT | ❌ | Status da aprovação financeira |
| `"Data de Entrega"` | `data_entrega` | TIMESTAMPTZ | ❌ | Data prevista de entrega |
```

**🔧 Atualizar contador:**
```markdown
- **🎯 Total de campos:** 48 campos originais + 15 campos lead + 3 novos + 2 controle = **68 campos**
```

---

## 🧪 **5️⃣ TESTAR AS MUDANÇAS**

### **Teste manual:**
```bash
cd /opt/sprinthub-sync
node sync-incremental.js
```

### **Verificar no banco:**
```sql
SELECT id, title, desconto_aplicado, status_financeiro, data_entrega 
FROM api.oportunidade_sprint 
WHERE desconto_aplicado IS NOT NULL 
LIMIT 5;
```

### **Verificar logs automáticos:**
```bash
docker logs sprinthub-sync-cron
```

---

## ⚠️ **CUIDADOS IMPORTANTES**

### **🔴 NUNCA FAÇA:**
- ❌ Mudar nomes de campos existentes
- ❌ Deletar campos sem verificar dependências
- ❌ Esquecer de dar permissões no banco
- ❌ Usar caracteres especiais nos nomes

### **✅ SEMPRE FAÇA:**
- ✅ Teste manual antes de deixar no automático
- ✅ Backup da documentação antes de alterar
- ✅ Verifique se o campo realmente existe na API
- ✅ Use nomes descritivos e padronizados

---

## 📊 **CRONOGRAMA DE EXECUÇÃO AUTOMÁTICA**

| Horário | Status | Descrição |
|---------|--------|-----------|
| **06:00** | 🟢 Ativo | Primeira execução do dia |
| **08:00** | 🟢 Ativo | Manhã |
| **10:00** | 🟢 Ativo | Manhã |
| **12:00** | 🟢 Ativo | Meio-dia |
| **14:00** | 🟢 Ativo | Tarde |
| **16:00** | 🟢 Ativo | Tarde |
| **18:00** | 🟢 Ativo | Tarde |
| **20:00** | 🟢 Ativo | Noite |
| **22:00** | 🟢 Ativo | Última execução |
| **00:00-04:00** | ⚫ Inativo | Madrugada (sem execução) |

---

## 🆘 **RESOLUÇÃO DE PROBLEMAS**

### **Script não executou no horário:**
```bash
# Verificar se container está rodando
docker ps | grep sprinthub-sync

# Ver logs para identificar erro
docker logs sprinthub-sync-cron

# Reiniciar se necessário
docker restart sprinthub-sync-cron
```

### **Campos não estão sendo sincronizados:**
1. ✅ Verificar se campo existe na API do SprintHub
2. ✅ Verificar se campo foi criado no banco
3. ✅ Verificar se mapeamento está correto no script
4. ✅ Testar script manualmente

### **Erro de permissão:**
```sql
-- Sempre executar após adicionar campos
GRANT ALL PRIVILEGES ON TABLE api.oportunidade_sprint 
TO service_role, anon, authenticated;
```

---

## 📂 **ARQUIVOS IMPORTANTES**

| Arquivo | Localização | Função |
|---------|-------------|---------|
| `sync-incremental.js` | `/opt/sprinthub-sync/` | Script principal do cron |
| `DOCUMENTACAO-CAMPOS-OPORTUNIDADE.md` | Projeto local | Documentação dos campos |
| `docker-compose.yml` | Portainer Stack | Configuração do container |

---

## 🎯 **EXEMPLO PRÁTICO COMPLETO**

### **Cenário:** Adicionar campo "Método de Pagamento"

#### **Passo 1 - Identificar:**
```javascript
// Vem da API assim:
"Método de Pagamento": "PIX"
```

#### **Passo 2 - Banco:**
```sql
ALTER TABLE api.oportunidade_sprint 
ADD COLUMN metodo_pagamento TEXT;

GRANT ALL PRIVILEGES ON TABLE api.oportunidade_sprint 
TO service_role, anon, authenticated;
```

#### **Passo 3 - Script:**
```javascript
// Adicionar na função mapAll65Fields():
metodo_pagamento: fields["Método de Pagamento"] || null,
```

#### **Passo 4 - Documentação:**
```markdown
| `"Método de Pagamento"` | `metodo_pagamento` | TEXT | ❌ | Método de pagamento escolhido |
```

#### **Passo 5 - Testar:**
```bash
cd /opt/sprinthub-sync
node sync-incremental.js
```

---

**📝 Mantenha este documento sempre atualizado quando adicionar novos campos!**

---

**🎉 SINCRONIZAÇÃO SPRINTHUB ↔ SUPABASE FUNCIONANDO 100%!**

