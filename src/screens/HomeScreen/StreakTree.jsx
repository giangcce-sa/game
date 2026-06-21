import React from 'react';
import { STREAK_MILESTONES, getStreakVisual, getNextMilestone } from '../../lib/streakLevels';

export default function StreakTree({ profile }) {
  if (!profile) return null;
  const days = profile.streak || 0;
  const shields = profile.streakShieldCount || 0;
  const today = new Date().toDateString();
  const gamesToday = profile.dailyGamesDate === today ? (profile.dailyGamesPlayed || 0) : 0;
  const dailyChestClaimed = profile.dailyGamesDate === today && profile.dailyChestClaimed;

  const visual = getStreakVisual(days);
  const next = getNextMilestone(days);
  const prevMilestone = STREAK_MILESTONES.slice().reverse().find(m => days >= m.days);
  const lo = prevMilestone ? prevMilestone.days : 0;
  const hi = next ? next.days : (prevMilestone?.days || 1);
  const progress = next ? Math.max(0, Math.min(1, (days - lo) / Math.max(1, hi - lo))) : 1;

  return (
    <div style={{
      background: `linear-gradient(135deg, ${visual.color}1a, rgba(255,255,255,0.6))`,
      border: `2px solid ${visual.color}55`,
      borderRadius: 20, padding: '14px 14px 12px',
      margin: '12px 0', textAlign: 'left',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          fontSize: '2.4rem', lineHeight: 1, filter: visual.glow !== 'none' ? `drop-shadow(${visual.glow})` : 'none',
          animation: days >= 30 ? 'bob 2.4s ease-in-out infinite' : 'none',
        }}>
          {visual.tree}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: '0.95rem', color: 'var(--ink)' }}>
            🔥 <span style={{ color: visual.color }}>{days}</span> ngày
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: visual.color, background: `${visual.color}22`, padding: '2px 8px', borderRadius: 10 }}>
              {visual.label}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', fontWeight: 700, marginTop: 2 }}>
            {next ? `Còn ${next.days - days} ngày → ${next.emoji} ${next.name}` : '👑 Đã đạt mốc cao nhất!'}
          </div>
        </div>
        {/* Shield badge */}
        <div title={`Khiên Streak: ${shields}`} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: shields > 0 ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.05)',
          border: `1.5px solid ${shields > 0 ? '#3b82f6' : '#d1d5db'}`,
          padding: '4px 8px', borderRadius: 10,
          fontSize: '0.78rem', fontWeight: 900,
          color: shields > 0 ? '#3b82f6' : '#9ca3af',
        }}>
          🛡️ {shields}
        </div>
      </div>

      {/* Progress bar to next milestone */}
      {next && (
        <div style={{ height: 8, background: 'rgba(0,0,0,0.07)', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${visual.color}, ${next ? STREAK_MILESTONES.find(m => m.days === next.days)?.color : visual.color})`,
            borderRadius: 8, transition: 'width 0.6s',
          }} />
        </div>
      )}

      {/* Daily mini-streak */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-soft)' }}>
        <span>🎯 Hôm nay:</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: 18, height: 18, borderRadius: 6,
              background: gamesToday > i ? '#22c55e' : 'rgba(0,0,0,0.08)',
              color: gamesToday > i ? '#fff' : 'transparent',
              display: 'grid', placeItems: 'center', fontSize: '0.7rem', fontWeight: 900,
              transition: 'background 0.3s',
            }}>✓</span>
          ))}
        </div>
        <span style={{ color: dailyChestClaimed ? '#22c55e' : 'var(--ink-soft)' }}>
          {dailyChestClaimed
            ? '🎁 Đã mở rương ngày!'
            : gamesToday >= 3
            ? '🎁 Sẵn sàng mở!'
            : `${gamesToday}/3 → 🎁 +50🪙 +20⭐`}
        </span>
      </div>
    </div>
  );
}
