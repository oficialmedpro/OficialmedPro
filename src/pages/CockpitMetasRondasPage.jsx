import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CockpitMetasRondasPage.css';
import { 
  getMetasRondas, 
  createMetaRonda, 
  updateMetaRonda, 
  deleteMetaRonda,
  getTiposMetas,
  createTipoMeta,
  updateTipoMeta,
  deleteTipoMeta,
  getNomesMetas,
  createNomeMeta,
  updateNomeMeta,
  deleteNomeMeta,
  getCockpitVendedoresConfig
} from '../service/supabase';
import { getVendedores } from '../service/FilterBarService';
import { LayoutDashboard, Settings, MoreVertical, Edit, Trash2, Plus, Target } from 'lucide-react';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';

const CockpitMetasRondasPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [metas, setMetas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [tiposMetas, setTiposMetas] = useState([]);
  const [nomesMetas, setNomesMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTiposModal, setShowTiposModal] = useState(false);
  const [showNomesModal, setShowNomesModal] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [editingTipo, setEditingTipo] = useState(null);
  const [editingNome, setEditingNome] = useState(null);
  const [novoTipoNome, setNovoTipoNome] = useState('');
  const [novoTipoLabel, setNovoTipoLabel] = useState('');
  const [novoNomeMeta, setNovoNomeMeta] = useState('');
  const [novoNomeLabel, setNovoNomeLabel] = useState('');
  const [novoNomeIsPercentual, setNovoNomeIsPercentual] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [formData, setFormData] = useState({
    vendedor_id_sprint: '',
    nome_meta: 'Entrada',
    tipo_meta: 'ronda_semanal',
    valor_meta: '',
    horario: '10h',
    dia_semana: 'seg_sex',
    ativo: true
  });

  const horariosSegSex = ['10h', '12h', '16h', '18h'];
  const horariosSabado = ['10h', '12h'];

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
      const [metasData, vendedoresData, tiposData, nomesData, configsData] = await Promise.all([
        getMetasRondas(),
        getVendedores(),
        getTiposMetas(),
        getNomesMetas(),
        getCockpitVendedoresConfig()
      ]);
      
      // Filtrar apenas vendedores que estão configurados no cockpit
      const configsAtivas = (configsData || []).filter(c => c.ativo);
      const idsVendedoresConfigurados = [...new Set(configsAtivas.map(c => c.vendedor_id_sprint))];
      const vendedoresConfigurados = (vendedoresData || []).filter(v => 
        idsVendedoresConfigurados.includes(v.id_sprint)
      );
      
      console.log('📊 Dados carregados:', {
        metas: metasData?.length || 0,
        vendedores: vendedoresConfigurados?.length || 0,
        tipos: tiposData?.length || 0,
        nomes: nomesData?.length || 0
      });
      
      setMetas(metasData || []);
      setVendedores(vendedoresConfigurados);
      setTiposMetas(tiposData || []);
      setNomesMetas(nomesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (meta = null, diaSemana = 'seg_sex') => {
    if (meta && meta.id) {
      // Editando meta existente
      setEditingMeta(meta);
      setFormData({
        vendedor_id_sprint: meta.vendedor_id_sprint,
        nome_meta: meta.nome_meta,
        tipo_meta: meta.tipo_meta || (meta.dia_semana === 'sabado' ? 'ronda_sabado' : 'ronda_semanal'),
        valor_meta: meta.valor_meta ? meta.valor_meta.toString() : '',
        horario: meta.horario,
        dia_semana: meta.dia_semana || 'seg_sex',
        ativo: meta.ativo !== undefined ? meta.ativo : true
      });
    } else {
      // Nova meta (pode ter dados pré-preenchidos)
      setEditingMeta(null);
      const nomePadrao = meta?.nome_meta || (nomesMetas.length > 0 ? nomesMetas[0].nome : 'Entrada');
      const tipoMeta = diaSemana === 'sabado' ? 'ronda_sabado' : 'ronda_semanal';
      const horarioPadrao = diaSemana === 'sabado' ? '10h' : '10h';
      setFormData({
        vendedor_id_sprint: meta?.vendedor_id_sprint || '',
        nome_meta: nomePadrao,
        tipo_meta: tipoMeta,
        valor_meta: meta?.valor_meta || '',
        horario: meta?.horario || horarioPadrao,
        dia_semana: diaSemana,
        ativo: meta?.ativo !== undefined ? meta.ativo : true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMeta(null);
    const nomePadrao = nomesMetas.length > 0 ? nomesMetas[0].nome : 'Entrada';
    setFormData({
      vendedor_id_sprint: '',
      nome_meta: nomePadrao,
      tipo_meta: 'ronda_semanal',
      valor_meta: '',
      horario: '10h',
      dia_semana: 'seg_sex',
      ativo: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const metaData = {
        ...formData,
        valor_meta: parseFloat(formData.valor_meta) || 0
      };

      if (editingMeta) {
        await updateMetaRonda(editingMeta.id, metaData);
        alert('Meta atualizada com sucesso!');
      } else {
        await createMetaRonda(metaData);
        alert('Meta criada com sucesso!');
      }
      
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      alert('Erro ao salvar meta: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir esta meta?')) {
      return;
    }

    try {
      await deleteMetaRonda(id);
      alert('Meta excluída com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      alert('Erro ao excluir meta: ' + error.message);
    }
  };

  // Funções para gerenciar Tipos de Metas
  const handleOpenTiposModal = (tipo = null) => {
    if (tipo) {
      setEditingTipo(tipo);
      setNovoTipoNome(tipo.nome);
      setNovoTipoLabel(tipo.label);
    } else {
      setEditingTipo(null);
      setNovoTipoNome('');
      setNovoTipoLabel('');
    }
    setShowTiposModal(true);
  };

  const handleCloseTiposModal = () => {
    setShowTiposModal(false);
    setEditingTipo(null);
    setNovoTipoNome('');
    setNovoTipoLabel('');
  };

  const handleSubmitTipo = async (e) => {
    e.preventDefault();
    
    if (!novoTipoLabel.trim()) {
      alert('Por favor, informe o label do tipo de meta');
      return;
    }

    try {
      if (editingTipo) {
        await updateTipoMeta(editingTipo.id, {
          label: novoTipoLabel,
          ordem: editingTipo.ordem
        });
        alert('Tipo de meta atualizado com sucesso!');
      } else {
        const nomeUnico = novoTipoNome.trim() || novoTipoLabel
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        
        const existe = tiposMetas.find(t => t.nome === nomeUnico || t.label.toLowerCase() === novoTipoLabel.toLowerCase());
        if (existe) {
          alert('Já existe um tipo de meta com esse nome ou label!');
          return;
        }
        
        const maxOrdem = tiposMetas.length > 0 
          ? Math.max(...tiposMetas.map(t => t.ordem || 0)) + 1 
          : 0;
        
        await createTipoMeta({
          nome: nomeUnico,
          label: novoTipoLabel,
          ordem: maxOrdem,
          ativo: true
        });
        alert('Tipo de meta criado com sucesso!');
      }
      
      handleCloseTiposModal();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar tipo de meta:', error);
      alert('Erro ao salvar tipo de meta: ' + error.message);
    }
  };

  const handleDeleteTipo = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de meta? As metas que usam este tipo precisarão ser atualizadas.')) {
      return;
    }

    try {
      await deleteTipoMeta(id);
      alert('Tipo de meta excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir tipo de meta:', error);
      alert('Erro ao excluir tipo de meta: ' + error.message);
    }
  };

  // Funções para gerenciar Nomes de Metas
  const handleOpenNomesModal = (nome = null) => {
    if (nome) {
      setEditingNome(nome);
      setNovoNomeMeta(nome.nome);
      setNovoNomeLabel(nome.label);
      setNovoNomeIsPercentual(nome.is_percentual || false);
    } else {
      setEditingNome(null);
      setNovoNomeMeta('');
      setNovoNomeLabel('');
      setNovoNomeIsPercentual(false);
    }
    setShowNomesModal(true);
  };

  const handleCloseNomesModal = () => {
    setShowNomesModal(false);
    setEditingNome(null);
    setNovoNomeMeta('');
    setNovoNomeLabel('');
    setNovoNomeIsPercentual(false);
  };

  const handleSubmitNome = async (e) => {
    e.preventDefault();
    
    if (!novoNomeLabel.trim()) {
      alert('Por favor, informe o label do nome de meta');
      return;
    }

    try {
      if (editingNome) {
        await updateNomeMeta(editingNome.id, {
          label: novoNomeLabel,
          is_percentual: novoNomeIsPercentual,
          ordem: editingNome.ordem
        });
        alert('Nome de meta atualizado com sucesso!');
      } else {
        const nomeUnico = novoNomeMeta.trim() || novoNomeLabel
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        
        const existe = nomesMetas.find(n => n.nome === nomeUnico || n.label.toLowerCase() === novoNomeLabel.toLowerCase());
        if (existe) {
          alert('Já existe um nome de meta com esse nome ou label!');
          return;
        }
        
        const maxOrdem = nomesMetas.length > 0 
          ? Math.max(...nomesMetas.map(n => n.ordem || 0)) + 1 
          : 0;
        
        await createNomeMeta({
          nome: nomeUnico,
          label: novoNomeLabel,
          is_percentual: novoNomeIsPercentual,
          ordem: maxOrdem,
          ativo: true
        });
        alert('Nome de meta criado com sucesso!');
      }
      
      handleCloseNomesModal();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar nome de meta:', error);
      alert('Erro ao salvar nome de meta: ' + error.message);
    }
  };

  const handleDeleteNome = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este nome de meta? As metas que usam este nome precisarão ser atualizadas.')) {
      return;
    }

    try {
      await deleteNomeMeta(id);
      alert('Nome de meta excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir nome de meta:', error);
      alert('Erro ao excluir nome de meta: ' + error.message);
    }
  };

  const getVendedorNome = (vendedorIdSprint) => {
    const vendedor = vendedores.find(v => v.id_sprint === vendedorIdSprint);
    return vendedor?.nome || `ID: ${vendedorIdSprint}`;
  };

  // Agrupar metas por vendedor
  const metasPorVendedor = vendedores.reduce((acc, vendedor) => {
    const metasVendedor = metas.filter(m => m.vendedor_id_sprint === vendedor.id_sprint);
    if (metasVendedor.length > 0 || true) { // Mostrar todos os vendedores mesmo sem metas
      acc[vendedor.id_sprint] = {
        vendedor: vendedor,
        metas: metasVendedor
      };
    }
    return acc;
  }, {});

  // Usar nomes de metas do banco ou fallback
  const nomesMetasParaExibicao = nomesMetas.length > 0 
    ? nomesMetas.map(n => n.nome)
    : ['Entrada', 'Orçamentos', 'Vendas', 'Valor', 'Ticket_Medio', 'Conversão'];

  if (loading) {
    return (
      <div className="cockpit-metas-rondas-page">
        <div className="cockpit-metas-rondas-container">
          <div className="cockpit-metas-rondas-loading">
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cockpit-metas-rondas-page">
      <div className="cockpit-metas-rondas-container">
        {/* Header */}
        <div className="cockpit-metas-rondas-page-header">
          <div className="cockpit-metas-rondas-header-left">
            <img src={LogoOficialmed} alt="OficialMed" className="cockpit-metas-rondas-logo" />
          </div>
          <div className="cockpit-metas-rondas-header-center">
            <h1 className="cockpit-metas-rondas-page-titulo">Metas por Ronda - Cockpit Vendedores</h1>
            <div className="cockpit-metas-rondas-page-descricao">
              Configure as metas por ronda (horário) de cada vendedor. As metas podem ser diferentes para cada horário (10h, 12h, 16h, 18h).
            </div>
          </div>
          <div className="cockpit-metas-rondas-header-right">
            <div className="cockpit-metas-rondas-menu-container" ref={menuRef}>
              <button 
                className="cockpit-metas-rondas-menu-trigger"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Menu de navegação"
              >
                <MoreVertical size={20} />
              </button>
              {showMenu && (
                <div className="cockpit-metas-rondas-menu-dropdown">
                  <button 
                    className="cockpit-metas-rondas-menu-item"
                    onClick={() => {
                      navigate('/cockpit-vendedores');
                      setShowMenu(false);
                    }}
                  >
                    <LayoutDashboard size={18} />
                    <span>Cockpit de Vendedores</span>
                  </button>
                  <button 
                    className="cockpit-metas-rondas-menu-item"
                    onClick={() => {
                      navigate('/cockpit-vendedores-config');
                      setShowMenu(false);
                    }}
                  >
                    <Settings size={18} />
                    <span>Configuração</span>
                  </button>
                  <button 
                    className="cockpit-metas-rondas-menu-item"
                    onClick={() => {
                      navigate('/cockpit-metas-vendedores');
                      setShowMenu(false);
                    }}
                  >
                    <Target size={18} />
                    <span>Metas Diárias</span>
                  </button>
                  <button 
                    className="cockpit-metas-rondas-menu-item active"
                    onClick={() => setShowMenu(false)}
                  >
                    <Target size={18} />
                    <span>Metas por Ronda</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="cockpit-metas-rondas-actions-header">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="cockpit-metas-rondas-btn-add"
              onClick={() => setShowTiposModal(true)}
            >
              + Gerenciar Tipos de Metas
            </button>
            <button 
              className="cockpit-metas-rondas-btn-add"
              onClick={() => setShowNomesModal(true)}
            >
              + Gerenciar Nomes de Metas
            </button>
          </div>
          <button 
            className="cockpit-metas-rondas-btn-add"
            onClick={() => handleOpenModal()}
          >
            + Adicionar Meta
          </button>
        </div>

        {/* Lista de vendedores com suas metas */}
        <div className="cockpit-metas-rondas-sections">
          {Object.values(metasPorVendedor).map(({ vendedor, metas: metasVendedor }) => {
            const renderTabela = (diaSemana, horariosLista, titulo) => {
              const metasFiltradas = metasVendedor.filter(m => m.dia_semana === diaSemana);
              return (
                <div key={`${vendedor.id_sprint}-${diaSemana}`} style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text)' }}>{titulo}</h3>
                  <table className="cockpit-metas-rondas-table">
                    <thead>
                      <tr>
                        <th>Nome da Meta</th>
                        <th>Tipo</th>
                        {horariosLista.map(h => <th key={h}>{h}</th>)}
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nomesMetasParaExibicao.map(nomeMeta => {
                        const nomeMetaObj = nomesMetas.find(n => n.nome === nomeMeta);
                        const isPercentual = nomeMetaObj?.is_percentual || nomeMeta === 'Conversão';
                        const tipoMetaObj = metasFiltradas.find(m => m.nome_meta === nomeMeta);
                        const tipoLabel = tipoMetaObj 
                          ? tiposMetas.find(t => t.nome === tipoMetaObj.tipo_meta)?.label || tipoMetaObj.tipo_meta
                          : (diaSemana === 'sabado' ? 'Ronda Sábado' : 'Ronda Semanal');
                        
                        return (
                          <tr key={nomeMeta}>
                            <td>{nomeMetaObj?.label || nomeMeta}</td>
                            <td>{tipoLabel}</td>
                            {horariosLista.map(horario => {
                              const metaHorario = metasFiltradas.find(m => m.nome_meta === nomeMeta && m.horario === horario);
                              
                              return (
                                <td key={horario}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                                    {metaHorario ? (
                                      <span className="cockpit-metas-rondas-valor">
                                        {isPercentual ? `${metaHorario.valor_meta}%` : metaHorario.valor_meta}
                                      </span>
                                    ) : (
                                      <span className="cockpit-metas-rondas-sem-meta">—</span>
                                    )}
                                    <button
                                      className="cockpit-metas-rondas-btn-edit"
                                      onClick={() => {
                                        if (metaHorario) {
                                          handleOpenModal(metaHorario);
                                        } else {
                                          const novaMeta = {
                                            vendedor_id_sprint: vendedor.id_sprint,
                                            nome_meta: nomeMeta,
                                            tipo_meta: diaSemana === 'sabado' ? 'ronda_sabado' : 'ronda_semanal',
                                            valor_meta: '',
                                            horario: horario,
                                            dia_semana: diaSemana,
                                            ativo: true
                                          };
                                          handleOpenModal(novaMeta, diaSemana);
                                        }
                                      }}
                                      title={metaHorario ? `Editar meta ${horario}` : `Adicionar meta ${horario}`}
                                      style={{ padding: '4px 8px', fontSize: '12px' }}
                                    >
                                      {metaHorario ? <Edit size={12} /> : <Plus size={12} />}
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="cockpit-metas-rondas-actions">
                              {horariosLista.map(horario => {
                                const metaHorario = metasFiltradas.find(m => m.nome_meta === nomeMeta && m.horario === horario);
                                return metaHorario ? (
                                  <button
                                    key={horario}
                                    className="cockpit-metas-rondas-btn-delete"
                                    onClick={() => handleDelete(metaHorario.id)}
                                    title={`Excluir meta ${horario}`}
                                    style={{ padding: '4px 6px', marginRight: '4px' }}
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                ) : null;
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            };

            return (
              <div key={vendedor.id_sprint} className="cockpit-metas-rondas-section">
                <h2>{vendedor.nome}</h2>
                
                {renderTabela('seg_sex', horariosSegSex, 'Rondas - Segunda a Sexta (10h, 12h, 16h, 18h)')}
                {renderTabela('sabado', horariosSabado, 'Rondas - Sábado (10h, 12h)')}
              </div>
            );
          })}
          
          {Object.keys(metasPorVendedor).length === 0 && (
            <div className="cockpit-metas-rondas-section">
              <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                Nenhuma meta cadastrada. Clique em "Adicionar Meta" para criar a primeira.
              </p>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="cockpit-metas-rondas-modal-overlay" onClick={handleCloseModal}>
            <div className="cockpit-metas-rondas-modal" onClick={(e) => e.stopPropagation()}>
              <div className="cockpit-metas-rondas-modal-header">
                <h2>{editingMeta ? 'Editar' : 'Nova'} Meta por Ronda</h2>
                <button 
                  className="cockpit-metas-rondas-modal-close"
                  onClick={handleCloseModal}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="cockpit-metas-rondas-form">
                <div className="cockpit-metas-rondas-form-group">
                  <label>Vendedor *</label>
                  <select
                    value={formData.vendedor_id_sprint}
                    onChange={(e) => setFormData({ ...formData, vendedor_id_sprint: parseInt(e.target.value) })}
                    required
                  >
                    <option value="">Selecione um vendedor</option>
                    {vendedores
                      .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
                      .map(v => (
                        <option key={v.id_sprint} value={v.id_sprint}>
                          {v.nome} (ID: {v.id_sprint})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>Nome da Meta *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <select
                      value={formData.nome_meta}
                      onChange={(e) => setFormData({ ...formData, nome_meta: e.target.value })}
                      required
                      style={{ flex: 1 }}
                    >
                      <option value="">Selecione um nome</option>
                      {nomesMetas
                        .filter(n => n.ativo)
                        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                        .map(nome => (
                          <option key={nome.id} value={nome.nome}>
                            {nome.label}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setTimeout(() => setShowNomesModal(true), 100);
                      }}
                      className="cockpit-metas-rondas-btn-add"
                      style={{ padding: '10px', minWidth: 'auto', fontSize: '12px' }}
                      title="Gerenciar nomes de metas"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>Tipo de Meta *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <select
                      value={formData.tipo_meta}
                      onChange={(e) => setFormData({ ...formData, tipo_meta: e.target.value })}
                      required
                      style={{ flex: 1 }}
                    >
                      <option value="">Selecione um tipo</option>
                      {tiposMetas
                        .filter(t => t.ativo)
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
                        setTimeout(() => setShowTiposModal(true), 100);
                      }}
                      className="cockpit-metas-rondas-btn-add"
                      style={{ padding: '10px', minWidth: 'auto', fontSize: '12px' }}
                      title="Gerenciar tipos de metas"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>Dia da Semana *</label>
                  <select
                    value={formData.dia_semana}
                    onChange={(e) => {
                      const novoDia = e.target.value;
                      const novoTipo = novoDia === 'sabado' ? 'ronda_sabado' : 'ronda_semanal';
                      const horariosDisponiveis = novoDia === 'sabado' ? horariosSabado : horariosSegSex;
                      setFormData({ 
                        ...formData, 
                        dia_semana: novoDia,
                        tipo_meta: novoTipo,
                        horario: horariosDisponiveis.includes(formData.horario) ? formData.horario : horariosDisponiveis[0]
                      });
                    }}
                    required
                  >
                    <option value="seg_sex">Segunda a Sexta</option>
                    <option value="sabado">Sábado</option>
                  </select>
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>Horário da Ronda *</label>
                  <select
                    value={formData.horario}
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                    required
                  >
                    {(formData.dia_semana === 'sabado' ? horariosSabado : horariosSegSex).map(horario => (
                      <option key={horario} value={horario}>{horario}</option>
                    ))}
                  </select>
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>
                    Valor da Meta * {
                      nomesMetas.find(n => n.nome === formData.nome_meta)?.is_percentual 
                        ? '(em %)' 
                        : ''}
                  </label>
                  <input
                    type="number"
                    step={nomesMetas.find(n => n.nome === formData.nome_meta)?.is_percentual ? '0.1' : '1'}
                    min="0"
                    max={nomesMetas.find(n => n.nome === formData.nome_meta)?.is_percentual ? '100' : undefined}
                    value={formData.valor_meta}
                    onChange={(e) => setFormData({ ...formData, valor_meta: e.target.value })}
                    placeholder={nomesMetas.find(n => n.nome === formData.nome_meta)?.is_percentual ? 'Ex: 15' : 'Ex: 75'}
                    required
                  />
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    />
                    Ativo
                  </label>
                </div>

                <div className="cockpit-metas-rondas-form-actions">
                  <button 
                    type="button"
                    className="cockpit-metas-rondas-btn-cancel"
                    onClick={handleCloseModal}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="cockpit-metas-rondas-btn-save"
                  >
                    {editingMeta ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Tipos de Metas */}
        {showTiposModal && (
          <div className="cockpit-metas-rondas-modal-overlay" onClick={handleCloseTiposModal}>
            <div className="cockpit-metas-rondas-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="cockpit-metas-rondas-modal-header">
                <h2>{editingTipo ? 'Editar' : 'Novo'} Tipo de Meta</h2>
                <button 
                  className="cockpit-metas-rondas-modal-close"
                  onClick={handleCloseTiposModal}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmitTipo} className="cockpit-metas-rondas-form">
                <div className="cockpit-metas-rondas-form-group">
                  <label>Nome Único (chave) *</label>
                  <input
                    type="text"
                    value={novoTipoNome}
                    onChange={(e) => setNovoTipoNome(e.target.value)}
                    placeholder="Ex: diaria, semanal, mensal"
                    disabled={!!editingTipo}
                    required={!editingTipo}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: editingTipo ? 'var(--card-soft)' : 'var(--card-soft)', color: 'var(--text)' }}
                  />
                  <small>Usado como chave no banco (não pode ser alterado ao editar)</small>
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>Label (exibição) *</label>
                  <input
                    type="text"
                    value={novoTipoLabel}
                    onChange={(e) => setNovoTipoLabel(e.target.value)}
                    placeholder="Ex: Diária, Semanal, Mensal"
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--card-soft)', color: 'var(--text)' }}
                  />
                  <small>Nome exibido nos formulários</small>
                </div>

                <div className="cockpit-metas-rondas-form-actions">
                  <button 
                    type="button"
                    className="cockpit-metas-rondas-btn-cancel"
                    onClick={handleCloseTiposModal}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="cockpit-metas-rondas-btn-save"
                  >
                    {editingTipo ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>

              {/* Lista de tipos existentes */}
              <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border)', marginTop: '24px', paddingTop: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--text)', fontSize: '16px' }}>Tipos de Metas Cadastrados</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tiposMetas
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
                            className="cockpit-metas-rondas-btn-edit"
                            onClick={() => handleOpenTiposModal(tipo)}
                            style={{ padding: '6px 10px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="cockpit-metas-rondas-btn-delete"
                            onClick={() => handleDeleteTipo(tipo.id)}
                            style={{ padding: '6px 10px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {tiposMetas.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                      Nenhum tipo cadastrado
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Nomes de Metas */}
        {showNomesModal && (
          <div className="cockpit-metas-rondas-modal-overlay" onClick={handleCloseNomesModal}>
            <div className="cockpit-metas-rondas-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="cockpit-metas-rondas-modal-header">
                <h2>{editingNome ? 'Editar' : 'Novo'} Nome de Meta</h2>
                <button 
                  className="cockpit-metas-rondas-modal-close"
                  onClick={handleCloseNomesModal}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmitNome} className="cockpit-metas-rondas-form">
                <div className="cockpit-metas-rondas-form-group">
                  <label>Nome Único (chave) *</label>
                  <input
                    type="text"
                    value={novoNomeMeta}
                    onChange={(e) => setNovoNomeMeta(e.target.value)}
                    placeholder="Ex: entrada, orcamentos, vendas, conversao"
                    disabled={!!editingNome}
                    required={!editingNome}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: editingNome ? 'var(--card-soft)' : 'var(--card-soft)', color: 'var(--text)' }}
                  />
                  <small>Usado como chave no banco (não pode ser alterado ao editar)</small>
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>Label (exibição) *</label>
                  <input
                    type="text"
                    value={novoNomeLabel}
                    onChange={(e) => setNovoNomeLabel(e.target.value)}
                    placeholder="Ex: Entrada, Orçamentos, Vendas, Conversão"
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--card-soft)', color: 'var(--text)' }}
                  />
                  <small>Nome exibido nos formulários</small>
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={novoNomeIsPercentual}
                      onChange={(e) => setNovoNomeIsPercentual(e.target.checked)}
                    />
                    Meta em porcentagem (ex: Conversão)
                  </label>
                  <small>Se marcado, o valor será exibido com % e limitado a 0-100</small>
                </div>

                <div className="cockpit-metas-rondas-form-actions">
                  <button 
                    type="button"
                    className="cockpit-metas-rondas-btn-cancel"
                    onClick={handleCloseNomesModal}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="cockpit-metas-rondas-btn-save"
                  >
                    {editingNome ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>

              {/* Lista de nomes existentes */}
              <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border)', marginTop: '24px', paddingTop: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--text)', fontSize: '16px' }}>Nomes de Metas Cadastrados</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {nomesMetas
                    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                    .map(nome => (
                      <div 
                        key={nome.id} 
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
                          <div style={{ color: 'var(--text)', fontWeight: '500' }}>{nome.label}</div>
                          <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
                            Nome: {nome.nome} {nome.is_percentual && '• Percentual'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="cockpit-metas-rondas-btn-edit"
                            onClick={() => handleOpenNomesModal(nome)}
                            style={{ padding: '6px 10px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="cockpit-metas-rondas-btn-delete"
                            onClick={() => handleDeleteNome(nome.id)}
                            style={{ padding: '6px 10px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {nomesMetas.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                      Nenhum nome cadastrado
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CockpitMetasRondasPage;

