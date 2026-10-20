import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Sidebar from '../../components/Sidebar/Sidebar';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import EmptyChat from '../../components/EmptyChat/EmptyChat';
import './ChatPage.scss';

function ChatPage() {
  const { activeChat } = useChat();

  return (
    <div className="chat-page">
      <Sidebar />
      <main className="chat-main">
        {activeChat ? <ChatWindow /> : <EmptyChat />}
      </main>
    </div>
  );
}

export default ChatPage;
