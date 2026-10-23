import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
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
          <ErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
              <ChatPage />
            </Suspense>
          </ErrorBoundary>
        )
        : <LoginPage />}
    </div>
  );
}

export default AppRouter;
