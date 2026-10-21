import { useEffect, useRef } from 'react';
import './NewChatMenu.scss';

/**
 * Dropdown shown when the "+" button is clicked — mirrors MAX's menu.
 * Only "Search by number" is wired up (it opens the phone modal); the other
 * actions require WhatsApp features GREEN-API doesn't expose, so they're
 * present for layout parity but disabled.
 */
function NewChatMenu({ onSearchByNumber, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="new-chat-menu" ref={menuRef} role="menu">
      <button
        className="new-chat-menu__item"
        role="menuitem"
        onClick={() => { onSearchByNumber(); onClose(); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        Search by number
      </button>

      <button className="new-chat-menu__item" role="menuitem" disabled title="Not available via GREEN-API">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
        Create group
      </button>

      <button className="new-chat-menu__item" role="menuitem" disabled title="Not available via GREEN-API">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        Invite via link
      </button>
    </div>
  );
}

export default NewChatMenu;
