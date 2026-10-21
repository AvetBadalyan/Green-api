import { useReducer, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { getContacts } from '../../services/api';
import './ContactsPanel.scss';

// ── helpers ──────────────────────────────────────────────────────────────────

function getInitials(contact) {
  if (contact.name) {
    const parts = contact.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return contact.name.slice(0, 2).toUpperCase();
  }
  const phone = contact.id.replace('@c.us', '');
  return phone.slice(-2);
}

function formatPhone(id) {
  return `+${id.replace('@c.us', '')}`;
}

// ── reducer ───────────────────────────────────────────────────────────────────

const INITIAL_STATE = { contacts: [], loading: true, error: '' };

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return { loading: false, error: '', contacts: action.contacts };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}

// ── component ─────────────────────────────────────────────────────────────────

function ContactsPanel({ setCurrentView }) {
  const { credentials } = useAuth();
  const { createChat } = useChat();

  const [{ contacts, loading, error }, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [searchValue, dispatchSearch] = useReducer(
    (_prev, next) => next,
    ''
  );

  const fetchContacts = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await getContacts(credentials);
      const users = (data ?? [])
        .filter((c) => c.type === 'user')
        .sort((a, b) => {
          const nameA = (a.name || formatPhone(a.id)).toLowerCase();
          const nameB = (b.name || formatPhone(b.id)).toLowerCase();
          return nameA.localeCompare(nameB);
        });
      dispatch({ type: 'FETCH_SUCCESS', contacts: users });
    } catch {
      dispatch({ type: 'FETCH_ERROR', error: 'Could not load contacts. Check your connection and try again.' });
    }
  }, [credentials]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleContactClick = (contact) => {
    const phone = contact.id.replace('@c.us', '');
    createChat(phone);
    setCurrentView('chats');
  };

  const filtered = contacts.filter((c) => {
    if (!searchValue.trim()) return true;
    const q = searchValue.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      c.id.includes(q)
    );
  });

  return (
    <div className="contacts-panel">
      <div className="contacts-panel-header">
        <h1>Contacts</h1>
        <button
          className="refresh-btn"
          onClick={fetchContacts}
          title="Refresh contacts"
          aria-label="Refresh contacts"
          disabled={loading}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            className={loading ? 'spinning' : ''}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      <div className="contacts-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          placeholder="Search contacts"
          value={searchValue}
          onChange={(e) => dispatchSearch(e.target.value)}
          aria-label="Search contacts"
        />
      </div>

      <div className="contacts-list" role="list" aria-live="polite" aria-busy={loading}>
        {loading && (
          <div className="contacts-status">
            <div className="spinner" aria-hidden="true" />
            <p>Loading contacts…</p>
          </div>
        )}

        {!loading && error && (
          <div className="contacts-status contacts-error" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{error}</p>
            <button onClick={fetchContacts} className="retry-btn">Retry</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="contacts-status">
            <p>{searchValue ? 'No contacts match your search.' : 'No contacts found.'}</p>
          </div>
        )}

        {!loading && !error && filtered.map((contact) => (
          <button
            key={contact.id}
            className="contact-item"
            onClick={() => handleContactClick(contact)}
            role="listitem"
            title={`Start chat with ${contact.name || formatPhone(contact.id)}`}
          >
            <div className="contact-avatar" aria-hidden="true">
              {getInitials(contact)}
            </div>
            <div className="contact-info">
              <span className="contact-name">
                {contact.name || formatPhone(contact.id)}
              </span>
              {contact.name && (
                <span className="contact-phone">{formatPhone(contact.id)}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ContactsPanel;
