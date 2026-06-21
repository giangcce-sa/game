import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import CuOwl from '../components/CuOwl';

/* ── Placement test questions ─────────────────────────────────────────── */
// Pool of placement questions grouped by CEFR level. Each test draws a random
// subset (2 A1 + 2 A2 + 1 B1) and shuffles option order, so retaking it varies.
const QUESTION_POOL = [
  // ── A1 ──────────────────────────────────────────────
  { level: 'A1', emoji: '🍎', question: 'What is this?', options: ['apple', 'orange', 'banana', 'grape'], correctIdx: 0 },
  { level: 'A1', emoji: '🐱', question: 'What is this?', options: ['cat', 'dog', 'bird', 'fish'], correctIdx: 0 },
  { level: 'A1', emoji: '🐶', question: 'What is this?', options: ['dog', 'cow', 'duck', 'frog'], correctIdx: 0 },
  { level: 'A1', emoji: '☀️', question: 'What is this?', options: ['sun', 'moon', 'star', 'cloud'], correctIdx: 0 },
  { level: 'A1', emoji: '🍌', question: 'What is this?', options: ['banana', 'apple', 'lemon', 'pear'], correctIdx: 0 },
  { level: 'A1', emoji: '🚗', question: 'What is this?', options: ['car', 'bus', 'bike', 'train'], correctIdx: 0 },
  { level: 'A1', emoji: '🏠', question: 'What is this?', options: ['house', 'school', 'shop', 'park'], correctIdx: 0 },
  { level: 'A1', emoji: '🔵', question: 'What color is this?', options: ['blue', 'red', 'green', 'yellow'], correctIdx: 0 },

  // ── A2 ──────────────────────────────────────────────
  { level: 'A2', emoji: '🏫', question: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'went'], correctIdx: 1 },
  { level: 'A2', emoji: '🌡️', question: "The opposite of 'hot' is ___", options: ['cold', 'warm', 'cool', 'freezing'], correctIdx: 0 },
  { level: 'A2', emoji: '🐦', question: 'There ___ two birds in the tree.', options: ['is', 'are', 'be', 'am'], correctIdx: 1 },
  { level: 'A2', emoji: '🍽️', question: 'I usually ___ breakfast at 7.', options: ['have', 'has', 'having', 'had'], correctIdx: 0 },
  { level: 'A2', emoji: '📏', question: "The opposite of 'big' is ___", options: ['small', 'tall', 'long', 'wide'], correctIdx: 0 },
  { level: 'A2', emoji: '🕐', question: 'What time ___ it?', options: ['is', 'are', 'do', 'does'], correctIdx: 0 },
  { level: 'A2', emoji: '🐕', question: 'This is my dog. ___ name is Rex.', options: ['Its', "It's", 'His', 'Her'], correctIdx: 0 },
  { level: 'A2', emoji: '🌧️', question: "The opposite of 'wet' is ___", options: ['dry', 'cold', 'soft', 'clean'], correctIdx: 0 },

  // ── B1 ──────────────────────────────────────────────
  { level: 'B1', emoji: '📚', question: 'If I ___ you, I would study harder.', options: ['am', 'was', 'were', 'be'], correctIdx: 2 },
  { level: 'B1', emoji: '✈️', question: 'I ___ to Japan twice.', options: ['have been', 'has been', 'am being', 'was'], correctIdx: 0 },
  { level: 'B1', emoji: '🎬', question: 'The film ___ by millions of people.', options: ['was watched', 'watched', 'is watching', 'watch'], correctIdx: 0 },
  { level: 'B1', emoji: '⏳', question: 'She has lived here ___ 2010.', options: ['since', 'for', 'from', 'at'], correctIdx: 0 },
  { level: 'B1', emoji: '🤔', question: 'He asked me where I ___.', options: ['lived', 'live', 'living', 'do live'], correctIdx: 0 },
  { level: 'B1', emoji: '☔', question: "If it rains, we ___ stay home.", options: ['will', 'would', 'are', 'did'], correctIdx: 0 },
];

// Pick n random items from a list
function pickRandom(arr, n) {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
}

// Shuffle a question's options and recompute the correct index
function shuffleOptions(q) {
  const correctWord = q.options[q.correctIdx];
  const opts = [...q.options].sort(() => 0.5 - Math.random());
  return { ...q, options: opts, correctIdx: opts.indexOf(correctWord) };
}

// Build a fresh 5-question test: 2 A1 + 2 A2 + 1 B1, options shuffled.
// Distribution kept so scoreToLevel (>=5 B1, >=3 A2, else A1) stays valid.
function buildQuiz() {
  const a1 = QUESTION_POOL.filter(q => q.level === 'A1');
  const a2 = QUESTION_POOL.filter(q => q.level === 'A2');
  const b1 = QUESTION_POOL.filter(q => q.level === 'B1');
  return [...pickRandom(a1, 2), ...pickRandom(a2, 2), ...pickRandom(b1, 1)].map(shuffleOptions);
}

/* ── CEFR level config ────────────────────────────────────────────────── */
const CEFR_CONFIG = {
  A1: {
    label: 'A1 - Người mới bắt đầu',
    desc: 'Bé đang ở giai đoạn khởi đầu! Chúng ta sẽ học những từ và câu đơn giản nhất cùng nhau nhé. 🌱',
    emoji: '🐣',
    color: 'var(--c-grass)',
  },
  A2: {
    label: 'A2 - Sơ cấp',
    desc: 'Bé đã biết một số tiếng Anh cơ bản rồi! Hãy tiếp tục khám phá nhiều chủ đề thú vị hơn nhé. 🌟',
    emoji: '🐥',
    color: 'var(--c-sky)',
  },
  B1: {
    label: 'B1 - Trung cấp',
    desc: 'Wow, bé thật giỏi! Chúng ta sẽ cùng nhau chinh phục những câu phức tạp và chủ đề nâng cao! 🚀',
    emoji: '🦅',
    color: 'var(--c-purple)',
  },
};

/* ── Helper: score → CEFR ─────────────────────────────────────────────── */
const scoreToLevel = (score) => {
  if (score >= 5) return 'B1';
  if (score >= 3) return 'A2';
  return 'A1';
};

/* ── Inline styles (self-contained, no extra CSS classes needed) ─────── */
const S = {
  screen: {
    position: 'fixed',
    inset: 0,
    zIndex: 200,
    background: 'var(--bg-gradient)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px 32px',
    overflowY: 'auto',
  },
  inner: {
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
  },
  /* Progress dots */
  dotsRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 28,
  },
  dot: (active) => ({
    width: active ? 28 : 12,
    height: 12,
    borderRadius: 8,
    background: active ? '#fff' : 'rgba(255,255,255,0.4)',
    transition: 'all 0.3s ease',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
  }),
  /* Card wrapper */
  card: {
    background: 'var(--card)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px 22px 24px',
    boxShadow: 'var(--shadow-pop)',
    textAlign: 'center',
    width: '100%',
    animation: 'screenIn 0.35s cubic-bezier(.2,.9,.3,1.2)',
  },
  owlBig: {
    fontSize: 'clamp(80px, 20vw, 110px)',
    lineHeight: 1,
    display: 'inline-block',
    animation: 'bob 2.6s ease-in-out infinite',
    filter: 'drop-shadow(0 10px 8px rgba(0,0,0,.15))',
    marginBottom: 12,
  },
  h1: {
    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
    fontWeight: 800,
    color: 'var(--ink)',
    marginBottom: 6,
  },
  subText: {
    fontWeight: 700,
    color: 'var(--ink-soft)',
    fontSize: '1rem',
    marginBottom: 20,
  },
  nameChip: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, var(--c-purple), var(--c-pink))',
    color: '#fff',
    fontWeight: 800,
    fontSize: '1.1rem',
    padding: '4px 16px',
    borderRadius: 16,
    marginBottom: 24,
  },
  /* Placement test */
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  progressTrack: {
    flex: 1,
    height: 10,
    background: 'rgba(0,0,0,0.07)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    height: '100%',
    width: `${pct}%`,
    background: 'linear-gradient(90deg, var(--c-purple), var(--c-pink))',
    borderRadius: 10,
    transition: 'width 0.4s ease',
  }),
  progressLabel: {
    fontWeight: 800,
    fontSize: '0.85rem',
    color: 'var(--ink-soft)',
    minWidth: 44,
    textAlign: 'right',
  },
  questionEmoji: {
    fontSize: 'clamp(72px, 22vw, 110px)',
    lineHeight: 1,
    display: 'inline-block',
    animation: 'popIn 0.35s cubic-bezier(.2,.9,.3,1.4)',
    filter: 'drop-shadow(0 10px 8px rgba(0,0,0,.12))',
    marginBottom: 10,
  },
  questionText: {
    fontWeight: 800,
    fontSize: '1.1rem',
    color: 'var(--ink)',
    marginBottom: 16,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  opt: (state) => {
    const base = {
      background: 'var(--paper)',
      borderRadius: 18,
      padding: '14px 8px',
      fontSize: '1.1rem',
      fontWeight: 800,
      color: 'var(--ink)',
      boxShadow: '0 4px 0 rgba(0,0,0,.08)',
      border: '2px solid transparent',
      transition: 'all 0.15s',
      cursor: 'pointer',
      textTransform: 'capitalize',
    };
    if (state === 'correct') {
      return { ...base, background: 'var(--c-grass)', color: '#fff', boxShadow: '0 4px 0 #4fa84e', animation: 'rightShake 0.35s' };
    }
    if (state === 'wrong') {
      return { ...base, background: 'var(--c-coral)', color: '#fff', boxShadow: '0 4px 0 #d64a4a', animation: 'wrongShake 0.35s' };
    }
    if (state === 'dim') {
      return { ...base, opacity: 0.4 };
    }
    return base;
  },
  /* Result step */
  resultEmoji: {
    fontSize: 'clamp(72px, 20vw, 100px)',
    lineHeight: 1,
    display: 'inline-block',
    animation: 'bob 2.2s ease-in-out infinite',
    filter: 'drop-shadow(0 10px 8px rgba(0,0,0,.15))',
    marginBottom: 12,
  },
  cefrBadge: (color) => ({
    display: 'inline-block',
    background: color,
    color: '#fff',
    fontWeight: 800,
    fontSize: '1rem',
    padding: '6px 20px',
    borderRadius: 20,
    marginBottom: 10,
    boxShadow: '0 4px 0 rgba(0,0,0,0.12)',
  }),
  resultDesc: {
    fontWeight: 600,
    color: 'var(--ink-soft)',
    fontSize: '0.95rem',
    lineHeight: 1.5,
    marginBottom: 22,
    padding: '0 4px',
  },
  scoreRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  scorePill: {
    background: 'var(--paper)',
    borderRadius: 14,
    padding: '8px 18px',
    fontWeight: 800,
    fontSize: '1rem',
    boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.05)',
  },
  stars: {
    display: 'flex',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 18,
    fontSize: '1.6rem',
  },
};

/* ── Component ────────────────────────────────────────────────────────── */
export default function OnboardingScreen() {
  const { currentProfile, setActiveScreen, showToast, speak, updateProfileFields, beep } = useGame();

  // step: 'welcome' | 'tour' | 'test' | 'result'
  const [step, setStep] = useState('welcome');
  const [tourIdx, setTourIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [quiz, setQuiz] = useState(() => buildQuiz());
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [locked, setLocked] = useState(false);
  const [visible, setVisible] = useState(true);
  const [cuExpr, setCuExpr] = useState('happy');

  // Speak welcome message on mount
  useEffect(() => {
    if (step === 'welcome' && currentProfile?.name) {
      setTimeout(() => speak(`Hi ${currentProfile.name}! I'm Cú, your English friend!`), 600);
    }
  }, [step, currentProfile?.name]);

  // Quick feature tour content
  const TOUR_STEPS = [
    { expr: 'happy',     icon: '🎮', title: 'Hơn 10 mini-game',     desc: 'Đoán hình, lật thẻ, đua bóng bay, viết, ngữ pháp, nghe... Mỗi game cho sao và xu!' },
    { expr: 'thinking',  icon: '🦉', title: 'Chat với Cú AI',        desc: 'Nói chuyện tiếng Anh, Cú sửa lỗi grammar và chỉ bé từng âm khó.' },
    { expr: 'happy',     icon: '🐾', title: 'Nuôi thú cưng',         desc: 'Mua pet, cho ăn, pet tiến hóa → x2 xu mỗi lần thắng game!' },
    { expr: 'listening', icon: '🔥', title: 'Streak hằng ngày',      desc: 'Học mỗi ngày → cây streak lớn dần, được khiên 🛡️ và phần thưởng to.' },
  ];

  const currentQ = quiz[qIdx];

  /* Speak current word on question change */
  useEffect(() => {
    if (step === 'test' && currentQ) {
      const word = currentQ.options[currentQ.correctIdx];
      setTimeout(() => speak(word), 400);
    }
  }, [step, qIdx]);

  /* Fade helper */
  const fadeTransition = (cb) => {
    setVisible(false);
    setTimeout(() => {
      cb();
      setVisible(true);
    }, 220);
  };

  const handleStart = () => {
    beep('magic');
    fadeTransition(() => { setStep('tour'); setTourIdx(0); setCuExpr('happy'); });
  };

  const handleTourNext = () => {
    beep('pop');
    if (tourIdx >= TOUR_STEPS.length - 1) {
      fadeTransition(() => { setStep('test'); setCuExpr('thinking'); });
    } else {
      fadeTransition(() => {
        const next = tourIdx + 1;
        setTourIdx(next);
        setCuExpr(TOUR_STEPS[next].expr);
      });
    }
  };

  const handleOption = (optIdx) => {
    if (locked) return;
    setLocked(true);
    setSelectedOpt(optIdx);

    const isCorrect = optIdx === currentQ.correctIdx;
    if (isCorrect) {
      speak(currentQ.options[optIdx]);
      setScore((s) => s + 1);
    }

    setTimeout(() => {
      const nextIdx = qIdx + 1;
      if (nextIdx >= quiz.length) {
        // move to result
        fadeTransition(() => {
          setStep('result');
          setSelectedOpt(null);
          setLocked(false);
        });
      } else {
        fadeTransition(() => {
          setQIdx(nextIdx);
          setSelectedOpt(null);
          setLocked(false);
        });
      }
    }, 900);
  };

  const finalScore = step === 'result' ? score : score; // already accumulated
  const level = scoreToLevel(finalScore);
  const cefrInfo = CEFR_CONFIG[level];

  const handleFinish = () => {
    if (currentProfile && updateProfileFields) {
      updateProfileFields(currentProfile.id, { onboardingDone: true, cefrLevel: level });
    }
    showToast(`Chào mừng! Trình độ: ${level} 🎉`, 'good');
    setActiveScreen('home');
  };

  /* Dot indices: 0 = welcome, 1 = tour, 2 = test, 3 = result */
  const stepIndex = step === 'welcome' ? 0 : step === 'tour' ? 1 : step === 'test' ? 2 : 3;

  /* Option visual state */
  const getOptState = (idx) => {
    if (selectedOpt === null) return 'default';
    if (idx === currentQ.correctIdx) return 'correct';
    if (idx === selectedOpt) return 'wrong';
    return 'dim';
  };

  return (
    <div style={S.screen}>
      <div style={S.inner}>
        {/* Progress dots */}
        <div style={S.dotsRow}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={S.dot(i <= stepIndex)} />
          ))}
        </div>

        {/* Card with fade */}
        <div
          style={{
            ...S.card,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
          }}
        >
          {/* ── STEP 1: WELCOME ─────────────────────────────────────── */}
          {step === 'welcome' && (
            <>
              <div style={{ display: 'inline-block', animation: 'bob 2.2s ease-in-out infinite', filter: 'drop-shadow(0 10px 8px rgba(0,0,0,.15))', marginBottom: 8 }}>
                <CuOwl expression="happy" size={130} />
              </div>
              <h1 style={S.h1}>Chào mừng đến với<br />Anh Cú!</h1>
              <p style={S.subText}>Xin chào bạn nhỏ</p>
              {currentProfile && (
                <div style={S.nameChip}>{currentProfile.avatar} {currentProfile.name}</div>
              )}
              <p style={{ ...S.subText, marginBottom: 24, fontSize: '0.92rem' }}>
                Cú là người bạn đồng hành sẽ giúp bé học tiếng Anh thật vui! Cùng khám phá vương quốc nào 🌈
              </p>
              <button className="btn-big" style={{ fontSize: '1.15rem' }} onClick={handleStart}>
                Khám phá ngay! 🚀
              </button>
            </>
          )}

          {/* ── STEP 1.5: TOUR (feature highlights) ──────────────────── */}
          {step === 'tour' && (() => {
            const t = TOUR_STEPS[tourIdx];
            return (
              <>
                <div style={{ display: 'inline-block', filter: 'drop-shadow(0 10px 8px rgba(0,0,0,.15))', marginBottom: 4 }}>
                  <CuOwl expression={cuExpr} size={110} />
                </div>
                <div style={{ fontSize: '3rem', marginBottom: 4, animation: 'popIn 0.4s cubic-bezier(.2,.9,.3,1.4)' }}>{t.icon}</div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--c-purple)', marginBottom: 8 }}>
                  {t.title}
                </h2>
                <p style={{ ...S.subText, marginBottom: 18, fontSize: '0.95rem', lineHeight: 1.55 }}>
                  {t.desc}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
                  {TOUR_STEPS.map((_, i) => (
                    <div key={i} style={{
                      width: i === tourIdx ? 22 : 8, height: 8, borderRadius: 4,
                      background: i === tourIdx ? 'var(--c-purple)' : 'rgba(0,0,0,0.15)',
                      transition: 'all 0.25s',
                    }} />
                  ))}
                </div>
                <button className="btn-big" onClick={handleTourNext}>
                  {tourIdx >= TOUR_STEPS.length - 1 ? 'Làm bài kiểm tra nhỏ 📝' : 'Tiếp tục →'}
                </button>
              </>
            );
          })()}

          {/* ── STEP 2: PLACEMENT TEST ──────────────────────────────── */}
          {step === 'test' && (
            <>
              {/* Progress bar */}
              <div style={S.progressRow}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
                  Câu {qIdx + 1}/{quiz.length}
                </span>
                <div style={S.progressTrack}>
                  <div style={S.progressFill(((qIdx) / quiz.length) * 100)} />
                </div>
                <span style={S.progressLabel}>{score} ⭐</span>
              </div>

              {/* Emoji */}
              <div
                key={`emoji-${qIdx}`}
                style={S.questionEmoji}
                onClick={() => speak(currentQ.options[currentQ.correctIdx])}
              >
                {currentQ.emoji}
              </div>

              {/* Question text */}
              <p style={S.questionText}>{currentQ.question}</p>

              {/* 2×2 option grid */}
              <div style={S.optionsGrid}>
                {currentQ.options.map((opt, idx) => (
                  <button
                    key={idx}
                    style={S.opt(getOptState(idx))}
                    onClick={() => handleOption(idx)}
                    disabled={locked}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Level badge */}
              <p style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--ink-soft)', fontWeight: 700 }}>
                Mức độ: {currentQ.level}
              </p>
            </>
          )}

          {/* ── STEP 3: RESULT ──────────────────────────────────────── */}
          {step === 'result' && (
            <>
              <div style={{ display: 'inline-block', animation: 'bob 2.2s ease-in-out infinite', filter: 'drop-shadow(0 10px 8px rgba(0,0,0,.15))', marginBottom: 4 }}>
                <CuOwl expression="happy" size={110} />
              </div>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{cefrInfo.emoji}</div>

              <h2 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: 10, color: 'var(--ink)' }}>
                Bé thật xuất sắc! 🎉
              </h2>

              {/* Stars earned */}
              <div style={S.stars}>
                {quiz.map((_, i) => (
                  <span key={i}>{i < finalScore ? '⭐' : '☆'}</span>
                ))}
              </div>

              {/* Score pill */}
              <div style={S.scoreRow}>
                <div style={S.scorePill}>✅ {finalScore}/{quiz.length} đúng</div>
              </div>

              {/* CEFR badge */}
              <div style={S.cefrBadge(cefrInfo.color)}>
                Trình độ: {cefrInfo.label}
              </div>

              {/* Description */}
              <p style={S.resultDesc}>{cefrInfo.desc}</p>

              <button className="btn-big" onClick={handleFinish}>
                Vào học thôi! 🚀
              </button>
              <button
                className="btn-ghost"
                style={{ marginTop: 10 }}
                onClick={() => {
                  fadeTransition(() => {
                    setQuiz(buildQuiz());
                    setStep('test');
                    setQIdx(0);
                    setScore(0);
                    setSelectedOpt(null);
                    setLocked(false);
                  });
                }}
              >
                Làm lại bài kiểm tra
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
