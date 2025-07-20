import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // Optionally log errorInfo
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: '2rem', color: 'var(--danger-color)' }}>
          <h2>Något gick fel.</h2>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
