import React, { useState, useEffect } from 'react';
import './PermissionGroupsPage.css';

const PermissionGroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Mock data - substituir por chamada à API
  useEffect(() => {
    setTimeout(() => {
      setGroups([
        {
          id: 1,
          name: '[1-OFM/BL] Financeiro - MATRIZ - APUCARANA',
          description: 'Grupo para usuários financeiros da matriz',
          permissions: ['dashboard', 'financeiro', 'relatorios'],
          userCount: 3
        },
        {
          id: 2,
          name: '[1-OFM] Atendimento Franquia - MATRIZ - APUCARANA',
          description: 'Grupo para atendimento da franquia',
          permissions: ['dashboard', 'clientes', 'vendas'],
          userCount: 5
        },
        {
          id: 3,
          name: '[1-OFM] Atendimento Manipulação - MTZ - APUCARANA',
          description: 'Grupo para atendimento de manipulação',
          permissions: ['dashboard', 'clientes', 'vendas'],
          userCount: 2
        },
        {
          id: 4,
          name: '[1-OFM] Supervisor Manipulação - MTZ - APUCARANA',
          description: 'Grupo para supervisores de manipulação',
          permissions: ['dashboard', 'clientes', 'vendas', 'relatorios'],
          userCount: 1
        },
        {
          id: 5,
          name: '[2-OFM] Atendimento - FRANQ - BOM JESUS',
          description: 'Grupo para atendimento da franquia Bom Jesus',
          permissions: ['dashboard', 'clientes', 'vendas'],
          userCount: 4
        },
        {
          id: 6,
          name: '[2-OFM] Supervisor Manipulação - FRANQ - BOM JESUS',
          description: 'Grupo para supervisores da franquia Bom Jesus',
          permissions: ['dashboard', 'clientes', 'vendas', 'relatorios'],
          userCount: 1
        },
        {
          id: 7,
          name: '[3-OFM] Atendimento - FRANQ - BH',
          description: 'Grupo para atendimento da franquia BH',
          permissions: ['dashboard', 'clientes', 'vendas'],
          userCount: 3
        },
        {
          id: 8,
          name: '[3-OFM] Supervisor Manipulação - FRANQ - BH',
          description: 'Grupo para supervisores da franquia BH',
          permissions: ['dashboard', 'clientes', 'vendas', 'relatorios'],
          userCount: 1
        },
        {
          id: 9,
          name: '[4-OFM] Atendimento - FRANQ - LONDRINA',
          description: 'Grupo para atendimento da franquia Londrina',
          permissions: ['dashboard', 'clientes', 'vendas'],
          userCount: 6
        },
        {
          id: 10,
          name: '[4-OFM] Supervisor Manipulação - FRANQ - LONDRINA',
          description: 'Grupo para supervisores da franquia Londrina',
          permissions: ['dashboard', 'clientes', 'vendas', 'relatorios'],
          userCount: 2
        },
        {
          id: 11,
          name: '[5-OFM] Atendimento - FRANQ - ARAPONGAS',
          description: 'Grupo para atendimento da franquia Arapongas',
          permissions: ['dashboard', 'clientes', 'vendas'],
          userCount: 3
        },
        {
          id: 12,
          name: '[5-OFM] Supervisor Manipulação - FRANQ - ARAPONGAS',
          description: 'Grupo para supervisores da franquia Arapongas',
          permissions: ['dashboard', 'clientes', 'vendas', 'relatorios'],
          userCount: 1
        },
        {
          id: 13,
          name: '[6-OFM] Atendimento - FRANQ - BC',
          description: 'Grupo para atendimento da franquia BC',
          permissions: ['dashboard', 'clientes', 'vendas'],
          userCount: 4
        },
        {
          id: 14,
          name: '[6-OFM] Supervisor Manipulação - FRANQ - BC',
          description: 'Grupo para supervisores da franquia BC',
          permissions: ['dashboard', 'clientes', 'vendas', 'relatorios'],
          userCount: 1
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    setShowEditGroupModal(true);
  };

  if (loading) {
    return (
      <div className="permission-groups-loading">
        <div className="loading-spinner"></div>
        <p>Carregando grupos de permissões...</p>
      </div>
    );
  }

  return (
    <div className="permission-groups-page">
      {/* Header */}
      <div className="permission-groups-header">
        <div>
          <h1>Grupos de permissões</h1>
          <p>Aqui você poderá criar Grupos com Permissões personalizadas e gerenciar os usuários desses grupos.</p>
        </div>
        
        <div className="permission-groups-actions">
          <button 
            className="btn-new-group"
            onClick={() => setShowNewGroupModal(true)}
          >
            + Novo Grupo
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="permission-groups-filters">
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
      </div>

      {/* Lista de grupos */}
      <div className="permission-groups-list">
        <div className="groups-table">
          <div className="table-header">
            <div className="header-cell">Nome</div>
            <div className="header-cell">Usuários</div>
            <div className="header-cell">Ações</div>
          </div>
          
          <div className="table-body">
            {filteredGroups.map((group) => (
              <div key={group.id} className="table-row">
                <div className="cell group-name">
                  <div className="group-info">
                    <h3>{group.name}</h3>
                    <p>{group.description}</p>
                  </div>
                </div>
                
                <div className="cell user-count">
                  <span className="user-count-badge">
                    {group.userCount} usuário{group.userCount !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="cell actions">
                  <button 
                    className="btn-edit-group"
                    onClick={() => handleEditGroup(group)}
                    title="Editar grupo"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modais */}
      {showNewGroupModal && (
        <NewGroupModal 
          onClose={() => setShowNewGroupModal(false)}
          onSave={(groupData) => {
            console.log('Novo grupo:', groupData);
            setShowNewGroupModal(false);
          }}
        />
      )}

      {showEditGroupModal && selectedGroup && (
        <EditGroupModal 
          group={selectedGroup}
          onClose={() => {
            setShowEditGroupModal(false);
            setSelectedGroup(null);
          }}
          onSave={(groupData) => {
            console.log('Editar grupo:', groupData);
            setShowEditGroupModal(false);
            setSelectedGroup(null);
          }}
        />
      )}
    </div>
  );
};

// Componente de modal para novo grupo
const NewGroupModal = ({ onClose, onSave }) => {
  const [groupInfo, setGroupInfo] = useState({
    name: '',
    description: ''
  });
  const [permissions, setPermissions] = useState({
    sac360: {
      expanded: false,
      modules: {
        'acesso_plataforma': false,
        'relacionar_lead': false,
        'remover_relacionamento': false,
        'visualizar_kanban': false,
        'gerenciar_bloqueio': false,
        'acesso_copilot': false,
        'modelos_mensagem': false,
        'dashboard': false,
        'facebook': false,
        'instagram': false,
        'whatsapp': false,
        'whatsapp_api': false,
        'chat_vivo': false,
        'configuracao': false,
        'observacao': false,
        'automacoes': false
      }
    },
    sprinthub: {
      expanded: false,
      modules: {
        'acesso_dashboard': false,
        'sms': false,
        'voip': false,
        'landing_pages': false,
        'ai_landing_pages': false,
        'formularios': false,
        'popups': false,
        'arquivos': false,
        'fluxos_automacao': false,
        'segmentos': false,
        'estagios': false,
        'encurtadores_url': false
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...groupInfo,
      permissions
    });
  };

  const toggleCategory = (category) => {
    setPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        expanded: !prev[category].expanded
      }
    }));
  };

  const togglePermission = (category, module) => {
    setPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        modules: {
          ...prev[category].modules,
          [module]: !prev[category].modules[module]
        }
      }
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h2>Novo Grupo</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Informações do grupo */}
          <div className="form-section">
            <h3>Informações do grupo</h3>
            <p>Altere as informações exibidas em todo o sistema.</p>
            
            <div className="form-group">
              <label>
                Nome do grupo
                <svg className="help-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <path d="M12 17h.01"></path>
                </svg>
              </label>
              <input
                type="text"
                value={groupInfo.name}
                onChange={(e) => setGroupInfo({...groupInfo, name: e.target.value})}
                required
                placeholder="Digite o nome do grupo"
              />
            </div>
          </div>

          {/* Permissões do grupo */}
          <div className="form-section">
            <h3>Permissões do grupo</h3>
            <p>Lista de módulos que este grupo tem acesso.</p>
            
            <div className="permissions-container">
              {/* SAC360 */}
              <div className="permission-category">
                <div 
                  className="category-header"
                  onClick={() => toggleCategory('sac360')}
                >
                  <div className="category-checkbox">
                    <input
                      type="checkbox"
                      checked={Object.values(permissions.sac360.modules).every(v => v)}
                      onChange={(e) => {
                        const allChecked = e.target.checked;
                        setPermissions(prev => ({
                          ...prev,
                          sac360: {
                            ...prev.sac360,
                            modules: Object.fromEntries(
                              Object.keys(prev.sac360.modules).map(key => [key, allChecked])
                            )
                          }
                        }));
                      }}
                    />
                    <span className="category-label">Sac360</span>
                  </div>
                  <svg 
                    className={`expand-icon ${permissions.sac360.expanded ? 'expanded' : ''}`}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
                
                {permissions.sac360.expanded && (
                  <div className="category-modules">
                    {Object.entries(permissions.sac360.modules).map(([module, checked]) => (
                      <div key={module} className="module-item">
                        <input
                          type="checkbox"
                          id={`sac360-${module}`}
                          checked={checked}
                          onChange={() => togglePermission('sac360', module)}
                        />
                        <label htmlFor={`sac360-${module}`}>
                          {module.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SprintHub */}
              <div className="permission-category">
                <div 
                  className="category-header"
                  onClick={() => toggleCategory('sprinthub')}
                >
                  <div className="category-checkbox">
                    <input
                      type="checkbox"
                      checked={Object.values(permissions.sprinthub.modules).every(v => v)}
                      onChange={(e) => {
                        const allChecked = e.target.checked;
                        setPermissions(prev => ({
                          ...prev,
                          sprinthub: {
                            ...prev.sprinthub,
                            modules: Object.fromEntries(
                              Object.keys(prev.sprinthub.modules).map(key => [key, allChecked])
                            )
                          }
                        }));
                      }}
                    />
                    <span className="category-label">SprintHub</span>
                  </div>
                  <svg 
                    className={`expand-icon ${permissions.sprinthub.expanded ? 'expanded' : ''}`}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
                
                {permissions.sprinthub.expanded && (
                  <div className="category-modules">
                    {Object.entries(permissions.sprinthub.modules).map(([module, checked]) => (
                      <div key={module} className="module-item">
                        <input
                          type="checkbox"
                          id={`sprinthub-${module}`}
                          checked={checked}
                          onChange={() => togglePermission('sprinthub', module)}
                        />
                        <label htmlFor={`sprinthub-${module}`}>
                          {module.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-back" onClick={onClose}>
              ← Voltar
            </button>
            <button type="submit" className="btn-save">
              Criar Grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente de modal para editar grupo
const EditGroupModal = ({ group, onClose, onSave }) => {
  const [groupInfo, setGroupInfo] = useState({
    name: group.name,
    description: group.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({...group, ...groupInfo});
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h2>Editar Grupo</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <h3>Informações do grupo</h3>
            <p>Altere as informações exibidas em todo o sistema.</p>
            
            <div className="form-group">
              <label>
                Nome do grupo
                <svg className="help-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <path d="M12 17h.01"></path>
                </svg>
              </label>
              <input
                type="text"
                value={groupInfo.name}
                onChange={(e) => setGroupInfo({...groupInfo, name: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Aqui você pode adicionar as permissões existentes do grupo */}
          
          <div className="modal-actions">
            <button type="button" className="btn-back" onClick={onClose}>
              ← Voltar
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

export default PermissionGroupsPage;
