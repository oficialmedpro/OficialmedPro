import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CockpitMetasVendedoresPage.css';
import { 
  getMetasVendedores, 
  createMetaVendedor, 
  updateMetaVendedor, 
  deleteMetaVendedor,
  getTiposMetas,
  createTipoMeta,
  updateTipoMeta,
  deleteTipoMeta,
  getNomesMetas,
  createNomeMeta,
  updateNomeMeta,
  deleteNomeMeta
} from '../service/supabase';
import { getVendedores } from '../service/FilterBarService';
import { LayoutDashboard, Settings, MoreVertical, Edit, Trash2, Plus, Target } from 'lucide-react';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';

const CockpitMetasVendedoresPage = ({ onLogout }) => {
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
    tipo_meta: 'diaria',
    valor_meta: '',
    dia_semana: 'seg_sex',
    ativo: true
  });

  // Ref para manter a posição do scroll
  const scrollPositionRef = useRef(0);
  const containerRef = useRef(null);

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

  const loadData = async (preserveScroll = false) => {
    try {
      setLoading(true);
      
      // Salvar posição do scroll antes de recarregar (se preserveScroll for true)
      if (preserveScroll) {
        scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
      }
      
      const [metasData, vendedoresData, tiposData, nomesData] = await Promise.all([
        getMetasVendedores(),
        getVendedores(),
        getTiposMetas(),
        getNomesMetas()
      ]);
      
      console.log('📊 Dados carregados:', {
        metas: metasData?.length || 0,
        vendedores: vendedoresData?.length || 0,
        tipos: tiposData?.length || 0,
        nomes: nomesData?.length || 0
      });
      
      setMetas(metasData || []);
      setVendedores(vendedoresData || []);
      setTiposMetas(tiposData || []);
      setNomesMetas(nomesData || []);
      
      // Restaurar posição do scroll após atualizar os dados
      if (preserveScroll && scrollPositionRef.current > 0) {
        // Usar setTimeout com delay maior para garantir que o DOM foi completamente atualizado
        setTimeout(() => {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: 'instant'
          });
        }, 200);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (meta = null) => {
    if (meta && meta.id) {
      // Editando meta existente
      setEditingMeta(meta);
      setFormData({
        vendedor_id_sprint: meta.vendedor_id_sprint,
        nome_meta: meta.nome_meta,
        tipo_meta: meta.tipo_meta,
        valor_meta: meta.valor_meta ? meta.valor_meta.toString() : '',
        dia_semana: meta.dia_semana,
        ativo: meta.ativo !== undefined ? meta.ativo : true
      });
    } else {
      // Nova meta (pode ter dados pré-preenchidos)
      setEditingMeta(null);
      setFormData({
        vendedor_id_sprint: meta?.vendedor_id_sprint || '',
        nome_meta: meta?.nome_meta || 'Entrada',
        tipo_meta: meta?.tipo_meta || 'diaria',
        valor_meta: meta?.valor_meta || '',
        dia_semana: meta?.dia_semana || 'seg_sex',
        ativo: meta?.ativo !== undefined ? meta.ativo : true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMeta(null);
    const tipoPadrao = tiposMetas.length > 0 ? tiposMetas[0].nome : 'diaria';
    const nomePadrao = nomesMetas.length > 0 ? nomesMetas[0].nome : 'Entrada';
    setFormData({
      vendedor_id_sprint: '',
      nome_meta: nomePadrao,
      tipo_meta: tipoPadrao,
      valor_meta: '',
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

      // Salvar posição do scroll antes do alerta
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      
      if (editingMeta) {
        await updateMetaVendedor(editingMeta.id, metaData);
        alert('Meta atualizada com sucesso!');
      } else {
        await createMetaVendedor(metaData);
        alert('Meta criada com sucesso!');
      }
      
      handleCloseModal();
      
      // Restaurar scroll imediatamente após o alerta
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
        scrollPositionRef.current = scrollPos;
      }, 100);
      
      // Preservar scroll ao recarregar dados
      loadData(true);
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
      // Salvar posição do scroll antes do alerta
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      
      await deleteMetaVendedor(id);
      alert('Meta excluída com sucesso!');
      
      // Restaurar scroll imediatamente após o alerta
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
        scrollPositionRef.current = scrollPos;
      }, 100);
      
      // Preservar scroll ao recarregar dados
      loadData(true);
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
      // Salvar posição do scroll antes do alerta
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      
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
      
      // Restaurar scroll imediatamente após o alerta
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
        scrollPositionRef.current = scrollPos;
      }, 100);
      
      handleCloseTiposModal();
      loadData(true);
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
      // Salvar posição do scroll antes do alerta
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      
      await deleteTipoMeta(id);
      alert('Tipo de meta excluído com sucesso!');
      
      // Restaurar scroll imediatamente após o alerta
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
        scrollPositionRef.current = scrollPos;
      }, 100);
      
      loadData(true);
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
      // Salvar posição do scroll antes do alerta
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      
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
      
      // Restaurar scroll imediatamente após o alerta
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
        scrollPositionRef.current = scrollPos;
      }, 100);
      
      handleCloseNomesModal();
      loadData(true);
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
      // Salvar posição do scroll antes do alerta
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      
      await deleteNomeMeta(id);
      alert('Nome de meta excluído com sucesso!');
      
      // Restaurar scroll imediatamente após o alerta
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
        scrollPositionRef.current = scrollPos;
      }, 100);
      
      loadData(true);
    } catch (error) {
      console.error('Erro ao excluir nome de meta:', error);
      alert('Erro ao excluir nome de meta: ' + error.message);
    }
  };

  const getVendedorNome = (vendedorIdSprint) => {
    const vendedor = vendedores.find(v => v.id_sprint === vendedorIdSprint);
    return vendedor?.nome || `ID: ${vendedorIdSprint}`;
  };

  const getDiaSemanaLabel = (diaSemana) => {
    return diaSemana === 'seg_sex' ? 'Segunda a Sexta' : 'Sábado';
  };

  // Separar metas gerais (vendedor_id_sprint = 0)
  const metasGerais = metas.filter(m => m.vendedor_id_sprint === 0);

  // Agrupar metas por vendedor (excluindo metas gerais)
  const metasPorVendedor = vendedores.reduce((acc, vendedor) => {
    const metasVendedor = metas.filter(m => m.vendedor_id_sprint === vendedor.id_sprint);
    if (metasVendedor.length > 0) {
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
    : ['Entrada', 'Orçamentos', 'Vendas', 'Conversão'];

  if (loading) {
    return (
      <div className="cockpit-metas-vendedores-page">
        <div className="cockpit-metas-vendedores-container">
          <div className="cockpit-metas-vendedores-loading">
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cockpit-metas-vendedores-page">
      <div className="cockpit-metas-vendedores-container">
        {/* Header */}
        <div className="cockpit-metas-vendedores-page-header">
          <div className="cockpit-metas-vendedores-header-left">
            <img src={LogoOficialmed} alt="OficialMed" className="cockpit-metas-vendedores-logo" />
          </div>
          <div className="cockpit-metas-vendedores-header-center">
            <h1 className="cockpit-metas-vendedores-page-titulo">Metas Diárias - Cockpit Vendedores</h1>
            <div className="cockpit-metas-vendedores-page-descricao">
              Configure as metas diárias de cada vendedor. As metas podem ser diferentes para Segunda a Sexta e para Sábado. Domingos utilizam as metas de Sábado.
            </div>
          </div>
          <div className="cockpit-metas-vendedores-header-right">
            <div className="cockpit-metas-vendedores-menu-container" ref={menuRef}>
              <button 
                className="cockpit-metas-vendedores-menu-trigger"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Menu de navegação"
              >
                <MoreVertical size={20} />
              </button>
              {showMenu && (
                <div className="cockpit-metas-vendedores-menu-dropdown">
                  <button 
                    className="cockpit-metas-vendedores-menu-item"
                    onClick={() => {
                      navigate('/cockpit-vendedores');
                      setShowMenu(false);
                    }}
                  >
                    <LayoutDashboard size={18} />
                    <span>Cockpit de Vendedores</span>
                  </button>
                  <button 
                    className="cockpit-metas-vendedores-menu-item"
                    onClick={() => {
                      navigate('/cockpit-vendedores-config');
                      setShowMenu(false);
                    }}
                  >
                    <Settings size={18} />
                    <span>Configuração</span>
                  </button>
                  <button 
                    className="cockpit-metas-vendedores-menu-item active"
                    onClick={() => setShowMenu(false)}
                  >
                    <Target size={18} />
                    <span>Metas Diárias</span>
                  </button>
                  <button 
                    className="cockpit-metas-vendedores-menu-item"
                    onClick={() => {
                      navigate('/cockpit-metas-rondas');
                      setShowMenu(false);
                    }}
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
        <div className="cockpit-metas-vendedores-actions-header">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="cockpit-metas-vendedores-btn-add"
              onClick={() => setShowTiposModal(true)}
            >
              + Gerenciar Tipos de Metas
            </button>
            <button 
              className="cockpit-metas-vendedores-btn-add"
              onClick={() => setShowNomesModal(true)}
            >
              + Gerenciar Nomes de Metas
            </button>
          </div>
          <button 
            className="cockpit-metas-vendedores-btn-add"
            onClick={() => handleOpenModal()}
          >
            + Adicionar Meta
          </button>
        </div>

        {/* Lista de vendedores com suas metas */}
        <div className="cockpit-metas-vendedores-sections">
          {/* Seção de Metas Gerais */}
          {metasGerais.length > 0 && (
            <div className="cockpit-metas-vendedores-section" style={{ borderTop: '3px solid #10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
              <h2 style={{ color: '#10b981' }}>Metas Gerais (Todos Vendedores)</h2>
              
              {/* Tabela de metas gerais */}
              <table className="cockpit-metas-vendedores-table">
                <thead>
                  <tr>
                    <th>Nome da Meta</th>
                    <th>Tipo</th>
                    <th>Segunda a Sexta</th>
                    <th>Sábado</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {nomesMetasParaExibicao.map(nomeMeta => {
                    const nomeMetaObj = nomesMetas.find(n => n.nome === nomeMeta);
                    const isPercentual = nomeMetaObj?.is_percentual || nomeMeta === 'Conversão';
                    const metaSegSex = metasGerais.find(m => m.nome_meta === nomeMeta && m.dia_semana === 'seg_sex');
                    const metaSabado = metasGerais.find(m => m.nome_meta === nomeMeta && m.dia_semana === 'sabado');
                    
                    return (
                      <tr key={nomeMeta}>
                        <td>{nomeMetaObj?.label || nomeMeta}</td>
                        <td>{tiposMetas.find(t => t.nome === (metaSegSex?.tipo_meta || metaSabado?.tipo_meta || 'diaria'))?.label || 'Diária'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                            {metaSegSex ? (
                              <span className="cockpit-metas-vendedores-valor">
                                {isPercentual ? `${metaSegSex.valor_meta}%` : metaSegSex.valor_meta}
                              </span>
                            ) : (
                              <span className="cockpit-metas-vendedores-sem-meta">—</span>
                            )}
                            <button
                              className="cockpit-metas-vendedores-btn-edit"
                              onClick={() => {
                                if (metaSegSex) {
                                  handleOpenModal(metaSegSex);
                                } else {
                                  const tipoPadrao = tiposMetas.find(t => t.ativo)?.nome || 'diaria';
                                  const novaMeta = {
                                    vendedor_id_sprint: 0,
                                    nome_meta: nomeMeta,
                                    tipo_meta: tipoPadrao,
                                    valor_meta: '',
                                    dia_semana: 'seg_sex',
                                    ativo: true
                                  };
                                  handleOpenModal(novaMeta);
                                }
                              }}
                              title={metaSegSex ? "Editar meta geral Seg-Sex" : "Adicionar meta geral Seg-Sex"}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              {metaSegSex ? <Edit size={12} /> : <Plus size={12} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                            {metaSabado ? (
                              <span className="cockpit-metas-vendedores-valor">
                                {isPercentual ? `${metaSabado.valor_meta}%` : metaSabado.valor_meta}
                              </span>
                            ) : (
                              <span className="cockpit-metas-vendedores-sem-meta">—</span>
                            )}
                            <button
                              className="cockpit-metas-vendedores-btn-edit"
                              onClick={() => {
                                if (metaSabado) {
                                  handleOpenModal(metaSabado);
                                } else {
                                  const novaMeta = {
                                    vendedor_id_sprint: 0,
                                    nome_meta: nomeMeta,
                                    tipo_meta: 'diaria',
                                    valor_meta: '',
                                    dia_semana: 'sabado',
                                    ativo: true
                                  };
                                  handleOpenModal(novaMeta);
                                }
                              }}
                              title={metaSabado ? "Editar meta geral Sábado" : "Adicionar meta geral Sábado"}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              {metaSabado ? <Edit size={12} /> : <Plus size={12} />}
                            </button>
                          </div>
                        </td>
                        <td className="cockpit-metas-vendedores-actions">
                          {metaSegSex && (
                            <button
                              className="cockpit-metas-vendedores-btn-delete"
                              onClick={() => handleDelete(metaSegSex.id)}
                              title="Excluir meta geral Seg-Sex"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                          {metaSabado && (
                            <button
                              className="cockpit-metas-vendedores-btn-delete"
                              onClick={() => handleDelete(metaSabado.id)}
                              title="Excluir meta geral Sábado"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Botão para adicionar meta geral se não existir nenhuma */}
          {metasGerais.length === 0 && (
            <div className="cockpit-metas-vendedores-section" style={{ borderTop: '3px solid #10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#10b981' }}>Metas Gerais (Todos Vendedores)</h2>
                <button
                  className="cockpit-metas-vendedores-btn-add"
                  onClick={() => {
                    const tipoPadrao = tiposMetas.find(t => t.ativo)?.nome || 'diaria';
                    const nomePadrao = nomesMetas.find(n => n.ativo)?.nome || 'Entrada';
                    const novaMeta = {
                      vendedor_id_sprint: 0,
                      nome_meta: nomePadrao,
                      tipo_meta: tipoPadrao,
                      valor_meta: '',
                      dia_semana: 'seg_sex',
                      ativo: true
                    };
                    handleOpenModal(novaMeta);
                  }}
                >
                  + Adicionar Meta Geral
                </button>
              </div>
              <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                Nenhuma meta geral cadastrada. Clique no botão acima para criar a primeira meta geral.
              </p>
            </div>
          )}

          {Object.values(metasPorVendedor).map(({ vendedor, metas: metasVendedor }) => (
            <div key={vendedor.id_sprint} className="cockpit-metas-vendedores-section">
              <h2>{vendedor.nome}</h2>
              
              {/* Tabela de metas */}
              <table className="cockpit-metas-vendedores-table">
                <thead>
                  <tr>
                    <th>Nome da Meta</th>
                    <th>Tipo</th>
                    <th>Segunda a Sexta</th>
                    <th>Sábado</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {nomesMetasParaExibicao.map(nomeMeta => {
                    const nomeMetaObj = nomesMetas.find(n => n.nome === nomeMeta);
                    const isPercentual = nomeMetaObj?.is_percentual || nomeMeta === 'Conversão';
                    const metaSegSex = metasVendedor.find(m => m.nome_meta === nomeMeta && m.dia_semana === 'seg_sex');
                    const metaSabado = metasVendedor.find(m => m.nome_meta === nomeMeta && m.dia_semana === 'sabado');
                    
                    return (
                      <tr key={nomeMeta}>
                        <td>{nomeMetaObj?.label || nomeMeta}</td>
                        <td>{tiposMetas.find(t => t.nome === (metaSegSex?.tipo_meta || metaSabado?.tipo_meta || 'diaria'))?.label || 'Diária'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                            {metaSegSex ? (
                              <span className="cockpit-metas-vendedores-valor">
                                {isPercentual ? `${metaSegSex.valor_meta}%` : metaSegSex.valor_meta}
                              </span>
                            ) : (
                              <span className="cockpit-metas-vendedores-sem-meta">—</span>
                            )}
                            <button
                              className="cockpit-metas-vendedores-btn-edit"
                              onClick={() => {
                                if (metaSegSex) {
                                  handleOpenModal(metaSegSex);
                                } else {
                                  const tipoPadrao = tiposMetas.find(t => t.ativo)?.nome || 'diaria';
                                  const novaMeta = {
                                    vendedor_id_sprint: vendedor.id_sprint,
                                    nome_meta: nomeMeta,
                                    tipo_meta: tipoPadrao,
                                    valor_meta: '',
                                    dia_semana: 'seg_sex',
                                    ativo: true
                                  };
                                  handleOpenModal(novaMeta);
                                }
                              }}
                              title={metaSegSex ? "Editar meta Seg-Sex" : "Adicionar meta Seg-Sex"}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              {metaSegSex ? <Edit size={12} /> : <Plus size={12} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                            {metaSabado ? (
                              <span className="cockpit-metas-vendedores-valor">
                                {isPercentual ? `${metaSabado.valor_meta}%` : metaSabado.valor_meta}
                              </span>
                            ) : (
                              <span className="cockpit-metas-vendedores-sem-meta">—</span>
                            )}
                            <button
                              className="cockpit-metas-vendedores-btn-edit"
                              onClick={() => {
                                if (metaSabado) {
                                  handleOpenModal(metaSabado);
                                } else {
                                  const novaMeta = {
                                    vendedor_id_sprint: vendedor.id_sprint,
                                    nome_meta: nomeMeta,
                                    tipo_meta: 'diaria',
                                    valor_meta: '',
                                    dia_semana: 'sabado',
                                    ativo: true
                                  };
                                  handleOpenModal(novaMeta);
                                }
                              }}
                              title={metaSabado ? "Editar meta Sábado" : "Adicionar meta Sábado"}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              {metaSabado ? <Edit size={12} /> : <Plus size={12} />}
                            </button>
                          </div>
                        </td>
                        <td className="cockpit-metas-vendedores-actions">
                          {metaSegSex && (
                            <button
                              className="cockpit-metas-vendedores-btn-delete"
                              onClick={() => handleDelete(metaSegSex.id)}
                              title="Excluir meta Seg-Sex"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                          {metaSabado && (
                            <button
                              className="cockpit-metas-vendedores-btn-delete"
                              onClick={() => handleDelete(metaSabado.id)}
                              title="Excluir meta Sábado"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
          
          {Object.keys(metasPorVendedor).length === 0 && metasGerais.length === 0 && (
            <div className="cockpit-metas-vendedores-section">
              <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                Nenhuma meta cadastrada. Clique em "Adicionar Meta" para criar a primeira.
              </p>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="cockpit-metas-vendedores-modal-overlay" onClick={handleCloseModal}>
            <div className="cockpit-metas-vendedores-modal" onClick={(e) => e.stopPropagation()}>
              <div className="cockpit-metas-vendedores-modal-header">
                <h2>{editingMeta ? 'Editar' : 'Nova'} Meta</h2>
                <button 
                  className="cockpit-metas-vendedores-modal-close"
                  onClick={handleCloseModal}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="cockpit-metas-vendedores-form">
                <div className="cockpit-metas-vendedores-form-group">
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

                <div className="cockpit-metas-vendedores-form-group">
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
                      className="cockpit-metas-vendedores-btn-add"
                      style={{ padding: '10px', minWidth: 'auto', fontSize: '12px' }}
                      title="Gerenciar nomes de metas"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="cockpit-metas-vendedores-form-group">
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
                      className="cockpit-metas-vendedores-btn-add"
                      style={{ padding: '10px', minWidth: 'auto', fontSize: '12px' }}
                      title="Gerenciar tipos de metas"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="cockpit-metas-vendedores-form-group">
                  <label>Dia da Semana *</label>
                  <select
                    value={formData.dia_semana}
                    onChange={(e) => setFormData({ ...formData, dia_semana: e.target.value })}
                    required
                  >
                    <option value="seg_sex">Segunda a Sexta</option>
                    <option value="sabado">Sábado</option>
                  </select>
                  <small>Domingo utiliza as metas de Sábado</small>
                </div>

                <div className="cockpit-metas-vendedores-form-group">
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

                <div className="cockpit-metas-vendedores-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    />
                    Ativo
                  </label>
                </div>

                <div className="cockpit-metas-vendedores-form-actions">
                  <button 
                    type="button"
                    className="cockpit-metas-vendedores-btn-cancel"
                    onClick={handleCloseModal}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="cockpit-metas-vendedores-btn-save"
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
          <div className="cockpit-metas-vendedores-modal-overlay" onClick={handleCloseTiposModal}>
            <div className="cockpit-metas-vendedores-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="cockpit-metas-vendedores-modal-header">
                <h2>{editingTipo ? 'Editar' : 'Novo'} Tipo de Meta</h2>
                <button 
                  className="cockpit-metas-vendedores-modal-close"
                  onClick={handleCloseTiposModal}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmitTipo} className="cockpit-metas-vendedores-form">
                <div className="cockpit-metas-vendedores-form-group">
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

                <div className="cockpit-metas-vendedores-form-group">
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

                <div className="cockpit-metas-vendedores-form-actions">
                  <button 
                    type="button"
                    className="cockpit-metas-vendedores-btn-cancel"
                    onClick={handleCloseTiposModal}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="cockpit-metas-vendedores-btn-save"
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
                            className="cockpit-metas-vendedores-btn-edit"
                            onClick={() => handleOpenTiposModal(tipo)}
                            style={{ padding: '6px 10px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="cockpit-metas-vendedores-btn-delete"
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
          <div className="cockpit-metas-vendedores-modal-overlay" onClick={handleCloseNomesModal}>
            <div className="cockpit-metas-vendedores-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="cockpit-metas-vendedores-modal-header">
                <h2>{editingNome ? 'Editar' : 'Novo'} Nome de Meta</h2>
                <button 
                  className="cockpit-metas-vendedores-modal-close"
                  onClick={handleCloseNomesModal}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmitNome} className="cockpit-metas-vendedores-form">
                <div className="cockpit-metas-vendedores-form-group">
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

                <div className="cockpit-metas-vendedores-form-group">
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

                <div className="cockpit-metas-vendedores-form-group">
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

                <div className="cockpit-metas-vendedores-form-actions">
                  <button 
                    type="button"
                    className="cockpit-metas-vendedores-btn-cancel"
                    onClick={handleCloseNomesModal}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="cockpit-metas-vendedores-btn-save"
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
                            className="cockpit-metas-vendedores-btn-edit"
                            onClick={() => handleOpenNomesModal(nome)}
                            style={{ padding: '6px 10px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="cockpit-metas-vendedores-btn-delete"
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

export default CockpitMetasVendedoresPage;

