import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import NewChatModal from '../NewChatModal/NewChatModal';
import './Sidebar.scss';

const PREVIEW_MAX_LENGTH = 35;

function Sidebar() {
  const { logout } = useAuth();
  const { chats, activeChat, setActiveChat } = useChat();
  const [showNewChat, setShowNewChat] = useState(false);

  const formatPhoneNumber = (phone) => `+${phone}`;

  const getLastMessage = (chat) => {
    if (chat.messages.length === 0) return 'No messages yet';
    const last = chat.messages[chat.messages.length - 1];
    const text = last?.text ?? '(attachment)';
    return text.length > PREVIEW_MAX_LENGTH
      ? `${text.substring(0, PREVIEW_MAX_LENGTH)}...`
      : text;
  };

  const getInitials = (phone) => phone.slice(-2);

  return (
    <div className="sidebar-wrapper">
      {/* Narrow icon nav — matches MAX web left column */}
      <nav className="icon-nav" aria-label="Main navigation">
        <div className="icon-nav-logo" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#1877f2" opacity="0.2" />
            <circle cx="12" cy="12" r="6" fill="#1877f2" />
          </svg>
        </div>

        <div className="icon-nav-items">
          <button className="nav-icon active" title="Chats" aria-current="page">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          <button className="nav-icon" title="Contacts" disabled>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>

          <button className="nav-icon" title="Calls" disabled>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.45 2 2 0 0 1 3.57 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
            </svg>
          </button>
        </div>

        <button className="nav-icon nav-logout" title="Logout" onClick={logout} aria-label="Logout">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </nav>

      {/* Chat list panel */}
      <div className="chat-panel">
        <div className="chat-panel-header">
          <h2>Chats</h2>
          <button
            className="new-chat-btn"
            onClick={() => setShowNewChat(true)}
            title="New Chat"
            aria-label="Start new chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <div className="search-bar" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Search</span>
        </div>

        <div className="chat-list" role="list">
          {chats.length === 0 ? (
            <div className="no-chats">
              <p>No chats yet</p>
              <p>Click + to start a conversation</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => setActiveChat(chat)}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveChat(chat)}
                aria-selected={activeChat?.id === chat.id}
              >
                <div className="chat-avatar" aria-hidden="true">
                  {getInitials(chat.phoneNumber)}
                </div>
                <div className="chat-info">
                  <span className="chat-name">{formatPhoneNumber(chat.phoneNumber)}</span>
                  <span className="chat-preview">{getLastMessage(chat)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} />
      )}
    </div>
  );
}

export default Sidebar;
