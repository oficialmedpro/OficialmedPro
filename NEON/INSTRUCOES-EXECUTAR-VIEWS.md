# 📊 INSTRUÇÕES PARA EXECUTAR AS VIEWS NO SUPABASE

**📅 Data:** 21/01/2025  
**🎯 Objetivo:** Criar views para dashboard Looker  
**📋 Arquivo SQL:** `views_dashboard_looker.sql`

---

## 🚨 **IMPORTANTE - PERMISSÕES:**

Como estou conectado como `supabase_read_only_user`, não posso criar as views diretamente. 

**Você precisa executar com permissões de administrador:**

### **💻 OPÇÃO 1 - Via Dashboard Supabase:**
1. Acesse: https://agdffspstbxeqhqtltvb.supabase.co
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `views_dashboard_looker.sql`
4. Execute

### **💻 OPÇÃO 2 - Via CLI:**
```bash
# Se tiver o Supabase CLI configurado
supabase db reset --linked
# Depois executar o SQL
```

---

## 📊 **VIEWS QUE SERÃO CRIADAS:**

### **1️⃣ `v_opps_enriquecidas`** *(Base principal)*
- ✅ Todos os campos da oportunidade + enriquecimentos
- ✅ Flags: `flag_venda`, `flag_ganho`, `flag_cadastro`
- ✅ Datas: `data_venda`, `data_ganho`, `data_cadastro`
- ✅ Origem final calculada (declarada > UTM > heurística)
- ✅ Métricas: `dias_ate_ganho`, `valor_em_aberto`
- ✅ Campo temporal: `data_referencia`

### **2️⃣ `v_leads_agg`** *(Por lead)*
- ✅ Agregações por `lead_id`
- ✅ Contadores: `qtd_gain`, `qtd_lost`, `qtd_open`
- ✅ Valores: `valor_gain_total`, `valor_lost_total`, `valor_open_total`
- ✅ Tickets médios por status
- ✅ Tempo médio até ganho

### **3️⃣ `v_vendedor_periodo`** *(Scoreboard)*
- ✅ Por vendedor + período (dia/semana/mês)
- ✅ Oportunidades criadas
- ✅ Vendas, ganhos, cadastros
- ✅ Ticket médio e taxa de conversão

### **4️⃣ `v_funil_etapas`** *(Análise de funil)*
- ✅ Entradas por etapa/período
- ✅ Taxa de passagem entre etapas
- ✅ Taxa de retenção do topo do funil

### **5️⃣ `v_origens`** *(Entrantes por origem)*
- ✅ Leads únicos no topo por origem
- ✅ Quebra detalhada por UTM
- ✅ Agrupamento por origem

### **6️⃣ `v_vendas_ultimas_2h`** *(Ronda 2/2h)*
- ✅ Vendas, ganhos e cadastros das últimas 2 horas
- ✅ Por vendedor e funil
- ✅ Atualização automática

---

## 🎯 **APÓS EXECUTAR AS VIEWS:**

### **🔧 No Looker:**
1. Conectar ao Supabase
2. Usar as views como fonte de dados
3. Configurar filtros de período
4. Usar `data_referencia` como campo temporal padrão

### **📊 Campos principais para dashboards:**
- **Temporal:** `data_referencia`, `periodo_dia`, `periodo_semana`, `periodo_mes`
- **Segmentação:** `funil_nome`, `etapa_nome`, `origem_final`, `origem_grupo`
- **Métricas:** `qtd_vendas`, `valor_vendas`, `qtd_ganhos`, `valor_ganhos`, `ticket_medio`
- **Usuários:** `user_id`, `usuario_nome`

---

## ✅ **TESTE RÁPIDO:**

Após executar, teste com:
```sql
-- Verificar se as views foram criadas
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE 'v_%';

-- Teste rápido da view principal
SELECT COUNT(*) as total_registros 
FROM public.v_opps_enriquecidas;
```

---

**🎉 PRONTO PARA O LOOKER!** 🚀


