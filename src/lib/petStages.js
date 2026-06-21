// Pet Evolution Stages — derived from friendship points (0-100)
// Each stage has its own visual treatment and coin-earning bonus.

export const PET_STAGES = [
  {
    id: 1,
    name: 'Trứng',
    emoji: '🥚',
    minPts: 0,
    maxPts: 19,
    scale: 0.55,
    glow: 'none',
    boost: 1.0,
    boostLabel: null,
    desc: 'Vừa nở từ trứng, cần làm quen',
    color: '#9ca3af',
    particles: false,
  },
  {
    id: 2,
    name: 'Bé bỏng',
    emoji: '🐣',
    minPts: 20,
    maxPts: 49,
    scale: 0.85,
    glow: '0 0 14px rgba(253,224,71,0.45)',
    boost: 1.25,
    boostLabel: '+25% xu',
    desc: 'Lớn lên một chút, đáng yêu hơn',
    color: '#fde047',
    particles: false,
  },
  {
    id: 3,
    name: 'Trưởng thành',
    emoji: '🌟',
    minPts: 50,
    maxPts: 79,
    scale: 1.15,
    glow: '0 0 22px rgba(255,159,67,0.6), 0 0 8px rgba(255,255,255,0.4)',
    boost: 1.5,
    boostLabel: '+50% xu',
    desc: 'Đã trưởng thành mạnh mẽ',
    color: '#ff9f43',
    particles: false,
  },
  {
    id: 4,
    name: 'Huyền thoại',
    emoji: '👑',
    minPts: 80,
    maxPts: 100,
    scale: 1.42,
    glow: '0 0 30px rgba(157,107,255,0.7), 0 0 50px rgba(255,126,179,0.45)',
    boost: 2.0,
    boostLabel: '🎁 NHÂN ĐÔI XU',
    desc: 'Linh thú đỉnh cao — ban phúc x2 xu!',
    color: '#9d6bff',
    particles: true,
  },
];

export function getPetStage(points) {
  const pts = Math.max(0, Math.min(100, points || 0));
  return PET_STAGES.find(s => pts >= s.minPts && pts <= s.maxPts) || PET_STAGES[0];
}

// Returns progress (0-1) within the current stage, used for progress bar
export function getStageProgress(points) {
  const stage = getPetStage(points);
  const range = stage.maxPts - stage.minPts;
  if (range === 0) return 1;
  return Math.max(0, Math.min(1, (points - stage.minPts) / range));
}

export function getNextStage(stageId) {
  return PET_STAGES.find(s => s.id === stageId + 1) || null;
}

// Returns the points needed to evolve, or null if at max stage
export function getPointsToNextStage(points) {
  const stage = getPetStage(points);
  const next = getNextStage(stage.id);
  if (!next) return null;
  return next.minPts - points;
}
