# 🔥 Conecttor Firebird - Guia Completo

Este documento descreve como configurar e usar o conector Firebird criado para integrar com sua stack Firebird dockerizada.

## 📋 O que foi implementado

### 1. **Backend Node.js (API)**
- ✅ Dependência `node-firebird` adicionada
- ✅ Serviço `FirebirdService` criado (`api/firebird-service.js`)
- ✅ Endpoints REST para Firebird (`api/server.js`)
- ✅ Configuração via variáveis de ambiente

### 2. **Frontend React**
- ✅ Serviço cliente (`src/service/firebirdService.js`)
- ✅ Componente de teste (`src/components/FirebirdTest.jsx`)

### 3. **Configuração**
- ✅ Variáveis de ambiente configuradas (`.env`)
- ✅ Compatível com seu Docker Compose

---

## 🚀 Como usar

### 1. **Instalar dependências**

```bash
# No diretório do projeto
npm run backend:install

# Ou manualmente no diretório api/
cd api
npm install
```

### 2. **Verificar stack Firebird**

Certifique-se que sua stack Firebird está rodando:

```bash
# Verificar se o container está up
docker ps | grep firebird

# Se não estiver rodando, iniciar
docker-compose up -d firebird
```

### 3. **Iniciar o backend**

```bash
# No diretório raiz
npm run backend:dev

# Ou manualmente
cd api
npm run dev
```

### 4. **Testar a conexão**

Acesse: http://localhost:3002/api/firebird/test-connection

---

## 🔌 Endpoints disponíveis

### **Teste de Conexão**
```
GET /api/firebird/test-connection
```
Testa se a conexão com Firebird está funcionando.

### **Listar Tabelas**
```
GET /api/firebird/tables
```
Retorna todas as tabelas do banco.

### **Estrutura da Tabela**
```
GET /api/firebird/tables/:tableName/structure
```
Retorna os campos e tipos de uma tabela específica.

### **Dados da Tabela**
```
GET /api/firebird/tables/:tableName/data?fields=*&where=&orderBy=&limit=50&offset=0
```
Busca dados de uma tabela com filtros opcionais.

### **Query Customizada**
```
POST /api/firebird/query
Body: {
  "sql": "SELECT * FROM MINHA_TABELA WHERE ID > ?",
  "params": [100],
  "limit": 50,
  "offset": 0
}
```
Executa uma query SQL personalizada.

---

## 🔧 Configuração

### **Variáveis de ambiente (.env)**

As seguintes variáveis foram adicionadas ao seu `.env`:

```env
# 🔥 FIREBIRD CONFIGURAÇÕES
FIREBIRD_HOST=localhost
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=psbd.FDB
FIREBIRD_USER=OFICIALMED-TESTE
FIREBIRD_PASSWORD=OficialmEd07@
FIREBIRD_CHARSET=WIN1252
```

### **Docker Compose (sua configuração atual)**

```yaml
services:
  firebird:
    image: jacobalberty/firebird:3.0
    environment:
      - FIREBIRD_DATABASE=psbd.FDB
      - FIREBIRD_USER=OFICIALMED-TESTE
      - FIREBIRD_PASSWORD=OficialmEd07@
      - FIREBIRD_DB_PATH=/firebird/data
      - FIREBIRD_DB_CHARSET=WIN1252
    ports:
      - "3050:3050"
```

---

## 💻 Exemplo de uso no Frontend

### **1. Importar o serviço**

```javascript
import { firebirdService } from '../service/firebirdService';
```

### **2. Testar conexão**

```javascript
const testConnection = async () => {
  try {
    const result = await firebirdService.testConnection();

    if (result.success) {
      console.log('✅ Conectado:', result.data);
    } else {
      console.error('❌ Erro:', result.error);
    }
  } catch (error) {
    console.error('❌ Falha:', error.message);
  }
};
```

### **3. Listar tabelas**

```javascript
const loadTables = async () => {
  try {
    const result = await firebirdService.getTables();
    console.log(`📋 ${result.count} tabelas encontradas:`, result.data);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
};
```

### **4. Buscar dados**

```javascript
const loadData = async () => {
  try {
    const result = await firebirdService.getTableData('MINHA_TABELA', {
      fields: 'ID, NOME, DATA_CRIACAO',
      where: 'ID > 100',
      orderBy: 'ID DESC',
      limit: 25
    });

    console.log(`🔍 ${result.count} registros:`, result.data);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
};
```

### **5. Query customizada**

```javascript
const customQuery = async () => {
  try {
    const result = await firebirdService.executeQuery(
      'SELECT COUNT(*) as TOTAL FROM MINHA_TABELA WHERE DATA_CRIACAO > ?',
      ['2024-01-01']
    );

    console.log('📊 Resultado:', result.data);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
};
```

---

## 🧪 Componente de Teste

Um componente React completo foi criado para testar todas as funcionalidades:

```jsx
import FirebirdTest from './components/FirebirdTest';

// No seu App.jsx ou onde desejar
<FirebirdTest />
```

Este componente permite:
- ✅ Testar conexão
- ✅ Listar tabelas
- ✅ Ver estrutura das tabelas
- ✅ Visualizar dados
- ✅ Interface amigável para testes

---

## 🔍 Troubleshooting

### **Erro de conexão**

1. **Verificar se Firebird está rodando:**
   ```bash
   docker ps | grep firebird
   ```

2. **Verificar logs do container:**
   ```bash
   docker logs [container_id]
   ```

3. **Testar conexão direta:**
   ```bash
   telnet localhost 3050
   ```

### **Erro de permissões**

1. **Verificar usuário/senha no .env**
2. **Confirmar que o banco psbd.FDB existe**
3. **Verificar se o usuário tem permissões na base**

### **Erro de charset**

Se houver problemas com acentos/caracteres especiais:
1. **Confirmar FIREBIRD_CHARSET=WIN1252**
2. **Verificar encoding do banco original**

---

## 📦 Estrutura de arquivos criados

```
projeto/
├── api/
│   ├── package.json          # ✅ Atualizado com node-firebird
│   ├── server.js              # ✅ Endpoints Firebird adicionados
│   └── firebird-service.js    # ✅ Novo serviço de conexão
├── src/
│   ├── service/
│   │   └── firebirdService.js # ✅ Cliente para frontend
│   └── components/
│       └── FirebirdTest.jsx   # ✅ Componente de teste
├── .env                       # ✅ Variáveis Firebird adicionadas
└── FIREBIRD_SETUP.md         # ✅ Esta documentação
```

---

## 🎯 Próximos passos

1. **Testar conexão:** Use o endpoint `/api/firebird/test-connection`
2. **Explorar tabelas:** Use o componente `FirebirdTest`
3. **Integrar aos seus dashboards:** Use o `firebirdService` nos seus componentes existentes
4. **Customizar queries:** Adapte as consultas para suas necessidades específicas

---

## 🆘 Suporte

Se houver problemas:

1. **Verificar logs do backend:** `npm run backend:dev`
2. **Verificar console do browser:** F12 → Console
3. **Testar endpoints direto:** Postman/Insomnia
4. **Verificar stack Firebird:** `docker-compose logs firebird`

---

**✅ Conector Firebird implementado com sucesso!**

Agora você pode integrar dados do seu Firebird diretamente nos dashboards React da OficialMed.