import axios from 'axios';
import {
  API_BASE_URL,
  REQUEST_TIMEOUT_MS,
  MAX_RETRIES,
  BASE_BACKOFF_MS,
  CHAT_HISTORY_COUNT,
  TYPING_INDICATOR_MS,
} from '../constants';

// GREEN-API throttles requests (429). When that happens we retry a couple of
// times with exponential backoff instead of hammering the endpoint.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// In-flight request deduplication — if the same logical request is already
// pending (e.g. React Strict Mode double-mount), return the existing promise
// Deduplicates concurrent calls to the same endpoint (handles StrictMode double-mount).
const pendingRequests = new Map();
const dedupeRequest = (key, fn) => {
  if (pendingRequests.has(key)) return pendingRequests.get(key);
  const promise = fn().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
};

const createApiInstance = (idInstance) => {
  const instance = axios.create({
    baseURL: `${API_BASE_URL}/waInstance${idInstance}`,
    headers: { 'Content-Type': 'application/json' },
    timeout: REQUEST_TIMEOUT_MS,
  });

  // Response interceptor: on 429, wait (respecting Retry-After if present) and retry.
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      const status = error.response?.status;

      if (status === 429 && config && !config.__isRetryRequest) {
        config.__retryCount = (config.__retryCount || 0) + 1;

        if (config.__retryCount <= MAX_RETRIES) {
          const retryAfterHeader = Number(error.response?.headers?.['retry-after']);
          const backoff = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
            ? retryAfterHeader * 1000
            : BASE_BACKOFF_MS * 2 ** (config.__retryCount - 1);

          await sleep(backoff);
          return instance(config);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// ─── Account ─────────────────────────────────────────────────────────────────

/** Verify credentials on login. */
export const getSettings = async (credentials) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.get(`/getSettings/${apiTokenInstance}`);
  return response.data;
};

/**
 * Get instance connection state.
 * Returns: { stateInstance: 'authorized' | 'notAuthorized' | 'sleepMode' | ... }
 * Deduplicated: concurrent calls share one HTTP request (handles Strict Mode double-invoke).
 */
export const getStateInstance = (credentials) => {
  const { idInstance, apiTokenInstance } = credentials;
  return dedupeRequest(`getStateInstance:${idInstance}`, async () => {
    const api = createApiInstance(idInstance);
    const response = await api.get(`/getStateInstance/${apiTokenInstance}`);
    return response.data;
  });
};

// ─── Sending ─────────────────────────────────────────────────────────────────

/**
 * Send a text message to a chat.
 * @param {string} chatId - pre-built chatId, e.g. "79001234567@c.us" or "group@g.us"
 */
export const sendMessage = async (credentials, chatId, message) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.post(`/sendMessage/${apiTokenInstance}`, {
    chatId,
    message,
  });
  return response.data;
};

/**
 * Send a typing notification to the recipient.
 * GREEN-API typingTime: 1000–20000 ms (how long to show the indicator).
 * Source: https://green-api.com/en/docs/api/sending/SendTyping/
 * @param {string} chatId - "phone@c.us" or "groupid@g.us"
 */
export const sendTyping = async (credentials, chatId) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.post(`/sendTyping/${apiTokenInstance}`, {
    chatId,
    typingTime: TYPING_INDICATOR_MS,
  });
  return response.data;
};

// ─── Receiving ───────────────────────────────────────────────────────────────

/** Receive one incoming notification from the queue (null when empty). */
export const receiveNotification = async (credentials) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.get(`/receiveNotification/${apiTokenInstance}`);
  return response.data;
};

/** Delete a processed notification to advance the queue. */
export const deleteNotification = async (credentials, receiptId) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.delete(`/deleteNotification/${apiTokenInstance}/${receiptId}`);
  return response.data;
};

// ─── Service methods ─────────────────────────────────────────────────────────

/**
 * Get the full list of chats for this account.
 * Returns: [{ id, name, type: 'user'|'group', unreadCount, archive }]
 * Deduplicated: concurrent calls share one HTTP request (handles Strict Mode double-invoke).
 */
export const getChats = (credentials) => {
  const { idInstance, apiTokenInstance } = credentials;
  return dedupeRequest(`getChats:${idInstance}`, async () => {
    const api = createApiInstance(idInstance);
    const response = await api.get(`/getChats/${apiTokenInstance}`);
    return response.data;
  });
};

/**
 * Get the contact list.
 * Returns: [{ id, name, type: 'user'|'group' }]
 */
export const getContacts = async (credentials) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.get(`/getContacts/${apiTokenInstance}`);
  return response.data;
};

/**
 * Check if a phone number is registered on WhatsApp.
 * Uses chatId format (recommended over deprecated phoneNumber integer field).
 * @param {string} phoneNumber - digits only, e.g. "79001234567"
 * @returns {{ existsWhatsapp: boolean, chatId: string }}
 */
export const checkWhatsapp = async (credentials, phoneNumber) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.post(`/checkWhatsapp/${apiTokenInstance}`, {
    chatId: `${phoneNumber}@c.us`,
  });
  return response.data;
};

/**
 * Delete a message from a chat.
 * @param {string} chatId - "phone@c.us" or "groupid@g.us"
 * @param {string} idMessage - Message ID to delete
 */
export const deleteMessage = async (credentials, chatId, idMessage) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.post(`/deleteMessage/${apiTokenInstance}`, {
    chatId,
    idMessage,
  });
  return response.data;
};

/**
 * Get message history for a specific chat.
 * GREEN-API count parameter specifies number of messages to return.
 * Source: https://green-api.com/en/docs/api/journals/GetChatHistory/
 * @param {string} chatId  - "phone@c.us" or "groupid@g.us"
 * @param {number} count   - number of messages to return (default from constants)
 */
export const getChatHistory = async (credentials, chatId, count = CHAT_HISTORY_COUNT) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.post(`/getChatHistory/${apiTokenInstance}`, {
    chatId,
    count,
  });
  return response.data;
};

/**
 * Get the avatar URL for a chat or contact.
 * Returns: { urlAvatar, available }
 *
 * GREEN-API returns HTTP 466 when a contact is not registered on the platform.
 * validateStatus treats 466 as a non-error so the browser console stays clean
 * and the avatarCache `.then` handler gracefully resolves to null (no avatar).
 */
export const getAvatar = async (credentials, chatId) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.post(
    `/getAvatar/${apiTokenInstance}`,
    { chatId },
    { validateStatus: (status) => status === 200 || status === 466 }
  );
  return response.data;
};

/**
 * Mark all messages in a chat as read.
 */
export const readChat = async (credentials, chatId) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.post(`/readChat/${apiTokenInstance}`, { chatId });
  return response.data;
};

// ─── Journals ────────────────────────────────────────────────────────────────

/**
 * Get recent incoming calls.
 * Returns: [{ from, status, timestamp, id, video }]
 */
export const getLastIncomingCalls = async (credentials) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.get(`/lastIncomingCalls/${apiTokenInstance}`);
  return response.data;
};

/**
 * Get recent outgoing calls.
 * Returns: [{ to, status, timestamp, id, video }]
 */
export const getLastOutgoingCalls = async (credentials) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.get(`/lastOutgoingCalls/${apiTokenInstance}`);
  return response.data;
};


