# Documentação do Dashboard

> 🔗 Integrações SprintHub: veja [`SERVICOS_SPRINT.md`](./SERVICOS_SPRINT.md) antes de trabalhar com dados do Sprinthub.

## Arquivos Criados

### 1. DashboardPage.jsx
**Localização:** `src/pages/DashboardPage.jsx`

**Descrição:** Componente principal do dashboard que implementa uma interface de analytics moderna e responsiva.

**Funcionalidades:**
- **Layout Responsivo:** Adapta-se automaticamente para desktop, tablet e mobile
- **Menu Lateral:** Menu expansível no desktop que mostra ícones quando colapsado
- **Menu Mobile:** Transforma-se em menu superior + menu lateral deslizante + navegação inferior
- **Dashboard Analytics:** Exibe métricas, gráficos e widgets de analytics
- **Dashboard de Projetos:** Seção dedicada para gerenciamento de projetos

**Componentes Implementados:**
- Sidebar expansível/colapsável para desktop
- Header mobile com menu hambúrguer
- Menu lateral deslizante para mobile
- Navegação inferior para mobile
- Cards de estatísticas (All User, Event Count, Conversations, New User)
- Gráfico principal de analytics com curva suave
- Sidebar de usuários com gráfico de barras
- Cards de métricas (Sessions, Page Views, Avg. Duration, Bounce Rate)
- Gráficos de rosca (New vs Returning Visitors, Device Breakdown)
- Seção de dashboard de projetos com card de boas-vindas
- Cards de status de projetos (Total, Completed, In Progress, Active)

**Estados Gerenciados:**
- `sidebarExpanded`: Controla expansão/colapso do menu lateral
- `mobileMenuOpen`: Controla abertura do menu mobile

### 2. DashboardPage.css
**Localização:** `src/pages/DashboardPage.css`

**Descrição:** Arquivo de estilos CSS que implementa todo o design visual do dashboard com responsividade completa.

**Características do Design:**
- **Tema Escuro:** Paleta de cores baseada em tons escuros (#0f172a, #1e293b, #334155)
- **Gradientes:** Uso extensivo de gradientes para cards e elementos interativos
- **Animações:** Transições suaves e efeitos hover
- **Tipografia:** Sistema de fontes moderno com hierarquia clara

**Breakpoints Responsivos:**
- **Desktop:** > 1024px - Layout completo com sidebar lateral
- **Tablet:** 768px - 1024px - Layout adaptado com reorganização de elementos
- **Mobile:** < 768px - Menu transformado (topo + lateral + rodapé)
- **Mobile Pequeno:** < 480px - Layout otimizado para telas muito pequenas

**Funcionalidades CSS:**
- **Sidebar Desktop:** 
  - Largura de 70px quando colapsado
  - Largura de 280px quando expandido
  - Transições suaves de 0.3s
  
- **Menu Mobile:**
  - Header fixo no topo (60px altura)
  - Sidebar deslizante com overlay
  - Navegação inferior fixa (70px altura)
  
- **Cards e Componentes:**
  - Hover effects com elevação
  - Gradientes personalizados por categoria
  - Animações de fadeIn escalonadas
  
- **Gráficos:**
  - SVG responsivos para charts
  - Gráficos de barras animados
  - Gráficos de rosca com legendas

**Cores por Categoria:**
- **Purple/Blue:** Analytics e dashboard principal (#8b5cf6, #3b82f6)
- **Orange:** Event Count (#f97316, #ea580c)
- **Green:** Conversations e Success (#10b981, #059669)
- **Cyan:** New Users (#06b6d4, #0891b2)

**Acessibilidade:**
- Focus states visíveis
- Support para prefers-reduced-motion
- High contrast mode support
- Scrollbar personalizado

## Comportamento Responsivo

### Desktop (> 1024px)
- Menu lateral fixo à esquerda
- Conteúdo principal com margin-left ajustável
- Layout em grid para todos os componentes
- Sidebar de usuários ao lado do gráfico principal

### Tablet (768px - 1024px)
- Menu lateral mantido
- Reorganização de elementos em coluna única
- Cards de projeto adaptados

### Mobile (< 768px)
- **Menu Superior:** Header fixo com logo e ações
- **Menu Lateral:** Deslizante com overlay escuro
- **Menu Inferior:** Navegação fixa na parte inferior
- **Conteúdo:** Padding ajustado para não sobrepor os menus
- **Cards:** Layout em coluna única ou grid responsivo

## Estrutura de Dados

O componente utiliza arrays de dados mockados para demonstração:
- `menuItems`: Itens do menu de navegação
- `statsCards`: Cards de estatísticas principais
- `projectCards`: Cards de status de projetos
- `countryData`: Dados de países para ranking

## Integração

Para usar este dashboard:

1. Importe o componente:
```jsx
import DashboardPage from './pages/DashboardPage';
```

2. Use no seu roteamento:
```jsx
<Route path="/dashboard" component={DashboardPage} />
```

3. O CSS será importado automaticamente pelo componente.

## Customização

O dashboard é altamente customizável através de:
- Variáveis CSS para cores
- Props para dados dinâmicos (pode ser implementado)
- Modificação dos arrays de dados
- Ajuste dos breakpoints responsivos

## Tecnologias Utilizadas

- **React:** Hooks (useState)
- **CSS3:** Grid, Flexbox, Animations, Media Queries
- **SVG:** Para gráficos e ícones vetoriais
- **Responsividade:** Mobile-first approach