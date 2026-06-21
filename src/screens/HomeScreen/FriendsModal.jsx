import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useFriendLeaderboard } from '../../hooks/useFriendLeaderboard';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function FriendsModal({ onClose }) {
  const { currentProfile, addFriend, removeFriend, showToast } = useGame();
  const { entries, loading, refresh } = useFriendLeaderboard(currentProfile);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  if (!currentProfile) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    const r = addFriend(input);
    if (r.ok) {
      showToast('✅ Đã thêm bạn!', 'good');
      setInput('');
      refresh();
    } else {
      const messages = {
        invalid_code: 'Mã không hợp lệ (6 ký tự).',
        self: 'Đây là mã của bé.',
        duplicate: 'Bạn này đã có rồi.',
        limit: 'Tối đa 20 bạn.',
      };
      showToast(messages[r.error] || 'Không thêm được.', 'bad');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentProfile.friendCode || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast('Không sao chép được', 'bad');
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 180,
      background: 'rgba(10,8,30,0.7)', backdropFilter: 'blur(6px)',
      display: 'grid', placeItems: 'center', padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        maxWidth: 440, width: '100%',
        background: 'linear-gradient(160deg,#fff 0%,#fef3ff 100%)',
        borderRadius: 24, padding: '20px 18px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#4c1d95', margin: 0 }}>
            👯 Bạn Bè & Bảng Xếp Hạng
          </h2>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: 'rgba(0,0,0,0.06)', cursor: 'pointer', fontSize: '1rem', fontWeight: 900,
          }}>✕</button>
        </div>

        {/* My friend code */}
        <div style={{
          background: 'linear-gradient(135deg,#9d6bff,#7c3aed)', color: '#fff',
          borderRadius: 16, padding: '12px 14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.9 }}>Mã của bé (share cho bạn):</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.2em', fontFamily: 'monospace' }}>
              {currentProfile.friendCode || '------'}
            </span>
            <button onClick={handleCopy} style={{
              marginLeft: 'auto',
              background: copied ? '#22c55e' : 'rgba(255,255,255,0.2)',
              color: '#fff', border: 'none', borderRadius: 10, padding: '6px 12px',
              fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
            }}>
              {copied ? '✅ Đã copy' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Add friend */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Nhập mã 6 ký tự..."
            maxLength={6}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 12,
              border: '2px solid #e5d4ff', fontSize: '0.95rem', fontWeight: 800,
              letterSpacing: '0.15em', fontFamily: 'monospace', outline: 'none',
              textTransform: 'uppercase',
            }}
          />
          <button type="submit" disabled={input.length !== 6} style={{
            padding: '0 16px', borderRadius: 12, border: 'none',
            background: input.length === 6 ? '#9d6bff' : '#d4d4d8',
            color: '#fff', fontWeight: 900, fontSize: '0.9rem', cursor: input.length === 6 ? 'pointer' : 'not-allowed',
          }}>
            + Thêm
          </button>
        </form>

        {/* Leaderboard */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#4c1d95', margin: 0 }}>
              🏆 Bảng xếp hạng tuần
            </h3>
            <button onClick={refresh} disabled={loading} style={{
              background: 'rgba(157,107,255,0.1)', border: 'none', borderRadius: 8,
              padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, color: '#9d6bff',
              cursor: loading ? 'wait' : 'pointer',
            }}>
              {loading ? '⏳' : '🔄 Refresh'}
            </button>
          </div>

          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontWeight: 700, fontSize: '0.85rem' }}>
              Chưa có dữ liệu...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {entries.map((e, i) => (
                <div key={e.friendCode || i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 12,
                  background: e.isSelf ? 'rgba(157,107,255,0.12)' : 'rgba(0,0,0,0.03)',
                  border: e.isSelf ? '2px solid #9d6bff' : '2px solid transparent',
                }}>
                  <span style={{ fontSize: '1.2rem', width: 28, textAlign: 'center', fontWeight: 900, color: '#4c1d95' }}>
                    {i < 3 ? MEDALS[i] : `${i + 1}`}
                  </span>
                  <span style={{ fontSize: '1.4rem' }}>{e.avatar}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.name} {e.isSelf && <span style={{ color: '#9d6bff', fontSize: '0.7rem' }}>(bé)</span>}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#6b6391', fontWeight: 700 }}>
                      🔥 {e.streak} ngày
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#f59e0b' }}>
                      ⭐ {e.weeklyStars}
                    </div>
                    {!e.isSelf && (
                      <button
                        onClick={() => { removeFriend(e.friendCode); refresh(); }}
                        style={{ background: 'none', border: 'none', fontSize: '0.65rem', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textAlign: 'center', marginTop: 10 }}>
          💡 Cùng thi đua nhặt sao mỗi tuần với bạn bè!
        </p>
      </div>
    </div>
  );
}
