// Friend Code — 6-char alphanumeric (no ambiguous chars like 0/O/I/1)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateFriendCode() {
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

export function isValidFriendCode(code) {
  if (typeof code !== 'string') return false;
  const c = code.trim().toUpperCase();
  if (c.length !== 6) return false;
  for (const ch of c) if (!ALPHABET.includes(ch)) return false;
  return true;
}

// ISO week key (e.g. "2026-W25") — used to detect when weekly stars should reset
export function currentWeekKey(d = new Date()) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Monday-based ISO week
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
