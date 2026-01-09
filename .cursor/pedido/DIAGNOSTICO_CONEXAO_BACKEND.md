# 🔍 Diagnóstico de Conexão com Backend

## ✅ Checklist de Verificação

### 1. **Configuração da API Key**

Abra o console do navegador (F12) e digite:

```javascript
console.log('API URL:', window.CONFIG?.CHECKOUT_API_URL);
console.log('API Key:', window.CONFIG?.CHECKOUT_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA');
```

**Se aparecer "NÃO CONFIGURADA"**, você precisa:
- Configurar no `config.js`: `CHECKOUT_API_KEY: 'sua_chave_real'`
- OU configurar variável de ambiente: `VITE_CHECKOUT_API_KEY=sua_chave_real`

### 2. **Verificar se o Backend está Acessível**

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
.then(r => {
    console.log('Status:', r.status);
    return r.text();
})
.then(text => console.log('Resposta:', text))
.catch(e => console.error('Erro:', e));
```

### 3. **Logs Esperados no Console**

Quando você tentar finalizar um pagamento PIX, você deve ver:

```
🔍 Verificando configuração da API...
CHECKOUT_API_URL: https://api.oficialmed.com.br
CHECKOUT_API_KEY configurada: Sim
📝 Criando cliente no Asaas...
📤 Criando cliente com payload: {...}
🔗 URL: https://api.oficialmed.com.br/api/customers
📥 Resposta do servidor: 200 OK
✅ Cliente criado: {...}
💳 Criando pagamento PIX...
📤 Enviando requisição para criar pagamento PIX:
URL: https://api.oficialmed.com.br/api/payment
Payload: {...}
📥 Resposta recebida: 200 OK
✅ Dados do pagamento recebidos: {...}
📱 Buscando QR Code PIX...
✅ QR Code obtido: {...}
```

## 🐛 Problemas Comuns

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

### ❌ Erro: "Failed to fetch" ou "NetworkError"

**Causa**: O backend não está acessível ou a URL está incorreta.

**Solução**:
1. Verifique se o backend está rodando
2. Verifique se a `CHECKOUT_API_URL` está correta
3. Teste a URL manualmente no navegador ou Postman
4. Verifique CORS no backend (deve permitir requisições do frontend)

### ❌ Erro: "401 Unauthorized"

**Causa**: A API Key está incorreta ou não está sendo enviada.

**Solução**:
1. Verifique se a `CHECKOUT_API_KEY` está correta
2. Verifique se o backend está esperando o header `X-API-Key`
3. Teste a API diretamente com Postman/Insomnia

### ❌ Erro: "404 Not Found"

**Causa**: O endpoint não existe ou a URL está incorreta.

**Solução**:
1. Verifique se o backend tem os endpoints:
   - `POST /api/customers`
   - `POST /api/payment`
   - `GET /api/payment/{id}/pix-qrcode`
2. Verifique se a `CHECKOUT_API_URL` está correta (sem barra no final)

### ❌ PIX não gera QR Code

**Causa**: O pagamento foi criado mas o QR Code não foi buscado ou não foi exibido.

**Solução**:
1. Verifique no console se apareceu: `✅ QR Code obtido`
2. Verifique se há erros no console
3. Verifique se o elemento `#form-pix` existe no HTML
4. Verifique se `qrCodeData.encodedImage` existe na resposta

## 📊 Verificando Requisições de Rede

1. Abra o DevTools (F12)
2. Vá na aba **Network** (Rede)
3. Filtre por "customers" ou "payment"
4. Tente finalizar um pagamento
5. Verifique se aparecem requisições para:
   - `POST /api/customers`
   - `POST /api/payment`
   - `GET /api/payment/{id}/pix-qrcode`

### Verificar Respostas

Clique em cada requisição e verifique:
- **Status**: Deve ser `200` ou `201`
- **Response**: Deve conter dados do cliente/pagamento
- **Headers**: Deve incluir `X-API-Key` na requisição

## 🔧 Comparação com React

O código atual usa `fetch` diretamente, enquanto o React usa `api.post` (wrapper do axios).

**Estrutura atual (fetch):**
```javascript
fetch(`${CHECKOUT_API_URL}/api/customers`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CHECKOUT_API_KEY
    },
    body: JSON.stringify(payload)
})
```

**Estrutura React (api.post):**
```javascript
api.post('/api/customers', payload)
```

Ambos devem funcionar, mas o `fetch` precisa da URL completa e headers explícitos.

## ✅ Teste Rápido

Execute no console do navegador:

```javascript
// 1. Verificar configuração
console.log('URL:', window.CONFIG?.CHECKOUT_API_URL);
console.log('Key:', window.CONFIG?.CHECKOUT_API_KEY ? 'OK' : 'FALTANDO');

// 2. Testar conexão
fetch(window.CONFIG?.CHECKOUT_API_URL + '/api/customers', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': window.CONFIG?.CHECKOUT_API_KEY
    },
    body: JSON.stringify({ name: 'Teste', cpfCnpj: '12345678900' })
})
.then(r => console.log('Status:', r.status))
.catch(e => console.error('Erro:', e));
```

---

**Última atualização:** Janeiro 2025
