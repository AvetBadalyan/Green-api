import './LoadingScreen.scss';

/**
 * Full-screen loading indicator shown during lazy component loading.
 * Matches the app background so the transition feels seamless.
 */
function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-label="Loading">
      <div className="loading-screen__spinner" />
    </div>
  );
}

export default LoadingScreen;
