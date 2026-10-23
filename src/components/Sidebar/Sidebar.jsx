import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import ContactsPanel from '../ContactsPanel/ContactsPanel';
import CallsPage from '../../pages/CallsPage/CallsPage';
import SidePanel from '../SidePanel/SidePanel';
import ChatAvatar from '../ChatAvatar/ChatAvatar';
import NewChatMenu from '../NewChatMenu/NewChatMenu';
import {
  IconChatsFilled, IconFolderFilled, IconContactsFilled,
  IconPhoneFilled, IconLogoutFilled, IconPlus,
} from '../../icons';
import './Sidebar.scss';

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

// Small tick mark for chat list (next to time)
// List tick — same convention as the message bubble (MessageList):
//   sent → single gray tick, delivered → double gray, read → double blue.
function ChatTick({ status }) {
  const isDouble = status === 'delivered' || status === 'read'; // shape
  const isRead = status === 'read';                              // blue only when read

  return (
    <svg
      className={`chat-tick${isRead ? ' chat-tick--read' : ''}`}
      width="16"
      height="16"
      viewBox="0 0 16 11"
      fill="none"
      aria-hidden="true"
    >
      {isDouble ? (
        <path
          d="M11.5 1L5.5 7L3 4.5M14.5 1L8.5 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M14 1L6 9L2 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

// Sidebar navigation icons (solid/filled style)
const icons = {
  all:      <IconChatsFilled />,
  new:      <IconFolderFilled />,
  contacts: <IconContactsFilled />,
  calls:    <IconPhoneFilled />,
  logout:   <IconLogoutFilled />,
};

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
  const [menuOpen, setMenuOpen] = useState(false);

  const getLastMessage = (chat) => {
    if (chat.messages.length === 0) return '';
    const last = chat.messages[chat.messages.length - 1];
    // Return raw text — CSS -webkit-line-clamp handles 2-line overflow
    return last?.text ?? '';
  };

  const handleChatClick = (chat) => {
    setActiveChat(chat);
    if (currentView === 'new') setCurrentView('all');
  };

  const totalUnread = chats.reduce((sum, chat) => sum + getUnreadCount(chat), 0);

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

      <nav className="icon-nav" aria-label="Main navigation">

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
            <div className="new-chat-wrap">
              <button
                className="new-chat-btn"
                onClick={() => setMenuOpen((o) => !o)}
                title="New Chat"
                aria-label="Start new chat"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <IconPlus size={20} />
              </button>
              {menuOpen && (
                <NewChatMenu
                  onSearchByNumber={onNewChat}
                  onClose={() => setMenuOpen(false)}
                />
              )}
            </div>
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
                  <button
                    key={chat.id}
                    className={`chat-item${activeChat?.id === chat.id ? ' chat-item--active' : ''}`}
                    onClick={() => handleChatClick(chat)}
                    aria-label={`Chat with ${displayName}`}
                    aria-pressed={activeChat?.id === chat.id}
                  >
                    <div className="chat-avatar-wrap">
                      <ChatAvatar
                        phoneNumber={chat.phoneNumber}
                        name={chat.name}
                        isGroup={chat.isGroup}
                        size={56}
                      />
                    </div>
                    <div className="chat-info">
                      <div className="chat-item-top">
                        <span className="chat-name">{displayName}</span>
                        <span className="chat-time">
                          {chat.messages.length > 0 && chat.messages[chat.messages.length - 1]?.type === 'outgoing' && (
                            <ChatTick status={chat.messages[chat.messages.length - 1]?.status} />
                          )}
                          {lastMsgTime && <span>{lastMsgTime}</span>}
                        </span>
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
                  </button>
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
