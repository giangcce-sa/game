import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import IpaDisplay from '../components/IpaDisplay';

const QUALITY_BUTTONS = [
  { q: 0, label: '❌ Quên', color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)' },
  { q: 3, label: '😅 Khó', color: '#fd9644', bg: 'rgba(253,150,68,0.1)' },
  { q: 4, label: '👍 Nhớ', color: '#26de81', bg: 'rgba(38,222,129,0.1)' },
  { q: 5, label: '⚡ Thuộc', color: '#4b7bec', bg: 'rgba(75,123,236,0.1)' },
];

export default function GameFlashcard({ onBack }) {
  const { getDueSrsWords, updateSrsCard, speak, beep, addStarsAndCoins, showToast, updateQuestProgress } = useGame();
  const [cards, setCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [stats, setStats] = useState({ forgotten: 0, hard: 0, good: 0, easy: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { due, newWords } = getDueSrsWords(10);
    const session = [...due, ...newWords];
    if (session.length === 0) {
      setSessionDone(true);
    } else {
      setCards(session);
    }
    setLoading(false);
  }, []);

  const currentCard = cards[currentIdx];

  const handleFlip = () => {
    if (!flipped) {
      speak(currentCard.w);
      setFlipped(true);
    }
  };

  const handleQuality = useCallback((q) => {
    if (!currentCard) return;
    updateSrsCard(currentCard.w, q);
    beep(q >= 4 ? 'sine' : 'square');

    setStats(prev => {
      const key = q === 0 ? 'forgotten' : q === 3 ? 'hard' : q === 4 ? 'good' : 'easy';
      return { ...prev, [key]: prev[key] + 1 };
    });

    const next = currentIdx + 1;
    if (next >= cards.length) {
      const correctCount = cards.length - stats.forgotten;
      addStarsAndCoins(Math.max(1, Math.floor(correctCount / 3)), correctCount * 2);
      updateQuestProgress('flashcard', 1);
      setSessionDone(true);
    } else {
      setCurrentIdx(next);
      setFlipped(false);
    }
  }, [currentCard, currentIdx, cards.length, stats.forgotten, updateSrsCard, beep, addStarsAndCoins, updateQuestProgress]);

  if (loading) return null;

  if (sessionDone && cards.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--c-purple)', marginBottom: '8px' }}>Hoàn thành rồi!</h2>
        <p style={{ color: '#888', marginBottom: '32px', textAlign: 'center' }}>Không có từ nào cần ôn hôm nay. Hẹn gặp lại ngày mai!</p>
        <button onClick={onBack} className="btn-primary" style={{ padding: '14px 32px', fontSize: '1rem', fontWeight: 800 }}>
          🏠 Về Trang Chủ
        </button>
      </div>
    );
  }

  if (sessionDone) {
    const total = cards.length;
    const goodRate = Math.round(((stats.good + stats.easy) / total) * 100);
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📚</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--c-purple)', marginBottom: '20px' }}>Kết quả ôn tập</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px', width: '100%', maxWidth: '340px' }}>
          {[
            { label: '❌ Quên', val: stats.forgotten, color: '#ff6b6b' },
            { label: '😅 Khó', val: stats.hard, color: '#fd9644' },
            { label: '👍 Nhớ', val: stats.good, color: '#26de81' },
            { label: '⚡ Thuộc', val: stats.easy, color: '#4b7bec' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: '16px', padding: '16px',
              textAlign: 'center', boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: goodRate >= 70 ? 'var(--c-grass)' : 'var(--c-orange)', marginBottom: '24px' }}>
          Tỉ lệ nhớ: {goodRate}%
        </div>
        <button onClick={onBack} className="btn-primary" style={{ padding: '14px 32px', fontSize: '1rem', fontWeight: 800 }}>
          🏠 Về Trang Chủ
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={onBack} style={{
          background: 'none', border: '2px solid var(--c-purple)', borderRadius: '12px',
          padding: '8px 14px', cursor: 'pointer', fontWeight: 800, color: 'var(--c-purple)'
        }}>← Về</button>
        <span style={{ fontWeight: 800, color: 'var(--ink)' }}>📚 Ôn Tập Hôm Nay</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 700, color: '#888' }}>
          {currentIdx + 1}/{cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{
          width: `${((currentIdx) / cards.length) * 100}%`, height: '100%',
          background: 'var(--c-purple)', borderRadius: '4px', transition: 'width 0.3s'
        }} />
      </div>

      {/* Card */}
      <div
        onClick={handleFlip}
        style={{
          flex: 1, background: '#fff', borderRadius: '28px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '32px 24px', cursor: flipped ? 'default' : 'pointer',
          minHeight: '280px', position: 'relative', marginBottom: '20px',
          border: '3px solid var(--c-purple)',
        }}
      >
        {!flipped ? (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '12px' }}>{currentCard?.e}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '8px' }}>
              {currentCard?.w}
            </div>
            <IpaDisplay word={currentCard?.w} style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '12px', fontStyle: 'italic' }}>
              Nhấn để xem nghĩa 👆
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '12px' }}>{currentCard?.e}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '4px' }}>
              {currentCard?.w}
            </div>
            <IpaDisplay word={currentCard?.w} style={{ marginBottom: '12px' }} />
            <div style={{
              fontSize: '1.3rem', fontWeight: 800, color: 'var(--c-purple)',
              background: 'rgba(108,92,231,0.07)', padding: '10px 24px',
              borderRadius: '14px', marginBottom: '8px'
            }}>
              {currentCard?.vi}
            </div>
            {currentCard?.pos && (
              <div style={{ fontSize: '0.78rem', color: '#888', fontStyle: 'italic' }}>({currentCard.pos})</div>
            )}
            <button
              onClick={e => { e.stopPropagation(); speak(currentCard?.w); }}
              style={{
                position: 'absolute', top: '14px', right: '14px',
                background: 'var(--c-purple)', border: 'none', borderRadius: '50%',
                width: '38px', height: '38px', cursor: 'pointer', fontSize: '1.1rem',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >🔊</button>
          </>
        )}
      </div>

      {/* Quality buttons — only shown after flip */}
      {flipped && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {QUALITY_BUTTONS.map(({ q, label, color, bg }) => (
            <button
              key={q}
              onClick={() => handleQuality(q)}
              style={{
                padding: '12px 4px', borderRadius: '14px', border: `2px solid ${color}`,
                background: bg, color, fontWeight: 800, fontSize: '0.82rem',
                cursor: 'pointer', transition: 'transform 0.1s'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
