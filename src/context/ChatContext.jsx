import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';

const ChatContext = createContext(null);

const CHATS_STORAGE_KEY = 'greenapi_chats';

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
    console.error('Failed to save chats to localStorage:', err);
  }
}

export function ChatProvider({ children, onMount }) {
  const [chats, setChats] = useState(loadChatsFromStorage);

  // Store only the active chat ID, derive the full object from chats array.
  const [activeChatId, setActiveChatId] = useState(null);
  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId]
  );

  const setActiveChat = useCallback((chat) => {
    setActiveChatId(chat ? chat.id : null);
  }, []);

  const createChat = useCallback((phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    setChats((prevChats) => {
      // Reuse existing chat if phone number already exists
      const existingChat = prevChats.find((chat) => chat.phoneNumber === cleanPhone);
      if (existingChat) {
        setActiveChatId(existingChat.id);
        return prevChats;
      }

      const newChat = {
        id: Date.now().toString(),
        phoneNumber: cleanPhone,
        messages: [],
        createdAt: new Date().toISOString(),
      };

      const updatedChats = [newChat, ...prevChats];
      persistChats(updatedChats);
      setActiveChatId(newChat.id);
      return updatedChats;
    });
  }, []);

  const addMessage = useCallback((chatId, message) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.map((chat) => {
        if (chat.id !== chatId) return chat;
        return { ...chat, messages: [...chat.messages, message] };
      });
      persistChats(updatedChats);
      return updatedChats;
    });
  }, []);

  // Handle an inbound message by phone number: append it to the matching chat,
  // or create a new chat if the sender is not yet in the list.
  const receiveMessage = useCallback((phoneNumber, message) => {
    setChats((prevChats) => {
      const existingChat = prevChats.find((c) => c.phoneNumber === phoneNumber);

      let updatedChats;
      if (existingChat) {
        updatedChats = prevChats.map((chat) =>
          chat.id === existingChat.id
            ? { ...chat, messages: [...chat.messages, message] }
            : chat
        );
      } else {
        const newChat = {
          id: Date.now().toString(),
          phoneNumber,
          messages: [message],
          createdAt: new Date().toISOString(),
        };
        updatedChats = [newChat, ...prevChats];
      }

      persistChats(updatedChats);
      return updatedChats;
    });
  }, []);

  const deleteChat = useCallback((chatId) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.filter((chat) => chat.id !== chatId);
      persistChats(updatedChats);
      return updatedChats;
    });
    setActiveChatId((prevId) => (prevId === chatId ? null : prevId));
  }, []);

  // Reset all chat state (called on logout)
  const resetChats = useCallback(() => {
    setChats([]);
    setActiveChatId(null);
    try {
      localStorage.removeItem(CHATS_STORAGE_KEY);
    } catch {}
  }, []);

  // Register resetChats with parent on mount
  useEffect(() => {
    if (onMount) {
      onMount(resetChats);
    }
  }, [onMount, resetChats]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      chats,
      activeChat,
      setActiveChat,
      createChat,
      addMessage,
      receiveMessage,
      deleteChat,
      resetChats,
    }),
    [chats, activeChat, setActiveChat, createChat, addMessage, receiveMessage, deleteChat, resetChats]
  );

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
