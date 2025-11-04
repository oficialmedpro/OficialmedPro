import React, { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// Debug para verificar se as variáveis de ambiente estão chegando
import './debug/buildInfo.js'
import '../test-build.js'
// Lazy loading das páginas principais para evitar carregar serviços desnecessários na página de vendas
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
import PerformanceDiariaPage from './pages/PerformanceDiariaPage'
import PerformanceRondaPage from './pages/PerformanceRondaPage'
import RankingDePerformancePage from './pages/RankingDePerformancePage'
import MatrizRFVPage from './pages/MatrizRFVPage'
import MetasPage from './pages/MetasPage'
import MapaDeCalorPage from './pages/MapaDeCalorPage'
// Lazy loading das páginas do Google Ads para não carregar serviços desnecessários na página de vendas
const DashGooglePatrocinadoPage = lazy(() => import('./pages/DashGooglePatrocinadoPage'))
const DashboardMetaAds = lazy(() => import('./pages/DashboardMetaAds'))
const DashboardGoogleAds = lazy(() => import('./pages/DashboardGoogleAds'))
import DailyPerformanceDebugPage from './pages/DailyPerformanceDebugPage'
import LossReasonsDebugPage from './pages/LossReasonsDebugPage'
import DebugRankingPage from './pages/DebugRankingPage'
import DebugSellerRankingPage from './pages/DebugSellerRankingPage'
import DebugTicketRankingPage from './pages/DebugTicketRankingPage'
import UserManagementPage from './pages/UserManagementPage'
import Login from './components/Login'
import autoSyncService from './service/autoSyncService'
import Callix from './pages/callix'
import ClientesConsolidados from './pages/clientes-consolidados'
import HistoricoCompras from './pages/HistoricoCompras'
import VendasPage from './pages/vendas/VendasPage'

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
  
  // Inicializar serviço de sincronização automática quando usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      // O serviço já inicia automaticamente, mas garantir que está rodando
      const status = autoSyncService.getStatus();
      if (!status.isRunning) {
        autoSyncService.start();
      }
      console.log('🔄 Serviço de sincronização automática ativo');
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Parar serviço de sincronização ao fazer logout
    autoSyncService.stop();
    
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
      <Suspense fallback={<div style={{ textAlign: 'center', padding: 40 }}>Carregando...</div>}>
      <Routes>
        <Route path="/" element={<DashboardPage onLogout={handleLogout} />} />
        <Route path="/dashboard" element={<DashboardPage onLogout={handleLogout} />} />
        <Route path="/analise-funil" element={<DashboardPage onLogout={handleLogout} />} />
        <Route path="/performance-diaria" element={<PerformanceDiariaPage onLogout={handleLogout} />} />
        <Route path="/performance-ronda" element={<PerformanceRondaPage onLogout={handleLogout} />} />
        <Route path="/ranking-de-performance" element={<RankingDePerformancePage onLogout={handleLogout} />} />
        <Route path="/matriz-rfv" element={<MatrizRFVPage onLogout={handleLogout} />} />
        <Route path="/metas" element={<MetasPage onLogout={handleLogout} />} />
        <Route path="/mapa-de-calor" element={<MapaDeCalorPage onLogout={handleLogout} />} />
        <Route path="/dashgooglepatrocinado" element={<DashGooglePatrocinadoPage onLogout={handleLogout} />} />
        <Route path="/meta-ads" element={<DashboardMetaAds onLogout={handleLogout} />} />
        <Route path="/google-ads" element={<DashboardGoogleAds onLogout={handleLogout} />} />
        <Route path="/debug-daily-performance" element={<DailyPerformanceDebugPage onLogout={handleLogout} />} />
        <Route path="/debug-loss-reasons" element={<LossReasonsDebugPage onLogout={handleLogout} />} />
        <Route path="/debug-ranking" element={<DebugRankingPage onLogout={handleLogout} />} />
        <Route path="/debug-seller-ranking" element={<DebugSellerRankingPage onLogout={handleLogout} />} />
        <Route path="/debug-ticket-ranking" element={<DebugTicketRankingPage onLogout={handleLogout} />} />
        <Route path="/usuarios" element={<UserManagementPage onLogout={handleLogout} />} />
        <Route path="/callix" element={<Callix onLogout={handleLogout} />} />
        <Route path="/clientes-consolidados" element={<ClientesConsolidados onLogout={handleLogout} />} />
        <Route path="/historico-compras" element={<HistoricoCompras onLogout={handleLogout} />} />
        <Route path="/vendas" element={<VendasPage onLogout={handleLogout} />} />
      </Routes>
      </Suspense>
    </Router>
  )
}

export default App
