// Filled folder — used in the New / Unread navigation item
function IconFolderFilled({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true" {...props}>
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  );
}
export default IconFolderFilled;
