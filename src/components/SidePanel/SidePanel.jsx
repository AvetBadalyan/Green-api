import './SidePanel.scss';

/**
 * Shared shell for all side panel views (Chats, Contacts, Calls).
 * Every panel has the same width, background, header style, and optional search bar.
 * Each view only provides what differs: title, actions, search, and body content.
 */
function SidePanel({ title, actions, search, children }) {
  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <h1>{title}</h1>
        {actions && <div className="side-panel-actions">{actions}</div>}
      </div>

      {search && (
        <div className="side-panel-search">
          <div className="side-panel-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {search}
          </div>
        </div>
      )}

      <div className="side-panel-body">
        {children}
      </div>
    </div>
  );
}

export default SidePanel;
