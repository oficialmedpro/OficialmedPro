import React, { useState } from 'react';
import './DashboardPage.css';

const DashboardPage = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: '📊', label: 'Analytics', active: true },
    { icon: '🛒', label: 'Ecommerce', active: false },
    { icon: '📁', label: 'Project', active: false },
    { icon: '💬', label: 'Messages', active: false },
    { icon: '📋', label: 'Tasks', active: false },
    { icon: '📈', label: 'Reports', active: false },
    { icon: '⚙️', label: 'Settings', active: false },
    { icon: '👥', label: 'Users', active: false },
    { icon: '📱', label: 'Apps', active: false },
    { icon: '🔔', label: 'Notifications', active: false },
    { icon: '💳', label: 'Billing', active: false },
  ];

  const statsCards = [
    { title: 'All User', value: '10,234', color: 'purple', icon: '👥' },
    { title: 'Event Count', value: '536', color: 'orange', icon: '📅' },
    { title: 'Conversations', value: '21', color: 'green', icon: '💬' },
    { title: 'New User', value: '3321', color: 'cyan', icon: '👤' },
  ];

  const projectCards = [
    { title: 'Total Project', value: '1206', progress: '+8.2', color: 'blue', icon: '📁' },
    { title: 'Completed', value: '240', progress: '+8.2', color: 'green', icon: '✅' },
    { title: 'In Progress', value: '96', progress: '+8.2', color: 'red', icon: '🔄' },
    { title: 'Active Project', value: '18', progress: '+8.2', color: 'cyan', icon: '⚡' },
  ];

  const countryData = [
    { country: 'Bangladesh', users: '05' },
    { country: 'India', users: '06' },
    { country: 'Pakistan', users: '06' },
    { country: 'Australia', users: '10' },
    { country: 'America', users: '08' },
  ];

  return (
    <div className="dashboard-container">
      {/* Desktop Sidebar */}
      <aside className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">📊</span>
            {sidebarExpanded && <span className="logo-text">Dashboard</span>}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
          >
            {sidebarExpanded ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <div key={index} className={`nav-item ${item.active ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {sidebarExpanded && <span className="nav-label">{item.label}</span>}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">👤</div>
            {sidebarExpanded && (
              <div className="user-info">
                <div className="user-name">Dashtail</div>
                <div className="user-email">dashtail@codeshaper.net</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="mobile-header">
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>
        <div className="mobile-logo">
          <span className="logo-icon">📊</span>
          <span className="logo-text">Dashboard</span>
        </div>
        <div className="mobile-actions">
          <button className="mobile-action-btn">🔍</button>
          <button className="mobile-action-btn">🔔</button>
          <button className="mobile-action-btn">👤</button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setMobileMenuOpen(false)}>
          <aside className="mobile-sidebar">
            <div className="mobile-sidebar-header">
              <div className="logo">
                <span className="logo-icon">📊</span>
                <span className="logo-text">Dashboard</span>
              </div>
              <button 
                className="close-mobile-sidebar"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>
            <nav className="mobile-sidebar-nav">
              {menuItems.map((item, index) => (
                <div key={index} className={`nav-item ${item.active ? 'active' : ''}`}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        <div className="content-header">
          <div className="page-title">
            <h1>Analytics dashboard</h1>
            <p>Demographic properties of your customer</p>
          </div>
          <div className="header-actions">
            <select className="date-selector">
              <option>Select Date</option>
            </select>
            <button className="pick-date-btn">📅 Pick a date</button>
          </div>
        </div>

        {/* Analytics Dashboard Content */}
        <div className="dashboard-content">
          {/* Stats Cards Section */}
          <section className="stats-section">
            <h2>Reports Snapshot</h2>
            <div className="stats-grid">
              {statsCards.map((card, index) => (
                <div key={index} className={`stat-card ${card.color}`}>
                  <div className="stat-header">
                    <span className="stat-title">{card.title}</span>
                    <span className="stat-icon">{card.icon}</span>
                  </div>
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-progress"></div>
                </div>
              ))}
            </div>
          </section>

          {/* Main Chart Section */}
          <section className="chart-section">
            <div className="main-chart">
              <div className="chart-header">
                <h3>Analytics Overview</h3>
                <div className="chart-period">Jan - Oct</div>
              </div>
              <div className="chart-container">
                <svg viewBox="0 0 800 300" className="analytics-chart">
                  <path
                    d="M 50 250 Q 150 150 250 200 T 450 100 T 650 150 T 750 200"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path
                    d="M 50 250 Q 150 150 250 200 T 450 100 T 650 150 T 750 200 L 750 300 L 50 300 Z"
                    fill="url(#chartGradient)"
                  />
                </svg>
              </div>
            </div>

            {/* Users Sidebar */}
            <div className="users-sidebar">
              <div className="users-header">
                <h3>Users</h3>
                <div className="users-count">63 ↗</div>
              </div>
              <p className="users-subtitle">In Last 30 Minutes</p>
              <div className="users-chart">
                <div className="bar-chart">
                  {[40, 60, 45, 70, 85, 75, 90, 95].map((height, index) => (
                    <div 
                      key={index} 
                      className="bar" 
                      style={{height: `${height}%`}}
                    ></div>
                  ))}
                </div>
              </div>
              <div className="top-countries">
                <h4>Top Countries</h4>
                <div className="countries-list">
                  {countryData.map((item, index) => (
                    <div key={index} className="country-item">
                      <span className="country-name">{item.country}</span>
                      <span className="country-users">{item.users}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Metrics Grid */}
          <section className="metrics-section">
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Sessions</h4>
                <div className="metric-value">6,132</div>
                <div className="metric-change positive">150% ↗</div>
                <div className="metric-subtitle">vs Previous 30 Days</div>
              </div>
              <div className="metric-card">
                <h4>Page Views</h4>
                <div className="metric-value">11,236</div>
                <div className="metric-change negative">202 ↘</div>
                <div className="metric-subtitle">vs Previous 30 Days</div>
              </div>
              <div className="metric-card">
                <h4>Avg. Duration</h4>
                <div className="metric-value">46s</div>
                <div className="metric-change positive">22% ↗</div>
                <div className="metric-subtitle">vs Previous 30 Days</div>
              </div>
              <div className="metric-card">
                <h4>Bounce Rate</h4>
                <div className="metric-value">46s</div>
                <div className="metric-change negative">30 ↘</div>
                <div className="metric-subtitle">vs Previous 30 Days</div>
              </div>
            </div>
          </section>

          {/* Charts Row */}
          <section className="charts-row">
            <div className="chart-card">
              <h4>New vs Returning Visitors</h4>
              <div className="donut-chart">
                <svg viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#374151" strokeWidth="20"/>
                  <circle 
                    cx="100" cy="100" r="80" 
                    fill="none" stroke="#8b5cf6" strokeWidth="20"
                    strokeDasharray="251.2" strokeDashoffset="125.6"
                    transform="rotate(-90 100 100)"
                  />
                  <text x="100" y="95" textAnchor="middle" className="chart-total-label">Total</text>
                  <text x="100" y="115" textAnchor="middle" className="chart-total-value">2600</text>
                </svg>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color old-user"></span>
                  <span>Old User</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color new-user"></span>
                  <span>New User</span>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <h4>Device Breakdown</h4>
              <div className="donut-chart">
                <svg viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#374151" strokeWidth="20"/>
                  <circle 
                    cx="100" cy="100" r="80" 
                    fill="none" stroke="#f59e0b" strokeWidth="20"
                    strokeDasharray="251.2" strokeDashoffset="83.7"
                    transform="rotate(-90 100 100)"
                  />
                  <text x="100" y="95" textAnchor="middle" className="chart-total-label">Total</text>
                  <text x="100" y="115" textAnchor="middle" className="chart-total-value">4500</text>
                </svg>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color desktop"></span>
                  <span>Desktop</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color tablet"></span>
                  <span>Tablet</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color mobile"></span>
                  <span>Mobile</span>
                </div>
              </div>
            </div>
          </section>

          {/* Project Dashboard Section */}
          <section className="project-section">
            <div className="project-header">
              <h2>Project Dashboard</h2>
              <div className="welcome-card">
                <div className="welcome-content">
                  <h3>Welcome Back Prantik!</h3>
                  <div className="task-summary">
                    <div className="task-item">
                      <span>Today's Task</span>
                      <strong>123</strong>
                    </div>
                    <div className="task-item">
                      <span>Overdue Task</span>
                      <strong>213</strong>
                    </div>
                  </div>
                </div>
                <div className="welcome-avatar">👨‍💻</div>
              </div>
            </div>

            <div className="project-stats">
              {projectCards.map((card, index) => (
                <div key={index} className={`project-card ${card.color}`}>
                  <div className="project-card-header">
                    <span className="project-icon">{card.icon}</span>
                  </div>
                  <div className="project-title">{card.title}</div>
                  <div className="project-value">{card.value}</div>
                  <div className="project-progress">
                    Project Progress <span className="progress-value">{card.progress}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div className="bottom-nav-item active">
          <span className="nav-icon">📊</span>
          <span className="nav-label">Dashboard</span>
        </div>
        <div className="bottom-nav-item">
          <span className="nav-icon">🔍</span>
          <span className="nav-label">Search</span>
        </div>
        <div className="bottom-nav-item">
          <span className="nav-icon">📱</span>
          <span className="nav-label">Apps</span>
        </div>
        <div className="bottom-nav-item">
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </div>
      </nav>
    </div>
  );
};

export default DashboardPage;

