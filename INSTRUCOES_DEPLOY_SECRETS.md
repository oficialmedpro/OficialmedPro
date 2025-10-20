# 🔧 Instruções para Deploy com Secrets no Portainer

## Problema Identificado
O erro `Failed to construct 'URL': Invalid URL` ocorre porque as variáveis de ambiente do Supabase não estão sendo lidas corretamente dos secrets do Portainer.

## Solução Implementada

### 1. ✅ Dockerfile Atualizado
- Adicionado suporte ao `docker-entrypoint.sh`
- O script agora lê os secrets em runtime e injeta no HTML

### 2. ✅ Stack Beta Atualizada
- Adicionada configuração de secrets
- Configuradas variáveis de ambiente para apontar para os secrets

### 3. ✅ Script de Entrada Melhorado
- Melhor debug e logging
- Suporte a múltiplas formas de ler secrets
- Validação de variáveis
- Escape de caracteres especiais

## Passos para Deploy

### 1. Rebuild da Imagem Docker
```bash
# No seu repositório GitHub, faça commit das mudanças:
git add .
git commit -m "fix: configurar secrets do Portainer para variáveis Supabase"
git push origin main
```

### 2. Aguardar Build Automático
- O GitHub Actions irá fazer o build da nova imagem
- A imagem será enviada para o Docker Hub como `oficialmedpro/oficialmed-pwa:latest`

### 3. Atualizar Stack no Portainer
1. Acesse o Portainer
2. Vá em **Stacks** → **beta**
3. Clique em **Editor**
4. Cole o conteúdo do arquivo `stack-beta-simples-funcionando.yml`
5. Clique em **Update the stack**

### 4. Verificar Secrets
Certifique-se de que os seguintes secrets existem no Portainer:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_SERVICE_ROLE_KEY` 
- `VITE_SUPABASE_SCHEMA`

### 5. Monitorar Logs
Após o deploy, verifique os logs do container para ver:
```
🔧 Carregando secrets do Docker Swarm...
📋 Secrets disponíveis:
✅ VITE_SUPABASE_URL carregada do secret
✅ VITE_SUPABASE_SERVICE_ROLE_KEY carregada do secret
✅ VITE_SUPABASE_SCHEMA carregada do secret
🔍 Variáveis carregadas:
✅ VITE_SUPABASE_URL válida: https://...
🔧 Injetando variáveis no HTML...
✅ window.ENV encontrado no HTML
🚀 Iniciando aplicação...
```

## Como Funciona Agora

1. **Build Time**: A imagem é construída com fallbacks
2. **Runtime**: O `docker-entrypoint.sh` lê os secrets do Portainer
3. **Injeção**: As variáveis são injetadas no HTML como `window.ENV`
4. **Frontend**: O código JavaScript lê de `window.ENV` ou `import.meta.env`

## Troubleshooting

### Se ainda der erro de URL inválida:
1. Verifique se os secrets têm valores válidos
2. Verifique os logs do container
3. Acesse o site e abra o console do navegador para ver as variáveis

### Se os secrets não forem encontrados:
1. Verifique se os nomes dos secrets estão corretos
2. Verifique se os secrets estão marcados como "external: true"
3. Verifique se o container tem permissão para acessar os secrets

## Arquivos Modificados
- `Dockerfile` - Adicionado suporte ao entrypoint script
- `docker-entrypoint.sh` - Melhorado para ler secrets corretamente
- `stack-beta-simples-funcionando.yml` - Adicionada configuração de secrets
