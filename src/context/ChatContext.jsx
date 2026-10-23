import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { DEDUP_WINDOW_MS, STORAGE_KEYS } from '../constants';

const ChatContext = createContext(null);
const CHATS_STORAGE_KEY = STORAGE_KEYS.CHATS;

function loadChatsFromStorage() {
  try {
    const saved = localStorage.getItem(CHATS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function persistChats(updatedChats) {
  try {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updatedChats));
  } catch (err) {
    console.error('Failed to save chats:', err);
  }
}

/** Generate a collision-free unique ID (falls back to counter if crypto unavailable). */
let idCounter = 0;
function uniqueId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/** Extract the phone/group ID from a GREEN-API chatId (removes @c.us / @g.us). */
export function chatIdToPhone(chatId) {
  return chatId.replace(/@c\.us$/, '').replace(/@g\.us$/, '');
}

/** Build a GREEN-API chatId from a phone/group number. */
export function phoneToChatId(phoneNumber, isGroup = false) {
  return `${phoneNumber}@${isGroup ? 'g' : 'c'}.us`;
}

export function ChatProvider({ children, onMount }) {
  const [chats, setChats] = useState(loadChatsFromStorage);
  const [activeChatId, setActiveChatId] = useState(null);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId]
  );

  const setActiveChat = useCallback((chat) => {
    setActiveChatId(chat ? chat.id : null);
    if (chat) {
      setChats((prev) => {
        const updated = prev.map((c) =>
          c.id === chat.id ? { ...c, lastReadAt: new Date().toISOString() } : c
        );
        persistChats(updated);
        return updated;
      });
    }
  }, []);

  // Advance lastReadAt for a chat by ID — used while a chat stays open so
  // messages arriving via polling don't keep inflating the unread badge.
  const markChatReadById = useCallback((chatId) => {
    setChats((prev) => {
      const chat = prev.find((c) => c.id === chatId);
      if (!chat) return prev;
      // Only write if there's actually something newer than lastReadAt
      const hasUnread = chat.messages.some(
        (m) => m.type === 'incoming' && (!chat.lastReadAt || m.timestamp > chat.lastReadAt)
      );
      if (!hasUnread) return prev;
      const updated = prev.map((c) =>
        c.id === chatId ? { ...c, lastReadAt: new Date().toISOString() } : c
      );
      persistChats(updated);
      return updated;
    });
  }, []);

  const createChat = useCallback((phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    setChats((prev) => {
      const existing = prev.find((c) => c.phoneNumber === cleanPhone);
      if (existing) { setActiveChatId(existing.id); return prev; }
      const now = new Date().toISOString();
      const newChat = {
        id: uniqueId('chat'),
        phoneNumber: cleanPhone,
        name: '',
        isGroup: false,
        messages: [],
        createdAt: now,
        lastReadAt: now,
      };
      const updated = [newChat, ...prev];
      persistChats(updated);
      setActiveChatId(newChat.id);
      return updated;
    });
  }, []);

  const addMessage = useCallback((chatId, message) => {
    setChats((prev) => {
      const updated = prev.map((c) =>
        c.id === chatId ? { ...c, messages: [...c.messages, message] } : c
      );
      persistChats(updated);
      return updated;
    });
  }, []);

  const removeMessage = useCallback((chatId, messageId) => {
    setChats((prev) => {
      const updated = prev.map((c) =>
        c.id === chatId
          ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
          : c
      );
      persistChats(updated);
      return updated;
    });
  }, []);

  /**
   * Update the delivery/read status of a specific outgoing message.
   * webhookChatId comes from the outgoingMessageStatus webhook, e.g. "79001234567@c.us".
   */
  const updateMessageStatus = useCallback((webhookChatId, messageId, status) => {
    const phoneNumber = chatIdToPhone(webhookChatId);
    setChats((prev) => {
      const chat = prev.find((c) => c.phoneNumber === phoneNumber);
      if (!chat) return prev;
      const updated = prev.map((c) =>
        c.id === chat.id
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, status } : m
              ),
            }
          : c
      );
      persistChats(updated);
      return updated;
    });
  }, []);

  const receiveMessage = useCallback((phoneNumber, message) => {
    setChats((prev) => {
      const existing = prev.find((c) => c.phoneNumber === phoneNumber);
      let updated;
      if (existing) {
        // Deduplicate: skip if this message ID is already in the chat
        if (existing.messages.some((m) => m.id === message.id)) return prev;
        updated = prev.map((c) =>
          c.id === existing.id
            ? { ...c, messages: [...c.messages, message] }
            : c
        );
      } else {
        const now = new Date().toISOString();
        const newChat = {
          id: uniqueId('chat'),
          phoneNumber,
          name: '',
          isGroup: false,
          messages: [message],
          createdAt: now,
          lastReadAt: new Date(Date.now() - 1000).toISOString(),
        };
        updated = [newChat, ...prev];
      }
      persistChats(updated);
      return updated;
    });
  }, []);

  const deleteChat = useCallback((chatId) => {
    setChats((prev) => {
      const updated = prev.filter((c) => c.id !== chatId);
      persistChats(updated);
      return updated;
    });
    setActiveChatId((prev) => (prev === chatId ? null : prev));
  }, []);

  /**
   * Sync chats from getChats API. Adds new chats, updates names on existing ones.
   * Called once on login; silently fails so the app still works without it.
   */
  const syncApiChats = useCallback((apiChats) => {
    if (!Array.isArray(apiChats) || apiChats.length === 0) return;

    setChats((prev) => {
      let updated = [...prev];

      for (const apiChat of apiChats) {
        const isGroup = apiChat.id.endsWith('@g.us');
        const isUser = apiChat.id.endsWith('@c.us');
        if (!isGroup && !isUser) continue;
        // Skip system/broadcast numbers
        if (apiChat.id === '0@c.us' || apiChat.id === 'status@broadcast') continue;

        const phone = chatIdToPhone(apiChat.id);
        const existingIdx = updated.findIndex((c) => c.phoneNumber === phone);

        if (existingIdx >= 0) {
          // Update name if API has one and we don't
          if (apiChat.name && !updated[existingIdx].name) {
            updated = updated.map((c, i) =>
              i === existingIdx ? { ...c, name: apiChat.name, isGroup } : c
            );
          }
        } else {
          // Add chat from API
          const now = new Date().toISOString();
          const newChat = {
            id: `api-${phone}`,
            phoneNumber: phone,
            name: apiChat.name || '',
            isGroup,
            messages: [],
            createdAt: now,
            lastReadAt: now,
          };
          updated = [...updated, newChat];
        }
      }

      persistChats(updated);
      return updated;
    });
  }, []);

  /**
   * Merge chat history messages into an existing chat.
   * Deduplicates by message ID and sorts chronologically.
   */
  const mergeHistory = useCallback((phoneNumber, apiMessages) => {
    if (!Array.isArray(apiMessages) || apiMessages.length === 0) return;

    setChats((prev) => {
      const chat = prev.find((c) => c.phoneNumber === phoneNumber);
      if (!chat) return prev;

      // Normalise API messages (text only) into our message shape.
      // GREEN-API returns typeMessage 'textMessage' for plain text and
      // 'extendedTextMessage' for anything with a link, quote, or reply.
      // Both shapes carry the human-readable text in the top-level textMessage
      // field; extendedTextMessage also has extendedTextMessage.text as a
      // fallback when textMessage is absent.
      const apiNormalised = apiMessages
        .filter((m) =>
          (m.typeMessage === 'textMessage' || m.typeMessage === 'extendedTextMessage') &&
          (m.textMessage || m.extendedTextMessage?.text)
        )
        .map((m) => ({
          id: m.idMessage,
          text: m.textMessage || m.extendedTextMessage?.text,
          type: m.type === 'incoming' ? 'incoming' : 'outgoing',
          timestamp: new Date(m.timestamp * 1000).toISOString(),
          // Historical outgoing messages have been delivered at minimum
          ...(m.type !== 'incoming' && { status: 'delivered' }),
        }));

      if (apiNormalised.length === 0) return prev;

      // History from WhatsApp is the source of truth. Start from it, then add
      // any locally-sent messages the API hasn't returned yet. Dedupe by ID, and
      // as a fallback by matching identical text within a 2-minute window (a
      // local optimistic send vs its server echo can differ in both id and the
      // exact second/minute they were recorded).
      const seenIds = new Set(apiNormalised.map((m) => m.id));

      const localOnly = chat.messages.filter((m) => {
        if (seenIds.has(m.id)) return false;
        const localTime = new Date(m.timestamp).getTime();
        const echo = apiNormalised.some(
          (api) =>
            api.text === m.text &&
            api.type === m.type &&
            Math.abs(new Date(api.timestamp).getTime() - localTime) < DEDUP_WINDOW_MS
        );
        return !echo;
      });

      const merged = [...apiNormalised, ...localOnly].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      const updated = prev.map((c) =>
        c.id === chat.id ? { ...c, messages: merged } : c
      );
      persistChats(updated);
      return updated;
    });
  }, []);

  const resetChats = useCallback(() => {
    setChats([]);
    setActiveChatId(null);
    try { localStorage.removeItem(CHATS_STORAGE_KEY); } catch {}
  }, []);

  useEffect(() => {
    if (onMount) onMount(resetChats);
  }, [onMount, resetChats]);

  const value = useMemo(
    () => ({
      chats,
      activeChat,
      setActiveChat,
      markChatReadById,
      createChat,
      addMessage,
      removeMessage,
      updateMessageStatus,
      receiveMessage,
      deleteChat,
      resetChats,
      syncApiChats,
      mergeHistory,
    }),
    [chats, activeChat, setActiveChat, markChatReadById, createChat, addMessage,
     removeMessage, updateMessageStatus, receiveMessage, deleteChat, resetChats,
     syncApiChats, mergeHistory]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
}
