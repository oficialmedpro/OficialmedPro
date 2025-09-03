import React, { useState } from 'react';
import { verifyFollowUpSync, verifyAllFunnelsSync } from '../service/syncVerifierService';

const SyncVerifier = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [progress, setProgress] = useState(null);
  const [verificationType, setVerificationType] = useState('followup'); // 'followup' | 'all'

  const handleVerifyFollowUp = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    setProgress(null);
    
    try {
      console.log('🔍 Iniciando verificação do Follow Up...');
      
      const result = await verifyFollowUpSync((progressData) => {
        setProgress(progressData);
      });
      
      setVerificationResult(result);
      console.log('📊 Verificação concluída:', result);
      
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
      setVerificationResult({ 
        success: false, 
        error: error.message 
      });
    } finally {
      setIsVerifying(false);
      setProgress(null);
    }
  };

  const handleVerifyAll = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    setProgress(null);
    
    try {
      console.log('🔍 Iniciando verificação completa...');
      
      const result = await verifyAllFunnelsSync((progressData) => {
        setProgress(progressData);
      });
      
      setVerificationResult(result);
      console.log('📊 Verificação completa concluída:', result);
      
    } catch (error) {
      console.error('❌ Erro na verificação completa:', error);
      setVerificationResult({ 
        success: false, 
        error: error.message 
      });
    } finally {
      setIsVerifying(false);
      setProgress(null);
    }
  };

  const formatNumber = (num) => {
    return num?.toLocaleString('pt-BR') || '0';
  };

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '2px solid #3b82f6', 
      borderRadius: '8px',
      background: 'rgba(59, 130, 246, 0.05)'
    }}>
      <h3 style={{ color: '#3b82f6', margin: '0 0 16px 0' }}>
        🔍 Verificador de Sincronização
      </h3>
      
      <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
        Compara dados entre SprintHub e Supabase para identificar inconsistências.
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button
          onClick={handleVerifyFollowUp}
          disabled={isVerifying}
          style={{
            background: isVerifying ? '#ccc' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            cursor: isVerifying ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '13px'
          }}
        >
          {isVerifying && verificationType === 'followup' ? '🔍 Verificando...' : '🔍 Verificar Follow Up'}
        </button>

        <button
          onClick={handleVerifyAll}
          disabled={isVerifying}
          style={{
            background: isVerifying ? '#ccc' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            cursor: isVerifying ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '13px'
          }}
        >
          {isVerifying && verificationType === 'all' ? '🔍 Verificando...' : '🔍 Verificar Todos'}
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '6px'
        }}>
          <div style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: '500' }}>
            {progress.stage && `📂 ${progress.stage}`}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {progress.status}
          </div>
          {progress.progress && (
            <div style={{
              marginTop: '8px',
              width: '100%',
              height: '4px',
              background: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress.progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {verificationResult && !verificationResult.error && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '6px'
        }}>
          <h4 style={{ 
            margin: '0 0 12px 0',
            color: '#059669',
            fontSize: '16px'
          }}>
            📊 Resultado da Verificação
          </h4>
          
          {/* Resultado para Follow Up */}
          {verificationResult.stageName && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                    {formatNumber(verificationResult.sprintHubCount)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>SprintHub</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>
                    {formatNumber(verificationResult.supabaseCount)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Supabase</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: verificationResult.ausentes > 0 ? '#dc2626' : '#059669' }}>
                    {formatNumber(verificationResult.ausentes)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Faltando</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                    {verificationResult.percentualSincronizado}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Sincronizado</div>
                </div>
              </div>

              {verificationResult.ausentes > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600', marginBottom: '8px' }}>
                    ❌ {verificationResult.ausentes} oportunidades faltando no Supabase
                  </div>
                  
                  {verificationResult.idsAusentes && verificationResult.idsAusentes.length > 0 && (
                    <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#fef2f2', padding: '8px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: '600', marginBottom: '6px' }}>
                        Primeiras oportunidades ausentes:
                      </div>
                      {verificationResult.idsAusentes.slice(0, 10).map((opp, index) => (
                        <div key={opp.id} style={{ fontSize: '11px', color: '#7f1d1d', marginBottom: '2px' }}>
                          {index + 1}. ID: {opp.id} | {opp.title} | {opp.whatsapp} | Status: {opp.status}
                        </div>
                      ))}
                      {verificationResult.idsAusentes.length > 10 && (
                        <div style={{ fontSize: '11px', color: '#991b1b', fontStyle: 'italic' }}>
                          ... e mais {verificationResult.idsAusentes.length - 10} oportunidades
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {verificationResult.desatualizadas > 0 && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#d97706' }}>
                  🔄 {verificationResult.desatualizadas} oportunidades desatualizadas
                </div>
              )}
            </div>
          )}

          {/* Resultado para verificação completa */}
          {verificationResult.totalSprintHub && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                    {formatNumber(verificationResult.totalSprintHub)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Total SprintHub</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>
                    {formatNumber(verificationResult.totalSupabase)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Total Supabase</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: verificationResult.totalAusentes > 0 ? '#dc2626' : '#059669' }}>
                    {formatNumber(verificationResult.totalAusentes)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Total Ausentes</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                    {verificationResult.percentualGeral}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Taxa Geral</div>
                </div>
              </div>

              {verificationResult.duration && (
                <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                  ⏱️ Concluído em {verificationResult.duration}s
                </div>
              )}

              {verificationResult.totalAusentes > 0 && (
                <div style={{ marginTop: '12px', padding: '8px', background: '#fef2f2', borderRadius: '4px' }}>
                  <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600' }}>
                    ⚠️ Encontradas inconsistências! Execute a sincronização para corrigir.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {verificationResult?.error && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px'
        }}>
          <h4 style={{ 
            margin: '0 0 8px 0',
            color: '#dc2626',
            fontSize: '16px'
          }}>
            ❌ Erro na Verificação
          </h4>
          <p style={{ margin: '0', fontSize: '13px', color: '#7f1d1d' }}>
            {verificationResult.error}
          </p>
        </div>
      )}

      <div style={{ 
        marginTop: '16px', 
        fontSize: '11px', 
        color: '#6b7280',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '12px'
      }}>
        <strong>Verificação Follow Up:</strong> Compara etapa Follow Up (ID 85) entre SprintHub e Supabase<br />
        <strong>Verificação Completa:</strong> Analisa todos os funis e etapas (pode demorar alguns minutos)
      </div>
    </div>
  );
};

export default SyncVerifier;