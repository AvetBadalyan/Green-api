import { useRef, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import AppRouter from './AppRouter';
import './App.scss';

function App() {
  // Use a ref to store the resetChats function to avoid circular dependencies
  const resetChatsRef = useRef(null);

  const handleLogout = useCallback(() => {
    if (resetChatsRef.current) {
      resetChatsRef.current();
    }
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
