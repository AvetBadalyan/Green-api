import { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

const CHATS_STORAGE_KEY = 'greenapi_chats';

export function ChatProvider({ children }) {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem(CHATS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeChat, setActiveChat] = useState(null);

  const saveChats = (newChats) => {
    setChats(newChats);
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(newChats));
  };

  const createChat = (phoneNumber) => {
    // Format phone number - remove any non-digits
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Check if chat already exists
    const existingChat = chats.find(chat => chat.phoneNumber === cleanPhone);
    if (existingChat) {
      setActiveChat(existingChat);
      return existingChat;
    }

    // Create new chat
    const newChat = {
      id: Date.now().toString(),
      phoneNumber: cleanPhone,
      messages: [],
      createdAt: new Date().toISOString(),
    };

    const updatedChats = [newChat, ...chats];
    saveChats(updatedChats);
    setActiveChat(newChat);
    return newChat;
  };

  const addMessage = (chatId, message) => {
    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        const updatedChat = {
          ...chat,
          messages: [...chat.messages, message],
        };
        // Update active chat if it's the current one
        if (activeChat?.id === chatId) {
          setActiveChat(updatedChat);
        }
        return updatedChat;
      }
      return chat;
    });
    saveChats(updatedChats);
  };

  const deleteChat = (chatId) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    saveChats(updatedChats);
    if (activeChat?.id === chatId) {
      setActiveChat(null);
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
