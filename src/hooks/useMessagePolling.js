import { useEffect, useRef, useCallback } from 'react';
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
export default function useMessagePolling() {
  const { credentials } = useAuth();
  const { receiveMessage } = useChat();
  const pollingRef = useRef(null);
  const isPollingRef = useRef(false); // prevents concurrent poll calls

  // Memoize the receiveMessage call to satisfy exhaustive deps
  const handleIncomingMessage = useCallback(
    (senderPhone, message) => {
      receiveMessage(senderPhone, message);
    },
    [receiveMessage]
  );

  useEffect(() => {
    if (!credentials) return;

    const pollOnce = async () => {
      if (isPollingRef.current) return; // already polling, skip this tick
      isPollingRef.current = true;

      try {
        const notification = await receiveNotification(credentials);

        if (!notification) return;

        const { receiptId, body } = notification;

        if (body?.typeWebhook === 'incomingMessageReceived') {
          const senderPhone = body.senderData?.sender?.replace('@c.us', '');
          const textData = body.messageData?.textMessageData;

          if (senderPhone && textData?.textMessage) {
            handleIncomingMessage(senderPhone, {
              id: body.idMessage || `in-${crypto.randomUUID?.() ?? Date.now()}`,
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
      } finally {
        isPollingRef.current = false; // release the lock
      }
    };

    pollOnce(); // Poll immediately on mount
    pollingRef.current = setInterval(pollOnce, POLL_INTERVAL_MS);

    return () => clearInterval(pollingRef.current);
  }, [credentials, handleIncomingMessage]);
}
