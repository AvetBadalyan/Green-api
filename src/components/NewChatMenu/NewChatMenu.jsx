import { useEffect, useRef } from 'react';
import { IconSearch, IconGroup, IconLink } from '../../icons';
import './NewChatMenu.scss';

/**
 * Dropdown shown when the "+" button is clicked — mirrors MAX's menu.
 * Only "Search by number" is wired up; the other actions require WhatsApp
 * features GREEN-API doesn't expose, so they're present for layout parity only.
 */
function NewChatMenu({ onSearchByNumber, onClose, triggerRef }) {
  const menuRef = useRef(null);

  // WAI-ARIA menu button pattern: move focus into the menu on mount
  useEffect(() => {
    const items = menuRef.current?.querySelectorAll('[role="menuitem"]:not(:disabled)');
    if (items?.length > 0) items[0].focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        // Return focus to the trigger button
        triggerRef?.current?.focus();
        return;
      }

      // WAI-ARIA 1.2 Menu keyboard pattern: Arrow keys navigate between items.
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = Array.from(
          menuRef.current?.querySelectorAll('[role="menuitem"]:not(:disabled)') ?? []
        );
        if (items.length === 0) return;
        const currentIndex = items.indexOf(document.activeElement);
        const next = e.key === 'ArrowDown'
          ? (currentIndex + 1) % items.length
          : (currentIndex - 1 + items.length) % items.length;
        items[next].focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, triggerRef]);

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
