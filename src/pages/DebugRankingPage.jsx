import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTicketRankingData, getTicketRankingFilterNames } from '../service/ticketRankingService';
import './DebugRankingPage.css';
import { supabaseUrl, supabaseAnonKey, supabaseSchema } from '../config/supabase.js';

/**
 * 🎯 DEBUG RANKING PAGE
 *
 * Página dedicada para debugar o serviço de ticket ranking
 * com interface limpa e logs detalhados
 */
const DebugRankingPage = () => {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);

  // Função para adicionar log na interface
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const logEntry = {
      id: Date.now() + Math.random(), // Garante ID único
      timestamp,
      message,
      type // 'info', 'success', 'error', 'debug'
    };
    setLogs(prev => [...prev, logEntry]);

    // Também logar no console
    switch (type) {
      case 'error':
        console.error(`[${timestamp}] ${message}`);
        break;
      case 'success':
        console.log(`[${timestamp}] ✅ ${message}`);
        break;
      case 'debug':
        console.log(`[${timestamp}] 🔍 ${message}`);
        break;
      default:
        console.log(`[${timestamp}] ${message}`);
    }
  };

  // Limpar logs
  const clearLogs = () => {
    setLogs([]);
    setResults([]);
    console.clear();
  };

  // Função principal de debug
  const runDebugTests = async () => {
    if (isRunning) return;

    setIsRunning(true);
    clearLogs();

    try {
      addLog('🎯 INICIANDO DEBUG DO TICKET RANKING SERVICE', 'info');
      addLog('='.repeat(80), 'debug');

      // Parâmetros de teste
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const month = new Date(today);
      month.setDate(month.getDate() - 30);

      const startDate = lastWeek.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      const monthStart = month.toISOString().split('T')[0];

      addLog(`📅 Período teste 1 e 2: ${startDate} a ${endDate}`, 'debug');
      addLog(`📅 Período teste 3: ${monthStart} a ${endDate}`, 'debug');

      // TESTE 1: Busca básica sem filtros
      addLog('\n🔍 TESTE 1: Busca básica (sem filtros)', 'info');
      addLog('Parâmetros: últimos 7 dias, todos os filtros = "all"', 'debug');

      const result1 = await getTicketRankingData(startDate, endDate, 'all', 'all', 'all', 'all', 1, 5);

      addLog(`✅ Teste 1 concluído: ${result1.pagination.totalItems} oportunidades encontradas`, 'success');
      addLog(`📊 Páginas: ${result1.pagination.currentPage}/${result1.pagination.totalPages}`, 'debug');
      addLog(`📝 Amostra: ${result1.data.length} itens retornados`, 'debug');

      // TESTE 2: Com filtros específicos
      addLog('\n🔍 TESTE 2: Com filtros específicos', 'info');
      addLog('Parâmetros: funil=6, unidade=[1], outros="all"', 'debug');

      const result2 = await getTicketRankingData(startDate, endDate, '6', '[1]', 'all', 'all', 1, 5);

      addLog(`✅ Teste 2 concluído: ${result2.pagination.totalItems} oportunidades encontradas`, 'success');
      addLog(`📊 Páginas: ${result2.pagination.currentPage}/${result2.pagination.totalPages}`, 'debug');
      addLog(`📝 Amostra: ${result2.data.length} itens retornados`, 'debug');

      // TESTE 3: Período mais amplo
      addLog('\n🔍 TESTE 3: Período mais amplo (30 dias)', 'info');
      addLog('Parâmetros: últimos 30 dias, todos os filtros = "all"', 'debug');

      const result3 = await getTicketRankingData(monthStart, endDate, 'all', 'all', 'all', 'all', 1, 10);

      addLog(`✅ Teste 3 concluído: ${result3.pagination.totalItems} oportunidades encontradas`, 'success');
      addLog(`📊 Páginas: ${result3.pagination.currentPage}/${result3.pagination.totalPages}`, 'debug');
      addLog(`📝 Amostra: ${result3.data.length} itens retornados`, 'debug');

      // TESTE 4: Verificar se há oportunidades na tabela (sem filtros de status)
      addLog('\n🔍 TESTE 4: Verificar dados básicos na tabela', 'info');
      try {
        // Buscar qualquer oportunidade (sem filtro de status)
        const basicUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,status,gain_date,value&archived=eq.0&limit=10`;

        const response = await fetch(basicUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey,
            'Accept-Profile': supabaseSchema,
          }
        });

        if (response.ok) {
          const allOpps = await response.json();
          addLog(`✅ Total de oportunidades na tabela: ${allOpps.length}`, 'success');

          if (allOpps.length > 0) {
            const statusCount = {};
            const gainDateCount = { with: 0, without: 0 };

            allOpps.forEach(opp => {
              // Contar status
              const status = opp.status || 'null';
              statusCount[status] = (statusCount[status] || 0) + 1;

              // Contar gain_date
              if (opp.gain_date) {
                gainDateCount.with++;
              } else {
                gainDateCount.without++;
              }
            });

            addLog(`📊 Status encontrados: ${JSON.stringify(statusCount)}`, 'debug');
            addLog(`📅 Gain_date: ${gainDateCount.with} com data, ${gainDateCount.without} sem data`, 'debug');
            addLog(`🔍 Amostra dos dados:`, 'debug');
            addLog(JSON.stringify(allOpps.slice(0, 3), null, 2), 'debug');
          }
        } else {
          addLog(`❌ Erro ao buscar dados básicos: ${response.status}`, 'error');
        }
      } catch (error) {
        addLog(`❌ Erro no teste básico: ${error.message}`, 'error');
      }

      // TESTE 5: Buscar nomes dos filtros
      addLog('\n🔍 TESTE 5: Nomes dos filtros', 'info');
      const filterNames = await getTicketRankingFilterNames('6', '[1]', '1', '1');
      addLog(`✅ Nomes dos filtros: ${JSON.stringify(filterNames)}`, 'success');

      // Consolidar resultados
      const testResults = [
        {
          test: 'Teste 1 - Sem filtros (7 dias)',
          totalItems: result1.pagination.totalItems,
          sampleSize: result1.data.length,
          sample: result1.data.slice(0, 2)
        },
        {
          test: 'Teste 2 - Com filtros (7 dias)',
          totalItems: result2.pagination.totalItems,
          sampleSize: result2.data.length,
          sample: result2.data.slice(0, 2)
        },
        {
          test: 'Teste 3 - Sem filtros (30 dias)',
          totalItems: result3.pagination.totalItems,
          sampleSize: result3.data.length,
          sample: result3.data.slice(0, 2)
        },
        {
          test: 'Teste 4 - Nomes dos filtros',
          filterNames: filterNames
        }
      ];

      setResults(testResults);

      addLog('='.repeat(80), 'debug');
      addLog('✅ DEBUG DO TICKET RANKING CONCLUÍDO', 'success');
      addLog(`📊 RESUMO: T1=${result1.pagination.totalItems} | T2=${result2.pagination.totalItems} | T3=${result3.pagination.totalItems}`, 'info');

    } catch (error) {
      addLog(`❌ Erro no debug: ${error.message}`, 'error');
      console.error('❌ Erro completo:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="debug-ranking-page">
      <div className="debug-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Voltar ao Dashboard
        </button>
        <h1>🎯 Debug Ticket Ranking Service</h1>
        <p>Página dedicada para testar e debugar o serviço de ranking de tickets</p>
      </div>

      <div className="debug-controls">
        <button
          className={`debug-btn ${isRunning ? 'running' : ''}`}
          onClick={runDebugTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <span className="spinner"></span>
              Executando testes...
            </>
          ) : (
            '🚀 Executar Testes de Debug'
          )}
        </button>

        <button className="clear-btn" onClick={clearLogs} disabled={isRunning}>
          🗑️ Limpar Logs
        </button>
      </div>

      <div className="debug-content">
        {/* Seção de Logs */}
        <div className="debug-section">
          <h2>📝 Logs de Execução</h2>
          <div className="logs-container">
            {logs.length === 0 ? (
              <div className="no-logs">Nenhum log disponível. Clique em "Executar Testes" para começar.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className={`log-entry log-${log.type}`}>
                  <span className="log-timestamp">[{log.timestamp}]</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Seção de Resultados */}
        {results.length > 0 && (
          <div className="debug-section">
            <h2>📊 Resultados dos Testes</h2>
            <div className="results-container">
              {results.map((result, index) => (
                <div key={index} className="result-card">
                  <h3>{result.test}</h3>
                  {result.totalItems !== undefined ? (
                    <>
                      <div className="result-stats">
                        <span className="stat">
                          <strong>Total encontrado:</strong> {result.totalItems} oportunidades
                        </span>
                        <span className="stat">
                          <strong>Amostra retornada:</strong> {result.sampleSize} itens
                        </span>
                      </div>
                      {result.sample && result.sample.length > 0 && (
                        <div className="sample-data">
                          <h4>🔍 Amostra dos dados:</h4>
                          <pre>{JSON.stringify(result.sample, null, 2)}</pre>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="filter-names">
                      <h4>🏷️ Nomes dos filtros:</h4>
                      <pre>{JSON.stringify(result.filterNames, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugRankingPage;