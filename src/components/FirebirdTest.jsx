import React, { useState, useEffect } from 'react';
import { firebirdService } from '../service/firebirdService';

const FirebirdTest = () => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableStructure, setTableStructure] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Testar conexão ao carregar componente
  useEffect(() => {
    testConnection();
    loadTables();
  }, []);

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await firebirdService.testConnection();
      setConnectionStatus(result);

      if (result.success) {
        console.log('✅ Conexão estabelecida:', result.data);
      } else {
        console.error('❌ Falha na conexão:', result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error('❌ Erro ao testar conexão:', err);
      setError(err.message);
      setConnectionStatus({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await firebirdService.getTables();
      setTables(result.data || []);
      console.log(`📋 ${result.count} tabelas carregadas`);

    } catch (err) {
      console.error('❌ Erro ao carregar tabelas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTableStructure = async (tableName) => {
    try {
      setLoading(true);
      setError(null);

      const result = await firebirdService.getTableStructure(tableName);
      setTableStructure(result.data);
      console.log(`📋 Estrutura da tabela ${tableName}:`, result.data);

    } catch (err) {
      console.error('❌ Erro ao carregar estrutura:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName, limit = 10) => {
    try {
      setLoading(true);
      setError(null);

      const result = await firebirdService.getTableData(tableName, {
        limit,
        orderBy: ''
      });

      setTableData(result.data || []);
      console.log(`🔍 ${result.count} registros carregados da tabela ${tableName}`);

    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);
    setTableStructure(null);
    setTableData([]);

    if (tableName) {
      loadTableStructure(tableName);
      loadTableData(tableName);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔥 Teste de Conexão Firebird</h1>

      {/* Status de Conexão */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: connectionStatus?.success ? '#d4edda' : '#f8d7da'
      }}>
        <h3>Status da Conexão</h3>
        {connectionStatus ? (
          <div>
            <p><strong>Status:</strong> {connectionStatus.success ? '✅ Conectado' : '❌ Falha'}</p>
            <p><strong>Mensagem:</strong> {connectionStatus.message || connectionStatus.error}</p>
            {connectionStatus.data && (
              <div>
                <p><strong>Servidor:</strong> {connectionStatus.data.config?.host}:{connectionStatus.data.config?.port}</p>
                <p><strong>Banco:</strong> {connectionStatus.data.config?.database}</p>
                <p><strong>Usuário:</strong> {connectionStatus.data.config?.user}</p>
                <p><strong>Charset:</strong> {connectionStatus.data.config?.charset}</p>
                <p><strong>Hora do Servidor:</strong> {connectionStatus.data.serverTime}</p>
              </div>
            )}
          </div>
        ) : (
          <p>Testando conexão...</p>
        )}
        <button
          onClick={testConnection}
          disabled={loading}
          style={{ marginTop: '10px', padding: '8px 16px' }}
        >
          {loading ? 'Testando...' : 'Testar Novamente'}
        </button>
      </div>

      {/* Lista de Tabelas */}
      <div style={{ marginBottom: '20px' }}>
        <h3>📋 Tabelas Disponíveis ({tables.length})</h3>
        <select
          value={selectedTable}
          onChange={(e) => handleTableSelect(e.target.value)}
          style={{ padding: '8px', width: '300px' }}
        >
          <option value="">Selecione uma tabela...</option>
          {tables.map(table => (
            <option key={table.name} value={table.name}>
              {table.name}
            </option>
          ))}
        </select>
        <button
          onClick={loadTables}
          disabled={loading}
          style={{ marginLeft: '10px', padding: '8px 16px' }}
        >
          {loading ? 'Carregando...' : 'Recarregar'}
        </button>
      </div>

      {/* Estrutura da Tabela */}
      {tableStructure && (
        <div style={{ marginBottom: '20px' }}>
          <h3>🏗️ Estrutura da Tabela: {tableStructure.tableName}</h3>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Campo</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Tipo</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Tamanho</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Not Null</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Posição</th>
              </tr>
            </thead>
            <tbody>
              {tableStructure.fields.map(field => (
                <tr key={field.name}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{field.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{field.type}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{field.length || '-'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{field.notNull ? 'Sim' : 'Não'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{field.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dados da Tabela */}
      {tableData.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📊 Dados da Tabela: {selectedTable} (Primeiros 10 registros)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  {Object.keys(tableData[0] || {}).map(column => (
                    <th key={column} style={{ border: '1px solid #ddd', padding: '6px' }}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i} style={{ border: '1px solid #ddd', padding: '6px' }}>
                        {value !== null ? String(value) : 'NULL'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => loadTableData(selectedTable, 50)}
            disabled={loading}
            style={{ marginTop: '10px', padding: '8px 16px' }}
          >
            {loading ? 'Carregando...' : 'Carregar mais dados (50)'}
          </button>
        </div>
      )}

      {/* Erros */}
      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          color: '#721c24'
        }}>
          <h4>❌ Erro:</h4>
          <p>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px'
        }}>
          🔄 Carregando...
        </div>
      )}
    </div>
  );
};

export default FirebirdTest;