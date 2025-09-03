import DashboardPage from '../pages/DashboardPage';
import DashboardMetaAds from '../pages/DashboardMetaAds';
import DashboardGoogleAds from '../pages/DashboardGoogleAds';

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
