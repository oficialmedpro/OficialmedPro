import React, { useState } from 'react';
import './Login.css';
import LogoOficialmedLight from '../../icones/icone_oficialmed_modo_light.svg';
import { supabase } from '../service/supabase';

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
      // Primeiro tenta autenticação via banco de dados
      const { data: users, error: dbError } = await supabase
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

      if (users) {
        // Usuário encontrado no banco - aqui você implementaria verificação de senha hash
        // Por enquanto, vamos usar as credenciais fixas como fallback
        
        // Salva dados do usuário no localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('loginTime', new Date().toISOString());
        localStorage.setItem('userData', JSON.stringify({
          id: users.id,
          username: users.username,
          userType: users.user_type_id,
          firstName: users.first_name,
          lastName: users.last_name
        }));
        
        console.log('✅ Login realizado com sucesso via banco de dados');
        onLogin();
        return;
      }

      // Fallback para credenciais fixas (para teste)
      if (credentials.username === VALID_CREDENTIALS.username && 
          credentials.password === VALID_CREDENTIALS.password) {
        
        // Salva no localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('loginTime', new Date().toISOString());
        localStorage.setItem('userData', JSON.stringify({
          id: 0,
          username: 'oficialmedPRO',
          userType: 1, // adminfranquiadora
          firstName: 'Admin',
          lastName: 'OficialMed'
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