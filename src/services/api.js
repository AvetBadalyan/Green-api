import axios from 'axios';

const API_BASE_URL = 'https://api.green-api.com';

/**
 * Create axios instance with credentials
 */
const createApiInstance = (idInstance, apiTokenInstance) => {
  return axios.create({
    baseURL: `${API_BASE_URL}/waInstance${idInstance}`,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Send a text message
 * https://green-api.com/v3/docs/api/sending/SendMessage/
 */
export const sendMessage = async (credentials, phoneNumber, message) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance, apiTokenInstance);

  const response = await api.post(`/sendMessage/${apiTokenInstance}`, {
    chatId: `${phoneNumber}@c.us`,
    message: message,
  });

  return response.data;
};

/**
 * Receive incoming notification
 * https://green-api.com/v3/docs/api/receiving/technology-http-api/
 */
export const receiveNotification = async (credentials) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance, apiTokenInstance);

  const response = await api.get(`/receiveNotification/${apiTokenInstance}`);
  return response.data;
};

/**
 * Delete notification after processing
 */
export const deleteNotification = async (credentials, receiptId) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance, apiTokenInstance);

  const response = await api.delete(`/deleteNotification/${apiTokenInstance}/${receiptId}`);
  return response.data;
};

/**
 * Get account settings / check if instance is authorized
 */
export const getSettings = async (credentials) => {
  const { idInstance, apiTokenInstance } = credentials;
  const api = createApiInstance(idInstance, apiTokenInstance);

  const response = await api.get(`/getSettings/${apiTokenInstance}`);
  return response.data;
};
