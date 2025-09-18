import React, { useState } from 'react';
import { getTicketRankingData } from '../service/ticketRankingService';
import { getDDDRankingData } from '../service/dddRankingService';

const DebugTicketRankingPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testTicketRanking = async () => {
    setLoading(true);
    setLogs([]);
    
    try {
      addLog('🚀 Iniciando teste do TicketRankingService...');
      
      // Teste com dados mínimos
      const result = await getTicketRankingData(
        '2024-01-01', // startDate
        '2024-12-31', // endDate
        'all',        // selectedFunnel
        'all',        // selectedUnit
        'all',        // selectedSeller
        'all',        // selectedOrigin
        1,            // page
        10            // pageSize
      );
      
      addLog('✅ Sucesso! Dados recebidos:');
      addLog(`- Total de itens: ${result.pagination.totalItems}`);
      addLog(`- Páginas: ${result.pagination.totalPages}`);
      addLog(`- Dados na página: ${result.data.length}`);
      
      if (result.data.length > 0) {
        addLog('📊 Primeiro item:');
        addLog(`- ID: ${result.data[0].id}`);
        addLog(`- Nome: ${result.data[0].name}`);
        addLog(`- Ticket: ${result.data[0].ticket}`);
      }
      
    } catch (error) {
      addLog(`❌ Erro: ${error.message}`);
      console.error('Erro detalhado:', error);
    } finally {
      setLoading(false);
    }
  };

  const testDDDRanking = async () => {
    setLoading(true);
    setLogs([]);
    
    try {
      addLog('🚀 Testando DDD Ranking Service...');
      
      const result = await getDDDRankingData(
        '2024-01-01', // startDate
        '2024-12-31', // endDate
        'all',        // selectedFunnel
        'all',        // selectedUnit
        'all',        // selectedSeller
        'all',        // selectedOrigin
        1,            // page
        10            // pageSize
      );
      
      addLog('✅ DDD Ranking Sucesso!');
      addLog(`- Total de regiões: ${result.pagination.totalItems}`);
      addLog(`- Páginas: ${result.pagination.totalPages}`);
      addLog(`- Dados na página: ${result.data.length}`);
      
      if (result.data.length > 0) {
        addLog('📊 Primeira região:');
        addLog(`- DDD: ${result.data[0].ddd}`);
        addLog(`- Cidade: ${result.data[0].cidade}`);
        addLog(`- Estado: ${result.data[0].estado}`);
        addLog(`- Valor: ${result.data[0].totalValue}`);
        addLog(`- Oportunidades: ${result.data[0].opportunityCount}`);
      }
      
    } catch (error) {
      addLog(`❌ Erro no DDD Ranking: ${error.message}`);
      console.error('Erro detalhado DDD:', error);
    } finally {
      setLoading(false);
    }
  };

  const testWithFilters = async () => {
    setLoading(true);
    setLogs([]);
    
    try {
      addLog('🚀 Testando com filtros específicos...');
      
      const result = await getTicketRankingData(
        '2024-12-01',
        '2024-12-31',
        '1', // funil específico
        'all',
        'all',
        'all',
        1,
        10
      );
      
      addLog('✅ Sucesso com filtros!');
      addLog(`- Total: ${result.pagination.totalItems}`);
      
    } catch (error) {
      addLog(`❌ Erro com filtros: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Ticket Ranking</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testTicketRanking} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px' }}
        >
          {loading ? 'Testando...' : 'Teste Ticket Básico'}
        </button>
        
        <button 
          onClick={testDDDRanking} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px', backgroundColor: '#10b981', color: 'white' }}
        >
          {loading ? 'Testando...' : 'Teste DDD Ranking'}
        </button>
        
        <button 
          onClick={testWithFilters} 
          disabled={loading}
          style={{ padding: '10px' }}
        >
          {loading ? 'Testando...' : 'Teste com Filtros'}
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        color: '#00ff00', 
        padding: '15px', 
        borderRadius: '5px',
        height: '400px',
        overflow: 'auto',
        whiteSpace: 'pre-wrap'
      }}>
        {logs.length === 0 ? 'Clique em um botão para iniciar o teste...' : logs.join('\n')}
      </div>
    </div>
  );
};

export default DebugTicketRankingPage;
