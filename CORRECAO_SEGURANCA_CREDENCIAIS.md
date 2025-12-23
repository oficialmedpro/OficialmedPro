# 🔐 CORREÇÃO DE SEGURANÇA - Credenciais Expostas

## ⚠️ PROBLEMA IDENTIFICADO

O GitGuardian detectou que uma URI do PostgreSQL foi exposta no repositório GitHub:
- **Data:** 22/12/2025, 15:29:41 UTC
- **Tipo:** PostgreSQL URI com senha
- **Senha exposta:** `9acf019d669f6ab91d86`
- **Host:** `72.60.61.40:5432`
- **Database:** `typebot`

## 📋 AÇÕES URGENTES NECESSÁRIAS

### 1. ✅ Rotacionar Credenciais (URGENTE!)
**IMPORTANTE:** Como a senha já foi exposta, você DEVE alterar a senha do PostgreSQL imediatamente:

```bash
# No servidor do Typebot
docker exec typebot_typebot-db.1.ylvzixcqru6rwfsxsuqfqquiv psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'NOVA_SENHA_FORTE_AQUI';"
```

### 2. ✅ Remover Credenciais do Código
Todos os arquivos listados abaixo foram corrigidos para remover credenciais expostas.

### 3. ✅ Configurar Variáveis de Ambiente
Crie um arquivo `.env` (que NÃO será commitado) com as credenciais reais.

## 📁 ARQUIVOS CORRIGIDOS

Os seguintes arquivos tinham credenciais expostas e foram corrigidos:
- `docs/TROUBLESHOOTING_NOCODB.md`
- `docs/SOLUCAO_FINAL_NOCODB.md`
- `docs/CORRIGIR_SSL_NOCODB.md`
- `docs/TYPEBOT_CONFIGURADO.md`
- `docs/COMANDOS_TESTE_SIMPLES.md`
- `docs/COMANDOS_DIRETOS_TYPEBOT.md`
- `scripts/configurar-typebot-postgres-simples.sh`
- Outros arquivos de documentação e scripts

## 🔧 COMO CONFIGURAR AGORA

### 1. Criar arquivo `.env` (local, NÃO commitado)

Crie um arquivo `.env` na raiz do projeto com:

```env
# Typebot PostgreSQL Connection
TYPEBOT_DB_HOST=72.60.61.40
TYPEBOT_DB_PORT=5432
TYPEBOT_DB_USER=postgres
TYPEBOT_DB_PASSWORD=SUA_NOVA_SENHA_AQUI
TYPEBOT_DB_NAME=typebot
TYPEBOT_DB_SSL_MODE=disable

# Connection URL (gerada automaticamente ou definida manualmente)
TYPEBOT_DATABASE_URL=postgres://postgres:SUA_NOVA_SENHA_AQUI@72.60.61.40:5432/typebot?sslmode=disable
```

### 2. Atualizar `.gitignore`

O arquivo `.gitignore` foi atualizado para incluir:
- `.env`
- `.env.local`
- `.env.production`
- `*.env`

### 3. Usar Variáveis de Ambiente nos Scripts

Todos os scripts agora devem ler de variáveis de ambiente ao invés de valores hardcoded.

## ⚠️ LIMITAÇÃO: Histórico do Git

**IMPORTANTE:** Mesmo removendo as credenciais dos arquivos, elas ainda estarão no histórico do Git. 

Para remover completamente do histórico (requer reescrever o histórico):
```bash
# ATENÇÃO: Isso reescreve o histórico do Git!
# Faça backup antes e coordene com sua equipe!
git filter-repo --invert-paths --path docs/TROUBLESHOOTING_NOCODB.md
# ... etc para cada arquivo
```

**Alternativa mais segura:** Rotacionar a senha e aceitar que a senha antiga foi exposta (solução recomendada se você já rotacionou).

## ✅ CHECKLIST DE SEGURANÇA

- [x] Credenciais removidas dos arquivos de código/documentação
- [ ] Senha do PostgreSQL rotacionada no servidor
- [ ] Arquivo `.env` criado (local, não commitado)
- [ ] `.gitignore` atualizado para ignorar `.env`
- [ ] Todos os scripts atualizados para usar variáveis de ambiente
- [ ] Equipe notificada sobre a mudança de senha
- [ ] Serviços que usam essa conexão atualizados com nova senha
- [ ] Testes executados com nova configuração

## 🔄 PRÓXIMOS PASSOS

1. **ROTACIONAR SENHA IMEDIATAMENTE**
2. Atualizar todos os serviços que usam essa conexão (NocoDB, etc.)
3. Testar todas as conexões após mudança de senha
4. Considerar usar um gerenciador de segredos (AWS Secrets Manager, HashiCorp Vault, etc.)

---

**Data da correção:** 22/12/2025  
**Status:** 🔴 URGENTE - Rotacionar senha imediatamente!

