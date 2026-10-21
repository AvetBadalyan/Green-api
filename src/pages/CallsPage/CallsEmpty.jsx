import './CallsPage.scss';

// The right-panel empty state shown when Calls view is active.
// Mirrors MAX's "Who would you like to call?" screen.
function CallsEmpty() {
  return (
    <div className="calls-empty">
      <div className="calls-empty-content">
        <div className="calls-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.45 2 2 0 0 1 3.57 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
          </svg>
        </div>
        <h2>Who would you like to call?</h2>
        <p>Your call history will be here</p>
      </div>
    </div>
  );
}

export default CallsEmpty;
