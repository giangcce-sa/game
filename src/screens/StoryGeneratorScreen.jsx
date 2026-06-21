import React, { useState, useMemo, useCallback } from 'react';
import { useGame } from '../context/GameContext';

/* ── Constants ─────────────────────────────────────────────── */

const ALL_VOCAB = [
  "happy","sad","big","small","run","jump","eat","sleep",
  "friend","school","book","tree","water","sun","moon","star",
  "house","dog","cat","bird","fish","flower","red","blue","green"
];

const TOPICS = [
  { label: "🦁 Động vật",      value: "animals" },
  { label: "🚀 Vũ trụ",        value: "space" },
  { label: "🌊 Đại dương",     value: "ocean" },
  { label: "🏫 Trường học",    value: "school" },
  { label: "🧙 Phép thuật",   value: "magic" },
  { label: "🦸 Siêu anh hùng", value: "superhero" },
];

const GRADES = [
  { label: "Lớp 1-2", value: "grade1-2" },
  { label: "Lớp 3-4", value: "grade3-4" },
  { label: "Lớp 5-6", value: "grade5-6" },
];

const MAX_VOCAB = 5;
const OPTION_LABELS = ["A", "B", "C", "D"];

/* ── Helpers ───────────────────────────────────────────────── */

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/** Wrap vocab words inside paragraph text with <mark> spans */
function highlightVocab(text, vocabWords, onClickWord) {
  if (!vocabWords || vocabWords.length === 0) return text;
  // Sort longest first to avoid partial overlaps
  const sorted = [...vocabWords].sort((a, b) => b.length - a.length);
  const regex = new RegExp(
    `\\b(${sorted.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  );

  const parts = [];
  let lastIndex = 0;
  let match;
  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const word = match[0];
    parts.push(
      <mark
        key={match.index}
        style={{
          background: 'linear-gradient(135deg, var(--c-yellow,#ffd23f), var(--c-coral,#ff6b6b))',
          color: '#2a2350',
          borderRadius: 6,
          padding: '1px 5px',
          cursor: 'pointer',
          fontWeight: 700,
          userSelect: 'none',
        }}
        onClick={() => onClickWord(word.toLowerCase())}
        title={`Nghe: "${word.toLowerCase()}"`}
      >
        {word}
      </mark>
    );
    lastIndex = match.index + word.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

/* ── LoadingOwl sub-component ──────────────────────────────── */

function LoadingOwl() {
  return (
    <div style={styles.loadingWrap}>
      <div style={styles.owlContainer}>
        <span style={styles.owlEmoji}>🦉</span>
        <span style={styles.sparkle1}>✨</span>
        <span style={styles.sparkle2}>⭐</span>
        <span style={styles.sparkle3}>💫</span>
      </div>
      <p style={styles.loadingText}>Cú đang sáng tác truyện...</p>
      <div style={styles.dots}>
        <span style={{ ...styles.dot, animationDelay: '0s' }} />
        <span style={{ ...styles.dot, animationDelay: '0.25s' }} />
        <span style={{ ...styles.dot, animationDelay: '0.5s' }} />
      </div>
    </div>
  );
}

/* ── QuestionCard sub-component ────────────────────────────── */

function QuestionCard({ question, paraIndex, answers, onAnswer }) {
  const ans = answers[paraIndex];
  const answered = ans !== undefined;

  return (
    <div style={styles.questionCard}>
      <p style={styles.questionText}>❓ {question.q}</p>
      <div style={styles.optionsGrid}>
        {question.options.map((opt, i) => {
          const isCorrect = i === question.answer;
          const isChosen = ans === i;
          let bg = 'var(--card,#fff)';
          let border = '2.5px solid #e0d6ff';
          let color = 'var(--ink,#2a2350)';

          if (answered) {
            if (isCorrect) {
              bg = '#d4f8d4';
              border = '2.5px solid #4caf50';
              color = '#1b5e20';
            } else if (isChosen) {
              bg = '#ffd6d6';
              border = '2.5px solid var(--c-coral,#ff6b6b)';
              color = '#7f0000';
            }
          }

          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => onAnswer(paraIndex, i)}
              style={{
                ...styles.optionBtn,
                background: bg,
                border,
                color,
                opacity: answered && !isCorrect && !isChosen ? 0.55 : 1,
              }}
            >
              <span style={styles.optionLabel}>{OPTION_LABELS[i]}</span>
              {opt}
              {answered && isCorrect && <span style={{ marginLeft: 'auto' }}>✅</span>}
              {answered && isChosen && !isCorrect && <span style={{ marginLeft: 'auto' }}>❌</span>}
            </button>
          );
        })}
      </div>
      {answered && (
        <p style={{
          ...styles.feedbackText,
          color: ans === question.answer ? '#2e7d32' : 'var(--c-coral,#ff6b6b)',
        }}>
          {ans === question.answer
            ? '✅ Đúng rồi! Bạn thật giỏi!'
            : `💡 Đáp án đúng là: ${OPTION_LABELS[question.answer]}`}
        </p>
      )}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────── */

export default function StoryGeneratorScreen({ onBack }) {
  const { speak, showToast } = useGame();

  // Stage: 1 = setup, 2 = loading, 3 = story
  const [stage, setStage] = useState(1);
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('grade1-2');
  const [story, setStory] = useState(null);
  const [answers, setAnswers] = useState({}); // { paraIndex: chosenOptionIndex }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pick 12 random vocab words once per mount
  const displayedVocab = useMemo(() => pickRandom(ALL_VOCAB, 12), []);
  const [selectedVocab, setSelectedVocab] = useState([]);

  /* Vocab toggle */
  const toggleVocab = useCallback((word) => {
    setSelectedVocab(prev => {
      if (prev.includes(word)) return prev.filter(w => w !== word);
      if (prev.length >= MAX_VOCAB) {
        showToast(`Chọn tối đa ${MAX_VOCAB} từ thôi nhé! 😊`, 'bad');
        return prev;
      }
      return [...prev, word];
    });
  }, [showToast]);

  /* Answer handler */
  const handleAnswer = useCallback((paraIndex, optionIndex) => {
    setAnswers(prev => {
      if (prev[paraIndex] !== undefined) return prev; // already answered
      return { ...prev, [paraIndex]: optionIndex };
    });
    const para = story?.paragraphs?.[paraIndex];
    if (para && optionIndex === para.question.answer) {
      speak('Correct!');
    }
  }, [story, speak]);

  /* Score derived values */
  const totalQuestions = story?.paragraphs?.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const correctCount = story
    ? story.paragraphs.reduce((sum, para, i) =>
        answers[i] === para.question.answer ? sum + 1 : sum, 0)
    : 0;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  /* Generate story */
  const generateStory = useCallback(async () => {
    if (!topic || isLoading) return;
    setIsLoading(true);
    setError(null);
    setStage(2);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, vocab: selectedVocab, gradeLevel }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('invalid_json');
      }

      if (!data?.title || !Array.isArray(data?.paragraphs)) {
        throw new Error('invalid_json');
      }

      setStory(data);
      setAnswers({});
      setStage(3);
    } catch (err) {
      setError(err.message);
      setStage(1);
    } finally {
      setIsLoading(false);
    }
  }, [topic, selectedVocab, gradeLevel, isLoading]);

  /* Reset to stage 1 */
  const handleReset = () => {
    setStage(1);
    setStory(null);
    setAnswers({});
    setError(null);
    setTopic('');
    setSelectedVocab([]);
  };

  /* Save to library (toast only for now) */
  const handleSave = () => {
    showToast('📚 Đã lưu vào Thư viện của bé!', 'good');
  };

  /* Speak a highlighted vocab word */
  const handleWordClick = useCallback((word) => {
    speak(word);
  }, [speak]);

  /* ── Render ── */
  return (
    <div style={styles.screen}>
      {/* Global keyframe animations */}
      <style>{`
        @keyframes owlBob {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-14px) rotate(5deg); }
        }
        @keyframes sparkleOrbit1 {
          from { transform: rotate(0deg) translateX(48px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(48px) rotate(-360deg); }
        }
        @keyframes sparkleOrbit2 {
          from { transform: rotate(120deg) translateX(48px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(48px) rotate(-480deg); }
        }
        @keyframes sparkleOrbit3 {
          from { transform: rotate(240deg) translateX(48px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(48px) rotate(-600deg); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
          40%           { transform: scale(1.3); opacity: 1; }
        }
        @keyframes sgFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sg-fade { animation: sgFadeUp 0.35s ease both; }
        .sg-opt-btn:not(:disabled):hover {
          filter: brightness(0.95);
          transform: translateX(2px);
        }
        .sg-topic-chip:hover { filter: brightness(0.93); }
        .sg-vocab-chip:hover { filter: brightness(0.93); }
        .sg-gen-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(157,107,255,0.55);
        }
        .sg-gen-btn:not(:disabled):active { transform: translateY(0); }
      `}</style>

      {/* ── Header ── */}
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={onBack} aria-label="Quay lại">
          ← Quay lại
        </button>
        <h1 style={styles.headerTitle}>✨ Tạo Truyện với AI</h1>
        <div style={{ width: 90 }} />
      </header>

      <div style={styles.content}>

        {/* ─── Stage 1: Setup ─── */}
        {stage === 1 && (
          <div className="sg-fade">

            {/* Error banner */}
            {error && (
              <div style={styles.errorBanner}>
                <span>😢 Không thể tạo truyện. Kiểm tra kết nối mạng nhé!</span>
                <button style={styles.retryBtn} onClick={generateStory}>
                  🔄 Thử lại
                </button>
              </div>
            )}

            {/* Topic picker */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🎯 Chọn chủ đề</h2>
              <div style={styles.chipRow}>
                {TOPICS.map(t => (
                  <button
                    key={t.value}
                    className="sg-topic-chip"
                    style={{
                      ...styles.topicChip,
                      ...(topic === t.value ? styles.topicChipActive : {}),
                    }}
                    onClick={() => setTopic(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Vocab picker */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                📝 Chọn từ vựng{' '}
                <span style={styles.vocabCount}>({selectedVocab.length}/{MAX_VOCAB})</span>
              </h2>
              <div style={styles.chipRow}>
                {displayedVocab.map(word => {
                  const isSelected = selectedVocab.includes(word);
                  return (
                    <button
                      key={word}
                      className="sg-vocab-chip"
                      style={{
                        ...styles.vocabChip,
                        ...(isSelected ? styles.vocabChipActive : {}),
                      }}
                      onClick={() => toggleVocab(word)}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
              {selectedVocab.length > 0 && (
                <p style={styles.selectedVocabNote}>
                  Từ đã chọn: {selectedVocab.join(', ')}
                </p>
              )}
            </section>

            {/* Grade level */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🏫 Trình độ</h2>
              <div style={styles.gradeRow}>
                {GRADES.map(g => (
                  <button
                    key={g.value}
                    style={{
                      ...styles.gradeBtn,
                      ...(gradeLevel === g.value ? styles.gradeBtnActive : {}),
                    }}
                    onClick={() => setGradeLevel(g.value)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Generate button */}
            <button
              className="sg-gen-btn"
              style={{
                ...styles.generateBtn,
                ...((!topic || isLoading) ? styles.generateBtnDisabled : {}),
              }}
              onClick={generateStory}
              disabled={!topic || isLoading}
            >
              🎨 Tạo Truyện!
            </button>
          </div>
        )}

        {/* ─── Stage 2: Loading ─── */}
        {stage === 2 && <LoadingOwl />}

        {/* ─── Stage 3: Story display ─── */}
        {stage === 3 && story && (
          <div className="sg-fade">
            {/* Story title */}
            <h2 style={styles.storyTitle}>{story.title}</h2>

            {/* Paragraphs with questions */}
            {story.paragraphs.map((para, i) => (
              <div key={i} style={styles.paraBlock}>
                <p style={styles.paraText}>
                  {highlightVocab(para.text, selectedVocab, handleWordClick)}
                </p>
                {para.question && (
                  <QuestionCard
                    question={para.question}
                    paraIndex={i}
                    answers={answers}
                    onAnswer={handleAnswer}
                  />
                )}
              </div>
            ))}

            {/* Final score card (shown after all questions answered) */}
            {allAnswered && (
              <div style={styles.scoreCard} className="sg-fade">
                <p style={styles.scoreEmoji}>
                  {correctCount === totalQuestions ? '🏆' : correctCount >= totalQuestions / 2 ? '⭐' : '💪'}
                </p>
                <p style={styles.scoreText}>
                  Điểm số: <strong>{correctCount}/{totalQuestions}</strong>
                </p>
                <p style={styles.scoreSubtext}>
                  {correctCount === totalQuestions
                    ? 'Xuất sắc! Bé giỏi lắm!'
                    : correctCount >= totalQuestions / 2
                    ? 'Tốt lắm! Tiếp tục cố gắng nhé!'
                    : 'Cố lên! Luyện tập thêm nhé bé!'}
                </p>
                <div style={styles.scoreActions}>
                  <button style={styles.resetBtn} onClick={handleReset}>
                    🔄 Kể lại
                  </button>
                  <button style={styles.saveBtn} onClick={handleSave}>
                    💾 Lưu vào Thư viện
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Styles ────────────────────────────────────────────────── */

const styles = {
  screen: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-gradient)',
    fontFamily: 'var(--font)',
    color: 'var(--ink,#2a2350)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 10px',
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(10px)',
    borderBottom: '2px solid rgba(255,255,255,0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    background: 'rgba(255,255,255,0.75)',
    border: '2px solid rgba(157,107,255,0.3)',
    borderRadius: 20,
    padding: '7px 16px',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--c-purple,#9d6bff)',
    cursor: 'pointer',
    minWidth: 90,
  },
  headerTitle: {
    fontSize: 'clamp(15px, 4vw, 20px)',
    fontWeight: 800,
    color: '#fff',
    textShadow: '0 2px 8px rgba(60,40,120,0.35)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    maxWidth: 520,
    width: '100%',
    margin: '0 auto',
    padding: '16px 14px 36px',
    overflowY: 'auto',
  },

  /* ── Setup ── */
  section: {
    background: 'rgba(255,255,255,0.93)',
    borderRadius: 20,
    padding: '16px 16px 14px',
    marginBottom: 14,
    boxShadow: '0 6px 18px rgba(60,40,120,0.12)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 10,
    color: 'var(--c-purple,#9d6bff)',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    padding: '8px 14px',
    borderRadius: 50,
    border: '2.5px solid #e0d6ff',
    background: '#f5f0ff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.15s',
    color: 'var(--ink,#2a2350)',
  },
  topicChipActive: {
    background: 'var(--c-purple,#9d6bff)',
    borderColor: 'var(--c-purple,#9d6bff)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(157,107,255,0.45)',
    transform: 'scale(1.06)',
  },
  vocabChip: {
    padding: '6px 13px',
    borderRadius: 50,
    border: '2px solid #d1c4e9',
    background: '#fff',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.15s',
    color: 'var(--ink,#2a2350)',
  },
  vocabChipActive: {
    background: 'linear-gradient(135deg, var(--c-yellow,#ffd23f), var(--c-coral,#ff6b6b))',
    borderColor: 'var(--c-coral,#ff6b6b)',
    color: '#fff',
    fontWeight: 700,
    boxShadow: '0 3px 10px rgba(255,107,107,0.3)',
    transform: 'scale(1.07)',
  },
  vocabCount: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--c-coral,#ff6b6b)',
  },
  selectedVocabNote: {
    marginTop: 8,
    fontSize: 12,
    color: 'var(--ink-soft,#6b6391)',
    fontStyle: 'italic',
  },
  gradeRow: {
    display: 'flex',
    gap: 10,
  },
  gradeBtn: {
    flex: 1,
    padding: '10px 6px',
    borderRadius: 16,
    border: '2.5px solid #e0d6ff',
    background: '#f5f0ff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    color: 'var(--ink,#2a2350)',
    transition: 'all 0.15s',
    textAlign: 'center',
  },
  gradeBtnActive: {
    background: 'var(--c-purple,#9d6bff)',
    borderColor: 'var(--c-purple,#9d6bff)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(157,107,255,0.4)',
  },
  generateBtn: {
    display: 'block',
    width: '100%',
    padding: '16px',
    borderRadius: 24,
    border: 'none',
    background: 'linear-gradient(135deg, var(--c-purple,#9d6bff) 0%, var(--c-coral,#ff6b6b) 100%)',
    color: '#fff',
    fontSize: 20,
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(157,107,255,0.45)',
    marginTop: 6,
    transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
  },
  generateBtnDisabled: {
    opacity: 0.42,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },

  /* ── Error ── */
  errorBanner: {
    background: '#fff3f3',
    border: '2px solid var(--c-coral,#ff6b6b)',
    borderRadius: 16,
    padding: '12px 14px',
    marginBottom: 14,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: '#c0392b',
    textAlign: 'center',
  },
  retryBtn: {
    padding: '7px 20px',
    borderRadius: 20,
    border: 'none',
    background: 'var(--c-coral,#ff6b6b)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },

  /* ── Loading ── */
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 360,
    gap: 16,
  },
  owlContainer: {
    position: 'relative',
    width: 130,
    height: 130,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  owlEmoji: {
    fontSize: 68,
    display: 'block',
    animation: 'owlBob 1.4s ease-in-out infinite',
  },
  sparkle1: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    fontSize: 18,
    animation: 'sparkleOrbit1 1.8s linear infinite',
    transformOrigin: '0 0',
  },
  sparkle2: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    fontSize: 14,
    animation: 'sparkleOrbit2 1.8s linear infinite',
    transformOrigin: '0 0',
  },
  sparkle3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    fontSize: 16,
    animation: 'sparkleOrbit3 1.8s linear infinite',
    transformOrigin: '0 0',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    textShadow: '0 2px 8px rgba(60,40,120,0.3)',
  },
  dots: {
    display: 'flex',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#fff',
    display: 'inline-block',
    animation: 'dotBounce 1.2s ease-in-out infinite',
  },

  /* ── Story ── */
  storyTitle: {
    fontSize: 'clamp(18px, 5vw, 26px)',
    fontWeight: 900,
    textAlign: 'center',
    marginBottom: 18,
    background: 'linear-gradient(135deg, var(--c-purple,#9d6bff), var(--c-coral,#ff6b6b))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    padding: '4px 0',
    lineHeight: 1.3,
  },
  paraBlock: {
    background: 'rgba(255,255,255,0.93)',
    borderRadius: 20,
    padding: '16px',
    marginBottom: 16,
    boxShadow: '0 6px 18px rgba(60,40,120,0.11)',
  },
  paraText: {
    fontSize: 15,
    lineHeight: 1.8,
    marginBottom: 12,
    color: 'var(--ink,#2a2350)',
  },

  /* ── Question card ── */
  questionCard: {
    background: '#f5f0ff',
    borderRadius: 16,
    padding: '14px',
    border: '2px solid #e0d6ff',
  },
  questionText: {
    fontWeight: 700,
    fontSize: 14,
    marginBottom: 10,
    color: 'var(--c-purple,#9d6bff)',
  },
  optionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.18s, border 0.18s, transform 0.1s, filter 0.1s',
  },
  optionLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: 'var(--c-purple,#9d6bff)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
  },
  feedbackText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'center',
  },

  /* ── Score card ── */
  scoreCard: {
    background: 'rgba(255,255,255,0.96)',
    borderRadius: 24,
    padding: '24px 20px',
    marginTop: 8,
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(60,40,120,0.18)',
    border: '3px solid var(--c-purple,#9d6bff)',
  },
  scoreEmoji: {
    fontSize: 58,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--ink,#2a2350)',
    marginBottom: 4,
  },
  scoreSubtext: {
    fontSize: 15,
    color: 'var(--ink-soft,#6b6391)',
    marginBottom: 20,
    fontWeight: 600,
  },
  scoreActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  resetBtn: {
    padding: '12px 22px',
    borderRadius: 20,
    border: '2.5px solid var(--c-purple,#9d6bff)',
    background: '#fff',
    color: 'var(--c-purple,#9d6bff)',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '12px 22px',
    borderRadius: 20,
    border: 'none',
    background: 'linear-gradient(135deg, var(--c-purple,#9d6bff), var(--c-coral,#ff6b6b))',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(157,107,255,0.4)',
  },
};
