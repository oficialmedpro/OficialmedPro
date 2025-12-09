# 🔌 Conectar Banco Typebot ao NocoDB

## 📋 Problema

O banco de dados do Typebot está rodando em um container Docker no EasyPanel e não está acessível externamente. O NocoDB precisa acessar o PostgreSQL, mas está recebendo erro "database not supported".

## 🎯 Soluções Possíveis

### ✅ Solução 1: Expor Porta do PostgreSQL no EasyPanel (Recomendado)

Esta é a solução mais simples e direta.

#### Passo 1: Configurar Porta no EasyPanel

1. Acesse o EasyPanel no seu servidor: `http://72.60.61.40/`
2. Vá até o projeto **Typebot**
3. Encontre o serviço **typebot-db** (banco de dados PostgreSQL)
4. Vá em **Settings** ou **Configurações**
5. Procure por **Ports** ou **Portas**
6. Adicione uma porta:
   - **Porta Externa:** `5432` (ou outra porta disponível, ex: `5433`)
   - **Porta Interna:** `5432`
   - **Protocolo:** TCP

#### Passo 2: Configurar PostgreSQL para Aceitar Conexões Externas

O PostgreSQL precisa estar configurado para aceitar conexões de fora do container.

**Opção A: Via EasyPanel (se tiver acesso ao terminal do container)**

1. No EasyPanel, vá até o serviço **typebot-db**
2. Clique em **Terminal** ou **Exec**
3. Execute os seguintes comandos:

```bash
# Editar arquivo postgresql.conf
echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf

# Editar arquivo pg_hba.conf para permitir conexões
echo "host    all             all             0.0.0.0/0               md5" >> /var/lib/postgresql/data/pg_hba.conf

# Reiniciar o PostgreSQL
pg_ctl restart -D /var/lib/postgresql/data
```

**Opção B: Via SSH no Servidor (Método Automático - Recomendado)**

Se você tem acesso SSH ao servidor, use o script automatizado:

```bash
# 1. Primeiro, descobrir o nome correto do container
chmod +x scripts/diagnosticar-typebot-db.sh
./scripts/diagnosticar-typebot-db.sh

# 2. Configurar automaticamente
chmod +x scripts/configurar-typebot-postgres.sh
./scripts/configurar-typebot-postgres.sh
```

**Opção C: Via SSH no Servidor (Método Manual)**

Se preferir fazer manualmente:

```bash
# 1. Descobrir o nome do container
docker ps | grep -i typebot

# 2. Acessar o container (substitua NOME_DO_CONTAINER pelo nome real)
docker exec -it NOME_DO_CONTAINER bash

# 3. Dentro do container, encontrar os arquivos de configuração
find / -name postgresql.conf 2>/dev/null
find / -name pg_hba.conf 2>/dev/null

# 4. Editar configurações (substitua CAMINHO pelo caminho encontrado)
echo "listen_addresses = '*'" >> CAMINHO/postgresql.conf
echo "host    all             all             0.0.0.0/0               md5" >> CAMINHO/pg_hba.conf

# 5. Sair do container
exit

# 6. Reiniciar o container
docker restart NOME_DO_CONTAINER
```

**⚠️ IMPORTANTE:** O nome do container pode variar. Sempre verifique primeiro com `docker ps`.

#### Passo 3: Configurar Firewall (se necessário)

Se o servidor tiver firewall ativo, libere a porta:

```bash
# UFW (Ubuntu)
sudo ufw allow 5432/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

#### Passo 4: Testar Conexão

Teste se a conexão está funcionando:

```bash
# Do seu computador local ou de outro servidor
psql -h 72.60.61.40 -p 5432 -U postgres -d typebot
```

Ou use um cliente gráfico como DBeaver, pgAdmin, ou TablePlus.

#### Passo 5: Configurar no NocoDB

Agora no NocoDB:

1. **Connection name:** `typebot`
2. **Host address:** `72.60.61.40` (ou o IP do seu servidor)
3. **Port number:** `5432` (ou a porta que você configurou)
4. **Username:** `postgres`
5. **Password:** `9acf019d669f6ab91d86`
6. **Database:** `typebot`
7. **Use SSL:** Desligado (ou ligado se configurar SSL)

---

### ✅ Solução 2: Usar Host Interno (Se NocoDB estiver no mesmo servidor)

Se o NocoDB também estiver rodando no EasyPanel na mesma VPS, você pode usar o host interno do Docker.

#### Configuração no NocoDB:

1. **Connection name:** `typebot`
2. **Host address:** `typebot_typebot-db` (host interno do Docker)
3. **Port number:** `5432`
4. **Username:** `postgres`
5. **Password:** `9acf019d669f6ab91d86`
6. **Database:** `typebot`

**⚠️ Nota:** Isso só funciona se o NocoDB estiver na mesma rede Docker ou se você configurar uma rede compartilhada.

---

### ✅ Solução 3: Criar Proxy/Tunnel (Alternativa Segura)

Se você não quiser expor o PostgreSQL diretamente na internet, pode criar um túnel SSH ou usar um proxy.

#### Usando SSH Tunnel:

```bash
# Criar túnel SSH (do seu computador local)
ssh -L 5432:localhost:5432 usuario@72.60.61.40

# Depois, no NocoDB, usar:
# Host: localhost
# Port: 5432
```

---

## 🔍 Verificar se Está Funcionando

### Teste 1: Verificar se a Porta Está Aberta

```bash
# Do seu computador local
telnet 72.60.61.40 5432

# Ou usando nc (netcat)
nc -zv 72.60.61.40 5432
```

### Teste 2: Testar Conexão PostgreSQL

```bash
# Instalar cliente PostgreSQL (se não tiver)
# Ubuntu/Debian:
sudo apt-get install postgresql-client

# Testar conexão
psql -h 72.60.61.40 -p 5432 -U postgres -d typebot
```

### Teste 3: Verificar Logs do Container

```bash
# Ver logs do PostgreSQL
docker logs typebot_typebot-db --tail 50 -f
```

---

## 🛠️ Troubleshooting

### Erro: "Connection refused"

**Causa:** Porta não está exposta ou firewall bloqueando.

**Solução:**
1. Verificar se a porta está configurada no EasyPanel
2. Verificar firewall do servidor
3. Verificar se o PostgreSQL está escutando em todas as interfaces (`listen_addresses = '*'`)

### Erro: "Password authentication failed"

**Causa:** Senha incorreta ou usuário não tem permissão.

**Solução:**
1. Verificar credenciais no EasyPanel
2. Verificar se o `pg_hba.conf` permite conexões externas

### Erro: "Database does not exist"

**Causa:** Nome do banco incorreto.

**Solução:**
1. Verificar o nome do banco nas credenciais do EasyPanel
2. Listar bancos disponíveis:
   ```bash
   psql -h 72.60.61.40 -p 5432 -U postgres -l
   ```

### Erro: "database not supported" no NocoDB

**Causa:** Pode ser que o NocoDB não esteja conseguindo conectar ou o banco não está acessível.

**Solução:**
1. Verificar se a conexão está funcionando com `psql` primeiro
2. Verificar se o NocoDB suporta PostgreSQL (deveria suportar)
3. Tentar usar a URL de conexão completa no formato:
   ```
   postgres://postgres:9acf019d669f6ab91d86@72.60.61.40:5432/typebot
   ```

---

## 🔐 Segurança

### ⚠️ IMPORTANTE: Considerações de Segurança

Expor o PostgreSQL diretamente na internet pode ser um risco de segurança. Considere:

1. **Usar SSL/TLS:** Configure SSL no PostgreSQL
2. **Restringir IPs:** Configure o firewall para permitir apenas IPs específicos
3. **Usar Senha Forte:** Certifique-se de que a senha é forte
4. **Usar VPN ou Túnel:** Para acesso mais seguro, use VPN ou SSH tunnel
5. **Atualizar Regularmente:** Mantenha o PostgreSQL atualizado

### Configurar SSL (Opcional mas Recomendado)

Se quiser usar SSL:

1. Gerar certificados SSL
2. Configurar PostgreSQL para usar SSL
3. No NocoDB, ativar "Use SSL"

---

## 📝 Checklist Final

- [ ] Porta 5432 exposta no EasyPanel
- [ ] PostgreSQL configurado para aceitar conexões externas (`listen_addresses = '*'`)
- [ ] `pg_hba.conf` configurado para permitir conexões externas
- [ ] Firewall configurado (se necessário)
- [ ] Teste de conexão bem-sucedido com `psql`
- [ ] Configuração no NocoDB testada e funcionando
- [ ] Logs verificados para garantir que não há erros

---

## 🆘 Ainda Não Funciona?

Se após seguir todos os passos ainda não funcionar:

1. **Verificar logs do PostgreSQL:**
   ```bash
   docker logs typebot_typebot-db --tail 100
   ```

2. **Verificar se o container está rodando:**
   ```bash
   docker ps | grep typebot-db
   ```

3. **Verificar configurações do PostgreSQL:**
   ```bash
   docker exec -it typebot_typebot-db cat /var/lib/postgresql/data/postgresql.conf | grep listen_addresses
   ```

4. **Verificar rede Docker:**
   ```bash
   docker network inspect typebot_default
   ```

---

**Última Atualização:** 2025-01-XX  
**Status:** Guia de configuração para conectar Typebot ao NocoDB

