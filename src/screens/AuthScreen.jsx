import React, { useState } from 'react';

export default function AuthScreen({ onAuth, onSkip }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    const result = await onAuth(mode, email, password);
    setLoading(false);
    if (result?.error) {
      setError(result.error.message || 'Có lỗi xảy ra, thử lại nhé!');
    } else if (mode === 'signup') {
      setSuccessMsg('Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: 'var(--bg)'
    }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🦉</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--c-purple)', marginBottom: '4px' }}>
        Anh Cú Học Tiếng Anh
      </h1>
      <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '28px', textAlign: 'center' }}>
        Đăng nhập để đồng bộ dữ liệu học tập trên mọi thiết bị
      </p>

      {/* Mode tabs */}
      <div style={{
        display: 'flex', background: 'rgba(108,92,231,0.08)',
        borderRadius: '14px', padding: '4px', marginBottom: '20px', width: '100%', maxWidth: '340px'
      }}>
        {['login', 'signup'].map(m => (
          <button key={m} onClick={() => { setMode(m); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
              background: mode === m ? '#fff' : 'transparent',
              fontWeight: 800, fontSize: '0.88rem',
              color: mode === m ? 'var(--c-purple)' : '#888',
              cursor: 'pointer',
              boxShadow: mode === m ? '0 2px 8px rgba(108,92,231,0.15)' : 'none',
            }}
          >
            {m === 'login' ? '🔑 Đăng nhập' : '✨ Đăng ký'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{
        width: '100%', maxWidth: '340px',
        display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        <input
          type="email" required
          className="input-fancy"
          placeholder="Email phụ huynh"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ height: '48px', fontSize: '0.95rem' }}
        />
        <input
          type="password" required
          className="input-fancy"
          placeholder="Mật khẩu (ít nhất 6 ký tự)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ height: '48px', fontSize: '0.95rem' }}
        />

        {error && (
          <div style={{
            background: 'rgba(255,107,107,0.08)', border: '2px solid #ff6b6b',
            borderRadius: '12px', padding: '10px 14px',
            fontSize: '0.82rem', fontWeight: 700, color: '#ff6b6b'
          }}>
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(38,222,129,0.08)', border: '2px solid var(--c-grass)',
            borderRadius: '12px', padding: '10px 14px',
            fontSize: '0.82rem', fontWeight: 700, color: 'var(--c-grass)'
          }}>
            ✅ {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-big"
          style={{ marginTop: '4px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '⏳ Đang xử lý...' : mode === 'login' ? '🔑 Đăng Nhập' : '✨ Đăng Ký'}
        </button>
      </form>

      <button
        onClick={onSkip}
        style={{
          marginTop: '20px', background: 'none', border: 'none',
          color: '#aaa', fontWeight: 700, fontSize: '0.85rem',
          cursor: 'pointer', textDecoration: 'underline'
        }}
      >
        Chơi offline (không lưu cloud)
      </button>
    </div>
  );
}
