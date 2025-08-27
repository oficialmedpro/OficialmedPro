export const getStatsCards = (t) => [
  { 
    title: t.totalOpportunities, 
    value: '1,234', 
    color: 'blue', 
    progress: 75, 
    isOpportunity: true, 
    opportunityValue: 'R$ 3.2M',
    previousValue: '1,156',
    change: '+6.7%',
    isPositive: true,
    meta: '2300',
    metaPercentage: '54%'
  },
  { 
    title: t.lostOpportunities, 
    value: '89', 
    color: 'red', 
    progress: 45, 
    isOpportunity: true, 
    opportunityValue: 'R$ 890k',
    previousValue: '92',
    change: '-3.3%',
    isPositive: false,
    meta: '120',
    metaPercentage: '74%'
  },
  { 
    title: t.averageTicket, 
    value: '2800', 
    color: 'purple', 
    progress: 85, 
    isCurrency: true, 
    opportunityValue: 'R$ 2.500',
    previousValue: '2650',
    change: '+5.7%',
    isPositive: true,
    meta: '3200',
    metaPercentage: '88%'
  },
  { 
    title: t.budgetNegotiation, 
    value: '73', 
    color: 'orange', 
    progress: 62, 
    isOpportunity: true, 
    opportunityValue: 'R$ 420k',
    previousValue: '68',
    change: '+7.4%',
    isPositive: true,
    meta: '95',
    metaPercentage: '77%'
  },
  { 
    title: t.wonOpportunities, 
    value: '156', 
    color: 'green', 
    progress: 68, 
    isOpportunity: true, 
    opportunityValue: 'R$ 1.56M',
    previousValue: '142',
    change: '+9.9%',
    isPositive: true,
    meta: '200',
    metaPercentage: '78%'
  }
];

export const getMenuItems = (t) => [
  { icon: 'funil-compra', label: t.funilCompra, active: true },
  { icon: 'funil-recompra', label: t.funilRecompra, active: false }
];
