import { useEffect, useRef } from 'react';
import { IconSearch, IconGroup, IconLink } from '../../icons';
import './NewChatMenu.scss';

/**
 * Dropdown shown when the "+" button is clicked — mirrors MAX's menu.
 * Only "Search by number" is wired up; the other actions require WhatsApp
 * features GREEN-API doesn't expose, so they're present for layout parity only.
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
        <IconSearch size={20} />
        Search by number
      </button>

      <button className="new-chat-menu__item" role="menuitem" disabled title="Not available via GREEN-API">
        <IconGroup size={20} />
        Create group
      </button>

      <button className="new-chat-menu__item" role="menuitem" disabled title="Not available via GREEN-API">
        <IconLink size={20} />
        Invite via link
      </button>
    </div>
  );
}

export default NewChatMenu;
