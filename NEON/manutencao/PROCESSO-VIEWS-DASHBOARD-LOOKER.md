# 📊 PROCESSO - VIEWS PARA DASHBOARD LOOKER

**📅 Data:** 21/01/2025  
**🎯 Objetivo:** Documentar criação e manutenção das views para dashboard no Looker  
**📍 Localização:** Schema `public` do Supabase  
**📋 Fonte:** Tabela `api.oportunidade_sprint`

---

## 🔧 **COMO FUNCIONA:**

### **📊 VIEWS vs TABELAS AUXILIARES:**
- ✅ **Views usam CTEs** (Common Table Expressions) para simular dimensões
- ✅ **Não precisam de tabelas auxiliares** - tudo calculado na hora
- ✅ **Dados sempre atualizados** - consultam tabela principal em tempo real
- ✅ **Fácil manutenção** - um arquivo SQL com tudo

### **🔄 ATUALIZAÇÃO DE VIEWS:**
```sql
-- Views SÃO atualizáveis com:
CREATE OR REPLACE VIEW public.nome_da_view AS
-- ... nova lógica
```

---

## 📂 **ARQUIVOS PRINCIPAIS:**

| Arquivo | Localização | Função |
|---------|-------------|--------|
| `views_dashboard_looker.sql` | Raiz do projeto | **SQL completo** com todas as 6 views |
| `INSTRUCOES-EXECUTAR-VIEWS.md` | Raiz do projeto | **Instruções** para executar no Supabase |
| `COMANDOS-SSH-VPS.md` | Raiz do projeto | **Comandos SSH** para scripts na VPS |

---

## 📊 **VIEWS CRIADAS:**

### **1️⃣ `v_opps_enriquecidas`** *(Base única para BI)*
**🎯 Função:** View principal com todos os campos enriquecidos

**📋 Campos principais:**
- **Identificação:** `id`, `lead_id`, `user_id`, `title`, `value`
- **Pipeline:** `funil_id`, `funil_nome`, `crm_column`, `etapa_nome`, `etapa_ordem`
- **Status/Datas:** `status_final`, `create_date`, `gain_date`, `lost_date`, `update_date`
- **Marcos:** `flag_venda`, `data_venda`, `flag_ganho`, `data_ganho`, `flag_cadastro`, `data_cadastro`
- **Origem:** `origem_oportunidade`, `origem_final`, `origem_grupo`
- **UTM:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- **Métricas:** `dias_ate_ganho`, `valor_em_aberto`, `data_referencia`

**🔧 Lógicas implementadas:**
- **Venda:** `flag_venda = (status_orcamento = 'aprovado')`
- **Ganho:** `flag_ganho = (status = 'gain')`
- **Cadastro:** `flag_cadastro = (primecadastro = 1)`
- **Origem final:** Precedência declarada > UTM > heurística > "Outros"

---

### **2️⃣ `v_leads_agg`** *(Agrupado por lead)*
**🎯 Função:** Agregações por `lead_id`

**📋 Campos:**
- `total_opps`, `qtd_gain`, `qtd_lost`, `qtd_open`
- `valor_gain_total`, `valor_lost_total`, `valor_open_total`
- `ticket_medio_gain`, `ticket_medio_lost`, `ticket_medio_open`
- `media_dias_ate_ganho`
- `primeiro_create_date`, `ultima_movimentacao`

---

### **3️⃣ `v_vendedor_periodo`** *(Scoreboard)*
**🎯 Função:** Performance por vendedor e período

**📋 Campos:**
- `user_id`, `periodo_dia`, `periodo_semana`, `periodo_mes`
- `opps_criadas`, `qtd_vendas`, `valor_vendas`
- `qtd_ganhos`, `valor_ganhos`, `qtd_cadastros`
- `ticket_medio`, `taxa_conversao_pct`

**🕐 Períodos suportados:**
- **Dia:** `DATE_TRUNC('day', create_date)`
- **Semana:** `DATE_TRUNC('week', create_date)`
- **Mês:** `DATE_TRUNC('month', create_date)`

---

### **4️⃣ `v_funil_etapas`** *(Análise de funil)*
**🎯 Função:** Diluição e passagem entre etapas

**📋 Campos:**
- `funil_id`, `crm_column`, `etapa_nome`, `etapa_ordem`
- `periodo`, `qtd`, `valor_total`
- `taxa_passagem_prox` (% que passa para próxima etapa)
- `taxa_retencao_do_topo` (% retido desde primeira etapa)

---

### **5️⃣ `v_origens`** *(Entrantes por origem)*
**🎯 Função:** Leads únicos por origem e UTM

**📋 Campos:**
- `periodo`, `origem_final`, `origem_grupo`
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `qtd_leads_entrantes`, `qtd_opps`, `valor_total`

---

### **6️⃣ `v_vendas_ultimas_2h`** *(Ronda 2/2h)*
**🎯 Função:** Vendas, ganhos e cadastros das últimas 2 horas

**📋 Campos:**
- `user_id`, `funil_id`, `funil_nome`, `etapa_nome`
- `qtd_vendas_2h`, `valor_vendas_2h`
- `qtd_ganhos_2h`, `valor_ganhos_2h`
- `qtd_cadastros_2h`
- `consultado_em`, `inicio_periodo_2h`

---

## 🔧 **PROCESSO DE MANUTENÇÃO:**

### **🆕 ADICIONAR NOVOS CAMPOS:**

**1. Editar a view principal:**
```sql
CREATE OR REPLACE VIEW public.v_opps_enriquecidas AS
WITH 
-- ... CTEs existentes ...
SELECT 
    -- ... campos existentes ...
    
    -- 🆕 NOVO CAMPO
    o.novo_campo,
    CASE 
        WHEN o.condicao THEN 'Valor A'
        ELSE 'Valor B'
    END as novo_campo_calculado,
    
    -- ... resto dos campos ...
```

**2. Atualizar outras views se necessário**

**3. Executar no Supabase via Dashboard**

---

### **🎯 ADICIONAR NOVOS FILTROS:**

**Opção 1 - Direto no Looker:**
- Adicionar filtros na interface do Looker
- Usar campos existentes da view

**Opção 2 - Nova view específica:**
```sql
CREATE OR REPLACE VIEW public.v_nome_especifica AS
SELECT 
    -- campos necessários
FROM public.v_opps_enriquecidas
WHERE condicao_especifica = 'valor';
```

---

### **📈 ADICIONAR NOVAS MÉTRICAS:**

```sql
-- Exemplo: adicionar taxa de reativação
CREATE OR REPLACE VIEW public.v_opps_enriquecidas AS
-- ... CTEs existentes ...
SELECT 
    -- ... campos existentes ...
    
    -- 🆕 NOVA MÉTRICA
    CASE 
        WHEN o.reopen_date IS NOT NULL 
        THEN EXTRACT(days FROM o.reopen_date - o.lost_date)
        ELSE NULL 
    END as dias_ate_reativacao,
    
    -- ... resto dos campos ...
```

---

## 🚨 **REGRAS IMPORTANTES:**

### **⚠️ SEMPRE QUE ALTERAR:**
1. ✅ **Backup da view atual** (copiar SQL antes de alterar)
2. ✅ **Testar em ambiente de desenvolvimento** (se disponível)
3. ✅ **Executar com `CREATE OR REPLACE`** (não `CREATE`)
4. ✅ **Verificar se Looker continua funcionando**

### **📋 CHECKLIST DE ALTERAÇÃO:**
- [ ] View compila sem erros
- [ ] Campos mantêm mesmo tipo de dados
- [ ] Performance aceitável (< 30 segundos)
- [ ] Looker consegue acessar
- [ ] Dashboards continuam funcionando

---

## 🎯 **CENÁRIOS COMUNS:**

### **🆕 NOVO CAMPO DA API:**
1. Campo já sincronizado via `sync-incremental.js`
2. Adicionar na view: `o.novo_campo`
3. Executar `CREATE OR REPLACE VIEW`

### **🔍 NOVO FILTRO:**
1. Verificar se campo já existe na view
2. Se não, adicionar na view
3. Configurar filtro no Looker

### **📊 NOVA MÉTRICA:**
1. Calcular usando campos existentes
2. Adicionar como campo calculado na view
3. Usar no dashboard

---

## 🚀 **COMANDOS PRÁTICOS:**

### **📊 EXECUTAR VIEWS INICIAIS:**
```bash
# Via Dashboard Supabase:
# 1. https://agdffspstbxeqhqtltvb.supabase.co
# 2. SQL Editor
# 3. Cole views_dashboard_looker.sql
# 4. Execute
```

### **🔧 TESTAR ALTERAÇÕES:**
```sql
-- Sempre testar antes de aplicar
SELECT COUNT(*) FROM (
    -- ... nova lógica da view ...
) test_view;
```

### **📋 VERIFICAR VIEWS EXISTENTES:**
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE 'v_%';
```

---

## 📈 **PERFORMANCE:**

### **⚡ OTIMIZAÇÕES:**
- Views usam **índices da tabela original**
- CTEs são **materializadas uma vez por query**
- Filtros por período são **eficientes**

### **⚠️ CUIDADOS:**
- Views complexas podem demorar
- Usar `LIMIT` em testes
- Monitorar performance no Looker

---

## 🎯 **PRÓXIMOS PASSOS:**

### **1️⃣ EXECUTAR AGORA:**
```bash
# 1. Executar views no Supabase
# Cole o conteúdo de views_dashboard_looker.sql no SQL Editor

# 2. Verificar scripts VPS
ssh root@72.60.13.173 "cd /opt/sprinthub-sync && node verificador-sincronizacao.js"
```

### **2️⃣ CONFIGURAR LOOKER:**
- Conectar ao Supabase
- Usar views como fonte de dados
- Configurar dashboards

### **3️⃣ ITERAÇÃO:**
- Ajustar views conforme necessário
- Sempre usar `CREATE OR REPLACE VIEW`
- Documentar mudanças aqui

---

**🎉 PROCESSO DOCUMENTADO! PRONTO PARA DESENVOLVIMENTO ITERATIVO!** 🚀


