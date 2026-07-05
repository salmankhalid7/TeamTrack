import { Component } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

// Class component required for error boundaries
// Why: React error boundaries must use componentDidCatch lifecycle
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

 componentDidCatch(error, errorInfo) {
    // Log error to your error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Here you could send to Sentry, LogRocket, etc.
    // logErrorToService(error, errorInfo);
  } 

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    // Call onReset prop if provided
    this.props.onReset?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI per component type
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <Card className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-[#2b2d42] mb-2">
              Something went wrong
            </h2>
            
            <p className="text-[#2b2d42] text-opacity-70 mb-2">
              We encountered an unexpected error. Please try again.
            </p>

            {/* Show error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-[#2b2d42] text-opacity-50 cursor-pointer hover:text-opacity-70">
                  Error Details
                </summary>
                <pre className="mt-2 p-3 bg-red-50 rounded-lg text-xs text-red-700 overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset}>
                Try Again
              </Button>
              <Button variant="secondary" onClick={this.handleReload}>
                Reload Page
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary(WrappedComponent, errorBoundaryProps = {}) {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// Specialized error boundary for data fetching
export function QueryErrorBoundary({ error, retry, children }) {
  if (error) {
    return (
      <Card className="text-center py-8">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <p className="text-[#2b2d42] font-medium mb-1">Failed to load data</p>
        <p className="text-sm text-[#2b2d42] text-opacity-50 mb-4">{error.message}</p>
        {retry && (
          <Button size="sm" onClick={retry}>
            Retry
          </Button>
        )}
      </Card>
    );
  }

  return children;
}