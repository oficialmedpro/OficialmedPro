import React, { useState, useEffect } from 'react';
import './CronJobMonitor.css';
import { getSupabaseWithSchema } from '../service/supabase.js';

const CronJobMonitor = () => {
  const [logs, setLogs] = useState([]);
  const [statusSummary, setStatusSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState('all'); // all, success, error, running

  useEffect(() => {
    loadLogs();
    loadStatusSummary();

    // Auto refresh a cada 30 minutos se ativado
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadLogs();
        loadStatusSummary();
      }, 30 * 60 * 1000); // 30 minutos = 30 * 60 * 1000 ms
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const supabaseClient = getSupabaseWithSchema('api');
      
      // Buscar logs de cron jobs e segmentos automáticos
      let query = supabaseClient
        .from('cron_job_logs')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(30);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: cronLogs, error: cronError } = await query;

      if (cronError) {
        console.error('Erro ao carregar logs de cron:', cronError);
      }

      // Buscar logs de segmentos automáticos - usar a tabela que sua Edge Function usa
      let segmentoQuery = supabaseClient
        .from('cron_job_logs')
        .select('*')
        .eq('job_name', 'process_auto_segments')
        .order('start_time', { ascending: false })
        .limit(30);

      if (filter !== 'all') {
        segmentoQuery = segmentoQuery.eq('status', filter);
      }

      const { data: segmentoLogs, error: segmentoError } = await segmentoQuery;

      if (segmentoError) {
        console.error('Erro ao carregar logs de segmentos:', segmentoError);
      }

      // Combinar e formatar logs
      const allLogs = [
        ...(cronLogs || []).map(log => ({
          ...log,
          type: 'cron',
          job_name: log.job_name || 'Cron Job'
        })),
        ...(segmentoLogs || []).map(log => ({
          ...log,
          type: 'segmento',
          job_name: `Segmentos Automáticos`,
          start_time: log.start_time,
          end_time: log.end_time,
          duration_seconds: log.duration_seconds,
          message: log.message || 'Processamento de segmentos automáticos',
          error_message: log.error_message
        }))
      ].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

      setLogs(allLogs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatusSummary = async () => {
    try {
      const supabaseClient = getSupabaseWithSchema('api');
      const { data, error } = await supabaseClient
        .from('vw_cron_job_status')
        .select('*');

      if (error) {
        console.error('Erro ao carregar resumo:', error);
        return;
      }

      setStatusSummary(data || []);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '⏳';
      default: return '❓';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cron': return '⏰';
      case 'segmento': return '🎯';
      default: return '📋';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'running': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="cron-monitor-container">
      <div className="cron-monitor-header">
        <h2>📊 Monitor de Cron Jobs</h2>
        <div className="cron-monitor-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>🔄 Auto Refresh (30min)</span>
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="cron-filter-select"
          >
            <option value="all">Todos</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
            <option value="running">Executando</option>
          </select>
          <button
            onClick={() => {
              loadLogs();
              loadStatusSummary();
            }}
            disabled={loading}
            className="cron-refresh-btn"
          >
            {loading ? '⏳' : '🔄'} Atualizar
          </button>
        </div>
      </div>

      {/* Resumo de Status */}
      {statusSummary && statusSummary.length > 0 && (
        <div className="cron-status-summary">
          <h3>📈 Resumo dos Últimos 7 Dias</h3>
          <div className="cron-status-grid">
            {statusSummary.map((job) => (
              <div key={job.job_name} className="cron-status-card">
                <div className="cron-status-header">
                  <h4>{job.job_name}</h4>
                  <span className={`cron-status-badge ${job.success_rate_percent >= 90 ? 'success' : job.success_rate_percent >= 70 ? 'warning' : 'error'}`}>
                    {job.success_rate_percent}% sucesso
                  </span>
                </div>
                <div className="cron-status-stats">
                  <div className="cron-stat">
                    <span className="cron-stat-number">{job.total_executions}</span>
                    <span className="cron-stat-label">Total</span>
                  </div>
                  <div className="cron-stat">
                    <span className="cron-stat-number success">{job.successful_executions}</span>
                    <span className="cron-stat-label">Sucesso</span>
                  </div>
                  <div className="cron-stat">
                    <span className="cron-stat-number error">{job.failed_executions}</span>
                    <span className="cron-stat-label">Erro</span>
                  </div>
                  <div className="cron-stat">
                    <span className="cron-stat-number">{formatDuration(job.avg_duration_seconds)}</span>
                    <span className="cron-stat-label">Duração Média</span>
                  </div>
                </div>
                <div className="cron-status-footer">
                  <span>Última execução: {formatDateTime(job.last_execution)}</span>
                  {job.last_error && (
                    <span className="cron-last-error">Último erro: {job.last_error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Logs */}
      <div className="cron-logs-section">
        <h3>📝 Logs de Execução</h3>
        {loading ? (
          <div className="cron-loading">⏳ Carregando logs...</div>
        ) : logs.length === 0 ? (
          <div className="cron-empty">Nenhum log encontrado</div>
        ) : (
          <div className="cron-logs-list">
            {logs.map((log) => (
              <div key={log.id} className="cron-log-item">
                <div className="cron-log-header">
                  <div className="cron-log-status">
                    <span 
                      className="cron-status-icon"
                      style={{ color: getStatusColor(log.status) }}
                    >
                      {getStatusIcon(log.status)}
                    </span>
                    <span className="cron-type-icon">
                      {getTypeIcon(log.type)}
                    </span>
                    <span className="cron-job-name">{log.job_name}</span>
                    <span 
                      className="cron-status-badge"
                      style={{ backgroundColor: getStatusColor(log.status) }}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="cron-log-time">
                    {formatDateTime(log.start_time)}
                  </div>
                </div>
                
                <div className="cron-log-body">
                  <div className="cron-log-message">
                    {log.message}
                  </div>
                  
                  <div className="cron-log-details">
                    <span>Duração: {formatDuration(log.duration_seconds)}</span>
                    {log.end_time && (
                      <span>Fim: {formatDateTime(log.end_time)}</span>
                    )}
                  </div>
                  
                  {log.error_message && (
                    <div className="cron-log-error">
                      <strong>Erro:</strong> {log.error_message}
                    </div>
                  )}
                  
                  {log.details && (
                    <div className="cron-log-details-json">
                      <details>
                        <summary>Detalhes</summary>
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CronJobMonitor;
