import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Volume2 } from 'lucide-react';

const TOTAL_ROUNDS = 10;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GameListening({ onFinish, onBack }) {
  const { speak, beep, showToast, getCombinedVocab, addStarsAndCoins, updateAnalytics } = useGame();

  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [lockClick, setLockClick] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => () => { if (cooldownRef.current) clearTimeout(cooldownRef.current); }, []);

  const vocabPool = useCallback(() => {
    const combined = getCombinedVocab();
    // Only keep entries that have an English word + Vietnamese translation
    return combined.filter(v => v.w && v.vi && v.w.length > 0 && v.vi.length > 0);
  }, [getCombinedVocab]);

  const nextRound = useCallback(() => {
    const pool = vocabPool();
    if (pool.length < 4) {
      showToast('Cần thêm từ vựng để chơi!', 'bad');
      onBack();
      return;
    }
    const shuffled = shuffle(pool);
    const target = shuffled[0];
    // Pick 2 distractors from same topic if possible, else random
    const distractors = shuffled
      .slice(1)
      .filter(v => v.vi !== target.vi)
      .filter(v => v.t === target.t)
      .slice(0, 2);
    while (distractors.length < 2) {
      const r = shuffled[Math.floor(Math.random() * shuffled.length)];
      if (r.vi !== target.vi && !distractors.some(d => d.vi === r.vi)) {
        distractors.push(r);
      }
    }
    const opts = shuffle([target, ...distractors]);
    setQuestion(target);
    setOptions(opts);
    setSelectedOpt(null);
    setLockClick(false);
    setPlayCount(0);

    // Auto-play the word after a short delay
    setTimeout(() => {
      speak(target.w);
      setPlayCount(1);
    }, 350);
  }, [vocabPool, speak, showToast, onBack]);

  // Initialize first round
  useEffect(() => { nextRound(); }, []); // eslint-disable-line

  const handlePlay = () => {
    if (!question) return;
    speak(question.w);
    setPlayCount(c => c + 1);
  };

  const handleSelect = (opt) => {
    if (lockClick || !question) return;
    setLockClick(true);
    setSelectedOpt(opt);
    const isCorrect = opt.vi === question.vi;

    if (isCorrect) {
      beep('good');
      // Bonus if got it without replaying many times
      const bonus = playCount <= 1 ? 12 : playCount === 2 ? 10 : 8;
      setScore(s => s + bonus);
      setCoins(c => c + Math.floor(bonus / 4));
      addStarsAndCoins(bonus, Math.floor(bonus / 4), true);
      updateAnalytics(question.t || 'general', true);
      showToast(`+${bonus} ⭐ Chính xác!`, 'good');
    } else {
      beep('bad');
      updateAnalytics(question.t || 'general', false);
      showToast(`Đáp án đúng: ${question.vi}`, 'bad');
    }

    cooldownRef.current = setTimeout(() => {
      if (round + 1 >= TOTAL_ROUNDS) {
        onFinish({
          emoji: score + (isCorrect ? 12 : 0) >= 60 ? '🎧' : '👂',
          title: score + (isCorrect ? 12 : 0) >= 60 ? 'Đôi tai vàng!' : 'Cần luyện thêm!',
          msg: `Bé nghe đúng ${(isCorrect ? 1 : 0) + Math.round(score / 10)}/${TOTAL_ROUNDS} câu! Tổng ${score + (isCorrect ? 12 : 0)} sao.`,
          stars: score + (isCorrect ? 12 : 0),
          coins: coins + (isCorrect ? Math.floor(12 / 4) : 0),
        });
      } else {
        setRound(r => r + 1);
        nextRound();
      }
    }, 1300);
  };

  if (!question) return null;

  return (
    <div style={{ padding: '14px 12px 30px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <button className="back-btn" onClick={onBack} style={{ margin: 0 }}>
          <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}/>
          Quay lại
        </button>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--c-purple)', margin: 0 }}>
          🎧 Luyện nghe
        </h2>
        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 800, color: 'var(--ink-soft)' }}>
          {round + 1}/{TOTAL_ROUNDS} • ⭐ {score}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{
          height: '100%', width: `${((round) / TOTAL_ROUNDS) * 100}%`,
          background: 'linear-gradient(90deg,#5ec8f8,#9d6bff)',
          borderRadius: 6, transition: 'width 0.4s',
        }}/>
      </div>

      {/* Big play button */}
      <div style={{
        background: 'linear-gradient(160deg,#a0e9ff,#9d6bff)',
        borderRadius: 24, padding: '32px 16px', textAlign: 'center',
        marginBottom: 18, position: 'relative', overflow: 'hidden',
      }}>
        {/* Audio waves decoration */}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 0.15, pointerEvents: 'none', fontSize: '8rem' }}>
          🎵
        </div>

        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', opacity: 0.9, marginBottom: 10 }}>
          Nhấn để nghe lại
        </div>
        <button
          onClick={handlePlay}
          disabled={lockClick}
          style={{
            width: 110, height: 110, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, #fff, #e9d5ff)',
            cursor: lockClick ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25), 0 0 0 5px rgba(255,255,255,0.3)',
            display: 'grid', placeItems: 'center',
            position: 'relative', zIndex: 1,
            transition: 'transform 0.15s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Volume2 size={48} color="#4c1d95"/>
        </button>
        <div style={{ marginTop: 12, fontSize: '0.78rem', fontWeight: 700, color: '#fff', opacity: 0.8 }}>
          {playCount > 0 && `Đã nghe ${playCount} lần${playCount > 2 ? ' • -2⭐ mỗi lần' : ''}`}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--ink)', textAlign: 'center', marginBottom: 4 }}>
          Bé nghe được nghĩa nào? 👇
        </div>
        {options.map((opt, i) => {
          let bg = '#fff', color = '#1e1b4b', border = '2px solid #e5d4ff';
          if (selectedOpt) {
            const isThis = opt.vi === selectedOpt.vi;
            const isCorrect = opt.vi === question.vi;
            if (isCorrect)       { bg = '#86efac'; color = '#065f46'; border = '3px solid #16a34a'; }
            else if (isThis)     { bg = '#fca5a5'; color = '#7f1d1d'; border = '3px solid #dc2626'; }
            else                 { bg = '#f3f4f6'; color = '#9ca3af'; }
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              disabled={lockClick}
              style={{
                background: bg, color, border,
                padding: '14px 16px', borderRadius: 16,
                fontWeight: 900, fontSize: '1rem',
                cursor: lockClick ? 'default' : 'pointer',
                fontFamily: 'var(--font)',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: lockClick ? 'none' : '0 3px 0 rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '1.6rem' }}>{opt.e}</span>
              <span>{opt.vi}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
