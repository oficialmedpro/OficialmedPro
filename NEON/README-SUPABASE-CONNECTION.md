# 🔗 Configuração de Conexão com Supabase

Este diretório contém as configurações necessárias para conectar ao Supabase em outros projetos.

## 📁 Arquivos Criados

### 1. `supabase.env` - Variáveis de Ambiente
Contém todas as credenciais e configurações do Supabase:
- URL do projeto
- Service Role Key
- Configurações do SprintHub (opcional)
- Schema padrão

### 2. `supabase-connection-example.js` - Exemplo de Uso
Demonstra como usar as variáveis de ambiente para conectar ao Supabase.

### 3. `README-SUPABASE-CONNECTION.md` - Este arquivo
Documentação completa de uso.

## 🚀 Como Usar em Outros Projetos

### Passo 1: Copiar o arquivo `.env`
```bash
# Copie o arquivo supabase.env para seu projeto
cp supabase.env .env
```

### Passo 2: Instalar dependências
```bash
npm install @supabase/supabase-js dotenv
```

### Passo 3: Configurar o dotenv
```javascript
// No início do seu arquivo principal
require('dotenv').config();
```

### Passo 4: Conectar ao Supabase
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

## 🔑 Variáveis de Ambiente Disponíveis

| Variável | Descrição | Valor |
|----------|-----------|-------|
| `SUPABASE_URL` | URL do projeto Supabase | `https://agdffspstbxeqhqtltvb.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço com permissões completas | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SCHEMA` | Schema padrão | `api` |
| `SPRINTHUB_BASE_URL` | URL base do SprintHub | `sprinthub-api-master.sprinthub.app` |
| `SPRINTHUB_INSTANCE` | Instância do SprintHub | `oficialmed` |
| `SPRINTHUB_API_TOKEN` | Token de API do SprintHub | `9ad36c85-5858-4960-9935-e73c3698dd0c` |

## 📊 Acessando o Schema API

```javascript
// Consultar tabela no schema api
const { data, error } = await supabase
    .from('oportunidade_sprint')
    .select('*')
    .limit(10);

if (error) {
    console.error('Erro:', error);
} else {
    console.log('Dados:', data);
}
```

## ⚠️ Importante

- **Service Role Key**: Esta chave tem permissões completas. Use apenas em ambientes seguros.
- **Schema API**: As tabelas estão no schema `api`, não no schema `public`.
- **Segurança**: Nunca commite o arquivo `.env` no Git. Adicione-o ao `.gitignore`.

## 🔒 Exemplo de .gitignore
```gitignore
# Variáveis de ambiente
.env
supabase.env
*.env

# Dependências
node_modules/
```

## 📞 Suporte

Para dúvidas sobre a conexão com o Supabase, consulte:
- [Documentação oficial do Supabase](https://supabase.com/docs)
- [Guia de autenticação](https://supabase.com/docs/guides/auth)
- [Referência da API](https://supabase.com/docs/reference/javascript)

