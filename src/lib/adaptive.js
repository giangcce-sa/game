// Adaptive learning helpers — pure functions driven by profile data.
// Inputs come from the per-child profile: analytics {topicId:{correct,wrong}},
// phonicsStats {phonemeId:{attempts,success}}, srsData, and per-game levels.

const LEVEL_KEYS = {
  picture:  'picLevel',
  memory:   'memLevel',
  arcade:   'arcLevel',
  quiz:     'quizLevel',
  writing:  'wriLevel',
};

export function getLevelKey(gameKey) {
  return LEVEL_KEYS[gameKey] || null;
}

// Accuracy for a single topic (0..1), or null when there's no data yet.
export function getTopicAccuracy(analytics, topicId) {
  const a = analytics?.[topicId];
  if (!a) return null;
  const total = (a.correct || 0) + (a.wrong || 0);
  if (total === 0) return null;
  return a.correct / total;
}

// Topics the child struggles with, weakest first.
// minAttempts avoids flagging a topic off a single unlucky miss.
export function getWeakTopics(analytics = {}, { threshold = 0.7, minAttempts = 4 } = {}) {
  const rows = [];
  for (const [topicId, a] of Object.entries(analytics)) {
    const total = (a.correct || 0) + (a.wrong || 0);
    if (total < minAttempts) continue;
    const acc = a.correct / total;
    if (acc < threshold) rows.push({ topicId, accuracy: acc, attempts: total });
  }
  return rows.sort((x, y) => x.accuracy - y.accuracy);
}

// Strong topics, strongest first (for praise / fast-track).
export function getStrongTopics(analytics = {}, { threshold = 0.85, minAttempts = 4 } = {}) {
  const rows = [];
  for (const [topicId, a] of Object.entries(analytics)) {
    const total = (a.correct || 0) + (a.wrong || 0);
    if (total < minAttempts) continue;
    const acc = a.correct / total;
    if (acc >= threshold) rows.push({ topicId, accuracy: acc, attempts: total });
  }
  return rows.sort((x, y) => y.accuracy - x.accuracy);
}

// Suggest a level delta for a game after a session, based on that session's score.
// scorePct: 0..100 for the round just finished. Returns -1 | 0 | +1.
// High accuracy → step up (cap handled by caller at 5); poor accuracy → step down (min 1).
export function getLevelDelta(scorePct, currentLevel) {
  if (scorePct >= 85 && currentLevel < 5) return +1;
  if (scorePct < 40 && currentLevel > 1) return -1;
  return 0;
}

// Pick what the child should focus on next. Returns the weakest topic id,
// or null when everything is strong / not enough data — caller falls back to normal flow.
export function getNextFocusTopic(analytics = {}) {
  const weak = getWeakTopics(analytics);
  return weak.length > 0 ? weak[0].topicId : null;
}

// Weak phonemes from phonicsStats, weakest first.
export function getWeakPhonemes(phonicsStats = {}, { threshold = 0.7, minAttempts = 3 } = {}) {
  const rows = [];
  for (const [id, s] of Object.entries(phonicsStats)) {
    const attempts = s.attempts || 0;
    if (attempts < minAttempts) continue;
    const acc = (s.success || 0) / attempts;
    if (acc < threshold) rows.push({ id, accuracy: acc, attempts });
  }
  return rows.sort((x, y) => x.accuracy - y.accuracy);
}
