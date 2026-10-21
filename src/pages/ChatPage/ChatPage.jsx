import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import useMessagePolling from '../../hooks/useMessagePolling';
import Sidebar from '../../components/Sidebar/Sidebar';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import EmptyChat from '../../components/EmptyChat/EmptyChat';
import './ChatPage.scss';

function ChatPage() {
  const { activeChat } = useChat();
  // 'chats' | 'contacts' — drives both the nav highlight and the sidebar panel
  const [currentView, setCurrentView] = useState('chats');

  // Polling runs here at page level — always active while logged in,
  // regardless of which view is open or whether a chat is selected.
  useMessagePolling();

  return (
    <div className="chat-page">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="chat-main">
        {activeChat ? <ChatWindow /> : <EmptyChat />}
      </main>
    </div>
  );
}

export default ChatPage;
