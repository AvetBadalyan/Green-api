import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { sendMessage } from '../../services/api';
import MessageList from '../MessageList/MessageList';
import ChatAvatar from '../ChatAvatar/ChatAvatar';
import './ChatWindow.scss';

function ChatWindow() {
  const { credentials } = useAuth();
  const { activeChat, addMessage } = useChat();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();

    if (!inputText.trim() || sending) return;

    setError('');
    setSending(true);

    try {
      const result = await sendMessage(credentials, activeChat.phoneNumber, inputText.trim());

      addMessage(activeChat.id, {
        id: result?.idMessage || `local-${crypto.randomUUID?.() ?? Date.now()}`,
        text: inputText.trim(),
        type: 'outgoing',
        timestamp: new Date().toISOString(),
      });

      setInputText('');
    } catch (err) {
      console.error('Send error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <ChatAvatar
          phoneNumber={activeChat.phoneNumber}
          name={activeChat.name}
          size={36}
        />
        <div className="chat-header-info">
          <span className="chat-name">
            {activeChat.name || `+${activeChat.phoneNumber}`}
          </span>
        </div>
      </div>

      <MessageList messages={activeChat.messages} />

      {error && (
        <div className="chat-error" role="alert">
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError('')}>✕</button>
        </div>
      )}

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Write a message..."
          disabled={sending}
          autoComplete="off"
        />
        <button
          className="send-btn"
          type="submit"
          disabled={!inputText.trim() || sending}
          aria-label="Send message"
        >
          {sending ? (
            <span className="loading" aria-hidden="true">...</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;
