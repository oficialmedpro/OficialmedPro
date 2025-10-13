# 📄 Sincronização de Leads por Segmento Específico

Este script permite sincronizar apenas os leads de um segmento específico do SprintHub para sua base Supabase, usando um endpoint dedicado e paginação.

---

### 📥 Endpoint Utilizado

```
POST https://sprinthub-api-master.sprinthub.app/leadsfromtype/segment/{segmentId}
```

### 📝 Corpo (body) enviado (exemplo):

```
{
  "page": 0,
  "limit": 100,
  "orderByKey": "createDate",
  "orderByDirection": "desc",
  "showAnon": false,
  "search": "",
  "query": "{total,leads{id,fullname,photoUrl,email,points,city,state,country,lastActive,archived,owner{completName},companyData{companyname},createDate}}",
  "showArchived": false,
  "additionalFilter": null,
  "idOnly": false
}
```

---

## 🚀 Como Executar

1. Defina as variáveis de ambiente (.env) necessárias:
   - VITE_SPRINTHUB_BASE_URL
   - VITE_SPRINTHUB_API_TOKEN
   - VITE_SPRINTHUB_INSTANCE
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_SERVICE_ROLE_KEY

2. Execute o script informando o ID do segmento:

```bash
node src/sincronizacao/leads/sync-leads-by-segment.js 123
```
(Substitua 123 pelo ID do segmento desejado)

- O script salva checkpoint a cada página e pode ser interrompido/continuado
- Insere e atualiza leads conforme se já existem no Supabase

---

## 🛠️ Detalhes técnicos

- Faz paginação automática até acabar os leads daquele segmento
- Campos gravados: aqueles retornados pelo endpoint e mapeados no script
- Usa as funções já consolidadas do projeto para requisição e persistência no banco
  - Respeita insert/update evitando duplicidade
- Mostra barra de progresso a cada página

---

## 📝 Exemplo de resposta do endpoint

```
{
  "data": {
    "total": 1234,
    "leads": [ ... ]
  }
}
```

---

## Observações

- **Não altera scripts de sincronização já existentes**
- O arquivo de checkpoint será `checkpoint-leads-by-segment.json`
- Script seguro para executar quantas vezes quiser para o segmento escolhido

---

🗂️ **Arquivo**: `sync-leads-by-segment.js`

Autor: Assistente AI (implementação por código gerado via IA com revisão técnica)
