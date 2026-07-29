import { Component, type ErrorInfo, type ReactNode } from 'react';

import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled UI error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-boundary">
          <h1>Something went wrong.</h1>
          <p>Please refresh the page and try again.</p>
        </main>
      );
    }

    return this.props.children;
  }
}
