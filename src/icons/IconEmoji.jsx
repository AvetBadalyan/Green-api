function IconEmoji({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      {/* eyes use a heavier stroke than the outer circle */}
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" />
    </svg>
  );
}
export default IconEmoji;
