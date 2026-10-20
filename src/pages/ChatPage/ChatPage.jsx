import { useChat } from '../../context/ChatContext';
import useMessagePolling from '../../hooks/useMessagePolling';
import Sidebar from '../../components/Sidebar/Sidebar';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import EmptyChat from '../../components/EmptyChat/EmptyChat';
import './ChatPage.scss';

function ChatPage() {
  const { activeChat } = useChat();

  // Polling runs here at page level — always active while logged in,
  // regardless of whether a chat is selected.
  useMessagePolling();

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
