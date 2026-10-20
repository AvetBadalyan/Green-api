import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage/LoginPage';
import ChatPage from './pages/ChatPage/ChatPage';

function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app">
      {isAuthenticated ? <ChatPage /> : <LoginPage />}
    </div>
  );
}

export default AppRouter;
