import { Component } from 'react';
import './ErrorBoundary.scss';

/**
 * Error boundary that catches JavaScript errors in child components.
 * Shows a fallback UI instead of crashing the entire app.
 * Essential for lazy-loaded routes that may fail to load.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console in development; could send to error reporting service
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>The application encountered an unexpected error.</p>
            <button onClick={this.handleRetry} className="error-boundary__retry">
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
