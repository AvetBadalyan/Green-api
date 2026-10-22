import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage/LoginPage';

// Lazy-load the authenticated shell so the login page only ships its own code.
// ChatPage + Sidebar + ChatWindow + all hooks load after the user authenticates.
const ChatPage = lazy(() => import('./pages/ChatPage/ChatPage'));

function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app">
      {isAuthenticated
        ? (
          <Suspense fallback={null}>
            <ChatPage />
          </Suspense>
        )
        : <LoginPage />}
    </div>
  );
}

export default AppRouter;
