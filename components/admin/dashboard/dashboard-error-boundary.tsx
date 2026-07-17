"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  label?: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Wraps a single dashboard card. If the card throws during render, it shows
 * a contained error state instead of crashing the entire dashboard.
 */
export default class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle size={16} strokeWidth={1.8} className="text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-[0.78rem] font-semibold text-[#1a1a1a]">
              {this.props.label ?? "Section"} unavailable
            </p>
            <p className="mt-0.5 text-[0.72rem] text-[#9ca3af]">
              An error occurred in this panel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.72rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
          >
            <RefreshCw size={11} strokeWidth={2} />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
