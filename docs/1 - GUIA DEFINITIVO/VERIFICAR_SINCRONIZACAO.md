# 🔍 Como Verificar se a Sincronização Está Funcionando

## ✅ Status Atual

A API está respondendo e a sincronização foi iniciada!

---

## 📊 Verificar Logs da Sincronização

### No Servidor (SSH):

```bash
# Ver logs em tempo real
docker service logs -f sprint-sync_sincronizacao

# Ver últimas 100 linhas
docker service logs --tail 100 sprint-sync_sincronizacao

# Filtrar por funis específicos
docker service logs sprint-sync_sincronizacao 2>&1 | grep "Funil"

# Ver progresso de oportunidades
docker service logs sprint-sync_sincronizacao 2>&1 | grep "Oportunidades:"

# Ver progresso de leads
docker service logs sprint-sync_sincronizacao 2>&1 | grep "Leads:"

# Ver progresso de segmentos
docker service logs sprint-sync_sincronizacao 2>&1 | grep "Segmentos:"
```

---

## 🎯 Verificar Funis Sincronizados

A sincronização deve processar **5 funis**:

1. **Funil 6** - [1] COMERCIAL APUCARANA
   - Etapas: 130, 231, 82, 207, 83, 85, 232

2. **Funil 9** - [1] LOGÍSTICA MANIPULAÇÃO
   - Etapas: 101, 243, 266, 244, 245, 105, 108, 267, 109, 261, 262, 263, 278, 110

3. **Funil 14** - [2] RECOMPRA
   - Etapas: 202, 228, 229, 206, 203, 204, 230, 205, 269, 167, 148, 168, 149, 169, 150

4. **Funil 34** - [1] REATIVAÇÃO COMERCIAL
   - Etapas: 286, 287, 288, 289, 296

5. **Funil 38** - [1] REATIVAÇÃO COMERCIAL
   - Etapas: 333, 334, 335, 336, 337, 338, 339, 352

### Verificar nos Logs:

```bash
# Ver se todos os funis foram processados
docker service logs sprint-sync_sincronizacao 2>&1 | grep -E "Funil (6|9|14|34|38)"
```

---

## 📈 Verificar no Banco de Dados (Supabase)

### Verificar Oportunidades Sincronizadas:

```sql
-- Total de oportunidades
SELECT COUNT(*) as total FROM api.oportunidade_sprint;

-- Por funil
SELECT funil_id, COUNT(*) as total 
FROM api.oportunidade_sprint 
GROUP BY funil_id 
ORDER BY funil_id;

-- Verificar funis 34 e 38 (novos)
SELECT funil_id, COUNT(*) as total 
FROM api.oportunidade_sprint 
WHERE funil_id IN (34, 38)
GROUP BY funil_id;
```

### Verificar Leads Sincronizados:

```sql
-- Total de leads
SELECT COUNT(*) as total FROM api.leads;

-- Leads com campos críticos preenchidos
SELECT 
    COUNT(*) as total,
    COUNT(firstname) as com_firstname,
    COUNT(lastname) as com_lastname,
    COUNT(whatsapp) as com_whatsapp
FROM api.leads;
```

### Verificar Segmentos Sincronizados:

```sql
-- Total de segmentos
SELECT COUNT(*) as total FROM api.segmentos;
```

---

## 🔄 Verificar Status da Sincronização

### Via API:

```bash
# Verificar se está rodando
curl https://sincrocrm.oficialmed.com.br/metrics

# Verificar status
curl https://sincrocrm.oficialmed.com.br/status
```

### Via Logs:

```bash
# Ver se a sincronização terminou
docker service logs sprint-sync_sincronizacao 2>&1 | grep -E "SINCRONIZAÇÃO COMPLETA|concluída|finalizada"

# Ver resumo final
docker service logs sprint-sync_sincronizacao 2>&1 | tail -50
```

---

## ✅ Checklist de Verificação

- [ ] API responde no `/health`
- [ ] Sincronização iniciou (logs mostram "INICIANDO SINCRONIZAÇÃO COMPLETA")
- [ ] Funil 6 processado
- [ ] Funil 9 processado
- [ ] Funil 14 processado
- [ ] Funil 34 processado (novo)
- [ ] Funil 38 processado (novo)
- [ ] Leads sincronizados
- [ ] Segmentos sincronizados
- [ ] Sincronização concluída (logs mostram "SINCRONIZAÇÃO COMPLETA FINALIZADA")
- [ ] Dados no banco atualizados

---

## 🐛 Troubleshooting

### Se a sincronização não iniciar:

```bash
# Verificar se o serviço está rodando
docker service ps sprint-sync_sincronizacao

# Verificar erros
docker service logs sprint-sync_sincronizacao 2>&1 | grep -i error

# Reiniciar o serviço
docker service scale sprint-sync_sincronizacao=0
sleep 5
docker service scale sprint-sync_sincronizacao=1
```

### Se algum funil não sincronizar:

```bash
# Ver logs específicos do funil
docker service logs sprint-sync_sincronizacao 2>&1 | grep "Funil 34"
docker service logs sprint-sync_sincronizacao 2>&1 | grep "Funil 38"
```

---

**Última atualização:** Novembro 2025

