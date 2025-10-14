import React, { useState, useEffect } from 'react';
import './AutoSegmentsManager.css';
import { 
  getSegmentosAutomaticos, 
  criarSegmentoAutomatico, 
  atualizarSegmentoAutomatico,
  deletarSegmentoAutomatico,
  toggleSegmentoAutomatico,
  executarTodosSegmentosAutomaticos,
  getEstatisticasSegmentosAutomaticos,
  validarConfiguracaoSegmento,
  formatarTempoRestante
} from '../service/autoSegmentsService';
import { getSegmentos } from '../service/callixService';

const AutoSegmentsManager = () => {
  const [segmentos, setSegmentos] = useState([]);
  const [segmentosAutomaticos, setSegmentosAutomaticos] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSegmento, setEditingSegmento] = useState(null);
  const [logs, setLogs] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    segmento_id: '',
    nome: '',
    ativo: true,
    enviar_callix: false,
    frequencia_horas: 6
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSegmentos(),
        loadSegmentosAutomaticos(),
        loadEstatisticas()
      ]);
    } catch (error) {
      addLog(`❌ Erro ao carregar dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSegmentos = async () => {
    try {
      const data = await getSegmentos();
      setSegmentos(data);
    } catch (error) {
      console.error('Erro ao carregar segmentos:', error);
    }
  };

  const loadSegmentosAutomaticos = async () => {
    try {
      const data = await getSegmentosAutomaticos();
      setSegmentosAutomaticos(data);
    } catch (error) {
      console.error('Erro ao carregar segmentos automáticos:', error);
    }
  };

  const loadEstatisticas = async () => {
    try {
      const data = await getEstatisticasSegmentosAutomaticos();
      setEstatisticas(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleCreateSegmento = () => {
    setEditingSegmento(null);
    setFormData({
      segmento_id: '',
      nome: '',
      ativo: true,
      enviar_callix: false,
      frequencia_horas: 6
    });
    setShowModal(true);
  };

  const handleEditSegmento = (segmento) => {
    setEditingSegmento(segmento);
    setFormData({
      segmento_id: segmento.segmento_id,
      nome: segmento.nome,
      ativo: segmento.ativo,
      enviar_callix: segmento.enviar_callix,
      frequencia_horas: segmento.frequencia_horas
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const validacao = validarConfiguracaoSegmento(formData);
      if (!validacao.valido) {
        addLog(`❌ Erro de validação: ${validacao.erros.join(', ')}`);
        return;
      }

      setLoading(true);

      if (editingSegmento) {
        await atualizarSegmentoAutomatico(editingSegmento.id, formData);
        addLog(`✅ Segmento "${formData.nome}" atualizado com sucesso!`);
      } else {
        await criarSegmentoAutomatico(formData);
        addLog(`✅ Segmento "${formData.nome}" criado com sucesso!`);
      }

      await loadSegmentosAutomaticos();
      await loadEstatisticas();
      setShowModal(false);
      
    } catch (error) {
      addLog(`❌ Erro ao salvar segmento: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSegmento = async (id, ativo) => {
    try {
      setLoading(true);
      await toggleSegmentoAutomatico(id, !ativo);
      addLog(`✅ Segmento ${ativo ? 'desativado' : 'ativado'} com sucesso!`);
      await loadSegmentosAutomaticos();
      await loadEstatisticas();
    } catch (error) {
      addLog(`❌ Erro ao alterar status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSegmento = async (id, nome) => {
    if (!confirm(`Tem certeza que deseja deletar o segmento "${nome}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await deletarSegmentoAutomatico(id);
      addLog(`✅ Segmento "${nome}" deletado com sucesso!`);
      await loadSegmentosAutomaticos();
      await loadEstatisticas();
    } catch (error) {
      addLog(`❌ Erro ao deletar segmento: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecutarTodos = async () => {
    try {
      setLoading(true);
      addLog('🚀 Executando todos os segmentos automáticos...');
      
      const result = await executarTodosSegmentosAutomaticos(addLog);
      
      if (result.success) {
        addLog(`✅ ${result.message}`);
        await loadSegmentosAutomaticos();
        await loadEstatisticas();
      }
    } catch (error) {
      addLog(`❌ Erro na execução: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentoNome = (segmentoId) => {
    const segmento = segmentos.find(s => s.id === segmentoId);
    return segmento ? segmento.name : `ID: ${segmentoId}`;
  };

  const getSegmentoTotalLeads = (segmentoId) => {
    const segmento = segmentos.find(s => s.id === segmentoId);
    return segmento ? segmento.total_leads : 0;
  };

  return (
    <div className="auto-segments-manager">
      <div className="auto-segments-header">
        <h2>🤖 Gerenciador de Segmentos Automáticos</h2>
        <p>Configure segmentos para processamento automático de leads</p>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="auto-segments-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{estatisticas.totalSegmentos}</div>
              <div className="stat-label">Total de Segmentos</div>
            </div>
            <div className="stat-card">
              <div className="stat-number active">{estatisticas.segmentosAtivos}</div>
              <div className="stat-label">Segmentos Ativos</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{estatisticas.totalLeadsProcessados}</div>
              <div className="stat-label">Leads Processados</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{estatisticas.totalLeadsEnviadosCallix}</div>
              <div className="stat-label">Enviados para Callix</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{estatisticas.leadsEnviadosHoje}</div>
              <div className="stat-label">Enviados Hoje</div>
            </div>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="auto-segments-actions">
        <button
          onClick={handleCreateSegmento}
          className="btn btn-primary"
          disabled={loading}
        >
          ➕ Novo Segmento Automático
        </button>
        
        <button
          onClick={handleExecutarTodos}
          className="btn btn-secondary"
          disabled={loading}
        >
          {loading ? '⏳ Executando...' : '🚀 Executar Todos Agora'}
        </button>
      </div>

      {/* Lista de Segmentos Automáticos */}
      <div className="auto-segments-list">
        <h3>📋 Segmentos Configurados</h3>
        
        {segmentosAutomaticos.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum segmento automático configurado ainda.</p>
            <p>Clique em "Novo Segmento Automático" para começar.</p>
          </div>
        ) : (
          <div className="segments-grid">
            {segmentosAutomaticos.map(segmento => (
              <div key={segmento.id} className={`segment-card ${segmento.ativo ? 'active' : 'inactive'}`}>
                <div className="segment-header">
                  <h4>{segmento.nome}</h4>
                  <div className={`status-badge ${segmento.ativo ? 'active' : 'inactive'}`}>
                    {segmento.ativo ? '🟢 Ativo' : '🔴 Inativo'}
                  </div>
                </div>
                
                <div className="segment-info">
                  <p><strong>Segmento:</strong> {getSegmentoNome(segmento.segmento_id)}</p>
                  <p><strong>Total de Leads:</strong> {getSegmentoTotalLeads(segmento.segmento_id)}</p>
                  <p><strong>Frequência:</strong> A cada {segmento.frequencia_horas}h</p>
                  <p><strong>Enviar Callix:</strong> {segmento.enviar_callix ? '✅ Sim' : '❌ Não'}</p>
                  <p><strong>Próxima Execução:</strong> {formatarTempoRestante(segmento.proxima_execucao)}</p>
                  {segmento.ultima_execucao && (
                    <p><strong>Última Execução:</strong> {new Date(segmento.ultima_execucao).toLocaleString('pt-BR')}</p>
                  )}
                </div>

                <div className="segment-stats">
                  <span>📊 {segmento.total_leads_processados || 0} processados</span>
                  <span>📤 {segmento.total_leads_enviados_callix || 0} enviados</span>
                </div>

                <div className="segment-actions">
                  <button
                    onClick={() => handleToggleSegmento(segmento.id, segmento.ativo)}
                    className={`btn btn-sm ${segmento.ativo ? 'btn-warning' : 'btn-success'}`}
                    disabled={loading}
                  >
                    {segmento.ativo ? '⏸️ Pausar' : '▶️ Ativar'}
                  </button>
                  
                  <button
                    onClick={() => handleEditSegmento(segmento)}
                    className="btn btn-sm btn-info"
                    disabled={loading}
                  >
                    ✏️ Editar
                  </button>
                  
                  <button
                    onClick={() => handleDeleteSegmento(segmento.id, segmento.nome)}
                    className="btn btn-sm btn-danger"
                    disabled={loading}
                  >
                    🗑️ Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logs */}
      <div className="auto-segments-logs">
        <div className="logs-header">
          <h3>📝 Log de Atividades</h3>
          <button onClick={clearLogs} className="btn btn-sm btn-outline">
            🗑️ Limpar
          </button>
        </div>
        <div className="logs-content">
          {logs.length === 0 ? (
            <p className="logs-empty">Nenhuma atividade ainda...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="log-item">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSegmento ? '✏️ Editar Segmento' : '➕ Novo Segmento Automático'}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Segmento:</label>
                <select
                  value={formData.segmento_id}
                  onChange={(e) => setFormData({...formData, segmento_id: e.target.value})}
                  disabled={editingSegmento}
                >
                  <option value="">Selecione um segmento...</option>
                  {segmentos.map(segmento => (
                    <option key={segmento.id} value={segmento.id}>
                      {segmento.name} ({segmento.total_leads || 0} leads)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Nome:</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Segmento D15 - Automático"
                />
              </div>

              <div className="form-group">
                <label>Frequência (horas):</label>
                <select
                  value={formData.frequencia_horas}
                  onChange={(e) => setFormData({...formData, frequencia_horas: parseInt(e.target.value)})}
                >
                  <option value={1}>1 hora</option>
                  <option value={2}>2 horas</option>
                  <option value={6}>6 horas</option>
                  <option value={12}>12 horas</option>
                  <option value={24}>24 horas</option>
                  <option value={48}>48 horas</option>
                  <option value={168}>168 horas (1 semana)</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.enviar_callix}
                    onChange={(e) => setFormData({...formData, enviar_callix: e.target.checked})}
                  />
                  Enviar leads para Callix automaticamente
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                  />
                  Ativar segmento imediatamente
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-outline">
                Cancelar
              </button>
              <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
                {loading ? '⏳ Salvando...' : (editingSegmento ? '💾 Atualizar' : '➕ Criar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoSegmentsManager;
