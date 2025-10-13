import { supabase } from '../lib/supabase.js';
import bcrypt from 'bcryptjs';

const userService = {
  /**
   * Buscar todos os usuários
   */
  async getUsers() {
    try {
      console.log('🔍 Buscando usuários do Supabase...');

      const { data, error } = await supabase.auth.admin.listUsers();

      if (error) {
        throw new Error(`Erro ao buscar usuários: ${error.message}`);
      }

      // Mapear dados para o formato esperado pela interface
      const users = data.users.map(user => ({
        id: user.id,
        status: this.getUserStatus(user),
        avatar: user.user_metadata?.avatar_url || '/api/placeholder/40/40',
        firstName: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Usuário',
        lastName: user.user_metadata?.last_name || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || '',
        email: user.email,
        access: user.banned_until ? 'bloqueado' : 'liberado',
        userType: user.user_metadata?.role || 'padrão',
        createdAt: new Date(user.created_at).toLocaleString('pt-BR'),
        lastLogin: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca',
        lastAction: user.updated_at ? new Date(user.updated_at).toLocaleString('pt-BR') : '-'
      }));

      console.log(`✅ ${users.length} usuários encontrados`);
      return users;

    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      throw error;
    }
  },

  /**
   * Determinar status do usuário baseado em últimas atividades
   */
  getUserStatus(user) {
    if (!user.last_sign_in_at) return 'offline';

    const lastLogin = new Date(user.last_sign_in_at);
    const now = new Date();
    const diffMinutes = (now - lastLogin) / (1000 * 60);

    if (diffMinutes < 15) return 'online';
    if (diffMinutes < 60) return 'ausente';
    return 'offline';
  },

  /**
   * Criar novo usuário
   */
  async createUser(userData) {
    try {
      console.log('👤 Criando novo usuário:', userData.email);

      // Gerar senha temporária
      const tempPassword = this.generateTempPassword();
      const hashedPassword = bcrypt.hashSync(tempPassword, 10);

      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          username: userData.username,
          role: userData.userType || 'padrão',
          created_by: 'admin'
        }
      });

      if (error) {
        throw new Error(`Erro ao criar usuário: ${error.message}`);
      }

      console.log('✅ Usuário criado com sucesso');

      return {
        user: data.user,
        tempPassword,
        message: `Usuário criado com sucesso. Senha temporária: ${tempPassword}`
      };

    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }
  },

  /**
   * Atualizar usuário existente
   */
  async updateUser(userId, userData) {
    try {
      console.log('✏️ Atualizando usuário:', userId);

      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        email: userData.email,
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          username: userData.username,
          role: userData.userType,
          updated_by: 'admin'
        }
      });

      if (error) {
        throw new Error(`Erro ao atualizar usuário: ${error.message}`);
      }

      // Se mudou o status de acesso, aplicar ban/unban
      if (userData.access === 'bloqueado') {
        await this.banUser(userId);
      } else if (userData.access === 'liberado') {
        await this.unbanUser(userId);
      }

      console.log('✅ Usuário atualizado com sucesso');
      return data.user;

    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  /**
   * Bloquear usuário
   */
  async banUser(userId) {
    try {
      console.log('🚫 Bloqueando usuário:', userId);

      // Definir ban por 100 anos (efetivamente permanente)
      const banUntil = new Date();
      banUntil.setFullYear(banUntil.getFullYear() + 100);

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: 'permanent'
      });

      if (error) {
        throw new Error(`Erro ao bloquear usuário: ${error.message}`);
      }

      console.log('✅ Usuário bloqueado com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro ao bloquear usuário:', error);
      throw error;
    }
  },

  /**
   * Desbloquear usuário
   */
  async unbanUser(userId) {
    try {
      console.log('✅ Desbloqueando usuário:', userId);

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      });

      if (error) {
        throw new Error(`Erro ao desbloquear usuário: ${error.message}`);
      }

      console.log('✅ Usuário desbloqueado com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro ao desbloquear usuário:', error);
      throw error;
    }
  },

  /**
   * Resetar senha de um usuário
   */
  async resetUserPassword(userId, newPassword = null) {
    try {
      console.log('🔐 Resetando senha do usuário:', userId);

      const password = newPassword || this.generateTempPassword();
      const hashedPassword = bcrypt.hashSync(password, 10);

      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        password: password
      });

      if (error) {
        throw new Error(`Erro ao resetar senha: ${error.message}`);
      }

      console.log('✅ Senha resetada com sucesso');

      return {
        success: true,
        tempPassword: password,
        message: `Senha resetada com sucesso. Nova senha: ${password}`
      };

    } catch (error) {
      console.error('❌ Erro ao resetar senha:', error);
      throw error;
    }
  },

  /**
   * Deletar usuário (soft delete - apenas desabilita)
   */
  async deleteUser(userId) {
    try {
      console.log('🗑️ Deletando usuário:', userId);

      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        throw new Error(`Erro ao deletar usuário: ${error.message}`);
      }

      console.log('✅ Usuário deletado com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro ao deletar usuário:', error);
      throw error;
    }
  },

  /**
   * Gerar senha temporária
   */
  generateTempPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  },

  /**
   * Gerar hash bcrypt para senha
   */
  generatePasswordHash(password) {
    return bcrypt.hashSync(password, 10);
  },

  /**
   * Verificar senha
   */
  verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }
};

export default userService;