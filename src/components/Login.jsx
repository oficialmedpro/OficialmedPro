import React, { useState } from 'react';
import './Login.css';
import LogoOficialmedLight from '../../icones/icone_oficialmed_modo_light.svg';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Credenciais fixas (você pode alterar depois)
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

    // Simula um pequeno delay para parecer mais real
    setTimeout(() => {
      if (credentials.username === VALID_CREDENTIALS.username && 
          credentials.password === VALID_CREDENTIALS.password) {
        
        // Salva no localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('loginTime', new Date().toISOString());
        
        console.log('✅ Login realizado com sucesso');
        onLogin();
      } else {
        setError('Usuário ou senha incorretos');
        console.log('❌ Tentativa de login inválida:', credentials.username);
      }
      setLoading(false);
    }, 1000);
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