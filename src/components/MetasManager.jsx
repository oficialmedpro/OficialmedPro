import React, { useState, useEffect, useRef } from 'react';
import { metasService } from '../service/metasService';
import { Target, Edit3, Save, X, Plus, Trash2, Users } from 'lucide-react';
import './MetasManager.css';

// NOVA VERSÃO - RECRIADA DO ZERO

const MetasManager = ({ selectedUnit, selectedFunnel, selectedOrigin }) => {
  console.log('🚀 NOVA VERSÃO DO METASMANAGER CARREGADA!', { selectedUnit, selectedFunnel, selectedOrigin });
  
  const [metas, setMetas] = useState({ gerais: [], vendedores: {} });
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMeta, setEditingMeta] = useState(null);
  const [showNewMetaForm, setShowNewMetaForm] = useState(false);

  // Estados para nova meta
  const [newMeta, setNewMeta] = useState({
    nome_meta: '',
    valor_da_meta: '',
    unidade: 'R$',
    tipo_meta: 'diária',
    vendedor_id: '',
    observacoes: '',
    unidade_franquia: '',
    dashboard: '',
    funil: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedUnit, selectedFunnel, selectedOrigin]);

  // SOLUÇÃO DEFINITIVA: Controlar scroll e manter foco
  useEffect(() => {
    let savedScrollPosition = 0;
    let isInputFocused = false;
    let scrollTimeout = null;
    let focusedElement = null;
    let focusedElementId = null;
    let restoreFocusTimeout = null;

    const handleFocusIn = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        isInputFocused = true;
        focusedElement = e.target;
        focusedElementId = e.target.id || e.target.name || e.target.className;
        console.log('🎯 Input focado, posição salva:', savedScrollPosition, 'ID:', focusedElementId);
        
        // Restaurar posição imediatamente
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          window.scrollTo(0, savedScrollPosition);
        }, 0);
      }
    };

    const handleFocusOut = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        // Só perde foco se não for uma re-renderização
        if (focusedElementId && e.target.id === focusedElementId) {
          console.log('🎯 Input perdeu foco (re-renderização detectada)');
          // Não limpar o foco, apenas marcar como perdido temporariamente
        } else {
          isInputFocused = false;
          focusedElement = null;
          focusedElementId = null;
          console.log('🎯 Input perdeu foco (real)');
        }
      }
    };

    const handleScroll = () => {
      if (isInputFocused && focusedElement) {
        console.log('🚫 Scroll bloqueado, restaurando posição:', savedScrollPosition);
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          window.scrollTo(0, savedScrollPosition);
        }, 0);
      }
    };

    const handleInput = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        if (isInputFocused && focusedElement === e.target) {
          console.log('⌨️ Digitação detectada, mantendo posição:', savedScrollPosition);
          window.scrollTo(0, savedScrollPosition);
        }
      }
    };

    // Função para restaurar foco após re-renderização
    const restoreFocus = () => {
      if (focusedElementId && isInputFocused) {
        const element = document.querySelector(`#${focusedElementId}`);
        if (element) {
          element.focus();
          // Restaurar posição do cursor no final do texto
          const length = element.value.length;
          element.setSelectionRange(length, length);
          console.log('🔄 Foco restaurado após re-renderização');
        }
      }
    };

    // Adicionar listeners
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);
    document.addEventListener('input', handleInput, true);
    window.addEventListener('scroll', handleScroll, true);

    // Restaurar foco continuamente durante re-renderizações
    const startFocusRestore = () => {
      if (focusedElementId && isInputFocused) {
        restoreFocus();
        restoreFocusTimeout = setTimeout(startFocusRestore, 50);
      }
    };

    // Iniciar restauração de foco
    if (focusedElementId && isInputFocused) {
      startFocusRestore();
    }

    return () => {
      clearTimeout(scrollTimeout);
      clearTimeout(restoreFocusTimeout);
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
      document.removeEventListener('input', handleInput, true);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const loadData = async () => {
    try {
      console.log('🚀 Iniciando carregamento de dados...');
      setLoading(true);
      await loadVendedores();
      await loadMetas();
      console.log('✅ Dados carregados com sucesso!');
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMetas = async () => {
    try {
      console.log('🔄 Iniciando carregamento de metas...');
      setError(null);
      const metasData = await metasService.getAllMetas();
      console.log('📊 Metas carregadas:', metasData);
      setMetas(metasData);
    } catch (err) {
      console.error('❌ Erro ao carregar metas:', err);
      setError(err.message || 'Erro ao carregar metas');
    }
  };

  const loadVendedores = async () => {
    try {
      const vendedoresData = await metasService.getVendedores();
      setVendedores(vendedoresData);
      console.log('👥 Vendedores carregados:', vendedoresData);
    } catch (err) {
      console.error('❌ Erro ao carregar vendedores:', err);
    }
  };

  // Função para buscar nome do vendedor pelo ID
  const getVendedorNome = (vendedorId) => {
    if (!vendedorId) return null;
    const vendedor = vendedores.find(v => v.id === vendedorId || v.id == vendedorId || String(v.id) === String(vendedorId));
    return vendedor ? vendedor.nome : `Vendedor ${vendedorId}`;
  };

  const handleEditMeta = (meta) => {
    setEditingMeta({ ...meta });
  };

  const handleSaveMeta = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('💾 Salvando meta:', editingMeta);

      const result = await metasService.updateMeta(editingMeta.id, {
        nome_meta: editingMeta.nome_meta,
        valor_da_meta: parseFloat(editingMeta.valor_da_meta) || 0,
        unidade: editingMeta.unidade,
        tipo_meta: editingMeta.tipo_meta,
        vendedor_id: editingMeta.vendedor_id || null,
        observacoes: editingMeta.observacoes,
        unidade_franquia: editingMeta.unidade_franquia,
        dashboard: editingMeta.dashboard,
        funil: editingMeta.funil ? parseInt(editingMeta.funil) : null
      });

      console.log('✅ Meta salva com sucesso:', result);
      setEditingMeta(null);
      await loadMetas();
    } catch (err) {
      console.error('❌ Erro ao salvar meta:', err);
      setError(err.message || 'Erro ao salvar meta');
      alert(`Erro ao salvar meta: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeta = async () => {
    try {
      setLoading(true);
      await metasService.createMeta({
        nome_meta: newMeta.nome_meta,
        valor_da_meta: parseFloat(newMeta.valor_da_meta) || 0,
        unidade: newMeta.unidade,
        tipo_meta: newMeta.tipo_meta,
        vendedor_id: newMeta.vendedor_id || null,
        observacoes: newMeta.observacoes,
        unidade_franquia: newMeta.unidade_franquia,
        dashboard: newMeta.dashboard,
        funil: newMeta.funil ? parseInt(newMeta.funil) : null
      });

      setShowNewMetaForm(false);
      setNewMeta({
        nome_meta: '',
        valor_da_meta: '',
        unidade: 'R$',
        tipo_meta: 'diária',
        vendedor_id: '',
        observacoes: '',
        unidade_franquia: '',
        dashboard: '',
        funil: ''
      });
      await loadMetas();
    } catch (err) {
      console.error('❌ Erro ao criar meta:', err);
      setError(err.message || 'Erro ao criar meta');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateMeta = async (metaId) => {
    if (!window.confirm('Tem certeza que deseja desativar esta meta?')) return;

    try {
      setLoading(true);
      await metasService.deactivateMeta(metaId);
      await loadMetas();
    } catch (err) {
      console.error('❌ Erro ao desativar meta:', err);
      setError(err.message || 'Erro ao desativar meta');
    } finally {
      setLoading(false);
    }
  };

  // Componente de input simples - sem complicações
  const SimpleInput = ({ value, onChange, type = "text", className = "", style = {}, ...props }) => {
    return (
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={className}
        style={style}
        {...props}
      />
    );
  };

  // Componente de select simples
  const SimpleSelect = ({ value, onChange, options, className = "", ...props }) => (
    <select
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  const MetaCard = ({ meta, isEditing, onEdit, onSave, onCancel, onDelete }) => {
    const isCurrentlyEditing = isEditing && editingMeta?.id === meta.id;

    return (
      <div className={`meta-card ${isCurrentlyEditing ? 'editing' : ''}`}>
        <div className="meta-header">
          <Target size={16} />
          <div className="meta-actions">
            {isCurrentlyEditing ? (
              <>
                <button onClick={onSave} className="btn-save" title="Salvar">
                  <Save size={14} />
                </button>
                <button onClick={onCancel} className="btn-cancel" title="Cancelar">
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onEdit(meta)} className="btn-edit" title="Editar">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => onDelete(meta.id)} className="btn-delete" title="Excluir">
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="meta-content">
          <div className="meta-field">
            <label>Nome da Meta:</label>
            {isCurrentlyEditing ? (
              <SimpleInput
                value={editingMeta.nome_meta || ''}
                onChange={(e) => setEditingMeta({...editingMeta, nome_meta: e.target.value})}
                id={`meta-nome-${meta.id}`}
                className="meta-input"
              />
            ) : (
              <span>{meta.nome_meta}</span>
            )}
          </div>

          <div className="meta-field">
            <label>Valor:</label>
            {isCurrentlyEditing ? (
              <SimpleInput
                type="text"
                value={editingMeta.valor_da_meta || ''}
                onChange={(e) => setEditingMeta({...editingMeta, valor_da_meta: e.target.value})}
                id={`meta-valor-${meta.id}`}
                style={{
                  border: '1px solid #ccc',
                  padding: '8px',
                  borderRadius: '4px',
                  width: '100px'
                }}
              />
            ) : (
              <span>{parseFloat(meta.valor_da_meta || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}</span>
            )}
          </div>

          <div className="meta-field">
            <label>Unidade:</label>
            {isCurrentlyEditing ? (
              <SimpleSelect
                value={editingMeta.unidade || ''}
                onChange={(e) => setEditingMeta({...editingMeta, unidade: e.target.value})}
                id={`meta-unidade-${meta.id}`}
                className="meta-select"
                options={[
                  { value: 'R$', label: 'R$' },
                  { value: '%', label: '%' },
                  { value: 'unidade', label: 'Unidade' },
                  { value: 'lead', label: 'Lead' }
                ]}
              />
            ) : (
              <span>{meta.unidade}</span>
            )}
          </div>

          <div className="meta-field">
            <label>Tipo:</label>
            {isCurrentlyEditing ? (
              <SimpleSelect
                value={editingMeta.tipo_meta || ''}
                onChange={(e) => setEditingMeta({...editingMeta, tipo_meta: e.target.value})}
                id={`meta-tipo-${meta.id}`}
                className="meta-select"
                options={[
                  { value: 'diária', label: 'Diária' },
                  { value: 'sábado', label: 'Sábado' },
                  { value: 'mensal', label: 'Mensal' },
                  { value: 'vendedor_diaria', label: 'Vendedor Diária' },
                  { value: 'vendedor_sabado', label: 'Vendedor Sábado' },
                  { value: 'vendedor_mensal', label: 'Vendedor Mensal' }
                ]}
              />
            ) : (
              <span>{meta.tipo_meta}</span>
            )}
          </div>

          <div className="meta-field">
            <label>Ativo:</label>
            {isCurrentlyEditing ? (
              <SimpleSelect
                value={editingMeta.ativo ? 'true' : 'false'}
                onChange={(e) => setEditingMeta({...editingMeta, ativo: e.target.value === 'true'})}
                id={`meta-ativo-${meta.id}`}
                className="meta-select"
                options={[
                  { value: 'true', label: 'Sim' },
                  { value: 'false', label: 'Não' }
                ]}
              />
            ) : (
              <span className={`meta-status ${meta.ativo ? 'ativo' : 'inativo'}`}>
                {meta.ativo ? 'Sim' : 'Não'}
              </span>
            )}
          </div>

          <div className="meta-field">
            <label>Dashboard:</label>
            {isCurrentlyEditing ? (
              <SimpleInput
                value={editingMeta.dashboard || ''}
                onChange={(e) => setEditingMeta({...editingMeta, dashboard: e.target.value})}
                className="meta-input"
                placeholder="Ex: vendas, leads..."
              />
            ) : (
              <span>{meta.dashboard || '-'}</span>
            )}
          </div>

          <div className="meta-field">
            <label>Funil:</label>
            {isCurrentlyEditing ? (
              <SimpleInput
                type="number"
                value={editingMeta.funil || ''}
                onChange={(e) => setEditingMeta({...editingMeta, funil: e.target.value})}
                className="meta-input"
                placeholder="Ex: 1, 2, 3..."
              />
            ) : (
              <span>{meta.funil || '-'}</span>
            )}
          </div>

          <div className="meta-field">
            <label>Unidade Franquia:</label>
            {isCurrentlyEditing ? (
              <SimpleInput
                value={editingMeta.unidade_franquia || ''}
                onChange={(e) => setEditingMeta({...editingMeta, unidade_franquia: e.target.value})}
                className="meta-input"
                placeholder="Ex: SP, RJ, MG..."
              />
            ) : (
              <span>{meta.unidade_franquia || '-'}</span>
            )}
          </div>

          {isCurrentlyEditing && (
            <div className="meta-field">
              <label>Observações:</label>
              <textarea
                value={editingMeta.observacoes || ''}
                onChange={(e) => setEditingMeta({...editingMeta, observacoes: e.target.value})}
                className="meta-textarea"
                rows="2"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading && !metas.gerais.length && !Object.keys(metas.vendedores).length) {
    return (
      <div className="metas-loading">
        <Target className="loading-icon" />
        <p>Carregando metas...</p>
      </div>
    );
  }

  return (
    <div className="metas-manager">
      {error && (
        <div className="error-banner">
          <p>❌ {error}</p>
        </div>
      )}

      <div className="metas-header">
        <div className="header-title">
          <Target size={24} />
          <h2>Gerenciamento de Metas</h2>
        </div>
        <button
          onClick={() => setShowNewMetaForm(true)}
          className="btn-new-meta"
          disabled={loading}
        >
          <Plus size={16} />
          Nova Meta
        </button>
      </div>

      {/* Nova Meta Form */}
      {showNewMetaForm && (
        <div className="new-meta-form">
          <div className="form-header">
            <h3>Nova Meta</h3>
            <button onClick={() => setShowNewMetaForm(false)} className="btn-close">
              <X size={16} />
            </button>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Nome da Meta:</label>
              <SimpleInput
                value={newMeta.nome_meta}
                onChange={(e) => setNewMeta({...newMeta, nome_meta: e.target.value})}
                className="form-input"
                placeholder="Ex: Meta de Vendas Diária"
              />
            </div>

            <div className="form-field">
              <label>Valor:</label>
              <SimpleInput
                type="number"
                step="0.01"
                value={newMeta.valor_da_meta}
                onChange={(e) => setNewMeta({...newMeta, valor_da_meta: e.target.value})}
                className="form-input"
                placeholder="0.00"
              />
            </div>

            <div className="form-field">
              <label>Unidade:</label>
              <SimpleSelect
                value={newMeta.unidade}
                onChange={(e) => setNewMeta({...newMeta, unidade: e.target.value})}
                className="form-select"
                options={[
                  { value: 'R$', label: 'R$' },
                  { value: '%', label: '%' },
                  { value: 'unidade', label: 'Unidade' },
                  { value: 'lead', label: 'Lead' }
                ]}
              />
            </div>

            <div className="form-field">
              <label>Tipo:</label>
              <SimpleSelect
                value={newMeta.tipo_meta}
                onChange={(e) => setNewMeta({...newMeta, tipo_meta: e.target.value})}
                className="form-select"
                options={[
                  { value: 'diária', label: 'Diária' },
                  { value: 'sábado', label: 'Sábado' },
                  { value: 'mensal', label: 'Mensal' },
                  { value: 'vendedor_diaria', label: 'Vendedor Diária' },
                  { value: 'vendedor_sabado', label: 'Vendedor Sábado' },
                  { value: 'vendedor_mensal', label: 'Vendedor Mensal' }
                ]}
              />
            </div>

            <div className="form-field">
              <label>Vendedor (opcional):</label>
              <SimpleSelect
                value={newMeta.vendedor_id}
                onChange={(e) => setNewMeta({...newMeta, vendedor_id: e.target.value})}
                className="form-select"
                options={[
                  { value: '', label: 'Geral (todos os vendedores)' },
                  ...vendedores.map(vendedor => ({
                    value: vendedor.id,
                    label: vendedor.nome
                  }))
                ]}
              />
            </div>

            <div className="form-field">
              <label>Dashboard:</label>
              <SimpleInput
                value={newMeta.dashboard}
                onChange={(e) => setNewMeta({...newMeta, dashboard: e.target.value})}
                className="form-input"
                placeholder="Ex: vendas, leads..."
              />
            </div>

            <div className="form-field">
              <label>Funil:</label>
              <SimpleInput
                type="number"
                value={newMeta.funil}
                onChange={(e) => setNewMeta({...newMeta, funil: e.target.value})}
                className="form-input"
                placeholder="Ex: 1, 2, 3..."
              />
            </div>

            <div className="form-field">
              <label>Unidade Franquia:</label>
              <SimpleInput
                value={newMeta.unidade_franquia}
                onChange={(e) => setNewMeta({...newMeta, unidade_franquia: e.target.value})}
                className="form-input"
                placeholder="Ex: SP, RJ, MG..."
              />
            </div>

            <div className="form-field full-width">
              <label>Observações:</label>
              <textarea
                value={newMeta.observacoes}
                onChange={(e) => setNewMeta({...newMeta, observacoes: e.target.value})}
                className="form-textarea"
                rows="2"
                placeholder="Observações sobre esta meta..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button onClick={handleCreateMeta} className="btn-create" disabled={loading}>
              <Plus size={16} />
              Criar Meta
            </button>
            <button onClick={() => setShowNewMetaForm(false)} className="btn-cancel">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Metas Gerais */}
      <div className="metas-section">
        <div className="section-header">
          <Target size={18} />
          <h3>Metas Gerais</h3>
          <span className="meta-count">{metas.gerais.length}</span>
        </div>

        <div className="metas-grid">
          {metas.gerais.map(meta => (
            <MetaCard
              key={meta.id}
              meta={meta}
              isEditing={editingMeta?.id === meta.id}
              onEdit={handleEditMeta}
              onSave={handleSaveMeta}
              onCancel={() => setEditingMeta(null)}
              onDelete={handleDeactivateMeta}
            />
          ))}
          {metas.gerais.length === 0 && (
            <div className="empty-state">
              <p>Nenhuma meta geral cadastrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Metas por Vendedor */}
      {Object.keys(metas.vendedores).map(vendedorId => (
        <div key={vendedorId} className="metas-section">
          <div className="section-header">
            <Users size={18} />
            <h3>{getVendedorNome(vendedorId) || `Vendedor ${vendedorId}`}</h3>
            <span className="meta-count">{metas.vendedores[vendedorId].length}</span>
          </div>

          <div className="metas-grid">
            {metas.vendedores[vendedorId].map(meta => (
              <MetaCard
                key={meta.id}
                meta={meta}
                isEditing={editingMeta?.id === meta.id}
                onEdit={handleEditMeta}
                onSave={handleSaveMeta}
                onCancel={() => setEditingMeta(null)}
                onDelete={handleDeactivateMeta}
              />
            ))}
          </div>
        </div>
      ))}

      {loading && (
        <div className="loading-overlay">
          <Target className="loading-spinner" />
        </div>
      )}
    </div>
  );
};

export default MetasManager;