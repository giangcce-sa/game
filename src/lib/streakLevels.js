// Streak Milestones — visual tree growth tied to consecutive learning days.
// Each milestone gives a one-time reward when reached.

export const STREAK_MILESTONES = [
  { days: 3,   name: 'Mầm non',         emoji: '🌱', color: '#84cc16', reward: { coins: 20,   stars: 10,  shield: 0 } },
  { days: 7,   name: 'Cây non',         emoji: '🌿', color: '#22c55e', reward: { coins: 50,   stars: 25,  shield: 1 } },
  { days: 14,  name: 'Cây nhỏ',         emoji: '🌳', color: '#16a34a', reward: { coins: 100,  stars: 50,  shield: 1 } },
  { days: 30,  name: 'Cây trưởng thành', emoji: '🌲', color: '#15803d', reward: { coins: 250,  stars: 120, shield: 2 } },
  { days: 60,  name: 'Cây cổ thụ',      emoji: '🌴', color: '#166534', reward: { coins: 500,  stars: 250, shield: 2 } },
  { days: 100, name: 'Cây ánh sáng',    emoji: '🌟', color: '#fbbf24', reward: { coins: 1500, stars: 700, shield: 3 } },
  { days: 200, name: 'Cây thần thoại',  emoji: '✨', color: '#9d6bff', reward: { coins: 5000, stars: 2000, shield: 5 } },
];

// Visual tree shown at each level (composed of emojis)
export function getStreakVisual(days) {
  if (days >= 200) return { tree: '🌳✨', label: 'Thần thoại', color: '#9d6bff', glow: '0 0 30px rgba(157,107,255,0.8)' };
  if (days >= 100) return { tree: '🌟🌳', label: 'Ánh sáng',    color: '#fbbf24', glow: '0 0 24px rgba(251,191,36,0.7)' };
  if (days >= 60)  return { tree: '🌴',   label: 'Cổ thụ',     color: '#166534', glow: '0 0 14px rgba(22,101,52,0.4)' };
  if (days >= 30)  return { tree: '🌲',   label: 'Trưởng thành', color: '#15803d', glow: '0 0 10px rgba(21,128,61,0.35)' };
  if (days >= 14)  return { tree: '🌳',   label: 'Cây nhỏ',    color: '#16a34a', glow: 'none' };
  if (days >= 7)   return { tree: '🌿',   label: 'Cây non',    color: '#22c55e', glow: 'none' };
  if (days >= 3)   return { tree: '🌱',   label: 'Mầm non',    color: '#84cc16', glow: 'none' };
  if (days >= 1)   return { tree: '🌰',   label: 'Hạt giống',  color: '#a78bfa', glow: 'none' };
  return { tree: '🌰', label: 'Hôm nay bắt đầu!', color: '#a78bfa', glow: 'none' };
}

export function getNextMilestone(days) {
  return STREAK_MILESTONES.find(m => days < m.days) || null;
}

export function getMilestoneToClaim(days, claimed = []) {
  // Find the latest milestone reached but not yet claimed
  let target = null;
  for (const m of STREAK_MILESTONES) {
    if (days >= m.days && !claimed.includes(m.days)) target = m;
  }
  return target;
}
