# 📚 Documentação: Comandos e Operações com n8n via API

Esta pasta contém toda a documentação sobre como usar a API do n8n através do Cursor/Auto.

---

## 📁 Arquivos Nesta Pasta

- **`O-QUE-POSSO-FAZER.md`** - Lista completa de operações disponíveis
- **`REFERENCIA-RAPIDA.md`** - Guia rápido de comandos mais usados
- **`test-api-n8n.cjs`** - Script para testar conexão com n8n
- **`CREDENCIAIS.md`** - ⚠️ Informações sobre credenciais (NÃO commitar no Git!)

---

## 🚀 Como Usar

### 1. Pedir ao Auto/Cursor

Simplesmente me peça em português:

```
"Liste todos os workflows do n8n"
"Mostre os detalhes do workflow 'gerar-checkout'"
"Execute o workflow X com estes dados"
```

### 2. Usar o Script de Teste

```bash
# Configure as variáveis de ambiente primeiro
export N8N_API_KEY="sua_api_key"
export N8N_BASE_URL="https://n8n.oficialmed.com.br"

# Execute o teste
node "n8n comandos/test-api-n8n.cjs"
```

---

## 🔑 Credenciais

⚠️ **IMPORTANTE:** As credenciais estão salvas localmente e NÃO devem ser commitadas no Git!

Para usar, me forneça:
- **N8N_BASE_URL:** URL do seu n8n
- **N8N_API_KEY:** Chave de API do n8n

Ou configure no arquivo `CREDENCIAIS.md` (que está no .gitignore).

---

## 📖 Documentação Completa

Veja o arquivo **`O-QUE-POSSO-FAZER.md`** para a lista completa de operações disponíveis.

---

## 🎯 Exemplos Rápidos

- "Liste todos os workflows"
- "Quantos workflows estão ativos?"
- "Mostre os detalhes do workflow 'gerar-checkout'"
- "Execute o workflow X"
- "Mostre as últimas execuções"
- "Quais workflows falharam hoje?"

---

**Última atualização:** 08/01/2026
