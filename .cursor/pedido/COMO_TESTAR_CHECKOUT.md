# 🧪 Como Testar o Checkout Transparente

## ✅ Checklist Antes de Testar

- [ ] Backend da API está rodando e acessível
- [ ] `CHECKOUT_API_URL` está configurada corretamente
- [ ] `CHECKOUT_API_KEY` está configurada (não pode ser `'sua_chave_api_backend'`)
- [ ] Console do navegador está aberto (F12) para ver os logs

---

## 🔍 Verificando a Configuração

### 1. Verificar se a API Key está configurada

Abra o console do navegador (F12) e digite:

```javascript
console.log('API URL:', window.CONFIG?.CHECKOUT_API_URL);
console.log('API Key:', window.CONFIG?.CHECKOUT_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA');
```

**Se aparecer "NÃO CONFIGURADA"**, você precisa:
- Configurar no `config.js` OU
- Configurar variáveis de ambiente no deploy

### 2. Verificar se o backend está acessível

No console, teste a conexão:

```javascript
fetch('SUA_API_URL/api/customers', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'SUA_CHAVE'
    },
    body: JSON.stringify({ name: 'Teste', cpfCnpj: '12345678900' })
})
.then(r => console.log('Status:', r.status))
.catch(e => console.error('Erro:', e));
```

---

## 🧪 Testando o Fluxo PIX

### Passo a Passo:

1. **Acesse a página de pré-checkout**
   - Exemplo: `https://pedido.oficialmed.com.br/pre-checkout/SEU_LINK_ID`

2. **Etapa 1 - Pedido**
   - Selecione pelo menos uma fórmula
   - Clique em "Próximo"

3. **Etapa 2 - Dados**
   - Preencha todos os campos obrigatórios
   - Clique em "Próximo"

4. **Etapa 3 - Pagamento**
   - **IMPORTANTE**: Clique no botão **PIX** (não deixe selecionado o cartão)
   - Verifique no console se apareceu: `💳 Método de pagamento selecionado: pix`
   - Clique em "Finalizar Compra"

5. **Verificar Logs no Console**

   Você deve ver uma sequência como esta:

   ```
   🔍 Verificando configuração da API...
   CHECKOUT_API_URL: https://api.oficialmed.com.br
   CHECKOUT_API_KEY configurada: Sim
   📝 Criando cliente no Asaas...
   Dados do cliente: {nome: "...", cpf: "...", ...}
   URL da API: https://api.oficialmed.com.br/api/customers
   ✅ Cliente criado: cus_xxxxx
   💳 Método de pagamento selecionado: pix
   💰 Valor total: 150.50
   💳 Criando pagamento PIX...
   📤 Enviando requisição para criar pagamento PIX:
   ✅ Pagamento PIX criado: {id: "pay_xxxxx", ...}
   📱 Buscando QR Code PIX...
   ✅ QR Code obtido: {encodedImage: "...", payload: "..."}
   🖼️ Exibindo QR Code na tela...
   ✅ Imagem do QR Code adicionada
   ```

---

## 🐛 Problemas Comuns e Soluções

### ❌ Erro: "API Key do checkout não configurada"

**Causa**: A `CHECKOUT_API_KEY` não está configurada ou ainda está com o valor padrão.

**Solução**:
1. Edite `config.js` e configure:
   ```javascript
   CHECKOUT_API_KEY: 'sua_chave_real_aqui'
   ```
2. OU configure variável de ambiente no deploy:
   ```
   VITE_CHECKOUT_API_KEY=sua_chave_real_aqui
   ```

### ❌ Erro: "Failed to fetch" ou "Network Error"

**Causa**: O backend não está acessível ou a URL está incorreta.

**Solução**:
1. Verifique se o backend está rodando
2. Verifique se a `CHECKOUT_API_URL` está correta
3. Teste a URL manualmente no navegador ou Postman

### ❌ Erro: "401 Unauthorized"

**Causa**: A API Key está incorreta ou não está sendo enviada.

**Solução**:
1. Verifique se a `CHECKOUT_API_KEY` está correta
2. Verifique se o backend está esperando o header `X-API-Key`
3. Teste a API diretamente com Postman/Insomnia

### ❌ QR Code não aparece

**Causa**: O QR Code foi criado mas não está sendo exibido.

**Solução**:
1. Verifique no console se apareceu: `✅ QR Code obtido`
2. Verifique se há erros no console
3. Verifique se o elemento `#form-pix` existe no HTML
4. Verifique se `qrCodeData.encodedImage` existe

### ❌ Método PIX não está selecionado

**Causa**: O usuário não clicou no botão PIX ou o método padrão é cartão.

**Solução**:
1. **IMPORTANTE**: Certifique-se de clicar no botão **PIX** antes de finalizar
2. Verifique no console: `💳 Método de pagamento selecionado: pix`
3. Se aparecer `cartao`, você precisa clicar no PIX primeiro

---

## 📊 Verificando se Está Conectando ao Asaas

### 1. Verificar Requisições de Rede

1. Abra o DevTools (F12)
2. Vá na aba **Network** (Rede)
3. Filtre por "customers" ou "payment"
4. Tente finalizar um pagamento
5. Verifique se aparecem requisições para:
   - `POST /api/customers`
   - `POST /api/payment`
   - `GET /api/payment/{id}/pix-qrcode`

### 2. Verificar Respostas da API

Clique em cada requisição e verifique:
- **Status**: Deve ser `200` ou `201`
- **Response**: Deve conter dados do cliente/pagamento
- **Headers**: Deve incluir `X-API-Key`

### 3. Verificar Erros

Se houver erros:
- **400**: Dados inválidos (verifique o payload)
- **401**: API Key inválida
- **404**: Endpoint não encontrado (verifique a URL)
- **500**: Erro no servidor (verifique logs do backend)

---

## 🔧 Testando Parcelamento

### Regras de Parcelamento

O número máximo de parcelas é calculado automaticamente:

| Valor Total | Parcelas Máximas |
|-------------|------------------|
| Até R$ 100,00 | 1x (à vista) |
| R$ 101,00 a R$ 250,00 | 2x |
| R$ 251,00 a R$ 600,00 | 4x |
| R$ 601,00 a R$ 1.000,00 | 6x |
| Acima de R$ 1.000,00 | 8x |

### Como Testar

1. Selecione fórmulas que somem um valor específico
2. Vá para a etapa de pagamento
3. Selecione "Cartão de Crédito"
4. Verifique se o select de parcelas mostra apenas as opções permitidas
5. Selecione uma parcela e finalize
6. Verifique no console se `installmentCount` foi enviado corretamente

---

## 📝 Logs de Debug

Todos os logs importantes estão no console. Se algo não funcionar:

1. **Abra o console** (F12)
2. **Filtre por "checkout" ou "pix"** para ver apenas logs relevantes
3. **Copie os logs** e envie para análise

### Logs Esperados (Sucesso)

```
🔍 Verificando configuração da API...
CHECKOUT_API_URL: https://api.oficialmed.com.br
CHECKOUT_API_KEY configurada: Sim
📝 Criando cliente no Asaas...
✅ Cliente criado: cus_xxxxx
💳 Método de pagamento selecionado: pix
💳 Criando pagamento PIX...
✅ Pagamento PIX criado: {id: "pay_xxxxx"}
📱 Buscando QR Code PIX...
✅ QR Code obtido: {encodedImage: "...", payload: "..."}
🖼️ Exibindo QR Code na tela...
✅ Imagem do QR Code adicionada
```

---

## ✅ Checklist de Teste Completo

- [ ] API Key configurada corretamente
- [ ] Backend acessível
- [ ] Cliente criado com sucesso
- [ ] Pagamento PIX criado com sucesso
- [ ] QR Code obtido e exibido
- [ ] Código PIX copiável
- [ ] Parcelamento funciona corretamente
- [ ] Pagamento com cartão funciona
- [ ] Modais de sucesso/pendente aparecem

---

**Última atualização:** Janeiro 2025
