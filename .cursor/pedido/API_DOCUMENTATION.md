# 📚 Documentação da API - Checkout Transparente

Documentação completa dos endpoints para implementação do checkout transparente com integração Asaas.

## 🔐 Autenticação

Todas as requisições devem incluir o header de autenticação:

```
X-API-Key: sua_chave_api_backend
```

**Base URL:** `http://localhost:3001` (ou a URL configurada do seu backend)

---

## 📋 Índice

1. [Criar Cliente](#1-criar-cliente)
2. [Criar Pagamento (Cartão de Crédito)](#2-criar-pagamento-cartão-de-crédito)
3. [Criar Pagamento (PIX)](#3-criar-pagamento-pix)
4. [Buscar QR Code PIX](#4-buscar-qr-code-pix)
5. [Criar Assinatura/Recorrência](#5-criar-assinaturarecorrência)
6. [Regras de Parcelamento](#6-regras-de-parcelamento)

---

## 1. Criar Cliente

Cria um novo cliente no sistema Asaas.

### Endpoint

```
POST /api/customers
```

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `name` | string | Nome completo do cliente | `"João Silva"` |
| `cpfCnpj` | string | CPF ou CNPJ (apenas números ou formatado) | `"12345678900"` ou `"123.456.789-00"` |

### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `email` | string | E-mail do cliente | `"joao@example.com"` |
| `phone` | string | Telefone fixo (apenas números ou formatado) | `"11999999999"` ou `"(11) 99999-9999"` |
| `mobilePhone` | string | Celular (apenas números ou formatado) | `"11999999999"` ou `"(11) 99999-9999"` |
| `address` | string | Rua/Endereço | `"Rua das Flores"` |
| `addressNumber` | string | Número do endereço | `"123"` |
| `complement` | string | Complemento (máx. 255 caracteres) | `"Apto 45"` |
| `province` | string | Bairro | `"Centro"` |
| `postalCode` | string | CEP (apenas números ou formatado) | `"01310000"` ou `"01310-000"` |
| `city` | string | Cidade | `"São Paulo"` |
| `company` | string | Nome da empresa | `"Empresa XYZ Ltda"` |
| `additionalEmails` | string | Emails adicionais separados por vírgula | `"email1@example.com,email2@example.com"` |
| `observations` | string | Observações sobre o cliente | `"Cliente preferencial"` |
| `externalReference` | string | Referência externa do cliente | `"CLI-12345"` |
| `notificationDisabled` | boolean | Desabilitar notificações | `false` |
| `municipalInscription` | string | Inscrição municipal | `"123456789"` |
| `stateInscription` | string | Inscrição estadual | `"123456789"` |
| `groupName` | string | Nome do grupo do cliente | `"Grupo VIP"` |
| `foreignCustomer` | boolean | Cliente estrangeiro | `false` |

### Exemplo de Requisição

```json
{
  "name": "João Silva",
  "cpfCnpj": "123.456.789-00",
  "email": "joao@example.com",
  "phone": "(11) 99999-9999",
  "mobilePhone": "(11) 98888-8888",
  "address": "Rua das Flores",
  "addressNumber": "123",
  "complement": "Apto 45",
  "province": "Centro",
  "postalCode": "01310-000",
  "city": "São Paulo",
  "company": "Empresa XYZ",
  "additionalEmails": "email1@example.com,email2@example.com",
  "observations": "Cliente preferencial"
}
```

### Exemplo de Resposta (Sucesso)

```json
{
  "success": true,
  "customer": {
    "object": "customer",
    "id": "cus_000005401844",
    "dateCreated": "2024-07-12",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "mobilePhone": "11988888888",
    "cpfCnpj": "12345678900",
    "personType": "FISICA",
    "address": "Rua das Flores",
    "addressNumber": "123",
    "complement": "Apto 45",
    "province": "Centro",
    "city": "São Paulo",
    "postalCode": "01310000"
  }
}
```

### Exemplo de Resposta (Erro)

```json
{
  "error": "Erro ao criar cliente",
  "details": {
    "errors": [
      {
        "code": "invalid_cpf",
        "description": "CPF inválido"
      }
    ]
  }
}
```

### Observações

- O backend remove automaticamente caracteres especiais de CPF/CNPJ, telefones e CEP antes de enviar ao Asaas
- Apenas os campos preenchidos são enviados ao Asaas
- Campos vazios não são incluídos na requisição

---

## 2. Criar Pagamento (Cartão de Crédito)

Cria um pagamento com cartão de crédito, com suporte a parcelamento.

### Endpoint

```
POST /api/payment
```

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `customerId` | string | ID do cliente criado anteriormente | `"cus_000005401844"` |
| `billingType` | string | Tipo de pagamento (deve ser `"CREDIT_CARD"`) | `"CREDIT_CARD"` |
| `value` | number | Valor do pagamento (mínimo R$ 1,00) | `150.50` |
| `creditCard` | object | Dados do cartão de crédito | Ver abaixo |
| `creditCardHolderInfo` | object | Dados do portador do cartão | Ver abaixo |
| `remoteIp` | string | IP do cliente | `"192.168.1.1"` |

### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `description` | string | Descrição do pagamento | `"Produto Teste"` |
| `installmentCount` | integer | Número de parcelas (ver regras abaixo) | `3` |

### Objeto `creditCard`

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `holderName` | string | Nome no cartão (MAIÚSCULAS) | `"JOAO SILVA"` |
| `number` | string | Número do cartão (13-19 dígitos) | `"4111111111111111"` |
| `expiryMonth` | string | Mês de expiração (2 dígitos) | `"12"` |
| `expiryYear` | string | Ano de expiração (4 dígitos) | `"2025"` |
| `ccv` | string | Código de segurança (3-4 dígitos) | `"123"` |

### Objeto `creditCardHolderInfo`

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `name` | string | Nome completo | `"João Silva"` |
| `email` | string | E-mail | `"joao@example.com"` |
| `cpfCnpj` | string | CPF/CNPJ (apenas números) | `"12345678900"` |
| `postalCode` | string | CEP (apenas números) | `"01310000"` |
| `addressNumber` | string | Número do endereço | `"123"` |
| `phone` | string | Telefone (apenas números) | `"11999999999"` |

### Regras de Parcelamento

O número máximo de parcelas é calculado automaticamente baseado no valor:

| Faixa de Valor | Parcelas Máximas |
|----------------|------------------|
| Até R$ 100,00 | 1x (à vista) |
| R$ 101,00 a R$ 250,00 | 2x |
| R$ 251,00 a R$ 600,00 | 4x |
| R$ 601,00 a R$ 1.000,00 | 6x |
| Acima de R$ 1.000,00 | 8x |

**Importante:** 
- Se `installmentCount` não for enviado ou for `1`, o pagamento será à vista
- Se `installmentCount > 1`, o backend automaticamente adiciona `totalValue` igual ao `value`

### Exemplo de Requisição (À Vista)

```json
{
  "customerId": "cus_000005401844",
  "billingType": "CREDIT_CARD",
  "value": 50.00,
  "description": "Produto Teste",
  "creditCard": {
    "holderName": "JOAO SILVA",
    "number": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "ccv": "123"
  },
  "creditCardHolderInfo": {
    "name": "João Silva",
    "email": "joao@example.com",
    "cpfCnpj": "12345678900",
    "postalCode": "01310000",
    "addressNumber": "150",
    "phone": "11999999999"
  },
  "remoteIp": "192.168.1.1"
}
```

### Exemplo de Requisição (Parcelado)

```json
{
  "customerId": "cus_000005401844",
  "billingType": "CREDIT_CARD",
  "value": 500.00,
  "description": "Produto Teste",
  "installmentCount": 4,
  "creditCard": {
    "holderName": "JOAO SILVA",
    "number": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "ccv": "123"
  },
  "creditCardHolderInfo": {
    "name": "João Silva",
    "email": "joao@example.com",
    "cpfCnpj": "12345678900",
    "postalCode": "01310000",
    "addressNumber": "150",
    "phone": "11999999999"
  },
  "remoteIp": "192.168.1.1"
}
```

### Exemplo de Resposta (Sucesso)

```json
{
  "success": true,
  "payment": {
    "object": "payment",
    "id": "pay_080225913252",
    "dateCreated": "2024-07-12",
    "customer": "cus_000005401844",
    "value": 500.00,
    "netValue": 485.00,
    "originalValue": 500.00,
    "description": "Produto Teste",
    "billingType": "CREDIT_CARD",
    "status": "CONFIRMED",
    "dueDate": "2024-07-15",
    "paymentDate": "2024-07-12",
    "installmentNumber": 1,
    "installmentCount": 4,
    "creditCard": {
      "creditCardNumber": "1111",
      "creditCardBrand": "VISA"
    }
  }
}
```

### Exemplo de Resposta (Erro)

```json
{
  "error": "Erro ao criar pagamento",
  "details": {
    "errors": [
      {
        "code": "invalid_card",
        "description": "Cartão inválido"
      }
    ]
  }
}
```

### Observações

- O número do cartão deve ter entre 13 e 19 dígitos
- O backend remove automaticamente caracteres não numéricos do número do cartão
- A data de vencimento é calculada automaticamente (3 dias a partir da data atual)
- Para pagamentos parcelados, o Asaas cria automaticamente as parcelas subsequentes

---

## 3. Criar Pagamento (PIX)

Cria um pagamento via PIX.

### Endpoint

```
POST /api/payment
```

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `customerId` | string | ID do cliente criado anteriormente | `"cus_000005401844"` |
| `billingType` | string | Tipo de pagamento (deve ser `"PIX"`) | `"PIX"` |
| `value` | number | Valor do pagamento (mínimo R$ 1,00) | `150.50` |

### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `description` | string | Descrição do pagamento | `"Produto Teste"` |

### Exemplo de Requisição

```json
{
  "customerId": "cus_000005401844",
  "billingType": "PIX",
  "value": 150.50,
  "description": "Produto Teste"
}
```

### Exemplo de Resposta (Sucesso)

```json
{
  "success": true,
  "payment": {
    "object": "payment",
    "id": "pay_080225913252",
    "dateCreated": "2024-07-12",
    "customer": "cus_000005401844",
    "value": 150.50,
    "netValue": 147.99,
    "description": "Produto Teste",
    "billingType": "PIX",
    "status": "PENDING",
    "dueDate": "2024-07-15",
    "pixQrCodeId": "qr_abc123"
  }
}
```

### Observações

- Após criar o pagamento PIX, você deve buscar o QR Code usando o endpoint `/api/payment/{paymentId}/pix-qrcode`
- O status inicial do pagamento PIX é `PENDING`
- O pagamento PIX expira automaticamente após o vencimento

---

## 4. Buscar QR Code PIX

Busca o QR Code de um pagamento PIX criado.

### Endpoint

```
GET /api/payment/{paymentId}/pix-qrcode
```

### Parâmetros da URL

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `paymentId` | string | ID do pagamento PIX | `"pay_080225913252"` |

### Exemplo de Requisição

```
GET /api/payment/pay_080225913252/pix-qrcode
```

### Exemplo de Resposta (Sucesso)

```json
{
  "success": true,
  "pixQrCode": {
    "encodedImage": "iVBORw0KGgoAAAANSUhEUgAA...",
    "payload": "00020126580014br.gov.bcb.pix...",
    "expirationDate": "2024-07-15T23:59:59"
  }
}
```

### Campos da Resposta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `encodedImage` | string | Imagem do QR Code em Base64 (PNG) |
| `payload` | string | Código PIX para copiar e colar |
| `expirationDate` | string | Data de expiração do QR Code |

### Exemplo de Uso no Frontend

```javascript
// Exibir imagem do QR Code
const qrCodeImage = `data:image/png;base64,${response.data.pixQrCode.encodedImage}`;
// <img src={qrCodeImage} alt="QR Code PIX" />

// Copiar código PIX
const pixCode = response.data.pixQrCode.payload;
```

---

## 5. Criar Assinatura/Recorrência

Cria uma assinatura recorrente (mensal).

### Endpoint

```
POST /api/subscription
```

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `customerId` | string | ID do cliente criado anteriormente | `"cus_000005401844"` |
| `billingType` | string | Tipo de pagamento (`"CREDIT_CARD"`, `"BOLETO"` ou `"PIX"`) | `"CREDIT_CARD"` |
| `value` | number | Valor mensal da assinatura | `50.00` |
| `months` | integer | Duração da assinatura (1, 2 ou 3 meses) | `3` |

### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `description` | string | Descrição da assinatura | `"Assinatura Premium"` |

### Campos para Cartão de Crédito

Se `billingType` for `"CREDIT_CARD"`, também são obrigatórios:

- `creditCard` (mesmo formato do pagamento)
- `creditCardHolderInfo` (mesmo formato do pagamento)
- `remoteIp`

### Exemplo de Requisição (Cartão de Crédito)

```json
{
  "customerId": "cus_000005401844",
  "billingType": "CREDIT_CARD",
  "value": 50.00,
  "months": 3,
  "description": "Assinatura Premium",
  "creditCard": {
    "holderName": "JOAO SILVA",
    "number": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "ccv": "123"
  },
  "creditCardHolderInfo": {
    "name": "João Silva",
    "email": "joao@example.com",
    "cpfCnpj": "12345678900",
    "postalCode": "01310000",
    "addressNumber": "150",
    "phone": "11999999999"
  },
  "remoteIp": "192.168.1.1"
}
```

### Exemplo de Requisição (PIX)

```json
{
  "customerId": "cus_000005401844",
  "billingType": "PIX",
  "value": 50.00,
  "months": 3,
  "description": "Assinatura Premium"
}
```

### Exemplo de Resposta (Sucesso)

```json
{
  "success": true,
  "subscription": {
    "object": "subscription",
    "id": "sub_abc123",
    "dateCreated": "2024-07-12",
    "customer": "cus_000005401844",
    "value": 50.00,
    "nextDueDate": "2024-08-15",
    "cycle": "MONTHLY",
    "maxPayments": 3,
    "status": "ACTIVE",
    "description": "Assinatura Premium"
  }
}
```

### Observações

- A assinatura é criada com ciclo mensal (`MONTHLY`)
- O primeiro pagamento será cobrado 3 dias após a criação
- Os pagamentos subsequentes serão cobrados mensalmente
- O número máximo de pagamentos é definido pelo campo `months` (1, 2 ou 3)

---

## 6. Regras de Parcelamento

### Cálculo de Parcelas Máximas

O número máximo de parcelas é calculado automaticamente baseado no valor total do pagamento:

| Faixa de Valor | Parcelas Máximas | Exemplo |
|----------------|------------------|---------|
| Até R$ 100,00 | **1x** (à vista) | R$ 50,00 = apenas à vista |
| R$ 101,00 a R$ 250,00 | **2x** | R$ 200,00 = até 2x |
| R$ 251,00 a R$ 600,00 | **4x** | R$ 500,00 = até 4x |
| R$ 601,00 a R$ 1.000,00 | **6x** | R$ 800,00 = até 6x |
| Acima de R$ 1.000,00 | **8x** | R$ 1.500,00 = até 8x |

### Implementação no Frontend

```javascript
function getMaxInstallments(value) {
  if (value <= 100) return 1;      // Até R$ 100: à vista (1x)
  if (value <= 250) return 2;       // R$ 101 a 250: até 2x
  if (value <= 600) return 4;       // R$ 251 a 600: até 4x
  if (value <= 1000) return 6;     // R$ 601 a 1000: até 6x
  return 8;                        // Acima de R$ 1000: até 8x
}

// Exemplo de uso
const paymentValue = 500.00;
const maxInstallments = getMaxInstallments(paymentValue); // Retorna 4

// Gerar opções de parcelas
const installmentOptions = [];
for (let i = 1; i <= maxInstallments; i++) {
  const installmentValue = paymentValue / i;
  installmentOptions.push({
    value: i,
    label: i === 1 
      ? `À vista - R$ ${installmentValue.toFixed(2)}`
      : `${i}x de R$ ${installmentValue.toFixed(2)}`
  });
}
```

### Envio ao Backend

Quando o usuário selecionar parcelas, envie o campo `installmentCount` no payload:

```json
{
  "customerId": "cus_000005401844",
  "billingType": "CREDIT_CARD",
  "value": 500.00,
  "installmentCount": 4,  // Número de parcelas selecionado
  // ... outros campos
}
```

**Importante:**
- Se `installmentCount` não for enviado ou for `1`, o pagamento será à vista
- O backend automaticamente adiciona `totalValue` igual ao `value` quando há parcelamento
- O Asaas calcula automaticamente o valor de cada parcela

---

## 🔄 Fluxo Completo de Checkout Transparente

### Fluxo 1: Pagamento com Cartão de Crédito

```
1. Criar Cliente
   POST /api/customers
   → Retorna: customer.id

2. Criar Pagamento
   POST /api/payment
   {
     "customerId": "...",
     "billingType": "CREDIT_CARD",
     "value": 500.00,
     "installmentCount": 4,
     "creditCard": {...},
     "creditCardHolderInfo": {...},
     "remoteIp": "..."
   }
   → Retorna: payment (status: CONFIRMED ou PENDING)
```

### Fluxo 2: Pagamento com PIX

```
1. Criar Cliente
   POST /api/customers
   → Retorna: customer.id

2. Criar Pagamento PIX
   POST /api/payment
   {
     "customerId": "...",
     "billingType": "PIX",
     "value": 150.50
   }
   → Retorna: payment.id

3. Buscar QR Code PIX
   GET /api/payment/{paymentId}/pix-qrcode
   → Retorna: QR Code (imagem e código)
```

### Fluxo 3: Assinatura/Recorrência

```
1. Criar Cliente
   POST /api/customers
   → Retorna: customer.id

2. Criar Assinatura
   POST /api/subscription
   {
     "customerId": "...",
     "billingType": "CREDIT_CARD",
     "value": 50.00,
     "months": 3,
     "creditCard": {...},
     "creditCardHolderInfo": {...},
     "remoteIp": "..."
   }
   → Retorna: subscription
```

---

## ⚠️ Tratamento de Erros

### Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| `200` | Sucesso |
| `400` | Erro de validação (campos inválidos) |
| `401` | Não autenticado (API Key inválida ou ausente) |
| `500` | Erro interno do servidor |

### Formato de Erro

```json
{
  "error": "Descrição do erro",
  "details": {
    "errors": [
      {
        "code": "error_code",
        "description": "Descrição detalhada do erro"
      }
    ]
  }
}
```

### Exemplos de Erros Comuns

**Cliente já existe:**
```json
{
  "error": "Erro ao criar cliente",
  "details": {
    "errors": [
      {
        "code": "customer_already_exists",
        "description": "Cliente com este CPF/CNPJ já está cadastrado"
      }
    ]
  }
}
```

**Cartão inválido:**
```json
{
  "error": "Erro ao criar pagamento",
  "details": {
    "errors": [
      {
        "code": "invalid_card",
        "description": "Cartão de crédito inválido"
      }
    ]
  }
}
```

---

## 📝 Notas Importantes

1. **Formatação de Dados:**
   - O backend remove automaticamente caracteres especiais de CPF/CNPJ, telefones e CEP
   - Você pode enviar dados formatados ou não formatados

2. **Validação:**
   - Sempre valide os dados no frontend antes de enviar
   - O backend também faz validações e retorna erros descritivos

3. **Segurança:**
   - Nunca exponha a API Key do Asaas no frontend
   - Use a API Key do backend (configurada no header `X-API-Key`)
   - O IP do cliente (`remoteIp`) pode ser obtido do backend ou usar um IP público

4. **Ambiente Sandbox:**
   - Para testes, use cartões de teste do Asaas
   - Cartão de teste: `4111111111111111` (16 dígitos)
   - CVV: qualquer número de 3-4 dígitos
   - Validade: qualquer data futura

5. **Parcelamento:**
   - Apenas pagamentos com cartão de crédito suportam parcelamento
   - PIX e Boleto são sempre à vista
   - Assinaturas não suportam parcelamento (são mensais)

---

## 🧪 Exemplos de Código

### JavaScript/TypeScript (Axios)

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3001';
const API_KEY = 'sua_chave_api_backend';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  }
});

// Criar Cliente
async function createCustomer(customerData) {
  try {
    const response = await api.post('/api/customers', customerData);
    return response.data.customer;
  } catch (error) {
    console.error('Erro ao criar cliente:', error.response?.data);
    throw error;
  }
}

// Criar Pagamento com Cartão
async function createPayment(paymentData) {
  try {
    const response = await api.post('/api/payment', paymentData);
    return response.data.payment;
  } catch (error) {
    console.error('Erro ao criar pagamento:', error.response?.data);
    throw error;
  }
}

// Buscar QR Code PIX
async function getPixQrCode(paymentId) {
  try {
    const response = await api.get(`/api/payment/${paymentId}/pix-qrcode`);
    return response.data.pixQrCode;
  } catch (error) {
    console.error('Erro ao buscar QR Code:', error.response?.data);
    throw error;
  }
}
```

### Exemplo Completo: Checkout com Cartão

```javascript
async function processCheckout(formData) {
  try {
    // 1. Criar cliente
    const customer = await createCustomer({
      name: formData.name,
      cpfCnpj: formData.cpfCnpj,
      email: formData.email,
      phone: formData.phone,
      // ... outros campos opcionais
    });

    // 2. Criar pagamento
    const payment = await createPayment({
      customerId: customer.id,
      billingType: 'CREDIT_CARD',
      value: formData.value,
      installmentCount: formData.installments, // Se > 1
      description: 'Produto Teste',
      creditCard: {
        holderName: formData.cardHolderName.toUpperCase(),
        number: formData.cardNumber,
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        ccv: formData.ccv
      },
      creditCardHolderInfo: {
        name: formData.name,
        email: formData.email,
        cpfCnpj: formData.cpfCnpj.replace(/\D/g, ''),
        postalCode: formData.postalCode.replace(/\D/g, ''),
        addressNumber: formData.addressNumber,
        phone: formData.phone.replace(/\D/g, '')
      },
      remoteIp: '192.168.1.1' // Obter do backend ou usar IP público
    });

    return payment;
  } catch (error) {
    console.error('Erro no checkout:', error);
    throw error;
  }
}
```

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Documentação oficial do Asaas: https://docs.asaas.com
- Logs do backend para detalhes de erros
- Código de exemplo no repositório

---

**Última atualização:** Janeiro 2025
