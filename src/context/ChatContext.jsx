import { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

const CHATS_STORAGE_KEY = 'greenapi_chats';

export function ChatProvider({ children }) {
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem(CHATS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Store only the active chat ID, derive the full object from chats array.
  // This ensures activeChat is always in sync with chats state.
  const [activeChatId, setActiveChatId] = useState(null);
  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const saveChats = (updatedChats) => {
    setChats(updatedChats);
    try {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updatedChats));
    } catch (err) {
      console.error('Failed to save chats to localStorage:', err);
    }
  };

  const setActiveChat = (chat) => {
    setActiveChatId(chat ? chat.id : null);
  };

  const createChat = (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Reuse existing chat if phone number already exists
    const existingChat = chats.find((chat) => chat.phoneNumber === cleanPhone);
    if (existingChat) {
      setActiveChatId(existingChat.id);
      return existingChat;
    }

    const newChat = {
      id: Date.now().toString(),
      phoneNumber: cleanPhone,
      messages: [],
      createdAt: new Date().toISOString(),
    };

    const updatedChats = [newChat, ...chats];
    saveChats(updatedChats);
    setActiveChatId(newChat.id);
    return newChat;
  };

  const addMessage = (chatId, message) => {
    // Use functional updater to avoid stale closure issues
    setChats((prevChats) => {
      const updatedChats = prevChats.map((chat) => {
        if (chat.id !== chatId) return chat;
        return { ...chat, messages: [...chat.messages, message] };
      });

      try {
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updatedChats));
      } catch (err) {
        console.error('Failed to save chats to localStorage:', err);
      }

      return updatedChats;
    });
  };

  const deleteChat = (chatId) => {
    const updatedChats = chats.filter((chat) => chat.id !== chatId);
    saveChats(updatedChats);
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };

  const value = {
    chats,
    activeChat,
    setActiveChat,
    createChat,
    addMessage,
    deleteChat,
  };

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
