# 🚀 Guia de Deploy do Beta

## 📋 Visão Geral

Este guia explica como fazer o deploy do beta atualizado para produção.

## 🔄 Processo de Deploy

O deploy do beta envolve 3 etapas principais:

1. **Build e Push da Imagem Docker** → Docker Hub
2. **Atualizar a Stack** → Docker Swarm (via Portainer ou SSH)

---

## 📦 Etapa 1: Build e Push da Imagem

### Opção A: Script Automático (Recomendado)

#### Windows (PowerShell):
```powershell
.\scripts-deploy\deploy-beta.ps1
```

#### Linux/Mac (Bash):
```bash
./scripts-deploy/deploy-beta.sh
```

### Opção B: Manual

```bash
# 1. Build da imagem
docker build -f docker/Dockerfile -t oficialmedpro/oficialmed-pwa:latest .

# 2. Push para Docker Hub
docker push oficialmedpro/oficialmed-pwa:latest
```

**⚠️ Importante:** Você precisa estar logado no Docker Hub:
```bash
docker login
```

---

## 🔄 Etapa 2: Atualizar a Stack

### Opção 1: Via Portainer (Mais Fácil)

1. Acesse: **https://portainer.oficialmed.com.br**
2. Vá em **Stacks** → Procure pela stack **`beta`** ou **`bi-beta-stack`**
3. Clique em **"Editor"** ou **"Update the stack"**
4. ✅ **Marque a opção "Pull latest image"**
5. Clique em **"Update the stack"**
6. Aguarde 1-2 minutos para o deploy completar

### Opção 2: Via SSH (Linha de Comando)

Se você tem acesso SSH ao servidor manager:

```bash
# Copie o script para o servidor
scp scripts-deploy/update-beta-stack.sh usuario@servidor:/tmp/

# Conecte-se ao servidor
ssh usuario@servidor

# Execute o script
chmod +x /tmp/update-beta-stack.sh
/tmp/update-beta-stack.sh
```

Ou manualmente:

```bash
# Atualizar serviço específico
docker service update --image oficialmedpro/oficialmed-pwa:latest --force beta_beta

# Ou atualizar a stack completa
docker stack deploy -c stacks/stack-beta-oficialmed-correto.yml beta --with-registry-auth
```

---

## ✅ Verificação

Após o deploy, verifique:

1. **Acesse o Beta:**
   - URL: **https://beta.oficialmed.com.br**
   - Verifique se a página carrega corretamente

2. **Verifique os Logs (se necessário):**
   - No Portainer: **Containers** → Selecione o container → **Logs**
   - Ou via SSH: `docker service logs -f beta_beta`

3. **Verifique a Imagem no Docker Hub:**
   - https://hub.docker.com/r/oficialmedpro/oficialmed-pwa/tags
   - Confirme que a tag `latest` foi atualizada recentemente

---

## 📁 Arquivos de Stack

Os arquivos de stack estão em `stacks/`:

- `stack-beta-oficialmed-correto.yml` - Stack recomendada para o beta
- `stack-beta-oficialmed.yml` - Stack alternativa

---

## 🆘 Troubleshooting

### Erro: "Docker não está rodando"
- Inicie o Docker Desktop (Windows/Mac)
- Ou inicie o serviço Docker (Linux): `sudo systemctl start docker`

### Erro: "Login necessário"
- Execute: `docker login`
- Informe suas credenciais do Docker Hub

### Erro: "Stack não encontrada"
- Verifique o nome da stack no Portainer
- Ou crie uma nova stack usando o arquivo `stack-beta-oficialmed-correto.yml`

### Imagem não atualiza
- Certifique-se de marcar **"Pull latest image"** no Portainer
- Ou use `--force` no comando `docker service update`

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do container
2. Verifique se a imagem foi atualizada no Docker Hub
3. Verifique se a stack está rodando: `docker stack ls`

---

**Pronto para fazer deploy! 🚀**

