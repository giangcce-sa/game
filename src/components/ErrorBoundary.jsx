import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Game error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '300px', gap: '16px', padding: '32px', textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem' }}>😅</div>
        <h3 style={{ fontWeight: 900, color: 'var(--c-coral)', margin: 0 }}>Có lỗi xảy ra rồi!</h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: 0 }}>
          Game gặp sự cố. Thử lại nhé bé ơi!
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn-big" onClick={this.handleReset} style={{ width: 'auto', padding: '10px 24px' }}>
            🔄 Thử Lại
          </button>
          <button className="btn-ghost" onClick={this.props.onGoHome} style={{ width: 'auto', padding: '10px 24px' }}>
            🏠 Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }
}
