import ConnectionStatus from '../ConnectionStatus/ConnectionStatus';
import { IconSearch } from '../../icons';
import './SidePanel.scss';

// Shared layout shell for Chats, Contacts and Calls panels.
function SidePanel({ title, actions, search, children }) {
  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <div className="side-panel-title-row">
          <h1>{title}</h1>
          <ConnectionStatus />
        </div>
        {actions && <div className="side-panel-actions">{actions}</div>}
      </div>

      {search && (
        <div className="side-panel-search">
          <div className="side-panel-search-box">
            <IconSearch size={16} />
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
