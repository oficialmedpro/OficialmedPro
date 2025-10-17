import React, { useState, useEffect } from 'react';
import './SegmentosAutomaticosPage.css';
import { getSupabaseWithSchema } from '../service/supabase.js';
import { Play, Pause, Eye, Edit, Trash2, Plus, Rocket, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const SegmentosAutomaticosPage = () => {
  const [segmentos, setSegmentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [executingSegment, setExecutingSegment] = useState(null);
  const [creatingSegment, setCreatingSegment] = useState(false);

  useEffect(() => {
    loadSegmentos();
  }, []);

  const loadSegmentos = async () => {
    try {
      setLoading(true);
      const supabaseClient = getSupabaseWithSchema('api');
      
      const { data, error } = await supabaseClient
        .from('segmento_automatico')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar segmentos:', error);
        return;
      }

      setSegmentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar segmentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecutarAgora = async (segmento) => {
    try {
      setExecutingSegment(segmento.id);
      
      const confirmExec = confirm(
        `🚀 EXECUTAR SEGMENTO AGORA\n\n` +
        `📋 Segmento: ${segmento.nome}\n` +
        `🎯 Segmento ID: ${segmento.segmento_key}\n` +
        `📞 Enviar Callix: ${segmento.enviar_callix ? 'Sim' : 'Não'}\n\n` +
        `Deseja executar agora?`
      );

      if (!confirmExec) {
        setExecutingSegment(null);
        return;
      }

      // Chamar sua Edge Function existente
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log(`🚀 Executando segmento ${segmento.nome} (${segmento.segmento_key})`);
      
      // Sua Edge Function não aceita segmento_id individual, ela processa todos os ativos
      // Vamos chamar ela mesmo assim e ela vai processar todos os segmentos que estão prontos
            const response = await fetch('http://localhost:3002/api/processar-segmentos-lote', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({})
            });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao executar: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log('Resultado da execução:', result);
      
      alert(
        `✅ SEGMENTOS EXECUTADOS!\n\n` +
        `📊 ${result.message}\n` +
        `📋 Segmentos processados: ${result.resultados?.length || 0}\n\n` +
        `Verifique o Monitor Cron Jobs para detalhes!`
      );

      // Recarregar segmentos para atualizar status
      loadSegmentos();
      
    } catch (error) {
      console.error('Erro ao executar segmento:', error);
      alert(`❌ Erro ao executar segmento: ${error.message}`);
    } finally {
      setExecutingSegment(null);
    }
  };

  const handleToggleStatus = async (segmento) => {
    try {
      const supabaseClient = getSupabaseWithSchema('api');
      const novoStatus = segmento.ativo ? false : true;
      
      const { error } = await supabaseClient
        .from('segmento_automatico')
        .update({ 
          ativo: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', segmento.id);

      if (error) {
        console.error('Erro ao alterar status:', error);
        return;
      }

      // Atualizar estado local
      setSegmentos(prev => 
        prev.map(s => 
          s.id === segmento.id 
            ? { ...s, ativo: novoStatus, updated_at: new Date().toISOString() }
            : s
        )
      );
      
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleExecutarTodos = async () => {
    const segmentosAtivos = segmentos.filter(s => s.ativo);
    
    if (segmentosAtivos.length === 0) {
      alert('❌ Nenhum segmento ativo encontrado!');
      return;
    }

    const confirmExec = confirm(
      `🚀 EXECUTAR TODOS OS SEGMENTOS ATIVOS\n\n` +
      `📋 Segmentos: ${segmentosAtivos.length}\n` +
      `🎯 Total estimado de leads: ${segmentosAtivos.reduce((sum, s) => sum + (s.total_leads || 0), 0)}\n\n` +
      `Deseja executar todos agora?`
    );

    if (!confirmExec) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Executar todos os segmentos usando sua Edge Function
            const response = await fetch('http://localhost:3002/api/processar-segmentos-lote', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({})
            });

      if (!response.ok) {
        throw new Error('Erro ao executar todos os segmentos');
      }

      const result = await response.json();
      
      alert(
        `✅ TODOS OS SEGMENTOS EXECUTADOS!\n\n` +
        `📊 Total de segmentos: ${result.total_segmentos}\n` +
        `✅ Executados com sucesso: ${result.executados_com_sucesso}\n\n` +
        `Veja os detalhes no Monitor Cron Jobs!`
      );
      
      loadSegmentos();
      
    } catch (error) {
      console.error('Erro ao executar todos os segmentos:', error);
      alert(`❌ Erro ao executar segmentos: ${error.message}`);
    } finally {
      setExecutingSegment(null);
    }
  };

  const getStatusBadge = (segmento) => {
    if (segmento.ativo) {
      return (
        <span className="status-badge ativo">
          <CheckCircle size={14} />
          ATIVO
        </span>
      );
    } else {
      return (
        <span className="status-badge inativo">
          <AlertCircle size={14} />
          INATIVO
        </span>
      );
    }
  };

  const getProximaExecucao = (segmento) => {
    if (!segmento.ativo) return 'Segmento inativo';
    
    const ultimaExecucao = segmento.ultima_execucao ? new Date(segmento.ultima_execucao) : null;
    const frequencia = segmento.frequencia_horas || 2;
    
    if (!ultimaExecucao) {
      return 'Pronto para execução';
    }
    
    const proximaExecucao = new Date(ultimaExecucao.getTime() + (frequencia * 60 * 60 * 1000));
    const agora = new Date();
    
    if (proximaExecucao <= agora) {
      return 'Pronto para execução';
    }
    
    return proximaExecucao.toLocaleString('pt-BR');
  };

  const handleCriarSegmentoComExecucao = async (dadosSegmento) => {
    try {
      setCreatingSegment(true);
      
      // 1. Criar o segmento
      const supabaseClient = getSupabaseWithSchema('api');
      const { data: novoSegmento, error } = await supabaseClient
        .from('segmento_automatico')
        .insert({
          ...dadosSegmento,
          ativo: true,
          proxima_execucao: new Date().toISOString(), // Pronto para execução imediata
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar segmento: ${error.message}`);
      }

      console.log('✅ Segmento criado:', novoSegmento);

      // 2. Executar imediatamente
      const confirmExec = confirm(
        `✅ SEGMENTO CRIADO COM SUCESSO!\n\n` +
        `📋 Nome: ${novoSegmento.nome}\n` +
        `🎯 Segmento ID: ${novoSegmento.segmento_key}\n\n` +
        `Deseja executar agora para testar?`
      );

      if (confirmExec) {
        // Chamar sua Edge Function
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        console.log(`🚀 Executando segmento recém-criado: ${novoSegmento.nome}`);
        
            const response = await fetch('https://bi.oficialmed.com.br/api/processar-segmentos-lote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro ao executar: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        alert(
          `🎉 SEGMENTO CRIADO E EXECUTADO!\n\n` +
          `📊 ${result.message}\n` +
          `📋 Segmentos processados: ${result.resultados?.length || 0}\n\n` +
          `Verifique o Monitor Cron Jobs para detalhes!`
        );
      }

      // 3. Recarregar lista
      loadSegmentos();
      setShowCreateModal(false);
      
    } catch (error) {
      console.error('Erro ao criar segmento:', error);
      alert(`❌ Erro ao criar segmento: ${error.message}`);
    } finally {
      setCreatingSegment(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="segmentos-page">
      <div className="segmentos-header">
        <h1>🎯 Segmentos Automáticos</h1>
        <div className="segmentos-actions">
          <button 
            className="btn-executar-todos"
            onClick={handleExecutarTodos}
            disabled={loading || segmentos.filter(s => s.ativo).length === 0}
          >
            <Rocket size={16} />
            Executar Todos Agora
          </button>
          <button 
            className="btn-novo-segmento"
            onClick={() => setShowCreateModal(true)}
            disabled={creatingSegment}
          >
            {creatingSegment ? (
              <>
                <Clock size={16} />
                Criando...
              </>
            ) : (
              <>
                <Plus size={16} />
                Novo Segmento Automático
              </>
            )}
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="segmentos-stats">
        <div className="stat-card">
          <div className="stat-number">{segmentos.length}</div>
          <div className="stat-label">TOTAL DE SEGMENTOS</div>
        </div>
        <div className="stat-card">
          <div className="stat-number ativo">{segmentos.filter(s => s.ativo).length}</div>
          <div className="stat-label">SEGMENTOS ATIVOS</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{segmentos.reduce((sum, s) => sum + (s.total_leads || 0), 0)}</div>
          <div className="stat-label">LEADS PROCESSADOS</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{segmentos.reduce((sum, s) => sum + (s.enviados_callix || 0), 0)}</div>
          <div className="stat-label">ENVIADOS</div>
        </div>
      </div>

      {/* Lista de Segmentos */}
      <div className="segmentos-list">
        <h2>📋 Segmentos Configurados</h2>
        
        {loading ? (
          <div className="loading">⏳ Carregando segmentos...</div>
        ) : segmentos.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum segmento configurado ainda.</p>
            <button 
              className="btn-novo-segmento"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              Criar Primeiro Segmento
            </button>
          </div>
        ) : (
          <div className="segmentos-grid">
            {segmentos.map((segmento) => (
              <div key={segmento.id} className="segmento-card">
                <div className="segmento-header">
                  <h3>{segmento.nome}</h3>
                  {getStatusBadge(segmento)}
                </div>
                
                <div className="segmento-details">
                  <div className="detail-item">
                    <strong>Segmento:</strong> {segmento.segmento_key}
                  </div>
                  <div className="detail-item">
                    <strong>Total de Leads:</strong> {segmento.total_leads || 'Calculando...'}
                  </div>
                  <div className="detail-item">
                    <strong>Frequência:</strong> A cada {segmento.frequencia_horas || 2}h
                  </div>
                  <div className="detail-item">
                    <strong>Enviar Callix:</strong> {segmento.enviar_callix ? '✅ Sim' : '❌ Não'}
                  </div>
                  {segmento.enviar_callix && (
                    <div className="detail-item">
                      <strong>Lista Callix:</strong> ID {segmento.lista_callix_id || 'N/A'}
                    </div>
                  )}
                  <div className="detail-item">
                    <strong>Próxima Execução:</strong> {getProximaExecucao(segmento)}
                  </div>
                  <div className="detail-item">
                    <strong>Última Execução:</strong> {formatDateTime(segmento.ultima_execucao)}
                  </div>
                </div>

                <div className="segmento-progress">
                  <div className="progress-item">
                    <span className="progress-number">{segmento.total_leads || 0}</span>
                    <span className="progress-label">processados</span>
                  </div>
                  <div className="progress-item">
                    <span className="progress-number">{segmento.enviados_callix || 0}</span>
                    <span className="progress-label">enviados</span>
                  </div>
                </div>

                <div className="segmento-actions">
                  <button
                    className={`btn-executar ${executingSegment === segmento.id ? 'executing' : ''}`}
                    onClick={() => handleExecutarAgora(segmento)}
                    disabled={executingSegment === segmento.id || !segmento.ativo}
                  >
                    {executingSegment === segmento.id ? (
                      <>
                        <Clock size={14} />
                        Executando...
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        Executar Agora
                      </>
                    )}
                  </button>
                  
                  <button
                    className={`btn-toggle ${segmento.ativo ? 'pause' : 'play'}`}
                    onClick={() => handleToggleStatus(segmento)}
                  >
                    {segmento.ativo ? <Pause size={14} /> : <Play size={14} />}
                    {segmento.ativo ? 'Pausar' : 'Ativar'}
                  </button>
                  
                  <button className="btn-view">
                    <Eye size={14} />
                    Ver Leads
                  </button>
                  
                  <button className="btn-edit">
                    <Edit size={14} />
                    Editar
                  </button>
                  
                  <button className="btn-delete">
                    <Trash2 size={14} />
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentosAutomaticosPage;
