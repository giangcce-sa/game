import React, { useState } from 'react';
import { useGame, TOPICS, MERCHANDISE } from '../context/GameContext';
import { VIETNAM_CURRICULUM } from '../context/VietnamCurriculum';
import { Sparkles, Gift, Trophy, Store, Shield, Eye, BookOpen } from 'lucide-react';

export default function HomeScreen({ onSelectGame }) {
  const { 
    currentProfile, 
    setActiveScreen, 
    selectedTopic, 
    setSelectedTopic,
    claimDailyChest,
    speak,
    beep,
    customVocab,
    screenTimeRemaining,
    screenTimeLimit,
    
    // Level progress
    picLevel,
    memLevel,
    arcLevel,
    quizLevel,
    wriLevel,

    // SGK primary mode from context
    studyMode,
    setStudyMode,
    selectedGrade,
    selectedUnit,
    setSelectedUnit,
    completedUnits
  } = useGame();
  
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [dailyCoins, setDailyCoins] = useState(0);
  const [dailyStars, setDailyStars] = useState(0);

  if (!currentProfile) return null;

  const today = new Date().toDateString();
  const hasClaimedDaily = currentProfile.lastDailyClaim === today;

  const handleOpenDaily = () => {
    if (hasClaimedDaily) return;
    const coins = 20 + Math.floor(Math.random() * 41);
    const stars = 10 + Math.floor(Math.random() * 21);
    setDailyCoins(coins);
    setDailyStars(stars);
    setShowDailyModal(true);
  };

  const handleClaimDaily = () => {
    claimDailyChest(dailyStars, dailyCoins);
    setShowDailyModal(false);
  };

  const getRank = (stars) => {
    if (stars >= 500) return "👑 Đại pháp sư";
    if (stars >= 250) return "🦄 Hiệp sĩ rồng";
    if (stars >= 120) return "🚀 Phi hành gia";
    if (stars >= 50)  return "🌟 Thợ săn sao";
    return "🦉 Tân binh";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "Chào buổi sáng tốt lành";
    if (hour >= 11 && hour < 14) return "Bữa trưa vui vẻ nhé";
    if (hour >= 14 && hour < 18) return "Chào buổi chiều mát mẻ";
    return "Chúc bé tối vui vẻ";
  };

  const formatRemainingTime = (seconds) => {
    if (seconds === null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Find equipped companion pet
  const equippedPetItem = currentProfile.equippedPet 
    ? MERCHANDISE.pets.find(x => x.id === currentProfile.equippedPet) 
    : null;

  const handleMascotClick = () => {
    const speeches = [
      `Hello ${currentProfile.name}! Let's play games together!`,
      "Learning English is so much fun!",
      "Touch a game to start learning right now!",
      "You are doing an amazing job today!"
    ];
    speak(speeches[Math.floor(Math.random() * speeches.length)]);
    const mascot = document.getElementById("mascot-el");
    if (mascot) {
      mascot.style.transform = "scale(1.2) rotate(6deg)";
      setTimeout(() => mascot.style.transform = "", 200);
    }
  };

  const handleSelectGameCheck = (gameKey) => {
    if (studyMode === 'free' && selectedTopic === 'custom' && customVocab.length === 0) {
      alert("Chủ đề tự chọn của cha mẹ đang trống trơn! 📝\nBé hãy bảo bố mẹ vào mục 'Góc Phụ Huynh' ở góc dưới màn hình soạn từ vựng cho mình học nhé!");
      return;
    }
    onSelectGame(gameKey);
  };

  // Get Primary School Curriculum Units lists
  const gradeUnits = VIETNAM_CURRICULUM[selectedGrade] || [];
  const currentUnitObj = gradeUnits.find(u => u.unit === selectedUnit) || { name: 'Bài học', sentence: '' };
  
  const getGradeLabel = (gId) => {
    if (gId === 'grade1') return "Lớp 1 🏫";
    if (gId === 'grade2') return "Lớp 2 🏫";
    if (gId === 'grade3') return "Lớp 3 🏫";
    if (gId === 'grade4') return "Lớp 4 🏫";
    return "Lớp 5 🏫";
  };

  return (
    <div>
      {/* HUD Top Bar */}
      <div className="topbar">
        <div className="hud-profile" onClick={() => setActiveScreen('profiles')}>
          <span className="ava" style={{ fontSize: '1.7rem', lineHeight: 1 }}>{currentProfile.avatar}</span>
          <span className="name" style={{ fontWeight: 800, fontSize: '0.85rem' }}>{currentProfile.name}</span>
        </div>
        <div className="spacer"></div>
        {screenTimeLimit && (
          <div className="stat" style={{ color: 'var(--c-coral)', border: '2px solid var(--c-coral)', padding: '4px 10px' }} title="Thời gian xem mắt còn lại">
            <Eye size={14} style={{ marginRight: '2px', display: 'inline', verticalAlign: 'middle' }} />
            <span style={{ fontSize: '0.85rem' }}>{formatRemainingTime(screenTimeRemaining)}</span>
          </div>
        )}
        <div className="stat star" title="Sao tích lũy"><span className="ico">⭐</span><span>{currentProfile.stars}</span></div>
        <div className="stat coin" title="Đồng xu đổi quà"><span className="ico">🪙</span><span>{currentProfile.coins}</span></div>
        <div className="stat streak" title="Chuỗi ngày liên tục"><span className="ico">🔥</span><span>{currentProfile.streak}</span></div>
        <button className="btn-icon" onClick={() => setActiveScreen('store')} title="Cửa hàng"><Store size={20} /></button>
      </div>

      {/* Hero Mascot */}
      <div className="hero">
        <div 
          id="mascot-el" 
          className="mascot" 
          onClick={handleMascotClick}
          style={{ transition: 'transform 0.15s' }}
        >
          🦉
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800 }}>Vương Quốc Tiếng Anh</h1>
        <p style={{ fontWeight: 600, opacity: 0.95 }}>Học siêu vui, phần thưởng siêu lớn!</p>
      </div>

      {/* Daily Gift Button */}
      <button 
        className="btn-daily" 
        onClick={handleOpenDaily}
        style={{
          background: hasClaimedDaily ? '#ddd' : 'linear-gradient(135deg, #ff9f43, #ff5e36)',
          color: hasClaimedDaily ? '#888' : '#fff',
          boxShadow: hasClaimedDaily ? 'none' : '0 4px 10px rgba(255, 94, 54, 0.2)',
          cursor: hasClaimedDaily ? 'default' : 'pointer',
          animation: hasClaimedDaily ? 'none' : 'pulseDaily 2.2s infinite'
        }}
      >
        <Gift size={18} />
        {hasClaimedDaily ? "✅ Bé đã nhận Rương Quà hôm nay rồi" : "🎁 Nhận Rương Quà May Mắn Hôm Nay!"}
      </button>

      {/* Profile Info & Companion Pet */}
      <div className="greeting-card">
        <div className="ava-wrapper">
          <span className="ava" style={{ fontSize: '2.8rem', lineHeight: 1 }}>{currentProfile.avatar}</span>
          {equippedPetItem && (
            <span className="pet-float" style={{
              position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '1.25rem',
              background: '#fff', borderRadius: '50%', width: '24px', height: '24px',
              display: 'grid', placeItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
            }}>
              {equippedPetItem.e}
            </span>
          )}
        </div>
        <div className="details">
          <div className="txt">
            {getGreeting()}, <b style={{ color: 'var(--c-purple)' }}>{currentProfile.name}</b>!
            <small>Cùng chinh phục giáo trình học cực giỏi nhé!</small>
          </div>
          <div className="rank-badge" style={{ marginTop: '5px' }}>
            <Sparkles size={11} style={{ marginRight: '3px' }} />
            {getRank(currentProfile.stars)}
          </div>
        </div>
      </div>

      {/* MODE TABS: FREE PLAY OR SGK PROGRAM */}
      <div className="store-tabs" style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.06)', padding: '5px', borderRadius: '16px', marginBottom: '18px' }}>
        <button 
          className={`store-tab ${studyMode === 'free' ? 'active' : ''}`}
          onClick={() => setStudyMode('free')}
          style={{ fontSize: '0.9rem', padding: '10px 4px' }}
        >
          🌈 Chơi Tự Do
        </button>
        <button 
          className={`store-tab ${studyMode === 'school' ? 'active' : ''}`}
          onClick={() => setStudyMode('school')}
          style={{ fontSize: '0.9rem', padding: '10px 4px' }}
        >
          🏫 Học Theo Lớp (SGK)
        </button>
      </div>

      {/* RENDER MODE CONTENT */}
      {studyMode === 'school' ? (
        /* ==================== SCHOOL CURRICULUM MODE ==================== */
        <div className="topic-container" style={{ marginTop: 0, padding: '16px', background: '#fff', border: '3px solid var(--c-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--c-purple)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={16} /> Giáo trình {getGradeLabel(selectedGrade)}
            </h3>
            <button 
              onClick={() => setActiveScreen('parent')}
              style={{ fontSize: '0.78rem', background: 'rgba(0,0,0,0.04)', color: 'var(--ink-soft)', padding: '3px 8px', borderRadius: '8px', fontWeight: 700 }}
            >
              Đổi lớp ⚙️
            </button>
          </div>

          {/* Unit selection dots scrollbar */}
          <p style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ink-soft)', marginBottom: '8px' }}>Bé hãy chọn Unit (Bài học) để ôn tập:</p>
          <div className="chips-scroll" style={{ paddingBottom: '10px', gap: '10px' }}>
            {gradeUnits.map(u => {
              const isCurrent = selectedUnit === u.unit;
              const isDone = completedUnits.includes(`${selectedGrade}_u${u.unit}`);
              return (
                <button
                  key={u.unit}
                  onClick={() => setSelectedUnit(u.unit)}
                  className={`chip ${isCurrent ? 'on' : ''}`}
                  style={{
                    minWidth: '50px', height: '50px', borderRadius: '50%', padding: 0, display: 'grid',
                    placeItems: 'center', fontSize: '1.05rem', fontWeight: 800, position: 'relative',
                    background: isCurrent ? 'var(--c-purple)' : '#fdfaf2',
                    boxShadow: isCurrent ? '0 3px 0 #7a4fd6' : '0 3px 0 rgba(0,0,0,0.05)',
                    border: isDone ? '2px solid var(--c-grass)' : '2px dashed #9d6bff'
                  }}
                >
                  {isDone && (
                    <span style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '0.75rem', background: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'grid', placeItems: 'center' }}>
                      🏆
                    </span>
                  )}
                  {u.unit}
                </button>
              );
            })}
          </div>

          {/* Active Unit details banner */}
          <div style={{ background: 'rgba(157, 107, 255, 0.06)', border: '2px solid rgba(157, 107, 255, 0.15)', padding: '12px 14px', borderRadius: '18px', margin: '8px 0 16px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)' }}>
              {currentUnitObj.e} Unit {selectedUnit}: {currentUnitObj.name}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-soft)', marginTop: '2px' }}>
              💡 Mẫu câu giao tiếp: <b style={{ color: 'var(--c-purple)' }}>{currentUnitObj.sentence || "Bé hãy ghép các chữ cái nhé."}</b>
            </div>
          </div>

          {/* SGK Games grids */}
          <div className="game-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#ff9f43,#ff6b6b)', minHeight: '120px' }} onClick={() => handleSelectGameCheck('picture')}>
              <span className="gc-emoji">🖼️</span>
              <div>
                <div className="gc-title" style={{ fontSize: '1.05rem' }}>Đoán Từ Unit</div>
                <div className="gc-sub" style={{ fontSize: '0.72rem' }}>Học từ mới bài {selectedUnit}</div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#5ec8f8,#3a7bd5)', minHeight: '120px' }} onClick={() => handleSelectGameCheck('memory')}>
              <span className="gc-emoji">🃏</span>
              <div>
                <div className="gc-title" style={{ fontSize: '1.05rem' }}>Lật Thẻ Trí Nhớ</div>
                <div className="gc-sub" style={{ fontSize: '0.72rem' }}>Ghép bài học {selectedUnit}</div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#26d0a6,#1f9c8a)', minHeight: '120px' }} onClick={() => handleSelectGameCheck('arcade')}>
              <span className="gc-emoji">🎈</span>
              <div>
                <div className="gc-title" style={{ fontSize: '1.05rem' }}>Bắn Bóng Từ</div>
                <div className="gc-sub" style={{ fontSize: '0.72rem' }}>Bắt chữ bài {selectedUnit}</div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#ff7675,#d63031)', minHeight: '120px' }} onClick={() => handleSelectGameCheck('writing')}>
              <span className="gc-emoji">✏️</span>
              <div>
                <div className="gc-title" style={{ fontSize: '1.05rem' }}>Tập Viết Từ</div>
                <div className="gc-sub" style={{ fontSize: '0.72rem' }}>Gõ chính tả bài {selectedUnit}</div>
              </div>
            </button>
            
            {/* Game 5: Dynamic sentence maker for Grammar */}
            {currentUnitObj.sentence && (
              <button 
                className="game-card" 
                style={{ background: 'linear-gradient(150deg,#9d6bff,#6a3fd6)', minHeight: '120px', gridColumn: 'span 2' }} 
                onClick={() => handleSelectGameCheck('sentence')}
              >
                <span className="gc-emoji">🚂</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div>
                    <div className="gc-title" style={{ fontSize: '1.15rem' }}>Ghép Câu Giao Tiếp 🚂</div>
                    <div className="gc-sub" style={{ fontSize: '0.78rem' }}>Luyện viết ngữ pháp bài {selectedUnit}</div>
                  </div>
                  <span style={{ fontSize: '1.8rem' }}>▶</span>
                </div>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ==================== STANDARD FREE PLAY MODE ==================== */
        <div>
          <div className="game-grid">
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#ff9f43,#ff6b6b)' }} onClick={() => handleSelectGameCheck('picture')}>
              <span className="gc-emoji">🖼️</span>
              <div>
                <div className="gc-title">Đoán Từ</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    ⭐ Cấp {picLevel}
                  </span>
                </div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#5ec8f8,#3a7bd5)' }} onClick={() => handleSelectGameCheck('arcade')}>
              <span className="gc-emoji">🎈</span>
              <div>
                <div className="gc-title">Bắt Bóng</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    ⭐ Cấp {arcLevel}
                  </span>
                </div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#26d0a6,#1f9c8a)' }} onClick={() => handleSelectGameCheck('memory')}>
              <span className="gc-emoji">🃏</span>
              <div>
                <div className="gc-title">Lật Thẻ</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    ⭐ Cấp {memLevel}
                  </span>
                </div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#9d6bff,#6a3fd6)' }} onClick={() => handleSelectGameCheck('quiz')}>
              <span className="gc-emoji">🎯</span>
              <div>
                <div className="gc-title">Thử Tài</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    ⭐ Cấp {quizLevel}
                  </span>
                </div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#ff7675,#d63031)' }} onClick={() => handleSelectGameCheck('writing')}>
              <span className="gc-emoji">✏️</span>
              <div>
                <div className="gc-title">Tập Viết</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    ⭐ Cấp {wriLevel || 1}
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div className="topic-container">
            <h3>
              <span>📚 Chủ Đề Từ Vựng</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                {16 + (customVocab.length > 0 ? 1 : 0)} chủ đề
              </span>
            </h3>
            <div className="chips-scroll">
              {TOPICS.map(topic => {
                if (topic.id === 'custom' && customVocab.length === 0) return null;
                return (
                  <button 
                    key={topic.id}
                    className={`chip ${selectedTopic === topic.id ? 'on' : ''}`}
                    onClick={() => setSelectedTopic(topic.id)}
                  >
                    {topic.e} {topic.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Storybook Entrance banner */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button 
          onClick={() => {
            beep('sine');
            setActiveScreen('stories');
          }}
          style={{
            background: 'linear-gradient(135deg, var(--c-purple), var(--c-pink))',
            color: '#fff', padding: '12px 24px',
            borderRadius: '20px', fontWeight: 900, fontSize: '1.05rem', display: 'inline-flex',
            alignItems: 'center', gap: '8px', border: 'none',
            boxShadow: '0 5px 0 #7a4fd6, 0 4px 10px rgba(157, 107, 255, 0.3)',
            cursor: 'pointer', transition: 'all 0.15s',
            animation: 'pulseDaily 2s infinite'
          }}
        >
          📖 Góc Đọc Truyện Song Ngữ Tương Tác ✨
        </button>
      </div>

      {/* Parent Hub Secure entrance */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button 
          onClick={() => setActiveScreen('parent')}
          style={{
            background: 'rgba(0,0,0,0.06)', color: 'var(--ink-soft)', padding: '10px 18px',
            borderRadius: '16px', fontWeight: 800, fontSize: '0.85rem', display: 'inline-flex',
            alignItems: 'center', gap: '6px'
          }}
        >
          <Shield size={14} />
          Góc Phụ Huynh 🦉 (Cài đặt & Từ vựng)
        </button>
      </div>

      {/* Daily Chest Modal */}
      {showDailyModal && (
        <div className="overlay show" onClick={(e) => e.target.className.includes('overlay') && setShowDailyModal(false)}>
          <div className="modal">
            <div className="big">🎁</div>
            <h2>Rương Quà Hôm Nay</h2>
            <p>Bé học vui mỗi ngày nhé!</p>
            <div className="reward-row">
              <div className="r" style={{ color: '#ffa502' }}>🪙 +{dailyCoins} Xu</div>
              <div className="r" style={{ color: '#e8a200' }}>⭐ +{dailyStars} Sao</div>
            </div>
            <button className="btn-big" onClick={handleClaimDaily}>Nhận Quà Thôi! 🎉</button>
          </div>
        </div>
      )}
    </div>
  );
}
