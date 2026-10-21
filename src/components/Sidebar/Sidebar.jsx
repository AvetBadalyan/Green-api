import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import ContactsPanel from '../ContactsPanel/ContactsPanel';
import CallsPage from '../../pages/CallsPage/CallsPage';
import './Sidebar.scss';

const PREVIEW_MAX_LENGTH = 35;

function formatChatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date)) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getUnreadCount(chat) {
  if (!chat.lastReadAt) return 0;
  return chat.messages.filter(
    (m) => m.type === 'incoming' && m.timestamp > chat.lastReadAt
  ).length;
}

function Sidebar({ currentView, setCurrentView, onNewChat }) {
  const { logout } = useAuth();
  const { chats, activeChat, setActiveChat } = useChat();

  const getLastMessage = (chat) => {
    if (chat.messages.length === 0) return 'No messages yet';
    const last = chat.messages[chat.messages.length - 1];
    const text = last?.text ?? '(attachment)';
    return text.length > PREVIEW_MAX_LENGTH
      ? `${text.substring(0, PREVIEW_MAX_LENGTH)}...`
      : text;
  };

  const getInitials = (phone) => phone.slice(-2);

  const handleChatClick = (chat) => {
    setActiveChat(chat); // also resets lastReadAt → clears unread badge
    setCurrentView('chats');
  };

  return (
    <div className="sidebar-wrapper">
      {/* Narrow icon nav */}
      <nav className="icon-nav" aria-label="Main navigation">
        <div className="icon-nav-logo" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
            <circle cx="12" cy="12" r="6" fill="currentColor" />
          </svg>
        </div>

        <div className="icon-nav-items">
          <button
            className={`nav-icon ${currentView === 'chats' ? 'active' : ''}`}
            title="Chats"
            aria-label="Chats"
            aria-current={currentView === 'chats' ? 'page' : undefined}
            onClick={() => setCurrentView('chats')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          <button
            className={`nav-icon ${currentView === 'contacts' ? 'active' : ''}`}
            title="Contacts"
            aria-label="Contacts"
            aria-current={currentView === 'contacts' ? 'page' : undefined}
            onClick={() => setCurrentView('contacts')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>

          <button
            className={`nav-icon ${currentView === 'calls' ? 'active' : ''}`}
            title="Calls"
            aria-label="Calls"
            aria-current={currentView === 'calls' ? 'page' : undefined}
            onClick={() => setCurrentView('calls')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.45 2 2 0 0 1 3.57 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
            </svg>
          </button>
        </div>

        <button
          className="nav-icon nav-logout"
          title="Logout"
          onClick={logout}
          aria-label="Logout"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </nav>

      {/* Second column — switches by view */}
      {currentView === 'contacts' ? (
        <ContactsPanel setCurrentView={setCurrentView} />
      ) : currentView === 'calls' ? (
        <CallsPage />
      ) : (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <h1>Chats</h1>
            <button
              className="new-chat-btn"
              onClick={onNewChat}
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
              chats.map((chat) => {
                const unread = getUnreadCount(chat);
                const lastMsgTime = formatChatTime(
                  chat.messages[chat.messages.length - 1]?.timestamp
                );

                return (
                  <div
                    key={chat.id}
                    className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                    onClick={() => handleChatClick(chat)}
                    role="listitem"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleChatClick(chat);
                      }
                    }}
                    aria-selected={activeChat?.id === chat.id}
                  >
                    <div className="chat-avatar" aria-hidden="true">
                      {getInitials(chat.phoneNumber)}
                    </div>
                    <div className="chat-info">
                      <div className="chat-item-top">
                        <span className="chat-name">+{chat.phoneNumber}</span>
                        {lastMsgTime && (
                          <span className="chat-time">{lastMsgTime}</span>
                        )}
                      </div>
                      <div className="chat-item-bottom">
                        <span className="chat-preview">{getLastMessage(chat)}</span>
                        {unread > 0 && (
                          <span className="unread-badge" aria-label={`${unread} unread messages`}>
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
