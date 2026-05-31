import React, { useState, useEffect, useRef } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import ProfilesScreen from './screens/ProfilesScreen';
import HomeScreen from './screens/HomeScreen';
import StoreScreen from './screens/StoreScreen';
import ParentHub from './screens/ParentHub';
import StoryScreen from './screens/StoryScreen'; // NEW! Góc đọc truyện tương tác

// Importing interactive games
import GamePicture from './games/GamePicture';
import GameMemory from './games/GameMemory';
import GameArcade from './games/GameArcade';
import GameQuiz from './games/GameQuiz';
import GameSentence from './games/GameSentence'; // New sentence puzzle game!
import GameWriting from './games/GameWriting'; // NEW! Tập viết chính tả game

import { VIETNAM_CURRICULUM } from './context/VietnamCurriculum';
import { Shield } from 'lucide-react';

function AppContent() {
  const { 
    activeScreen, 
    setActiveScreen, 
    toastMessage, 
    toastKind, 
    beep,
    isTimeOut,
    resetTimer,
    changeTimeLimit,
    
    // Primary school curriculum details
    studyMode,
    selectedGrade,
    selectedUnit,
    completeUnit
  } = useGame();

  const [activeGame, setActiveGame] = useState(null); // 'picture' | 'memory' | 'arcade' | 'quiz' | 'sentence'
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState({ emoji: '🎉', title: '', msg: '', stars: 0, coins: 0 });
  const [bgDecoList, setBgDecoList] = useState([]);
  
  // Parental eye-lock verification states
  const [numA] = useState(Math.floor(5 + Math.random() * 5));
  const [numB] = useState(Math.floor(5 + Math.random() * 5));
  const [parentCode, setParentCode] = useState('');

  // Setup background floating bubbles
  useEffect(() => {
    const bubbles = [];
    const emojis = ["⭐", "🌈", "☁️", "🎈", "✨", "🍎", "🐱", "🚀", "🌟", "🎨", "🦖", "🦄", "🦊"];
    for (let i = 0; i < 12; i++) {
      bubbles.push({
        id: i,
        char: emojis[Math.floor(Math.random() * emojis.length)],
        left: `${Math.random() * 90}%`,
        top: `${Math.random() * 85}%`,
        dur: `${7 + Math.random() * 7}s`,
        delay: `${Math.random() * 4}s`
      });
    }
    setBgDecoList(bubbles);
  }, []);

  const handleSelectGame = (gameId) => {
    setActiveGame(gameId);
    setActiveScreen('game');
  };

  const handleGameFinish = (result) => {
    setResultData(result);
    setShowResultModal(true);
    beep('win');
    triggerConfetti();

    // If baby plays in SGK School Mode and passes successfully, mark current Unit as completed!
    if (studyMode === 'school' && result.stars >= 40) {
      completeUnit();
    }
  };

  const handleReplayGame = () => {
    setShowResultModal(false);
    const current = activeGame;
    setActiveGame(null);
    setTimeout(() => setActiveGame(current), 50);
  };

  const handleGoHome = () => {
    setShowResultModal(false);
    setActiveGame(null);
    setActiveScreen('home');
  };

  const handleUnlockTimer = (e) => {
    e.preventDefault();
    if (parseInt(parentCode) === numA * numB) {
      changeTimeLimit(10);
      setParentCode('');
    } else {
      alert("Kết quả chưa chính xác rồi phụ huynh ơi! 🧩");
      setParentCode('');
    }
  };

  // Standard Canvas Confetti implementation
  const confettiCanvasRef = useRef(null);
  const triggerConfetti = () => {
    const cvs = confettiCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    
    let parts = [];
    const colors = ["#ff6b6b","#ffd23f","#76d275","#5ec8f8","#9d6bff","#ff7eb3"];
    
    for(let i = 0; i < 130; i++) {
      parts.push({
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -14 - 4,
        g: 0.35 + Math.random() * 0.2,
        s: 6 + Math.random() * 8,
        c: colors[Math.floor(Math.random() * colors.length)],
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4,
        life: 0
      });
    }

    let animId;
    const step = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      parts.forEach(p => {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        p.life++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s * 0.6);
        ctx.restore();
      });
      parts = parts.filter(p => p.y < cvs.height + 40 && p.life < 260);
      if (parts.length > 0) {
        animId = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, cvs.width, cvs.height);
      }
    };
    step();
  };

  // Find curriculum data for active grade
  const activeGradeUnits = VIETNAM_CURRICULUM[selectedGrade] || [];

  return (
    <div id="app">
      {/* Dynamic Background Decorations */}
      <div className="bg-deco" aria-hidden="true">
        {bgDecoList.map(b => (
          <span 
            key={b.id} 
            style={{ 
              left: b.left, 
              top: b.top, 
              animationDuration: b.dur, 
              animationDelay: b.delay 
            }}
          >
            {b.char}
          </span>
        ))}
      </div>

      {/* Confetti overlay layer */}
      <canvas ref={confettiCanvasRef} style={{ position: 'fixed', inset: 0, zIndex: 95, pointerEvents: 'none' }}></canvas>

      {/* Floating Popup Toast notifications */}
      {toastMessage && (
        <div className={`toast show ${toastKind}`}>
          {toastMessage}
        </div>
      )}

      {/* SCREEN ROUTING */}
      {activeScreen === 'profiles' && <ProfilesScreen />}
      {activeScreen === 'home' && <HomeScreen onSelectGame={handleSelectGame} />}
      {activeScreen === 'store' && <StoreScreen />}
      {activeScreen === 'parent' && <ParentHub />}
      {activeScreen === 'stories' && <StoryScreen />}
      
      {/* Game Screens */}
      {activeScreen === 'game' && (
        <div>
          {activeGame === 'picture' && (
            <GamePicture 
              onFinish={handleGameFinish} 
              onBack={handleGoHome} 
            />
          )}
          {activeGame === 'memory' && (
            <GameMemory 
              onFinish={handleGameFinish} 
              onBack={handleGoHome} 
            />
          )}
          {activeGame === 'arcade' && (
            <GameArcade 
              onFinish={handleGameFinish} 
              onBack={handleGoHome} 
            />
          )}
          {activeGame === 'quiz' && (
            <GameQuiz 
              onFinish={handleGameFinish} 
              onBack={handleGoHome} 
            />
          )}
          {activeGame === 'sentence' && (
            <GameSentence 
              onFinish={handleGameFinish} 
              onBack={handleGoHome} 
              curriculumData={activeGradeUnits}
            />
          )}
          {activeGame === 'writing' && (
            <GameWriting 
              onFinish={handleGameFinish} 
              onBack={handleGoHome} 
            />
          )}
        </div>
      )}

      {/* Game End Success/Result Popup Modal */}
      {showResultModal && (
        <div className="overlay show">
          <div className="modal">
            <div className="big">{resultData.emoji}</div>
            <h2>{resultData.title}</h2>
            <p>{resultData.msg}</p>
            <div className="reward-row">
              <div className="r" style={{ color: '#ffa502' }}>🪙 +{resultData.coins} Xu</div>
              <div className="r" style={{ color: '#e8a200' }}>⭐ +{resultData.stars} Sao</div>
            </div>
            <button className="btn-big" onClick={handleReplayGame}>Chơi Tiếp ▶</button>
            <button className="btn-ghost" onClick={handleGoHome}>🏠 Về Trang Chủ</button>
          </div>
        </div>
      )}

      {/* EYE PROTECTION FULLSCREEN LOCK SYSTEM */}
      {isTimeOut && (
        <div className="overlay show" style={{ zIndex: 200, background: 'rgba(26,20,54,0.96)', backdropFilter: 'blur(10px)' }}>
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="big" style={{ animation: 'bob 2.6s ease-in-out infinite' }}>🦉</div>
            <h2 style={{ color: 'var(--c-coral)', fontSize: '1.6rem', fontWeight: 800 }}>Đã Hết Giờ Học Rồi Bé Ơi!</h2>
            <p style={{ fontWeight: 600, color: 'var(--ink-soft)', margin: '10px 0 16px', fontSize: '0.92rem', lineHeight: '1.4' }}>
              Bé học rất tốt ngày hôm nay! 🌟 <br />
              Đã đến lúc đôi mắt cần nghỉ ngơi rồi. Bé hãy đứng dậy, vươn vai uống nước và nhìn ra cửa sổ 1 phút nhé!
            </p>
            
            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '14px', borderRadius: '18px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                <Shield size={14} color="var(--c-purple)" /> Mở khóa cho Phụ huynh:
              </h4>
              <form onSubmit={handleUnlockTimer} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--c-purple)', whiteSpace: 'nowrap' }}>
                  {numA} x {numB} =
                </span>
                <input 
                  type="number"
                  className="input-fancy"
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                  placeholder="Kết quả..."
                  style={{ height: '40px', padding: '6px', fontSize: '0.98rem' }}
                />
                <button type="submit" className="btn-big" style={{ height: '40px', padding: '0 14px', width: 'auto', marginTop: 0, whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                  Thêm 10p
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
