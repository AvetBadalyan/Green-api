import axios from 'axios';

const API_BASE_URL = 'https://api.green-api.com';
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Create a configured axios instance for a given instance.
 * A single instance is created per credentials object.
 */
const createApiInstance = (idInstance) => {
  return axios.create({
    baseURL: `${API_BASE_URL}/waInstance${idInstance}`,
    headers: { 'Content-Type': 'application/json' },
    timeout: REQUEST_TIMEOUT_MS,
  });
};

/**
 * Send a text message to a WhatsApp number.
 * Docs: https://green-api.com/v3/docs/api/sending/SendMessage/
 */
export const sendMessage = async (credentials, phoneNumber, message) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);

  const response = await api.post(`/sendMessage/${apiTokenInstance}`, {
    chatId: `${phoneNumber}@c.us`,
    message,
  });

  return response.data;
};

/**
 * Receive one incoming notification from the queue.
 * Returns null when the queue is empty.
 * Docs: https://green-api.com/v3/docs/api/receiving/technology-http-api/
 */
export const receiveNotification = async (credentials) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);

  const response = await api.get(`/receiveNotification/${apiTokenInstance}`);
  return response.data;
};

/**
 * Delete a processed notification from the queue by its receipt ID.
 * Must be called after every receiveNotification to advance the queue.
 */
export const deleteNotification = async (credentials, receiptId) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);

  const response = await api.delete(`/deleteNotification/${apiTokenInstance}/${receiptId}`);
  return response.data;
};

/**
 * Get instance settings — used to verify credentials on login.
 */
export const getSettings = async (credentials) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);

  const response = await api.get(`/getSettings/${apiTokenInstance}`);
  return response.data;
};

/**
 * Get the contact list for this WhatsApp instance.
 * Returns an array of { id, name, type } objects.
 * - id: phone number in the format "79001234567@c.us"
 * - name: display name (may be empty)
 * - type: "user" | "group"
 * Docs: https://green-api.com/en/docs/api/contacts/GetContacts/
 */
export const getContacts = async (credentials) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance);

  const response = await api.get(`/getContacts/${apiTokenInstance}`);
  return response.data;
};
