'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  index: number;
}

interface State {
  caught: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { caught: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      caught: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  render() {
    if (this.state.caught) {
      return (
        <div className="bg-surface border border-border rounded-[12px] overflow-hidden flex flex-col">
          <div className="h-[220px] relative overflow-hidden bg-app border-b border-border-subtle">
            <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 p-4 bg-red-dim text-red text-[11px] text-center">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3M8 10.5v.5" strokeLinecap="round" />
              </svg>
              <span className="break-words">{this.state.message}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-[10px] bg-surface min-h-[48px]">
            <span className="text-[10px] font-bold text-fg-subtle shrink-0 font-mono">
              #{this.props.index + 1}
            </span>
            <span className="flex-1 text-[11.5px] leading-[1.4] text-red opacity-70">
              渲染异常
            </span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
