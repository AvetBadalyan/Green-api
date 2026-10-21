import patternUrl from '../../assets/main-bg.svg';
import './ChatBackground.scss';

/**
 * Fixed decorative background for the main chat area.
 *
 * Mirrors MAX's (web.max.ru) 3-layer background system exactly, as resolved in
 * the "space" dark theme:
 *   1. layer-base       — flat dark base (linear gradient, both stops #141414)
 *   2. layer-additional — radial gradients (transparent in the space theme)
 *   3. layer-pattern    — flat purple-blue tint masked by a repeating SVG
 *
 * Purely decorative: pointer-events none, aria-hidden.
 */
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
