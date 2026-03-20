import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches React errors and displays a fallback UI
 *
 * @example
 * ```tsx
 * <ErrorBoundary level="page">
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // TODO: Send to error reporting service (e.g., Sentry)
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isPageLevel = this.props.level === 'page';

      // Page-level error UI (more prominent)
      if (isPageLevel) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <Card className="w-full max-w-2xl shadow-lg">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-destructive/10 rounded-full">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Something went wrong</CardTitle>
                    <CardDescription className="mt-1">
                      Something broke, but your tours and data are fine.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {import.meta.env.DEV && this.state.error && (
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <p className="text-sm font-mono text-destructive mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
                          Component Stack
                        </summary>
                        <pre className="mt-2 text-xs overflow-auto p-2 bg-background rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button onClick={this.handleReload} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reload Page
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>If this problem persists, please try:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Clearing your browser cache</li>
                    <li>Using a different browser</li>
                    <li>Contacting support with the error details above</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Component-level error UI (more compact)
      return (
        <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Component Error</h3>
              <p className="text-sm text-muted-foreground mb-3">
                This component encountered an error and couldn't be displayed.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <p className="text-xs font-mono text-destructive mb-3 break-all">
                  {this.state.error.toString()}
                </p>
              )}
              <Button onClick={this.handleReset} size="sm" variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based wrapper for error boundary
 * Use this when you need to add error handling to a specific component tree
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
