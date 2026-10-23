import { useEffect, useRef, useState } from 'react';
import { IconTrash } from '../../icons';
import { CONTEXT_MENU_MARGIN, CONTEXT_MENU_MARGIN_Y } from '../../constants';
import './MessageList.scss';

function MessageList({ messages, onDeleteMessage }) {
  const listRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    const handleKeyDown = (e) => { if (e.key === 'Escape') setContextMenu(null); };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isNaN(date)) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleContextMenu = (e, message) => {
    // Only outgoing messages can be deleted
    if (message.type !== 'outgoing') return;
    e.preventDefault();
    // Clamp so the menu stays inside the viewport
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - CONTEXT_MENU_MARGIN),
      y: Math.min(e.clientY, window.innerHeight - CONTEXT_MENU_MARGIN_Y),
      messageId: message.id,
    });
  };

  const handleDelete = () => {
    if (contextMenu && onDeleteMessage) {
      onDeleteMessage(contextMenu.messageId);
    }
    setContextMenu(null);
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="message-list empty">
        <p>No messages yet</p>
        <p>Send a message to start the conversation</p>
      </div>
    );
  }

  return (
    <div className="message-list" ref={listRef} role="log" aria-live="polite">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message ${message.type === 'incoming' ? 'incoming' : 'outgoing'}`}
          onContextMenu={(e) => handleContextMenu(e, message)}
        >
          <div className="message-content">
            <p className="message-text">{message.text}</p>
            <div className="message-meta">
              <time className="message-time" dateTime={message.timestamp}>
                {formatTime(message.timestamp)}
              </time>
              {message.type === 'outgoing' && (
                <MessageCheckmark status={message.status} />
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Context menu for delete */}
      {contextMenu && (
        <div
          className="message-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={handleDelete}>
            <IconTrash size={16} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Single tick = sent
 * Double tick = delivered
 * Double tick blue = read
 */
function MessageCheckmark({ status }) {
  // Default to 'sent' if no status
  const actualStatus = status || 'sent';

  if (actualStatus === 'read') {
    // Double tick, blue
    return (
      <svg className="message-checkmark read" width="16" height="14" viewBox="0 0 16 11" fill="none" aria-label="Read">
        <path
          d="M11.5 1L5.5 7L3 4.5M14.5 1L8.5 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (actualStatus === 'delivered') {
    // Double tick, gray
    return (
      <svg className="message-checkmark delivered" width="16" height="14" viewBox="0 0 16 11" fill="none" aria-label="Delivered">
        <path
          d="M11.5 1L5.5 7L3 4.5M14.5 1L8.5 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Single tick = sent
  return (
    <svg className="message-checkmark sent" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="Sent">
      <polyline
        points="20 6 9 17 4 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default MessageList;
