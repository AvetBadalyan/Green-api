import { useEffect, useRef } from 'react';
import { receiveNotification, deleteNotification } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const POLL_INTERVAL_MS = 5000;

/**
 * Polls the GREEN-API notification queue on a fixed interval.
 * Must be mounted at the page level (ChatPage) so it runs whether
 * or not a specific chat is open — this ensures messages from new
 * contacts are received and a conversation is created automatically.
 */
function useMessagePolling() {
  const { credentials } = useAuth();
  const { receiveMessage } = useChat();
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!credentials) return;

    const pollOnce = async () => {
      try {
        const notification = await receiveNotification(credentials);

        if (!notification) return;

        const { receiptId, body } = notification;

        if (body?.typeWebhook === 'incomingMessageReceived') {
          const senderPhone = body.senderData?.sender?.replace('@c.us', '');
          const textData = body.messageData?.textMessageData;

          if (senderPhone && textData?.textMessage) {
            receiveMessage(senderPhone, {
              id: body.idMessage || Date.now().toString(),
              text: textData.textMessage,
              type: 'incoming',
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Always delete to advance the queue, regardless of message type
        await deleteNotification(credentials, receiptId);
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    pollOnce(); // Poll immediately on mount
    pollingRef.current = setInterval(pollOnce, POLL_INTERVAL_MS);

    return () => clearInterval(pollingRef.current);
  }, [credentials]);
}

export default useMessagePolling;
