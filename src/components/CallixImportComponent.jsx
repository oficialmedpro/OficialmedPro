import React, { useState, useEffect } from 'react';
import './CallixImportComponent.css';
import { getSegmentos, importAndEnrichSegment, enrichExistingLeads, sendLeadsToCallix, checkCallixStatus } from '../service/callixService';
import LeadsTable from './LeadsTable';

const CallixImportComponent = () => {
  const [segmentos, setSegmentos] = useState([]);
  const [selectedSegmento, setSelectedSegmento] = useState('');
  const [campaignId, setCampaignId] = useState(22); // ID da lista Callix
  const [forceResend, setForceResend] = useState(false); // Forçar reenvio
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [step, setStep] = useState('select'); // select, importing, sending, checking, completed
  const [showLeadsTable, setShowLeadsTable] = useState(false);
  const [selectedSegmentoForTable, setSelectedSegmentoForTable] = useState(null);

  useEffect(() => {
    loadSegmentos();
  }, []);

  const loadSegmentos = async () => {
    try {
      setLoading(true);
      addLog('🔍 Carregando segmentos...');
      const data = await getSegmentos();
      setSegmentos(data);
      addLog(`✅ ${data.length} segmentos carregados`);
    } catch (error) {
      addLog(`❌ Erro ao carregar segmentos: ${error.message}`);
      console.error('Erro ao carregar segmentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
    setStats(null);
    setStep('select');
  };

  const handleViewLeads = () => {
    if (!selectedSegmento) {
      addLog('❌ Selecione um segmento primeiro');
      return;
    }

    const segmento = segmentos.find(s => s.id.toString() === selectedSegmento);
    if (segmento) {
      setSelectedSegmentoForTable({
        id: segmento.id,
        nome: segmento.name
      });
      setShowLeadsTable(true);
      addLog(`🔍 Visualizando leads do segmento: ${segmento.name}`);
    }
  };

  const handleCloseLeadsTable = () => {
    setShowLeadsTable(false);
    setSelectedSegmentoForTable(null);
  };

  const handleSegmentoChange = (e) => {
    setSelectedSegmento(e.target.value);
    clearLogs();
  };

  const handleImportLeads = async () => {
    if (!selectedSegmento) {
      addLog('❌ Selecione um segmento primeiro');
      return;
    }

    try {
      setLoading(true);
      setStep('importing');
      clearLogs();
      
      const segmento = segmentos.find(s => s.id === parseInt(selectedSegmento));
      addLog(`🚀 Iniciando importação do segmento: ${segmento.name}`);
      
      const result = await importAndEnrichSegment(selectedSegmento, addLog);
      
      if (result.success) {
        setStats(result.stats);
        addLog(`✅ Importação concluída! ${result.stats.inserted} inseridos, ${result.stats.updated} atualizados`);
        setStep('completed');
      } else {
        addLog(`❌ Erro na importação: ${result.error}`);
        setStep('select');
      }
    } catch (error) {
      addLog(`❌ Erro geral: ${error.message}`);
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToCallix = async () => {
    if (!selectedSegmento) {
      addLog('❌ Selecione um segmento primeiro');
      return;
    }

    try {
      setLoading(true);
      setStep('sending');
      
      const segmento = segmentos.find(s => s.id === parseInt(selectedSegmento));
      addLog(`📤 Enviando leads do segmento "${segmento.name}" para Callix...`);
      
      const result = await sendLeadsToCallix(selectedSegmento, campaignId, addLog, forceResend);
      
      if (result.success) {
        const stats = result.stats;
        addLog(`✅ Envio concluído! ${stats.sent} leads enviados`);
        if (stats.alreadySent > 0) {
          addLog(`ℹ️ ${stats.alreadySent} leads já estavam enviados`);
        }
        setStep('completed');
        setStats(stats);
      } else {
        addLog(`❌ Erro no envio: ${result.error}`);
        setStep('completed');
      }
    } catch (error) {
      addLog(`❌ Erro geral: ${error.message}`);
      setStep('completed');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrichLeads = async () => {
    if (!selectedSegmento) {
      addLog('❌ Selecione um segmento primeiro');
      return;
    }

    try {
      setLoading(true);
      setStep('importing');
      clearLogs();
      
      const segmento = segmentos.find(s => s.id === parseInt(selectedSegmento));
      addLog(`🔄 Enriquecendo leads do segmento: ${segmento.name}`);
      
      const result = await enrichExistingLeads(selectedSegmento, addLog);
      
      if (result.success) {
        setStats(result.stats);
        addLog(`✅ Enriquecimento concluído! ${result.stats.updated} leads enriquecidos`);
        setStep('completed');
      } else {
        addLog(`❌ Erro no enriquecimento: ${result.error}`);
        setStep('select');
      }
    } catch (error) {
      addLog(`❌ Erro geral: ${error.message}`);
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!selectedSegmento) {
      addLog('❌ Selecione um segmento primeiro');
      return;
    }

    try {
      setLoading(true);
      setStep('checking');
      
      const segmento = segmentos.find(s => s.id === parseInt(selectedSegmento));
      addLog(`🔍 Verificando status dos leads do segmento "${segmento.name}" no Callix...`);
      
      const result = await checkCallixStatus(selectedSegmento, addLog);
      
      if (result.success) {
        addLog(`✅ Status verificado com sucesso!`);
        setStep('completed');
      } else {
        addLog(`❌ Erro na verificação: ${result.error}`);
        setStep('completed');
      }
    } catch (error) {
      addLog(`❌ Erro geral: ${error.message}`);
      setStep('completed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProcess = () => {
    setStep('select');
    clearLogs();
  };

  const renderStepContent = () => {
    switch (step) {
      case 'select':
        return (
          <div className="callix-step-content">
            <div className="callix-form-group">
              <label htmlFor="segmento-select" className="callix-label">
                📋 Selecionar Segmento
              </label>
              <select
                id="segmento-select"
                value={selectedSegmento}
                onChange={handleSegmentoChange}
                className="callix-select"
                disabled={loading}
              >
                <option value="">Selecione um segmento...</option>
                {segmentos.map(segmento => (
                  <option key={segmento.id} value={segmento.id}>
                    {segmento.name} ({segmento.total_leads || 0} leads)
                  </option>
                ))}
              </select>
            </div>

            <div className="callix-form-group">
              <label htmlFor="campaign-id" className="callix-label">
                🎯 ID da Lista Callix
              </label>
              <input
                id="campaign-id"
                type="number"
                value={campaignId}
                onChange={(e) => setCampaignId(parseInt(e.target.value) || 22)}
                className="callix-input"
                placeholder="Ex: 22"
                min="1"
                disabled={loading}
              />
              <small className="callix-help-text">
                ID da lista de campanha no Callix onde os leads serão enviados
              </small>
            </div>

            <div className="callix-form-group">
              <label className="callix-checkbox-label">
                <input
                  type="checkbox"
                  checked={forceResend}
                  onChange={(e) => setForceResend(e.target.checked)}
                  disabled={loading}
                />
                <span className="callix-checkbox-text">
                  🔄 Forçar reenvio (enviar mesmo leads já enviados anteriormente)
                </span>
              </label>
            </div>

            {selectedSegmento && (
              <div className="callix-segment-info">
                {(() => {
                  const segmento = segmentos.find(s => s.id === parseInt(selectedSegmento));
                  return segmento ? (
                    <div className="callix-segment-details">
                      <h4>📊 Informações do Segmento</h4>
                      <p><strong>Nome:</strong> {segmento.name}</p>
                      <p><strong>Total de Leads:</strong> {segmento.total_leads || 0}</p>
                      <p><strong>Última Atualização:</strong> {segmento.last_lead_update ? new Date(segmento.last_lead_update).toLocaleDateString('pt-BR') : 'N/A'}</p>
                      <p><strong>Categoria:</strong> {segmento.category_title || 'N/A'}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <div className="callix-actions">
              <button
                onClick={handleImportLeads}
                disabled={!selectedSegmento || loading}
                className="callix-btn callix-btn-primary"
              >
                {loading ? '⏳ Processando...' : '🚀 Importar e Enriquecer Leads'}
              </button>
              
              <button
                onClick={handleEnrichLeads}
                disabled={!selectedSegmento || loading}
                className="callix-btn callix-btn-secondary"
              >
                {loading ? '⏳ Enriquecendo...' : '🔄 Apenas Enriquecer Leads Existentes'}
              </button>

              <button
                onClick={handleViewLeads}
                disabled={!selectedSegmento}
                className="callix-btn callix-btn-info"
              >
                👁️ Ver Leads do Segmento
              </button>
              
              <button
                onClick={handleSendToCallix}
                disabled={!selectedSegmento || !campaignId || loading}
                className="callix-btn callix-btn-success"
              >
                {loading ? '⏳ Enviando...' : '📤 Enviar para Callix'}
              </button>
            </div>
          </div>
        );

      case 'importing':
        return (
          <div className="callix-step-content">
            <div className="callix-progress">
              <h3>🔄 Importando e Enriquecendo Leads</h3>
              <div className="callix-spinner"></div>
              <p>Aguarde enquanto os leads são importados e enriquecidos...</p>
            </div>
          </div>
        );

      case 'sending':
        return (
          <div className="callix-step-content">
            <div className="callix-progress">
              <h3>📤 Enviando para Callix</h3>
              <div className="callix-spinner"></div>
              <p>Aguarde enquanto os leads são enviados para o Callix...</p>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="callix-step-content">
            <div className="callix-completed">
              <h3>✅ Processo Concluído!</h3>
              {stats && (
                <div className="callix-stats">
                  <h4>📊 Estatísticas da Importação</h4>
                  <div className="callix-stats-grid">
                    <div className="callix-stat-item">
                      <span className="callix-stat-number">{stats.totalLeadsInSegment}</span>
                      <span className="callix-stat-label">Leads no Segmento</span>
                    </div>
                    <div className="callix-stat-item">
                      <span className="callix-stat-number callix-stat-success">{stats.inserted}</span>
                      <span className="callix-stat-label">Inseridos</span>
                    </div>
                    <div className="callix-stat-item">
                      <span className="callix-stat-number callix-stat-updated">{stats.updated}</span>
                      <span className="callix-stat-label">Atualizados</span>
                    </div>
                    <div className="callix-stat-item">
                      <span className="callix-stat-number">{stats.processed}</span>
                      <span className="callix-stat-label">Processados</span>
                    </div>
                    <div className="callix-stat-item">
                      <span className="callix-stat-number callix-stat-error">{stats.errors}</span>
                      <span className="callix-stat-label">Erros</span>
                    </div>
                    <div className="callix-stat-item">
                      <span className="callix-stat-number">{stats.successRate}%</span>
                      <span className="callix-stat-label">Taxa de Sucesso</span>
                    </div>
                  </div>
                  <p><strong>⏱️ Tempo:</strong> {stats.duration}s</p>
                </div>
              )}

              {/* Estatísticas do Callix */}
              {stats && stats.sent !== undefined && (
                <div className="callix-stats">
                  <h4>📤 Estatísticas do Callix</h4>
                  <div className="callix-stats-grid">
                    <div className="callix-stat-item">
                      <span className="callix-stat-number">{stats.total || 0}</span>
                      <span className="callix-stat-label">Total de Leads</span>
                    </div>
                    <div className="callix-stat-item">
                      <span className="callix-stat-number callix-stat-success">{stats.sent || 0}</span>
                      <span className="callix-stat-label">Enviados</span>
                    </div>
                    {stats.alreadySent > 0 && (
                      <div className="callix-stat-item">
                        <span className="callix-stat-number callix-stat-warning">{stats.alreadySent}</span>
                        <span className="callix-stat-label">Já Enviados</span>
                      </div>
                    )}
                    {stats.errors > 0 && (
                      <div className="callix-stat-item">
                        <span className="callix-stat-number callix-stat-error">{stats.errors}</span>
                        <span className="callix-stat-label">Erros</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="callix-next-actions">
                <h4>🎯 Próximos Passos</h4>
                <div className="callix-actions">
                  <button
                    onClick={handleCheckStatus}
                    disabled={loading}
                    className="callix-btn callix-btn-info"
                  >
                    {loading ? '⏳ Verificando...' : '🔍 Verificar Status'}
                  </button>
                  <button
                    onClick={handleCompleteProcess}
                    className="callix-btn callix-btn-outline"
                  >
                    🔄 Novo Processo
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="callix-import-container">
      <div className="callix-header">
        <h2>🔗 Integração Callix</h2>
        <p>Importe leads de segmentos específicos e envie para o Callix</p>
      </div>

      <div className="callix-main-content">
        <div className="callix-left-panel">
          {renderStepContent()}
        </div>

        <div className="callix-right-panel">
          <div className="callix-logs">
            <div className="callix-logs-header">
              <h3>📝 Log de Atividades</h3>
              <button
                onClick={clearLogs}
                className="callix-btn callix-btn-small"
                disabled={loading}
              >
                🗑️ Limpar
              </button>
            </div>
            <div className="callix-logs-content">
              {logs.length === 0 ? (
                <p className="callix-logs-empty">Nenhuma atividade ainda...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="callix-log-item">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Leads */}
      {showLeadsTable && (
        <LeadsTable
          segmentoId={selectedSegmentoForTable?.id}
          segmentoNome={selectedSegmentoForTable?.nome}
          onClose={handleCloseLeadsTable}
        />
      )}
    </div>
  );
};

export default CallixImportComponent;
