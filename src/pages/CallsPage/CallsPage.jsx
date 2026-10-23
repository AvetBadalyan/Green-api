import { useReducer, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { getLastIncomingCalls, getLastOutgoingCalls } from '../../services/api';
import { RETRY_BASE_DELAY_MS } from '../../constants';
import SidePanel from '../../components/SidePanel/SidePanel';
import ChatAvatar from '../../components/ChatAvatar/ChatAvatar';
import { EmptyStateIcon } from '../../components/EmptyState/EmptyState';
import { IconPhoneFilled } from '../../icons';
import { chatIdToPhone } from '../../utils/chatId';
import './CallsPage.scss';

const INITIAL = { calls: [], loading: true, error: '' };

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':   return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS': return { loading: false, error: '', calls: action.calls };
    case 'FETCH_ERROR':   return { ...state, loading: false, error: action.error };
    default: return state;
  }
}

function formatCallTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function callStatusLabel(status) {
  switch (status) {
    case 'notAnswered': return 'No answer';
    case 'missed':      return 'Missed';
    case 'accepted':    return 'Answered';
    case 'busy':        return 'Busy';
    default:            return status || '';
  }
}

function CallsPage() {
  const { credentials } = useAuth();
  const { createChat, setActiveChat, chats } = useChat();
  const [{ calls, loading, error }, dispatch] = useReducer(reducer, INITIAL);

  const fetchCalls = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });

    // Retry up to 3 times with backoff — same resilience as ContactsPanel,
    // both panels hit the same rate-limited account.
    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const [incoming, outgoing] = await Promise.all([
          getLastIncomingCalls(credentials),
          getLastOutgoingCalls(credentials),
        ]);

        const normalised = [
          ...(incoming ?? []).map((c) => ({ ...c, direction: 'incoming', phone: chatIdToPhone(c.from) })),
          ...(outgoing ?? []).map((c) => ({ ...c, direction: 'outgoing', phone: chatIdToPhone(c.to) })),
        ].sort((a, b) => b.timestamp - a.timestamp); // newest first

        dispatch({ type: 'FETCH_SUCCESS', calls: normalised });
        return;
      } catch {
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, attempt * RETRY_BASE_DELAY_MS));
        }
      }
    }

    dispatch({ type: 'FETCH_ERROR', error: 'Could not load call history.' });
  }, [credentials]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  const handleCallClick = (call) => {
    // Open or create a chat with this contact
    const existing = chats.find((c) => c.phoneNumber === call.phone);
    if (existing) {
      setActiveChat(existing);
    } else {
      createChat(call.phone);
    }
  };

  return (
    <SidePanel title="Calls">
      {loading && (
        <div className="panel-status">
          <div className="spinner" aria-hidden="true" />
          <p>Loading calls…</p>
        </div>
      )}

      {!loading && error && (
        <div className="panel-status panel-status--error" role="alert">
          <p>{error}</p>
          <button onClick={fetchCalls} className="retry-btn">Retry</button>
        </div>
      )}

      {!loading && !error && calls.length === 0 && (
        <div className="panel-empty calls-empty">
          <EmptyStateIcon>
            <IconPhoneFilled size={32} />
          </EmptyStateIcon>
          <div className="panel-empty__info">
            <p className="panel-empty__title">Who would you like to call?</p>
            <p className="panel-empty__subtitle">Your call history will be here</p>
          </div>
        </div>
      )}

      {!loading && !error && calls.length > 0 && (
        <div className="calls-list" role="list">
          {calls.map((call) => (
            <button
              key={`${call.direction}-${call.id}-${call.timestamp}`}
              className="list-item call-item"
              onClick={() => handleCallClick(call)}
              aria-label={`Start chat with +${call.phone}`}
            >
              <ChatAvatar phoneNumber={call.phone} size={56} />
              <div className="call-info">
                <span className="call-number">+{call.phone}</span>
                <span className={`call-status call-status--${call.status}`}>
                  {call.direction === 'incoming' ? '↙ ' : '↗ '}
                  {callStatusLabel(call.status)}
                </span>
              </div>
              <span className="call-time">{formatCallTime(call.timestamp)}</span>
            </button>
          ))}
        </div>
      )}
    </SidePanel>
  );
}

export default CallsPage;
