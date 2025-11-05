import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../ClientesConsolidados.css';
import { supabase } from '../../service/supabase';
import { translations } from '../../data/translations';
import MonitoramentoMenu from './MonitoramentoMenu';
import './MonitoramentoDashboard.css';

const MonitoramentoDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const storedUserData = localStorage.getItem('monitoramento_userData');
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
      const { data } = await supabase.schema('api').from('vw_dashboard_monitoramento').select('*').single();
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
      const { data, error } = await supabase.schema('api').from('vw_monitoramento_stats').select('*');
      if (error) {
        console.warn('View vw_monitoramento_stats não encontrada:', error);
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
      monitoramento_1_29: '1-29 dias',
      monitoramento_30_59: '30-59 dias',
      monitoramento_60_90: '60-90 dias'
    };
    const desiredOrder = ['monitoramento_1_29', 'monitoramento_30_59', 'monitoramento_60_90'];
    const ordered = [...stats].sort((a, b) => desiredOrder.indexOf(a.grupo) - desiredOrder.indexOf(b.grupo));
    
    return (
      <div className="cc-dashboard-grid">
        {ordered.map((g) => (
          <div key={g.grupo} className="cc-card">
            <h3>
              {g.grupo === 'monitoramento_1_29' && '🟢'}
              {g.grupo === 'monitoramento_30_59' && '🟡'}
              {g.grupo === 'monitoramento_60_90' && '🟠'}
              {' '}
              {label[g.grupo] || g.grupo}
            </h3>
            <div className="cc-stat-row"><span>Total</span><span className="cc-stat-value">{g.total?.toLocaleString?.() || g.total}</span></div>
            <div className="cc-stat-row"><span>Com E-mail</span><span>{g.com_email || 0} ({Math.round((g.com_email || 0) * 100 / Math.max(g.total, 1))}%)</span></div>
            <div className="cc-stat-row"><span>Com WhatsApp</span><span>{g.com_whatsapp || 0} ({Math.round((g.com_whatsapp || 0) * 100 / Math.max(g.total, 1))}%)</span></div>
            <div className="cc-stat-row"><span>Com CPF</span><span>{g.com_cpf || 0} ({Math.round((g.com_cpf || 0) * 100 / Math.max(g.total, 1))}%)</span></div>
            <div className="cc-stat-row"><span>Com Data Nasc.</span><span>{g.com_dn || 0} ({Math.round((g.com_dn || 0) * 100 / Math.max(g.total, 1))}%)</span></div>
            <div className="cc-stat-row"><span>Com Endereço</span><span>{g.com_endereco || 0} ({Math.round((g.com_endereco || 0) * 100 / Math.max(g.total, 1))}%)</span></div>
            <div className="cc-stat-row"><span>Dados 100%</span><span>{g.dados_100 || 0} ({Math.round((g.dados_100 || 0) * 100 / Math.max(g.total, 1))}%)</span></div>
            <div className="cc-tags" style={{marginTop: 8, display:'flex', gap:8, flexWrap:'wrap'}}>
              <span className="cc-tag cc-tag-sprint">Sprint: {g.em_sprint || 0} ({Math.round((g.em_sprint || 0) * 100 / Math.max(g.total, 1))}%)</span>
              <span className="cc-tag cc-tag-greatpage">GreatPage: {g.em_greatpage || 0} ({Math.round((g.em_greatpage || 0) * 100 / Math.max(g.total, 1))}%)</span>
              <span className="cc-tag cc-tag-blacklabs">BlackLabs: {g.em_blacklabs || 0} ({Math.round((g.em_blacklabs || 0) * 100 / Math.max(g.total, 1))}%)</span>
            </div>
            <div style={{marginTop:8}}>
              <button className="cc-btn cc-btn-small" onClick={() => {
                const route = g.grupo === 'monitoramento_1_29' ? '1-29' : 
                             g.grupo === 'monitoramento_30_59' ? '30-59' : '60-90';
                navigate(`/monitoramento/${route}`);
              }}>
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
      <div className="monitoramento-dashboard-fullscreen">
        <div className="monitoramento-loading">Carregando...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="monitoramento-dashboard-fullscreen">
        <div className="monitoramento-error">Erro ao carregar dados</div>
      </div>
    );
  }

  // Verificar se é supervisor ou vendedor
  const userTypeName = userData?.userTypeName?.toLowerCase() || '';
  const isSupervisor = ['supervisor', 'adminfranquiadora', 'adminfranquia', 'adminunidade'].includes(userTypeName);
  const isVendedor = userTypeName === 'vendedor';

  return (
    <div className="monitoramento-dashboard-fullscreen">
      <MonitoramentoMenu />
      <div className="monitoramento-dashboard-content">
        <div className="monitoramento-header">
          <h1 className="monitoramento-title">📊 Dashboard de Monitoramento (Últimos 90 dias)</h1>
          <div className="monitoramento-total">
            <span className="monitoramento-total-label">Total para Monitoramento</span>
            <span className="monitoramento-total-value">{dashboardData.total_monitoramento?.toLocaleString()}</span>
          </div>
        </div>

        <div className="monitoramento-cards-grid">
          <div className="monitoramento-card monitoramento-card-primary" onClick={() => navigate('/monitoramento/1-29')}>
            <div className="monitoramento-card-icon" style={{ color: '#22c55e' }}>🟢</div>
            <h3 className="monitoramento-card-title">1-29 dias</h3>
            <div className="monitoramento-card-value">{dashboardData.monitoramento_1_29?.toLocaleString()}</div>
            <button className="monitoramento-card-button" onClick={(e) => { e.stopPropagation(); navigate('/monitoramento/1-29'); }}>
              Ver Lista
            </button>
          </div>
          
          <div className="monitoramento-card monitoramento-card-primary" onClick={() => navigate('/monitoramento/30-59')}>
            <div className="monitoramento-card-icon" style={{ color: '#eab308' }}>🟡</div>
            <h3 className="monitoramento-card-title">30-59 dias</h3>
            <div className="monitoramento-card-value">{dashboardData.monitoramento_30_59?.toLocaleString()}</div>
            <button className="monitoramento-card-button" onClick={(e) => { e.stopPropagation(); navigate('/monitoramento/30-59'); }}>
              Ver Lista
            </button>
          </div>
          
          <div className="monitoramento-card monitoramento-card-primary" onClick={() => navigate('/monitoramento/60-90')}>
            <div className="monitoramento-card-icon" style={{ color: '#f97316' }}>🟠</div>
            <h3 className="monitoramento-card-title">60-90 dias</h3>
            <div className="monitoramento-card-value">{dashboardData.monitoramento_60_90?.toLocaleString()}</div>
            <button className="monitoramento-card-button" onClick={(e) => { e.stopPropagation(); navigate('/monitoramento/60-90'); }}>
              Ver Lista
            </button>
          </div>
        </div>
        
        <div className="monitoramento-stats-section">
          <h2 className="monitoramento-section-title">📊 Qualidade por Grupo</h2>
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

export default MonitoramentoDashboard;

