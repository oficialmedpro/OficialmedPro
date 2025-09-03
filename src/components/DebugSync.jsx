import React, { useState } from 'react';
import { debugMissingOpportunities } from '../service/debugSyncService';

const DebugSync = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleDebug = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      console.log('🔍 Iniciando debug das oportunidades faltantes...');
      const debugResult = await debugMissingOpportunities();
      setResult(debugResult);
      console.log('📊 Debug concluído:', debugResult);
    } catch (error) {
      console.error('❌ Erro no debug:', error);
      setResult({ success: false, error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '2px solid #e53e3e', 
      borderRadius: '8px',
      background: 'rgba(229, 62, 62, 0.05)'
    }}>
      <h3 style={{ color: '#e53e3e', margin: '0 0 16px 0' }}>
        🔍 Debug - Oportunidades Faltantes
      </h3>
      
      <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
        Busca as 7 oportunidades perdidas que não estão no Supabase e tenta sincronizar.
      </p>
      
      <button
        onClick={handleDebug}
        disabled={isRunning}
        style={{
          background: isRunning ? '#ccc' : 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '6px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontWeight: '600'
        }}
      >
        {isRunning ? '🔍 Executando Debug...' : '🔍 Executar Debug'}
      </button>

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`,
          borderRadius: '6px'
        }}>
          <h4 style={{ 
            margin: '0 0 12px 0',
            color: result.success ? '#10b981' : '#ef4444'
          }}>
            📊 Resultado do Debug
          </h4>
          
          {result.success ? (
            <div>
              <p><strong>Total no SprintHub:</strong> {result.total}</p>
              <p><strong>Encontradas:</strong> {result.found}/7</p>
              <p><strong>Inseridas:</strong> {result.inserted}</p>
              <p><strong>Erros:</strong> {result.errors}</p>
              
              {result.opportunities && result.opportunities.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <strong>Oportunidades encontradas:</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    {result.opportunities.map(opp => (
                      <li key={opp.id} style={{ marginBottom: '4px', fontSize: '13px' }}>
                        ID: {opp.id} | {opp.whatsapp} | Status: {opp.status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p style={{ color: '#ef4444' }}>
                <strong>Erro:</strong> {result.error}
              </p>
              {result.total && (
                <p><strong>Total no SprintHub:</strong> {result.total}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ 
        marginTop: '16px', 
        fontSize: '12px', 
        color: '#666',
        borderTop: '1px solid #ddd',
        paddingTop: '12px'
      }}>
        <strong>Números procurados:</strong><br />
        554791853028, 555180570501, 554699789739, 554391033346,<br />
        554384118360, 554396087910, 5511968959293
      </div>
    </div>
  );
};

export default DebugSync;