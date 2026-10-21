import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import ContactsPanel from '../ContactsPanel/ContactsPanel';
import CallsPage from '../../pages/CallsPage/CallsPage';
import SidePanel from '../SidePanel/SidePanel';
import ChatAvatar from '../ChatAvatar/ChatAvatar';
import './Sidebar.scss';

const PREVIEW_MAX_LENGTH = 40;

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

// ── Filled SVG icons matching MAX's solid icon style ─────────────────────────

const icons = {
  // Filled chat bubble (All chats)
  all: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
  ),
  // Filled folder (New / unread)
  new: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  ),
  // Filled person/contacts
  contacts: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  ),
  // Filled phone handset (Calls)
  calls: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  ),
  // Filled logout arrow
  logout: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  ),
};

// Single nav button with filled icon + label
function NavItem({ view, currentView, setCurrentView, label, icon, badge }) {
  const isActive = currentView === view;
  return (
    <button
      className={`nav-item${isActive ? ' nav-item--active' : ''}`}
      onClick={() => setCurrentView(view)}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
    >
      <span className="nav-item__icon" aria-hidden="true">
        {icon}
        {badge > 0 && <span className="nav-item__badge">{badge > 99 ? '99+' : badge}</span>}
      </span>
      <span className="nav-item__label">{label}</span>
    </button>
  );
}

function Sidebar({ currentView, setCurrentView, onNewChat }) {
  const { logout } = useAuth();
  const { chats, activeChat, setActiveChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

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
    if (currentView === 'new') setCurrentView('all');
  };

  // Unread count across ALL chats for the "New" badge
  const totalUnread = chats.reduce((sum, c) => sum + getUnreadCount(c), 0);

  // Filter logic
  const isChatsView = currentView === 'all' || currentView === 'new';
  const visibleChats = isChatsView
    ? chats
        .filter((c) => {
          if (currentView === 'new') return getUnreadCount(c) > 0;
          return true;
        })
        .filter((c) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            (c.name || '').toLowerCase().includes(q) ||
            c.phoneNumber.includes(searchQuery.replace(/\D/g, ''))
          );
        })
    : [];

  return (
    <div className="sidebar-wrapper">

      {/* ── Left nav: 77px ── */}
      <nav className="icon-nav" aria-label="Main navigation">

        {/* Top group: chat folder tabs */}
        <div className="nav-scroll">
          <NavItem
            view="all"
            currentView={currentView}
            setCurrentView={setCurrentView}
            label="All"
            icon={icons.all}
          />
          <NavItem
            view="new"
            currentView={currentView}
            setCurrentView={setCurrentView}
            label="New"
            icon={icons.new}
            badge={totalUnread}
          />
        </div>

        <div className="nav-separator" aria-hidden="true" />

        {/* Bottom group: other sections */}
        <div className="nav-bottom">
          <NavItem
            view="contacts"
            currentView={currentView}
            setCurrentView={setCurrentView}
            label="Contacts"
            icon={icons.contacts}
          />
          <NavItem
            view="calls"
            currentView={currentView}
            setCurrentView={setCurrentView}
            label="Calls"
            icon={icons.calls}
          />

          <div className="nav-logout-slot">
            <button className="nav-item" onClick={logout} aria-label="Logout">
              <span className="nav-item__icon" aria-hidden="true">{icons.logout}</span>
              <span className="nav-item__label">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Right panel ── */}
      {currentView === 'contacts' ? (
        <ContactsPanel setCurrentView={setCurrentView} />
      ) : currentView === 'calls' ? (
        <CallsPage />
      ) : (
        <SidePanel
          title="Chats"
          actions={
            <button
              className="new-chat-btn"
              onClick={onNewChat}
              title="New Chat"
              aria-label="Start new chat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          }
          search={
            <input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search chats"
            />
          }
        >
          <div className="chat-list" role="list">
            {visibleChats.length === 0 ? (
              <div className="no-chats">
                {searchQuery
                  ? <p>No chats match "{searchQuery}"</p>
                  : currentView === 'new'
                    ? <><p>No unread messages</p><p>You're all caught up!</p></>
                    : <><p>No chats yet</p><p>Click + to start a conversation</p></>
                }
              </div>
            ) : (
              visibleChats.map((chat) => {
                const unread = getUnreadCount(chat);
                const lastMsgTime = formatChatTime(
                  chat.messages[chat.messages.length - 1]?.timestamp
                );
                const displayName = chat.name || `+${chat.phoneNumber}`;

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
                    <ChatAvatar
                      phoneNumber={chat.phoneNumber}
                      name={chat.name}
                      size={44}
                    />
                    <div className="chat-info">
                      <div className="chat-item-top">
                        <span className="chat-name">{displayName}</span>
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
        </SidePanel>
      )}
    </div>
  );
}

export default Sidebar;
