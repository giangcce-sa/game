import React from 'react';
import { useGame } from '../../context/GameContext';

export default function WeeklyChallengeWidget() {
  const { weeklyChallenge } = useGame();

  if (!weeklyChallenge) return null;

  const q = weeklyChallenge;
  const pct = Math.min(100, Math.round((q.current / q.target) * 100));

  return (
    <div style={{
      background: 'linear-gradient(135deg,#fff7ed,#fffdf9)',
      border: '3px solid var(--c-orange, #f59e0b)',
      borderRadius: '24px', padding: '16px 14px',
      marginBottom: '18px', boxShadow: 'var(--shadow-sm)', textAlign: 'left',
    }}>
      <h3 style={{
        fontSize: '1.05rem', fontWeight: 800, color: '#f59e0b',
        display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 10px',
      }}>
        🏅 Thử Thách Tuần Này
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: q.completed ? 'var(--c-grass)' : 'var(--ink)' }}>
            {q.completed ? '✅ ' : '🔥 '}{q.text}
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f59e0b', whiteSpace: 'nowrap' }}>
            {q.completed ? 'Hoàn thành!' : `🪙+${q.rewardCoins} ⭐+${q.rewardStars}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '12px', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: q.completed ? 'var(--c-grass)' : 'linear-gradient(90deg,#fde047,#f59e0b)',
              borderRadius: '6px', transition: 'width 0.4s',
            }} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, minWidth: '40px', textAlign: 'right' }}>
            {q.current}/{q.target}
          </span>
        </div>
      </div>
    </div>
  );
}
