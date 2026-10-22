import { useEffect, useRef, useCallback } from 'react';
import { receiveNotification, deleteNotification } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const POLL_INTERVAL_MS = 5000;       // normal cadence
const MAX_POLL_INTERVAL_MS = 30000;  // cap when backing off on rate-limit

// Statuses that should advance the message tick UI
const TICK_STATUSES = new Set(['sent', 'delivered', 'read']);

/**
 * Polls the GREEN-API notification queue every 5 seconds.
 * Handles incoming messages and outgoing message status updates.
 * Uses a self-scheduling timeout so the interval grows on 429s and recovers automatically.
 */
export default function useMessagePolling() {
  const { credentials } = useAuth();
  const { receiveMessage, updateMessageStatus } = useChat();
  const isPollingRef = useRef(false);
  const timerRef = useRef(null);
  const delayRef = useRef(POLL_INTERVAL_MS);

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

    let cancelled = false;

    const scheduleNext = () => {
      if (cancelled) return;
      timerRef.current = setTimeout(pollOnce, delayRef.current);
    };

    const pollOnce = async () => {
      if (isPollingRef.current) { scheduleNext(); return; }
      isPollingRef.current = true;

      try {
        const notification = await receiveNotification(credentials);

        // Success → reset to normal cadence
        delayRef.current = POLL_INTERVAL_MS;

        if (notification) {
          const { receiptId, body } = notification;

          if (body?.typeWebhook === 'incomingMessageReceived') {
            const senderPhone = body.senderData?.sender?.replace(/@c\.us$/, '').replace(/@g\.us$/, '');
            const md = body.messageData;
            // Plain text arrives as textMessageData.textMessage;
            // messages with links, quotes or any "extended" format arrive as extendedTextMessageData.text
            const text =
              md?.textMessageData?.textMessage ??
              md?.extendedTextMessageData?.text;

            if (senderPhone && text) {
              handleIncomingMessage(senderPhone, {
                id: body.idMessage || `in-${crypto.randomUUID?.() ?? Date.now()}`,
                text,
                type: 'incoming',
                timestamp: body.timestamp
                  ? new Date(body.timestamp * 1000).toISOString()
                  : new Date().toISOString(),
              });
            }

          } else if (body?.typeWebhook === 'outgoingMessageStatus') {
            const { chatId, idMessage, status } = body;
            if (chatId && idMessage && TICK_STATUSES.has(status)) {
              handleOutgoingStatus(chatId, idMessage, status);
            }
          }

          await deleteNotification(credentials, receiptId);
        }
      } catch (err) {
        // On rate-limit, grow the delay (capped) so we stop hammering.
        if (err?.response?.status === 429) {
          delayRef.current = Math.min(delayRef.current * 2, MAX_POLL_INTERVAL_MS);
        } else {
          console.error('Polling error:', err);
        }
      } finally {
        isPollingRef.current = false;
        scheduleNext();
      }
    };

    pollOnce();

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [credentials, handleIncomingMessage, handleOutgoingStatus]);
}
