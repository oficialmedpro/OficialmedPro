/**
 * Módulo CRM - Exportações Centralizadas
 * 
 * Este arquivo centraliza todas as exportações do módulo CRM,
 * facilitando imports em outras partes da aplicação.
 */

// Páginas
export { default as CrmDashboardPage } from './pages/CrmDashboardPage';
export { default as CrmContactsPage } from './pages/CrmContactsPage';
export { default as CrmOpportunitiesPage } from './pages/CrmOpportunitiesPage';
export { default as CrmReportsPage } from './pages/CrmReportsPage';
export { default as CrmKanbanPage } from './pages/CrmKanbanPage';

// Componentes
export { default as CrmContactList } from './components/CrmContactList';
export { default as CrmContactForm } from './components/CrmContactForm';
export { default as CrmOpportunityCard } from './components/CrmOpportunityCard';
export { default as CrmPipeline } from './components/CrmPipeline';
export { default as CrmKanbanBoard } from './components/CrmKanbanBoard';
export { default as CrmKanbanCard } from './components/CrmKanbanCard';

// Serviços
export { default as crmContactService } from './services/crmContactService';
export { default as crmOpportunityService } from './services/crmOpportunityService';
export { default as crmReportService } from './services/crmReportService';
export { default as crmKanbanService } from './services/crmKanbanService';

// Hooks
export { useCrmContacts } from './hooks/useCrmContacts';
export { useCrmOpportunities } from './hooks/useCrmOpportunities';

// Utilitários
export * from './utils/crmHelpers';
export * from './utils/crmValidators';

// Rotas
export { crmRoutes } from './routes/crmRoutes';

// Tipos (se usando TypeScript)
// export * from './types';

