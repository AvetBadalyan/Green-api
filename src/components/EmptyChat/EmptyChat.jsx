import './EmptyChat.scss';

function EmptyChat() {
  return (
    <div className="empty-chat">
      <div className="empty-chat-content">
        <div className="logo-icon">G</div>
        <h2>GREEN-API MAX Chat</h2>
        <p>Select a chat or create a new one to start messaging</p>
      </div>
    </div>
  );
}

export default EmptyChat;
