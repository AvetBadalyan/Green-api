import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants';

const AuthContext = createContext(null);

export function AuthProvider({ children, onLogout }) {
  const [credentials, setCredentials] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(credentials?.idInstance && credentials?.apiTokenInstance);

  const login = useCallback((idInstance, apiTokenInstance) => {
    const newCredentials = { idInstance, apiTokenInstance };
    setCredentials(newCredentials);
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(newCredentials));
  }, []);

  const logout = useCallback(() => {
    setCredentials(null);
    localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    // Call the callback to reset chats in ChatContext
    if (onLogout) onLogout();
  }, [onLogout]);

  const value = useMemo(
    () => ({
      credentials,
      isAuthenticated,
      login,
      logout,
    }),
    [credentials, isAuthenticated, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
