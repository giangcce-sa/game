import React from 'react';
import { useGame } from '../../context/GameContext';

export default function QuestWidget() {
  const { dailyQuests } = useGame();

  if (!dailyQuests || dailyQuests.length === 0) return null;

  return (
    <div style={{
      background: '#fffdf9', border: '3px solid var(--c-purple)',
      borderRadius: '24px', padding: '16px 14px',
      marginBottom: '18px', boxShadow: 'var(--shadow-sm)', textAlign: 'left'
    }}>
      <h3 style={{
        fontSize: '1.05rem', fontWeight: 800, color: 'var(--c-purple)',
        display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 10px'
      }}>
        📜 Thử Thách Hôm Nay
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {dailyQuests.map(q => {
          const pct = Math.min(100, Math.round((q.current / q.target) * 100));
          return (
            <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: q.completed ? 'var(--c-grass)' : 'var(--ink)' }}>
                  {q.completed ? '✅ ' : '✨ '}{q.text}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--c-orange)' }}>
                  {q.completed ? 'Hoàn thành!' : `🪙+${q.rewardCoins} ⭐+${q.rewardStars}`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '10px', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: q.completed ? 'var(--c-grass)' : 'var(--c-purple)',
                    borderRadius: '6px', transition: 'width 0.3s'
                  }} />
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, minWidth: '32px', textAlign: 'right' }}>
                  {q.current}/{q.target}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
