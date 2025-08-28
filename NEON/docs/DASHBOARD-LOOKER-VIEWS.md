# 📊 DASHBOARD LOOKER - USANDO VIEWS

**📅 Data:** 18/08/2025  
**🎯 Objetivo:** Configurar dashboard no Looker Studio usando Views do Supabase  

---

## ✅ **RESPOSTA: SIM, LOOKER LÊ VIEWS!**

### **📊 LOOKER STUDIO SUPORTA:**
- ✅ **Tabelas** PostgreSQL
- ✅ **Views** PostgreSQL  
- ✅ **Materialized Views** PostgreSQL
- ✅ **Conexão direta** com Supabase

### **🎯 VANTAGEM DAS VIEWS:**
- 📊 **Dados pré-processados** (agregações, joins, cálculos)
- ⚡ **Performance melhor** no dashboard
- 🔧 **Lógica no banco** (não no Looker)
- 🔄 **Atualizações automáticas** quando dados mudam

---

## 🔧 **VIEWS RECOMENDADAS PARA DASHBOARD:**

### **📊 VIEW 1: RESUMO POR FUNIL**
```sql
CREATE VIEW dashboard_resumo_funis AS
SELECT 
    CASE 
        WHEN crm_column IN (130, 231, 82, 207, 83, 85, 232) THEN 'COMERCIAL APUCARANA'
        WHEN crm_column IN (227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150) THEN 'RECOMPRA'
        ELSE 'OUTROS'
    END as funil,
    COUNT(*) as total_oportunidades,
    SUM(value) as valor_total,
    AVG(value) as ticket_medio,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as abertas,
    COUNT(CASE WHEN status = 'won' THEN 1 END) as ganhas,
    COUNT(CASE WHEN status = 'lost' THEN 1 END) as perdidas,
    DATE(create_date) as data_criacao
FROM api.oportunidade_sprint 
GROUP BY funil, DATE(create_date)
ORDER BY data_criacao DESC;
```

### **📊 VIEW 2: RESUMO POR ETAPA**
```sql
CREATE VIEW dashboard_resumo_etapas AS
SELECT 
    crm_column,
    CASE crm_column
        WHEN 130 THEN '[0] ENTRADA'
        WHEN 231 THEN '[1] ACOLHIMENTO/TRIAGEM'
        WHEN 82 THEN '[2] QUALIFICADO'
        WHEN 207 THEN '[3] ORÇAMENTO REALIZADO'
        WHEN 83 THEN '[4] NEGOCIAÇÃO'
        WHEN 85 THEN '[5] FOLLOW UP'
        WHEN 232 THEN '[6] CADASTRO'
        WHEN 227 THEN '[X] PROMO'
        WHEN 202 THEN '[0] ENTRADA'
        WHEN 228 THEN '[1] ACOLHIMENTO/TRIAGEM'
        WHEN 229 THEN '[2] QUALIFICAÇÃO'
        WHEN 206 THEN '[3] ORÇAMENTOS'
        WHEN 203 THEN '[4] NEGOCIAÇÃO'
        WHEN 204 THEN '[5] FOLLOW UP'
        WHEN 230 THEN '[6] CADASTRO'
        WHEN 205 THEN '[X] PARCEIROS'
        WHEN 241 THEN '[0] MONITORAMENTO'
        WHEN 146 THEN '[1] DISPARO'
        WHEN 147 THEN '[2] DIA 1 - 1º TENTATIVA'
        WHEN 167 THEN '[3] DIA 1 - 2º TENTATIVA'
        WHEN 148 THEN '[4] DIA 2 - 1º TENTATIVA'
        WHEN 168 THEN '[5] DIA 2 - 2º TENTATIVA'
        WHEN 149 THEN '[6] DIA 3 - 1º TENTATIVA'
        WHEN 169 THEN '[7] DIA 3 - 2º TENTATIVA'
        WHEN 150 THEN '[8] FOLLOW UP INFINITO'
        ELSE 'OUTRAS'
    END as etapa_nome,
    CASE 
        WHEN crm_column IN (130, 231, 82, 207, 83, 85, 232) THEN 'COMERCIAL APUCARANA'
        WHEN crm_column IN (227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150) THEN 'RECOMPRA'
        ELSE 'OUTROS'
    END as funil,
    COUNT(*) as total_oportunidades,
    SUM(value) as valor_total,
    AVG(value) as ticket_medio,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as abertas,
    COUNT(CASE WHEN status = 'won' THEN 1 END) as ganhas,
    COUNT(CASE WHEN status = 'lost' THEN 1 END) as perdidas
FROM api.oportunidade_sprint 
GROUP BY crm_column, etapa_nome, funil
ORDER BY funil, crm_column;
```

### **📊 VIEW 3: EVOLUÇÃO TEMPORAL**
```sql
CREATE VIEW dashboard_evolucao_temporal AS
SELECT 
    DATE(create_date) as data,
    DATE_TRUNC('week', create_date) as semana,
    DATE_TRUNC('month', create_date) as mes,
    COUNT(*) as novas_oportunidades,
    SUM(value) as valor_criado,
    COUNT(CASE WHEN status = 'won' THEN 1 END) as vendas_fechadas,
    SUM(CASE WHEN status = 'won' THEN value ELSE 0 END) as valor_vendido,
    CASE 
        WHEN crm_column IN (130, 231, 82, 207, 83, 85, 232) THEN 'COMERCIAL APUCARANA'
        WHEN crm_column IN (227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150) THEN 'RECOMPRA'
        ELSE 'OUTROS'
    END as funil
FROM api.oportunidade_sprint 
GROUP BY DATE(create_date), DATE_TRUNC('week', create_date), DATE_TRUNC('month', create_date), funil
ORDER BY data DESC;
```

### **📊 VIEW 4: PERFORMANCE DE VENDAS**
```sql
CREATE VIEW dashboard_performance_vendas AS
SELECT 
    user_id,
    COUNT(*) as total_oportunidades,
    COUNT(CASE WHEN status = 'won' THEN 1 END) as vendas_fechadas,
    COUNT(CASE WHEN status = 'lost' THEN 1 END) as vendas_perdidas,
    ROUND(
        (COUNT(CASE WHEN status = 'won' THEN 1 END)::float / 
         NULLIF(COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END), 0)) * 100, 
        2
    ) as taxa_conversao,
    SUM(CASE WHEN status = 'won' THEN value ELSE 0 END) as valor_vendido,
    AVG(CASE WHEN status = 'won' THEN value END) as ticket_medio,
    CASE 
        WHEN crm_column IN (130, 231, 82, 207, 83, 85, 232) THEN 'COMERCIAL APUCARANA'
        WHEN crm_column IN (227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 169, 150) THEN 'RECOMPRA'
        ELSE 'OUTROS'
    END as funil
FROM api.oportunidade_sprint 
WHERE user_id IS NOT NULL
GROUP BY user_id, funil
ORDER BY valor_vendido DESC;
```

---

## 🔗 **CONECTAR LOOKER STUDIO:**

### **📊 PASSOS:**
1. **Abrir** [Looker Studio](https://lookerstudio.google.com/)
2. **Criar** novo relatório
3. **Adicionar dados** → **PostgreSQL**
4. **Configurar conexão:**
   - **Host:** `db.agdffspstbxeqhqtltvb.supabase.co`
   - **Porta:** `5432`
   - **Database:** `postgres`
   - **Schema:** `api` ⚠️ **IMPORTANTE**
   - **Usuário:** `postgres`
   - **Senha:** [senha do projeto]

### **📋 SELECIONAR DADOS:**
- ✅ **Tabela:** `api.oportunidade_sprint` (dados brutos)
- ✅ **Views:** `dashboard_resumo_funis`, `dashboard_resumo_etapas`, etc.

---

## 🎯 **VANTAGENS DAS VIEWS:**

### **⚡ PERFORMANCE:**
- 📊 **Dados agregados** no banco (mais rápido)
- 🔄 **Menos processamento** no Looker
- 📈 **Gráficos mais fluidos**

### **🔧 MANUTENÇÃO:**
- 💡 **Lógica centralizada** no Supabase
- 🔄 **Atualizações automáticas** quando dados mudam
- 📊 **Cálculos complexos** feitos no PostgreSQL

### **📊 FLEXIBILIDADE:**
- 🎯 **Views específicas** para cada tipo de gráfico
- 📈 **Agregações prontas** (somas, médias, contagens)
- 🔍 **Filtros otimizados**

---

## 📋 **PRÓXIMOS PASSOS:**

### **1️⃣ CRIAR VIEWS NO SUPABASE:**
```sql
-- Execute no SQL Editor do Supabase
-- (usar as views acima)
```

### **2️⃣ CONECTAR LOOKER:**
- Usar dados das views em vez da tabela bruta
- Criar gráficos baseados nas views

### **3️⃣ DASHBOARD RECOMENDADO:**
- 📊 **Gráfico 1:** Evolução temporal (linha)
- 📊 **Gráfico 2:** Resumo por funil (pizza)
- 📊 **Gráfico 3:** Performance por etapa (barras)
- 📊 **Gráfico 4:** Performance de vendedores (tabela)

---

## ⚠️ **IMPORTANTE:**

### **🔐 PERMISSÕES:**
- Views herdam permissões da tabela base
- Usar **service_role** ou **authenticated** role
- Views ficam no schema `api` (mesmo da tabela)

### **🔄 ATUALIZAÇÕES:**
- Views se atualizam **automaticamente**
- Dados sempre sincronizados via cron
- **Não precisar** reprocessar no Looker

---

**🎯 RESUMO: Use VIEWS! Muito mais eficiente para dashboards!** 📊




