// Phonics tracker — focuses on phonemes that are typically hard for Vietnamese speakers.
// We approximate phoneme-level accuracy by attributing word-level success/failure
// to every phoneme the IPA contains.

export const TRACKED_PHONEMES = [
  { id: 'th_voiceless', symbol: '/θ/',  display: 'th',  examples: 'think, three, mouth',     vi_tip: 'Đặt lưỡi giữa hai hàm răng, đẩy hơi ra (không rung)',  matchers: [/θ/] },
  { id: 'th_voiced',    symbol: '/ð/',  display: 'th',  examples: 'this, that, mother',      vi_tip: 'Đặt lưỡi giữa hai hàm răng, có rung dây thanh',         matchers: [/ð/] },
  { id: 'sh',           symbol: '/ʃ/',  display: 'sh',  examples: 'ship, fish, wash',        vi_tip: 'Tròn môi, hơi nhẹ, lưỡi cong vòm miệng',                matchers: [/ʃ/] },
  { id: 'zh',           symbol: '/ʒ/',  display: 'zh',  examples: 'measure, vision',         vi_tip: 'Như /ʃ/ nhưng có rung dây thanh',                       matchers: [/ʒ/] },
  { id: 'ch',           symbol: '/tʃ/', display: 'ch',  examples: 'chair, watch, beach',     vi_tip: 'Kết hợp âm /t/ và /ʃ/',                                  matchers: [/tʃ/] },
  { id: 'j',            symbol: '/dʒ/', display: 'j',   examples: 'judge, just, age',        vi_tip: 'Kết hợp /d/ và /ʒ/, có rung',                            matchers: [/dʒ/] },
  { id: 'r',            symbol: '/r/',  display: 'r',   examples: 'red, very, run',          vi_tip: 'Lưỡi cong nhẹ, không chạm vòm miệng (khác R tiếng Việt)', matchers: [/r/, /ɹ/] },
  { id: 'l',            symbol: '/l/',  display: 'l',   examples: 'love, light, ball',       vi_tip: 'Lưỡi chạm răng trên, không tách ra giữa từ',           matchers: [/l/] },
  { id: 'v',            symbol: '/v/',  display: 'v',   examples: 'van, very, love',         vi_tip: 'Răng trên cắn nhẹ môi dưới, có rung',                    matchers: [/v/] },
  { id: 'f',            symbol: '/f/',  display: 'f',   examples: 'fan, fish, off',          vi_tip: 'Như /v/ nhưng không rung',                                matchers: [/f/] },
  { id: 'z_end',        symbol: '/z/',  display: 's→z', examples: 'dogs, eyes, runs',        vi_tip: 'Cuối từ có rung — không phải /s/',                       matchers: [/z/] },
  { id: 'ae',           symbol: '/æ/',  display: 'ae',  examples: 'cat, apple, bag',         vi_tip: 'Mồm mở rộng, lưỡi thấp',                                 matchers: [/æ/] },
  { id: 'i_long',       symbol: '/iː/', display: 'ee',  examples: 'see, sheep, beat',        vi_tip: 'Kéo dài âm i',                                            matchers: [/iː/, /i:/] },
  { id: 'i_short',      symbol: '/ɪ/',  display: 'i',   examples: 'ship, bit, sit',          vi_tip: 'Ngắn, lưỡi cao',                                          matchers: [/ɪ/] },
  { id: 'schwa',        symbol: '/ə/',  display: 'uh',  examples: 'about, the, banana',      vi_tip: 'Âm yếu, nuốt nhanh',                                      matchers: [/ə/] },
  { id: 'u_short',      symbol: '/ʌ/',  display: 'uh',  examples: 'cut, but, fun',           vi_tip: 'Ngắn, gần giống ə nhưng mạnh hơn',                       matchers: [/ʌ/] },
];

const PHONEME_MAP = Object.fromEntries(TRACKED_PHONEMES.map(p => [p.id, p]));

export function getPhoneme(id) {
  return PHONEME_MAP[id] || null;
}

// Given an IPA string (e.g. "/ˈθɪŋk/"), return ids of tracked phonemes present
export function extractPhonemesFromIpa(ipa) {
  if (!ipa || typeof ipa !== 'string') return [];
  const found = [];
  for (const p of TRACKED_PHONEMES) {
    for (const m of p.matchers) {
      if (m.test(ipa)) { found.push(p.id); break; }
    }
  }
  return found;
}

// Heatmap rows sorted: worst accuracy first (most attempts wins ties)
export function getPhonicsHeatmap(stats = {}) {
  return TRACKED_PHONEMES
    .map(p => {
      const s = stats[p.id] || { attempts: 0, success: 0 };
      const accuracy = s.attempts > 0 ? Math.round((s.success / s.attempts) * 100) : null;
      return { ...p, attempts: s.attempts, success: s.success, accuracy };
    })
    .filter(row => row.attempts > 0)
    .sort((a, b) => {
      if (a.accuracy === b.accuracy) return b.attempts - a.attempts;
      return (a.accuracy ?? 100) - (b.accuracy ?? 100);
    });
}
