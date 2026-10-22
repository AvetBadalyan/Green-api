import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat, phoneToChatId } from '../../context/ChatContext';
import { sendMessage, sendTyping, deleteMessage } from '../../services/api';
import MessageList from '../MessageList/MessageList';
import ChatAvatar from '../ChatAvatar/ChatAvatar';
import './ChatWindow.scss';

// Debounce typing indicator to avoid spamming the API
const TYPING_DEBOUNCE_MS = 2000;

function ChatWindow() {
  const { credentials } = useAuth();
  const { activeChat, addMessage, removeMessage, setActiveChat } = useChat();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeChat?.id]);

  // Send typing indicator (debounced)
  const sendTypingIndicator = useCallback(() => {
    if (!credentials || !activeChat) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_DEBOUNCE_MS) return;
    lastTypingSentRef.current = now;

    const chatId = phoneToChatId(activeChat.phoneNumber, activeChat.isGroup);
    sendTyping(credentials, chatId).catch(() => {
      // Silently fail — typing indicator is non-critical
    });
  }, [credentials, activeChat]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (e.target.value.trim()) {
      sendTypingIndicator();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!inputText.trim() || sending) return;

    setError('');
    setSending(true);

    try {
      const chatId = phoneToChatId(activeChat.phoneNumber, activeChat.isGroup);
      const result = await sendMessage(credentials, chatId, inputText.trim());

      addMessage(activeChat.id, {
        id: result?.idMessage || `local-${crypto.randomUUID?.() ?? Date.now()}`,
        text: inputText.trim(),
        type: 'outgoing',
        timestamp: new Date().toISOString(),
        status: 'sent', // sent → delivered → read
      });

      setInputText('');
    } catch (err) {
      console.error('Send error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Delete a message (called from MessageList context menu)
  const handleDeleteMessage = useCallback(async (messageId) => {
    if (!credentials || !activeChat) return;
    const chatId = phoneToChatId(activeChat.phoneNumber, activeChat.isGroup);
    try {
      await deleteMessage(credentials, chatId, messageId);
      removeMessage(activeChat.id, messageId);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete message');
    }
  }, [credentials, activeChat, removeMessage]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        {/* Back button — always visible (matches MAX web) */}
        <button
          className="chat-back-btn"
          onClick={() => setActiveChat(null)}
          aria-label="Back to chats"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <ChatAvatar
          phoneNumber={activeChat.phoneNumber}
          name={activeChat.name}
          isGroup={activeChat.isGroup}
          size={40}
        />
        <div className="chat-header-info">
          <span className="chat-name">
            {activeChat.name || `+${activeChat.phoneNumber}`}
          </span>
          <span className="chat-subtitle">
            {activeChat.isGroup ? 'Group chat' : 'Personal chat'}
          </span>
        </div>
      </div>

      <MessageList
        messages={activeChat.messages}
        onDeleteMessage={handleDeleteMessage}
      />

      {error && (
        <div className="chat-error" role="alert">
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="chat-input-bar">
        <form className="chat-input-container" onSubmit={handleSend}>
          {/* Attachment — disabled, text-only per task requirements */}
          <button
            type="button"
            className="input-icon-btn"
            aria-label="Upload file"
            disabled
            title="Attachments not available (text-only mode)"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          {/* Text input */}
          <div className="input-field-wrap">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Message"
              aria-label="Message"
              disabled={sending}
              autoComplete="off"
              className="input-field"
            />
          </div>

          {/* Icon buttons — visual only, text-only mode */}
          <button
            type="button"
            className="input-icon-btn"
            aria-label="Open sticker menu"
            disabled
            title="Stickers not available (text-only mode)"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" />
              <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" />
            </svg>
          </button>

          <button
            type="button"
            className="input-icon-btn"
            aria-label="Record video message"
            disabled
            title="Video messages not available (text-only mode)"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="6" width="13" height="12" rx="2" />
              <path d="M22 8l-5 4 5 4V8z" />
            </svg>
          </button>

          <button
            type="button"
            className="input-icon-btn"
            aria-label="Record voice message"
            disabled
            title="Voice messages not available (text-only mode)"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          {inputText.trim() && (
            <button
              type="submit"
              className="send-btn"
              disabled={sending}
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;
