# Módulo CRM

Este módulo contém toda a funcionalidade relacionada ao CRM (Customer Relationship Management) do sistema.

## 📁 Estrutura do Módulo

```
crm/
├── pages/           # Páginas do CRM
├── components/      # Componentes específicos do CRM
├── services/        # Serviços e integrações do CRM
├── hooks/           # Hooks customizados do CRM
├── utils/           # Utilitários e helpers do CRM
├── routes/          # Configuração de rotas do CRM
├── types/           # Tipos TypeScript (se aplicável)
└── index.js         # Exportações centralizadas do módulo
```

## 🎯 Responsabilidades

- Gerenciamento de contatos e leads
- Pipeline de vendas e oportunidades
- Histórico de interações
- Relatórios e análises de CRM
- Integrações com sistemas externos

## 📝 Convenções

- Todos os componentes devem ter prefixo `Crm` (ex: `CrmContactList`)
- Serviços devem estar em `services/` e seguir padrão `crm*Service.js`
- Páginas devem estar em `pages/` e seguir padrão `Crm*Page.jsx`
- CSS deve estar junto com o componente e usar classes exclusivas do componente

## 🔗 Integração

Para usar este módulo em outras partes da aplicação:

```javascript
import { CrmContactList, crmContactService } from '@/modules/crm';
```

## 📚 Documentação Adicional

- [Guia de Desenvolvimento](./docs/DEVELOPMENT.md)
- [API Reference](./docs/API.md)
- [Componentes](./docs/COMPONENTS.md)



