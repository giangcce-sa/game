// Garden / "Grow a Garden" mode data.
// Each seed is tied to an English vocabulary word so growing & harvesting
// reinforces learning. Plants grow over real time, and answering the word's
// meaning correctly waters the plant to speed it up / skip the wait.
//
// growth model: 0 = seed, 1 = sprout, 2 = leafy, 3 = ripe (harvestable).
// A plant gains +1 growth per `growMinutes` of real time, OR +1 per correct
// vocabulary answer (watering). growMinutes scales with value.

export const GARDEN_MAX_GROWTH = 3;

// Regular seed shop — buy with coins, sell grown plants for profit.
// word: English vocab key (matched against combined vocab for the quiz).
export const SEED_SHOP = [
  { id: 'carrot',  word: 'carrot',  e: '🥕', vi: 'cà rốt',     buyPrice: 5,   sellPrice: 12,  growMinutes: 5,  tier: 'common' },
  { id: 'tomato',  word: 'tomato',  e: '🍅', vi: 'cà chua',    buyPrice: 8,   sellPrice: 18,  growMinutes: 6,  tier: 'common' },
  { id: 'corn',    word: 'corn',    e: '🌽', vi: 'ngô',        buyPrice: 12,  sellPrice: 28,  growMinutes: 8,  tier: 'common' },
  { id: 'coconut', word: 'coconut', e: '🥥', vi: 'dừa',        buyPrice: 20,  sellPrice: 48,  growMinutes: 12, tier: 'common' },
  { id: 'apple',   word: 'apple',   e: '🍎', vi: 'táo',        buyPrice: 35,  sellPrice: 85,  growMinutes: 15, tier: 'rare' },
  { id: 'banana',  word: 'banana',  e: '🍌', vi: 'chuối',      buyPrice: 50,  sellPrice: 120, growMinutes: 20, tier: 'rare' },
  { id: 'peach',   word: 'peach',   e: '🍑', vi: 'đào',        buyPrice: 200, sellPrice: 480, growMinutes: 30, tier: 'epic' },
  { id: 'grape',   word: 'grape',   e: '🍇', vi: 'nho',        buyPrice: 300, sellPrice: 720, growMinutes: 40, tier: 'epic' },
  { id: 'lychee',  word: 'lychee',  e: '🌸', vi: 'vải',        buyPrice: 500, sellPrice: 1200,growMinutes: 60, tier: 'legendary' },
];

// Event seeds — only available during a "Children's Day" / special event.
// Higher reward, special visuals. (Phase 3 wiring.)
export const EVENT_SEEDS = [
  { id: 'dragonfruit', word: 'dragon fruit', e: '🐉', vi: 'thanh long (rồng lửa)', buyPrice: 800,  sellPrice: 2000, growMinutes: 50, tier: 'event' },
  { id: 'venus',       word: 'venus flytrap',e: '🪴', vi: 'cây ăn thịt',           buyPrice: 1000, sellPrice: 2600, growMinutes: 55, tier: 'event' },
  { id: 'carplant',    word: 'toy car',      e: '🚗', vi: 'cây xe hơi',            buyPrice: 1200, sellPrice: 3200, growMinutes: 60, tier: 'event' },
];

// Boost items.
export const BOOSTS = [
  { id: 'magic_water', e: '💧✨', name: 'Nước Phép', price: 100,  desc: 'Tưới ngay +1 mức lớn cho 1 cây, không cần trả lời.' },
  { id: 'big_fruit',   e: '🔍🍎', name: 'Bùa Phóng To Quả', price: 5000, desc: 'Cây thu hoạch tiếp theo bán được GẤP ĐÔI xu.' },
];

export const PLOT_UNLOCK_COSTS = [0, 0, 0, 0, 150, 400, 900, 2000]; // cost to unlock plot index

export function getSeedById(id) {
  return SEED_SHOP.find(s => s.id === id) || EVENT_SEEDS.find(s => s.id === id) || null;
}

export function getGrowthStage(growth) {
  if (growth >= 3) return { e: '🌳', label: 'Chín — Thu hoạch!', ready: true };
  if (growth === 2) return { e: '🌿', label: 'Ra lá xanh' };
  if (growth === 1) return { e: '🌱', label: 'Mầm nhỏ' };
  return { e: '🟫', label: 'Hạt trong đất' };
}

// Compute growth from elapsed real time since planting (combined with waterings).
// waterings are stored separately and added on top, capped at GARDEN_MAX_GROWTH.
export function computeTimeGrowth(plantedAt, growMinutes) {
  if (!plantedAt || !growMinutes) return 0;
  const elapsedMin = (Date.now() - plantedAt) / 60000;
  return Math.floor(elapsedMin / growMinutes);
}

export function effectiveGrowth(plot) {
  const seed = getSeedById(plot.seedId);
  const timeG = computeTimeGrowth(plot.plantedAt, seed?.growMinutes);
  return Math.min(GARDEN_MAX_GROWTH, timeG + (plot.waterings || 0));
}
