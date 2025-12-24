import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CockpitMetasVendedoresPage.css';
import { 
  getAllDiasUteis,
  getDiasUteis,
  upsertDiasUteis,
  updateDiasUteisRestantes,
  deleteDiasUteis
} from '../service/supabase';
import { ArrowLeft, Settings, Edit, Trash2, Plus, Calendar } from 'lucide-react';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';

const CockpitDiasUteisPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [diasUteis, setDiasUteis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiasUteis, setEditingDiasUteis] = useState(null);
  const [formData, setFormData] = useState({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    dias_uteis_total: '',
    dias_uteis_restantes: ''
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
      
      const data = await getAllDiasUteis();
      setDiasUteis(data || []);
      
      if (preserveScroll && scrollPositionRef.current > 0) {
        setTimeout(() => {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: 'instant'
          });
        }, 200);
      }
    } catch (error) {
      console.error('Erro ao carregar dias úteis:', error);
      alert('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item && item.id) {
      setEditingDiasUteis(item);
      setFormData({
        ano: item.ano,
        mes: item.mes,
        dias_uteis_total: item.dias_uteis_total?.toString() || '',
        dias_uteis_restantes: item.dias_uteis_restantes?.toString() || ''
      });
    } else {
      const hoje = new Date();
      setEditingDiasUteis(null);
      setFormData({
        ano: hoje.getFullYear(),
        mes: hoje.getMonth() + 1,
        dias_uteis_total: '',
        dias_uteis_restantes: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDiasUteis(null);
    setFormData({
      ano: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
      dias_uteis_total: '',
      dias_uteis_restantes: ''
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
      
      const diasUteisTotal = parseInt(formData.dias_uteis_total);
      const diasUteisRestantes = formData.dias_uteis_restantes ? parseInt(formData.dias_uteis_restantes) : null;
      
      if (!diasUteisTotal || diasUteisTotal < 0) {
        alert('Por favor, informe o total de dias úteis do mês');
        return;
      }
      
      if (editingDiasUteis) {
        // Se está editando e alterou dias úteis restantes, atualizar apenas esse campo
        if (diasUteisRestantes !== null && diasUteisRestantes !== editingDiasUteis.dias_uteis_restantes) {
          await updateDiasUteisRestantes(editingDiasUteis.id, diasUteisRestantes);
        } else {
          // Se alterou o total, fazer upsert completo
          await upsertDiasUteis(formData.ano, formData.mes, diasUteisTotal, diasUteisRestantes);
        }
        alert('Dias úteis atualizados com sucesso!');
      } else {
        await upsertDiasUteis(formData.ano, formData.mes, diasUteisTotal, diasUteisRestantes);
        alert('Dias úteis criados com sucesso!');
      }
      
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
        scrollPositionRef.current = scrollPos;
      }, 100);
      
      handleCloseModal();
      loadData(true);
    } catch (error) {
      console.error('Erro ao salvar dias úteis:', error);
      alert('Erro ao salvar dias úteis: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir esta configuração de dias úteis?')) {
      return;
    }

    try {
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      
      await deleteDiasUteis(id);
      alert('Configuração excluída com sucesso!');
      
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
        scrollPositionRef.current = scrollPos;
      }, 100);
      
      loadData(true);
    } catch (error) {
      console.error('Erro ao excluir dias úteis:', error);
      alert('Erro ao excluir dias úteis: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="cockpit-metas-page">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  // Agrupar por ano
  const diasUteisPorAno = diasUteis.reduce((acc, item) => {
    if (!acc[item.ano]) {
      acc[item.ano] = [];
    }
    acc[item.ano].push(item);
    return acc;
  }, {});

  const anos = Object.keys(diasUteisPorAno).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div className="cockpit-metas-page">
      <div className="cockpit-metas-container">
        <div className="cockpit-metas-header">
          <div className="cockpit-metas-header-left">
            <img src={LogoOficialmed} alt="OficialMed" className="cockpit-metas-logo" />
          </div>
          <div className="cockpit-metas-header-center">
            <h1 className="cockpit-metas-titulo">Configuração de Dias Úteis</h1>
            <div className="cockpit-metas-descricao">
              Configure os dias úteis de cada mês para cálculo de meta acumulada. 
              Os dias úteis restantes são calculados automaticamente para o mês atual, mas podem ser editados manualmente.
            </div>
          </div>
          <div className="cockpit-metas-header-right">
            <button
              className="cockpit-metas-header-btn"
              onClick={() => navigate('/cockpit-vendedores')}
            >
              <ArrowLeft size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Voltar
            </button>
            <button
              className="cockpit-metas-header-btn primary"
              onClick={() => handleOpenModal()}
            >
              <Plus size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Adicionar
            </button>
          </div>
        </div>

        <div className="cockpit-metas-content">
          {anos.length === 0 ? (
            <div className="cockpit-metas-empty">
              <Calendar size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>Nenhuma configuração de dias úteis cadastrada.</p>
              <p style={{ marginTop: '8px', opacity: 0.7 }}>
                Clique no botão "Adicionar" para criar a primeira configuração.
              </p>
            </div>
          ) : (
            anos.map(ano => (
              <div key={ano} className="cockpit-metas-vendedor-section">
                <h2 className="cockpit-metas-vendedor-titulo">{ano}</h2>
                <div className="cockpit-metas-table-container">
                  <table className="cockpit-metas-table">
                    <thead>
                      <tr>
                        <th>Mês</th>
                        <th>Total de Dias Úteis</th>
                        <th>Dias Úteis Restantes</th>
                        <th>Última Atualização</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diasUteisPorAno[ano]
                        .sort((a, b) => a.mes - b.mes)
                        .map(item => (
                          <tr key={item.id}>
                            <td>{nomesMeses[item.mes - 1]}</td>
                            <td>{item.dias_uteis_total}</td>
                            <td>{item.dias_uteis_restantes !== null ? item.dias_uteis_restantes : '—'}</td>
                            <td>
                              {item.ultima_atualizacao
                                ? new Date(item.ultima_atualizacao).toLocaleDateString('pt-BR')
                                : '—'}
                            </td>
                            <td>
                              <div className="cockpit-metas-actions">
                                <button
                                  className="cockpit-metas-action-btn edit"
                                  onClick={() => handleOpenModal(item)}
                                  title="Editar"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  className="cockpit-metas-action-btn delete"
                                  onClick={() => handleDelete(item.id)}
                                  title="Excluir"
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
            ))
          )}
        </div>
      </div>

      {/* Modal de Edição/Criação */}
      {showModal && (
        <div className="cockpit-metas-modal-overlay" onClick={handleCloseModal}>
          <div className="cockpit-metas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cockpit-metas-modal-header">
              <h2>{editingDiasUteis ? 'Editar Dias Úteis' : 'Adicionar Dias Úteis'}</h2>
              <button className="cockpit-metas-modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="cockpit-metas-modal-form">
              <div className="cockpit-metas-form-group">
                <label>
                  Ano <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="ano"
                  value={formData.ano}
                  onChange={handleChange}
                  min="2020"
                  max="2100"
                  required
                  disabled={!!editingDiasUteis}
                />
              </div>

              <div className="cockpit-metas-form-group">
                <label>
                  Mês <span className="required">*</span>
                </label>
                <select
                  name="mes"
                  value={formData.mes}
                  onChange={handleChange}
                  required
                  disabled={!!editingDiasUteis}
                >
                  {nomesMeses.map((nome, index) => (
                    <option key={index + 1} value={index + 1}>
                      {nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cockpit-metas-form-group">
                <label>
                  Total de Dias Úteis do Mês <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="dias_uteis_total"
                  value={formData.dias_uteis_total}
                  onChange={handleChange}
                  min="0"
                  max="31"
                  required
                  placeholder="Ex: 22"
                />
                <small>Número total de dias úteis (segunda a sexta) do mês</small>
              </div>

              <div className="cockpit-metas-form-group">
                <label>
                  Dias Úteis Restantes
                </label>
                <input
                  type="number"
                  name="dias_uteis_restantes"
                  value={formData.dias_uteis_restantes}
                  onChange={handleChange}
                  min="0"
                  max="31"
                  placeholder="Deixe vazio para cálculo automático"
                />
                <small>Deixe vazio para calcular automaticamente (apenas para o mês atual)</small>
              </div>

              <div className="cockpit-metas-modal-actions">
                <button type="button" className="cockpit-metas-btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="cockpit-metas-btn-primary">
                  {editingDiasUteis ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CockpitDiasUteisPage;

