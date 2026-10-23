import { IconPhone } from '../../icons';
import './CallsPage.scss';

// The right-panel empty state shown when Calls view is active.
// Mirrors MAX's "Who would you like to call?" screen.
function CallsEmpty() {
  return (
    <div className="calls-empty">
      <div className="calls-empty-content">
        <div className="calls-icon">
          <IconPhone size={36} />
        </div>
        <h2>Who would you like to call?</h2>
        <p>Your call history will be here</p>
      </div>
    </div>
  );
}

export default CallsEmpty;
