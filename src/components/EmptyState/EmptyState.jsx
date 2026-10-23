import './EmptyState.scss';

/**
 * MAX-style empty state icon: 72×72 gradient circle with a 32×32 icon centered.
 * The outer ring has a gradient fill (white 50% → 0% opacity) plus a gradient border.
 * Used by Calls, Contacts, and Chats empty states inside their respective side panels.
 */
export function EmptyStateIcon({ children }) {
  return (
    <span className="empty-icon-wrapper">
      {/* Outer 72×72 gradient circle */}
      <svg
        className="empty-icon-ring"
        width="72"
        height="72"
        viewBox="0 0 72 72"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="ringFill"
            x1="0"
            x2="72"
            y1="0"
            y2="72"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="ringBorder"
            x1="0"
            x2="72"
            y1="0"
            y2="72"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fff" stopOpacity="0.56" />
            <stop offset="0.49" stopColor="#fff" stopOpacity="0.04" />
            <stop offset="0.87" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="ringMask" fill="#fff">
            <circle cx="36" cy="36" r="36" />
          </mask>
        </defs>
        <circle cx="36" cy="36" r="36" fill="url(#ringFill)" />
        {/* Border (1px inset via mask) */}
        <circle
          cx="36"
          cy="36"
          r="35"
          stroke="url(#ringBorder)"
          strokeWidth="2"
          mask="url(#ringMask)"
          fill="none"
        />
      </svg>
      {/* Centered 32×32 icon */}
      <span className="empty-icon-inner">{children}</span>
    </span>
  );
}
