/**
 * Rotas do Módulo FLOW
 * 
 * Centraliza todas as rotas relacionadas ao Flow
 */

import { lazy } from 'react';

// Lazy loading para melhor performance
const FlowDashboardPage = lazy(() => import('../pages/FlowDashboardPage'));
const FlowEsteirasPage = lazy(() => import('../pages/FlowEsteirasPage'));
const FlowClientePage = lazy(() => import('../pages/FlowClientePage'));
const FlowGestaoLeadsPage = lazy(() => import('../pages/FlowGestaoLeadsPage'));

/**
 * Array de rotas do FLOW
 * Cada rota segue o padrão:
 * - path: caminho da URL
 * - component: componente React (lazy loaded)
 * - label: nome exibido no menu
 * - icon: emoji ou ícone para identificação visual
 * - requiresAuth: se requer autenticação (padrão: true)
 */
export const flowRoutes = [
  {
    path: '/flow',
    component: FlowDashboardPage,
    label: 'Flow Dashboard',
    icon: '🔄',
    requiresAuth: true
  },
  {
    path: '/flow/esteiras/:esteiraId?',
    component: FlowEsteirasPage,
    label: 'Esteiras',
    icon: '📋',
    requiresAuth: true
  },
  {
    path: '/flow/lead/:leadId',
    component: FlowClientePage,
    label: 'Lead Flow',
    icon: '👤',
    requiresAuth: true
  },
  {
    path: '/flow/gestao-leads',
    component: FlowGestaoLeadsPage,
    label: 'Gestão de Leads',
    icon: '📊',
    requiresAuth: true
  }
];

/**
 * Função auxiliar para obter rota por path
 */
export const getFlowRouteByPath = (path) => {
  return flowRoutes.find(route => route.path === path);
};

/**
 * Função auxiliar para obter todas as rotas do FLOW
 */
export const getAllFlowRoutes = () => {
  return flowRoutes;
};

/**
 * Função para verificar se uma rota pertence ao módulo FLOW
 */
export const isFlowRoute = (path) => {
  return path.startsWith('/flow');
};

