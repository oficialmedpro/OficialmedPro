import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../ClientesConsolidados.css';
import { supabase } from '../../service/supabase';
import { translations } from '../../data/translations';
import ReativacaoMenu from './ReativacaoMenu';
import './ReativacaoDashboard.css';

const ReativacaoDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const storedUserData = localStorage.getItem('reativacao_userData');
    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (e) {
        console.error('Erro ao carregar dados do usuário:', e);
      }
    }
  }, []);
  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState('pt-BR');
  
  const t = translations[currentLanguage] || {};

  useEffect(() => {
    loadDashboard();
    loadStats();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase.schema('api').from('vw_dashboard_reativacao').select('*').single();
      setDashboardData(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Buscar estatísticas de qualidade por grupo
      const { data, error } = await supabase.schema('api').from('vw_reativacao_stats').select('*');
      if (error) {
        console.warn('View vw_reativacao_stats não encontrada:', error);
        setStats([]);
        return;
      }
      setStats(data || []);
    } catch (error) {
      console.warn('Erro ao carregar estatísticas:', error);
      setStats([]);
    }
  };


  const renderStats = () => {
    if (!stats?.length) return null;
    const label = {
      reativacao_1x: 'Compraram 1x',
      reativacao_2x: 'Compraram 2x',
      reativacao_3x: 'Compraram 3x',
      reativacao_3x_plus: 'Compraram 3+ vezes'
    };
    const desiredOrder = ['reativacao_1x', 'reativacao_2x', 'reativacao_3x', 'reativacao_3x_plus'];
    const ordered = [...stats].sort((a, b) => desiredOrder.indexOf(a.grupo) - desiredOrder.indexOf(b.grupo));
    
    return (
      <div className="cc-dashboard-grid">
        {ordered.map((g) => (
          <div key={g.grupo} className="cc-card">
            <h3>📌 {label[g.grupo] || g.grupo}</h3>
            <div className="cc-stat-row"><span>Total</span><span className="cc-stat-value">{g.total?.toLocaleString?.() || g.total}</span></div>
            <div className="cc-stat-row"><span>Com E-mail</span><span>{g.com_email || 0} ({Math.round((g.com_email || 0) * 100 / Math.max(g.total, 1))}%)</span></div>
            <div className="cc-stat-row"><span>Com WhatsApp</span><span>{g.com_whatsapp || 0} ({Math.round((g.com_whatsapp || 0) * 100 / Math.max(g.total, 1))}%)</span></div>
            <div className="cc-stat-row"><span>Com CPF</span><span>{g.com_cpf || 0} ({Math.round((g.com_cpf || 0) * 100 / Math.max(g.total, 1))}%)</span></div>
            <div className="cc-stat-row"><span>Com Data Nasc.</span><span>{g.com_dn || 0} ({Math.round((g.com_dn || 0) * 100 / Math.max(g.total, 1))}%)</span></div>
            <div className="cc-stat-row"><span>Com Endereço</span><span>{g.com_endereco || 0} ({Math.round((g.com_endereco || 0) * 100 / Math.max(g.total, 1))}%)</span></div>
            <div className="cc-stat-row"><span>Dados 100%</span><span>{g.dados_100 || 0} ({Math.round((g.dados_100 || 0) * 100 / Math.max(g.total, 1))}%)</span></div>
            <div className="cc-stat-row"><span style={{color:'#dc2626'}}>Duplicados</span><span style={{color:'#dc2626'}}>{g.duplicados || 0} ({(((g.duplicados || 0) * 100) / Math.max(g.total, 1)).toFixed(1)}%)</span></div>
            <div className="cc-tags" style={{marginTop: 8, display:'flex', gap:8, flexWrap:'wrap'}}>
              <span className="cc-tag cc-tag-sprint">Sprint: {g.em_sprint || 0} ({Math.round((g.em_sprint || 0) * 100 / Math.max(g.total, 1))}%)</span>
              <span className="cc-tag cc-tag-greatpage">GreatPage: {g.em_greatpage || 0} ({Math.round((g.em_greatpage || 0) * 100 / Math.max(g.total, 1))}%)</span>
              <span className="cc-tag cc-tag-blacklabs">BlackLabs: {g.em_blacklabs || 0} ({Math.round((g.em_blacklabs || 0) * 100 / Math.max(g.total, 1))}%)</span>
            </div>
            <div style={{marginTop:8}}>
              <button className="cc-btn cc-btn-small" onClick={() => navigate(`/reativacao/${g.grupo === 'reativacao_1x' ? '1x' : g.grupo === 'reativacao_2x' ? '2x' : g.grupo === 'reativacao_3x' ? '3x' : '3x-plus'}`)}>
                Ver Lista
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="reativacao-dashboard-fullscreen">
        <div className="reativacao-loading">Carregando...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="reativacao-dashboard-fullscreen">
        <div className="reativacao-error">Erro ao carregar dados</div>
      </div>
    );
  }

  // Verificar se é supervisor ou vendedor
  const userTypeName = userData?.userTypeName?.toLowerCase() || '';
  const isSupervisor = ['supervisor', 'adminfranquiadora', 'adminfranquia', 'adminunidade'].includes(userTypeName);
  const isVendedor = userTypeName === 'vendedor';

  return (
    <div className="reativacao-dashboard-fullscreen">
      <ReativacaoMenu />
      <div className="reativacao-dashboard-content">
        <div className="reativacao-header">
          <h1 className="reativacao-title">🔄 Dashboard de Reativação</h1>
          <div className="reativacao-total">
            <span className="reativacao-total-label">Total para Reativação</span>
            <span className="reativacao-total-value">{dashboardData.total_para_reativacao?.toLocaleString()}</span>
          </div>
        </div>

        <div className="reativacao-cards-grid">
          <div className="reativacao-card reativacao-card-primary" onClick={() => navigate('/reativacao/1x')}>
            <div className="reativacao-card-icon">1️⃣</div>
            <h3 className="reativacao-card-title">Compraram 1x</h3>
            <div className="reativacao-card-value">{dashboardData.total_reativacao_1x?.toLocaleString()}</div>
            <button className="reativacao-card-button" onClick={(e) => { e.stopPropagation(); navigate('/reativacao/1x'); }}>
              Ver Lista
            </button>
          </div>
          
          <div className="reativacao-card reativacao-card-primary" onClick={() => navigate('/reativacao/2x')}>
            <div className="reativacao-card-icon">2️⃣</div>
            <h3 className="reativacao-card-title">Compraram 2x</h3>
            <div className="reativacao-card-value">{dashboardData.total_reativacao_2x?.toLocaleString()}</div>
            <button className="reativacao-card-button" onClick={(e) => { e.stopPropagation(); navigate('/reativacao/2x'); }}>
              Ver Lista
            </button>
          </div>
          
          <div className="reativacao-card reativacao-card-primary" onClick={() => navigate('/reativacao/3x')}>
            <div className="reativacao-card-icon">3️⃣</div>
            <h3 className="reativacao-card-title">Compraram 3x</h3>
            <div className="reativacao-card-value">{dashboardData.total_reativacao_3x?.toLocaleString()}</div>
            <button className="reativacao-card-button" onClick={(e) => { e.stopPropagation(); navigate('/reativacao/3x'); }}>
              Ver Lista
            </button>
          </div>
          
          <div className="reativacao-card reativacao-card-primary" onClick={() => navigate('/reativacao/3x-plus')}>
            <div className="reativacao-card-icon">🔥</div>
            <h3 className="reativacao-card-title">Compraram 3+ vezes</h3>
            <div className="reativacao-card-value">{dashboardData.total_reativacao_3x_plus?.toLocaleString()}</div>
            <button className="reativacao-card-button" onClick={(e) => { e.stopPropagation(); navigate('/reativacao/3x-plus'); }}>
              Ver Lista
            </button>
          </div>
        </div>
        
        <div className="reativacao-stats-section">
          <h2 className="reativacao-section-title">📊 Qualidade por Grupo</h2>
          {stats?.length > 0 ? renderStats() : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              Carregando estatísticas de qualidade...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReativacaoDashboard;

