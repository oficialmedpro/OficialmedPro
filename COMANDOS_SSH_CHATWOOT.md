# 🔧 Comandos SSH para Configurar Chatwoot

## 📍 Você está em: `/etc/easypanel/projects/sprint-sync`

## 🎯 Opção 1: Ver Projetos Disponíveis

```bash
# Ver todos os projetos do EasyPanel
ls -la /etc/easypanel/projects/

# Ou subir um nível
cd /etc/easypanel/projects/
ls -la
```

## 🎯 Opção 2: Ir para o Projeto minha-pwa (se existir)

```bash
# Se o projeto minha-pwa estiver em /etc/easypanel/projects/
cd /etc/easypanel/projects/minha-pwa

# OU se estiver em outro lugar comum
cd /root/minha-pwa
# ou
cd /var/www/minha-pwa
# ou
cd /home/usuario/minha-pwa
```

## 🎯 Opção 3: Criar Estrutura do Chatwoot no Diretório Atual

Se você quer criar o Chatwoot como um novo projeto no EasyPanel:

```bash
# Criar diretório para o projeto chatwoot
mkdir -p /etc/easypanel/projects/chatwoot
cd /etc/easypanel/projects/chatwoot

# Criar estrutura de pastas
mkdir -p chatwoot/source
mkdir -p chatwoot/customizations
mkdir -p chatwoot/integrations/{api,webhooks,sync}
```

## 🎯 Opção 4: Enviar Arquivos do Projeto Local

Se você tem o projeto localmente (Windows) e quer enviar para o servidor:

**No Windows (PowerShell ou Git Bash):**

```bash
# Enviar apenas a pasta chatwoot
scp -r chatwoot root@srv1109021:/etc/easypanel/projects/chatwoot/

# OU enviar todo o projeto (se necessário)
scp -r . root@srv1109021:/caminho/desejado/
```

## ✅ Próximo Passo Recomendado

Execute primeiro para ver onde está seu projeto:

```bash
# Ver projetos disponíveis
cd /etc/easypanel/projects/
ls -la

# Procurar por "minha-pwa" ou similar
find /etc/easypanel -name "*pwa*" -type d 2>/dev/null
find /root -name "*pwa*" -type d 2>/dev/null
```

Depois me diga o que encontrou e eu te ajudo a continuar!


