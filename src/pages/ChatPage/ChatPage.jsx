import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat, phoneToChatId } from '../../context/ChatContext';
import useMessagePolling from '../../hooks/useMessagePolling';
import Sidebar from '../../components/Sidebar/Sidebar';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import ChatBackground from '../../components/ChatBackground/ChatBackground';
import NewChatModal from '../../components/NewChatModal/NewChatModal';
import {
  getChats as apiGetChats,
  getChatHistory,
  readChat,
} from '../../services/api';
import './ChatPage.scss';

function ChatPage() {
  const { credentials } = useAuth();
  const {
    activeChat,
    syncApiChats,
    mergeHistory,
    markChatReadById,
  } = useChat();

  // 'all' | 'new' | 'contacts' | 'calls'
  const [currentView, setCurrentView] = useState('all');
  const [showNewChat, setShowNewChat] = useState(false);

  useMessagePolling();

  // Derive stable primitives so effects don't re-run on every chats mutation
  const activeChatId = activeChat?.id ?? null;
  const activePhone = activeChat?.phoneNumber ?? null;
  const activeIsGroup = activeChat?.isGroup ?? false;
  const activeChatIdForApi = activePhone ? phoneToChatId(activePhone, activeIsGroup) : null;

  // Track which chats have had history loaded / been marked read (refs = no re-render)
  const historyLoadedRef = useRef(new Set());
  const readMarkedRef = useRef(new Set());

  // ── Load full chat list from API on mount ─────────────────────────────────
  useEffect(() => {
    if (!credentials) return;
    apiGetChats(credentials)
      .then((chats) => syncApiChats(chats))
      .catch(() => {}); // silently fail — localStorage chats still work
  }, [credentials, syncApiChats]);

  // ── When a chat is opened: load history once + mark read once ─────────────
  useEffect(() => {
    if (!activeChatId || !credentials || !activeChatIdForApi) return;

    if (!historyLoadedRef.current.has(activeChatId)) {
      historyLoadedRef.current.add(activeChatId);
      getChatHistory(credentials, activeChatIdForApi, 50)
        .then((messages) => mergeHistory(activePhone, messages))
        .catch(() => {});
    }

    if (!readMarkedRef.current.has(activeChatId)) {
      readMarkedRef.current.add(activeChatId);
      readChat(credentials, activeChatIdForApi).catch(() => {});
    }
  }, [activeChatId, activeChatIdForApi, activePhone, credentials, mergeHistory]);

  // ── Keep the open chat marked read as new messages arrive via polling ─────
  const activeMsgCount = activeChat?.messages.length ?? 0;
  useEffect(() => {
    if (activeChatId) markChatReadById(activeChatId);
  }, [activeChatId, activeMsgCount, markChatReadById]);

  // On narrow screens we show one pane at a time: the sidebar, or the open chat.
  // Calls view stays in the sidebar pane on mobile (same as Contacts),
  // so we only switch panes when an actual chat is open.
  const chatPaneActive = Boolean(activeChat);

  return (
    <div className={`chat-page${chatPaneActive ? ' chat-page--chat-open' : ''}`}>
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onNewChat={() => setShowNewChat(true)}
      />
      <main className="chat-main">
        {/* Background is always present behind everything */}
        <ChatBackground />
        <div className="chat-main__content">
          {activeChat
            ? <ChatWindow />
            : null /* Empty states (chats, calls, contacts) live in the side panel, matching MAX */
          }
        </div>
      </main>

      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} />
      )}
    </div>
  );
}

export default ChatPage;
