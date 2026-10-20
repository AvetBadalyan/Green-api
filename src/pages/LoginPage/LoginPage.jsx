import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSettings } from '../../services/api';
import './LoginPage.scss';

function LoginPage() {
  const { login } = useAuth();
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!idInstance.trim() || !apiTokenInstance.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      await getSettings({ idInstance: idInstance.trim(), apiTokenInstance: apiTokenInstance.trim() });
      login(idInstance.trim(), apiTokenInstance.trim());
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Invalid credentials. Please check your Instance ID and API Token.');
      } else {
        setError('Connection error. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <div className="logo-icon">G</div>
            <span className="logo-text">GREEN-API</span>
          </div>
          <h1>Sign in</h1>
          <p>Enter your GREEN-API credentials to start messaging</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="idInstance">Instance ID</label>
            <input
              type="text"
              id="idInstance"
              value={idInstance}
              onChange={(e) => { setIdInstance(e.target.value); setError(''); }}
              placeholder="e.g. 1101234567"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="apiTokenInstance">API Token</label>
            <input
              type="password"
              id="apiTokenInstance"
              value={apiTokenInstance}
              onChange={(e) => { setApiTokenInstance(e.target.value); setError(''); }}
              placeholder="Your API token"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Connecting...' : 'Sign in'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            No credentials?{' '}
            <a href="https://console.green-api.com/" target="_blank" rel="noopener noreferrer">
              Get them at GREEN-API Console
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
