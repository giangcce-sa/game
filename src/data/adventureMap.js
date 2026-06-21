// Adventure Map — 30 nodes across 3 chapters (Forest / Sea / Sky kingdoms)
// Each node = a quest pairing a topic with a mini-game type.

export const ADVENTURE_CHAPTERS = [
  {
    id: 'forest',
    idx: 1,
    name: 'Rừng Khởi Đầu',
    emoji: '🌲',
    color: '#16a34a',
    bg: 'linear-gradient(180deg,#a7f3d0 0%,#dcfce7 100%)',
    requiredCefr: 'A1',
    reward: { stars: 50, coins: 40 },
  },
  {
    id: 'sea',
    idx: 2,
    name: 'Đại Dương Kỳ Bí',
    emoji: '🌊',
    color: '#0ea5e9',
    bg: 'linear-gradient(180deg,#bae6fd 0%,#e0f2fe 100%)',
    requiredCefr: 'A2',
    reward: { stars: 80, coins: 60 },
  },
  {
    id: 'sky',
    idx: 3,
    name: 'Bầu Trời Thần Thoại',
    emoji: '☁️',
    color: '#9d6bff',
    bg: 'linear-gradient(180deg,#e9d5ff 0%,#f3e8ff 100%)',
    requiredCefr: 'B1',
    reward: { stars: 120, coins: 90 },
  },
];

// Helper to make a node entry
const N = (id, chapter, game, topic, title, emoji) => ({ id, chapter, game, topic, title, emoji });

export const ADVENTURE_NODES = [
  // ── Chapter 1: Forest (Animals, Food, Family) — A1 vibes ───────────────
  N('f1',  'forest', 'picture',  'animals', 'Gặp các con vật',      '🐾'),
  N('f2',  'forest', 'memory',   'animals', 'Trí nhớ rừng xanh',     '🃏'),
  N('f3',  'forest', 'quiz',     'food',    'Trái cây thơm',         '🍎'),
  N('f4',  'forest', 'listening','animals', 'Lắng nghe rừng',        '🎧'),
  N('f5',  'forest', 'picture',  'colors',  'Sắc màu rừng',          '🎨'),
  N('f6',  'forest', 'memory',   'food',    'Bữa tiệc trí nhớ',      '🍰'),
  N('f7',  'forest', 'writing',  'animals', 'Tập viết tên con vật',  '✏️'),
  N('f8',  'forest', 'arcade',   'food',    'Đuổi bóng trái cây',    '🎈'),
  N('f9',  'forest', 'quiz',     'family',  'Gia đình thân yêu',     '👨‍👩‍👧'),
  N('f10', 'forest', 'arcade_vs','animals', '⚔️ Boss: Cú Cốc Cốc',   '🦉'),

  // ── Chapter 2: Sea (Travel, Body, Numbers, Sports) — A2 ────────────────
  N('s1',  'sea',    'picture',   'transport', 'Phương tiện trên biển', '🚢'),
  N('s2',  'sea',    'listening', 'body',      'Cơ thể đi bơi',          '🏊'),
  N('s3',  'sea',    'quiz',      'numbers',   'Đếm cá heo',             '🔢'),
  N('s4',  'sea',    'memory',    'sports',    'Thể thao biển',          '🏐'),
  N('s5',  'sea',    'grammar',   'all',       'Thì hiện tại đơn',       '📝'),
  N('s6',  'sea',    'writing',   'transport', 'Viết tên phương tiện',   '✏️'),
  N('s7',  'sea',    'arcade',    'body',      'Đuổi bóng cơ thể',       '🎈'),
  N('s8',  'sea',    'sentence',  'all',       'Ghép câu thủy thủ',      '🧩'),
  N('s9',  'sea',    'minimal_pairs', 'all',   'Phân biệt âm sóng',      '🔊'),
  N('s10', 'sea',    'arcade_vs', 'all',       '⚔️ Boss: Quái biển',     '🐙'),

  // ── Chapter 3: Sky (Weather, Time, School, Idioms) — B1 ────────────────
  N('k1',  'sky',    'picture',   'weather',  'Thời tiết bầu trời',    '⛅'),
  N('k2',  'sky',    'listening', 'time',     'Giờ giấc',               '⏰'),
  N('k3',  'sky',    'quiz',      'school',   'Trường học trên mây',    '🏫'),
  N('k4',  'sky',    'grammar',   'all',      'Thì quá khứ',            '📝'),
  N('k5',  'sky',    'memory',    'weather',  'Trí nhớ mây mưa',        '🃏'),
  N('k6',  'sky',    'writing',   'school',   'Viết về trường',         '✏️'),
  N('k7',  'sky',    'sentence',  'all',      'Ghép câu phức',          '🧩'),
  N('k8',  'sky',    'minimal_pairs','all',   'Âm khó của tiếng Anh',   '🔊'),
  N('k9',  'sky',    'listening', 'school',   'Nghe hiểu nâng cao',     '🎧'),
  N('k10', 'sky',    'arcade_vs', 'all',      '⚔️ Boss: Đại pháp sư',   '🧙'),
];

export function getNodeById(id) {
  return ADVENTURE_NODES.find(n => n.id === id) || null;
}

export function getNodesInChapter(chapterId) {
  return ADVENTURE_NODES.filter(n => n.chapter === chapterId);
}

export function getChapter(chapterId) {
  return ADVENTURE_CHAPTERS.find(c => c.id === chapterId) || ADVENTURE_CHAPTERS[0];
}

// Returns true if a node is unlocked given completed list
export function isNodeUnlocked(node, completedNodes = []) {
  const idx = ADVENTURE_NODES.findIndex(n => n.id === node.id);
  if (idx === 0) return true; // first node always open
  const prev = ADVENTURE_NODES[idx - 1];
  return completedNodes.includes(prev.id);
}

// Compute overall progress (0..1)
export function getAdventureProgress(completedNodes = []) {
  return Math.min(1, completedNodes.length / ADVENTURE_NODES.length);
}

// Stars to display per node (0-3 based on game stars earned)
export function getNodeStars(starsValue) {
  if (!starsValue) return 0;
  if (starsValue >= 60) return 3;
  if (starsValue >= 40) return 2;
  if (starsValue >= 20) return 1;
  return 0;
}

// Sum of earned display-stars (0-3 each) for all nodes in a chapter
export function getChapterStars(chapterId, starsByNode = {}) {
  return ADVENTURE_NODES
    .filter(n => n.chapter === chapterId)
    .reduce((sum, n) => sum + getNodeStars(starsByNode[n.id] || 0), 0);
}

// Max possible display-stars in a chapter (3 per node)
export function getChapterMaxStars(chapterId) {
  return ADVENTURE_NODES.filter(n => n.chapter === chapterId).length * 3;
}

// All nodes in a chapter completed?
export function isChapterComplete(chapterId, completedNodes = []) {
  const set = new Set(completedNodes);
  return ADVENTURE_NODES
    .filter(n => n.chapter === chapterId)
    .every(n => set.has(n.id));
}

// Map game type id → game key used in App.jsx routing
export const GAME_TYPE_TO_KEY = {
  picture:       'picture',
  memory:        'memory',
  arcade:        'arcade',
  quiz:          'quiz',
  sentence:      'sentence',
  writing:       'writing',
  arcade_vs:     'arcade_vs',
  grammar:       'grammar',
  listening:     'listening',
  minimal_pairs: 'minimal_pairs',
};

// Game label (Vietnamese)
export const GAME_LABEL = {
  picture:       '🖼️ Đoán hình',
  memory:        '🃏 Lật thẻ trí nhớ',
  arcade:        '🎈 Đuổi bóng bay',
  quiz:          '📝 Trắc nghiệm',
  sentence:      '🧩 Ghép câu',
  writing:       '✏️ Tập viết',
  arcade_vs:     '⚔️ Đấu Cú Cốc Cốc',
  grammar:       '📝 Ngữ pháp',
  listening:     '🎧 Luyện nghe',
  minimal_pairs: '🔊 Phân biệt âm',
};
