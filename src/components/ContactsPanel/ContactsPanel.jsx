import { useReducer, useEffect, useCallback, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { getContacts } from '../../services/api';
import { RETRY_BASE_DELAY_MS } from '../../constants';
import SidePanel from '../SidePanel/SidePanel';
import ChatAvatar from '../ChatAvatar/ChatAvatar';
import { EmptyStateIcon } from '../EmptyState/EmptyState';
import { IconRefresh, IconAlertCircle, IconContactsFilled } from '../../icons';
import './ContactsPanel.scss';

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
          // Wait longer each attempt (500ms, 1000ms) before retrying
          await new Promise((r) => setTimeout(r, attempt * RETRY_BASE_DELAY_MS));
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
          <IconRefresh size={16} className={loading ? 'spinning' : ''} />
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
      <div className="contacts-list" role="list" aria-live="polite" aria-busy={loading}>
        {loading && (
          <div className="panel-status">
            <div className="spinner" aria-hidden="true" />
            <p>Loading contacts…</p>
          </div>
        )}

        {!loading && error && (
          <div className="panel-status panel-status--error" role="alert">
            <IconAlertCircle size={20} />
            <p>{error}</p>
            <button onClick={fetchContacts} className="retry-btn">Retry</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          searchValue ? (
            <div className="panel-status">
              <p>No contacts match your search.</p>
            </div>
          ) : (
            <div className="panel-empty">
              <EmptyStateIcon>
                <IconContactsFilled size={32} />
              </EmptyStateIcon>
              <div className="panel-empty__info">
                <p className="panel-empty__title">You have no contacts</p>
                <p className="panel-empty__subtitle">Add a contact and start chatting</p>
              </div>
            </div>
          )
        )}

        {!loading && !error && filtered.map((contact) => (
          <button
            key={contact.id}
            className="list-item contact-item"
            onClick={() => handleContactClick(contact)}
            aria-label={`Start chat with ${contact.name || formatPhone(contact.id)}`}
          >
            <ChatAvatar
              phoneNumber={contact.id.replace(/@[cg]\.us$/, '')}
              name={contact.name}
              size={56}
            />
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
