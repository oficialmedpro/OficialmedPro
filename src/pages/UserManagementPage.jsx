import React, { useState, useEffect } from 'react';
import './UserManagementPage.css';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBlocked, setShowBlocked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Mock data - substituir por chamada à API
  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setUsers([
        {
          id: 260,
          status: 'online',
          avatar: '/api/placeholder/40/40',
          firstName: 'Ailton',
          lastName: 'dos Santos',
          username: 'ailton',
          email: 'farmaceuticooficialmedlondrina@gmail.com',
          access: 'liberado',
          userType: 'padrão',
          createdAt: '10/09/2025 05:14',
          lastLogin: '20/09/2025 08:41',
          lastAction: '20/09/2025 08:42'
        },
        {
          id: 255,
          status: 'offline',
          avatar: '/api/placeholder/40/40',
          firstName: 'Financeiro',
          lastName: 'Oficialmed',
          username: 'financeiro_ofm',
          email: 'financeiro@oficialmed.com.br',
          access: 'liberado',
          userType: 'administrador',
          createdAt: '09/09/2025 14:30',
          lastLogin: '19/09/2025 16:20',
          lastAction: '19/09/2025 16:25'
        },
        {
          id: 240,
          status: 'offline',
          avatar: '/api/placeholder/40/40',
          firstName: 'Gabrielli',
          lastName: 'Henriques',
          username: 'gabi',
          email: 'gabrielli@oficialmed.com.br',
          access: 'liberado',
          userType: 'administrador',
          createdAt: '08/09/2025 10:15',
          lastLogin: '19/09/2025 15:45',
          lastAction: '19/09/2025 15:50'
        },
        {
          id: 235,
          status: 'ausente',
          avatar: '/api/placeholder/40/40',
          firstName: 'Gustavo',
          lastName: 'de Paula',
          username: 'gustavo',
          email: 'gustavo@oficialmed.com.br',
          access: 'liberado',
          userType: 'padrão',
          createdAt: '07/09/2025 09:20',
          lastLogin: '19/09/2025 14:30',
          lastAction: '19/09/2025 14:35'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'offline': return '#6B7280';
      case 'ausente': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'ausente': return 'Ausente';
      default: return 'Offline';
    }
  };

  const getUserTypeStyle = (userType) => {
    return userType === 'administrador' 
      ? { color: '#8B5CF6', fontWeight: '500' }
      : { color: '#374151', fontWeight: '400' };
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBlocked = showBlocked || user.access === 'liberado';
    
    return matchesSearch && matchesBlocked;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleTransferUser = (user) => {
    // Implementar lógica de transferência
    console.log('Transferir usuário:', user);
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      {/* Header */}
      <div className="user-management-header">
        <div>
          <h1>Usuários</h1>
          <p>Gerencie os usuários cadastrados no sistema</p>
        </div>
        
        <div className="user-management-actions">
          <button 
            className="btn-new-user"
            onClick={() => setShowNewUserModal(true)}
          >
            + Novo Usuário
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="user-management-filters">
        <div className="search-container">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Pesquisar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="filter-options">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={showBlocked}
              onChange={(e) => setShowBlocked(e.target.checked)}
            />
            <span className="checkmark"></span>
            Exibir bloqueados
          </label>
        </div>
      </div>

      {/* Tabela de usuários */}
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Foto</th>
              <th>Nome</th>
              <th>Usuário</th>
              <th>Email</th>
              <th>Acesso</th>
              <th>Tipo</th>
              <th>Data de criação</th>
              <th>Último login</th>
              <th>Última ação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id}>
                <td className="user-id">{user.id}</td>
                
                <td className="user-status">
                  <div className="status-indicator">
                    <div 
                      className="status-dot" 
                      style={{ backgroundColor: getStatusColor(user.status) }}
                    ></div>
                    <span>{getStatusText(user.status)}</span>
                  </div>
                </td>
                
                <td className="user-avatar">
                  <img 
                    src={user.avatar} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="avatar-image"
                  />
                </td>
                
                <td className="user-name">
                  {user.firstName} {user.lastName}
                </td>
                
                <td className="user-username">{user.username}</td>
                
                <td className="user-email">{user.email}</td>
                
                <td className="user-access">
                  <span className="access-badge access-liberado">
                    {user.access}
                  </span>
                </td>
                
                <td className="user-type">
                  <span style={getUserTypeStyle(user.userType)}>
                    {user.userType}
                  </span>
                </td>
                
                <td className="user-created">{user.createdAt}</td>
                <td className="user-last-login">{user.lastLogin}</td>
                <td className="user-last-action">{user.lastAction}</td>
                
                <td className="user-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => handleEditUser(user)}
                    title="Editar usuário"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar
                  </button>
                  
                  <button 
                    className="btn-transfer"
                    onClick={() => handleTransferUser(user)}
                    title="Transferir usuário"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2-2z"></path>
                      <path d="M8 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"></path>
                      <path d="M12 3v18"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="user-pagination">
        <div className="pagination-info">
          {startIndex + 1} - {Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} itens
        </div>
        
        <div className="pagination-controls">
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ←
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            →
          </button>
        </div>
        
        <div className="pagination-per-page">
          <select 
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="per-page-select"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>Quantidade por Página</span>
        </div>
      </div>

      {/* Modais */}
      {showNewUserModal && (
        <NewUserModal 
          onClose={() => setShowNewUserModal(false)}
          onSave={(userData) => {
            // Implementar criação de usuário
            console.log('Novo usuário:', userData);
            setShowNewUserModal(false);
          }}
        />
      )}

      {showEditUserModal && selectedUser && (
        <EditUserModal 
          user={selectedUser}
          onClose={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
          }}
          onSave={(userData) => {
            // Implementar edição de usuário
            console.log('Editar usuário:', userData);
            setShowEditUserModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// Componente de modal para novo usuário
const NewUserModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    userType: 'padrão',
    access: 'liberado'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Novo Usuário</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Primeiro Nome</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Último Nome</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Usuário</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Usuário</label>
              <select
                value={formData.userType}
                onChange={(e) => setFormData({...formData, userType: e.target.value})}
              >
                <option value="padrão">Padrão</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status de Acesso</label>
              <select
                value={formData.access}
                onChange={(e) => setFormData({...formData, access: e.target.value})}
              >
                <option value="liberado">Liberado</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              Criar Usuário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente de modal para editar usuário
const EditUserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    userType: user.userType,
    access: user.access
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({...user, ...formData});
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Editar Usuário</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Primeiro Nome</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Último Nome</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Usuário</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Usuário</label>
              <select
                value={formData.userType}
                onChange={(e) => setFormData({...formData, userType: e.target.value})}
              >
                <option value="padrão">Padrão</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status de Acesso</label>
              <select
                value={formData.access}
                onChange={(e) => setFormData({...formData, access: e.target.value})}
              >
                <option value="liberado">Liberado</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagementPage;
