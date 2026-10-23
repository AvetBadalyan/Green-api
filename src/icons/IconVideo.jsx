function IconVideo({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      aria-hidden="true" {...props}>
      <rect x="2" y="6" width="13" height="12" rx="2" />
      <path d="M22 8l-5 4 5 4V8z" />
    </svg>
  );
}
export default IconVideo;
