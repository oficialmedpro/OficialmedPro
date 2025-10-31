/**
 * 🔐 HOOK DE AUTENTICAÇÃO
 * 
 * Gerencia estado de autenticação, permissões e controle de acesso
 */

import { useState, useEffect, createContext, useContext } from 'react';
import authService from '../service/authService';

// Contexto de autenticação
const AuthContext = createContext(null);

// Hook principal de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Retornar valores padrão em vez de lançar erro (compatível com uso opcional)
    return {
      user: null,
      loading: false,
      permissions: {},
      allowedUnits: [],
      login: async () => ({ success: false, error: 'AuthProvider não disponível' }),
      logout: async () => {},
      hasPermission: () => false,
      hasUnitAccess: () => false,
      isUserType: () => false,
      hasLevel: () => false,
      getUserUnits: () => [],
      getUserPermissions: () => ({}),
      isAuthenticated: () => false,
      getUser: () => null
    };
  }
  return context;
};

// Provider de autenticação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({});
  const [allowedUnits, setAllowedUnits] = useState([]);

  // Verificar se há token válido ao inicializar
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Verificar token
  const verifyToken = async (token) => {
    try {
      const result = await authService.verifyToken(token);
      if (result.success) {
        setUser(result.user);
        setPermissions(result.user.permissions || {});
        setAllowedUnits(result.user.allowedUnits || []);
      } else {
        localStorage.removeItem('auth_token');
        setUser(null);
        setPermissions({});
        setAllowedUnits([]);
      }
    } catch (error) {
      console.error('Erro na verificação do token:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      setPermissions({});
      setAllowedUnits([]);
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (username, password) => {
    try {
      setLoading(true);
      const result = await authService.login(username, password);
      
      if (result.success) {
        localStorage.setItem('auth_token', result.session.token);
        setUser(result.user);
        setPermissions(result.user.permissions || {});
        setAllowedUnits(result.user.allowedUnits || []);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await authService.logout(token, user?.id);
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      setPermissions({});
      setAllowedUnits([]);
    }
  };

  // Verificar permissão específica
  const hasPermission = (moduleName, action = 'read') => {
    if (!user) return false;
    
    const module = permissions[moduleName];
    if (!module) return false;

    switch (action) {
      case 'read':
        return module.canRead;
      case 'write':
        return module.canWrite;
      case 'delete':
        return module.canDelete;
      case 'export':
        return module.canExport;
      default:
        return false;
    }
  };

  // Verificar acesso a unidade
  const hasUnitAccess = (unitId) => {
    if (!user) return false;
    
    // Admin franqueadora tem acesso a todas as unidades
    if (user.userType === 'adminfranquiadora') return true;
    
    // Outros tipos verificam lista de unidades permitidas
    return allowedUnits.some(unit => unit.unit_id === unitId);
  };

  // Verificar se é tipo específico de usuário
  const isUserType = (userType) => {
    return user?.userType === userType;
  };

  // Verificar se tem nível hierárquico específico ou superior
  const hasLevel = (level) => {
    if (!user) return false;
    
    const levels = {
      'adminfranquiadora': 1,
      'adminfranquia': 2,
      'adminunidade': 3,
      'supervisor': 4,
      'vendedor': 5
    };
    
    const userLevel = levels[user.userType];
    return userLevel && userLevel <= level;
  };

  // Obter unidades permitidas
  const getUserUnits = () => {
    return allowedUnits;
  };

  // Obter permissões do usuário
  const getUserPermissions = () => {
    return permissions;
  };

  // Verificar se está autenticado
  const isAuthenticated = () => {
    return !!user;
  };

  // Obter dados do usuário
  const getUser = () => {
    return user;
  };

  const value = {
    user,
    loading,
    permissions,
    allowedUnits,
    login,
    logout,
    hasPermission,
    hasUnitAccess,
    isUserType,
    hasLevel,
    getUserUnits,
    getUserPermissions,
    isAuthenticated,
    getUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para verificar permissões específicas
export const usePermissions = () => {
  const { hasPermission, hasUnitAccess, isUserType, hasLevel } = useAuth();
  
  return {
    hasPermission,
    hasUnitAccess,
    isUserType,
    hasLevel
  };
};

// Hook para controle de acesso a rotas
export const useRouteAccess = () => {
  const { isAuthenticated, hasPermission, user } = useAuth();
  
  const canAccessRoute = (requiredPermissions = [], requiredUserTypes = []) => {
    // Verificar se está autenticado
    if (!isAuthenticated()) return false;
    
    // Verificar tipo de usuário se especificado
    if (requiredUserTypes.length > 0) {
      const hasRequiredType = requiredUserTypes.some(type => 
        user?.userType === type
      );
      if (!hasRequiredType) return false;
    }
    
    // Verificar permissões se especificadas
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission => {
        const [module, action = 'read'] = permission.split(':');
        return hasPermission(module, action);
      });
      if (!hasRequiredPermissions) return false;
    }
    
    return true;
  };
  
  return { canAccessRoute };
};

// Componente de proteção de rota
export const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  requiredUserTypes = [],
  fallback = null 
}) => {
  const { canAccessRoute } = useRouteAccess();
  
  if (!canAccessRoute(requiredPermissions, requiredUserTypes)) {
    return fallback || <div>Acesso negado</div>;
  }
  
  return children;
};

// Componente para mostrar conteúdo baseado em permissão
export const PermissionGate = ({ 
  children, 
  module, 
  action = 'read',
  fallback = null 
}) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(module, action)) {
    return fallback;
  }
  
  return children;
};

// Componente para mostrar conteúdo baseado em tipo de usuário
export const UserTypeGate = ({ 
  children, 
  allowedTypes = [],
  fallback = null 
}) => {
  const { isUserType } = usePermissions();
  
  const hasAllowedType = allowedTypes.some(type => isUserType(type));
  
  if (!hasAllowedType) {
    return fallback;
  }
  
  return children;
};

// Componente para mostrar conteúdo baseado em acesso à unidade
export const UnitAccessGate = ({ 
  children, 
  unitId,
  fallback = null 
}) => {
  const { hasUnitAccess } = usePermissions();
  
  if (!hasUnitAccess(unitId)) {
    return fallback;
  }
  
  return children;
};

export default useAuth;

