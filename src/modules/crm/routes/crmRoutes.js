/**
 * Rotas do Módulo CRM
 * 
 * Centraliza todas as rotas relacionadas ao CRM
 */

import { lazy } from 'react';

// Lazy loading para melhor performance
const CrmDashboardPage = lazy(() => import('../pages/CrmDashboardPage'));
const CrmContactsPage = lazy(() => import('../pages/CrmContactsPage'));
const CrmOpportunitiesPage = lazy(() => import('../pages/CrmOpportunitiesPage'));
const CrmReportsPage = lazy(() => import('../pages/CrmReportsPage'));
const CrmKanbanPage = lazy(() => import('../pages/CrmKanbanPage'));
const CrmAutomacoesPage = lazy(() => import('../pages/CrmAutomacoesPage'));
const CrmPlanejadorPage = lazy(() => import('../pages/CrmPlanejadorPage'));
const CrmAprovacoesPage = lazy(() => import('../pages/CrmAprovacoesPage'));
const CrmAjudaPage = lazy(() => import('../pages/CrmAjudaPage'));
const CrmConfiguracoesPage = lazy(() => import('../pages/CrmConfiguracoesPage'));

/**
 * Array de rotas do CRM
 * Cada rota segue o padrão:
 * - path: caminho da URL
 * - component: componente React (lazy loaded)
 * - label: nome exibido no menu
 * - icon: emoji ou ícone para identificação visual
 * - requiresAuth: se requer autenticação (padrão: true)
 */
export const crmRoutes = [
  {
    path: '/crm',
    component: CrmDashboardPage,
    label: 'CRM Dashboard',
    icon: '📊',
    requiresAuth: true
  },
  {
    path: '/crm/contatos',
    component: CrmContactsPage,
    label: 'Contatos',
    icon: '👥',
    requiresAuth: true
  },
  {
    path: '/crm/oportunidades',
    component: CrmOpportunitiesPage,
    label: 'Oportunidades',
    icon: '💼',
    requiresAuth: true
  },
  {
    path: '/crm/relatorios',
    component: CrmReportsPage,
    label: 'Relatórios',
    icon: '📈',
    requiresAuth: true
  },
  {
    path: '/crm/kanban',
    component: CrmKanbanPage,
    label: 'Kanban',
    icon: '📋',
    requiresAuth: true
  },
  {
    path: '/crm/automacoes',
    component: CrmAutomacoesPage,
    label: 'Automações',
    icon: '⚡',
    requiresAuth: true
  },
  {
    path: '/crm/planejador',
    component: CrmPlanejadorPage,
    label: 'Planejador Campanhas',
    icon: '📅',
    requiresAuth: true
  },
  {
    path: '/crm/aprovacoes',
    component: CrmAprovacoesPage,
    label: 'Aprovações',
    icon: '✅',
    requiresAuth: true
  },
  {
    path: '/crm/ajuda',
    component: CrmAjudaPage,
    label: 'Ajuda',
    icon: '❓',
    requiresAuth: true
  },
  {
    path: '/crm/configuracoes',
    component: CrmConfiguracoesPage,
    label: 'Configurações',
    icon: '⚙️',
    requiresAuth: true
  }
];

/**
 * Função auxiliar para obter rota por path
 */
export const getCrmRouteByPath = (path) => {
  return crmRoutes.find(route => route.path === path);
};

/**
 * Função auxiliar para obter todas as rotas do CRM
 */
export const getAllCrmRoutes = () => {
  return crmRoutes;
};

/**
 * Função para verificar se uma rota pertence ao módulo CRM
 */
export const isCrmRoute = (path) => {
  return path.startsWith('/crm');
};

