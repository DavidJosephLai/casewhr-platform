import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌❌❌ [ErrorBoundary] Uncaught error:', error);
    console.error('❌❌❌ [ErrorBoundary] Error message:', error.message);
    console.error('❌❌❌ [ErrorBoundary] Error stack:', error.stack);
    console.error('❌❌❌ [ErrorBoundary] Component stack:', errorInfo.componentStack);
    console.error('❌❌❌ [ErrorBoundary] Error toString:', error.toString());
    
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>
            
            <p className="text-center text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>

            {/* 🔥 強制顯示開發模式錯誤訊息 */}
            {this.state.error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-bold text-red-900 mb-2">🔥 Error Details:</p>
                <p className="text-xs text-red-800 font-mono whitespace-pre-wrap break-all mb-2">
                  {this.state.error.toString()}
                </p>
                <p className="text-xs text-red-700 font-mono whitespace-pre-wrap break-all">
                  {this.state.error.stack}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2" open>
                    <summary className="text-xs text-red-600 cursor-pointer hover:text-red-900 font-bold">
                      📍 Component Stack
                    </summary>
                    <pre className="text-xs text-red-700 mt-2 whitespace-pre-wrap break-all">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={this.handleReset}
                className="flex-1"
              >
                Refresh Page
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}