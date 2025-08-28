# 🗄️ VIEWS SUPABASE - FUNIL COMPRA APUCARANA

**📅 Data de Criação:** 20/08/2025  
**🎯 Objetivo:** Análise completa de conversão do funil de vendas  
**📍 Localização:** Schema `public` do Supabase  

---

## 🚀 **VIEW PRINCIPAL: `funil_compra_apucarana_completo`**

### **🔗 Nome da Conexão no Locker Studio:**
```
FUNIL_COMPRA_APUCARANA_COMPLETO
```

### **📋 Descrição:**
View híbrida que combina todos os 65 campos da tabela original com classificações automáticas para análise de conversão do funil de vendas.

---

## 🎯 **CLASSIFICAÇÕES AUTOMÁTICAS:**

### **1. SEGMENTO DO FUNIL:**
- **`TOP`**: Etapas 130 + 231 (Entrada + Recepção)
- **`MEIO`**: Etapas 82 + 207 + 83 + 85 (Qualificação + Orçamento + Negociação + Follow-up)
- **`FUNDO`**: Etapa 232 (Cadastro/Venda)

### **2. ETAPAS DO FUNIL:**
- **130**: [0] ENTRADA
- **231**: [1] ACOLHIMENTO/TRIAGEM
- **82**: [2] QUALIFICADO
- **207**: [3] ORÇAMENTO REALIZADO
- **83**: [4] NEGOCIAÇÃO
- **85**: [5] FOLLOW UP
- **232**: [6] CADASTRO

### **3. TIPOS DE LEADS:**
- **`LEAD NOVO`**: Etapas TOP (130, 231)
- **`LEAD QUALIFICADO`**: Etapas MEIO (82, 207, 83, 85)
- **`VENDA REALIZADA`**: Etapa FUNDO (232)

### **4. STATUS DAS OPORTUNIDADES:**
- **`OPORTUNIDADE ABERTA`**: status = 'open'
- **`VENDA GANHA`**: status = 'won'
- **`VENDA PERDIDA`**: status = 'lost'

### **5. PRIORIDADE DE ANÁLISE:**
- **`ALTA - VENDA REALIZADA`**: Etapa 232 + status 'won'
- **`ALTA - EM NEGOCIAÇÃO`**: Etapas 83, 85 + status 'open'
- **`MÉDIA - QUALIFICADO`**: Etapas 82, 207 + status 'open'
- **`BAIXA - LEAD NOVO`**: Etapas 130, 231 + status 'open'
- **`BAIXA - VENDA PERDIDA`**: Qualquer etapa + status 'lost'

---

## 📊 **CAMPOS DISPONÍVEIS:**

### **✅ CAMPOS ORIGINAIS (65 campos):**
- Todos os campos da tabela `api.oportunidade_sprint`
- Inclui campos de oportunidade, lead, UTM, customizados

### **✅ CAMPOS CALCULADOS:**
- `segmento_funil`: TOP, MEIO, FUNDO
- `etapa_nome`: Nome descritivo da etapa
- `tipo_lead`: Classificação do tipo de lead
- `status_oportunidade`: Status organizado
- `cor_status`: Código de cor para visualização
- `prioridade_analise`: Prioridade para análise

---

## 🔍 **FILTROS DISPONÍVEIS NO LOCKER:**

### **📅 FILTROS TEMPORAIS:**
- `create_date`: Data de criação da oportunidade
- `update_date`: Data da última atualização
- `expected_close_date`: Data esperada de fechamento
- `synced_at`: Data da última sincronização

### **🎯 FILTROS DE FUNIL:**
- `segmento_funil`: TOP, MEIO, FUNDO
- `etapa_nome`: Nome específico da etapa
- `crm_column`: ID numérico da etapa

### **📊 FILTROS DE STATUS:**
- `status_oportunidade`: ABERTA, GANHA, PERDIDA
- `status`: open, won, lost (original)
- `archived`: 0 ou 1

### **💰 FILTROS FINANCEIROS:**
- `value`: Valor da oportunidade
- `forma_pagamento`: Forma de pagamento
- `frete`: Informações de frete

### **👥 FILTROS DE LEAD:**
- `lead_city`: Cidade do lead
- `lead_email`: Email do lead
- `lead_whatsapp`: WhatsApp do lead
- `origem_oportunidade`: Origem da oportunidade

### **🏷️ FILTROS DE CAMPANHA:**
- `campaign`: Nome da campanha
- `sale_channel`: Canal de venda
- `user_id`: ID do vendedor

---

## 📈 **ANÁLISES POSSÍVEIS:**

### **1. ANÁLISE DE CONVERSÃO:**
- Taxa de conversão por segmento (TOP → MEIO → FUNDO)
- Taxa de conversão por etapa específica
- Análise de perdas por etapa

### **2. ANÁLISE DE PERFORMANCE:**
- Valor médio por etapa
- Tempo médio por etapa
- Performance por vendedor

### **3. ANÁLISE DE LEADS:**
- Origem dos leads mais qualificados
- Qualificação por cidade/região
- Efetividade por campanha

### **4. ANÁLISE FINANCEIRA:**
- Valor total por segmento
- Valor médio por status
- Análise de frete e formas de pagamento

---

## 🛠️ **COMO USAR NO LOCKER STUDIO:**

### **1. CONECTAR:**
- **Nome da Conexão**: `FUNIL_COMPRA_APUCARANA_COMPLETO`
- **Schema**: `public`
- **Tabela**: `funil_compra_apucarana_completo`

### **2. FILTRAR DADOS:**
- Usar campos calculados para segmentação
- Aplicar filtros temporais para períodos específicos
- Filtrar por status para análise de conversão

### **3. CRIAR VISUALIZAÇÕES:**
- Gráficos de conversão por segmento
- Dashboards por etapa
- Análises temporais de performance

---

## 🔄 **ATUALIZAÇÃO AUTOMÁTICA:**

### **✅ SINCRONIZAÇÃO:**
- Dados atualizados automaticamente a cada 2 horas
- Script `sync-incremental.js` mantém dados sempre atuais
- View sempre reflete o estado mais recente dos dados

### **📊 LOGS DE SINCRONIZAÇÃO:**
- Container Docker: `sprinthub-sync_sprinthub-sync.1.xjt3bkawq0fa5htfkfvt86gw1`
- Logs disponíveis em: `/var/log/sync.log`
- Status: ✅ FUNCIONANDO PERFEITAMENTE

---

## 🎯 **PRÓXIMOS PASSOS:**

### **📋 VIEWS COMPLEMENTARES:**
1. **View de Resumo por Status** - Análise consolidada
2. **View de Conversão por Segmento** - Taxas de conversão
3. **View de Performance por Etapa** - Métricas detalhadas

### **📊 DASHBOARDS SUGERIDOS:**
1. **Dashboard de Conversão** - Visão macro do funil
2. **Dashboard por Etapa** - Análise granular
3. **Dashboard de Performance** - Métricas de vendas

---

**🚀 Esta view é a base para todas as análises de conversão do funil de vendas!**
