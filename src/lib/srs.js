/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0=quên hoàn toàn, 3=khó nhớ, 4=nhớ được, 5=dễ dàng
 */
export function reviewWord(card, quality) {
  let { ef = 2.5, interval = 1, reps = 0 } = card || {};

  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps++;
    ef = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }

  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + interval);

  return {
    ef: Math.round(ef * 100) / 100,
    interval,
    reps,
    nextDue: nextDue.toISOString().slice(0, 10),
  };
}

export function getDefaultCard() {
  const today = new Date().toISOString().slice(0, 10);
  return { ef: 2.5, interval: 1, reps: 0, nextDue: today };
}

export function isDue(card) {
  if (!card?.nextDue) return true;
  const today = new Date().toISOString().slice(0, 10);
  return card.nextDue <= today;
}

export function getDueWords(srsData, vocab) {
  const today = new Date().toISOString().slice(0, 10);
  const due = [];
  const newWords = [];

  for (const item of vocab) {
    const key = item.w.toLowerCase();
    const card = srsData[key];
    if (!card) {
      newWords.push(item);
    } else if (card.nextDue <= today) {
      due.push({ ...item, _card: card });
    }
  }

  return { due, newWords };
}
