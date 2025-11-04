import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../service/supabase';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import LogoOficialmedLight from '../../../icones/icone_oficialmed_modo_light.svg';
import './ReativacaoLogin.css';

const ReativacaoLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Buscar usuário no banco de dados
      const { data: user, error: dbError } = await supabase
        .schema('api')
        .from('users')
        .select(`
          *,
          user_types(name, description, level)
        `)
        .eq('username', credentials.username)
        .eq('status', 'active')
        .eq('access_status', 'liberado')
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        console.log('❌ Erro no banco:', dbError);
        throw new Error('Erro de conexão com o banco');
      }

      if (!user) {
        setError('Usuário ou senha incorretos');
        return;
      }

      // Verificar se é supervisor ou vendedor
      const userTypeName = user.user_types?.name || '';
      const allowedTypes = ['supervisor', 'vendedor', 'adminfranquiadora', 'adminfranquia', 'adminunidade'];
      
      if (!userTypeName || !allowedTypes.includes(userTypeName.toLowerCase())) {
        setError('Acesso negado. Apenas supervisores e vendedores podem acessar o módulo de reativação.');
        return;
      }

      // Validar senha com bcrypt
      const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
      
      if (!isValidPassword) {
        setError('Senha incorreta');
        return;
      }

      // Gerar JWT token
      const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'oficialmed_pro_secret_key_2025';
      const secret = new TextEncoder().encode(JWT_SECRET);
      const token = await new SignJWT({ 
        userId: user.id, 
        username: user.username,
        userType: user.user_type_id,
        userTypeName: userTypeName,
        module: 'reativacao' // Marcar que é login exclusivo para reativação
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

      // Salvar dados no localStorage específico para reativação
      localStorage.setItem('reativacao_authenticated', 'true');
      localStorage.setItem('reativacao_loginTime', new Date().toISOString());
      localStorage.setItem('reativacao_token', token);
      localStorage.setItem('reativacao_userData', JSON.stringify({
        id: user.id,
        username: user.username,
        userType: user.user_type_id,
        userTypeName: userTypeName,
        firstName: user.first_name || user.username,
        lastName: user.last_name || '',
        email: user.email || ''
      }));
      
      console.log('✅ Login de reativação realizado com sucesso');
      
      // Redirecionar para o dashboard de reativação
      navigate('/reativacao');
    } catch (error) {
      console.error('Erro no login:', error);
      setError(error.message || 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reativacao-login-container">
      <div className="reativacao-login-box">
        <div className="reativacao-login-header">
          <img src={LogoOficialmedLight} alt="OficialMed Pro" className="reativacao-login-logo" />
          <h1>Módulo de Reativação</h1>
          <p>Acesso Exclusivo - Supervisor / Vendedor</p>
        </div>

        <form onSubmit={handleSubmit} className="reativacao-login-form">
          <div className="reativacao-form-group">
            <label htmlFor="username">Usuário</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Digite o usuário"
              autoComplete="username"
            />
          </div>

          <div className="reativacao-form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Digite a senha"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="reativacao-error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="reativacao-login-button"
            disabled={loading || !credentials.username || !credentials.password}
          >
            {loading ? (
              <>
                <span className="reativacao-spinner"></span>
                Entrando...
              </>
            ) : (
              'Entrar no Módulo de Reativação'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReativacaoLogin;

