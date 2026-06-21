const CACHE_KEY = 'vhta_ipa_cache';

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

export async function getIpa(word) {
  const cache = loadCache();
  const key = word.toLowerCase().trim();
  if (cache[key]) return cache[key];

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    const ipa = entry?.phonetic || entry?.phonetics?.find(p => p.text)?.text || null;
    const audioUrl = entry?.phonetics?.find(p => p.audio)?.audio || null;
    const result = { ipa, audioUrl };
    cache[key] = result;
    saveCache(cache);
    return result;
  } catch {
    return { ipa: null, audioUrl: null };
  }
}
