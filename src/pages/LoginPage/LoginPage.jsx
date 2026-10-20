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
      // Verify credentials by making a test API call
      await getSettings({ idInstance: idInstance.trim(), apiTokenInstance: apiTokenInstance.trim() });
      login(idInstance.trim(), apiTokenInstance.trim());
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials or connection error. Please check your Instance ID and API Token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">G</span>
            <span className="logo-text">GREEN-API</span>
          </div>
          <h1>Welcome to MAX Chat</h1>
          <p>Enter your GREEN-API credentials to start messaging</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="idInstance">Instance ID (idInstance)</label>
            <input
              type="text"
              id="idInstance"
              value={idInstance}
              onChange={(e) => setIdInstance(e.target.value)}
              placeholder="Enter your Instance ID"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="apiTokenInstance">API Token (apiTokenInstance)</label>
            <input
              type="password"
              id="apiTokenInstance"
              value={apiTokenInstance}
              onChange={(e) => setApiTokenInstance(e.target.value)}
              placeholder="Enter your API Token"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Connecting...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have credentials?{' '}
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
