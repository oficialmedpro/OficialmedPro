import DashboardPage from '../pages/DashboardPage';
import DashboardMetaAds from '../pages/DashboardMetaAds';
import DashboardGoogleAds from '../pages/DashboardGoogleAds';
import GooglePatrocinadoPage from '../pages/GooglePatrocinadoPage';
import DailyPerformanceDebugPage from '../pages/DailyPerformanceDebugPage';

// Configuração das rotas da aplicação
export const routes = [
  {
    path: '/',
    element: <DashboardPage />,
    label: 'Dashboard',
    icon: '📊'
  },
  {
    path: '/meta-ads',
    element: <DashboardMetaAds />,
    label: 'Dashboard MetaAds',
    icon: '📈'
  },
  {
    path: '/google-ads',
    element: <DashboardGoogleAds />,
    label: 'Dashboard GoogleAds',
    icon: '🔍'
  },
  {
    path: '/google-patrocinado',
    element: <GooglePatrocinadoPage />,
    label: 'Google Patrocinado',
    icon: '🎯'
  },
  {
    path: '/debug-daily-performance',
    element: <DailyPerformanceDebugPage />,
    label: 'Debug Daily Performance',
    icon: '🎯'
  }
];

// Função para obter rota por path
export const getRouteByPath = (path) => {
  return routes.find(route => route.path === path);
};

// Função para obter todas as rotas
export const getAllRoutes = () => {
  return routes;
};
