import patternUrl from '../../assets/main-bg.svg';
import './ChatBackground.scss';

// Decorative background — three stacked layers matching web.max.ru.
function ChatBackground() {
  return (
    <div className="chat-background" aria-hidden="true">
      <div className="chat-background__layer chat-background__layer-base" />
      <div className="chat-background__layer chat-background__layer-additional" />
      <div
        className="chat-background__layer chat-background__layer-pattern"
        style={{ '--pattern-url': `url(${patternUrl})` }}
      />
    </div>
  );
}

export default ChatBackground;
