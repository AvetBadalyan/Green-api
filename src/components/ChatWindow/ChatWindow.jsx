import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { sendMessage, receiveNotification, deleteNotification } from '../../services/api';
import MessageList from '../MessageList/MessageList';
import './ChatWindow.scss';

function ChatWindow() {
  const { credentials } = useAuth();
  const { activeChat, addMessage } = useChat();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const pollingRef = useRef(null);

  // Start polling for incoming messages
  useEffect(() => {
    if (!activeChat || !credentials) return;

    const pollMessages = async () => {
      try {
        const notification = await receiveNotification(credentials);
        
        if (notification) {
          const { receiptId, body } = notification;

          // Check if it's an incoming message
          if (body?.typeWebhook === 'incomingMessageReceived') {
            const messageData = body.messageData;
            const senderPhone = body.senderData?.sender?.replace('@c.us', '');

            // Only add message if it's from the active chat's phone
            if (senderPhone === activeChat.phoneNumber && messageData?.textMessageData) {
              const newMessage = {
                id: body.idMessage || Date.now().toString(),
                text: messageData.textMessageData.textMessage,
                type: 'incoming',
                timestamp: new Date().toISOString(),
              };
              addMessage(activeChat.id, newMessage);
            }
          }

          // Delete notification after processing
          await deleteNotification(credentials, receiptId);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Poll every 5 seconds
    pollingRef.current = setInterval(pollMessages, 5000);
    // Initial poll
    pollMessages();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [activeChat?.id, credentials]);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim() || sending) return;

    setError('');
    setSending(true);

    try {
      await sendMessage(credentials, activeChat.phoneNumber, inputText.trim());

      const newMessage = {
        id: Date.now().toString(),
        text: inputText.trim(),
        type: 'outgoing',
        timestamp: new Date().toISOString(),
      };

      addMessage(activeChat.id, newMessage);
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
        <div className="chat-error">
          {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" disabled={!inputText.trim() || sending}>
          {sending ? (
            <span className="loading">...</span>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
