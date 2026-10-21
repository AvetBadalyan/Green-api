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
  if (date.toDateString() === now.toDateString()) {
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

// Each nav item: icon + text label below, exactly like MAX
function NavItem({ view, currentView, setCurrentView, label, children }) {
  const isActive = currentView === view;
  return (
    <button
      className={`nav-item${isActive ? ' nav-item--active' : ''}`}
      onClick={() => setCurrentView(view)}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
    >
      <span className="nav-item__icon" aria-hidden="true">{children}</span>
      <span className="nav-item__label">{label}</span>
    </button>
  );
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

  const handleChatClick = (chat) => {
    setActiveChat(chat);
    setCurrentView('chats');
  };

  return (
    <div className="sidebar-wrapper">

      {/* Left column: 77px icon nav with labels */}
      <nav className="icon-nav" aria-label="Main navigation">

        <div className="icon-nav-top">
          <NavItem view="chats" currentView={currentView} setCurrentView={setCurrentView} label="Chats">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </NavItem>

          <NavItem view="contacts" currentView={currentView} setCurrentView={setCurrentView} label="Contacts">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </NavItem>

          <NavItem view="calls" currentView={currentView} setCurrentView={setCurrentView} label="Calls">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.45 2 2 0 0 1 3.57 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
            </svg>
          </NavItem>
        </div>

        {/* Logout at bottom — same style as nav items */}
        <button className="nav-item nav-item--logout" onClick={logout} aria-label="Logout">
          <span className="nav-item__icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span className="nav-item__label">Logout</span>
        </button>
      </nav>

      {/* Right column: panel that switches by view */}
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
              chats.map((chat) => {
                const unread = getUnreadCount(chat);
                const lastMsgTime = formatChatTime(
                  chat.messages[chat.messages.length - 1]?.timestamp
                );
                return (
                  <div
                    key={chat.id}
                    className={`chat-item${activeChat?.id === chat.id ? ' chat-item--active' : ''}`}
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
                      {chat.phoneNumber.slice(-2)}
                    </div>
                    <div className="chat-info">
                      <div className="chat-item-top">
                        <span className="chat-name">+{chat.phoneNumber}</span>
                        {lastMsgTime && <span className="chat-time">{lastMsgTime}</span>}
                      </div>
                      <div className="chat-item-bottom">
                        <span className="chat-preview">{getLastMessage(chat)}</span>
                        {unread > 0 && (
                          <span className="unread-badge" aria-label={`${unread} unread`}>
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
