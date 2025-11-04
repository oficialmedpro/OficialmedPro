import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReativacaoLogin from './ReativacaoLogin';

const ReativacaoProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Verificar autenticação periodicamente
    const interval = setInterval(checkAuth, 60000); // Verificar a cada minuto
    
    return () => clearInterval(interval);
  }, [location.pathname, navigate]);

  const checkAuth = () => {
    try {
      const authStatus = localStorage.getItem('reativacao_authenticated');
      const loginTime = localStorage.getItem('reativacao_loginTime');
      const token = localStorage.getItem('reativacao_token');
      const userData = localStorage.getItem('reativacao_userData');

      if (authStatus === 'true' && loginTime && token && userData) {
        // Verificar se login não expirou (24 horas)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursElapsed = (now - loginDate) / (1000 * 60 * 60);

        if (hoursElapsed < 24) {
          // Verificar se o token é válido (básico)
          try {
            const user = JSON.parse(userData);
            // Verificar se é supervisor ou vendedor
            const allowedTypes = ['supervisor', 'vendedor', 'adminfranquiadora', 'adminfranquia', 'adminunidade'];
            const userTypeName = user.userTypeName?.toLowerCase() || '';
            
            if (allowedTypes.includes(userTypeName)) {
              setIsAuthenticated(true);
              setLoading(false);
              return;
            } else {
              // Tipo de usuário não permitido
              clearAuth();
              setIsAuthenticated(false);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Erro ao validar dados do usuário:', e);
            clearAuth();
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
        } else {
          // Sessão expirada
          clearAuth();
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
      } else {
        // Não autenticado
        setIsAuthenticated(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('reativacao_authenticated');
    localStorage.removeItem('reativacao_loginTime');
    localStorage.removeItem('reativacao_token');
    localStorage.removeItem('reativacao_userData');
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: '#e0e7ff'
      }}>
        <div>Verificando autenticação...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecionar para login se não autenticado
    if (location.pathname !== '/reativacao/login') {
      navigate('/reativacao/login', { replace: true });
    }
    return <ReativacaoLogin />;
  }

  return children;
};

export default ReativacaoProtectedRoute;

