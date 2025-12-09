import React, { useState, useEffect, useRef } from 'react';
import './CockpitVendedoresConfigPage.css';
import { 
  getCockpitVendedoresConfig, 
  createCockpitVendedoresConfig, 
  updateCockpitVendedoresConfig, 
  deleteCockpitVendedoresConfig,
  getTiposSecao,
  createTipoSecao,
  updateTipoSecao,
  deleteTipoSecao
} from '../service/supabase';
import { getVendedores } from '../service/FilterBarService';
import { getFunisPorUnidade } from '../service/FilterBarService';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, MoreVertical, Plus, Edit, Trash2, Target } from 'lucide-react';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';

const CockpitVendedoresConfigPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [funis, setFunis] = useState([]);
  const [tiposSecao, setTiposSecao] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTiposModal, setShowTiposModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [editingTipo, setEditingTipo] = useState(null);
  const [novoTipoNome, setNovoTipoNome] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [formData, setFormData] = useState({
    vendedor_id_sprint: '',
    funil_id: '',
    tipo_secao: '',
    ordem_exibicao: 0,
    ativo: true
  });

  useEffect(() => {
    loadData();
  }, []);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configsData, vendedoresData, funisData, tiposData] = await Promise.all([
        getCockpitVendedoresConfig(),
        getVendedores(),
        getFunisPorUnidade(),
        getTiposSecao()
      ]);
      
      console.log('📊 Dados carregados:', {
        configs: configsData?.length || 0,
        vendedores: vendedoresData?.length || 0,
        funis: funisData?.length || 0,
        tiposSecao: tiposData?.length || 0
      });
      
      if (vendedoresData && vendedoresData.length > 0) {
        console.log('👥 Primeiro vendedor:', vendedoresData[0]);
      } else {
        console.warn('⚠️ Nenhum vendedor retornado!');
      }
      
      setConfigs(configsData || []);
      setVendedores(vendedoresData || []);
      setFunis(funisData || []);
      setTiposSecao(tiposData || []);
      
      // Se não há tipo selecionado no form, usar o primeiro disponível
      if (!formData.tipo_secao && tiposData && tiposData.length > 0) {
        setFormData(prev => ({ ...prev, tipo_secao: tiposData[0].nome }));
      } else if (tiposData && tiposData.length === 0) {
        // Se não há tipos, criar um padrão
        setFormData(prev => ({ ...prev, tipo_secao: '' }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (config = null) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        vendedor_id_sprint: config.vendedor_id_sprint,
        funil_id: config.funil_id,
        tipo_secao: config.tipo_secao,
        ordem_exibicao: config.ordem_exibicao,
        ativo: config.ativo
      });
    } else {
      setEditingConfig(null);
      setFormData({
        vendedor_id_sprint: '',
        funil_id: '',
        tipo_secao: tiposSecao && tiposSecao.length > 0 ? tiposSecao[0].nome : '',
        ordem_exibicao: 0,
        ativo: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConfig(null);
    setFormData({
      vendedor_id_sprint: '',
      funil_id: '',
      tipo_secao: tiposSecao && tiposSecao.length > 0 ? tiposSecao[0].nome : '',
      ordem_exibicao: 0,
      ativo: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingConfig) {
        await updateCockpitVendedoresConfig(editingConfig.id, formData);
        alert('Configuração atualizada com sucesso!');
      } else {
        await createCockpitVendedoresConfig(formData);
        alert('Configuração criada com sucesso!');
      }
      
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir esta configuração?')) {
      return;
    }

    try {
      await deleteCockpitVendedoresConfig(id);
      alert('Configuração excluída com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir configuração:', error);
      alert('Erro ao excluir configuração: ' + error.message);
    }
  };

  const getVendedorNome = (vendedorIdSprint) => {
    const vendedor = vendedores.find(v => v.id_sprint === vendedorIdSprint);
    return vendedor?.nome || `ID: ${vendedorIdSprint}`;
  };

  const getFunilNome = (funilId) => {
    const funil = funis.find(f => f.id_funil_sprint === funilId);
    return funil?.nome_funil || `ID: ${funilId}`;
  };

  const getTipoSecaoLabel = (tipo) => {
    const tipoObj = tiposSecao.find(t => t.nome === tipo);
    return tipoObj?.label || tipo;
  };

  const handleOpenTiposModal = (tipo = null) => {
    if (tipo) {
      setEditingTipo(tipo);
      setNovoTipoNome(tipo.label);
    } else {
      setEditingTipo(null);
      setNovoTipoNome('');
    }
    setShowTiposModal(true);
  };

  const handleCloseTiposModal = () => {
    setShowTiposModal(false);
    setEditingTipo(null);
    setNovoTipoNome('');
  };

  const handleSubmitTipo = async (e) => {
    e.preventDefault();
    
    if (!novoTipoNome.trim()) {
      alert('Por favor, informe o nome do tipo de seção');
      return;
    }

    try {
      // Gerar nome único a partir do label (remover acentos, espaços, etc)
      const nomeUnico = novoTipoNome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      if (editingTipo) {
        // Ao editar, NÃO mudar o nome (é a chave de referência nas configurações), apenas o label
        await updateTipoSecao(editingTipo.id, {
          label: novoTipoNome,
          ordem: editingTipo.ordem
          // Não incluir 'nome' para não quebrar as referências nas configurações
        });
        alert('Tipo de seção atualizado com sucesso!');
      } else {
        // Verificar se já existe
        const existe = tiposSecao.find(t => t.nome === nomeUnico || t.label.toLowerCase() === novoTipoNome.toLowerCase());
        if (existe) {
          alert('Já existe um tipo de seção com esse nome ou label!');
          return;
        }
        
        const maxOrdem = tiposSecao.length > 0 
          ? Math.max(...tiposSecao.map(t => t.ordem || 0)) + 1 
          : 0;
        
        await createTipoSecao({
          nome: nomeUnico,
          label: novoTipoNome,
          ordem: maxOrdem,
          ativo: true
        });
        alert('Tipo de seção criado com sucesso!');
      }
      
      handleCloseTiposModal();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar tipo de seção:', error);
      alert('Erro ao salvar tipo de seção: ' + error.message);
    }
  };

  const handleDeleteTipo = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de seção? As configurações que usam este tipo não serão excluídas, mas podem precisar ser atualizadas.')) {
      return;
    }

    try {
      await deleteTipoSecao(id);
      alert('Tipo de seção excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir tipo de seção:', error);
      alert('Erro ao excluir tipo de seção: ' + error.message);
    }
  };

  // Agrupar configurações por tipo de seção dinamicamente
  const configsPorSecao = tiposSecao.reduce((acc, tipo) => {
    acc[tipo.nome] = configs.filter(c => c.tipo_secao === tipo.nome);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="cockpit-vendedores-config-page">
        <div className="cockpit-vendedores-config-container">
          <div className="cockpit-vendedores-config-loading">
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cockpit-vendedores-config-page">
      <div className="cockpit-vendedores-config-container">
        {/* Header similar ao CockpitVendedores */}
        <div className="cockpit-vendedores-config-page-header">
          <div className="cockpit-vendedores-config-header-left">
            <img src={LogoOficialmed} alt="OficialMed" className="cockpit-vendedores-config-logo" />
          </div>
          <div className="cockpit-vendedores-config-header-center">
            <h1 className="cockpit-vendedores-config-page-titulo">Configuração - Cockpit Vendedores</h1>
            <div className="cockpit-vendedores-config-page-descricao">
              Gerencie os vendedores e funis exibidos no Cockpit de Vendedores. Configure quais vendedores aparecem em cada seção e sua ordem de exibição.
            </div>
          </div>
          <div className="cockpit-vendedores-config-header-right">
            <div className="cockpit-vendedores-config-menu-container" ref={menuRef}>
              <button 
                className="cockpit-vendedores-config-menu-trigger"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Menu de navegação"
              >
                <MoreVertical size={20} />
              </button>
              {showMenu && (
                <div className="cockpit-vendedores-config-menu-dropdown">
                  <button 
                    className="cockpit-vendedores-config-menu-item"
                    onClick={() => {
                      navigate('/cockpit-vendedores');
                      setShowMenu(false);
                    }}
                  >
                    <LayoutDashboard size={18} />
                    <span>Cockpit de Vendedores</span>
                  </button>
                  <button 
                    className="cockpit-vendedores-config-menu-item active"
                    onClick={() => setShowMenu(false)}
                  >
                    <Settings size={18} />
                    <span>Área Administrativa</span>
                  </button>
                  <button 
                    className="cockpit-vendedores-config-menu-item"
                    onClick={() => {
                      navigate('/cockpit-metas-vendedores');
                      setShowMenu(false);
                    }}
                  >
                    <Target size={18} />
                    <span>Metas Diárias</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="cockpit-vendedores-config-actions-header">
          <button 
            className="cockpit-vendedores-config-btn-add"
            onClick={() => handleOpenTiposModal()}
          >
            + Gerenciar Tipos de Seção
          </button>
          <button 
            className="cockpit-vendedores-config-btn-add"
            onClick={() => handleOpenModal()}
          >
            + Adicionar Configuração
          </button>
        </div>

        {/* Seção de Gerenciamento de Tipos */}
        {tiposSecao.map(tipo => {
          const configsTipo = configsPorSecao[tipo.nome] || [];
          return (
            <div key={tipo.id} className="cockpit-vendedores-config-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>{tipo.label}</h2>
                <button
                  className="cockpit-vendedores-config-btn-edit"
                  onClick={() => handleOpenTiposModal(tipo)}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  <Edit size={14} style={{ marginRight: '4px' }} />
                  Editar Tipo
                </button>
              </div>
              <table className="cockpit-vendedores-config-table">
                <thead>
                  <tr>
                    <th>Ordem</th>
                    <th>Vendedor</th>
                    <th>Funil</th>
                    <th>Ativo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {configsTipo.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="cockpit-vendedores-config-empty">
                        Nenhuma configuração cadastrada para este tipo
                      </td>
                    </tr>
                  ) : (
                    configsTipo
                      .sort((a, b) => a.ordem_exibicao - b.ordem_exibicao)
                      .map(config => (
                        <tr key={config.id}>
                          <td>{config.ordem_exibicao}</td>
                          <td>{getVendedorNome(config.vendedor_id_sprint)}</td>
                          <td>{getFunilNome(config.funil_id)}</td>
                          <td>
                            <span className={`cockpit-vendedores-config-status ${config.ativo ? 'ativo' : 'inativo'}`}>
                              {config.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="cockpit-vendedores-config-actions">
                            <button 
                              className="cockpit-vendedores-config-btn-edit"
                              onClick={() => handleOpenModal(config)}
                            >
                              Editar
                            </button>
                            <button 
                              className="cockpit-vendedores-config-btn-delete"
                              onClick={() => handleDelete(config.id)}
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          );
        })}
        
        {tiposSecao.length === 0 && (
          <div className="cockpit-vendedores-config-section">
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
              Nenhum tipo de seção cadastrado. Clique em "Gerenciar Tipos de Seção" para criar o primeiro.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
          <div className="cockpit-vendedores-config-modal-overlay" onClick={handleCloseModal}>
            <div className="cockpit-vendedores-config-modal" onClick={(e) => e.stopPropagation()}>
              <div className="cockpit-vendedores-config-modal-header">
                <h2>{editingConfig ? 'Editar' : 'Nova'} Configuração</h2>
                <button 
                  className="cockpit-vendedores-config-modal-close"
                  onClick={handleCloseModal}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="cockpit-vendedores-config-form">
                <div className="cockpit-vendedores-config-form-group">
                  <label>Vendedor *</label>
                  <select
                    value={formData.vendedor_id_sprint}
                    onChange={(e) => setFormData({ ...formData, vendedor_id_sprint: parseInt(e.target.value) })}
                    required
                  >
                    <option value="">Selecione um vendedor</option>
                    {vendedores && vendedores.length > 0 ? (
                      vendedores
                        .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
                        .map(v => (
                          <option key={v.id_sprint} value={v.id_sprint}>
                            {v.nome} (ID: {v.id_sprint})
                          </option>
                        ))
                    ) : (
                      <option value="" disabled>
                        {loading ? 'Carregando vendedores...' : 'Nenhum vendedor encontrado'}
                      </option>
                    )}
                  </select>
                  {vendedores && vendedores.length > 0 && (
                    <small>{vendedores.length} vendedor(es) disponível(is)</small>
                  )}
                </div>

                <div className="cockpit-vendedores-config-form-group">
                  <label>Funil *</label>
                  <select
                    value={formData.funil_id}
                    onChange={(e) => setFormData({ ...formData, funil_id: parseInt(e.target.value) })}
                    required
                  >
                    <option value="">Selecione um funil</option>
                    {funis.map(f => (
                      <option key={f.id_funil_sprint} value={f.id_funil_sprint}>
                        {f.nome_funil} (ID: {f.id_funil_sprint})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cockpit-vendedores-config-form-group">
                  <label>Tipo de Seção *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <select
                      value={formData.tipo_secao}
                      onChange={(e) => setFormData({ ...formData, tipo_secao: e.target.value })}
                      required
                      style={{ flex: 1 }}
                    >
                      <option value="">Selecione um tipo</option>
                      {tiposSecao
                        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                        .map(tipo => (
                          <option key={tipo.id} value={tipo.nome}>
                            {tipo.label}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setTimeout(() => handleOpenTiposModal(), 100);
                      }}
                      className="cockpit-vendedores-config-btn-add"
                      style={{ padding: '10px', minWidth: 'auto', fontSize: '12px' }}
                      title="Gerenciar tipos de seção"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="cockpit-vendedores-config-form-group">
                  <label>Ordem de Exibição *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ordem_exibicao}
                    onChange={(e) => setFormData({ ...formData, ordem_exibicao: parseInt(e.target.value) || 0 })}
                    required
                  />
                  <small>Menor número aparece primeiro</small>
                </div>

                <div className="cockpit-vendedores-config-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    />
                    Ativo
                  </label>
                </div>

                <div className="cockpit-vendedores-config-form-actions">
                  <button 
                    type="button"
                    className="cockpit-vendedores-config-btn-cancel"
                    onClick={handleCloseModal}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="cockpit-vendedores-config-btn-save"
                  >
                    {editingConfig ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
      )}

      {/* Modal de Gerenciamento de Tipos de Seção */}
      {showTiposModal && (
          <div className="cockpit-vendedores-config-modal-overlay" onClick={handleCloseTiposModal}>
            <div className="cockpit-vendedores-config-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="cockpit-vendedores-config-modal-header">
                <h2>{editingTipo ? 'Editar' : 'Novo'} Tipo de Seção</h2>
                <button 
                  className="cockpit-vendedores-config-modal-close"
                  onClick={handleCloseTiposModal}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmitTipo} className="cockpit-vendedores-config-form">
                <div className="cockpit-vendedores-config-form-group">
                  <label>Nome do Tipo de Seção *</label>
                  <input
                    type="text"
                    value={novoTipoNome}
                    onChange={(e) => setNovoTipoNome(e.target.value)}
                    placeholder="Ex: Compra / Primeira Venda"
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--card-soft)', color: 'var(--text)' }}
                  />
                  <small>Este nome será exibido nas seções do cockpit</small>
                </div>

                <div className="cockpit-vendedores-config-form-actions">
                  <button 
                    type="button"
                    className="cockpit-vendedores-config-btn-cancel"
                    onClick={handleCloseTiposModal}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="cockpit-vendedores-config-btn-save"
                  >
                    {editingTipo ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>

              {/* Lista de tipos existentes */}
              <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border)', marginTop: '24px', paddingTop: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--text)', fontSize: '16px' }}>Tipos de Seção Cadastrados</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tiposSecao
                    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                    .map(tipo => (
                      <div 
                        key={tipo.id} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '12px',
                          background: 'var(--card-soft)',
                          borderRadius: '6px',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div>
                          <div style={{ color: 'var(--text)', fontWeight: '500' }}>{tipo.label}</div>
                          <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Nome: {tipo.nome}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="cockpit-vendedores-config-btn-edit"
                            onClick={() => {
                              setEditingTipo(tipo);
                              setNovoTipoNome(tipo.label);
                            }}
                            style={{ padding: '6px 10px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="cockpit-vendedores-config-btn-delete"
                            onClick={() => handleDeleteTipo(tipo.id)}
                            style={{ padding: '6px 10px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {tiposSecao.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                      Nenhum tipo cadastrado
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default CockpitVendedoresConfigPage;

