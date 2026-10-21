import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import useMessagePolling from '../../hooks/useMessagePolling';
import Sidebar from '../../components/Sidebar/Sidebar';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import EmptyChat from '../../components/EmptyChat/EmptyChat';
import CallsEmpty from '../../pages/CallsPage/CallsEmpty';
import NewChatModal from '../../components/NewChatModal/NewChatModal';
import './ChatPage.scss';

function ChatPage() {
  const { activeChat } = useChat();
  const [currentView, setCurrentView] = useState('chats');
  const [showNewChat, setShowNewChat] = useState(false);

  useMessagePolling();

  function renderMain() {
    if (currentView === 'calls') return <CallsEmpty />;
    if (activeChat) return <ChatWindow />;
    return <EmptyChat onNewChat={() => setShowNewChat(true)} />;
  }

  return (
    <div className="chat-page">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onNewChat={() => setShowNewChat(true)}
      />
      <main className="chat-main">
        {renderMain()}
      </main>

      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} />
      )}
    </div>
  );
}

export default ChatPage;
