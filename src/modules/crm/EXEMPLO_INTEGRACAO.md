# Exemplo de Integração do Módulo CRM

Este arquivo mostra exemplos práticos de como integrar o módulo CRM no `App.jsx`.

## 1. Adicionar Importações no App.jsx

Adicione no topo do arquivo `src/App.jsx`:

```javascript
// Importar rotas do CRM
import { crmRoutes } from './modules/crm/routes/crmRoutes';
```

## 2. Adicionar Rotas no Router

Dentro do componente `Router`, adicione as rotas do CRM junto com as outras rotas autenticadas:

```javascript
{/* Rotas principais - requerem autenticação do sistema principal */}
{!isAuthenticated ? (
  <Route path="*" element={<Login onLogin={handleLogin} />} />
) : (
  <>
    {/* Rotas existentes... */}
    <Route path="/" element={<DashboardPage onLogout={handleLogout} />} />
    <Route path="/dashboard" element={<DashboardPage onLogout={handleLogout} />} />
    {/* ... outras rotas ... */}
    
    {/* Rotas do CRM */}
    {crmRoutes.map(route => (
      <Route
        key={route.path}
        path={route.path}
        element={
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 40 }}>Carregando CRM...</div>}>
            {route.element}
          </Suspense>
        }
      />
    ))}
  </>
)}
```

## 3. Adicionar ao Menu de Navegação (Opcional)

Se você tiver um componente de menu/sidebar, pode adicionar os itens do CRM:

```javascript
import { crmRoutes } from './modules/crm/routes/crmRoutes';

// No componente de menu:
{crmRoutes.map(route => (
  <NavLink 
    key={route.path} 
    to={route.path}
    className={({ isActive }) => isActive ? 'active' : ''}
  >
    <span>{route.icon}</span>
    <span>{route.label}</span>
  </NavLink>
))}
```

## 4. Exemplo Completo de Integração

Aqui está um exemplo completo de como ficaria a seção de rotas no `App.jsx`:

```javascript
import React, { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// ... outras importações ...

// Importar rotas do CRM
import { crmRoutes } from './modules/crm/routes/crmRoutes'

function App() {
  // ... código existente ...

  return (
    <Router>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: 40 }}>Carregando...</div>}>
        <Routes>
          {/* Rotas de reativação e monitoramento... */}
          
          {/* Rotas principais - requerem autenticação */}
          {!isAuthenticated ? (
            <Route path="*" element={<Login onLogin={handleLogin} />} />
          ) : (
            <>
              {/* Rotas existentes */}
              <Route path="/" element={<DashboardPage onLogout={handleLogout} />} />
              <Route path="/dashboard" element={<DashboardPage onLogout={handleLogout} />} />
              {/* ... outras rotas existentes ... */}
              
              {/* 🆕 Rotas do CRM */}
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
            </>
          )}
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
```

## 5. Testar a Integração

Após adicionar as rotas, você pode acessar:

- `/crm` - Dashboard do CRM
- `/crm/contatos` - Página de contatos
- `/crm/oportunidades` - Página de oportunidades
- `/crm/relatorios` - Página de relatórios

## 6. Próximos Passos

1. Configure as tabelas no Supabase (veja `INTEGRACAO.md`)
2. Personalize os componentes conforme necessário
3. Adicione mais funcionalidades aos serviços
4. Integre com outros módulos do sistema


