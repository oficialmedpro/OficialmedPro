import React, { useState, useEffect } from 'react';
import DailyPerformanceTable from '../components/DailyPerformanceTable';
import FilterBar from '../components/FilterBar';

/**
 * 🎯 DAILY PERFORMANCE DEBUG PAGE
 * 
 * Página isolada para debugar a tabela de performance diária
 * Permite visualizar logs de forma mais clara
 */
const DailyPerformanceDebugPage = () => {
  // Estados para os filtros (valores padrão para teste)
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedFunnel, setSelectedFunnel] = useState('6'); // Funil Comercial
  const [selectedUnit, setSelectedUnit] = useState('[1]'); // Apucarana
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [selectedSellerName, setSelectedSellerName] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('all');

  // Função para aplicar filtros
  const handleFiltersChange = (filters) => {
    setStartDate(filters.startDate);
    setEndDate(filters.endDate);
    setSelectedFunnel(filters.selectedFunnel);
    setSelectedUnit(filters.selectedUnit);
    setSelectedSeller(filters.selectedSeller);
    setSelectedOrigin(filters.selectedOrigin);
  };

  // Callback para nome do vendedor
  const handleSellerNameChange = (name) => {
    setSelectedSellerName(name);
  };

  // Limpar console ao carregar
  useEffect(() => {
    console.clear();
    console.log('🎯 DEBUG PAGE: Daily Performance Table');
    console.log('='.repeat(60));
    console.log('📅 Filtros atuais:', {
      startDate,
      endDate,
      selectedFunnel,
      selectedUnit,
      selectedSeller,
      selectedOrigin
    });
    console.log('='.repeat(60));
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'var(--bg-primary, #0b1220)', 
      minHeight: '100vh',
      color: 'var(--text-primary, #ffffff)'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px',
        backgroundColor: 'var(--bg-secondary, #1a1a1a)',
        borderRadius: '12px',
        border: '1px solid var(--border-color, #333)'
      }}>
        <h1 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '24px', 
          fontWeight: '700',
          color: 'var(--accent-blue, #3b82f6)'
        }}>
          🎯 Daily Performance Table - Debug Mode
        </h1>
        <p style={{ 
          margin: '0', 
          fontSize: '14px', 
          opacity: '0.8'
        }}>
          Página isolada para debugar a tabela de performance diária. 
          Abra o console (F12) para visualizar os logs detalhados.
        </p>
        
        {/* Instruções de debug */}
        <div style={{ 
          marginTop: '15px',
          padding: '15px',
          backgroundColor: 'var(--bg-primary, #0b1220)',
          borderRadius: '8px',
          border: '1px solid var(--accent-blue, #3b82f6)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: 'var(--accent-blue, #3b82f6)' }}>
            📋 Como debugar:
          </h3>
          <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
            <li>Abra o console do navegador (F12 → Console)</li>
            <li>Procure pelos logs com prefixo "🔎 DailyPerformanceService"</li>
            <li>Verifique se "todayKey" existe nos dados agrupados</li>
            <li>Compare a URL gerada com outros componentes funcionais</li>
            <li>Observe o total de registros retornados pela query</li>
          </ul>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: '30px' }}>
        <FilterBar
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={selectedSeller}
          selectedOrigin={selectedOrigin}
          onFiltersChange={handleFiltersChange}
          onSellerNameChange={handleSellerNameChange}
          t={(key) => key} // Função de tradução simples
        />
      </div>

      {/* Tabela de Performance */}
      <DailyPerformanceTable
        startDate={startDate}
        endDate={endDate}
        selectedFunnel={selectedFunnel}
        selectedUnit={selectedUnit}
        selectedSeller={selectedSeller}
        selectedSellerName={selectedSellerName}
        selectedOrigin={selectedOrigin}
        t={(key) => key} // Função de tradução simples
      />

      {/* Informações adicionais */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'var(--bg-secondary, #1a1a1a)',
        borderRadius: '12px',
        border: '1px solid var(--border-color, #333)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: 'var(--accent-blue, #3b82f6)' }}>
          🔧 Filtros Atuais:
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
          fontSize: '13px'
        }}>
          <div><strong>Período:</strong> {startDate} até {endDate}</div>
          <div><strong>Funil:</strong> {selectedFunnel === '6' ? 'Comercial (6)' : selectedFunnel === '14' ? 'Recompra (14)' : 'Todos'}</div>
          <div><strong>Unidade:</strong> {selectedUnit === '[1]' ? 'Apucarana [1]' : selectedUnit}</div>
          <div><strong>Vendedor:</strong> {selectedSeller === 'all' ? 'Todos' : selectedSeller}</div>
          <div><strong>Origem:</strong> {selectedOrigin === 'all' ? 'Todas' : selectedOrigin}</div>
        </div>
      </div>
    </div>
  );
};

export default DailyPerformanceDebugPage;
