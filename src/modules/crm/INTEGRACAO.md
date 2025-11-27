# Guia de Integração do Módulo CRM

Este documento explica como integrar o módulo CRM na aplicação principal.

## 📋 Passos de Integração

### 1. Adicionar Rotas no App.jsx

No arquivo `src/App.jsx`, adicione as importações e rotas do CRM:

```javascript
// Adicionar no topo do arquivo
import { crmRoutes } from './modules/crm/routes/crmRoutes';
import { Suspense } from 'react';

// Dentro do componente Router, adicionar as rotas:
{crmRoutes.map(route => (
  <Route
    key={route.path}
    path={route.path}
    element={
      <Suspense fallback={<div>Carregando...</div>}>
        {route.element}
      </Suspense>
    }
  />
))}
```

### 2. Adicionar ao Menu de Navegação

Se você tiver um componente de menu/sidebar, adicione os itens do CRM:

```javascript
import { crmRoutes } from './modules/crm/routes/crmRoutes';

// No componente de menu:
{crmRoutes.map(route => (
  <NavLink key={route.path} to={route.path}>
    <span>{route.icon}</span>
    <span>{route.label}</span>
  </NavLink>
))}
```

### 3. Configurar Tabelas no Supabase

Crie as tabelas necessárias no Supabase:

```sql
-- Tabela de Contatos
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Oportunidades
CREATE TABLE IF NOT EXISTS crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  contact_id UUID REFERENCES crm_contacts(id),
  value DECIMAL(10, 2),
  stage TEXT NOT NULL DEFAULT 'prospeccao',
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_contact ON crm_opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON crm_opportunities(stage);
```

### 4. Configurar Permissões RLS (Row Level Security)

Configure as políticas de segurança no Supabase:

```sql
-- Habilitar RLS
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;

-- Políticas para contatos (ajuste conforme sua necessidade de autenticação)
CREATE POLICY "Users can view contacts" ON crm_contacts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert contacts" ON crm_contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update contacts" ON crm_contacts
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete contacts" ON crm_contacts
  FOR DELETE USING (true);

-- Políticas para oportunidades
CREATE POLICY "Users can view opportunities" ON crm_opportunities
  FOR SELECT USING (true);

CREATE POLICY "Users can insert opportunities" ON crm_opportunities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update opportunities" ON crm_opportunities
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete opportunities" ON crm_opportunities
  FOR DELETE USING (true);
```

## 🎯 Uso Básico

### Importar Componentes

```javascript
import { 
  CrmDashboardPage, 
  CrmContactList, 
  crmContactService 
} from '@/modules/crm';
```

### Usar Hooks

```javascript
import { useCrmContacts } from '@/modules/crm';

function MyComponent() {
  const { contacts, loading, createContact } = useCrmContacts();
  
  // Usar os dados...
}
```

### Usar Serviços

```javascript
import crmContactService from '@/modules/crm/services/crmContactService';

// Listar contatos
const contacts = await crmContactService.listContacts();

// Criar contato
const newContact = await crmContactService.createContact({
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '(11) 99999-9999'
});
```

## 📝 Próximos Passos

1. Personalize os componentes conforme suas necessidades
2. Adicione mais funcionalidades aos serviços
3. Crie novos componentes específicos do seu negócio
4. Integre com outros módulos do sistema

## 🔗 Estrutura de Arquivos

```
src/modules/crm/
├── pages/              # Páginas principais
├── components/          # Componentes reutilizáveis
├── services/           # Lógica de negócio e API
├── hooks/              # Hooks customizados
├── utils/              # Funções auxiliares
├── routes/             # Configuração de rotas
├── index.js            # Exportações centralizadas
└── README.md           # Documentação do módulo
```





