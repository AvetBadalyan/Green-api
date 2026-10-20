import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'greenapi_credentials';

export function AuthProvider({ children }) {
  const [credentials, setCredentials] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(credentials?.idInstance && credentials?.apiTokenInstance);

  const login = (idInstance, apiTokenInstance) => {
    const newCredentials = { idInstance, apiTokenInstance };
    setCredentials(newCredentials);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCredentials));
  };

  const logout = () => {
    setCredentials(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('greenapi_chats');
  };

  const value = {
    credentials,
    isAuthenticated,
    login,
    logout,
  };

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
