# Serviços Sprint

> Referência centralizada de integrações entre o projeto OficialMed e a SprintHub.  
> Atualizado em **13/11/2025**.

## Visão Geral

Este documento descreve todos os serviços e fluxos necessários para criar, atualizar, consultar e sincronizar **Leads**, **Oportunidades**, **Tags**, **Atendimentos**, **Arquivos** e **Objetos Customizados** na SprintHub, incluindo as regras de deduplicação e logging exigidas pelo projeto.

- URL base (sem protocolo): `sprinthub-api-master.sprinthub.app`
- Instância padrão: configurar via `VITE_SPRINTHUB_INSTANCE`
- Token/API Key: configurar via `VITE_SPRINTHUB_API_TOKEN`
- Autenticação: `Authorization: Bearer <token>` + query `?apitoken=<token>&i=<instancia>`
- Todas as requisições utilizam `Content-Type: application/json`

> **Importante:** Antes de qualquer criação/atualização na SprintHub, realizamos logs no Supabase (tabela `api.sprinthub_sync_logs`) para evitar duplicidades. Consulte a seção [Logging e Deduplicação](#logging-e-deduplicação).

## Configuração das Variáveis de Ambiente

Adicionar no arquivo `.env` (ou secrets correspondentes):

```
VITE_SPRINTHUB_BASE_URL=sprinthub-api-master.sprinthub.app
VITE_SPRINTHUB_INSTANCE=oficialmed
VITE_SPRINTHUB_API_TOKEN=<<TOKEN>>
VITE_SPRINTHUB_FUNNEL_ID=<<ID_FUNIL_PADRAO>>
VITE_SPRINTHUB_COLUMN_ID=<<ID_COLUNA_PADRAO>>
VITE_SPRINTHUB_SEQUENCE_ID=0
VITE_SPRINTHUB_USER_ID=<<ID_VENDEDOR_PADRAO>>
VITE_SPRINTHUB_ORDER_OBJECT_ID=<<ID_OBJETO_CUSTOM_PEDIDOS>>
VITE_SPRINTHUB_ORDER_FIELD_MAP={"numero":"numero_pedido","data":"data_pedido","valor":"valor_total","status":"status_pedido","tipo":"tipo_registro","resumo":"resumo_pedido","orcamento":"resumo_orcamento"}
VITE_SPRINTHUB_PROXY_BASE=/api/sprinthub/proxy
```

> O proxy padrão `/api/sprinthub/proxy` evita problemas de CORS ao acessar a SprintHub pelo navegador. Se preferir chamadas diretas (por exemplo, em scripts Node), defina `VITE_SPRINTHUB_PROXY_BASE=direct`.

## Leads

### Buscar Leads (deduplicação)

`POST /leadsadvanced?i=<instancia>`

```json
{
  "query": "{leads{id,fullname,email,whatsapp,mobile}}",
  "search": "billgates@teste.com",
  "page": 0,
  "limit": 15
}
```

Retorna `data.leads[]` contendo identificadores e contatos. Usado antes de criar novos leads.

### Criar Lead

`POST /leads?apitoken=<token>&i=<instancia>`

Corpo exemplo:

```json
{
  "firstname": "Bill",
  "lastname": "Gates",
  "email": "billgates@teste.com",
  "whatsapp": "+5511999990000",
  "city": "São Paulo",
  "state": "SP",
  "country": "Brazil",
  "preferred_locale": "pt-BR"
}
```

### Atualizar Lead

1. **Via ID:** `PUT /leads?apitoken=<token>&i=<instancia>`  
   Corpo contém apenas os campos a serem alterados.
2. **Por campo único (e-mail/whatsapp):**  
   `PUT /leadsbyfield/email/billgates@teste.com?i=<instancia>&apitoken=<token>`

### Tags do Lead

- Listar tags da instância: `GET /tags?apitoken=<token>&i=<instancia>`
- Obter tags atuais do lead: `GET /leads/{id}?query={tags{id,tag,color}}&apitoken=<token>&i=<instancia>`
- Atualizar tags (sobrescrita): `PUT /leads/{id}?apitoken=<token>&i=<instancia>` com corpo:

```json
{
  "tags": [80, 77, 12]
}
```

## Oportunidades

### Consultar Oportunidade

`GET /crmopportunity/{id}?apitoken=<token>&i=<instancia>`

### Criar Oportunidade

`POST /crmopportunity?id=<funil>&i=<instancia>`

```json
{
  "title": "Reativação | Bill Gates",
  "value": 350.5,
  "crm_column": 159,
  "lead_id": 8473,
  "sequence": 2,
  "status": "open",
  "user": 156,
  "fields": {
    "ultimo_pedido": "Pedido #123 - 10/10/2025 - R$ 350,50 - APROVADO",
    "ultimo_orcamento": "Orçamento #456 - 09/10/2025 - R$ 580,00"
  }
}
```

### Atualizar Oportunidade

`PUT /crmopportunity/{opportunityId}?id=<funil>&i=<instancia>`

### Listar Oportunidades do Lead

`GET /listopportunitysleadcomplete/{leadId}?i=<instancia>`  
Usado para garantir que não exista oportunidade duplicada no mesmo funil/coluna.

### Fila combinada (Lead + Oportunidade)

`POST /api/queue?i=<instancia>`  
Enviar objeto `{"endpoints": [{...lead...}, {...opportunity...}]}` quando desejarmos executar as duas criações de forma sequencial/backoffice.

Exemplo de payload:

```json
{
  "endpoints": [
    {
      "url": "https://sprinthub-api-master.sprinthub.app/leads",
      "method": "POST",
      "body": {
        "firstname": "Bill",
        "lastname": "Gates",
        "email": "billgates@teste.com"
      }
    },
    {
      "url": "https://sprinthub-api-master.sprinthub.app/crmopportunity?id=14",
      "method": "POST",
      "body": {
        "title": "Reativação | Bill Gates",
        "value": 350.5,
        "lead_id": 8473
      }
    }
  ]
}
```

## SAC360 (Atendimentos & Arquivos)

- **Listar atendimentos de um lead:** `GET /sac360/lead/{leadId}?i=<instancia>`
- **Listar arquivos por atendimento:** `GET /sac360/list_file_attendance/{attendanceId}?i=<instancia>`
- **Listar todos arquivos de um lead:** `GET /sac360/list_file_lead/{leadId}?i=<instancia>`

As respostas incluem tipo (`audio`, `video`), URLs diretas e caminhos S3. Persistir essas informações para consulta rápida no monitoramento.

## Objetos Customizados (Histórico de Pedidos)

Usaremos objetos customizados para replicar o histórico de pedidos Prime no perfil do lead.

1. **Obter objetos de um lead:**  
   `GET /lead/customobjects/{leadId}?apitoken=<token>&i=<instancia>`
2. **Obter definições disponíveis:**  
   `GET /customobjects/def?query={definitions{id,name,pluralName,fields{label,alias}}}&apitoken=<token>&i=<instancia>`
3. **Criar objeto customizado (pedido):**  
   `POST /customobjects/objects/{definitionId}?apitoken=<token>&i=<instancia>`
4. **Relacionar objeto ao lead:**  
   `POST /customobjects/link?apitoken=<token>&i=<instancia>`

Corpo padrão para relacionamento:

```json
{
  "objectId": 123,
  "linkType": "lead",
  "targetId": 8473,
  "amount": 1
}
```

> A definição padrão para pedidos (configurada via `VITE_SPRINTHUB_ORDER_OBJECT_ID`) deve conter campos para número do pedido, data, valor, status, resumo e link para o orçamento. Ajuste o mapeamento via `VITE_SPRINTHUB_ORDER_FIELD_MAP`.

## Logging e Deduplicação

Tabela: `api.sprinthub_sync_logs`

| Campo         | Tipo        | Descrição                                             |
|---------------|-------------|---------------------------------------------------------|
| id            | bigint      | Identificador interno                                  |
| entity_type   | text        | lead, opportunity, order, tag, sac360_file, etc.       |
| entity_id     | text        | ID da entidade na SprintHub                            |
| action        | text        | create, update, sync-orders, sync-tags, etc.           |
| signature     | text (único)| Hash dos dados sincronizados                           |
| payload       | jsonb       | Dados enviados                                         |
| response      | jsonb       | Resposta da SprintHub                                  |
| status        | text        | success, skipped, error, pending                       |
| error_message | text        | Mensagem de erro (quando status = 'error')             |
| metadata      | jsonb       | Metadados adicionais da sincronização                  |
| created_at    | timestamptz | Timestamp de criação                                   |
| updated_at   | timestamptz | Timestamp da última atualização                        |

- Antes de inserir/atualizar qualquer entidade, calcular `signature` (hash) e verificar a existência na tabela.  
- Caso já exista com status `success`, pular sincronização.  
- Em erros (HTTP 4xx/5xx), registrar `status = 'error'` e retornar mensagem para retry manual.

### Estrutura do Signature

O `signature` é um hash calculado a partir de:
- `entityType`: tipo da entidade (lead, opportunity, order, etc.)
- `entityId`: identificador da entidade na SprintHub
- `action`: ação realizada (create, update, sync-order, etc.)
- `payload`: dados enviados na requisição

Isso garante que a mesma operação com os mesmos dados não seja executada duas vezes.

### Consultar Logs

Para verificar o status de uma sincronização:

```sql
SELECT * FROM api.sprinthub_sync_logs 
WHERE entity_type = 'lead' 
  AND entity_id = '8473'
ORDER BY created_at DESC;
```

Para identificar sincronizações com erro:

```sql
SELECT * FROM api.sprinthub_sync_logs 
WHERE status = 'error'
ORDER BY created_at DESC
LIMIT 50;
```

## Fluxo de Envio (Reativação / Monitoramento)

1. Usuário seleciona clientes na lista.
2. O botão **“Enviar para SprintHub”** chama `sprinthubService.ensureLeadAndOpportunity` para cada cliente.
3. Passos automáticos para cada cliente:
   - Deduplicar lead (`leadsadvanced`).
   - Criar ou atualizar lead (dados pessoais, contatos, endereço).
   - Sincronizar tags (mapear origens ⇄ IDs Sprint).
   - Sincronizar histórico de pedidos:
     - Obter pedidos Prime (Supabase) → gerar objetos customizados → registrar logs.
   - Verificar oportunidades existentes no funil alvo.
   - Criar/atualizar oportunidade com resumo do último pedido e orçamento.
   - Registrar logs de cada etapa.
4. Exibir relatório final (sucessos, pulos por duplicidade, erros).

## Regras Importantes

- **Telefone/WhatsApp:** sempre enviar com `+55` ou `55` (DDI). Função utilitária `sanitizePhone()` garante normalização automática.
- **Título da oportunidade:** usar prefixo configurável via estado do componente (`sprinthubTituloPrefix`), ex.: `MONITORAMENTO 28-7 05-8 | Nome`. O prefixo pode ser ajustado na interface das páginas de Reativação e Monitoramento.
- **Valor da oportunidade:** preferir último pedido aprovado; caso não exista, usar orçamento.
- **Campos customizados:** alias definidos no mapeamento do objeto customizado (ex.: `resumo_pedido`, `resumo_orcamento`). O mapeamento é configurado via `VITE_SPRINTHUB_ORDER_FIELD_MAP`.
- **Tags:** mapear nomes padronizados (origens, segmentos) para IDs oficiais. Manter mapeamento em `sprinthubService`.
- **Atendimentos:** armazenar `accid`, `type`, `startDate`, `lastMessage`, `urls` e registrar logs para evitar reprocessamento.
- **Tratamento de erros:** erros HTTP 4xx/5xx são registrados na tabela de logs com `status = 'error'` e `error_message` preenchido. A função `ensureLeadAndOpportunity` retorna um objeto `summary` com array `errors` contendo todos os erros encontrados durante o processo.

## Integração com Supabase

- Funções principais do `sprinthubService` utilizam `supabase.schema('api')` para:
  - Ler pedidos Prime (`prime_pedidos`, `prime_formulas`).
  - Ler/atualizar logs (`sprinthub_sync_logs`).
  - Persistir metadados adicionais conforme necessário.

## Próximos Passos

- Revisar e preencher variáveis de ambiente.
- Executar `supabase/sql/20251111_create_sprinthub_sync_logs.sql` no banco.
- Adicionar o botão “Enviar para SprintHub” às páginas de Reativação e Monitoramento (com modal de confirmação e relatório).
- Criar jobs de sincronização periódica para:
  - Atualizar tags conforme mudanças no Supabase.
  - Replicar atendimentos SAC360 e arquivos relevantes.
  - Atualizar pedidos do Prime (objetos customizados) sem intervenção manual.

---

> **Referência rápida:** Para detalhes sobre o consumo dos endpoints acima dentro do código, consulte `src/service/sprinthubService.js`.  
> Este documento deve ser linkado por qualquer nova documentação que dependa de integrações com a SprintHub.


