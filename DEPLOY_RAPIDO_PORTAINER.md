# ⚡ Deploy Rápido no Portainer

## 📋 Stack: vendas-pwa

### Passo 1: Copiar Stack

Abra o arquivo `stack-vendas-pwa.yml` e copie TODO o conteúdo.

### Passo 2: No Portainer

1. Acesse: https://portainer.oficialmed.com.br
2. Vá em **Stacks** → **Add Stack**
3. Nome: `vendas-pwa`
4. Colo o conteúdo copiado
5. Clique em **Deploy the stack**

### Passo 3: Verificar

- URL: https://vendas.oficialmed.com.br
- Deve funcionar imediatamente!

---

## ✅ O Que Esta Stack Faz

- Usa a mesma imagem: `oficialmedpro/oficialmed-pwa:latest`
- Domínio: `vendas.oficialmed.com.br`
- HTTPS automático
- Mesmos secrets do beta
- Aplicação idêntica ao beta, mas em outro domínio

## ⚠️ Limitação Atual

A rota `/vendas` não existe ainda (frontend revertido).
Mas você pode:
- ✅ Acessar a aplicação
- ✅ Usar outras funcionalidades
- ✅ Deploy está funcionando

## 🎯 Próximo

Implementar frontend de vendas com abordagem diferente.

---

**Ready to deploy! 🚀**














