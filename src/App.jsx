import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import DashboardMetaAds from './pages/DashboardMetaAds'
import Login from './components/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar se usuário já está logado
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
          console.log('✅ Usuário autenticado - sessão válida');
        } else {
          // Limpar sessão expirada
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('loginTime');
          console.log('⏰ Sessão expirada - redirecionando para login');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('loginTime');
    setIsAuthenticated(false);
    console.log('🚪 Logout realizado');
  };

  // Loading screen
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

  // Se não autenticado, mostrar login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Se autenticado, mostrar dashboard
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage onLogout={handleLogout} />} />
        <Route path="/dashboard" element={<DashboardPage onLogout={handleLogout} />} />
        <Route path="/meta-ads" element={<DashboardMetaAds onLogout={handleLogout} />} />
      </Routes>
    </Router>
  )
}

export default App
