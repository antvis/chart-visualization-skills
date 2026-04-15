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
        <div className="grid-cell">
          <div className="grid-cell-chart">
            <div className="grid-cell-error">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3M8 10.5v.5" strokeLinecap="round" />
              </svg>
              <span>{this.state.message}</span>
            </div>
          </div>
          <div className="grid-cell-footer">
            <span className="grid-cell-num">#{this.props.index + 1}</span>
            <span className="grid-cell-desc" style={{ color: 'var(--red)', opacity: 0.7 }}>
              渲染异常
            </span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
