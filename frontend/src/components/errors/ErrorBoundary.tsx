import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  variant?: 'page' | 'section' | 'component';
  title?: string;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Error logging service
const logError = (error: Error, errorInfo: ErrorInfo, context?: string) => {
  // Log to console in development
  console.group('🚨 Error Boundary Caught Error');
  console.error('Error:', error);
  console.error('Component Stack:', errorInfo.componentStack);
  if (context) console.info('Context:', context);
  console.info('Timestamp:', new Date().toISOString());
  console.info('URL:', window.location.href);
  console.groupEnd();

  // In production, you would send this to an error tracking service like:
  // - Sentry: Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  // - LogRocket: LogRocket.captureException(error);
  // - Custom API endpoint:
  // fetch('/api/errors', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     message: error.message,
  //     stack: error.stack,
  //     componentStack: errorInfo.componentStack,
  //     url: window.location.href,
  //     timestamp: new Date().toISOString(),
  //     userAgent: navigator.userAgent,
  //   }),
  // }).catch(console.error);
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    logError(error, errorInfo, this.props.title);

    // Store error info for display
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    this.props.onReset?.();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, variant = 'page', title, showDetails = import.meta.env.DEV } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Use default ErrorFallback component
      return (
        <ErrorFallback
          error={error}
          resetError={this.resetError}
          variant={variant}
          title={title}
          showDetails={showDetails}
        />
      );
    }

    return children;
  }
}

// Specialized error boundaries for common use cases

interface PageErrorBoundaryProps {
  children: ReactNode;
  title?: string;
}

export function PageErrorBoundary({ children, title }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary variant="page" title={title} showDetails={import.meta.env.DEV}>
      {children}
    </ErrorBoundary>
  );
}

interface SectionErrorBoundaryProps {
  children: ReactNode;
  title?: string;
}

export function SectionErrorBoundary({ children, title }: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary variant="section" title={title}>
      {children}
    </ErrorBoundary>
  );
}

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  title?: string;
}

export function ComponentErrorBoundary({ children, title }: ComponentErrorBoundaryProps) {
  return (
    <ErrorBoundary variant="component" title={title}>
      {children}
    </ErrorBoundary>
  );
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}


