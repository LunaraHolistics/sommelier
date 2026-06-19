import React, { useState, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import './Login.css';

function Login() {
  const [mode, setMode] = useState('manager');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginAsManager, loginAsSommelier } = useContext(AppContext);

  const handleManagerLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await loginAsManager(password);
    if (!success) {
      setError('Senha de gerente inválida');
    }
    setLoading(false);
  };

  const handleSommelierLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await loginAsSommelier(pin);
    if (!success) {
      setError('PIN inválido ou expirado');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🍷 Sommelier</h1>
          <p>Sistema Profissional de Sommelier</p>
        </div>

        <div className="login-tabs">
          <button
            className={mode === 'manager' ? 'active' : ''}
            onClick={() => setMode('manager')}
          >
            Gerente
          </button>
          <button
            className={mode === 'sommelier' ? 'active' : ''}
            onClick={() => setMode('sommelier')}
          >
            Garçom
          </button>
        </div>

        {mode === 'manager' ? (
          <form onSubmit={handleManagerLogin}>
            <div className="form-group">
              <label>Senha de Gerente</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar como Gerente'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSommelierLogin}>
            <div className="form-group">
              <label>PIN do Dia</label>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Digite o PIN de 4 dígitos"
                maxLength={4}
                pattern="[0-9]{4}"
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Validando...' : 'Entrar como Garçom'}
            </button>
          </form>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

export default Login;