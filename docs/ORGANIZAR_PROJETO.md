# 📁 PLANO DE ORGANIZAÇÃO DO PROJETO

## 🎯 Objetivo
Organizar os arquivos soltos na raiz do projeto em pastas apropriadas e remover arquivos desnecessários.

## 📂 Estrutura Proposta

### Pastas a Criar:
```
scripts/          # Scripts .cjs e .js de utilitários
sql/              # Scripts SQL (já existe, mas tem muitos na raiz)
docs/             # Documentação .md
logs/             # Arquivos de log e erro
docker/           # Dockerfiles e docker-compose
stacks/           # Arquivos stack .yml
temp/             # Arquivos temporários (já existe)
```

## 🗑️ Arquivos para DELETAR

### 1. Arquivos Corrompidos/Estranhos:
- `tatus` (arquivo sem extensão)
- `e HEAD` (arquivo estranho)
- `et --hard 0397bc7` (comando git acidental)

### 2. Logs e Arquivos de Erro:
- `*.log` (todos os logs)
- `*-error.txt`
- `*-log.txt`
- `consolidacao.log`
- `consolidacao-output.log`
- `sync-*.log`
- `process-*-error.txt`
- `process-*-log.txt`
- `update-*-error.txt`
- `update-*-log.txt`

### 3. Arquivos Temporários de Teste:
- `temp_*.js` (temp_fetch_lead.js, temp_fetch_op.js, etc.)
- `test-*.js` (exceto test-build.js se for importante)
- `test-*.html`
- `test-*.cjs`

### 4. Dockerfiles Duplicados/Obsoletos:
- `Dockerfile.debug`
- `Dockerfile.no-build`
- `Dockerfile.no-secrets`
- `Dockerfile.node16`
- `Dockerfile.portainer`
- `Dockerfile.real`
- `Dockerfile.simple`
- `Dockerfile.verbose`
- `Dockerfile.working`
- `Dockerfile.nginx-only` (se não usado)

**MANTER:**
- `Dockerfile` (principal)
- `Dockerfile.sync-leads` (se usado)
- `Dockerfile.sync-opportunities` (se usado)
- `Dockerfile.sync-opportunities-easypanel` (se usado)

### 5. Docker Compose Duplicados:
- `docker-compose-clean.yml`
- `docker-compose-final.yml`
- `docker-compose-sync-apis.yml`
- `docker-compose-with-database.yml`

**MANTER:**
- `docker-compose.yml` (principal)

### 6. Stack Files Duplicados:
Mover TODOS os `stack-*.yml` para `stacks/` e manter apenas os atuais:
- `stack-beta-oficialmed-correto.yml` ou `stack-beta-funcionando.yml`
- `stack-oportunidades-sync.yml` (se usado)

### 7. Scripts Antigos/Duplicados:
- `sync-leads-*.cjs` (versões antigas, manter apenas o atual)
- `funcao-exportacao-*.sql` (versões antigas, manter apenas o final)
- `create-inativos-*.cjs` (versões antigas)
- `consolidate-clientes-*.cjs` (versões antigas)

## 📦 Arquivos para MOVER

### Para `scripts/`:
- Todos os `.cjs` de utilitários (check-*, analyze-*, debug-*, etc.)
- Scripts de sincronização antigos
- Scripts de importação
- Scripts de consolidação

### Para `sql/`:
- Todos os `.sql` da raiz (já existe pasta sql/)

### Para `docs/`:
- Todos os `.md` da raiz (exceto README.md)

### Para `logs/`:
- Todos os `.log`
- Todos os `*-error.txt`
- Todos os `*-log.txt`

### Para `docker/`:
- Todos os `Dockerfile*`
- Todos os `docker-compose*.yml`
- `docker-entrypoint.sh`

### Para `stacks/`:
- Todos os `stack-*.yml`
- `render.yaml`
- `render-reativacao.yaml`
- `portainer-stack.yml`
- `firebird-stack-with-database.yml`

## ✅ Arquivos para MANTER na Raiz

- `package.json`
- `package-lock.json`
- `vite.config.js`
- `eslint.config.js`
- `.gitignore`
- `.env.example`
- `README.md`
- `index.html`
- `nginx.conf` (se usado)
- `nginx-sync.conf` (se usado)
- Arquivos de configuração principais

## 🚀 Próximos Passos

1. Criar as pastas
2. Mover arquivos
3. Deletar arquivos desnecessários
4. Atualizar .gitignore
5. Commit das mudanças

