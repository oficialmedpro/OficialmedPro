# 🎯 VIEW 01: FUNIL COMPRA APUCARANA COMPLETO

**📅 Data de Criação:** 20/08/2025  
**🔗 Nome da Conexão no Locker:** `FUNIL_COMPRA_APUCARANA_COMPLETO`  
**📊 Tipo:** View Híbrida (65 campos + classificações)  
**🎯 Objetivo:** Análise completa de conversão do funil de vendas  

---

## 🚀 **COMANDO SQL PARA CRIAR A VIEW:**

```sql
CREATE VIEW public.funil_compra_apucarana_completo AS
SELECT 
    -- TODOS OS 65 CAMPOS ORIGINAIS
    *,
    
    -- CLASSIFICAÇÕES DO FUNIL
    CASE 
        WHEN crm_column IN (130, 231) THEN 'TOP'
        WHEN crm_column IN (82, 207, 83, 85) THEN 'MEIO'
        WHEN crm_column = 232 THEN 'FUNDO'
    END AS segmento_funil,
    
    -- NOMES DAS ETAPAS
    CASE crm_column
        WHEN 130 THEN '[0] ENTRADA'
        WHEN 231 THEN '[1] ACOLHIMENTO/TRIAGEM'
        WHEN 82 THEN '[2] QUALIFICADO'
        WHEN 207 THEN '[3] ORÇAMENTO REALIZADO'
        WHEN 83 THEN '[4] NEGOCIAÇÃO'
        WHEN 85 THEN '[5] FOLLOW UP'
        WHEN 232 THEN '[6] CADASTRO'
    END AS etapa_nome,
    
    -- TIPOS DE LEADS
    CASE 
        WHEN crm_column IN (130, 231) THEN 'LEAD NOVO'
        WHEN crm_column IN (82, 207, 83, 85) THEN 'LEAD QUALIFICADO'
        WHEN crm_column = 232 THEN 'VENDA REALIZADA'
    END AS tipo_lead,
    
    -- STATUS DAS OPORTUNIDADES
    CASE 
        WHEN status = 'open' THEN 'OPORTUNIDADE ABERTA'
        WHEN status = 'won' THEN 'VENDA GANHA'
        WHEN status = 'lost' THEN 'VENDA PERDIDA'
        ELSE 'STATUS INDEFINIDO'
    END AS status_oportunidade,
    
    -- CORES PARA VISUALIZAÇÃO (opcional)
    CASE 
        WHEN status = 'open' THEN 'AZUL'
        WHEN status = 'won' THEN 'VERDE'
        WHEN status = 'lost' THEN 'VERMELHO'
        ELSE 'CINZA'
    END AS cor_status,
    
    -- PRIORIDADE PARA ANÁLISE
    CASE 
        WHEN crm_column = 232 AND status = 'won' THEN 'ALTA - VENDA REALIZADA'
        WHEN crm_column IN (83, 85) AND status = 'open' THEN 'ALTA - EM NEGOCIAÇÃO'
        WHEN crm_column IN (82, 207) AND status = 'open' THEN 'MÉDIA - QUALIFICADO'
        WHEN crm_column IN (130, 231) AND status = 'open' THEN 'BAIXA - LEAD NOVO'
        WHEN status = 'lost' THEN 'BAIXA - VENDA PERDIDA'
        ELSE 'MÉDIA - OUTROS'
    END AS prioridade_analise
    
FROM api.oportunidade_sprint 
WHERE crm_column IN (130, 231, 82, 207, 83, 85, 232)
ORDER BY crm_column, create_date DESC;
```

---

## 📊 **ESTRUTURA DOS DADOS:**

### **🎯 FUNIL COMPRA APUCARANA (ID: 6):**

| Etapa ID | Nome da Etapa | Segmento | Tipo de Lead | Descrição |
|----------|---------------|----------|--------------|-----------|
| 130 | [0] ENTRADA | TOP | LEAD NOVO | Lead recém-criado |
| 231 | [1] ACOLHIMENTO/TRIAGEM | TOP | LEAD NOVO | Lead sendo recepcionado |
| 82 | [2] QUALIFICADO | MEIO | LEAD QUALIFICADO | Lead qualificado para venda |
| 207 | [3] ORÇAMENTO REALIZADO | MEIO | LEAD QUALIFICADO | Orçamento enviado |
| 83 | [4] NEGOCIAÇÃO | MEIO | LEAD QUALIFICADO | Em processo de negociação |
| 85 | [5] FOLLOW UP | MEIO | LEAD QUALIFICADO | Acompanhamento pós-orçamento |
| 232 | [6] CADASTRO | FUNDO | VENDA REALIZADA | Venda concretizada |

---

## 🔍 **CAMPOS CALCULADOS DISPONÍVEIS:**

### **1. `segmento_funil`:**
- **TOP**: Etapas iniciais (130, 231)
- **MEIO**: Etapas de qualificação e negociação (82, 207, 83, 85)
- **FUNDO**: Etapa final de venda (232)

### **2. `etapa_nome`:**
- Nome descritivo de cada etapa
- Facilita identificação no Locker

### **3. `tipo_lead`:**
- **LEAD NOVO**: Etapas TOP
- **LEAD QUALIFICADO**: Etapas MEIO
- **VENDA REALIZADA**: Etapa FUNDO

### **4. `status_oportunidade`:**
- **OPORTUNIDADE ABERTA**: status = 'open'
- **VENDA GANHA**: status = 'won'
- **VENDA PERDIDA**: status = 'lost'

### **5. `cor_status`:**
- **AZUL**: Oportunidades abertas
- **VERDE**: Vendas ganhas
- **VERMELHO**: Vendas perdidas

### **6. `prioridade_analise`:**
- **ALTA**: Vendas realizadas e negociações ativas
- **MÉDIA**: Leads qualificados
- **BAIXA**: Leads novos e vendas perdidas

---

## 📈 **ANÁLISES PRINCIPAIS POSSÍVEIS:**

### **1. 📊 ANÁLISE DE CONVERSÃO:**
```sql
-- Taxa de conversão por segmento
SELECT 
    segmento_funil,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'won' THEN 1 END) as vendas_ganhas,
    ROUND((COUNT(CASE WHEN status = 'won' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2) as taxa_conversao
FROM funil_compra_apucarana_completo
GROUP BY segmento_funil
ORDER BY 
    CASE segmento_funil
        WHEN 'TOP' THEN 1
        WHEN 'MEIO' THEN 2
        WHEN 'FUNDO' THEN 3
    END;
```

### **2. 🎯 ANÁLISE POR ETAPA:**
```sql
-- Performance por etapa específica
SELECT 
    etapa_nome,
    COUNT(*) as total_oportunidades,
    SUM(value) as valor_total,
    AVG(value) as valor_medio,
    COUNT(CASE WHEN status = 'won' THEN 1 END) as vendas_ganhas
FROM funil_compra_apucarana_completo
GROUP BY etapa_nome, crm_column
ORDER BY crm_column;
```

### **3. 💰 ANÁLISE FINANCEIRA:**
```sql
-- Valor por segmento e status
SELECT 
    segmento_funil,
    status_oportunidade,
    COUNT(*) as total,
    SUM(value) as valor_total,
    AVG(value) as valor_medio
FROM funil_compra_apucarana_completo
GROUP BY segmento_funil, status_oportunidade
ORDER BY segmento_funil, status_oportunidade;
```

---

## 🛠️ **COMO USAR NO LOCKER STUDIO:**

### **1. 🔗 CONECTAR:**
- **Nome da Conexão**: `FUNIL_COMPRA_APUCARANA_COMPLETO`
- **Schema**: `public`
- **Tabela**: `funil_compra_apucarana_completo`

### **2. 🎯 FILTROS PRINCIPAIS:**
- **`segmento_funil`**: TOP, MEIO, FUNDO
- **`etapa_nome`**: Nome específico da etapa
- **`status_oportunidade`**: ABERTA, GANHA, PERDIDA
- **`prioridade_analise`**: ALTA, MÉDIA, BAIXA

### **3. 📅 FILTROS TEMPORAIS:**
- **`create_date`**: Data de criação
- **`update_date`**: Data da última atualização
- **`expected_close_date`**: Data esperada de fechamento

### **4. 💰 FILTROS FINANCEIROS:**
- **`value`**: Valor da oportunidade
- **`forma_pagamento`**: Forma de pagamento
- **`frete`**: Informações de frete

---

## 📊 **EXEMPLOS DE VISUALIZAÇÕES:**

### **1. 🎯 FUNIL DE CONVERSÃO:**
- **Gráfico de barras** com segmentos TOP → MEIO → FUNDO
- **Taxa de conversão** por segmento
- **Volume de oportunidades** por etapa

### **2. 📈 PERFORMANCE POR ETAPA:**
- **Gráfico de linha** com evolução por etapa
- **Valor médio** por etapa
- **Tempo médio** por etapa

### **3. 💰 ANÁLISE FINANCEIRA:**
- **Gráfico de pizza** com valor por status
- **Gráfico de barras** com valor por segmento
- **Tabela** com métricas consolidadas

---

## 🔄 **ATUALIZAÇÃO AUTOMÁTICA:**

### **✅ SINCRONIZAÇÃO:**
- **Frequência**: A cada 2 horas (6h às 22h)
- **Script**: `sync-incremental.js`
- **Status**: ✅ FUNCIONANDO PERFEITAMENTE
- **Container**: `sprinthub-sync_sprinthub-sync.1.xjt3bkawq0fa5htfkfvt86gw1`

### **📊 LOGS:**
- **Localização**: `/var/log/sync.log`
- **Monitoramento**: Via Docker logs
- **Última execução**: Sempre atualizada

---

## 🎯 **PRÓXIMOS PASSOS:**

### **📋 VIEWS COMPLEMENTARES:**
1. **View de Resumo por Status** - Análise consolidada
2. **View de Conversão por Segmento** - Taxas de conversão
3. **View de Performance por Etapa** - Métricas detalhadas

### **📊 DASHBOARDS:**
1. **Dashboard de Conversão** - Visão macro
2. **Dashboard por Etapa** - Análise granular
3. **Dashboard de Performance** - Métricas de vendas

---

## 🚨 **IMPORTANTE:**

### **✅ VANTAGENS:**
- **Todos os 65 campos** disponíveis
- **Classificações automáticas** para análise
- **Filtros organizados** por categoria
- **Dados sempre atualizados** via sincronização

### **⚠️ CONSIDERAÇÕES:**
- **View é só leitura** (não afeta inserções/updates)
- **Scripts continuam** usando tabela original
- **Performance otimizada** com filtros na origem

---

**🚀 Esta view é a base para todas as análises de conversão do funil de vendas!**
