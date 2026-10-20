import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import NewChatModal from '../NewChatModal/NewChatModal';
import './Sidebar.scss';

function Sidebar() {
  const { logout } = useAuth();
  const { chats, activeChat, setActiveChat } = useChat();
  const [showNewChat, setShowNewChat] = useState(false);

  const formatPhoneNumber = (phone) => {
    return `+${phone}`;
  };

  const getLastMessage = (chat) => {
    if (chat.messages.length === 0) return 'No messages yet';
    const lastMsg = chat.messages[chat.messages.length - 1];
    return lastMsg.text.length > 30 ? lastMsg.text.substring(0, 30) + '...' : lastMsg.text;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">G</span>
          <span className="logo-text">GREEN-API</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Logout">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      <button className="new-chat-btn" onClick={() => setShowNewChat(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Chat
      </button>

      <div className="chat-list">
        {chats.length === 0 ? (
          <div className="no-chats">
            <p>No chats yet</p>
            <p>Start a new conversation</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => setActiveChat(chat)}
            >
              <div className="chat-avatar">
                {chat.phoneNumber.slice(-2)}
              </div>
              <div className="chat-info">
                <span className="chat-name">{formatPhoneNumber(chat.phoneNumber)}</span>
                <span className="chat-preview">{getLastMessage(chat)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </aside>
  );
}

export default Sidebar;
