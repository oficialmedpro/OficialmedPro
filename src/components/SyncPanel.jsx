import React, { useState } from 'react';
import { syncFollowUpStage, checkFollowUpSync } from '../service/sprintHubSyncService.js';
import './SyncPanel.css';

const SyncPanel = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  const handleCheckSync = async () => {
    setIsChecking(true);
    setCheckResult(null);
    
    try {
      console.log('🔍 Verificando sincronização do Follow Up...');
      const result = await checkFollowUpSync();
      setCheckResult(result);
      
      console.log('📊 Resultado da verificação:', result);
      
    } catch (error) {
      console.error('❌ Erro ao verificar sincronização:', error);
      setCheckResult({ 
        error: error.message,
        stageName: 'FOLLOW UP' 
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSyncFollowUp = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      console.log('🔄 Iniciando sincronização do Follow Up...');
      const result = await syncFollowUpStage();
      setSyncResult(result);
      
      console.log('✅ Resultado da sincronização:', result);
      
      // Se sincronizou com sucesso, verificar novamente
      if (result.success && result.inserted > 0) {
        setTimeout(() => {
          handleCheckSync();
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ Erro ao sincronizar:', error);
      setSyncResult({ 
        success: false,
        error: error.message 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="sync-panel">
      <div className="sync-header">
        <h3>🔄 Painel de Sincronização SprintHub</h3>
        <p>Sincronize dados em tempo real quando necessário</p>
      </div>

      <div className="sync-actions">
        <button 
          className="sync-btn check-btn"
          onClick={handleCheckSync}
          disabled={isChecking || isSyncing}
        >
          {isChecking ? (
            <>
              <span className="spinner"></span>
              Verificando...
            </>
          ) : (
            <>
              🔍 Verificar Follow Up
            </>
          )}
        </button>

        <button 
          className="sync-btn sync-btn-primary"
          onClick={handleSyncFollowUp}
          disabled={isChecking || isSyncing}
        >
          {isSyncing ? (
            <>
              <span className="spinner"></span>
              Sincronizando...
            </>
          ) : (
            <>
              🔄 Sincronizar Follow Up
            </>
          )}
        </button>
      </div>

      {/* Resultado da Verificação */}
      {checkResult && (
        <div className="sync-result">
          <h4>📊 Status da Sincronização</h4>
          {checkResult.error ? (
            <div className="result-error">
              <span>❌ Erro: {checkResult.error}</span>
            </div>
          ) : (
            <div className="result-success">
              <div className="result-stats">
                <div className="stat">
                  <span className="stat-label">SprintHub:</span>
                  <span className="stat-value">{checkResult.sprintHubTotal}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Supabase:</span>
                  <span className="stat-value">{checkResult.supabaseTotal}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Faltando:</span>
                  <span className={`stat-value ${checkResult.missing > 0 ? 'missing' : 'ok'}`}>
                    {checkResult.missing}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Sincronização:</span>
                  <span className={`stat-value ${parseFloat(checkResult.syncPercentage) < 100 ? 'incomplete' : 'complete'}`}>
                    {checkResult.syncPercentage}%
                  </span>
                </div>
              </div>
              
              {checkResult.missing > 0 && (
                <div className="missing-alert">
                  <span>⚠️ {checkResult.missing} oportunidades faltando no Supabase</span>
                  <small>Execute a sincronização para corrigir</small>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resultado da Sincronização */}
      {syncResult && (
        <div className="sync-result">
          <h4>🔄 Resultado da Sincronização</h4>
          {syncResult.error ? (
            <div className="result-error">
              <span>❌ Erro: {syncResult.error}</span>
            </div>
          ) : (
            <div className="result-success">
              <div className="result-stats">
                <div className="stat">
                  <span className="stat-label">Processadas:</span>
                  <span className="stat-value">{syncResult.processed}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Inseridas:</span>
                  <span className="stat-value success">{syncResult.inserted}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Atualizadas:</span>
                  <span className="stat-value info">{syncResult.updated}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Erros:</span>
                  <span className={`stat-value ${syncResult.errors > 0 ? 'error' : 'ok'}`}>
                    {syncResult.errors}
                  </span>
                </div>
              </div>
              
              {syncResult.inserted > 0 && (
                <div className="success-message">
                  ✅ {syncResult.inserted} novas oportunidades sincronizadas com sucesso!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="sync-info">
        <h4>ℹ️ Informações</h4>
        <ul>
          <li><strong>Verificar:</strong> Compara dados entre SprintHub e Supabase</li>
          <li><strong>Sincronizar:</strong> Busca e insere/atualiza oportunidades faltantes</li>
          <li><strong>Follow Up (ID 85):</strong> Etapa que geralmente tem mais inconsistências</li>
          <li><strong>Automático:</strong> Sincronização roda a cada 2h na VPS (6h-22h)</li>
        </ul>
      </div>
    </div>
  );
};

export default SyncPanel;