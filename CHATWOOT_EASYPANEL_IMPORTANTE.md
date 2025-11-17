# ⚠️ IMPORTANTE: Chatwoot no EasyPanel

## 🔍 Diferenças entre Portainer e EasyPanel

O EasyPanel funciona diferente do Portainer:

### Portainer (Docker Swarm)
- Usa `deploy:` com `mode: replicated`
- Gerencia stacks do Docker Swarm
- Suporta múltiplos serviços em um único stack

### EasyPanel (Docker Compose)
- Usa Docker Compose padrão (não Swarm)
- Pode ter limitações com `build` e caminhos relativos
- Pode precisar de configuração diferente

## ✅ Solução Recomendada

### Opção 1: Usar Imagem Oficial (MAIS FÁCIL)

Se o build do código-fonte der problema, use a imagem oficial primeiro:

```yaml
chatwoot-web:
  image: chatwoot/chatwoot:latest  # Ao invés de build
  # ... resto da config
```

**Vantagens:**
- ✅ Funciona imediatamente
- ✅ Sem problemas de build
- ✅ Mais rápido para testar

**Desvantagens:**
- ❌ Não tem o código-fonte para modificar
- ❌ Mas você pode adicionar depois!

### Opção 2: Build do Código-Fonte (SE PRECISAR MODIFICAR)

Se realmente precisar do código-fonte agora:

1. **Verifique o caminho do build:**
   - No EasyPanel, o caminho pode ser diferente
   - Tente: `./chatwoot/source` ou `/etc/easypanel/projects/chatwoot/chatwoot/source`

2. **Se der erro, use caminho absoluto:**
   ```yaml
   build:
     context: /etc/easypanel/projects/chatwoot/chatwoot/source
   ```

## 🎯 Minha Recomendação

**Comece com a imagem oficial!**

1. Use `image: chatwoot/chatwoot:latest` primeiro
2. Teste se tudo funciona
3. Depois, se precisar modificar, migre para build do código-fonte

## 📝 Arquivo Simplificado

Use o arquivo `docker-compose-easypanel-simples.yml` que criei:
- ✅ Removido `deploy` do Swarm
- ✅ Formato Compose padrão
- ✅ Comentários sobre usar imagem oficial se build falhar

## 🚀 Passos

1. **Cole o docker-compose no EasyPanel**
2. **Se der erro no build**, comente a seção `build:` e descomente `image:`
3. **Configure as variáveis de ambiente**
4. **Faça deploy**

## ❓ Se Der Erro

Me diga qual erro apareceu e eu ajudo a ajustar! Os erros mais comuns:
- Caminho do build incorreto
- Rede `OficialMed` não existe
- Variáveis de ambiente faltando


