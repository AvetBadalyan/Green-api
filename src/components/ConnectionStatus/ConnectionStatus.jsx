import useConnectionStatus from '../../hooks/useConnectionStatus';
import './ConnectionStatus.scss';

/**
 * Small colored dot indicating the GREEN-API instance connection state.
 * Green = authorized (connected)
 * Yellow = sleepMode or loading
 * Red = notAuthorized or error
 */
function ConnectionStatus() {
  const status = useConnectionStatus();

  let color = 'yellow';
  let label = 'Connecting...';

  if (status === 'authorized') {
    color = 'green';
    label = 'Connected';
  } else if (status === 'notAuthorized' || status === 'error') {
    color = 'red';
    label = 'Disconnected';
  } else if (status === 'sleepMode') {
    color = 'yellow';
    label = 'Sleep mode';
  }

  return (
    <span
      className={`connection-status connection-status--${color}`}
      title={label}
      aria-label={label}
    />
  );
}

export default ConnectionStatus;
