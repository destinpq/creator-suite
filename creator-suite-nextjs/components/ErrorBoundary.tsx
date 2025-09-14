'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '32px',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            color: '#ff6b6b'
          }}>
            ⚠️
          </div>
          <h2 style={{
            color: '#fff',
            marginBottom: '12px',
            fontSize: '24px',
            fontWeight: '600'
          }}>
            Something went wrong
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            marginBottom: '24px',
            maxWidth: '400px',
            lineHeight: '1.6'
          }}>
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Refresh Page
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Try Again
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '24px',
              textAlign: 'left',
              maxWidth: '600px',
              width: '100%'
            }}>
              <summary style={{
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                marginBottom: '8px'
              }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#ff6b6b',
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
