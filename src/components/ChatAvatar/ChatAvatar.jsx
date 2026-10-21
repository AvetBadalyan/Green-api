import './ChatAvatar.scss';

// Deterministic colored-initial avatar.
// We intentionally do NOT fetch real photos per row: with 100+ chats/contacts
// that would fire 100+ getAvatar requests at once and hit GREEN-API rate limits.
// Colored initials are instant, reliable, and match how most chat UIs render
// contacts without a saved photo.

function getInitials(name, phoneNumber) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    if (name.length >= 2) return name.slice(0, 2).toUpperCase();
    return name[0].toUpperCase();
  }
  return phoneNumber.slice(-2);
}

function ChatAvatar({ phoneNumber, name = '', size = 44 }) {
  const initials = getInitials(name, phoneNumber);

  return (
    <div
      className={`chat-avatar chat-avatar--${size <= 36 ? 'sm' : 'md'}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="chat-avatar__initials">{initials}</span>
    </div>
  );
}

export default ChatAvatar;
