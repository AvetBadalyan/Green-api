import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { sendMessage, receiveNotification, deleteNotification } from '../../services/api';
import MessageList from '../MessageList/MessageList';
import './ChatWindow.scss';

const POLL_INTERVAL_MS = 5000;

function ChatWindow() {
  const { credentials } = useAuth();
  const { chats, activeChat, addMessage } = useChat();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!credentials) return;

    const pollMessages = async () => {
      try {
        const notification = await receiveNotification(credentials);

        if (!notification) return;

        const { receiptId, body } = notification;

        // Only handle incoming text messages
        if (body?.typeWebhook === 'incomingMessageReceived') {
          const senderPhone = body.senderData?.sender?.replace('@c.us', '');
          const textData = body.messageData?.textMessageData;

          // Route the message to its corresponding chat, not just the active one.
          // This prevents losing messages from non-active chats.
          const targetChat = chats.find((c) => c.phoneNumber === senderPhone);

          if (targetChat && textData?.textMessage) {
            addMessage(targetChat.id, {
              id: body.idMessage || Date.now().toString(),
              text: textData.textMessage,
              type: 'incoming',
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Always delete the notification to advance the queue
        await deleteNotification(credentials, receiptId);
      } catch (err) {
        // Silently ignore polling errors (network blips, etc.)
        console.error('Polling error:', err);
      }
    };

    pollingRef.current = setInterval(pollMessages, POLL_INTERVAL_MS);
    pollMessages(); // Poll immediately on mount

    return () => clearInterval(pollingRef.current);
  }, [credentials]); // Only re-run if credentials change, not on every chat switch

  const handleSend = async (e) => {
    e.preventDefault();

    if (!inputText.trim() || sending) return;

    setError('');
    setSending(true);

    try {
      const result = await sendMessage(credentials, activeChat.phoneNumber, inputText.trim());

      addMessage(activeChat.id, {
        id: result?.idMessage || Date.now().toString(),
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
        <div className="chat-avatar">
          {activeChat.phoneNumber.slice(-2)}
        </div>
        <div className="chat-header-info">
          <span className="chat-name">+{activeChat.phoneNumber}</span>
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
