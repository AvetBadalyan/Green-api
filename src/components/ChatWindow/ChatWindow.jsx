import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { phoneToChatId } from '../../utils/chatId';
import { sendMessage, sendTyping, deleteMessage } from '../../services/api';
import { TYPING_DEBOUNCE_MS } from '../../constants';
import MessageList from '../MessageList/MessageList';
import ChatAvatar from '../ChatAvatar/ChatAvatar';
import {
  IconBack, IconSearch, IconAttach, IconEmoji,
  IconVideo, IconMic, IconSend,
} from '../../icons';
import './ChatWindow.scss';

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
        status: 'sent',
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
          <IconBack />
        </button>
        <ChatAvatar
          phoneNumber={activeChat.phoneNumber}
          name={activeChat.name}
          isGroup={activeChat.isGroup}
          size={40}
        />
        <div className="chat-header-info">
          <h2 className="chat-name">
            {activeChat.name || `+${activeChat.phoneNumber}`}
          </h2>
          <span className="chat-subtitle">
            {activeChat.isGroup ? 'Group chat' : 'Personal chat'}
          </span>
        </div>

        {/* Search icon — matches MAX's chat header right side (visual parity, text-only mode) */}
        <button
          className="chat-header-search-btn"
          disabled
          aria-label="Search in chat"
          title="Search not available (text-only mode)"
        >
          <IconSearch strokeWidth={1.8} />
        </button>
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
            <IconAttach />
          </button>

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

          <button
            type="button"
            className="input-icon-btn"
            aria-label="Open sticker menu"
            disabled
            title="Stickers not available (text-only mode)"
          >
            <IconEmoji />
          </button>

          <button
            type="button"
            className="input-icon-btn"
            aria-label="Record video message"
            disabled
            title="Video messages not available (text-only mode)"
          >
            <IconVideo />
          </button>

          <button
            type="button"
            className="input-icon-btn"
            aria-label="Record voice message"
            disabled
            title="Voice messages not available (text-only mode)"
          >
            <IconMic />
          </button>

          {inputText.trim() && (
            <button
              type="submit"
              className="send-btn"
              disabled={sending}
              aria-label="Send message"
            >
              <IconSend size={20} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;
