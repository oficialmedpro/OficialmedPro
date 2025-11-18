# 🚀 Deploy das Correções - Leads e Funis

## ✅ Correções Aplicadas

### 1. **Leads - Mapeamento Completo**
- ✅ Busca detalhes individuais de **TODOS** os leads sem campos críticos
- ✅ Suporte para `fullname` → separa em firstname/lastname
- ✅ Suporte para `contacts` (array ou objeto) para telefones
- ✅ Fallback: extrai nome do email se não tiver nome
- ✅ Melhor parsing de dados

### 2. **Funis 34 e 38 - Debug e Logs**
- ✅ Logs detalhados para cada funil e etapa
- ✅ Debug específico para funis 34 e 38
- ✅ Mostra estrutura da primeira oportunidade recebida
- ✅ Melhor tratamento de erros com stack trace

---

## 📦 Deploy da API de Sincronização

### Comando para Deploy:

```bash
ssh root@srv1109021
cd /etc/easypanel/projects/sprint-sync && \
docker service scale sprint-sync_sincronizacao=0 && \
sleep 5 && \
docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && \
docker service scale sprint-sync_sincronizacao=1 && \
echo "✅ API de sincronização atualizada!"
```

---

## 🧪 Teste Após Deploy

### 1. Verificar se o serviço subiu:
```bash
docker service ps sprint-sync_sincronizacao
```

### 2. Verificar logs:
```bash
docker service logs -f sprint-sync_sincronizacao | tail -50
```

### 3. Testar sincronização completa:
```bash
curl "https://sincrocrm.oficialmed.com.br/sync/all?trigger=teste_pos_deploy"
```

### 4. Verificar nos logs:
- ✅ Se está buscando detalhes individuais dos leads
- ✅ Se está processando funis 34 e 38
- ✅ Se os logs de debug aparecem para funis 34 e 38

---

## 📊 Verificação no Banco

### Verificar leads com campos críticos:
```sql
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN firstname IS NOT NULL AND firstname != '' THEN 1 END) as com_firstname,
    COUNT(CASE WHEN lastname IS NOT NULL AND lastname != '' THEN 1 END) as com_lastname,
    COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as com_whatsapp
FROM api.leads;
```

### Verificar oportunidades por funil:
```sql
SELECT 
    funil_id,
    COUNT(*) as total,
    MAX(update_date) as ultima_atualizacao
FROM api.oportunidade_sprint
GROUP BY funil_id
ORDER BY funil_id;
```

---

## 🎯 Resultado Esperado

Após o deploy e re-sincronização:
- ✅ **Leads**: Muito mais leads com firstname/lastname/whatsapp preenchidos
- ✅ **Funis 34 e 38**: Sincronizando corretamente (se tiverem oportunidades)
- ✅ **Logs**: Mostrando debug detalhado para diagnóstico

---

**Status:** ✅ Código corrigido e commitado  
**Próximo passo:** Deploy e re-sincronização

