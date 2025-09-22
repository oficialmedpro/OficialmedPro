import React, { useState } from 'react';
import './Login.css';
import LogoOficialmedLight from '../../icones/icone_oficialmed_modo_light.svg';
import { supabase } from '../service/supabase';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Credenciais fixas (fallback para teste)
  const VALID_CREDENTIALS = {
    username: 'oficialmedPRO',
    password: 'Oficial07@@pro'
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError(''); // Limpa erro quando usuário digita
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Buscar usuário no banco de dados
      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('username', credentials.username)
        .eq('status', 'active')
        .eq('access_status', 'liberado')
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        console.log('❌ Erro no banco:', dbError);
        throw new Error('Erro de conexão com o banco');
      }

      if (user) {
        // 2. Validar senha com bcrypt
        const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
        
        if (!isValidPassword) {
          setError('Senha incorreta');
          console.log('❌ Senha incorreta para usuário:', credentials.username);
          return;
        }

        // 3. Gerar JWT token
        const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'oficialmed_pro_secret_key_2025';
        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new SignJWT({ 
          userId: user.id, 
          username: user.username,
          userType: user.user_type_id 
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

        // 4. Criar sessão no banco (opcional)
        try {
          const sessionId = crypto.randomUUID();
          await supabase
            .from('user_sessions')
            .insert({
              id: sessionId,
              user_id: user.id,
              token_hash: await bcrypt.hash(token, 10),
              ip_address: '127.0.0.1', // Em produção, pegar IP real
              user_agent: navigator.userAgent,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
            });

          // 5. Log de acesso
          await supabase
            .from('access_logs')
            .insert({
              user_id: user.id,
              action: 'login',
              ip_address: '127.0.0.1',
              user_agent: navigator.userAgent,
              details: { sessionId, loginMethod: 'password' }
            });
        } catch (sessionError) {
          console.warn('⚠️ Erro ao criar sessão (continuando):', sessionError);
        }

        // 6. Salvar dados no localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('loginTime', new Date().toISOString());
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify({
          id: user.id,
          username: user.username,
          userType: user.user_type_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          allowedUnits: user.allowed_units || []
        }));
        
        console.log('✅ Login realizado com sucesso via banco de dados');
        onLogin();
        return;
      }

      // 7. Fallback para credenciais fixas (para teste)
      if (credentials.username === VALID_CREDENTIALS.username && 
          credentials.password === VALID_CREDENTIALS.password) {
        
        // Gerar token para usuário fixo também
        const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'oficialmed_pro_secret_key_2025';
        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new SignJWT({ 
          userId: 0, 
          username: 'oficialmedPRO',
          userType: 1 
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);
        
        // Salva no localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('loginTime', new Date().toISOString());
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify({
          id: 0,
          username: 'oficialmedPRO',
          userType: 1, // adminfranquiadora
          firstName: 'Admin',
          lastName: 'OficialMed',
          email: 'admin@oficialmed.com.br',
          allowedUnits: []
        }));
        
        console.log('✅ Login realizado com sucesso (credenciais fixas)');
        onLogin();
      } else {
        setError('Usuário ou senha incorretos');
        console.log('❌ Tentativa de login inválida:', credentials.username);
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src={LogoOficialmedLight} alt="OficialMed Pro" className="login-logo" />
          <h1>BI OficialMed Pro</h1>
          <p>Acesso ao Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
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
            />
          </div>

          <div className="form-group">
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
            />
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading || !credentials.username || !credentials.password}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;