import React, { useState, useEffect } from 'react';
import './UserManagementPage.css';

const UserManagementPage = ({ onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBlocked, setShowBlocked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Buscar usuários da API
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');

      if (!response.ok) {
        throw new Error(`Erro ao carregar usuários: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        console.error('Erro na resposta da API:', data.error);
        alert('Erro ao carregar usuários: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Erro ao conectar com a API: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateUser = async (userData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        alert(`Usuário criado com sucesso!\nSenha temporária: ${data.tempPassword}`);
        loadUsers(); // Recarregar lista
        setShowNewUserModal(false);
      } else {
        alert('Erro ao criar usuário: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao conectar com a API: ' + error.message);
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Usuário atualizado com sucesso!');
        loadUsers(); // Recarregar lista
        setShowEditUserModal(false);
        setSelectedUser(null);
      } else {
        alert('Erro ao atualizar usuário: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao conectar com a API: ' + error.message);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!confirm('Deseja realmente resetar a senha deste usuário?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(`Senha resetada com sucesso!\nNova senha: ${data.tempPassword}`);
      } else {
        alert('Erro ao resetar senha: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      alert('Erro ao conectar com a API: ' + error.message);
    }
  };

  const handleToggleUserAccess = async (userId, currentAccess) => {
    const action = currentAccess === 'liberado' ? 'bloquear' : 'desbloquear';

    if (!confirm(`Deseja realmente ${action} este usuário?`)) {
      return;
    }

    try {
      const endpoint = currentAccess === 'liberado' ? 'ban' : 'unban';
      const response = await fetch(`/api/users/${userId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(`Usuário ${action === 'bloquear' ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
        loadUsers(); // Recarregar lista
      } else {
        alert(`Erro ao ${action} usuário: ` + data.error);
      }
    } catch (error) {
      console.error(`Erro ao ${action} usuário:`, error);
      alert('Erro ao conectar com a API: ' + error.message);
    }
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
                    className="btn-reset-password"
                    onClick={() => handleResetPassword(user.id)}
                    title="Resetar senha"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <circle cx="12" cy="16" r="1"></circle>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Reset
                  </button>

                  <button
                    className={user.access === 'liberado' ? 'btn-ban' : 'btn-unban'}
                    onClick={() => handleToggleUserAccess(user.id, user.access)}
                    title={user.access === 'liberado' ? 'Bloquear usuário' : 'Desbloquear usuário'}
                  >
                    {user.access === 'liberado' ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                        </svg>
                        Bloquear
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22,4 12,14.01 9,11.01"></polyline>
                        </svg>
                        Liberar
                      </>
                    )}
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
          onSave={handleCreateUser}
        />
      )}

      {showEditUserModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
          }}
          onSave={handleUpdateUser}
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
