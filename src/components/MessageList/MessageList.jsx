import { useEffect, useRef } from 'react';
import './MessageList.scss';

function MessageList({ messages }) {
  const listRef = useRef(null);

  // Auto-scroll to bottom whenever new messages arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isNaN(date)) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        >
          <div className="message-content">
            <p className="message-text">{message.text}</p>
            <div className="message-meta">
              <time className="message-time" dateTime={message.timestamp}>
                {formatTime(message.timestamp)}
              </time>
              {message.type === 'outgoing' && (
                <svg className="message-checkmark" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-label="Sent" role="img">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MessageList;
