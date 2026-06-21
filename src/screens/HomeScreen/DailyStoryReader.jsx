import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';

export default function DailyStoryReader({ onClose }) {
  const { currentProfile, speak, markDailyStoryComplete } = useGame();
  const [pageIdx, setPageIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  if (!currentProfile?.dailyStory?.story) return null;
  const story = currentProfile.dailyStory.story;
  const page = story.paragraphs[pageIdx];
  const isLastPage = pageIdx >= story.paragraphs.length - 1;

  const handleAnswer = (idx) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    if (idx === page.question?.answer) {
      setCorrectCount(c => c + 1);
    }
  };

  const handleNext = () => {
    if (isLastPage) {
      markDailyStoryComplete();
      onClose();
      return;
    }
    setPageIdx(i => i + 1);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(10,8,30,0.75)', backdropFilter: 'blur(8px)',
      display: 'grid', placeItems: 'center', padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        maxWidth: 500, width: '100%',
        background: 'linear-gradient(160deg,#fff8e7 0%,#ffe7c4 100%)',
        borderRadius: 28, padding: '24px 20px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        maxHeight: '90vh', overflowY: 'auto',
        position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12,
          width: 32, height: 32, borderRadius: '50%', border: 'none',
          background: 'rgba(0,0,0,0.08)', cursor: 'pointer',
          fontSize: '1rem', fontWeight: 900, color: '#4c1d95',
        }}>✕</button>

        {/* Title */}
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#7c2d12', margin: '0 30px 4px 0', lineHeight: 1.2 }}>
          📖 {story.title}
        </h2>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', marginBottom: 16 }}>
          Trang {pageIdx + 1}/{story.paragraphs.length}
        </div>

        {/* Story paragraph */}
        <div style={{
          background: 'rgba(255,255,255,0.7)',
          borderRadius: 16, padding: '16px 14px',
          fontSize: '1rem', lineHeight: 1.7, fontWeight: 600, color: '#1e1b4b',
          marginBottom: 16,
          position: 'relative',
        }}>
          {page.text}
          <button
            onClick={() => speak(page.text)}
            style={{
              position: 'absolute', bottom: 6, right: 6,
              background: '#9d6bff', color: '#fff', border: 'none', borderRadius: 10,
              width: 32, height: 32, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 800,
            }}
            title="Nghe đọc"
          >
            🔊
          </button>
        </div>

        {/* Question */}
        {page.question && (
          <div style={{
            background: 'rgba(157,107,255,0.08)',
            border: '2px solid rgba(157,107,255,0.2)',
            borderRadius: 16, padding: '12px 14px',
          }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#4c1d95', marginBottom: 10 }}>
              ❓ {page.question.q}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {page.question.options.map((opt, i) => {
                const isCorrect = i === page.question.answer;
                const isSelected = i === selectedAnswer;
                let bg = '#fff', color = '#1e1b4b', border = '2px solid rgba(157,107,255,0.2)';
                if (answered) {
                  if (isCorrect)         { bg = '#86efac'; color = '#065f46'; border = '2px solid #16a34a'; }
                  else if (isSelected)   { bg = '#fca5a5'; color = '#7f1d1d'; border = '2px solid #dc2626'; }
                  else                   { bg = '#f3f4f6'; color = '#6b6391'; }
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={answered}
                    style={{
                      background: bg, color, border,
                      padding: '10px 14px', borderRadius: 12,
                      fontWeight: 800, fontSize: '0.88rem',
                      textAlign: 'left', cursor: answered ? 'default' : 'pointer',
                      fontFamily: 'var(--font)',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <span style={{ width: 22, height: 22, background: 'rgba(0,0,0,0.08)', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '0.78rem' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                    {answered && isCorrect && <span style={{ marginLeft: 'auto' }}>✅</span>}
                    {answered && isSelected && !isCorrect && <span style={{ marginLeft: 'auto' }}>❌</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action button */}
        {answered && (
          <button
            onClick={handleNext}
            style={{
              marginTop: 16, width: '100%', padding: '12px',
              background: 'linear-gradient(135deg,#7c2d12,#9d6bff)', color: '#fff',
              border: 'none', borderRadius: 14, fontWeight: 900, fontSize: '1rem',
              cursor: 'pointer', fontFamily: 'var(--font)',
              boxShadow: '0 4px 12px rgba(157,107,255,0.4)',
            }}
          >
            {isLastPage ? `🎉 Hoàn thành! (${correctCount + (selectedAnswer === page.question?.answer ? 0 : 0)}/${story.paragraphs.length} đúng)` : 'Tiếp tục →'}
          </button>
        )}
      </div>
    </div>
  );
}
