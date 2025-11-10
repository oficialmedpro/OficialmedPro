# 🔧 Correção - API de Sincronização

## ❌ Problemas Identificados

### 1. Tabela de Segmentos Incorreta

**Problema:** O código estava tentando inserir na tabela `segmentos` (plural), mas a tabela correta é `segmento` (singular).

**Linha 214 do código antigo:**
```javascript
const { error } = await supabase.from('segmentos').upsert(rows, ...)
```

**Correção aplicada:**
```javascript
const { error } = await supabase.from('segmento').upsert(rows, ...)
```

---

### 2. Campos de Segmento Incorretos

**Problema:** O código estava tentando inserir o campo `synced_at`, mas a tabela `segmento` não tem esse campo. Ela usa `create_date`.

**Campos da tabela `segmento`:**
- `id` (bigint)
- `name` (text)
- `alias` (text, nullable)
- `is_published` (boolean, nullable)
- `create_date` (timestamptz, nullable)
- `category_id` (bigint, nullable)
- `category_title` (text, nullable)
- `total_leads` (integer, nullable)
- `last_lead_update` (timestamptz, nullable)

**Correção aplicada:**
```javascript
const mapped = batch.map((s) => ({ 
    id: s.id, 
    name: s.name || s.title || null,
    alias: s.alias || null,
    is_published: s.is_published || s.published || false,
    create_date: s.create_date || s.createDate || new Date().toISOString(),
    category_id: s.category_id || s.categoryId || null,
    category_title: s.category_title || s.categoryTitle || s.category || null,
    total_leads: s.total_leads || s.totalLeads || null,
    last_lead_update: s.last_lead_update || s.lastLeadUpdate || null
}));
```

---

## ✅ Correções Aplicadas

1. ✅ Tabela corrigida: `segmentos` → `segmento`
2. ✅ Mapeamento de campos corrigido para corresponder à estrutura da tabela
3. ✅ Código ajustado para usar `create_date` em vez de `synced_at`

---

## 🚀 Próximos Passos para Atualizar a API

### 1. Fazer Commit das Mudanças

```bash
git add api-sync-opportunities.js
git commit -m "fix: corrigir tabela e campos de segmentos na sincronização"
git push origin main
```

---

### 2. Rebuild da Imagem Docker

**Opção A: Automático via GitHub Actions**
- O GitHub Actions detectará as mudanças e fará build automático

**Opção B: Manual**
```bash
docker build -f Dockerfile.sync-opportunities -t oficialmedpro/oportunidades-sync-api:latest .
docker login -u oficialmedpro
docker push oficialmedpro/oportunidades-sync-api:latest
```

---

### 3. Atualizar Stack no Portainer

1. Acesse: **Portainer > Stacks > oportunidades-sync** (ou nome da stack)
2. Clique em **Editor**
3. **NÃO precisa alterar nada** - apenas clique em **Update the stack**
4. Marque a opção **Pull latest image** (se disponível)
5. Clique em **Update**

---

### 4. Verificar Logs após Atualização

```bash
# Via Portainer: Services > oportunidades-sync-sprinthub_oportunidades-sync-api > Logs

# Ou via SSH:
docker service logs -f oportunidades-sync-sprinthub_oportunidades-sync-api
```

---

### 5. Testar a Sincronização Completa

Após a atualização, teste o endpoint `/sync/all`:

```bash
# Via PowerShell
Invoke-WebRequest -Uri "https://sincro.oficialmed.com.br/oportunidades/sync/all" -Method GET -UseBasicParsing

# Ou via SQL no Supabase
SELECT api.sync_sprinthub_completo();
```

---

## 📊 Verificar se Está Funcionando

Após a atualização, verifique:

```sql
-- Ver últimas execuções
SELECT * FROM api.sync_runs ORDER BY started_at DESC LIMIT 5;

-- Ver contagens atualizadas
SELECT 
  'Oportunidades' as tipo,
  COUNT(*) as total,
  MAX(synced_at) as ultima_sync
FROM api.oportunidade_sprint
UNION ALL
SELECT 'Leads', COUNT(*), MAX(synced_at) FROM api.leads
UNION ALL
SELECT 'Segmentos', COUNT(*), MAX(create_date) FROM api.segmento
ORDER BY tipo;
```

---

## ✅ Resultado Esperado

Após as correções:

1. ✅ **Oportunidades** - Continuará funcionando normalmente
2. ✅ **Leads** - Deve começar a sincronizar corretamente
3. ✅ **Segmentos** - Deve começar a sincronizar corretamente (após correção)

---

**Arquivo corrigido:** `api-sync-opportunities.js`
**Mudanças:** Linhas 214 e 228-240







