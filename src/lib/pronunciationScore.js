// Pronunciation scoring from a speech-recognition transcript.
// We can't measure acoustics in-browser, so we compare the recognized words
// against the target sentence word-by-word. This is honest (reflects what the
// recognizer actually heard) and feeds the per-word phonics tracker.

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(s) {
  const n = normalize(s);
  return n ? n.split(' ') : [];
}

// Compare spoken transcript to a target sentence.
// Returns { overall, matched, total, words:[{word, ok}] }.
// A target word counts as matched if it appears anywhere in the spoken tokens
// (order-independent) — kids often pause or reorder, so we stay lenient.
export function scorePronunciation(target, transcript) {
  const targetWords = tokenize(target);
  const spoken = tokenize(transcript);
  const spokenPool = new Set(spoken);

  const words = targetWords.map(word => ({
    word,
    ok: spokenPool.has(word),
  }));

  const matched = words.filter(w => w.ok).length;
  const total = targetWords.length || 1;
  const overall = Math.round((matched / total) * 100);

  return { overall, matched, total, words };
}

// Map an overall percentage to the studio's 1–3 star display.
export function pctToStars(pct) {
  if (pct >= 85) return 3;
  if (pct >= 50) return 2;
  return 1;
}
