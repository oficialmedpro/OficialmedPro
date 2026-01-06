# Página de Pré-Checkout - OFICIALMED

Esta é uma página standalone de pré-checkout que carrega dados dinamicamente do Supabase.

## 📁 Estrutura

```
.cursor/pedido/
├── index.html    # Estrutura HTML
├── styles.css    # Estilos CSS
├── app.js        # Lógica JavaScript
└── README.md     # Este arquivo
```

## 🚀 Como Usar

### 1. Configurar Supabase

Edite `config.js` e atualize as variáveis:

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://seu-projeto.supabase.co',
    SUPABASE_KEY: 'sua-chave-anon', // ⚠️ Use apenas a chave pública (anon)
    SUPABASE_SCHEMA: 'api',
    API_URL: 'https://api.oficialmed.com.br',
    BASE_URL: 'https://pedido.oficialmed.com.br'
};
```

**⚠️ IMPORTANTE:** Use apenas a chave **anon** (pública) do Supabase, nunca a service_role!

### 2. Publicar no Easypanel

1. Crie um novo serviço no Easypanel
2. Faça upload dos arquivos (`index.html`, `styles.css`, `app.js`)
3. Configure como um serviço estático (nginx/apache)
4. Configure a URL base (ex: `pedido.oficialmed.com.br`)

### 3. Acessar a Página

A página espera receber o `linkId` de duas formas:

**Opção 1:** Via URL path
```
https://pedido.oficialmed.com.br/pre-checkout/ABC123XYZ...
```

**Opção 2:** Via query parameter
```
https://pedido.oficialmed.com.br/pre-checkout?link=ABC123XYZ...
```

## ✨ Funcionalidades

- ✅ Carrega dados do Supabase automaticamente
- ✅ Exibe informações do orçamento
- ✅ Lista todas as fórmulas
- ✅ Permite selecionar/deselecionar itens (checkbox)
- ✅ Calcula total automaticamente
- ✅ Design responsivo
- ✅ Validação de expiração do link

## 🎨 Design

- Header azul escuro com logo
- Cards de fórmulas com checkbox
- Resumo com total destacado
- Badges de confiança
- Mensagem de validade

## 📱 Responsivo

A página é totalmente responsiva e se adapta a:
- Desktop
- Tablet
- Mobile

## ⚙️ Configuração

### Variáveis de Ambiente

Se necessário, você pode configurar via variáveis de ambiente no Easypanel e atualizar o `app.js` para lê-las.

### Customização

Para customizar cores, edite `styles.css`:

```css
/* Cores principais */
--primary-color: #1a3a5f;
--secondary-color: #2c5282;
```

## 🔗 Integração com API

Após o cliente selecionar os itens e clicar em "Finalizar", você pode configurar um webhook ou redirecionamento para o endpoint de checkout.

## 📝 Notas

- A página valida se o link expirou
- Todas as fórmulas vêm selecionadas por padrão
- O cálculo do total é feito em tempo real
- Não há botão de "Finalizar Compra" nesta versão (pode ser adicionado)
