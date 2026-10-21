import { useReducer, useEffect, useCallback, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { getContacts } from '../../services/api';
import SidePanel from '../SidePanel/SidePanel';
import './ContactsPanel.scss';

function getInitials(contact) {
  if (contact.name) {
    const parts = contact.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return contact.name.slice(0, 2).toUpperCase();
  }
  return contact.id.replace('@c.us', '').slice(-2);
}

function formatPhone(id) {
  return `+${id.replace('@c.us', '')}`;
}

const INITIAL_STATE = { contacts: [], loading: true, error: '' };

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':  return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS': return { loading: false, error: '', contacts: action.contacts };
    case 'FETCH_ERROR':  return { ...state, loading: false, error: action.error };
    default: return state;
  }
}

function ContactsPanel({ setCurrentView }) {
  const { credentials } = useAuth();
  const { createChat } = useChat();

  const [{ contacts, loading, error }, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [searchValue, setSearchValue] = useState('');

  const fetchContacts = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });

    // Retry up to 3 times with backoff — handles transient rate limits
    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const data = await getContacts(credentials);
        const users = (data ?? [])
          .filter((c) => c.type === 'user' && c.id !== '0@c.us')
          .sort((a, b) => {
            // Named contacts first, then by name/number alphabetically
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            if (nameA && !nameB) return -1;
            if (!nameA && nameB) return 1;
            const keyA = nameA || formatPhone(a.id);
            const keyB = nameB || formatPhone(b.id);
            return keyA.localeCompare(keyB);
          });
        dispatch({ type: 'FETCH_SUCCESS', contacts: users });
        return;
      } catch {
        if (attempt < MAX_ATTEMPTS) {
          // Wait longer each attempt (0.5s, 1s) before retrying
          await new Promise((r) => setTimeout(r, attempt * 500));
        }
      }
    }

    dispatch({ type: 'FETCH_ERROR', error: 'Could not load contacts. Check your connection and try again.' });
  }, [credentials]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleContactClick = (contact) => {
    createChat(contact.id.replace('@c.us', ''));
    setCurrentView('all');
  };

  const filtered = contacts.filter((c) => {
    if (!searchValue.trim()) return true;
    const q = searchValue.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || c.id.includes(q);
  });

  return (
    <SidePanel
      title="Contacts"
      actions={
        <button
          className="refresh-btn"
          onClick={fetchContacts}
          title="Refresh contacts"
          aria-label="Refresh contacts"
          disabled={loading}
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            aria-hidden="true"
            className={loading ? 'spinning' : ''}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      }
      search={
        <input
          type="search"
          placeholder="Search contacts"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          aria-label="Search contacts"
        />
      }
    >
      <div role="list" aria-live="polite" aria-busy={loading}>
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
            title={`Start chat with ${contact.name || formatPhone(contact.id)}`}
            role="listitem"
          >
            <div className="contact-avatar" aria-hidden="true">{getInitials(contact)}</div>
            <div className="contact-info">
              <span className="contact-name">{contact.name || formatPhone(contact.id)}</span>
              {contact.name && <span className="contact-phone">{formatPhone(contact.id)}</span>}
            </div>
          </button>
        ))}
      </div>
    </SidePanel>
  );
}

export default ContactsPanel;
