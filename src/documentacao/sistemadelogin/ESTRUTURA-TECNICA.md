# 🔧 Estrutura Técnica - Sistema de Login

## 📊 **Diagrama de Relacionamentos**

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   user_types    │    │ user_type_permissions│    │     modules     │
├─────────────────┤    ├──────────────────────┤    ├─────────────────┤
│ id (PK)         │◄───┤ user_type_id (FK)    │    │ id (PK)         │
│ name            │    │ module_id (FK)       ├───►│ name            │
│ description     │    │ can_read             │    │ description     │
│ level           │    │ can_write            │    │ category        │
│ created_at      │    │ can_delete           │    │ icon            │
│ updated_at      │    │ can_export           │    │ created_at      │
└─────────────────┘    │ created_at           │    │ updated_at      │
                       └──────────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │     users       │
                       ├─────────────────┤
                       │ id (PK)         │
                       │ username        │
                       │ email           │
                       │ password_hash   │
                       │ first_name      │
                       │ last_name       │
                       │ user_type_id(FK)├──┐
                       │ status          │  │
                       │ access_status   │  │
                       │ vendedor_id     │  │
                       │ allowed_units   │  │
                       │ last_login      │  │
                       │ created_at      │  │
                       │ updated_at      │  │
                       └─────────────────┘  │
                                │           │
                                │           │
                       ┌─────────────────┐  │
                       │ user_sessions   │  │
                       ├─────────────────┤  │
                       │ id (PK)         │  │
                       │ user_id (FK)    ├──┘
                       │ token_hash      │
                       │ ip_address      │
                       │ user_agent      │
                       │ expires_at      │
                       │ created_at      │
                       │ last_activity   │
                       └─────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │   access_logs   │
                       ├─────────────────┤
                       │ id (PK)         │
                       │ user_id (FK)    ├──┐
                       │ action          │  │
                       │ module          │  │
                       │ ip_address      │  │
                       │ user_agent      │  │
                       │ details         │  │
                       │ created_at      │  │
                       └─────────────────┘  │
                                            │
                                            │
                       ┌─────────────────┐  │
                       │     users       │  │
                       │ (self-reference)│◄─┘
                       │ created_by (FK) │
                       │ updated_by (FK) │
                       └─────────────────┘
```

## 🔐 **Configuração de Segurança**

### **RLS (Row Level Security)**
```sql
-- Todas as tabelas têm RLS habilitado
ALTER TABLE api.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.user_type_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.access_logs ENABLE ROW LEVEL SECURITY;
```

### **Políticas de Acesso**
```sql
-- Exemplo para tabela users
CREATE POLICY "Allow login check (users)" ON api.users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow select for authenticated users (users)" ON api.users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for service_role (users)" ON api.users
  FOR INSERT
  WITH CHECK (true);
```

### **GRANTs de Permissão**
```sql
-- Permissões para diferentes roles
GRANT SELECT ON api.users TO anon;                    -- Login sem autenticação
GRANT SELECT ON api.users TO authenticated;           -- Usuários logados
GRANT ALL ON api.users TO service_role;               -- Servidor (bypass RLS)

GRANT SELECT ON api.user_types TO anon;               -- Leitura pública
GRANT SELECT ON api.modules TO anon;                  -- Leitura pública
GRANT SELECT ON api.user_type_permissions TO anon;    -- Leitura pública
```

## 🚀 **Fluxo de Autenticação Detalhado**

### **1. Login do Usuário**
```javascript
// Frontend: Login.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // 1. Buscar usuário no banco
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', credentials.username)
      .eq('status', 'active')
      .eq('access_status', 'liberado')
      .single();
    
    if (error || !user) {
      setError('Usuário não encontrado');
      return;
    }
    
    // 2. Validar senha
    const isValidPassword = await bcrypt.compare(
      credentials.password, 
      user.password_hash
    );
    
    if (!isValidPassword) {
      setError('Senha incorreta');
      return;
    }
    
    // 3. Criar sessão
    const sessionId = crypto.randomUUID();
    const token = jwt.sign(
      { userId: user.id, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 4. Salvar sessão no banco
    await supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        user_id: user.id,
        token_hash: await bcrypt.hash(token, 10),
        ip_address: getClientIP(),
        user_agent: navigator.userAgent,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    
    // 5. Log de acesso
    await supabase
      .from('access_logs')
      .insert({
        user_id: user.id,
        action: 'login',
        ip_address: getClientIP(),
        user_agent: navigator.userAgent,
        details: { sessionId }
      });
    
    // 6. Salvar no localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // 7. Redirecionar
    onLogin();
    
  } catch (error) {
    setError('Erro interno do servidor');
  } finally {
    setLoading(false);
  }
};
```

### **2. Validação de Permissões**
```javascript
// Hook: useAuth.js
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  
  const checkPermission = async (module, action = 'read') => {
    if (!user) return false;
    
    try {
      const { data } = await supabase
        .from('user_type_permissions')
        .select(`
          can_read, can_write, can_delete, can_export,
          modules(name),
          user_types(name)
        `)
        .eq('user_types.id', user.user_type_id)
        .eq('modules.name', module)
        .single();
      
      if (!data) return false;
      
      switch (action) {
        case 'read': return data.can_read;
        case 'write': return data.can_write;
        case 'delete': return data.can_delete;
        case 'export': return data.can_export;
        default: return false;
      }
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  };
  
  const hasAccessToUnit = (unitId) => {
    if (!user) return false;
    return user.allowed_units.includes(unitId.toString());
  };
  
  return {
    user,
    permissions,
    checkPermission,
    hasAccessToUnit,
    isAuthenticated: !!user
  };
};
```

### **3. Middleware de Autenticação**
```javascript
// Utils: authMiddleware.js
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar sessão no banco
    const { data: session } = await supabase
      .from('user_sessions')
      .select(`
        id, user_id, expires_at,
        users(*)
      `)
      .eq('id', decoded.sessionId)
      .eq('expires_at', '>', new Date())
      .single();
    
    if (!session) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }
    
    // Atualizar última atividade
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date() })
      .eq('id', session.id);
    
    req.user = session.users;
    req.session = session;
    next();
    
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
```

## 📱 **Componentes Frontend**

### **1. Login Component**
```javascript
// src/components/Login.jsx
import React, { useState } from 'react';
import { supabase } from '../service/supabase';
import bcrypt from 'bcryptjs';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    // Implementação do fluxo de login
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          value={credentials.username}
          onChange={handleChange}
          placeholder="Usuário"
          required
        />
        <input
          type="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          placeholder="Senha"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};
```

### **2. Protected Route Component**
```javascript
// src/components/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ 
  children, 
  requiredPermission, 
  requiredAction = 'read',
  requiredUnit = null 
}) => {
  const { user, checkPermission, hasAccessToUnit } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (requiredPermission && !checkPermission(requiredPermission, requiredAction)) {
    return <div>Acesso negado</div>;
  }
  
  if (requiredUnit && !hasAccessToUnit(requiredUnit)) {
    return <div>Sem acesso a esta unidade</div>;
  }
  
  return children;
};
```

### **3. Permission Guard Component**
```javascript
// src/components/PermissionGuard.jsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';

const PermissionGuard = ({ 
  children, 
  module, 
  action = 'read',
  fallback = null 
}) => {
  const { checkPermission } = useAuth();
  
  if (!checkPermission(module, action)) {
    return fallback;
  }
  
  return children;
};
```

## 🔧 **Configuração de Ambiente**

### **Variáveis de Ambiente (.env)**
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_SCHEMA=api

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Bcrypt
BCRYPT_ROUNDS=10
```

### **Package.json Dependencies**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "react": "^18.2.0",
    "react-router-dom": "^6.8.0"
  }
}
```

## 🧪 **Testes**

### **1. Teste de Login**
```javascript
// tests/login.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../src/components/Login';

test('deve fazer login com credenciais válidas', async () => {
  const mockOnLogin = jest.fn();
  render(<Login onLogin={mockOnLogin} />);
  
  fireEvent.change(screen.getByPlaceholderText('Usuário'), {
    target: { value: 'admin' }
  });
  fireEvent.change(screen.getByPlaceholderText('Senha'), {
    target: { value: 'password123' }
  });
  
  fireEvent.click(screen.getByText('Entrar'));
  
  await waitFor(() => {
    expect(mockOnLogin).toHaveBeenCalled();
  });
});
```

### **2. Teste de Permissões**
```javascript
// tests/permissions.test.js
import { useAuth } from '../src/hooks/useAuth';

test('deve verificar permissões corretamente', async () => {
  const { checkPermission } = useAuth();
  
  // Admin deve ter acesso total
  expect(await checkPermission('dashboard', 'read')).toBe(true);
  expect(await checkPermission('configuracoes', 'write')).toBe(true);
  
  // Vendedor não deve ter acesso a configurações
  expect(await checkPermission('configuracoes', 'read')).toBe(false);
});
```

## 📊 **Monitoramento e Logs**

### **1. Log de Acessos**
```javascript
// Utils: logging.js
export const logAccess = async (user, action, module, details = {}) => {
  try {
    await supabase
      .from('access_logs')
      .insert({
        user_id: user.id,
        action,
        module,
        ip_address: getClientIP(),
        user_agent: navigator.userAgent,
        details
      });
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
};
```

### **2. Métricas de Uso**
```sql
-- Query para métricas de uso
SELECT 
  DATE(created_at) as data,
  action,
  COUNT(*) as total
FROM api.access_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), action
ORDER BY data DESC, total DESC;
```

## 🔒 **Segurança Avançada**

### **1. Rate Limiting**
```javascript
// Utils: rateLimiter.js
const loginAttempts = new Map();

export const checkRateLimit = (ip, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  
  // Remove tentativas antigas
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return false; // Rate limit excedido
  }
  
  recentAttempts.push(now);
  loginAttempts.set(ip, recentAttempts);
  
  return true;
};
```

### **2. Bloqueio de Conta**
```javascript
// Utils: accountLockout.js
export const handleFailedLogin = async (userId) => {
  const { data: user } = await supabase
    .from('users')
    .select('login_attempts, locked_until')
    .eq('id', userId)
    .single();
  
  const attempts = (user.login_attempts || 0) + 1;
  const maxAttempts = 5;
  const lockDuration = 30 * 60 * 1000; // 30 minutos
  
  if (attempts >= maxAttempts) {
    // Bloquear conta
    await supabase
      .from('users')
      .update({
        login_attempts: attempts,
        locked_until: new Date(Date.now() + lockDuration)
      })
      .eq('id', userId);
  } else {
    // Incrementar tentativas
    await supabase
      .from('users')
      .update({ login_attempts: attempts })
      .eq('id', userId);
  }
};
```

---

**Este documento contém toda a estrutura técnica necessária para implementar o sistema de login completo.**
