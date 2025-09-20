/**
 * 🔐 SERVIÇO DE AUTENTICAÇÃO E AUTORIZAÇÃO
 * 
 * Gerencia login, logout, permissões e controle de acesso hierárquico
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'oficialmed-jwt-secret-key';
    this.JWT_EXPIRES_IN = '24h';
    this.SESSION_EXPIRES_IN = 24 * 60 * 60 * 1000; // 24 horas em ms
  }

  /**
   * 🔑 Login do usuário
   */
  async login(username, password, ipAddress = null, userAgent = null) {
    try {
      // Buscar usuário
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          *,
          user_types(name, description, level)
        `)
        .eq('username', username)
        .single();

      if (error || !user) {
        await this.logAccess(null, 'login_failed', null, ipAddress, userAgent, {
          username,
          reason: 'user_not_found'
        });
        throw new Error('Usuário ou senha inválidos');
      }

      // Verificar status do usuário
      if (user.status !== 'active') {
        await this.logAccess(user.id, 'login_failed', null, ipAddress, userAgent, {
          reason: 'user_inactive',
          status: user.status
        });
        throw new Error('Usuário inativo');
      }

      if (user.access_status !== 'liberado') {
        await this.logAccess(user.id, 'login_failed', null, ipAddress, userAgent, {
          reason: 'user_blocked',
          access_status: user.access_status
        });
        throw new Error('Acesso bloqueado');
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        // Incrementar tentativas de login
        await this.incrementLoginAttempts(user.id);
        await this.logAccess(user.id, 'login_failed', null, ipAddress, userAgent, {
          reason: 'invalid_password'
        });
        throw new Error('Usuário ou senha inválidos');
      }

      // Reset tentativas de login
      await this.resetLoginAttempts(user.id);

      // Criar sessão
      const session = await this.createSession(user.id, ipAddress, userAgent);

      // Atualizar status online
      await this.updateUserStatus(user.id, true);

      // Log de sucesso
      await this.logAccess(user.id, 'login_success', null, ipAddress, userAgent);

      // Buscar permissões do usuário
      const permissions = await this.getUserPermissions(user.id);

      // Buscar unidades permitidas
      const allowedUnits = await this.getAllowedUnits(user.id);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          avatarUrl: user.avatar_url,
          userType: user.user_types.name,
          userTypeId: user.user_type_id,
          allowedUnits,
          permissions
        },
        session: {
          token: session.token,
          expiresAt: session.expires_at
        }
      };

    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  /**
   * 🚪 Logout do usuário
   */
  async logout(token, userId) {
    try {
      // Invalidar sessão
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('token_hash', this.hashToken(token))
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao invalidar sessão:', error);
      }

      // Atualizar status offline
      await this.updateUserStatus(userId, false);

      // Log de logout
      await this.logAccess(userId, 'logout', null);

      return { success: true };

    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }

  /**
   * 🔍 Verificar token e obter usuário
   */
  async verifyToken(token) {
    try {
      // Verificar se sessão existe e não expirou
      const { data: session, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          users(
            *,
            user_types(name, description, level)
          )
        `)
        .eq('token_hash', this.hashToken(token))
        .eq('expires_at', 'gt', new Date().toISOString())
        .single();

      if (error || !session) {
        throw new Error('Sessão inválida ou expirada');
      }

      // Verificar se usuário ainda está ativo
      if (session.users.status !== 'active' || session.users.access_status !== 'liberado') {
        // Invalidar sessão se usuário foi desativado
        await this.logout(token, session.user_id);
        throw new Error('Usuário inativo ou bloqueado');
      }

      // Atualizar última atividade
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', session.id);

      await this.updateLastAction(session.user_id);

      // Buscar permissões atualizadas
      const permissions = await this.getUserPermissions(session.user_id);
      const allowedUnits = await this.getAllowedUnits(session.user_id);

      return {
        success: true,
        user: {
          id: session.users.id,
          username: session.users.username,
          email: session.users.email,
          firstName: session.users.first_name,
          lastName: session.users.last_name,
          avatarUrl: session.users.avatar_url,
          userType: session.users.user_types.name,
          userTypeId: session.users.user_type_id,
          allowedUnits,
          permissions
        }
      };

    } catch (error) {
      console.error('Erro na verificação do token:', error);
      throw error;
    }
  }

  /**
   * ✅ Verificar permissão específica
   */
  async checkPermission(userId, moduleName, action = 'read') {
    try {
      const { data, error } = await supabase
        .rpc('check_user_permission', {
          p_user_id: userId,
          p_module_name: moduleName,
          p_action: action
        });

      if (error) {
        console.error('Erro ao verificar permissão:', error);
        return false;
      }

      return data || false;

    } catch (error) {
      console.error('Erro na verificação de permissão:', error);
      return false;
    }
  }

  /**
   * 📋 Obter todas as permissões do usuário
   */
  async getUserPermissions(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          user_types(
            user_type_permissions(
              can_read,
              can_write,
              can_delete,
              can_export,
              modules(name, description, category, icon)
            )
          )
        `)
        .eq('id', userId)
        .single();

      if (error || !data) {
        return {};
      }

      const permissions = {};
      data.user_types.user_type_permissions.forEach(permission => {
        const moduleName = permission.modules.name;
        permissions[moduleName] = {
          name: moduleName,
          description: permission.modules.description,
          category: permission.modules.category,
          icon: permission.modules.icon,
          canRead: permission.can_read,
          canWrite: permission.can_write,
          canDelete: permission.can_delete,
          canExport: permission.can_export
        };
      });

      return permissions;

    } catch (error) {
      console.error('Erro ao obter permissões:', error);
      return {};
    }
  }

  /**
   * 🏢 Obter unidades permitidas do usuário
   */
  async getAllowedUnits(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_allowed_units', { p_user_id: userId });

      if (error) {
        console.error('Erro ao obter unidades permitidas:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Erro ao obter unidades permitidas:', error);
      return [];
    }
  }

  /**
   * 🔒 Middleware de autenticação
   */
  async requireAuth(token) {
    try {
      const result = await this.verifyToken(token);
      if (!result.success) {
        throw new Error('Não autenticado');
      }
      return result.user;
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }

  /**
   * 🛡️ Middleware de autorização
   */
  async requirePermission(token, moduleName, action = 'read') {
    try {
      const user = await this.requireAuth(token);
      const hasPermission = await this.checkPermission(user.id, moduleName, action);
      
      if (!hasPermission) {
        await this.logAccess(user.id, 'permission_denied', moduleName, null, null, {
          action,
          module: moduleName
        });
        throw new Error(`Acesso negado ao módulo: ${moduleName}`);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🏢 Verificar acesso à unidade
   */
  async requireUnitAccess(token, unitId) {
    try {
      const user = await this.requireAuth(token);
      const allowedUnits = await this.getAllowedUnits(user.id);
      
      const hasAccess = allowedUnits.some(unit => unit.unit_id === unitId);
      
      if (!hasAccess) {
        await this.logAccess(user.id, 'unit_access_denied', null, null, null, {
          requested_unit_id: unitId
        });
        throw new Error('Acesso negado à unidade solicitada');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Criar nova sessão
   */
  async createSession(userId, ipAddress, userAgent) {
    const token = jwt.sign(
      { userId, timestamp: Date.now() },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    const expiresAt = new Date(Date.now() + this.SESSION_EXPIRES_IN);

    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        token_hash: this.hashToken(token),
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error('Erro ao criar sessão');
    }

    return {
      id: data.id,
      token,
      expires_at: expiresAt
    };
  }

  /**
   * Hash do token para armazenamento seguro
   */
  hashToken(token) {
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }

  /**
   * Atualizar status online/offline
   */
  async updateUserStatus(userId, isOnline) {
    await supabase
      .from('users')
      .update({ 
        is_online: isOnline,
        last_action: new Date().toISOString()
      })
      .eq('id', userId);
  }

  /**
   * Atualizar última ação
   */
  async updateLastAction(userId) {
    await supabase
      .from('users')
      .update({ last_action: new Date().toISOString() })
      .eq('id', userId);
  }

  /**
   * Incrementar tentativas de login
   */
  async incrementLoginAttempts(userId) {
    await supabase
      .from('users')
      .update({ login_attempts: supabase.raw('login_attempts + 1') })
      .eq('id', userId);
  }

  /**
   * Reset tentativas de login
   */
  async resetLoginAttempts(userId) {
    await supabase
      .from('users')
      .update({ 
        login_attempts: 0,
        locked_until: null,
        last_login: new Date().toISOString()
      })
      .eq('id', userId);
  }

  /**
   * Log de acesso
   */
  async logAccess(userId, action, module, ipAddress, userAgent, details = null) {
    try {
      await supabase
        .from('access_logs')
        .insert({
          user_id: userId,
          action,
          module,
          ip_address: ipAddress,
          user_agent: userAgent,
          details
        });
    } catch (error) {
      console.error('Erro ao registrar log de acesso:', error);
    }
  }

  /**
   * 🧹 Limpar sessões expiradas
   */
  async cleanupExpiredSessions() {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Erro ao limpar sessões expiradas:', error);
      }
    } catch (error) {
      console.error('Erro na limpeza de sessões:', error);
    }
  }
}

export default new AuthService();
