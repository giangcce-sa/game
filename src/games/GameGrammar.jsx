import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft } from 'lucide-react';

// ─── Question Bank ────────────────────────────────────────────────────────────
const QUESTIONS = [
  // fill-in-blank
  { type: 'fill', sentence: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'went'], answer: 1 },
  { type: 'fill', sentence: 'They ___ playing football now.', options: ['is', 'are', 'am', 'be'], answer: 1 },
  { type: 'fill', sentence: 'I ___ a student.', options: ['am', 'is', 'are', 'be'], answer: 0 },
  { type: 'fill', sentence: 'He ___ not like vegetables.', options: ['do', 'does', 'did', "don't"], answer: 1 },
  { type: 'fill', sentence: 'We ___ lunch at noon.', options: ['eat', 'eats', 'eating', 'ate'], answer: 0 },
  { type: 'fill', sentence: 'She ___ English very well.', options: ['speak', 'speaks', 'speaking', 'spoke'], answer: 1 },
  { type: 'fill', sentence: 'The cat ___ on the mat.', options: ['sit', 'sits', 'sitting', 'sat'], answer: 1 },
  { type: 'fill', sentence: 'They ___ happy today.', options: ['is', 'are', 'am', 'be'], answer: 1 },

  // sentence-order
  { type: 'order', words: ['play', 'I', 'football', 'every', 'day'], correctOrder: 'I play football every day' },
  { type: 'order', words: ['is', 'cat', 'the', 'big'], correctOrder: 'the cat is big' },
  { type: 'order', words: ['she', 'apples', 'likes'], correctOrder: 'she likes apples' },
  { type: 'order', words: ['school', 'go', 'we', 'to'], correctOrder: 'we go to school' },

  // error-correction
  { type: 'error', sentence: 'She go to school.', options: ['She goes to school.', 'She going to school.', 'She gone to school.', 'She went to school.'], answer: 0, errorWord: 'go' },
  { type: 'error', sentence: 'They is my friends.', options: ['They are my friends.', 'They am my friends.', 'They was my friends.', 'They be my friends.'], answer: 0, errorWord: 'is' },
  { type: 'error', sentence: 'I has a dog.', options: ['I have a dog.', 'I had a dog.', 'I having a dog.', 'I haved a dog.'], answer: 0, errorWord: 'has' },
];

const TOTAL_ROUNDS = 10;
const TIMER_SECONDS = 20;

// Shuffle array helper
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Pick TOTAL_ROUNDS questions, covering all types if possible
function buildRoundList() {
  const shuffled = shuffle(QUESTIONS);
  const result = [];
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}

export default function GameGrammar({ onFinish, onBack }) {
  const { beep, speak, addStarsAndCoins, showToast } = useGame();

  const [rounds] = useState(() => buildRoundList());
  const [roundIdx, setRoundIdx] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);

  // per-question states
  const [selected, setSelected] = useState(null);       // index of chosen option (fill/error)
  const [feedback, setFeedback] = useState(null);       // 'correct' | 'wrong' | null
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  // sentence-order states
  const [bank, setBank] = useState([]);      // shuffled chips still in bank
  const [answer, setAnswer] = useState([]);  // chips placed in answer row

  const timerRef = useRef(null);

  const currentQ = rounds[roundIdx];

  // ─── Init question ────────────────────────────────────────────────────────
  const initQuestion = useCallback((q) => {
    setSelected(null);
    setFeedback(null);
    setLocked(false);
    setTimeLeft(TIMER_SECONDS);
    if (q.type === 'order') {
      setBank(shuffle(q.words.map((w, i) => ({ w, id: i }))));
      setAnswer([]);
    }
  }, []);

  useEffect(() => {
    initQuestion(currentQ);
  }, [roundIdx]); // eslint-disable-line

  // ─── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (locked) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [roundIdx, locked]); // eslint-disable-line

  // ─── Advance to next round ────────────────────────────────────────────────
  const advance = useCallback((wasCorrect, earnedStars) => {
    setLocked(true);
    const delay = wasCorrect ? 800 : 1200;
    setTimeout(() => {
      if (roundIdx + 1 >= TOTAL_ROUNDS) {
        // Game over
        const totalStars = earnedStars;
        addStarsAndCoins(totalStars, Math.floor(totalStars / 2));
        const emoji = totalStars >= 80 ? '🏆' : totalStars >= 50 ? '🌟' : '💪';
        onFinish({
          stars: totalStars,
          coins: Math.floor(totalStars / 2),
          title: totalStars >= 80 ? 'Bậc Thầy Ngữ Pháp!' : 'Cố Lên Bé Ơi!',
          msg: `Bé đã hoàn thành ${TOTAL_ROUNDS} câu hỏi ngữ pháp! ${emoji}`,
          emoji,
        });
      } else {
        setRoundIdx(r => r + 1);
      }
    }, delay);
  }, [roundIdx, addStarsAndCoins, onFinish]);

  // ─── Timeout handler ─────────────────────────────────────────────────────
  const handleTimeout = () => {
    beep('error');
    setStreak(0);
    setFeedback('wrong');
    setLocked(true);
    advance(false, stars);
  };

  // ─── Correct / wrong logic ────────────────────────────────────────────────
  const handleCorrect = useCallback(() => {
    clearInterval(timerRef.current);
    beep('correct');
    speak('Correct!');
    const newStreak = streak + 1;
    const bonus = newStreak >= 3 ? 5 : 0;
    const earned = 10 + bonus;
    const newStars = stars + earned;
    setStreak(newStreak);
    setStars(newStars);
    setFeedback('correct');
    if (bonus > 0) showToast(`🔥 Streak x${newStreak}! +${bonus} sao thưởng!`, 'good');
    advance(true, newStars);
  }, [streak, stars, beep, speak, showToast, advance]);

  const handleWrong = useCallback(() => {
    clearInterval(timerRef.current);
    beep('error');
    setStreak(0);
    setFeedback('wrong');
    advance(false, stars);
  }, [stars, beep, advance]);

  // ─── Fill / Error: option click ───────────────────────────────────────────
  const handleOptionClick = (idx) => {
    if (locked) return;
    setSelected(idx);
    if (idx === currentQ.answer) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  // ─── Order: chip interactions ─────────────────────────────────────────────
  const handleBankChipClick = (chip) => {
    if (locked) return;
    setBank(b => b.filter(c => c.id !== chip.id));
    setAnswer(a => [...a, chip]);
  };

  const handleAnswerChipClick = (chip) => {
    if (locked) return;
    setAnswer(a => a.filter(c => c.id !== chip.id));
    setBank(b => [...b, chip]);
  };

  const handleCheckOrder = () => {
    if (locked || answer.length === 0) return;
    const assembled = answer.map(c => c.w).join(' ');
    if (assembled.toLowerCase() === currentQ.correctOrder.toLowerCase()) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  // ─── Timer bar width ──────────────────────────────────────────────────────
  const timerPct = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor = timerPct > 50 ? '#26d0a6' : timerPct > 25 ? '#ffd23f' : '#ff6b6b';

  // ─── Render helpers ───────────────────────────────────────────────────────
  const renderFeedbackBanner = () => {
    if (!feedback) return null;
    const isCorrect = feedback === 'correct';
    return (
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) scale(1)',
        zIndex: 200, textAlign: 'center', pointerEvents: 'none',
        animation: 'grammarFeedbackPop 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}>
        <div style={{
          background: isCorrect ? 'rgba(38,208,166,0.96)' : 'rgba(255,107,107,0.96)',
          borderRadius: '28px', padding: '20px 36px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          color: '#fff', fontWeight: 900, fontSize: '1.5rem',
        }}>
          {isCorrect ? '✅ Đúng rồi! 🎉' : '❌ Sai rồi!'}
          {!isCorrect && currentQ.type !== 'order' && (
            <div style={{ fontSize: '0.95rem', marginTop: '8px', fontWeight: 700 }}>
              Đáp án: <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 10px', borderRadius: '8px' }}>
                {currentQ.options[currentQ.answer]}
              </span>
            </div>
          )}
          {!isCorrect && currentQ.type === 'order' && (
            <div style={{ fontSize: '0.9rem', marginTop: '8px', fontWeight: 700 }}>
              Đáp án: <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 10px', borderRadius: '8px' }}>
                {currentQ.correctOrder}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFillQuestion = () => {
    const parts = currentQ.sentence.split('___');
    return (
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.5, textAlign: 'center', marginBottom: '24px' }}>
        {parts[0]}
        <span style={{
          background: '#ffd23f', color: '#2a2350', padding: '2px 12px',
          borderRadius: '10px', margin: '0 4px', display: 'inline-block',
          minWidth: '60px', textAlign: 'center'
        }}>___</span>
        {parts[1]}
      </div>
    );
  };

  const renderErrorQuestion = () => {
    const words = currentQ.sentence.split(' ');
    return (
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.7, textAlign: 'center', marginBottom: '24px' }}>
        {words.map((word, i) => {
          const clean = word.replace(/[.,!?]/, '');
          const isError = clean === currentQ.errorWord;
          return (
            <span key={i}>
              {isError ? (
                <span style={{
                  borderBottom: '3px solid #ff6b6b', color: '#d63031',
                  padding: '0 2px', marginRight: '4px'
                }}>{word}</span>
              ) : (
                <span style={{ marginRight: '4px' }}>{word}</span>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  const renderOptions = () => (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px', marginTop: '8px'
    }}>
      {currentQ.options.map((opt, i) => {
        let bg = 'linear-gradient(135deg, #f8f6ff, #eee8ff)';
        let border = '2px solid rgba(157,107,255,0.2)';
        let color = 'var(--ink)';
        if (feedback && i === currentQ.answer) {
          bg = 'linear-gradient(135deg, #26d0a6, #1f9c8a)';
          border = '2px solid #1a8a76';
          color = '#fff';
        } else if (feedback === 'wrong' && i === selected) {
          bg = 'linear-gradient(135deg, #ff6b6b, #d63031)';
          border = '2px solid #c0392b';
          color = '#fff';
        } else if (selected === i) {
          bg = 'linear-gradient(135deg, #9d6bff, #6a3fd6)';
          color = '#fff';
        }
        return (
          <button
            key={i}
            onClick={() => handleOptionClick(i)}
            disabled={locked}
            style={{
              background: bg, border, color,
              borderRadius: '18px', padding: '14px 10px',
              fontSize: '1rem', fontWeight: 800,
              boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
              cursor: locked ? 'default' : 'pointer',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <span style={{ opacity: 0.7, fontSize: '0.85rem' }}>
              {['🅐', '🅑', '🅒', '🅓'][i]}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );

  const renderOrderQuestion = () => (
    <div>
      {/* Answer slots */}
      <div style={{
        minHeight: '54px', border: '2px dashed rgba(157,107,255,0.4)',
        borderRadius: '16px', padding: '10px 12px', marginBottom: '14px',
        display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
        background: 'rgba(157,107,255,0.04)'
      }}>
        {answer.length === 0 && (
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', fontStyle: 'italic' }}>
            Nhấn từ bên dưới để sắp xếp câu...
          </span>
        )}
        {answer.map((chip) => (
          <button
            key={chip.id}
            onClick={() => handleAnswerChipClick(chip)}
            disabled={locked}
            style={{
              background: 'linear-gradient(135deg, #9d6bff, #6a3fd6)',
              color: '#fff', border: 'none', borderRadius: '12px',
              padding: '8px 14px', fontSize: '0.95rem', fontWeight: 800,
              cursor: locked ? 'default' : 'pointer',
              boxShadow: '0 3px 0 #5a2fc0',
            }}
          >
            {chip.w}
          </button>
        ))}
      </div>

      {/* Word bank */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px',
        justifyContent: 'center', marginBottom: '16px'
      }}>
        {bank.map((chip) => (
          <button
            key={chip.id}
            onClick={() => handleBankChipClick(chip)}
            disabled={locked}
            style={{
              background: 'linear-gradient(135deg, #f8f6ff, #eee8ff)',
              border: '2px solid rgba(157,107,255,0.3)',
              color: 'var(--ink)', borderRadius: '12px',
              padding: '8px 14px', fontSize: '0.95rem', fontWeight: 800,
              cursor: locked ? 'default' : 'pointer',
              boxShadow: '0 3px 0 rgba(0,0,0,0.08)',
            }}
          >
            {chip.w}
          </button>
        ))}
      </div>

      {/* Check button */}
      <button
        onClick={handleCheckOrder}
        disabled={locked || answer.length === 0}
        style={{
          width: '100%', padding: '14px',
          background: answer.length > 0 && !locked
            ? 'linear-gradient(135deg, #26d0a6, #1f9c8a)'
            : '#ddd',
          color: '#fff', border: 'none', borderRadius: '18px',
          fontSize: '1.05rem', fontWeight: 900,
          boxShadow: answer.length > 0 && !locked ? '0 5px 0 #1a8a76' : 'none',
          cursor: locked || answer.length === 0 ? 'default' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        ✔ Kiểm Tra
      </button>
    </div>
  );

  const typeLabel = {
    fill: '📝 Điền từ vào chỗ trống',
    order: '🔀 Sắp xếp từ thành câu',
    error: '🔍 Tìm và sửa lỗi sai',
  }[currentQ.type];

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      maxWidth: '480px', margin: '0 auto', padding: '0 0 40px',
    }}>
      <style>{`
        @keyframes grammarFeedbackPop {
          0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes grammarTimerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 16px 10px', position: 'sticky', top: 0,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
        zIndex: 10, borderBottom: '1.5px solid rgba(157,107,255,0.12)',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(157,107,255,0.12)', border: 'none',
            borderRadius: '12px', padding: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', color: 'var(--c-purple)',
          }}
        >
          <ArrowLeft size={20} />
        </button>

        {/* Progress */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ink-soft)' }}>
              Câu {roundIdx + 1}/{TOTAL_ROUNDS}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#ff9f43' }}>
              {streak >= 2 ? `🔥 x${streak}` : ''} ⭐ {stars}
            </span>
          </div>
          <div style={{ height: '8px', background: '#eee', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${((roundIdx) / TOTAL_ROUNDS) * 100}%`,
              background: 'linear-gradient(90deg, #9d6bff, #ff7eb3)',
              borderRadius: '8px', transition: 'width 0.4s',
            }} />
          </div>
        </div>
      </div>

      {/* ── Timer bar ── */}
      <div style={{ height: '6px', background: '#eee', position: 'relative' }}>
        <div style={{
          height: '100%',
          width: `${timerPct}%`,
          background: timerColor,
          transition: 'width 1s linear, background 0.5s',
          animation: timeLeft <= 5 ? 'grammarTimerPulse 0.6s infinite' : 'none',
        }} />
        <span style={{
          position: 'absolute', right: '10px', top: '-18px',
          fontSize: '0.78rem', fontWeight: 900,
          color: timeLeft <= 5 ? '#ff6b6b' : 'var(--ink-soft)',
        }}>
          ⏱ {timeLeft}s
        </span>
      </div>

      {/* ── Question card ── */}
      <div style={{ padding: '20px 16px 0', flex: 1 }}>
        {/* Type label */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(157,107,255,0.1)', borderRadius: '10px',
          padding: '4px 12px', fontSize: '0.78rem', fontWeight: 800,
          color: 'var(--c-purple)', marginBottom: '18px',
        }}>
          {typeLabel}
        </div>

        {/* Question text */}
        <div style={{
          background: '#fff', borderRadius: '24px', padding: '20px 18px',
          boxShadow: '0 4px 16px rgba(157,107,255,0.1)',
          border: '2px solid rgba(157,107,255,0.12)',
          marginBottom: '18px',
        }}>
          {currentQ.type === 'fill' && renderFillQuestion()}
          {currentQ.type === 'error' && renderErrorQuestion()}
          {currentQ.type === 'order' && (
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)', textAlign: 'center', marginBottom: '20px' }}>
              Sắp xếp các từ thành câu đúng:
            </div>
          )}

          {/* Options grid (fill & error) */}
          {(currentQ.type === 'fill' || currentQ.type === 'error') && renderOptions()}

          {/* Order chips */}
          {currentQ.type === 'order' && renderOrderQuestion()}
        </div>
      </div>

      {/* Feedback overlay */}
      {renderFeedbackBanner()}
    </div>
  );
}
