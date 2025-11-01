# 📦 Deploy PWA Vendas - vendas.oficialmed.com.br

## ✅ Checklist de Deploy

### 1️⃣ Preparação
- [x] Usuários criados (Gabrielli, Atendente)
- [x] Módulo `vendas_pwa` criado
- [x] Views SQL criadas (`view_acolhimento_kpis`, `view_orcamento_kpis`, `view_vendas_kpis`, `view_perdas_top_motivos`)
- [x] Stack YAML criada (`stack-vendas-pwa.yml`)
- [ ] Build da imagem Docker
- [ ] Push para Docker Hub
- [ ] Deploy no Portainer

### 2️⃣ Credenciais de Acesso

#### Supervisor (Gabrielli)
- **Username**: `gabrielli`
- **Senha**: `Gabrielli123@`
- **Tipo**: Supervisor (user_type_id: 4)

#### Atendente
- **Username**: `atendente.oficialmed`
- **Senha**: `Atendente123@`
- **Tipo**: Atendente (user_type_id: 6)
- **Responsável por**: Vendedores 219 (Thalia Passos) e 250 (Mirian Vitoria)

### 3️⃣ Deploy no Portainer

1. Acesse o Portainer em `https://portainer.oficialmed.com.br`
2. Vá em **Stacks**
3. Clique em **Add Stack**
4. Cole o conteúdo do arquivo `stack-vendas-pwa.yml`
5. Verifique se os secrets estão disponíveis (mesmos do beta)
6. Clique em **Deploy the stack**

### 4️⃣ Build e Push da Imagem

```bash
# Build da imagem com tag vendas-pwa
docker build -t oficialmedpro/oficialmed-pwa:latest .

# Ou se quiser uma tag específica
docker build -t oficialmedpro/oficialmed-pwa:vendas-1.0 .

# Push para Docker Hub
docker push oficialmedpro/oficialmed-pwa:latest
```

### 5️⃣ Secrets Necessários (já existentes no Portainer)

```
VITE_SUPABASE_URL
VITE_SUPABASE_URL_CORRETO
VITE_SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_SCHEMA
VITE_SPRINTHUB_BASE_URL
VITE_SPRINTHUB_API_TOKEN
VITE_SPRINTHUB_INSTANCE
VITE_CALLIX_API_TOKEN
```

### 6️⃣ Verificação Pós-Deploy

- [ ] HTTPS funcionando em `https://vendas.oficialmed.com.br`
- [ ] Login com usuário `gabrielli` funciona
- [ ] Login com usuário `atendente.oficialmed` funciona
- [ ] Aba Acolhimento carrega dados
- [ ] KPIs exibem valores (mesmo que mockados)

### 7️⃣ Roteamento

```
vendas.oficialmed.com.br/          → Login
vendas.oficialmed.com.br/vendas    → Painel Principal
vendas.oficialmed.com.br/api/*     → API Node.js
```

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"
- Verifique se os secrets estão corretos no Portainer

### Erro: "User not found"
- Execute a migration `setup_vendas_pwa_users` novamente no Supabase

### Erro: "View does not exist"
- Verifique se as views foram criadas no schema `api`
- Execute: `SELECT * FROM api.view_acolhimento_kpis LIMIT 1;`

### PWA não instala
- Verifique se o manifest.webmanifest está correto
- Teste em localhost primeiro

## 📝 Próximos Passos

1. Integrar dados reais nas views
2. Implementar filtros de contexto (unidade/funil/vendedor)
3. Adicionar RBAC com permissões por aba
4. Implementar edição de metas
5. Adicionar Service Worker para offline

## 🔗 Links Úteis

- Stack: `stack-vendas-pwa.yml`
- Views SQL: migrations do MCP Supabase
- Frontend: `src/pages/vendas/`
- Service: `src/service/vendasService.js`

