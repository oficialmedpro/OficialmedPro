# 📊 Como Consultar Custos por Campanha do Google

## 🎯 Opção 1: Via SQL no Painel do Supabase (RECOMENDADO)

### Passos:
1. Acesse: https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb/sql
2. Cole a query abaixo no editor SQL
3. Clique em "Run" ou pressione Ctrl+Enter

### Query SQL (Custos por Campanha):
```sql
-- CUSTO POR CAMPANHA DO GOOGLE
SELECT 
    COALESCE(campanha, 'Sem Campanha') as campanha,
    COUNT(*) as total_registros,
    MIN(data) as primeira_data,
    MAX(data) as ultima_data,
    SUM(valor) as custo_total,
    AVG(valor) as custo_medio,
    ROUND((SUM(valor) * 100.0 / SUM(SUM(valor)) OVER ()), 2) as percentual
FROM api.investimento_patrocinados
WHERE plataforma = 'google'
GROUP BY campanha
ORDER BY SUM(valor) DESC;
```

### Query SQL (Custos nos Últimos 30 Dias):
```sql
SELECT 
    COALESCE(campanha, 'Sem Campanha') as campanha,
    COUNT(*) as total_registros,
    SUM(valor) as custo_total,
    AVG(valor) as custo_medio
FROM api.investimento_patrocinados
WHERE plataforma = 'google'
  AND data >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY campanha
ORDER BY SUM(valor) DESC;
```

### Query SQL (Resumo Mensal por Campanha 2024-2025):
```sql
SELECT 
    TO_CHAR(data, 'YYYY-MM') as mes,
    COALESCE(campanha, 'Sem Campanha') as campanha,
    COUNT(*) as registros,
    SUM(valor) as custo_total
FROM api.investimento_patrocinados
WHERE plataforma = 'google'
  AND data >= '2024-01-01'
GROUP BY TO_CHAR(data, 'YYYY-MM'), campanha
ORDER BY TO_CHAR(data, 'YYYY-MM') DESC, SUM(valor) DESC;
```

---

## 🎯 Opção 2: Via Script Node.js

### Pré-requisitos:
Você precisa da chave `VITE_SUPABASE_SERVICE_ROLE_KEY` válida dos Supabase Secrets.

### Como Executar:

#### 2.1. Definir a variável de ambiente (Windows PowerShell):
```powershell
$env:VITE_SUPABASE_SERVICE_ROLE_KEY="SUA_CHAVE_AQUI"
node get-campaigns-cost-simple.js
```

#### 2.2. Ou passar como argumento:
```bash
node get-campaigns-cost-simple.js SUA_CHAVE_AQUI
```

#### 2.3. Ou definir permanentemente (Windows CMD):
```cmd
set VITE_SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_AQUI
node get-campaigns-cost-simple.js
```

---

## 📁 Arquivos Criados

1. **`query-google-campaigns-cost.sql`**
   - Arquivo com 9 queries SQL diferentes
   - Consultas para estrutura da tabela, custos gerais, por período, etc.

2. **`get-campaigns-cost-simple.js`**
   - Script Node.js para buscar dados via API REST do Supabase
   - Exibe resultados formatados no terminal
   - Com paginação automática para grandes volumes

3. **`get-google-campaigns-cost.js`**
   - Versão anterior do script (mesmo propósito)

---

## 🔑 Como Obter a Chave do Supabase

### Via Painel do Supabase:
1. Acesse: https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb/settings/api
2. Copie a chave **`service_role key (secret)`**
3. ⚠️ **NUNCA commit essa chave no Git!**

### Via Supabase Secrets (Edge Functions):
As credenciais do Google já estão configuradas nos Secrets:
- `VITE_GOOGLE_CLIENT_SECRET`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CUSTOMER_ID`
- `VITE_GOOGLE_LOGIN_CUSTOMER_ID`
- `VITE_GOOGLE_REFRESH_TOKEN`
- `VITE_GOOGLE_DEVELOPER_TOKEN`

---

## 📊 Resultado Esperado

O script mostrará:
- ✅ Total de registros encontrados
- ✅ Colunas disponíveis na tabela
- ✅ Tabela com custos por campanha (ordenado por maior custo)
- ✅ Resumo geral (total investido, média, etc.)
- ✅ Top 10 campanhas
- ✅ Últimos 10 registros

Exemplo de saída:
```
💰 CUSTO POR CAMPANHA (ordenado por custo total):

═══════════════════════════════════════════════════════════
  1. Campanha A                  R$ 15.234,56    45 registros
  2. Campanha B                  R$ 12.890,23    38 registros
  3. Campanha C                  R$ 8.456,78     29 registros
═══════════════════════════════════════════════════════════

📈 RESUMO GERAL:
   Total investido: R$ 36.581,57
   Total de campanhas: 3
   Total de registros: 112
```

---

## ❓ Troubleshooting

### Erro 401: Invalid API key
- A chave do Supabase expirou ou está incorreta
- Obtenha uma nova chave no painel do Supabase

### Nenhum registro encontrado
- Verifique se há dados na tabela `api.investimento_patrocinados`
- Verifique se os registros têm `plataforma = 'google'`

### Erro de conexão
- Verifique sua conexão com a internet
- Verifique se o Supabase está acessível

---

## 🚀 Recomendação

**Use a Opção 1 (SQL no Painel do Supabase)** - É mais simples, rápida e não precisa de chaves no terminal.

