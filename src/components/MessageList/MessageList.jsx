import { useEffect, useRef } from 'react';
import './MessageList.scss';

function MessageList({ messages }) {
  const listRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (messages.length === 0) {
    return (
      <div className="message-list empty">
        <p>No messages yet</p>
        <p>Send a message to start the conversation</p>
      </div>
    );
  }

  return (
    <div className="message-list" ref={listRef}>
      {messages.map((message) => (
        <div key={message.id} className={`message ${message.type}`}>
          <div className="message-content">
            <p className="message-text">{message.text}</p>
            <span className="message-time">{formatTime(message.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MessageList;
