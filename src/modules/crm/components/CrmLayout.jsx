/**
 * Layout do CRM
 * 
 * Wrapper que inclui o sidebar e o conteúdo das páginas do CRM
 */

import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import CrmSidebar from './CrmSidebar';
import CrmHeader from './CrmHeader';
import './CrmLayout.css';

const CrmLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated');
      const loginTime = localStorage.getItem('loginTime');
      
      if (authStatus === 'true' && loginTime) {
        // Verificar se login não expirou (24 horas)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursElapsed = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursElapsed < 24) {
          setIsAuthenticated(true);
        } else {
          // Limpar sessão expirada
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('loginTime');
          setIsAuthenticated(false);
          // Redirecionar para a página inicial (que mostrará o login)
          window.location.href = '/';
        }
      } else {
        setIsAuthenticated(false);
        // Redirecionar para a página inicial (que mostrará o login)
        window.location.href = '/';
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // O navigate já redirecionou
  }

  return (
    <div className="CrmLayout">
      <CrmHeader />
      <div className="CrmLayout-body">
        <CrmSidebar />
        <div className="CrmLayout-content">
          <div className="CrmLayout-page">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmLayout;

