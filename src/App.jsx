import { useRef, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { clearAvatarCache } from './services/avatarCache';
import AppRouter from './AppRouter';
import './App.scss';

function App() {
  const resetChatsRef = useRef(null);

  const handleLogout = useCallback(() => {
    clearAvatarCache(); // fresh photos for the next account
    if (resetChatsRef.current) resetChatsRef.current();
  }, []);

  const setResetChats = useCallback((fn) => {
    resetChatsRef.current = fn;
  }, []);

  return (
    <AuthProvider onLogout={handleLogout}>
      <ChatProvider onMount={setResetChats}>
        <AppRouter />
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
