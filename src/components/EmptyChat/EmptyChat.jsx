import './EmptyChat.scss';

function EmptyChat() {
  return (
    <div className="empty-chat">
      <div className="empty-chat-content">
        <div className="empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h2>Select a chat</h2>
        <p>Choose a conversation or start a new one</p>
      </div>
    </div>
  );
}

export default EmptyChat;
