import React, { useState, useEffect } from 'react';
import { getSellerRankingData, getSellerRankingFilterNames } from '../service/sellerRankingService';
import { supabaseUrl, supabaseServiceKey } from '../config/supabase.js';

const DebugSellerRankingPage = ({ onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    selectedFunnel: 'all',
    selectedUnit: 'all',
    selectedSeller: 'all',
    selectedOrigin: 'all',
    rankingType: 'valor'
  });

  // Função para adicionar log
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Função para testar campos da tabela
  const testTableFields = async () => {
    try {
      // Testar se lost_date existe
      const testUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,status,lost_date&status=eq.lost&limit=1`;
      
      addLog('🔍 Testando campo lost_date...', 'info');
      addLog(`URL de teste: ${testUrl}`, 'info');
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      });
      
      addLog(`Status da resposta: ${response.status}`, response.ok ? 'success' : 'error');
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`Erro: ${errorText}`, 'error');
      } else {
        const data = await response.json();
        addLog(`Dados retornados: ${JSON.stringify(data)}`, 'success');
      }
      
    } catch (error) {
      addLog(`Erro ao testar campos: ${error.message}`, 'error');
    }
  };

  // Função para testar oportunidades abertas
  const testOpenFields = async () => {
    try {
      // Testar se status=open funciona
      const testUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,status,user_id&status=eq.open&limit=1`;
      
      addLog('🔍 Testando status=open...', 'info');
      addLog(`URL de teste: ${testUrl}`, 'info');
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      });
      
      addLog(`Status da resposta: ${response.status}`, response.ok ? 'success' : 'error');
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`Erro: ${errorText}`, 'error');
      } else {
        const data = await response.json();
        addLog(`Dados retornados: ${JSON.stringify(data)}`, 'success');
      }
      
    } catch (error) {
      addLog(`Erro ao testar oportunidades abertas: ${error.message}`, 'error');
    }
  };

  // Função para testar o serviço
  const testService = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setLogs([]);

    addLog('🚀 Iniciando teste do SellerRankingService...', 'info');

    try {
      addLog('📅 Parâmetros de teste:', 'info');
      addLog(`  - startDate: ${filters.startDate}`, 'info');
      addLog(`  - endDate: ${filters.endDate}`, 'info');
      addLog(`  - selectedFunnel: ${filters.selectedFunnel}`, 'info');
      addLog(`  - selectedUnit: ${filters.selectedUnit}`, 'info');
      addLog(`  - selectedSeller: ${filters.selectedSeller}`, 'info');
      addLog(`  - selectedOrigin: ${filters.selectedOrigin}`, 'info');

      addLog('🔍 Chamando getSellerRankingData...', 'info');
      addLog(`📊 Tipo de ranking: ${filters.rankingType}`, 'info');
      
      // Teste específico para verificar campos da tabela
      if (filters.rankingType === 'perdidas') {
        addLog('🔍 Testando campos da tabela para oportunidades perdidas...', 'info');
        await testTableFields();
      }
      
      if (filters.rankingType === 'abertas') {
        addLog('🔍 Testando campos da tabela para oportunidades abertas...', 'info');
        await testOpenFields();
      }
      
      const result = await getSellerRankingData(
        filters.startDate,
        filters.endDate,
        filters.selectedFunnel,
        filters.selectedUnit,
        filters.selectedSeller,
        filters.selectedOrigin,
        1, // page
        6, // pageSize
        filters.rankingType
      );

      addLog('✅ Dados recebidos com sucesso!', 'success');
      addLog(`📊 Total de vendedores: ${result.pagination.totalItems}`, 'success');
      addLog(`📄 Página atual: ${result.pagination.currentPage}/${result.pagination.totalPages}`, 'success');
      addLog(`📋 Vendedores na página: ${result.data.length}`, 'success');

      // Log detalhado de cada vendedor
      result.data.forEach((seller, index) => {
        addLog(`\n🏆 Vendedor ${index + 1}:`, 'info');
        addLog(`  - ID: ${seller.userId}`, 'info');
        addLog(`  - Nome: ${seller.name}`, 'info');
        addLog(`  - Oportunidades: ${seller.opportunityCount}`, 'info');
        addLog(`  - Valor Total: R$ ${seller.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'info');
        addLog(`  - Ticket Médio: R$ ${(seller.totalValue / seller.opportunityCount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'info');
        addLog(`  - Ranking: ${seller.rank}º`, 'info');
        addLog(`  - Progresso: ${seller.progress}%`, 'info');
      });

      setData(result);

      // Testar também os nomes dos filtros
      addLog('\n🔍 Testando getSellerRankingFilterNames...', 'info');
      const filterNames = await getSellerRankingFilterNames(
        filters.selectedFunnel,
        filters.selectedUnit,
        filters.selectedSeller,
        filters.selectedOrigin
      );
      
      addLog('📋 Nomes dos filtros:', 'info');
      addLog(`  - Funil: ${filterNames.funnelName || 'N/A'}`, 'info');
      addLog(`  - Unidade: ${filterNames.unitName || 'N/A'}`, 'info');
      addLog(`  - Vendedor: ${filterNames.sellerName || 'N/A'}`, 'info');
      addLog(`  - Origem: ${filterNames.originName || 'N/A'}`, 'info');

    } catch (err) {
      addLog(`❌ Erro: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Função para copiar logs
  const copyLogs = () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.message}`).join('\n');
    navigator.clipboard.writeText(logText);
    addLog('📋 Logs copiados para a área de transferência!', 'success');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)', 
      color: 'var(--text-primary)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid var(--border-color)'
        }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>
              🏆 DEBUG SELLER RANKING
            </h1>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)' }}>
              Página de debug para testar o serviço de ranking de vendedores
            </p>
          </div>
          <button 
            onClick={onLogout}
            style={{
              background: 'var(--accent-red)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Sair
          </button>
        </div>

        {/* Controles */}
        <div style={{ 
          background: 'var(--bg-secondary)', 
          padding: '20px', 
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>🔧 Controles de Teste</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Data Inicial:</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Data Final:</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Funil:</label>
              <select
                value={filters.selectedFunnel}
                onChange={(e) => setFilters(prev => ({ ...prev, selectedFunnel: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="all">Todos</option>
                <option value="1">Funil 1</option>
                <option value="2">Funil 2</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Vendedor:</label>
              <input
                type="text"
                value={filters.selectedSeller}
                onChange={(e) => setFilters(prev => ({ ...prev, selectedSeller: e.target.value }))}
                placeholder="ID do vendedor ou 'all'"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            
          </div>

          {/* Abas de teste */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              background: 'var(--bg-secondary)', 
              borderRadius: '8px', 
              padding: '4px',
              gap: '4px',
              border: '1px solid var(--border-color)',
              marginBottom: '8px'
            }}>
            {[
              { value: 'valor', label: 'Por Valor' },
              { value: 'ticket', label: 'Por Ticket Médio' },
              { value: 'abertas', label: 'Oportunidades Abertas' },
              { value: 'perdidas', label: 'Oportunidades Perdidas' }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilters(prev => ({ ...prev, rankingType: tab.value }))}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  background: filters.rankingType === tab.value ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                  color: filters.rankingType === tab.value ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: filters.rankingType === tab.value ? '600' : '500',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
            </div>
            
            {/* Indicador de status */}
            <div style={{ 
              padding: '8px 12px', 
              background: 'var(--bg-tertiary)', 
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              🎯 Testando: <strong>{filters.rankingType === 'valor' ? 'Por Valor' : 
                                   filters.rankingType === 'ticket' ? 'Por Ticket Médio' :
                                   filters.rankingType === 'abertas' ? 'Oportunidades Abertas' : 
                                   'Oportunidades Perdidas'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={testService}
              disabled={loading}
              style={{
                background: loading ? 'var(--text-muted)' : 'var(--accent-blue)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {loading ? '🔄 Testando...' : '🚀 Executar Teste'}
            </button>
            
            <button
              onClick={clearLogs}
              style={{
                background: 'var(--text-muted)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🗑️ Limpar Logs
            </button>
            
            <button
              onClick={copyLogs}
              disabled={logs.length === 0}
              style={{
                background: logs.length === 0 ? 'var(--text-muted)' : 'var(--accent-green)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              📋 Copiar Logs
            </button>
          </div>
        </div>

        {/* Resultados */}
        {data && (
          <div style={{ 
            background: 'var(--bg-secondary)', 
            padding: '20px', 
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>📊 Resultados</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                  {data.pagination.totalItems}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Total de Vendedores</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                  {data.pagination.totalPages}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Total de Páginas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-orange)' }}>
                  {data.data.length}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Vendedores na Página</div>
              </div>
            </div>
          </div>
        )}

        {/* Logs */}
        <div style={{ 
          background: 'var(--bg-secondary)', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>📝 Logs de Debug</h3>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {logs.length} entradas
            </span>
          </div>
          
          <div style={{ 
            background: '#1a1a1a', 
            padding: '15px', 
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '13px',
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid #333'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Nenhum log ainda. Execute um teste para ver os logs aqui.
              </div>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  style={{ 
                    marginBottom: '5px',
                    color: log.type === 'error' ? '#ff6b6b' : 
                           log.type === 'success' ? '#51cf66' : 
                           'var(--text-primary)'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugSellerRankingPage;
