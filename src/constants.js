/**
 * Application-wide constants.
 * Centralizes magic numbers and configuration values for easier maintenance.
 * GREEN-API documentation references included where applicable.
 */

// ─── API Configuration ───────────────────────────────────────────────────────
export const API_BASE_URL = 'https://api.green-api.com';
export const REQUEST_TIMEOUT_MS = 15000; // 15s — generous to handle slow responses
export const MAX_RETRIES = 2; // Retry twice on 429 before giving up
export const BASE_BACKOFF_MS = 1000; // Start with 1s, then 2s exponential backoff

// ─── Polling Intervals ───────────────────────────────────────────────────────
// GREEN-API receiveNotification waits up to 5 seconds per call when queue is empty.
// Source: https://green-api.com/en/docs/api/receiving/technology-http-api/ReceiveNotification/
export const MESSAGE_POLL_INTERVAL_MS = 5000; // Match the server wait time
export const MESSAGE_POLL_MAX_INTERVAL_MS = 30000; // Max backoff on rate limit
export const CONNECTION_POLL_INTERVAL_MS = 60000; // Connection status check (low priority)
export const CONNECTION_INITIAL_DELAY_MS = 2000; // Delay first check to avoid startup burst

// ─── Avatar Fetching ─────────────────────────────────────────────────────────
export const AVATAR_MAX_CONCURRENT = 3; // Concurrent avatar requests
export const AVATAR_QUEUE_DELAY_MS = 50; // Breathing room between batches
// Storage key lives in STORAGE_KEYS.AVATARS below

// ─── Chat Configuration ──────────────────────────────────────────────────────
// GREEN-API getChatHistory accepts count parameter (number of messages to return).
// Source: https://green-api.com/en/docs/api/journals/GetChatHistory/
export const CHAT_HISTORY_COUNT = 50; // Messages to load per chat

// GREEN-API sendTyping typingTime parameter: 1000–20000 ms.
// Source: https://green-api.com/en/docs/api/sending/SendTyping/
export const TYPING_INDICATOR_MS = 5000; // Middle of the valid range
export const TYPING_DEBOUNCE_MS = 2000; // Debounce between typing sends

// GREEN-API requires phone numbers in international format: 11 to 16 digits.
// Source: https://green-api.com/en/docs/api/service/CheckWhatsapp/
export const MIN_PHONE_LENGTH = 11;
export const MAX_PHONE_LENGTH = 16;

// ─── UI Constants ────────────────────────────────────────────────────────────
// Context menu positioning — offset from viewport edge to keep menu visible
export const CONTEXT_MENU_MARGIN = 160; // Horizontal margin (menu width ~140px)
export const CONTEXT_MENU_MARGIN_Y = 60; // Y-axis offset from viewport edge

// Message deduplication window — prevent showing duplicate messages from
// both optimistic UI and server echo within this time window.
export const DEDUPLICATION_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

// Retry delays for fetching contacts/calls on transient failures
export const RETRY_BASE_DELAY_MS = 500; // 500ms, 1000ms progression

// ─── Storage Keys ────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  CREDENTIALS: 'greenapi_credentials',
  CHATS: 'greenapi_chats',
  AVATARS: 'gapi_avatars',
};

// ─── Message Statuses ────────────────────────────────────────────────────────
// GREEN-API outgoingMessageStatus webhook status values.
// Source: https://green-api.com/en/docs/api/receiving/notifications-format/outgoing-message/OutgoingMessageStatus/
export const MESSAGE_STATUSES = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
};

// ─── Webhook Types ───────────────────────────────────────────────────────────
// GREEN-API webhook typeWebhook values.
// Source: https://green-api.com/en/docs/api/receiving/notifications-format/
export const WEBHOOK_TYPES = {
  INCOMING_MESSAGE: 'incomingMessageReceived',
  OUTGOING_STATUS: 'outgoingMessageStatus',
};
