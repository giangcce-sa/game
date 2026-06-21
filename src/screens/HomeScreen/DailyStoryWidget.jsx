import React, { useState, useRef } from 'react';
import { useGame } from '../../context/GameContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

const TOPICS = [
  'animals', 'school', 'food', 'family', 'travel',
  'magic adventure', 'space', 'ocean', 'forest', 'sports',
];

function gradeForCefr(level) {
  return level === 'A1' ? 'grade1-2' : level === 'A2' ? 'grade2-3' : level === 'B1' ? 'grade4-5' : 'grade5+';
}

export default function DailyStoryWidget({ onOpen }) {
  const { currentProfile, speak, saveDailyStory, showToast } = useGame();
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  if (!currentProfile) return null;

  const today = new Date().toDateString();
  const ds = currentProfile.dailyStory;
  const hasToday = ds && ds.date === today && ds.story;
  const completed = hasToday && ds.completed;

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      const res = await fetch(`${API_BASE}/api/story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          gradeLevel: gradeForCefr(currentProfile.cefrLevel || 'A1'),
          vocab: [],
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('failed');
      const story = await res.json();
      if (!story?.title || !Array.isArray(story.paragraphs)) throw new Error('bad_format');
      saveDailyStory(story);
      showToast('📖 Truyện hôm nay đã sẵn sàng!', 'good');
      onOpen?.();
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Không tạo được truyện. Thử lại sau nhé.', 'bad');
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  // Visual states
  const bgGradient = completed
    ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
    : hasToday
    ? 'linear-gradient(135deg, #ffeaa7, #fab1a0)'
    : 'linear-gradient(135deg, #a7c5ff, #9d6bff)';

  const titleColor = completed ? '#065f46' : hasToday ? '#7c2d12' : '#fff';

  return (
    <div style={{
      background: bgGradient,
      borderRadius: 18, padding: '14px 16px',
      margin: '10px 0', position: 'relative', overflow: 'hidden',
      boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
    }}>
      {/* Decorative book emoji */}
      <div style={{ position: 'absolute', right: 10, top: 6, fontSize: '4rem', opacity: 0.18, pointerEvents: 'none' }}>
        {completed ? '✅' : '📖'}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: titleColor, opacity: 0.85, letterSpacing: '0.5px' }}>
          📅 HÔM NAY
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: titleColor, marginTop: 2 }}>
          {completed
            ? 'Đã đọc xong truyện hôm nay! 🎉'
            : hasToday
            ? ds.story.title
            : 'Câu chuyện hôm nay đang chờ bé'}
        </div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: titleColor, opacity: 0.75, marginTop: 4 }}>
          {completed
            ? 'Quay lại ngày mai để có truyện mới nhé!'
            : hasToday
            ? `${ds.story.paragraphs.length} trang • Trình độ ${currentProfile.cefrLevel || 'A1'}`
            : `Tự động tạo theo trình độ ${currentProfile.cefrLevel || 'A1'} • Thưởng 30⭐ +15🪙`}
        </div>

        {!completed && (
          <button
            onClick={hasToday ? onOpen : handleGenerate}
            disabled={loading}
            style={{
              marginTop: 10, padding: '8px 18px',
              background: hasToday ? '#7c2d12' : 'rgba(255,255,255,0.95)',
              color: hasToday ? '#fff' : '#4c1d95',
              border: 'none', borderRadius: 14,
              fontWeight: 900, fontSize: '0.88rem', cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 3px 8px rgba(0,0,0,0.18)',
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font)',
            }}
          >
            {loading ? '⏳ Đang tạo truyện...' : hasToday ? '📖 Đọc tiếp →' : '✨ Tạo truyện hôm nay'}
            {hasToday && !completed && (
              <span style={{
                background: '#ef4444', color: '#fff', borderRadius: 10,
                padding: '1px 7px', fontSize: '0.65rem', fontWeight: 900,
                animation: 'pulseDaily 1.5s ease-in-out infinite',
              }}>MỚI</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
