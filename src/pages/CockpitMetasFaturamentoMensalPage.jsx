import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CockpitMetasVendedoresPage.css';
import { 
  getAllMetasFaturamentoMensal,
  getMetaFaturamentoMensal,
  upsertMetaFaturamentoMensal,
  deleteMetaFaturamentoMensal
} from '../service/supabase';
import { ArrowLeft, Settings, Edit, Trash2, Plus, Target } from 'lucide-react';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';

const CockpitMetasFaturamentoMensalPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [formData, setFormData] = useState({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    valor_meta: ''
  });
  const scrollPositionRef = useRef(0);

  // Nomes dos meses
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Preservar scroll position
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadData = async (preserveScroll = false) => {
    try {
      setLoading(true);
      
      if (preserveScroll) {
        scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
      }
      
      const data = await getAllMetasFaturamentoMensal();
      setMetas(data || []);
      
      if (preserveScroll && scrollPositionRef.current > 0) {
        setTimeout(() => {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: 'instant'
          });
        }, 200);
      }
    } catch (error) {
      console.error('Erro ao carregar metas mensais:', error);
      alert('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item && item.id) {
      setEditingMeta(item);
      setFormData({
        ano: item.ano,
        mes: item.mes,
        valor_meta: item.valor_meta?.toString() || ''
      });
    } else {
      const hoje = new Date();
      setEditingMeta(null);
      setFormData({
        ano: hoje.getFullYear(),
        mes: hoje.getMonth() + 1,
        valor_meta: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMeta(null);
    setFormData({
      ano: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
      valor_meta: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      
      const valorMeta = parseFloat(formData.valor_meta);
      
      if (!valorMeta || valorMeta < 0) {
        alert('Por favor, informe o valor da meta (maior ou igual a 0)');
        return;
      }
      
      await upsertMetaFaturamentoMensal(formData.ano, formData.mes, valorMeta);
      
      if (editingMeta) {
        alert('Meta atualizada com sucesso!');
      } else {
        alert('Meta criada com sucesso!');
      }
      
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
        scrollPositionRef.current = scrollPos;
      }, 100);
      
      handleCloseModal();
      loadData(true);
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      alert('Erro ao salvar meta: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta meta?')) {
      return;
    }
    
    try {
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      
      await deleteMetaFaturamentoMensal(id);
      alert('Meta deletada com sucesso!');
      
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
        scrollPositionRef.current = scrollPos;
      }, 100);
      
      loadData(true);
    } catch (error) {
      console.error('Erro ao deletar meta:', error);
      alert('Erro ao deletar meta: ' + error.message);
    }
  };

  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined) return 'R$ 0,00';
    const numValor = parseFloat(valor);
    if (isNaN(numValor)) return 'R$ 0,00';
    return `R$ ${numValor.toFixed(2).replace('.', ',')}`;
  };

  // Agrupar metas por ano
  const metasPorAno = metas.reduce((acc, meta) => {
    if (!acc[meta.ano]) {
      acc[meta.ano] = [];
    }
    acc[meta.ano].push(meta);
    return acc;
  }, {});

  const anosOrdenados = Object.keys(metasPorAno).sort((a, b) => parseInt(b) - parseInt(a));

  if (loading) {
    return (
      <div className="cockpit-metas-vendedores-page">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cockpit-metas-vendedores-page">
      <div className="cockpit-metas-vendedores-container">
        <div className="cockpit-metas-vendedores-header">
          <div className="cockpit-metas-vendedores-header-left">
            <img src={LogoOficialmed} alt="OficialMed" className="cockpit-metas-vendedores-logo" />
          </div>
          <div className="cockpit-metas-vendedores-header-center">
            <h1 className="cockpit-metas-vendedores-titulo">Metas Mensais de Faturamento</h1>
          </div>
          <div className="cockpit-metas-vendedores-header-right">
            <button
              className="cockpit-metas-vendedores-header-btn"
              onClick={() => navigate('/cockpit-vendedores')}
            >
              <ArrowLeft size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Voltar
            </button>
          </div>
        </div>

        <div className="cockpit-metas-vendedores-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Gerenciar Metas Mensais</h2>
            <button
              className="cockpit-metas-vendedores-btn-primary"
              onClick={() => handleOpenModal()}
            >
              <Plus size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Adicionar Meta
            </button>
          </div>

          {anosOrdenados.map(ano => (
            <div key={ano} style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.5em', marginBottom: '16px', color: 'var(--text)' }}>{ano}</h3>
              <div className="cockpit-metas-vendedores-table-container">
                <table className="cockpit-metas-vendedores-table">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th>Valor da Meta</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metasPorAno[ano]
                      .sort((a, b) => a.mes - b.mes)
                      .map(meta => (
                        <tr key={meta.id}>
                          <td>{nomesMeses[meta.mes - 1]}</td>
                          <td style={{ fontWeight: 'bold' }}>{formatarMoeda(meta.valor_meta)}</td>
                          <td>
                            <span className={`cockpit-metas-vendedores-status ${meta.ativo ? 'ativo' : 'inativo'}`}>
                              {meta.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="cockpit-metas-vendedores-btn-edit"
                                onClick={() => handleOpenModal(meta)}
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="cockpit-metas-vendedores-btn-delete"
                                onClick={() => handleDelete(meta.id)}
                                title="Deletar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {metas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              Nenhuma meta cadastrada. Clique em "Adicionar Meta" para criar uma nova.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="cockpit-metas-vendedores-modal-overlay" onClick={handleCloseModal}>
          <div className="cockpit-metas-vendedores-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cockpit-metas-vendedores-modal-header">
              <h3>{editingMeta ? 'Editar Meta Mensal' : 'Adicionar Meta Mensal'}</h3>
              <button
                className="cockpit-metas-vendedores-modal-close"
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="cockpit-metas-vendedores-modal-body">
                <div className="cockpit-metas-vendedores-form-group">
                  <label>Ano</label>
                  <input
                    type="number"
                    name="ano"
                    value={formData.ano}
                    onChange={handleChange}
                    min="2020"
                    max="2100"
                    required
                  />
                </div>

                <div className="cockpit-metas-vendedores-form-group">
                  <label>Mês</label>
                  <select
                    name="mes"
                    value={formData.mes}
                    onChange={handleChange}
                    required
                  >
                    {nomesMeses.map((nome, index) => (
                      <option key={index + 1} value={index + 1}>
                        {nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cockpit-metas-vendedores-form-group">
                  <label>Valor da Meta (R$)</label>
                  <input
                    type="number"
                    name="valor_meta"
                    value={formData.valor_meta}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="cockpit-metas-vendedores-modal-footer">
                <button
                  type="button"
                  className="cockpit-metas-vendedores-btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="cockpit-metas-vendedores-btn-primary"
                >
                  {editingMeta ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CockpitMetasFaturamentoMensalPage;

