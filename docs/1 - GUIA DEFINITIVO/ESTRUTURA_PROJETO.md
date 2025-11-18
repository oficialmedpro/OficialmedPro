# 📁 Estrutura do Projeto Organizada

## 📂 Pastas Principais

### Raiz do Projeto
A raiz contém apenas arquivos essenciais:
- `package.json` - Configuração do projeto Node.js
- `vite.config.js` - Configuração do Vite
- `eslint.config.js` - Configuração do ESLint
- `index.html` - Arquivo de entrada HTML
- `README.md` - Documentação principal
- `.env.example` - Exemplo de variáveis de ambiente
- `.gitignore` - Arquivos ignorados pelo Git
- `api-sync-leads.js` - API principal de sincronização de leads
- `api-sync-opportunities.js` - API principal de sincronização de oportunidades

### Pastas Organizadas

#### `scripts/` - Scripts Utilitários
- Scripts `.cjs` e `.js` de utilitários
- Scripts de análise, debug, teste
- Scripts de consolidação e importação
- Scripts PowerShell (`.ps1`)

#### `scripts-deploy/` - Scripts de Deploy
- Scripts shell (`.sh`) de deploy
- Scripts batch (`.bat`) de build
- Scripts de configuração de serviços

#### `docs/` - Documentação
- Toda documentação `.md`
- Guias, instruções, documentação técnica
- Scripts de organização

#### `sql/` - Scripts SQL
- Scripts de criação de tabelas
- Queries de análise
- Scripts de migração
- Funções e triggers

#### `docker/` - Arquivos Docker
- Todos os `Dockerfile*`
- Arquivos `docker-compose*.yml`
- `docker-entrypoint.sh`

#### `stacks/` - Arquivos Stack
- Arquivos `stack-*.yml`
- Arquivos `render*.yaml`
- `portainer-stack.yml`
- `firebird-stack*.yml`
- `docker-stack-beta.yml`

#### `config/` - Arquivos de Configuração
- Configurações do Google Ads Proxy
- Arquivos de configuração nginx (`.conf`)
- Outros arquivos de configuração

#### `data/` - Arquivos de Dados
- Arquivos JSON de dados
- Arquivos CSV
- Checkpoints e dados temporários

#### `logs/` - Logs (vazio, logs deletados)
- Logs são gerados aqui mas não commitados

#### `temp/` - Arquivos Temporários
- Arquivos HTML de teste
- Arquivos temporários

## 📊 Estatísticas da Organização

- **Arquivos organizados:** ~350 arquivos
- **Arquivos deletados:** 22 arquivos
- **Pastas criadas:** 8 pastas
- **Redução na raiz:** ~350 arquivos removidos da raiz

## 🎯 Benefícios

1. **Navegação mais fácil** - Arquivos organizados por tipo
2. **Manutenção simplificada** - Fácil encontrar o que precisa
3. **Raiz limpa** - Apenas arquivos essenciais
4. **Estrutura profissional** - Organização padrão de projetos

## ⚠️ Notas Importantes

### Caminhos Alterados:
- `docker-entrypoint.sh` → `docker/docker-entrypoint.sh`
- `Dockerfile` → `docker/Dockerfile`
- `docker-compose.yml` → `docker/docker-compose.yml`

### Verificar:
- Scripts de deploy que referenciam caminhos antigos
- Documentação que menciona caminhos antigos
- CI/CD que usa caminhos antigos

