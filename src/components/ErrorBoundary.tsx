import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Formal Error Boundary for graceful crash handling and recovery in React.
 * Captures render errors without using console.log and presents an actionable recovery UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // Error caught gracefully by boundary; avoiding unhandled console logging in production
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-900 border border-rose-500/30 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Application Exception Caught</h2>
                <p className="text-xs text-rose-300">An unexpected runtime error occurred</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
              {this.state.error?.message ?? 'Unknown component rendering error'}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recover &amp; Retry</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
