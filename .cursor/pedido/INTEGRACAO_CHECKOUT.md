# 🔄 Integração com Checkout Transparente (Asaas)

## 📋 Configuração

### 1. Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env` do seu backend ou no `config.js`:

```javascript
// config.js
const CONFIG = {
    // ... outras configurações
    
    // API do Checkout Transparente (Asaas)
    CHECKOUT_API_URL: 'http://localhost:3001',  // URL do seu backend
    CHECKOUT_API_KEY: 'sua_chave_api_backend'    // Chave de autenticação
};
```

### 2. Onde Configurar

#### Opção 1: Arquivo `config.js` (Recomendado para desenvolvimento)
Edite o arquivo `.cursor/pedido/config.js` e adicione:

```javascript
CHECKOUT_API_URL: 'http://localhost:3001',
CHECKOUT_API_KEY: 'sua_chave_api_backend'
```

#### Opção 2: Variáveis de Ambiente (Recomendado para produção)
Configure no seu servidor ou plataforma de deploy:

```bash
VITE_CHECKOUT_API_URL=https://api.oficialmed.com.br
VITE_CHECKOUT_API_KEY=sua_chave_api_backend
```

## 🔄 Fluxo de Integração

### Fluxo Completo

1. **Etapa 1 - Pedido**: Usuário seleciona fórmulas
2. **Etapa 2 - Dados**: Usuário preenche dados pessoais
3. **Etapa 3 - Pagamento**: 
   - Usuário escolhe método (PIX ou Cartão)
   - Preenche dados do cartão (se aplicável)
   - Clica em "Finalizar Compra"

### Processamento do Pagamento

#### Para PIX:
1. Cria cliente no Asaas via `POST /api/customers`
2. Cria pagamento PIX via `POST /api/payment` com `billingType: "PIX"`
3. Busca QR Code via `GET /api/payment/{paymentId}/pix-qrcode`
4. Exibe QR Code na tela para o usuário escanear

#### Para Cartão de Crédito:
1. Cria cliente no Asaas via `POST /api/customers`
2. Cria pagamento via `POST /api/payment` com `billingType: "CREDIT_CARD"`
3. Verifica status do pagamento:
   - `CONFIRMED`: Pagamento aprovado → Mostra modal de sucesso
   - `PENDING`: Pagamento pendente → Mostra modal aguardando

## 💰 Valor do Pagamento

O valor usado é o **valor total calculado** (subtotal + frete), não dinâmico:

```javascript
const subtotal = calcularSubtotal();  // Soma das fórmulas selecionadas
const frete = calcularFrete(subtotal); // Frete baseado no subtotal
const valorTotal = subtotal + frete;   // Valor final enviado para API
```

## 📦 Parcelamento

O número máximo de parcelas é calculado automaticamente baseado no valor:

| Faixa de Valor | Parcelas Máximas |
|----------------|------------------|
| Até R$ 100,00 | 1x (à vista) |
| R$ 101,00 a R$ 250,00 | 2x |
| R$ 251,00 a R$ 600,00 | 4x |
| R$ 601,00 a R$ 1.000,00 | 6x |
| Acima de R$ 1.000,00 | 8x |

As opções de parcelas são atualizadas automaticamente quando o usuário entra na etapa de pagamento.

## 🔐 Autenticação

Todas as requisições incluem o header:

```
X-API-Key: sua_chave_api_backend
```

## 📝 Endpoints Utilizados

### 1. Criar Cliente
```
POST /api/customers
```

### 2. Criar Pagamento
```
POST /api/payment
```

### 3. Buscar QR Code PIX
```
GET /api/payment/{paymentId}/pix-qrcode
```

## ⚠️ Tratamento de Erros

- Se a API Key não estiver configurada, mostra erro ao tentar finalizar
- Erros da API são exibidos em alertas para o usuário
- Todos os erros são rastreados via analytics (se configurado)

## 📊 Rastreamento

Os seguintes eventos são rastreados (se analytics estiver configurado):

- `finalizar_compra_click`: Quando usuário clica em finalizar
- `pagamento_pix_criado`: Quando pagamento PIX é criado
- `pagamento_cartao_aprovado`: Quando pagamento com cartão é aprovado
- `pagamento_cartao_pendente`: Quando pagamento com cartão está pendente
- `pagamento_erro`: Quando ocorre erro no processamento

## 🔧 Desenvolvimento

Para testar localmente:

1. Configure o `CHECKOUT_API_URL` para `http://localhost:3001` (ou a porta do seu backend)
2. Configure o `CHECKOUT_API_KEY` com a chave do seu backend
3. Certifique-se de que o backend está rodando
4. Teste o fluxo completo de checkout

## 📚 Documentação Completa

Consulte `API_DOCUMENTATION.md` para detalhes completos dos endpoints e payloads.
