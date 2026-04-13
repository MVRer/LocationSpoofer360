import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-200 gap-4 p-8">
          <h1 className="text-xl font-semibold text-red-400">Something went wrong</h1>
          <p className="text-sm text-slate-400 max-w-md text-center">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            type="button"
            className="px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
