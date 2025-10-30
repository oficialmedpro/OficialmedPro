import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './ClientesConsolidados.css';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';
import { translations } from '../data/translations';
import { supabase } from '../service/supabase';
import { updateMarketData } from '../utils/utils';

const ClientesConsolidadosPage = ({ onLogout }) => {
  // Estados do dashboard
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('pt-BR');
  const [marketData, setMarketData] = useState({
    usd: 5.20,
    eur: 5.45,
    ibov: 125432,
    lastUpdate: new Date()
  });

  // Estados específicos da página
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState([]);
  const [completudeData, setCompletudeData] = useState(null);
  const [origensData, setOrigensData] = useState(null);
  const [faltaNoPrimeData, setFaltaNoPrimeData] = useState([]); // Tem no Sprint, falta no Prime
  const [faltaNoSprintData, setFaltaNoSprintData] = useState([]); // Tem no Prime, falta no Sprint
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  const t = translations[currentLanguage];

  // Atualizar dados de mercado
  useEffect(() => {
    const updateData = async () => {
      const data = await updateMarketData();
      if (data) setMarketData(data);
    };
    updateData();
    const interval = setInterval(updateData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Carregar dados ao mudar de aba
  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'dashboard':
          await loadDashboard();
          break;
        case 'completude':
          await loadCompletude();
          break;
        case 'origens':
          await loadOrigens();
          break;
        case 'falta-prime':
          await loadFaltaNoPrime();
          break;
        case 'falta-sprint':
          await loadFaltaNoSprint();
          break;
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboard = async () => {
    const { data } = await supabase
      .from('dashboard_principal')
      .select('*');
    setDashboardData(data || []);
  };

  const loadCompletude = async () => {
    const { data } = await supabase
      .from('stats_completude_dados')
      .select('*')
      .single();
    setCompletudeData(data);
  };

  const loadOrigens = async () => {
    const { data } = await supabase
      .from('stats_por_origem')
      .select('*')
      .single();
    setOrigensData(data);
  };

  const loadFaltaNoPrime = async () => {
    const { data } = await supabase
      .from('clientes_apenas_sprint')
      .select('*')
      .order('qualidade_dados', { ascending: false })
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
    setFaltaNoPrimeData(data || []);
  };

  const loadFaltaNoSprint = async () => {
    const { data } = await supabase
      .from('clientes_apenas_prime')
      .select('*')
      .order('qualidade_dados', { ascending: false })
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
    setFaltaNoSprintData(data || []);
  };

  const exportToCSV = async (tipo) => {
    setIsLoading(true);
    try {
      let tableName;
      if (tipo === 'falta-prime') {
        tableName = 'clientes_apenas_sprint';
      } else if (tipo === 'falta-sprint') {
        tableName = 'clientes_apenas_prime';
      }

      const { data } = await supabase
        .from(tableName)
        .select('*')
        .order('qualidade_dados', { ascending: false });

      if (!data || data.length === 0) {
        alert('Nenhum dado para exportar');
        return;
      }

      // Criar CSV
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row =>
        Object.values(row).map(val =>
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `clientes_${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Funções de controle
  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarExpanded(!sidebarExpanded);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    const container = document.querySelector('.dashboard-container');
    if (container) {
      if (isDarkMode) {
        container.classList.add('light-theme');
      } else {
        container.classList.remove('light-theme');
      }
    }
  };

  const changeLanguage = (language) => setCurrentLanguage(language);

  // Renderizar conteúdo por aba
  const renderTabContent = () => {
    if (isLoading) {
      return <div className="loading-spinner">Carregando...</div>;
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'completude':
        return renderCompletude();
      case 'origens':
        return renderOrigens();
      case 'falta-prime':
        return renderFaltaNoPrime();
      case 'falta-sprint':
        return renderFaltaNoSprint();
      default:
        return null;
    }
  };

  const renderDashboard = () => (
    <div className="cc-dashboard-grid">
      <div className="cc-card">
        <h2>📊 Dashboard Geral</h2>
        <div className="cc-table-container">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor</th>
                <th>Percentual</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.map((row, idx) => (
                <tr key={idx} className={row.metrica.includes('─') ? 'separator-row' : ''}>
                  <td>{row.metrica}</td>
                  <td className="value-cell">{row.valor}</td>
                  <td className="percent-cell">{row.percentual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCompletude = () => {
    if (!completudeData) return null;

    const fields = [
      { label: 'Nome', count: completudeData.com_nome, perc: completudeData.perc_com_nome },
      { label: 'Email', count: completudeData.com_email, perc: completudeData.perc_com_email },
      { label: 'WhatsApp', count: completudeData.com_whatsapp, perc: completudeData.perc_com_whatsapp },
      { label: 'Telefone', count: completudeData.com_telefone, perc: completudeData.perc_com_telefone },
      { label: 'CPF', count: completudeData.com_cpf, perc: completudeData.perc_com_cpf },
      { label: 'Data Nascimento', count: completudeData.com_data_nascimento, perc: completudeData.perc_com_data_nascimento },
      { label: 'Endereço Completo', count: completudeData.com_endereco, perc: completudeData.perc_com_endereco },
    ];

    return (
      <div className="cc-dashboard-grid">
        <div className="cc-card cc-card-highlight">
          <h2>📋 Completude dos Dados</h2>
          <div className="cc-stat-big">
            <span className="cc-stat-label">Total de Clientes</span>
            <span className="cc-stat-value">{completudeData.total_clientes.toLocaleString()}</span>
          </div>
        </div>

        {fields.map((field, idx) => (
          <div key={idx} className="cc-card">
            <h3>{field.label}</h3>
            <div className="cc-stat-row">
              <span className="cc-stat-value">{field.count.toLocaleString()}</span>
              <span className="cc-stat-perc">{field.perc}%</span>
            </div>
            <div className="cc-progress-bar">
              <div className="cc-progress-fill" style={{ width: `${field.perc}%` }}></div>
            </div>
          </div>
        ))}

        <div className="cc-card cc-card-complete">
          <h3>✅ Dados 100% Completos</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{completudeData.com_dados_completos.toLocaleString()}</span>
            <span className="cc-stat-perc">{completudeData.perc_dados_completos}%</span>
          </div>
          <div className="cc-progress-bar">
            <div className="cc-progress-fill cc-progress-success" style={{ width: `${completudeData.perc_dados_completos}%` }}></div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrigens = () => {
    if (!origensData) return null;

    return (
      <div className="cc-dashboard-grid">
        <div className="cc-card cc-card-highlight">
          <h2>🔍 Análise de Origens</h2>
          <div className="cc-stat-big">
            <span className="cc-stat-label">Total de Clientes</span>
            <span className="cc-stat-value">{origensData.total_clientes.toLocaleString()}</span>
          </div>
        </div>

        <div className="cc-card">
          <h3>📱 SprintHub</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{origensData.no_sprinthub.toLocaleString()}</span>
            <span className="cc-stat-perc">{origensData.perc_no_sprinthub}%</span>
          </div>
        </div>

        <div className="cc-card">
          <h3>🏢 Prime</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{origensData.no_prime.toLocaleString()}</span>
            <span className="cc-stat-perc">{origensData.perc_no_prime}%</span>
          </div>
        </div>

        <div className="cc-card">
          <h3>🌐 GreatPage</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{origensData.no_greatpage.toLocaleString()}</span>
            <span className="cc-stat-perc">{origensData.perc_no_greatpage}%</span>
          </div>
        </div>

        <div className="cc-card">
          <h3>⚫ BlackLabs</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{origensData.no_blacklabs.toLocaleString()}</span>
            <span className="cc-stat-perc">{origensData.perc_no_blacklabs}%</span>
          </div>
        </div>

        <div className="cc-card cc-card-warning">
          <h3>⚠️ Falta no Prime (Estão no Sprint)</h3>
          <div className="cc-stat-value-large">{origensData.apenas_sprint.toLocaleString()}</div>
          <button
            className="cc-btn cc-btn-primary"
            onClick={() => setActiveTab('falta-prime')}
          >
            Ver Lista
          </button>
        </div>

        <div className="cc-card cc-card-warning">
          <h3>⚠️ Falta no Sprint (Estão no Prime)</h3>
          <div className="cc-stat-value-large">{origensData.apenas_prime.toLocaleString()}</div>
          <button
            className="cc-btn cc-btn-primary"
            onClick={() => setActiveTab('falta-sprint')}
          >
            Ver Lista
          </button>
        </div>

        <div className="cc-card">
          <h3>🔗 Em Ambos (Sprint E Prime)</h3>
          <div className="cc-stat-value-large">{origensData.em_ambos_sprint_prime.toLocaleString()}</div>
        </div>
      </div>
    );
  };

  const renderFaltaNoPrime = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>📋 Clientes que Faltam no Prime (Estão no Sprint)</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('falta-prime')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      <div className="cc-table-wrapper">
        <table className="cc-table cc-table-list">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sprint ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>WhatsApp</th>
              <th>CPF</th>
              <th>Qualidade</th>
            </tr>
          </thead>
          <tbody>
            {faltaNoPrimeData.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.id}</td>
                <td>{cliente.id_sprinthub}</td>
                <td>{cliente.nome_completo || '-'}</td>
                <td>{cliente.email || '-'}</td>
                <td>{cliente.whatsapp || '-'}</td>
                <td>{cliente.cpf || '-'}</td>
                <td>
                  <span className={`cc-quality-badge cc-quality-${cliente.qualidade_dados >= 80 ? 'high' : cliente.qualidade_dados >= 60 ? 'medium' : 'low'}`}>
                    {cliente.qualidade_dados}/100
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cc-pagination">
        <button
          className="cc-btn cc-btn-small"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ← Anterior
        </button>
        <span>Página {currentPage}</span>
        <button
          className="cc-btn cc-btn-small"
          onClick={() => setCurrentPage(p => p + 1)}
          disabled={faltaNoPrimeData.length < itemsPerPage}
        >
          Próxima →
        </button>
      </div>
    </div>
  );

  const renderFaltaNoSprint = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>📋 Clientes que Faltam no Sprint (Estão no Prime)</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('falta-sprint')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      <div className="cc-table-wrapper">
        <table className="cc-table cc-table-list">
          <thead>
            <tr>
              <th>ID</th>
              <th>Prime ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>WhatsApp</th>
              <th>CPF</th>
              <th>Qualidade</th>
            </tr>
          </thead>
          <tbody>
            {faltaNoSprintData.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.id}</td>
                <td>{cliente.id_prime}</td>
                <td>{cliente.nome_completo || '-'}</td>
                <td>{cliente.email || '-'}</td>
                <td>{cliente.whatsapp || '-'}</td>
                <td>{cliente.cpf || '-'}</td>
                <td>
                  <span className={`cc-quality-badge cc-quality-${cliente.qualidade_dados >= 80 ? 'high' : cliente.qualidade_dados >= 60 ? 'medium' : 'low'}`}>
                    {cliente.qualidade_dados}/100
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cc-pagination">
        <button
          className="cc-btn cc-btn-small"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ← Anterior
        </button>
        <span>Página {currentPage}</span>
        <button
          className="cc-btn cc-btn-small"
          onClick={() => setCurrentPage(p => p + 1)}
          disabled={faltaNoSprintData.length < itemsPerPage}
        >
          Próxima →
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <Sidebar
        sidebarExpanded={sidebarExpanded}
        isDarkMode={isDarkMode}
        currentLanguage={currentLanguage}
        translations={t}
      />

      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            <Sidebar
              sidebarExpanded={true}
              isDarkMode={isDarkMode}
              currentLanguage={currentLanguage}
              translations={t}
              isMobile={true}
              onClose={closeMobileMenu}
              toggleTheme={toggleTheme}
              toggleFullscreen={toggleFullscreen}
              changeLanguage={changeLanguage}
            />
          </div>
        </div>
      )}

      <TopMenuBar
        sidebarExpanded={sidebarExpanded}
        toggleSidebar={toggleSidebar}
        toggleFullscreen={toggleFullscreen}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        currentLanguage={currentLanguage}
        changeLanguage={changeLanguage}
        onLogout={onLogout}
      />

      <FilterBar
        t={t}
        marketData={marketData}
      />

      <main className="main-content">
        <div className="main-chart">
          <div className="cc-tabs">
            <button
              className={`cc-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`cc-tab ${activeTab === 'completude' ? 'active' : ''}`}
              onClick={() => setActiveTab('completude')}
            >
              📋 Completude
            </button>
            <button
              className={`cc-tab ${activeTab === 'origens' ? 'active' : ''}`}
              onClick={() => setActiveTab('origens')}
            >
              🔍 Origens
            </button>
            <button
              className={`cc-tab ${activeTab === 'falta-prime' ? 'active' : ''}`}
              onClick={() => setActiveTab('falta-prime')}
            >
              📤 Falta no Prime
            </button>
            <button
              className={`cc-tab ${activeTab === 'falta-sprint' ? 'active' : ''}`}
              onClick={() => setActiveTab('falta-sprint')}
            >
              📤 Falta no Sprint
            </button>
          </div>

          <div className="cc-tab-content">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientesConsolidadosPage;
