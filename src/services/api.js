import axios from 'axios';

const API_BASE_URL = 'https://api.green-api.com';
const REQUEST_TIMEOUT_MS = 15000;

// GREEN-API throttles requests (429). When that happens we retry a couple of
// times with exponential backoff instead of hammering the endpoint.
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 1000;

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
 * Send a text message to a WhatsApp chat.
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
 * typingTime: how long to show the indicator (ms, 1000–20000). Defaults to 5s.
 * @param {string} chatId - "phone@c.us" or "groupid@g.us"
 */
export const sendTyping = async (credentials, chatId) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.post(`/sendTyping/${apiTokenInstance}`, {
    chatId,
    typingTime: 5000,
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
 * @param {string} chatId  - "phone@c.us" or "groupid@g.us"
 * @param {number} count   - number of messages to return (default 50)
 */
export const getChatHistory = async (credentials, chatId, count = 50) => {
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
 */
export const getAvatar = async (credentials, chatId) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.post(`/getAvatar/${apiTokenInstance}`, { chatId });
  return response.data;
};

/**
 * Mark all messages in a chat as read.
 */
export const readChat = async (credentials, chatId) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);
  const response = await api.post(`/readChat/${apiTokenInstance}`, { chatId, all: true });
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


