/**
 * Módulo FLOW - Exportações Centralizadas
 * 
 * Este arquivo centraliza todas as exportações do módulo FLOW,
 * facilitando imports em outras partes da aplicação.
 */

// Páginas
export { default as FlowDashboardPage } from './pages/FlowDashboardPage';
export { default as FlowEsteirasPage } from './pages/FlowEsteirasPage';
export { default as FlowClientePage } from './pages/FlowClientePage';

// Componentes
export { default as FlowHeader } from './components/FlowHeader';
export { default as FlowEsteiraCard } from './components/FlowEsteiraCard';

// Serviços
export { default as flowService } from './services/flowService';
export { default as flowClienteService } from './services/flowClienteService';

// Hooks
export { useFlowOpportunities } from './hooks/useFlowOpportunities';
export { useFlowCliente } from './hooks/useFlowCliente';

// Utilitários
export * from './utils/flowHelpers';
export * from './utils/flowValidators';

// Rotas
export { flowRoutes } from './routes/flowRoutes';



