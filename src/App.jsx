import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import AppRouter from './AppRouter';
import './App.scss';

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppRouter />
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
