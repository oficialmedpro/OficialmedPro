# ✅ Verificação: API está na Última Versão?

## 📋 Checklist de Verificação

### ✅ Código Local (Última Versão)

**Funis Configurados:**
- ✅ Funil 6: [1] COMERCIAL APUCARANA
- ✅ Funil 9: [1] LOGÍSTICA MANIPULAÇÃO  
- ✅ Funil 14: [2] RECOMPRA
- ✅ Funil 34: [1] REATIVAÇÃO COMERCIAL (NOVO) - Etapas: 286, 287, 288, 289, 296
- ✅ Funil 38: [1] REATIVAÇÃO COMERCIAL (NOVO) - Etapas: 333, 334, 335, 336, 337, 338, 339, 352

**Funcionalidades:**
- ✅ Sincronização completa (Oportunidades → Leads → Segmentos)
- ✅ Lock para evitar execuções simultâneas
- ✅ Logs detalhados por funil e etapa
- ✅ Tratamento de erros robusto

---

## 🧪 Como Testar se a API Está na Última Versão

### 1. Verificar Health Check

```bash
curl https://sincrocrm.oficialmed.com.br/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "service": "API Sync Opportunities",
  "timestamp": "..."
}
```

### 2. Verificar Logs do Servidor

```bash
# Ver logs recentes
docker service logs --tail 200 sprint-sync_sincronizacao

# Verificar se menciona os 5 funis
docker service logs sprint-sync_sincronizacao 2>&1 | grep -E "Funil (6|9|14|34|38)"
```

**Deve mostrar:**
- `📋 Total de funis a processar: 5 (6, 9, 14, 34, 38)`
- `📊 Processando Funil 34: [1] REATIVAÇÃO COMERCIAL`
- `📊 Processando Funil 38: [1] REATIVAÇÃO COMERCIAL`

### 3. Verificar no Banco de Dados

```sql
-- Verificar se funis 34 e 38 têm dados
SELECT 
    funil_id, 
    COUNT(*) as total,
    MIN(create_date) as primeira_oportunidade,
    MAX(update_date) as ultima_atualizacao
FROM api.oportunidade_sprint 
WHERE funil_id IN (34, 38)
GROUP BY funil_id
ORDER BY funil_id;
```

**Se retornar dados, a API está sincronizando os funis novos!**

### 4. Iniciar Sincronização de Teste

```bash
# Via API
curl "https://sincrocrm.oficialmed.com.br/sync/all?trigger=test_manual"

# Via servidor (ver logs em tempo real)
docker service logs -f sprint-sync_sincronizacao
```

**Verificar nos logs:**
- ✅ Menciona "Total de funis a processar: 5"
- ✅ Processa Funil 34
- ✅ Processa Funil 38
- ✅ Sincroniza Leads
- ✅ Sincroniza Segmentos

---

## 🔍 Verificação Rápida

### Se a API está na última versão, você verá:

1. **Nos logs:**
   ```
   📋 Total de funis a processar: 5 (6, 9, 14, 34, 38)
   📊 Processando Funil 34: [1] REATIVAÇÃO COMERCIAL
   📊 Processando Funil 38: [1] REATIVAÇÃO COMERCIAL
   ```

2. **No banco de dados:**
   - Oportunidades com `funil_id = 34`
   - Oportunidades com `funil_id = 38`

3. **Na resposta da API:**
   - Resumo mostra 5 funis processados
   - Não há erros relacionados a funis não encontrados

---

## ⚠️ Se NÃO Estiver na Última Versão

### Sintomas:
- Logs mostram apenas 3 funis (6, 9, 14)
- Erro "Configuração não encontrada para Funil 34"
- Banco de dados não tem oportunidades dos funis 34 e 38

### Solução:
1. Verificar se o deploy foi feito corretamente
2. Verificar se o código foi atualizado no servidor
3. Fazer redeploy:
   ```bash
   cd /etc/easypanel/projects/sprint-sync && \
   docker service scale sprint-sync_sincronizacao=0 && \
   sleep 5 && \
   docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && \
   docker service scale sprint-sync_sincronizacao=1
   ```

---

**Última atualização:** Novembro 2025  
**Versão esperada:** Com funis 34 e 38 configurados

