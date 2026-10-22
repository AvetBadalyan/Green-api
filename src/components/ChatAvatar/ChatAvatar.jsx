import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requestAvatar } from '../../services/avatarCache';
import './ChatAvatar.scss';

function getInitials(name, phoneNumber) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    if (name.length >= 2) return name.slice(0, 2).toUpperCase();
    return name[0].toUpperCase();
  }
  return phoneNumber.slice(-2);
}

/**
 * Avatar component that fetches the real photo from GREEN-API and falls back
 * to a coloured-initial circle if no photo is set or the request fails.
 *
 * Props:
 *   phoneNumber — digits only, e.g. "79001234567"
 *   name        — display name used for initials fallback
 *   size        — pixel size (default 56 to match web.max.ru)
 *   isGroup     — true for group chats (builds @g.us chatId)
 */
function ChatAvatar({ phoneNumber, name = '', size = 56, isGroup = false }) {
  const { credentials } = useAuth();
  const chatId = `${phoneNumber}@${isGroup ? 'g' : 'c'}.us`;

  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (!credentials || !phoneNumber) return;
    let cancelled = false;
    requestAvatar(credentials, chatId).then((url) => {
      if (!cancelled) setAvatarUrl(url);
    });
    return () => { cancelled = true; };
  }, [chatId, phoneNumber, credentials]);

  // md ≤ 48px (chat header, 40px), lg > 48px (lists, 56px)
  const sizeClass = size <= 48 ? 'md' : 'lg';

  return (
    <div
      className={`chat-avatar chat-avatar--${sizeClass}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="chat-avatar__img"
          loading="lazy"
          decoding="async"
          onError={() => setAvatarUrl(null)}
        />
      ) : (
        <span className="chat-avatar__initials">{getInitials(name, phoneNumber)}</span>
      )}
    </div>
  );
}

export default ChatAvatar;
