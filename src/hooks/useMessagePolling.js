import { useEffect, useRef, useCallback } from 'react';
import { receiveNotification, deleteNotification } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const POLL_INTERVAL_MS = 5000;

// Statuses that should advance the message tick UI
const TICK_STATUSES = new Set(['sent', 'delivered', 'read']);

/**
 * Polls the GREEN-API notification queue on a fixed interval.
 * Handles:
 *   - incomingMessageReceived  → adds incoming message to the right chat
 *   - outgoingMessageStatus    → advances tick status (sent → delivered → read)
 * All other notification types are consumed and deleted to keep the queue clear.
 */
export default function useMessagePolling() {
  const { credentials } = useAuth();
  const { receiveMessage, updateMessageStatus } = useChat();
  const pollingRef = useRef(null);
  const isPollingRef = useRef(false);

  const handleIncomingMessage = useCallback(
    (senderPhone, message) => receiveMessage(senderPhone, message),
    [receiveMessage]
  );

  const handleOutgoingStatus = useCallback(
    (webhookChatId, messageId, status) => updateMessageStatus(webhookChatId, messageId, status),
    [updateMessageStatus]
  );

  useEffect(() => {
    if (!credentials) return;

    const pollOnce = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        const notification = await receiveNotification(credentials);
        if (!notification) return;

        const { receiptId, body } = notification;

        if (body?.typeWebhook === 'incomingMessageReceived') {
          const senderPhone = body.senderData?.sender?.replace(/@c\.us$/, '').replace(/@g\.us$/, '');
          const textData = body.messageData?.textMessageData;

          if (senderPhone && textData?.textMessage) {
            handleIncomingMessage(senderPhone, {
              id: body.idMessage || `in-${crypto.randomUUID?.() ?? Date.now()}`,
              text: textData.textMessage,
              type: 'incoming',
              // Use webhook's actual send time, not wall-clock arrival time
              timestamp: body.timestamp
                ? new Date(body.timestamp * 1000).toISOString()
                : new Date().toISOString(),
            });
          }

        } else if (body?.typeWebhook === 'outgoingMessageStatus') {
          // GREEN-API sends ONE webhook type for all delivery transitions.
          // status: 'sent' | 'delivered' | 'read' | 'failed' | 'noAccount' | etc.
          const { chatId, idMessage, status } = body;
          if (chatId && idMessage && TICK_STATUSES.has(status)) {
            handleOutgoingStatus(chatId, idMessage, status);
          }
        }
        // All other types (outgoingAPIMessageReceived, stateInstanceChanged,
        // incomingCall, deviceInfo, etc.) are silently consumed to clear the queue.

        await deleteNotification(credentials, receiptId);
      } catch (err) {
        console.error('Polling error:', err);
      } finally {
        isPollingRef.current = false;
      }
    };

    pollOnce();
    pollingRef.current = setInterval(pollOnce, POLL_INTERVAL_MS);

    return () => clearInterval(pollingRef.current);
  }, [credentials, handleIncomingMessage, handleOutgoingStatus]);
}
