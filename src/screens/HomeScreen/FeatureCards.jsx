import React from 'react';
import { useGame } from '../../context/GameContext';

export default function FeatureCards() {
  const { beep, setActiveScreen, currentProfile, getDueSrsWords } = useGame();

  const seedCount = (currentProfile?.failedSeeds || []).length;
  const { due, newWords } = getDueSrsWords ? getDueSrsWords(10) : { due: [], newWords: [] };
  const reviewCount = due.length + newWords.length;

  return (
    <>
      {/* Speech Studio + Pet Room */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '18px' }}>
        <button
          onClick={() => { beep('sine'); setActiveScreen('speech_studio'); }}
          className="game-card"
          style={{
            background: 'linear-gradient(135deg, #a55eea, #4b7bec)',
            minHeight: '120px', margin: 0, width: '100%', textAlign: 'left',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '16px 14px', borderRadius: '24px', border: 'none',
            boxShadow: '0 6px 0 #3867d6, 0 4px 10px rgba(75,123,236,0.3)', cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🎙️</span>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff' }}>Phòng Luyện Nói 🌟</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginTop: '2px', lineHeight: '1.3' }}>
              Ghi âm giọng nói &amp; chấm điểm cùng Cú!
            </div>
          </div>
        </button>

        <button
          onClick={() => { beep('sine'); setActiveScreen('pet_room'); }}
          className="game-card"
          style={{
            background: 'linear-gradient(135deg, #ff7675, #fd9644)',
            minHeight: '120px', margin: 0, width: '100%', textAlign: 'left',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '16px 14px', borderRadius: '24px', border: 'none',
            boxShadow: '0 6px 0 #fa8231, 0 4px 10px rgba(253,150,68,0.3)', cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🦁</span>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff' }}>Vườn Thú Cưng 🍎</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginTop: '2px', lineHeight: '1.3' }}>
              Cho ăn tăng Cấp, nhận chúc phúc nhân đôi Xu!
            </div>
          </div>
        </button>
      </div>

      {/* Flashcard Review + Minimal Pairs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '18px' }}>
        <button
          onClick={() => { beep('sine'); setActiveScreen('flashcard'); }}
          className="game-card"
          style={{
            background: 'linear-gradient(135deg, #f7971e, #ffd200)',
            minHeight: '120px', margin: 0, width: '100%', textAlign: 'left',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '16px 14px', borderRadius: '24px', border: 'none',
            boxShadow: '0 6px 0 #e0a800, 0 4px 10px rgba(255,210,0,0.3)',
            cursor: 'pointer', position: 'relative', overflow: 'hidden'
          }}
        >
          <span style={{ fontSize: '2.2rem', marginBottom: '8px' }}>📚</span>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff' }}>Ôn Tập Hôm Nay</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)', marginTop: '2px', lineHeight: '1.3' }}>
              Flashcard thông minh, lịch ôn Anki
            </div>
          </div>
          {reviewCount > 0 && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px',
              background: '#ff6b6b', color: '#fff',
              fontSize: '0.72rem', fontWeight: 900,
              padding: '3px 8px', borderRadius: '10px', minWidth: '22px', textAlign: 'center'
            }}>
              {reviewCount}
            </div>
          )}
        </button>

        <button
          onClick={() => { beep('sine'); setActiveScreen('minimal_pairs'); }}
          className="game-card"
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            minHeight: '120px', margin: 0, width: '100%', textAlign: 'left',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '16px 14px', borderRadius: '24px', border: 'none',
            boxShadow: '0 6px 0 #5a3d8a, 0 4px 10px rgba(118,75,162,0.3)', cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🎧</span>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff' }}>Cặp Âm Tương Tự</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginTop: '2px', lineHeight: '1.3' }}>
              ship/sheep, rice/lice — luyện tai phân biệt
            </div>
          </div>
        </button>
      </div>

      {/* Greenhouse + Split VS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '18px' }}>
        <button
          onClick={() => { beep('sine'); setActiveScreen('greenhouse'); }}
          className="game-card"
          style={{
            background: 'linear-gradient(135deg, #11998e, #38ef7d)',
            minHeight: '130px', margin: 0, width: '100%', textAlign: 'left',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '16px 14px', borderRadius: '24px', border: 'none',
            boxShadow: '0 6px 0 #0d7a6e, 0 4px 12px rgba(56,239,125,0.3)',
            cursor: 'pointer', position: 'relative', overflow: 'hidden'
          }}
        >
          <span style={{ fontSize: '2.4rem', marginBottom: '6px', display: 'block' }}>🌱</span>
          <div>
            <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#fff' }}>Vườn Ươm Tri Thức</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)', marginTop: '2px', lineHeight: '1.3' }}>
              Ôn từ sai, thu hoạch Quả Ngọt 🧺
            </div>
          </div>
          {seedCount > 0 && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px',
              background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)',
              color: '#fff', fontSize: '0.72rem', fontWeight: 900,
              padding: '3px 8px', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.4)'
            }}>
              🌱 {seedCount} hạt
            </div>
          )}
        </button>

        <button
          onClick={() => { beep('sine'); setActiveScreen('split_vs'); }}
          className="game-card"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b, #7c3aed)',
            minHeight: '130px', margin: 0, width: '100%', textAlign: 'left',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '16px 14px', borderRadius: '24px', border: 'none',
            boxShadow: '0 6px 0 #5b21b6, 0 4px 12px rgba(124,58,237,0.35)', cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '2.4rem', marginBottom: '6px', display: 'block' }}>⚔️</span>
          <div>
            <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#fff' }}>Đấu Trường Song Hùng</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)', marginTop: '2px', lineHeight: '1.3' }}>
              2 người đối kháng, màn hình lật ngược ⚡
            </div>
          </div>
        </button>
      </div>

      {/* Garden mode — full width */}
      <div style={{ marginBottom: '18px' }}>
        <button
          onClick={() => { beep('sine'); setActiveScreen('garden'); }}
          className="game-card"
          style={{
            background: 'linear-gradient(135deg, #16a34a, #84cc16)',
            minHeight: '110px', margin: 0, width: '100%', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '16px 18px', borderRadius: '24px', border: 'none',
            boxShadow: '0 6px 0 #15803d, 0 4px 12px rgba(132,204,22,0.3)', cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '3rem' }}>🌱🪴</span>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>Trồng Cây Kiếm Xu</div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginTop: '2px', lineHeight: '1.35' }}>
              Mua hạt, trồng cây, học từ vựng & bán lấy xu 🪙
            </div>
          </div>
        </button>
      </div>

      {/* Chat AI + Story Generator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '18px' }}>
        <button
          onClick={() => { beep('sine'); setActiveScreen('conversation'); }}
          className="game-card"
          style={{
            background: 'linear-gradient(135deg, #0984e3, #74b9ff)',
            minHeight: '120px', margin: 0, width: '100%', textAlign: 'left',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '16px 14px', borderRadius: '24px', border: 'none',
            boxShadow: '0 6px 0 #0767b5, 0 4px 10px rgba(9,132,227,0.3)', cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '2.2rem', marginBottom: '8px' }}>💬</span>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff' }}>Chat AI</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)', marginTop: '2px', lineHeight: '1.3' }}>
              Luyện hội thoại tiếng Anh với AI
            </div>
          </div>
        </button>

        <button
          onClick={() => { beep('sine'); setActiveScreen('story_generator'); }}
          className="game-card"
          style={{
            background: 'linear-gradient(135deg, #e84393, #fd79a8)',
            minHeight: '120px', margin: 0, width: '100%', textAlign: 'left',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '16px 14px', borderRadius: '24px', border: 'none',
            boxShadow: '0 6px 0 #c2185b, 0 4px 10px rgba(232,67,147,0.3)', cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '2.2rem', marginBottom: '8px' }}>✨</span>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff' }}>Tạo Truyện AI</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)', marginTop: '2px', lineHeight: '1.3' }}>
              AI sáng tác truyện từ từ vựng bé chọn
            </div>
          </div>
        </button>
      </div>
    </>
  );
}
