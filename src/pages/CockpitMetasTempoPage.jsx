import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CockpitMetasRondasPage.css';
import { 
  getMetasTempo, 
  createMetaTempo, 
  updateMetaTempo, 
  deleteMetaTempo,
  getCockpitVendedoresConfig
} from '../service/supabase';
import { getVendedores } from '../service/FilterBarService';
import { LayoutDashboard, Settings, MoreVertical, Edit, Trash2, Plus, Target, SlidersHorizontal, Sun, Moon, Minus } from 'lucide-react';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';
import '../pages/CockpitVendedores.css';

const CockpitMetasTempoPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [metas, setMetas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Controles de tema e fonte
  const [isLightTheme, setIsLightTheme] = useState(() => {
    const saved = localStorage.getItem('cockpit-theme');
    return saved === 'light';
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('cockpit-font-size');
    return saved || 'md';
  });
  const [showFloatingControls, setShowFloatingControls] = useState(false);
  const floatingControlsRef = useRef(null);
  // Ref para manter a posição do scroll
  const scrollPositionRef = useRef(0);

  const [formData, setFormData] = useState({
    vendedor_id_sprint: '',
    nome_etapa: 'entradaCadastro',
    valor_meta_horas: '',
    dia_semana: 'seg_sex',
    ativo: true
  });

  // Definir etapas da jornada
  const etapasJornada = [
    { nome: 'entradaCadastro', label: 'Jornada Completa', descricao: 'Entrada → Cadastro' },
    { nome: 'entradaAcolhimento', label: 'Entrada → Acolhimento', descricao: 'Entrada → Acolhimento' },
    { nome: 'entradaQualificacao', label: 'Entrada → Qualificação', descricao: 'Entrada → Qualificação' },
    { nome: 'qualificacaoOrcamento', label: 'Qualificação → Orçamento', descricao: 'Qualificação → Orçamento' },
    { nome: 'orcamentoNegociacao', label: 'Orçamento → Negociação', descricao: 'Orçamento → Negociação' },
    { nome: 'negociacaoFollowUp', label: 'Negociação → Follow-up', descricao: 'Negociação → Follow-up' },
    { nome: 'followUpCadastro', label: 'Follow-up → Cadastro', descricao: 'Follow-up → Cadastro' },
    { nome: 'negociacaoCadastro', label: 'Negociação → Cadastro', descricao: 'Negociação → Venda' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (floatingControlsRef.current && !floatingControlsRef.current.contains(event.target)) {
        setShowFloatingControls(false);
      }
    };

    if (showMenu || showFloatingControls) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, showFloatingControls]);

  // Aplicar tema
  useEffect(() => {
    const page = document.querySelector('.cockpit-metas-rondas-page');
    if (isLightTheme) {
      page?.classList.add('light-theme');
      localStorage.setItem('cockpit-theme', 'light');
    } else {
      page?.classList.remove('light-theme');
      localStorage.setItem('cockpit-theme', 'dark');
    }
  }, [isLightTheme]);

  // Aplicar tamanho de fonte
  useEffect(() => {
    const page = document.querySelector('.cockpit-metas-rondas-page');
    if (page) {
      page.classList.remove('font-xs', 'font-sm', 'font-md', 'font-lg', 'font-xl', 'font-xxl', 'font-xxxl', 'font-xxxxl', 'font-xxxxxl');
      page.classList.add(`font-${fontSize}`);
      localStorage.setItem('cockpit-font-size', fontSize);
    }
  }, [fontSize]);

  // Handlers para controles flutuantes
  const toggleTheme = () => {
    setIsLightTheme(!isLightTheme);
  };

  const increaseFontSize = () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  const loadData = async (preserveScroll = false) => {
    try {
      setLoading(true);
      
      // Salvar posição do scroll antes de recarregar (se preserveScroll for true)
      if (preserveScroll) {
        scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
      }
      
      const [metasData, vendedoresData, configsData] = await Promise.all([
        getMetasTempo(),
        getVendedores(),
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
        vendedores: vendedoresConfigurados?.length || 0
      });
      
      setMetas(metasData || []);
      setVendedores(vendedoresConfigurados || []);
      
      // Restaurar posição do scroll após atualizar os dados
      if (preserveScroll) {
        // Usar setTimeout para garantir que o DOM foi atualizado
        setTimeout(() => {
          window.scrollTo(0, scrollPositionRef.current);
        }, 0);
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
      setEditingMeta(meta);
      setFormData({
        vendedor_id_sprint: meta.vendedor_id_sprint,
        nome_etapa: meta.nome_etapa,
        valor_meta_horas: meta.valor_meta_horas ? meta.valor_meta_horas.toString() : '',
        dia_semana: meta.dia_semana,
        ativo: meta.ativo !== undefined ? meta.ativo : true
      });
    } else {
      setEditingMeta(null);
      setFormData({
        vendedor_id_sprint: meta?.vendedor_id_sprint || '',
        nome_etapa: meta?.nome_etapa || 'entradaCadastro',
        valor_meta_horas: meta?.valor_meta_horas || '',
        dia_semana: meta?.dia_semana || 'seg_sex',
        ativo: meta?.ativo !== undefined ? meta.ativo : true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMeta(null);
    setFormData({
      vendedor_id_sprint: '',
      nome_etapa: 'entradaCadastro',
      valor_meta_horas: '',
      dia_semana: 'seg_sex',
      ativo: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const metaData = {
        ...formData,
        valor_meta_horas: parseFloat(formData.valor_meta_horas) || 0
      };

      if (editingMeta) {
        await updateMetaTempo(editingMeta.id, metaData);
        alert('Meta atualizada com sucesso!');
      } else {
        await createMetaTempo(metaData);
        alert('Meta criada com sucesso!');
      }
      
      handleCloseModal();
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
      await deleteMetaTempo(id);
      alert('Meta excluída com sucesso!');
      loadData(true);
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      alert('Erro ao excluir meta: ' + error.message);
    }
  };

  const getVendedorNome = (vendedorIdSprint) => {
    if (vendedorIdSprint === 0) return 'Geral (Todos Vendedores)';
    const vendedor = vendedores.find(v => v.id_sprint === vendedorIdSprint);
    return vendedor?.nome || `ID: ${vendedorIdSprint}`;
  };

  // Separar metas gerais (vendedor_id_sprint = 0)
  const metasGerais = metas.filter(m => m.vendedor_id_sprint === 0);

  // Agrupar metas por vendedor (excluindo metas gerais)
  const metasPorVendedor = vendedores.reduce((acc, vendedor) => {
    const metasVendedor = metas.filter(m => m.vendedor_id_sprint === vendedor.id_sprint && m.vendedor_id_sprint !== 0);
    if (metasVendedor.length > 0 || true) {
      acc[vendedor.id_sprint] = {
        vendedor: vendedor,
        metas: metasVendedor
      };
    }
    return acc;
  }, {});

  const formatarHoras = (horas) => {
    if (horas === null || horas === undefined || isNaN(horas)) return '—';
    const numHoras = parseFloat(horas);
    if (numHoras < 24) {
      return `${numHoras.toFixed(1).replace('.', ',')}h`;
    }
    const dias = Math.floor(numHoras / 24);
    const horasRestantes = numHoras % 24;
    if (horasRestantes < 1) {
      return `${dias}d`;
    }
    return `${dias}d ${horasRestantes.toFixed(0)}h`;
  };

  if (loading) {
    return (
      <div className={`cockpit-metas-rondas-page ${isLightTheme ? 'light-theme' : ''} font-${fontSize}`}>
        <div className="cockpit-metas-rondas-container">
          <div className="cockpit-metas-rondas-loading">
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cockpit-metas-rondas-page ${isLightTheme ? 'light-theme' : ''} font-${fontSize}`}>
      <div className="cockpit-metas-rondas-container">
        {/* Header */}
        <div className="cockpit-metas-rondas-page-header">
          <div className="cockpit-metas-rondas-header-left">
            <img src={LogoOficialmed} alt="OficialMed" className="cockpit-metas-rondas-logo" />
          </div>
          <div className="cockpit-metas-rondas-header-center">
            <h1 className="cockpit-metas-rondas-page-titulo">Metas por Tempo - Cockpit Vendedores</h1>
            <div className="cockpit-metas-rondas-page-descricao">
              Configure as metas de tempo para cada etapa da jornada do cliente. As metas podem ser diferentes para Segunda-Sexta e Sábado.
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
                      navigate('/cockpit-tempo-jornada');
                      setShowMenu(false);
                    }}
                  >
                    <Target size={18} />
                    <span>Tempo da Jornada</span>
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
                    className="cockpit-metas-rondas-menu-item"
                    onClick={() => {
                      navigate('/cockpit-metas-rondas');
                      setShowMenu(false);
                    }}
                  >
                    <Target size={18} />
                    <span>Metas por Ronda</span>
                  </button>
                  <button 
                    className="cockpit-metas-rondas-menu-item active"
                    onClick={() => setShowMenu(false)}
                  >
                    <Target size={18} />
                    <span>Metas por Tempo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="cockpit-metas-rondas-actions-header">
          <button 
            className="cockpit-metas-rondas-btn-add"
            onClick={() => handleOpenModal()}
          >
            + Adicionar Meta
          </button>
        </div>

        {/* Lista de vendedores com suas metas */}
        <div className="cockpit-metas-rondas-sections">
          {/* Seção de Metas Gerais */}
          {metasGerais.length > 0 && (
            <div className="cockpit-metas-rondas-section" style={{ borderTop: '3px solid #10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
              <h2 style={{ color: '#10b981' }}>Metas Gerais (Todos Vendedores)</h2>
              
              {/* Tabela de metas gerais */}
              <table className="cockpit-metas-rondas-table">
                <thead>
                  <tr>
                    <th>Etapa da Jornada</th>
                    <th>Segunda a Sexta</th>
                    <th>Sábado</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {etapasJornada.map(etapa => {
                    const metaSegSex = metasGerais.find(m => m.nome_etapa === etapa.nome && m.dia_semana === 'seg_sex');
                    const metaSabado = metasGerais.find(m => m.nome_etapa === etapa.nome && m.dia_semana === 'sabado');
                    
                    return (
                      <tr key={etapa.nome}>
                        <td>
                          <div>
                            <strong>{etapa.label}</strong>
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>{etapa.descricao}</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                            {metaSegSex ? (
                              <span className="cockpit-metas-rondas-valor">
                                {formatarHoras(metaSegSex.valor_meta_horas)}
                              </span>
                            ) : (
                              <span className="cockpit-metas-rondas-sem-meta">—</span>
                            )}
                            <button
                              className="cockpit-metas-rondas-btn-edit"
                              onClick={() => {
                                if (metaSegSex) {
                                  handleOpenModal(metaSegSex);
                                } else {
                                  const novaMeta = {
                                    vendedor_id_sprint: 0,
                                    nome_etapa: etapa.nome,
                                    valor_meta_horas: '',
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
                              <span className="cockpit-metas-rondas-valor">
                                {formatarHoras(metaSabado.valor_meta_horas)}
                              </span>
                            ) : (
                              <span className="cockpit-metas-rondas-sem-meta">—</span>
                            )}
                            <button
                              className="cockpit-metas-rondas-btn-edit"
                              onClick={() => {
                                if (metaSabado) {
                                  handleOpenModal(metaSabado);
                                } else {
                                  const novaMeta = {
                                    vendedor_id_sprint: 0,
                                    nome_etapa: etapa.nome,
                                    valor_meta_horas: '',
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
                        <td className="cockpit-metas-rondas-actions">
                          {metaSegSex && (
                            <button
                              className="cockpit-metas-rondas-btn-delete"
                              onClick={() => handleDelete(metaSegSex.id)}
                              title="Excluir meta geral Seg-Sex"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                          {metaSabado && (
                            <button
                              className="cockpit-metas-rondas-btn-delete"
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
            <div className="cockpit-metas-rondas-section" style={{ borderTop: '3px solid #10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#10b981' }}>Metas Gerais (Todos Vendedores)</h2>
                <button
                  className="cockpit-metas-rondas-btn-add"
                  onClick={() => {
                    const novaMeta = {
                      vendedor_id_sprint: 0,
                      nome_etapa: 'entradaCadastro',
                      valor_meta_horas: '',
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

          {Object.values(metasPorVendedor).map(({ vendedor, metas: metasVendedor }) => {
            const renderTabela = (diaSemana, titulo) => {
              const metasFiltradas = metasVendedor.filter(m => m.dia_semana === diaSemana);
              return (
                <div key={`${vendedor.id_sprint}-${diaSemana}`} style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text)' }}>{titulo}</h3>
                  <table className="cockpit-metas-rondas-table">
                    <thead>
                      <tr>
                        <th>Etapa da Jornada</th>
                        <th>Meta (horas)</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {etapasJornada.map(etapa => {
                        const metaEtapa = metasFiltradas.find(m => m.nome_etapa === etapa.nome);
                        
                        return (
                          <tr key={etapa.nome}>
                            <td>
                              <div>
                                <strong>{etapa.label}</strong>
                                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>{etapa.descricao}</div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                                {metaEtapa ? (
                                  <span className="cockpit-metas-rondas-valor">
                                    {formatarHoras(metaEtapa.valor_meta_horas)}
                                  </span>
                                ) : (
                                  <span className="cockpit-metas-rondas-sem-meta">—</span>
                                )}
                                <button
                                  className="cockpit-metas-rondas-btn-edit"
                                  onClick={() => {
                                    if (metaEtapa) {
                                      handleOpenModal(metaEtapa);
                                    } else {
                                      const novaMeta = {
                                        vendedor_id_sprint: vendedor.id_sprint,
                                        nome_etapa: etapa.nome,
                                        valor_meta_horas: '',
                                        dia_semana: diaSemana,
                                        ativo: true
                                      };
                                      handleOpenModal(novaMeta);
                                    }
                                  }}
                                  title={metaEtapa ? `Editar meta ${titulo}` : `Adicionar meta ${titulo}`}
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  {metaEtapa ? <Edit size={12} /> : <Plus size={12} />}
                                </button>
                              </div>
                            </td>
                            <td className="cockpit-metas-rondas-actions">
                              {metaEtapa && (
                                <button
                                  className="cockpit-metas-rondas-btn-delete"
                                  onClick={() => handleDelete(metaEtapa.id)}
                                  title={`Excluir meta ${titulo}`}
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
              );
            };

            return (
              <div key={vendedor.id_sprint} className="cockpit-metas-rondas-section">
                <h2>{vendedor.nome}</h2>
                {renderTabela('seg_sex', 'Segunda a Sexta')}
                {renderTabela('sabado', 'Sábado')}
              </div>
            );
          })}
          
          {Object.keys(metasPorVendedor).length === 0 && metasGerais.length === 0 && (
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
                <h2>{editingMeta ? 'Editar' : 'Nova'} Meta de Tempo</h2>
                <button 
                  className="cockpit-metas-rondas-modal-close"
                  onClick={handleCloseModal}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="cockpit-metas-rondas-form">
                <div className="cockpit-metas-rondas-form-group">
                  <label>Vendedor:</label>
                  <select
                    value={formData.vendedor_id_sprint}
                    onChange={(e) => setFormData({...formData, vendedor_id_sprint: parseInt(e.target.value)})}
                    required
                  >
                    <option value="0">Geral (Todos Vendedores)</option>
                    {vendedores.map(v => (
                      <option key={v.id_sprint} value={v.id_sprint}>
                        {v.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>Etapa da Jornada:</label>
                  <select
                    value={formData.nome_etapa}
                    onChange={(e) => setFormData({...formData, nome_etapa: e.target.value})}
                    required
                  >
                    {etapasJornada.map(etapa => (
                      <option key={etapa.nome} value={etapa.nome}>
                        {etapa.label} ({etapa.descricao})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>Meta (horas):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.valor_meta_horas}
                    onChange={(e) => setFormData({...formData, valor_meta_horas: e.target.value})}
                    placeholder="Ex: 24 (para 1 dia), 1.5 (para 1h30min)"
                    required
                  />
                  <small style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Informe o tempo em horas. Ex: 24 para 1 dia, 1.5 para 1h30min
                  </small>
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>Dia da Semana:</label>
                  <select
                    value={formData.dia_semana}
                    onChange={(e) => setFormData({...formData, dia_semana: e.target.value})}
                    required
                  >
                    <option value="seg_sex">Segunda a Sexta</option>
                    <option value="sabado">Sábado</option>
                  </select>
                </div>

                <div className="cockpit-metas-rondas-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                    />
                    {' '}Ativo
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
                    {editingMeta ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Controle Flutuante */}
      <div className="cockpit-vendedores-floating-controls" ref={floatingControlsRef}>
        <button
          className="cockpit-vendedores-floating-controls-toggle"
          onClick={() => setShowFloatingControls(!showFloatingControls)}
          aria-label="Abrir controles"
        >
          <SlidersHorizontal size={18} />
        </button>
        {showFloatingControls && (
          <div className="cockpit-vendedores-floating-controls-menu">
            <button
              className="cockpit-vendedores-floating-controls-option"
              onClick={toggleTheme}
              aria-label={isLightTheme ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
            >
              {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              className="cockpit-vendedores-floating-controls-option"
              onClick={increaseFontSize}
              disabled={fontSize === 'xxxxxl'}
              aria-label="Aumentar tamanho da fonte"
            >
              <Plus size={18} />
            </button>
            <button
              className="cockpit-vendedores-floating-controls-option"
              onClick={decreaseFontSize}
              disabled={fontSize === 'xs'}
              aria-label="Diminuir tamanho da fonte"
            >
              <Minus size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CockpitMetasTempoPage;

