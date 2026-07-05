// @ts-nocheck
import React, { ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', backgroundColor: '#fef2f2', border: '2px solid #ef4444', borderRadius: '12px', margin: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <h2 style={{ color: '#991b1b', fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>⚠️ Terjadi Kesalahan Sistem (Runtime Error)</h2>
          <p style={{ color: '#7f1d1d', fontSize: '14px', marginBottom: '16px' }}>
            Aplikasi mengalami kesalahan saat dijalankan. Berikut adalah detail kesalahan untuk membantu perbaikan:
          </p>
          <div style={{ backgroundColor: '#1e293b', color: '#f8fafc', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '13px' }}>
            <p style={{ fontWeight: 'bold', color: '#f43f5e', marginBottom: '8px' }}>{this.state.error?.toString()}</p>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', opacity: 0.9 }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }} 
            style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '650', fontSize: '13px' }}
          >
            Reset Penyimpanan Lokal (Clear Cache) & Muat Ulang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

